#!/usr/bin/env python3
"""Generate, convert, upload, and validate the three Breviary hour introductions.

Examples:
  python scripts/breviary_intro_narration.py --list
  python scripts/breviary_intro_narration.py --voice am_michael --plan
  python scripts/breviary_intro_narration.py --voice am_michael --upload-github --execute
  python scripts/breviary_intro_narration.py --voice af_heart --upload-github --execute

Local files are written to narration/breviary/<voice>/<hour>-intro.wav and .mp3.
MP3 assets are added to the existing breviary-narration-<voice> GitHub release.
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

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from period_narration import (  # noqa: E402
    GITHUB_REPOSITORY,
    RANGE_BYTES,
    ROOT,
    VOICES,
    ffmpeg_path,
    gh,
    has_playable_mp3_frames,
    request_playable,
)

INTROS_PATH = ROOT / "src" / "data" / "breviaryIntros.json"
OUTPUT_ROOT = ROOT / "narration" / "breviary"
HOURS = ("lauds", "vespers", "compline")
PAUSE_SECONDS = 0.7
SAMPLE_RATE = 24000
TAG_PREFIX = "breviary-narration-"
CONFIRMATION = "UPLOAD BREVIARY INTRO NARRATIONS"


def asset_name(hour: str) -> str:
    return f"{hour}-intro.mp3"


def paragraphs_of(text: str) -> list[str]:
    return [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def load_intros(chosen: list[str]) -> dict[str, list[str]]:
    try:
        data = json.loads(INTROS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not read {INTROS_PATH}: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError(f"{INTROS_PATH} must be an object keyed by hour")
    intros: dict[str, list[str]] = {}
    for hour in chosen:
        text = data.get(hour)
        if not isinstance(text, str) or not text.strip():
            raise RuntimeError(f"No intro text for {hour} in {INTROS_PATH}")
        intros[hour] = paragraphs_of(text)
    return intros


def output_folder(voice: str) -> Path:
    return OUTPUT_ROOT / voice


def generate(intros: dict[str, list[str]], voice: str, speed: float, overwrite: bool) -> None:
    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile") from exc

    pipeline = KPipeline(lang_code=voice[0])
    folder = output_folder(voice)
    folder.mkdir(parents=True, exist_ok=True)
    pause = np.zeros(int(SAMPLE_RATE * PAUSE_SECONDS), dtype="float32")
    for hour, paragraphs in intros.items():
        destination = folder / asset_name(hour).replace(".mp3", ".wav")
        if destination.exists() and not overwrite:
            print(f"Skip existing {destination.relative_to(ROOT)} (use --overwrite to replace)")
            continue
        print(f"Generating {hour.title()} intro with {voice} ({len(paragraphs)} paragraphs)...")
        chunks = []
        for number, paragraph in enumerate(paragraphs):
            if number:
                chunks.append(pause)
            pieces = [audio.numpy() for _, _, audio in pipeline(paragraph, voice=voice, speed=speed, split_pattern=r"\n+") if audio is not None]
            if not pieces:
                raise RuntimeError(f"Kokoro returned no audio for {hour} paragraph {number + 1}")
            chunks.extend(pieces)
        temporary = destination.with_name(destination.stem + ".tmp.wav")
        sf.write(temporary, np.concatenate(chunks), SAMPLE_RATE, subtype="PCM_16")
        temporary.replace(destination)
        print(f"  Saved {destination.relative_to(ROOT)}")


def convert(intros: dict[str, list[str]], voice: str, overwrite: bool) -> None:
    ffmpeg = ffmpeg_path()
    folder = output_folder(voice)
    for hour in intros:
        source = folder / asset_name(hour).replace(".mp3", ".wav")
        destination = source.with_suffix(".mp3")
        if not source.is_file():
            print(f"Skip missing WAV: {source.relative_to(ROOT)}")
            continue
        if destination.exists() and not overwrite:
            print(f"Skip existing {destination.relative_to(ROOT)}")
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
        print(f"Converted {destination.relative_to(ROOT)}")


def local_validate(intros: dict[str, list[str]], voice: str) -> int:
    failures = 0
    for hour in intros:
        path = output_folder(voice) / asset_name(hour)
        try:
            if not path.is_file() or path.stat().st_size == 0:
                raise ValueError("file missing or empty")
            with path.open("rb") as stream:
                playable = has_playable_mp3_frames(stream.read(RANGE_BYTES))
            if not playable:
                raise ValueError("no consecutive MPEG audio frames in the first 256 KiB")
            print(f"OK   {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")
        except (OSError, ValueError) as exc:
            failures += 1
            print(f"FAIL {path.relative_to(ROOT)}: {exc}", file=sys.stderr)
    return failures


def upload_github(intros: dict[str, list[str]], voice: str, replace_existing: bool) -> None:
    folder = output_folder(voice)
    files = {hour: folder / asset_name(hour) for hour in intros}
    missing = [str(path.relative_to(ROOT)) for path in files.values() if not path.is_file()]
    if missing:
        raise RuntimeError("Convert intros before upload; missing: " + ", ".join(missing))
    tag = TAG_PREFIX + voice
    viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets", check=False)
    if viewed.returncode:
        message = (viewed.stderr or viewed.stdout).casefold()
        if "not found" not in message:
            raise RuntimeError(viewed.stderr.strip() or viewed.stdout.strip())
        gh("release", "create", tag, "--repo", GITHUB_REPOSITORY, "--title", f"Breviary narrations ({voice})", "--notes", f"Breviary prayer and introduction clips generated with Kokoro voice {voice}.", "--draft")
        viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets")
    release = json.loads(viewed.stdout)
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in release.get("assets", [])}
    pending: list[Path] = []
    for hour, path in files.items():
        name = asset_name(hour)
        current_size = assets.get(name)
        if current_size is None:
            pending.append(path)
        elif current_size == path.stat().st_size:
            print(f"Already on GitHub: {name}")
        elif replace_existing:
            pending.append(path)
        else:
            raise RuntimeError(f"GitHub asset {name} exists with a different size; use --replace-existing to replace it")
    if release.get("isImmutable") and pending:
        raise RuntimeError(f"Release {tag} is immutable; it cannot accept or replace assets")
    if pending:
        args = ["release", "upload", tag, *(str(path) for path in pending), "--repo", GITHUB_REPOSITORY]
        if replace_existing:
            args.append("--clobber")
        gh(*args)
    refreshed = json.loads(gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,assets").stdout)
    refreshed_assets = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    wrong = [asset_name(hour) for hour, path in files.items() if refreshed_assets.get(asset_name(hour)) != path.stat().st_size]
    if wrong:
        raise RuntimeError("GitHub release verification failed for: " + ", ".join(wrong))
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", GITHUB_REPOSITORY)
    print(f"GitHub upload verified: {len(files)} intro file(s) in release {tag}.")


def remote_validate(intros: dict[str, list[str]], voice: str) -> int:
    tag = TAG_PREFIX + voice
    failures = 0
    for hour in intros:
        url = f"https://github.com/{GITHUB_REPOSITORY}/releases/download/{tag}/{urllib.parse.quote(asset_name(hour), safe='-')}"
        ok, detail = request_playable(url)
        print(f"{'OK  ' if ok else 'FAIL'} GitHub: {hour.title()} intro / {voice}: {detail}")
        failures += 0 if ok else 1
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list hour intro assets")
    parser.add_argument("--voice", choices=sorted(VOICES), default="am_michael", help="Kokoro voice (default: am_michael)")
    parser.add_argument("--hour", choices=HOURS, action="append", help="process one hour; repeat for multiple, default is all")
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--overwrite", action="store_true", help="replace local WAV/MP3 files")
    parser.add_argument("--upload-github", action="store_true", help="upload MP3s to the breviary-narration GitHub release")
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
    chosen = args.hour or list(HOURS)
    try:
        intros = load_intros(chosen)
    except RuntimeError as exc:
        print(f"Cannot prepare Breviary intro narration: {exc}", file=sys.stderr)
        return 2
    if args.list:
        for hour in chosen:
            print(f"{hour}\t{asset_name(hour)}\t{len(' '.join(intros[hour]))} chars")
        return 0
    print(f"Voice: {args.voice} ({VOICES[args.voice]})")
    print(f"Output: {output_folder(args.voice).relative_to(ROOT)}")
    for hour, paragraphs in intros.items():
        print(f"  {asset_name(hour)}: {len(paragraphs)} paragraphs, {sum(len(part.split()) for part in paragraphs)} words")
    if args.plan:
        print("Plan only; no audio generated and no remote services contacted.")
        return 0
    if args.upload_github:
        if input(f"Type {CONFIRMATION} to continue: ").strip() != CONFIRMATION:
            print("Cancelled before any generation or upload.")
            return 0
    try:
        if args.upload_github:
            if not shutil.which("gh"):
                raise RuntimeError("GitHub CLI (gh) is required; install it, run gh auth login, and retry")
            gh("auth", "status", "--hostname", "github.com")
        if not args.validate_only:
            if not args.skip_generate:
                generate(intros, args.voice, args.speed, args.overwrite)
            if not args.skip_convert:
                convert(intros, args.voice, args.overwrite)
            failures = local_validate(intros, args.voice)
            if failures:
                raise RuntimeError(f"Local MP3 validation failed for {failures} intro file(s); upload stopped")
        if args.upload_github:
            upload_github(intros, args.voice, args.replace_existing)
        if args.validate_remote:
            failures = remote_validate(intros, args.voice)
            if failures:
                raise RuntimeError(f"Remote playable-audio validation failed for {failures} URL(s)")
    except (RuntimeError, OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        return 1
    print("\nBreviary intro narration workflow completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
