#!/usr/bin/env python3
"""Generate, convert, publish, and validate Breviary prayer narrations.

The prayers repeat every day, so each text is generated once per voice and the app
assembles the clips during playback. Psalms reuse the existing chapter narrations.

Examples:
  python scripts/breviary_narration.py --list
  python scripts/breviary_narration.py --voice am_michael
  python scripts/breviary_narration.py --voice af_heart --only saint-
  python scripts/breviary_narration.py --voice af_heart --upload-github --execute
  python scripts/breviary_narration.py --voice am_michael --validate-only

Local files are written to narration/breviary/<voice>/<clip>.wav and .mp3.
Remote uploads are never performed without --execute and an interactive confirmation.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from period_narration import (  # noqa: E402
    GITHUB_REPOSITORY,
    ROOT,
    VOICES,
    ffmpeg_path,
    gh,
    has_playable_mp3_frames,
    request_playable,
)

DATA_PATH = ROOT / "src" / "data" / "breviary.json"
OUTPUT_ROOT = ROOT / "narration" / "breviary"
TAG_PREFIX = "breviary-narration-"
UPLOAD_BATCH = 40
CONFIRMATION = "UPLOAD BREVIARY"


def build_clips() -> dict[str, str]:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    clips: dict[str, str] = {"opening": data["opening"], "night-prayer": data["nightPrayer"]}
    for hour, text in data["blessings"].items():
        clips[f"blessing-{hour}"] = text
    for season_id, season in data["seasons"].items():
        clips[f"antiphon-{season_id}"] = season["antiphon"]
        clips[f"short-prayer-{season_id}"] = season["shortPrayer"]
        clips[f"intercessions-{season_id}"] = season["intercessions"]
        clips[f"conclusion-{season_id}"] = season["concludingPrayer"]
    for saint in data["saints"]:
        clips[f"saint-{saint['id']}-antiphon"] = saint["antiphon"]
        clips[f"saint-{saint['id']}-intercession"] = saint["intercession"]
        clips[f"saint-{saint['id']}-conclusion"] = saint["concludingPrayer"]
    for canticle_id, canticle in data["canticles"].items():
        clips[f"canticle-{canticle_id}"] = canticle["text"]
    clips["psalm-91-compline"] = data["complinePsalm91"]["text"]
    for index, reading in enumerate(data["readings"], start=1):
        clips[f"reading-{index:02}"] = f"{reading['reference']}. {reading['text']}"
    for number, text in data["reflections"]["byPsalm"].items():
        clips[f"reflection-{number}"] = text
    clips["reflection-default"] = data["reflections"]["fallback"]
    return clips


def select(clips: dict[str, str], only: list[str] | None) -> dict[str, str]:
    if not only:
        return clips
    chosen = {name: text for name, text in clips.items() if any(name.startswith(prefix) for prefix in only)}
    if not chosen:
        raise SystemExit("--only matched no clips")
    return chosen


def folder(voice: str) -> Path:
    return OUTPUT_ROOT / voice


def generate(clips: dict[str, str], voice: str, speed: float, overwrite: bool) -> None:
    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile") from exc
    pipeline = KPipeline(lang_code=voice[0])
    folder(voice).mkdir(parents=True, exist_ok=True)
    for index, (name, text) in enumerate(clips.items(), start=1):
        destination = folder(voice) / f"{name}.wav"
        if destination.exists() and not overwrite:
            continue
        print(f"[{index}/{len(clips)}] Generating {name} with {voice}...")
        chunks = [audio.numpy() for _, _, audio in pipeline(text, voice=voice, speed=speed, split_pattern=r"\n+") if audio is not None]
        if not chunks:
            raise RuntimeError(f"Kokoro returned no audio for {name}")
        temporary = destination.with_name(destination.stem + ".tmp.wav")
        sf.write(temporary, np.concatenate(chunks), 24000, subtype="PCM_16")
        temporary.replace(destination)


def convert(clips: dict[str, str], voice: str, overwrite: bool) -> None:
    ffmpeg = ffmpeg_path()
    for name in clips:
        source = folder(voice) / f"{name}.wav"
        destination = source.with_suffix(".mp3")
        if not source.is_file():
            print(f"Skip missing WAV: {source.relative_to(ROOT)}")
            continue
        if destination.exists() and not overwrite:
            continue
        temporary = destination.with_name(destination.stem + ".tmp.mp3")
        result = subprocess.run(
            [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-codec:a", "libmp3lame", "-q:a", "2", str(temporary)],
            capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed for {name}: {result.stderr.strip()}")
        temporary.replace(destination)
        print(f"Converted {destination.relative_to(ROOT)}")


def local_validate(clips: dict[str, str], voice: str) -> int:
    failures = 0
    for name in clips:
        path = folder(voice) / f"{name}.mp3"
        if not path.is_file() or not has_playable_mp3_frames(path.read_bytes()[:256 * 1024]):
            print(f"Invalid or missing local MP3: {path.relative_to(ROOT)}")
            failures += 1
    return failures


def remote_validate(clips: dict[str, str], voice: str) -> int:
    failures = 0
    for name in clips:
        url = f"https://github.com/{GITHUB_REPOSITORY}/releases/download/{TAG_PREFIX}{voice}/{name}.mp3"
        ok, detail = request_playable(url)
        if not ok:
            print(f"FAIL {url}: {detail}")
            failures += 1
    print(f"Remote validation: {len(clips) - failures}/{len(clips)} playable for {voice}.")
    return failures


def upload_github(clips: dict[str, str], voice: str) -> None:
    files = {name: folder(voice) / f"{name}.mp3" for name in clips}
    missing = [str(path.relative_to(ROOT)) for path in files.values() if not path.is_file()]
    if missing:
        raise RuntimeError("Convert all clips before upload; missing: " + ", ".join(missing[:10]))
    tag = TAG_PREFIX + voice
    viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets", check=False)
    if viewed.returncode:
        if "not found" not in (viewed.stderr or viewed.stdout).casefold():
            raise RuntimeError(viewed.stderr.strip() or viewed.stdout.strip())
        gh("release", "create", tag, "--repo", GITHUB_REPOSITORY, "--title", f"Breviary narrations ({voice})", "--notes", f"Breviary prayer clips generated with Kokoro voice {voice}.", "--draft")
        viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets")
    release = json.loads(viewed.stdout)
    if release.get("isImmutable"):
        raise RuntimeError(f"Release {tag} is immutable; it cannot accept assets")
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in release.get("assets", [])}
    pending = [path for name, path in files.items() if assets.get(f"{name}.mp3") != path.stat().st_size]
    for start in range(0, len(pending), UPLOAD_BATCH):
        batch = pending[start:start + UPLOAD_BATCH]
        print(f"Uploading {start + len(batch)}/{len(pending)}...")
        gh("release", "upload", tag, *(str(path) for path in batch), "--repo", GITHUB_REPOSITORY, "--clobber")
    refreshed = json.loads(gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,assets").stdout)
    sizes = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    wrong = [name for name, path in files.items() if sizes.get(f"{name}.mp3") != path.stat().st_size]
    if wrong:
        raise RuntimeError("GitHub release verification failed for: " + ", ".join(wrong[:10]))
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", GITHUB_REPOSITORY)
    print(f"GitHub upload verified: {len(files)} clip(s) in release {tag}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list clip IDs and exit")
    parser.add_argument("--voice", choices=sorted(VOICES), default="am_michael", help="Kokoro voice (use am_michael and af_heart for the app)")
    parser.add_argument("--only", action="append", help="only clips whose ID starts with this prefix; repeatable")
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--overwrite", action="store_true", help="replace local WAV/MP3 files")
    parser.add_argument("--skip-generate", action="store_true", help="reuse existing WAV files")
    parser.add_argument("--skip-convert", action="store_true", help="reuse existing MP3 files")
    parser.add_argument("--plan", action="store_true", help="print the plan without generating or uploading")
    parser.add_argument("--upload-github", action="store_true", help="upload MP3s to the breviary-narration-<voice> release")
    parser.add_argument("--execute", action="store_true", help="allow remote uploads after a typed confirmation")
    parser.add_argument("--validate-only", action="store_true", help="only check the published URLs")
    args = parser.parse_args()
    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")

    clips = select(build_clips(), args.only)
    if args.list:
        for name, text in clips.items():
            print(f"{name}\t{len(text)} chars")
        print(f"{len(clips)} clips")
        return 0
    if args.plan:
        print(f"{len(clips)} clips for {args.voice} -> {folder(args.voice).relative_to(ROOT)}")
        return 0
    if args.validate_only:
        return 1 if remote_validate(clips, args.voice) else 0

    if not args.skip_generate:
        generate(clips, args.voice, args.speed, args.overwrite)
    if not args.skip_convert:
        convert(clips, args.voice, args.overwrite)
    if local_validate(clips, args.voice):
        return 1
    if args.upload_github:
        if not args.execute:
            print("Dry run: add --execute to upload to GitHub.")
            return 0
        answer = input(f"Type '{CONFIRMATION}' to upload {len(clips)} clips for {args.voice} to {GITHUB_REPOSITORY}: ")
        if answer.strip() != CONFIRMATION:
            print("Cancelled.")
            return 1
        upload_github(clips, args.voice)
        return 1 if remote_validate(clips, args.voice) else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
