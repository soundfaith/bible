#!/usr/bin/env python3
"""Generate, convert, upload, and validate reusable Rosary prayer narrations.

Examples:
  python scripts/rosary_narration.py --list
  python scripts/rosary_narration.py --voice am_michael --plan
  python scripts/rosary_narration.py --voice am_michael
  python scripts/rosary_narration.py --voice af_heart
  python scripts/rosary_narration.py --voice am_michael --only mystery-
  python scripts/rosary_narration.py --voice am_michael --upload-github --execute
  python scripts/rosary_narration.py --voice af_heart --upload-github --execute

Local files are written to narration/rosary/<voice>/<clip>.wav and .mp3.
Uploads require --execute and a typed confirmation, following the Breviary
narration workflow. Each voice has a separate rosary-narration-<voice> release.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

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

DATA_PATH = ROOT / "src" / "data" / "rosary.json"
OUTPUT_ROOT = ROOT / "narration" / "rosary"
TAG_PREFIX = "rosary-narration-"
APP_VOICES = ("am_michael", "af_heart")
CONFIRMATION = "UPLOAD ROSARY"


def build_clips() -> dict[str, str]:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    prayers = data["prayers"]
    clips = {
        "sign-of-cross": prayers["signOfCross"],
        "apostles-creed": prayers["apostlesCreed"],
        "our-father": prayers["ourFather"],
        "hail-mary": prayers["hailMary"],
        "glory-be": prayers["gloryBe"],
        "fatima-prayer": prayers["fatima"],
        "hail-holy-queen": prayers["hailHolyQueen"],
        "memorare": prayers["memorare"],
    }
    for mystery_index, mystery in enumerate(data["mysteries"], start=1):
        mystery_name = mystery["title"].removesuffix(" Mysteries").lower()
        for decade_index, scene in enumerate(mystery["scenes"], start=1):
            ordinal = ("first", "second", "third", "fourth", "fifth")[decade_index - 1]
            scene_name = scene["title"].removeprefix("The ").lower()
            clips[f"mystery-{mystery_index:02}-{decade_index:02}"] = (
                f"The {ordinal} {mystery_name} mystery is the {scene_name}."
            )
            clips[f"gospel-{mystery_index:02}-{decade_index:02}"] = f"{scene['reference']}. {scene['gospel']}"
    return clips


def select_clips(clips: dict[str, str], prefixes: list[str] | None) -> dict[str, str]:
    if not prefixes:
        return clips
    selected = {name: text for name, text in clips.items() if any(name.startswith(prefix) for prefix in prefixes)}
    if not selected:
        raise SystemExit("--only matched no Rosary clips")
    return selected


def folder(voice: str) -> Path:
    return OUTPUT_ROOT / voice


def generate(clips: dict[str, str], voice: str, speed: float, overwrite: bool) -> None:
    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile numpy") from exc
    pipeline = KPipeline(lang_code=voice[0])
    destination_folder = folder(voice)
    destination_folder.mkdir(parents=True, exist_ok=True)
    for index, (name, text) in enumerate(clips.items(), start=1):
        destination = destination_folder / f"{name}.wav"
        if not overwrite and (destination.exists() or destination.with_suffix(".mp3").exists()):
            print(f"Already generated: {destination.stem} ({voice})")
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
            [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
             "-vn", "-map_metadata", "-1", "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "44100",
             "-write_xing", "1", "-id3v2_version", "3", str(temporary)],
            capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
        )
        if result.returncode:
            raise RuntimeError(f"FFmpeg failed for {name}: {result.stderr.strip()}")
        temporary.replace(destination)
        print(f"Converted {destination.relative_to(ROOT)}")


def local_validate(clips: dict[str, str], voice: str) -> int:
    failures = 0
    for name in clips:
        path = folder(voice) / f"{name}.mp3"
        if not path.is_file() or not has_playable_mp3_frames(path.read_bytes()[:256 * 1024]):
            print(f"Invalid or missing local MP3: {path.relative_to(ROOT)}", file=sys.stderr)
            failures += 1
    return failures


def remote_validate(clips: dict[str, str], voice: str) -> int:
    tag = TAG_PREFIX + voice
    failures = 0
    for name in clips:
        filename = quote(f"{name}.mp3", safe="-")
        url = f"https://github.com/{GITHUB_REPOSITORY}/releases/download/{tag}/{filename}"
        ok, detail = request_playable(url)
        print(f"{'OK  ' if ok else 'FAIL'} GitHub: {name} / {voice}: {detail}")
        if not ok:
            failures += 1
    print(f"Remote validation: {len(clips) - failures}/{len(clips)} playable for {voice}.")
    return failures


def upload_github(clips: dict[str, str], voice: str, replace_existing: bool) -> None:
    destination_folder = folder(voice)
    files = {name: destination_folder / f"{name}.mp3" for name in clips}
    missing = [str(path.relative_to(ROOT)) for path in files.values() if not path.is_file()]
    if missing:
        raise RuntimeError("Convert all selected clips before upload; missing: " + ", ".join(missing))
    tag = TAG_PREFIX + voice
    viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets", check=False)
    if viewed.returncode:
        message = (viewed.stderr or viewed.stdout).casefold()
        if "not found" not in message:
            raise RuntimeError(viewed.stderr.strip() or viewed.stdout.strip())
        gh("release", "create", tag, "--repo", GITHUB_REPOSITORY, "--title", f"Rosary narrations ({voice})", "--notes", f"Reusable Rosary prayer and Gospel reading clips generated with Kokoro voice {voice}.", "--draft")
        viewed = gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,isImmutable,assets")
    release = json.loads(viewed.stdout)
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in release.get("assets", [])}
    to_upload: list[Path] = []
    for name, path in files.items():
        previous_size = assets.get(f"{name}.mp3")
        if previous_size is None:
            to_upload.append(path)
        elif previous_size == path.stat().st_size:
            print(f"Already on GitHub: {name}.mp3")
        elif replace_existing:
            to_upload.append(path)
        else:
            raise RuntimeError(f"GitHub asset {name}.mp3 exists with a different size; use --replace-existing to replace it")
    if release.get("isImmutable") and to_upload:
        raise RuntimeError(f"Release {tag} is immutable; it cannot accept or replace assets")
    if to_upload:
        args = ["release", "upload", tag, *(str(path) for path in to_upload), "--repo", GITHUB_REPOSITORY]
        if replace_existing:
            args.append("--clobber")
        gh(*args)
    refreshed = json.loads(gh("release", "view", tag, "--repo", GITHUB_REPOSITORY, "--json", "isDraft,assets").stdout)
    refreshed_assets = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    wrong = [name for name, path in files.items() if refreshed_assets.get(f"{name}.mp3") != path.stat().st_size]
    if wrong:
        raise RuntimeError("GitHub release verification failed for: " + ", ".join(wrong))
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", GITHUB_REPOSITORY)
    print(f"GitHub upload verified: {len(files)} prayer and Gospel files in release {tag}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list clip IDs and exit")
    parser.add_argument("--voice", choices=APP_VOICES, default="am_michael", help="Kokoro voice for the app (am_michael or af_heart)")
    parser.add_argument("--only", action="append", help="process only clip IDs starting with this prefix; can be repeated")
    parser.add_argument("--speed", type=float, default=0.96, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--overwrite", action="store_true", help="replace local WAV and MP3 files")
    parser.add_argument("--skip-generate", action="store_true", help="reuse existing WAV files")
    parser.add_argument("--skip-convert", action="store_true", help="reuse existing MP3 files")
    parser.add_argument("--plan", action="store_true", help="print the plan without generating or uploading")
    parser.add_argument("--upload-github", action="store_true", help="upload MP3s to rosary-narration-<voice>")
    parser.add_argument("--execute", action="store_true", help="allow remote uploads after a typed confirmation")
    parser.add_argument("--replace-existing", action="store_true", help="replace GitHub assets with different sizes")
    parser.add_argument("--validate-only", action="store_true", help="only check MP3s on GitHub")
    args = parser.parse_args()
    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")

    clips = select_clips(build_clips(), args.only)
    if args.list:
        for name, text in clips.items():
            print(f"{name}\t{len(text)} chars")
        print(f"{len(clips)} clips for each voice")
        return 0
    if args.plan:
        print(f"{len(clips)} clips for {args.voice} ({VOICES[args.voice]}) -> {folder(args.voice).relative_to(ROOT)}")
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
        upload_github(clips, args.voice, args.replace_existing)
        return 1 if remote_validate(clips, args.voice) else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
