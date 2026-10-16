#!/usr/bin/env python3
"""Generate, convert, publish, and validate Bible Journey period intro narrations.

Intro text lives in src/data/journeyIntros.json (keyed by period ID). Paragraphs are separated by a
blank line ("\\n\\n"); the separator is never spoken, it only becomes a short pause.

Examples:
  python scripts/period_intro_narration.py --list
  python scripts/period_intro_narration.py --plan
  python scripts/period_intro_narration.py --voice am_michael
  python scripts/period_intro_narration.py --voice af_heart --period a-world-awakened
  python scripts/period_intro_narration.py --voice am_michael --upload-github --execute
  python scripts/period_intro_narration.py --voice am_michael --validate-remote --validate-only

Local files are written to narration/periods/<voice>/period-01-intro.wav and .mp3 (git-ignored, not in public/).
Uploads go to the existing GitHub release journey-narration-<voice> next to the story files.
Remote uploads are never performed without --execute and an interactive confirmation.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from period_narration import (  # noqa: E402
    GITHUB_REPOSITORY,
    GITHUB_TAG_PREFIX,
    RANGE_BYTES,
    ROOT,
    VOICES,
    audio_directory,
    ffmpeg_path,
    gh,
    has_playable_mp3_frames,
    load_periods,
    read_json,
    request_playable,
    selected_periods,
)

INTROS_PATH = ROOT / "src" / "data" / "journeyIntros.json"
PAUSE_SECONDS = 0.7
SAMPLE_RATE = 24000
CONFIRMATION = "UPLOAD INTRO NARRATIONS"


def intro_asset_name(period_index: int) -> str:
    return f"period-{period_index:02}-intro.mp3"


def paragraphs_of(text: str) -> list[str]:
    """Split on blank lines; collapse any remaining line breaks so nothing is read as markup."""
    parts = re.split(r"(?:\r?\n){2,}|(?:\\n){2,}", text)
    return [re.sub(r"\s+", " ", part.replace("\\n", " ")).strip() for part in parts if part.strip()]


def load_intros(periods: list[dict[str, Any]]) -> dict[str, list[str]]:
    data = read_json(INTROS_PATH)
    if not isinstance(data, dict):
        raise RuntimeError(f"{INTROS_PATH} must be an object keyed by period ID")
    intros: dict[str, list[str]] = {}
    for period in periods:
        text = data.get(period["id"])
        if not isinstance(text, str) or not text.strip():
            raise RuntimeError(f"No intro text for period {period['id']} in {INTROS_PATH}")
        intros[period["id"]] = paragraphs_of(text)
    return intros


def intro_jobs(all_periods: list[dict[str, Any]], chosen: list[dict[str, Any]]) -> list[tuple[dict[str, Any], int]]:
    chosen_ids = {period["id"] for period in chosen}
    return [(period, index) for index, period in enumerate(all_periods, start=1) if period["id"] in chosen_ids]


def generate(jobs, intros, voice: str, speed: float, overwrite: bool) -> None:
    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile") from exc

    pipeline = KPipeline(lang_code=voice[0])
    folder = audio_directory(voice)
    folder.mkdir(parents=True, exist_ok=True)
    pause = np.zeros(int(SAMPLE_RATE * PAUSE_SECONDS), dtype="float32")
    for period, index in jobs:
        destination = folder / intro_asset_name(index).replace(".mp3", ".wav")
        if destination.exists() and not overwrite:
            print(f"Skip existing {destination.relative_to(ROOT)} (use --overwrite to replace)")
            continue
        paragraphs = intros[period["id"]]
        print(f"Generating intro for {period['title']} with {voice} ({len(paragraphs)} paragraphs)...")
        chunks = []
        for number, paragraph in enumerate(paragraphs):
            if number:
                chunks.append(pause)
            pieces = [audio.numpy() for _, _, audio in pipeline(paragraph, voice=voice, speed=speed, split_pattern=r"\n+") if audio is not None]
            if not pieces:
                raise RuntimeError(f"Kokoro returned no audio for {period['title']} paragraph {number + 1}")
            chunks.extend(pieces)
        temporary = destination.with_name(destination.stem + ".tmp.wav")
        sf.write(temporary, np.concatenate(chunks), SAMPLE_RATE, subtype="PCM_16")
        temporary.replace(destination)
        print(f"  Saved {destination.relative_to(ROOT)}")


def convert(jobs, voice: str, overwrite: bool) -> None:
    ffmpeg = ffmpeg_path()
    folder = audio_directory(voice)
    converted = skipped = 0
    for _period, index in jobs:
        source = folder / intro_asset_name(index).replace(".mp3", ".wav")
        destination = source.with_suffix(".mp3")
        if not source.is_file():
            print(f"Skip missing WAV: {source.relative_to(ROOT)}")
            continue
        if destination.exists() and not overwrite:
            print(f"Skip existing {destination.relative_to(ROOT)}")
            skipped += 1
            continue
        temporary = destination.with_name(destination.stem + ".tmp.mp3")
        result = subprocess.run(
            [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-codec:a", "libmp3lame", "-q:a", "2", str(temporary)],
            capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
        )
        if result.returncode:
            temporary.unlink(missing_ok=True)
            raise RuntimeError(f"FFmpeg failed for {source.name}: {result.stderr.strip() or result.returncode}")
        temporary.replace(destination)
        converted += 1
        print(f"Converted {destination.relative_to(ROOT)}")
    print(f"Conversion complete: {converted} converted, {skipped} skipped.")


def local_validate(jobs, voice: str) -> int:
    folder = audio_directory(voice)
    failures = 0
    for _period, index in jobs:
        path = folder / intro_asset_name(index)
        try:
            if not path.is_file() or path.stat().st_size == 0:
                raise ValueError("file missing or empty")
            with path.open("rb") as stream:
                data = stream.read(RANGE_BYTES)
            if not has_playable_mp3_frames(data):
                raise ValueError("no consecutive MPEG audio frames in the first 256 KiB")
            print(f"OK   {path.relative_to(ROOT)} ({path.stat().st_size} bytes, MP3 frames found)")
        except (OSError, ValueError) as exc:
            failures += 1
            print(f"FAIL {path.relative_to(ROOT)}: {exc}", file=sys.stderr)
    return failures


def upload_github(jobs, voice: str, replace_existing: bool) -> None:
    folder = audio_directory(voice)
    files = [(index, folder / intro_asset_name(index)) for _period, index in jobs]
    missing = [str(path.relative_to(ROOT)) for _, path in files if not path.is_file()]
    if missing:
        raise RuntimeError("Convert intros before upload; missing: " + ", ".join(missing))
    tag = GITHUB_TAG_PREFIX + voice
    viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets", check=False)
    if viewed.returncode:
        message = (viewed.stderr or viewed.stdout).casefold()
        if "not found" not in message:
            raise RuntimeError(viewed.stderr.strip() or viewed.stdout.strip())
        gh("release", "create", tag, "--repo", GITHUB_REPOSITORY, "--title", f"Bible Journey story narrations ({voice})", "--notes", f"Story narrations generated with Kokoro voice {voice}.", "--draft")
        viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets")
    release = json.loads(viewed.stdout)
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in release.get("assets", [])}
    to_upload: list[Path] = []
    for index, path in files:
        name = intro_asset_name(index)
        old_size = assets.get(name)
        if old_size is None:
            to_upload.append(path)
        elif old_size == path.stat().st_size:
            print(f"Already on GitHub: {name}")
        elif replace_existing:
            to_upload.append(path)
        else:
            raise RuntimeError(f"GitHub asset {name} exists with a different size; use --replace-existing to replace it")
    if release.get("isImmutable") and to_upload:
        raise RuntimeError(f"Release {tag} is immutable; it cannot accept or replace assets")
    if to_upload:
        args = ["release", "upload", tag, *(str(path) for path in to_upload), "--repo", GITHUB_REPOSITORY]
        if replace_existing:
            args.append("--clobber")
        gh(*args)
    refreshed = json.loads(gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,assets").stdout)
    refreshed_assets = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    wrong = [intro_asset_name(index) for index, path in files if refreshed_assets.get(intro_asset_name(index)) != path.stat().st_size]
    if wrong:
        raise RuntimeError("GitHub release verification failed for: " + ", ".join(wrong))
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", GITHUB_REPOSITORY)
    print(f"GitHub upload verified: {len(files)} intro file(s) in release {tag}.")


def remote_validate(jobs, voice: str) -> int:
    tag = GITHUB_TAG_PREFIX + voice
    failures = 0
    for period, index in jobs:
        url = f"https://github.com/{GITHUB_REPOSITORY}/releases/download/{tag}/{urllib.parse.quote(intro_asset_name(index), safe='-')}"
        ok, detail = request_playable(url)
        print(f"{'OK  ' if ok else 'FAIL'} GitHub: {period['title']} intro / {voice}: {detail}")
        failures += 0 if ok else 1
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list periods and intro asset names")
    parser.add_argument("--voice", choices=sorted(VOICES), default="am_michael", help="Kokoro voice (default: am_michael)")
    parser.add_argument("--period", action="append", help="process one period by ID; repeat for multiple, default is all")
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--overwrite", action="store_true", help="replace local WAV/MP3 files")
    parser.add_argument("--upload-github", action="store_true", help="upload MP3s to the GitHub Release")
    parser.add_argument("--replace-existing", action="store_true", help="replace same-name, different-size GitHub assets")
    parser.add_argument("--execute", action="store_true", help="allow remote uploads after a typed confirmation")
    parser.add_argument("--skip-generate", action="store_true", help="reuse existing WAV files")
    parser.add_argument("--skip-convert", action="store_true", help="reuse existing MP3 files")
    parser.add_argument("--validate-remote", action="store_true", help="check GitHub URLs for playable MP3 frames")
    parser.add_argument("--validate-only", action="store_true", help="only check remote URLs; do not generate or convert")
    parser.add_argument("--plan", action="store_true", help="print the plan without generating or uploading")
    args = parser.parse_args()

    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")
    if args.upload_github and not args.execute:
        parser.error("remote uploads require --execute")
    if args.execute and not args.upload_github:
        parser.error("--execute requires --upload-github")
    if args.replace_existing and not args.upload_github:
        parser.error("--replace-existing requires --upload-github")
    if args.validate_only and not args.validate_remote:
        parser.error("--validate-only requires --validate-remote")
    if args.validate_only and args.upload_github:
        parser.error("--validate-only cannot be combined with upload options")

    try:
        all_periods = load_periods()
        chosen = selected_periods(all_periods, args.period)
        intros = load_intros(all_periods)
        jobs = intro_jobs(all_periods, chosen)
    except (RuntimeError, ValueError, OSError, KeyError, TypeError) as exc:
        print(f"Cannot prepare intro narration: {exc}", file=sys.stderr)
        return 2

    if args.list:
        for period, index in intro_jobs(all_periods, all_periods):
            print(f"{index:02}  {intro_asset_name(index)}   {period['title']}")
        return 0

    print(f"Voice: {args.voice} ({VOICES[args.voice]})")
    print(f"Output: {audio_directory(args.voice).relative_to(ROOT)}")
    print(f"Intro files selected: {len(jobs)}")
    for period, index in jobs:
        paragraphs = intros[period["id"]]
        words = sum(len(paragraph.split()) for paragraph in paragraphs)
        print(f"  {intro_asset_name(index)}: {period['title']} ({len(paragraphs)} paragraphs, {words} words)")
    if args.plan:
        print("Plan only; no audio generated and no remote services contacted.")
        return 0

    if args.upload_github:
        print(f"\nRemote action requested: publish intro audio to GitHub release {GITHUB_TAG_PREFIX}{args.voice} in {GITHUB_REPOSITORY}")
        if input(f"Type {CONFIRMATION} to continue: ").strip() != CONFIRMATION:
            print("Cancelled before any generation or upload.")
            return 0

    try:
        if not args.validate_only:
            if not args.skip_generate:
                generate(jobs, intros, args.voice, args.speed, args.overwrite)
            if not args.skip_convert:
                convert(jobs, args.voice, args.overwrite)
            failures = local_validate(jobs, args.voice)
            if failures:
                raise RuntimeError(f"Local MP3 validation failed for {failures} intro file(s); remote upload stopped")
        if args.upload_github:
            if not shutil.which("gh"):
                raise RuntimeError("GitHub CLI (gh) is required; install it, run gh auth login, and retry")
            gh("auth", "status", "--hostname", "github.com")
            upload_github(jobs, args.voice, args.replace_existing)
        if args.validate_remote:
            remote_failures = remote_validate(jobs, args.voice)
            if remote_failures:
                raise RuntimeError(f"Remote playable-audio validation failed for {remote_failures} URL(s)")
    except (RuntimeError, OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        return 1
    print("\nIntro narration workflow completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
