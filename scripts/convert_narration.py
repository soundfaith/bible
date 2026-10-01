#!/usr/bin/env python3
"""Convert WAV files under narration/ to MP3 without changing the WAV files.

Run this script again as more narration is generated. WAV files that already
have a matching MP3 are skipped. Requires FFmpeg on PATH.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_NARRATION_DIR = ROOT / "narration"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--narration-dir",
        type=Path,
        default=DEFAULT_NARRATION_DIR,
        help="Folder to scan recursively (default: narration/ in this project)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace MP3 files that already exist",
    )
    args = parser.parse_args()

    narration_dir = args.narration_dir.resolve()
    if not narration_dir.is_dir():
        print(f"Narration folder does not exist: {narration_dir}", file=sys.stderr)
        return 2

    local_ffmpeg = ROOT / "ffmpeg.exe"
    ffmpeg = str(local_ffmpeg) if local_ffmpeg.is_file() else shutil.which("ffmpeg")
    if not ffmpeg:
        print("FFmpeg was not found at the project root or on PATH. Add ffmpeg.exe to the project root and rerun this script.", file=sys.stderr)
        return 2

    wav_files = sorted(
        (path for path in narration_dir.rglob("*") if path.is_file() and path.suffix.lower() == ".wav"),
        key=lambda path: str(path).casefold(),
    )
    if not wav_files:
        print(f"No WAV files found under {narration_dir}")
        return 0

    converted = 0
    skipped = 0
    errors = 0
    for wav_path in wav_files:
        mp3_path = wav_path.with_suffix(".mp3")
        if mp3_path.exists() and not args.overwrite:
            print(f"Skip existing {mp3_path.relative_to(narration_dir)}")
            skipped += 1
            continue

        # A temporary MP3 prevents an interrupted conversion from looking complete.
        temp_path = mp3_path.with_name(f"{mp3_path.stem}.tmp.mp3")
        print(f"Converting {wav_path.relative_to(narration_dir)}...")
        try:
            result = subprocess.run(
                [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "2", str(temp_path)],
                check=False,
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                temp_path.unlink(missing_ok=True)
                print(f"  Failed: {result.stderr.strip() or f'FFmpeg exited with {result.returncode}'}", file=sys.stderr)
                errors += 1
                continue
            temp_path.replace(mp3_path)
            converted += 1
            print(f"  Saved {mp3_path.relative_to(narration_dir)}")
        except OSError as error:
            temp_path.unlink(missing_ok=True)
            print(f"  Failed: {error}", file=sys.stderr)
            errors += 1

    print(f"Done: {converted} converted, {skipped} skipped, {errors} failed.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
