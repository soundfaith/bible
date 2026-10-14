#!/usr/bin/env python3
"""Regenerate changed Bible Journey story MP3s and replace their GitHub assets.

Preview the affected stories with:
  python scripts/regenerate_journey_audio.py --plan

Regenerate and publish both supported Journey voices with:
  python scripts/regenerate_journey_audio.py --execute
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "scripts" / "audio_regeneration_plan.json"
REPOSITORY = "soundfaith/bible"
VOICE_CHOICES = ("am_michael", "af_heart")

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import period_narration as narration
except ImportError as exc:
    raise SystemExit(f"Could not load Journey narration helpers: {exc}") from exc


def load_story_jobs() -> list[tuple[dict[str, Any], int, int, dict[str, Any]]]:
    try:
        plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
        planned_stories = plan["journey_stories"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise RuntimeError(f"Could not read Journey regeneration plan {PLAN_PATH}: {exc}") from exc
    if not isinstance(planned_stories, list):
        raise RuntimeError(f"Invalid Journey story list in {PLAN_PATH}")

    periods = narration.load_periods()
    jobs_by_key = {
        (period["id"], period_index, story_index): (period, story)
        for period, period_index, story_index, story in narration.story_jobs(periods)
    }
    jobs = []
    seen: set[tuple[str, int, int]] = set()
    for entry in planned_stories:
        if not isinstance(entry, dict):
            raise RuntimeError(f"Invalid Journey story entry in {PLAN_PATH}")
        key = (entry.get("period_id"), entry.get("period_index"), entry.get("story_index"))
        if key in seen:
            raise RuntimeError(f"Duplicate Journey story entry in {PLAN_PATH}: {key}")
        seen.add(key)
        selected = jobs_by_key.get(key)
        if selected is None:
            raise RuntimeError(f"Journey story no longer exists in the narration plan: {key}")
        period, story = selected
        expected_asset = narration.story_asset_name(key[1], key[2])
        if entry.get("period_title") != period["title"] or entry.get("story_title") != story["title"]:
            raise RuntimeError(f"Journey story title changed since the plan was generated: {key}")
        if entry.get("asset") != expected_asset:
            raise RuntimeError(f"Journey asset name changed since the plan was generated: {key}")
        affected_references = entry.get("affected_references")
        if not isinstance(affected_references, list) or not affected_references:
            raise RuntimeError(f"Journey story {key} has no affected references in the plan")
        jobs.append((period, key[1], key[2], story))
    if not jobs:
        raise RuntimeError(f"No affected Journey story audios are listed in {PLAN_PATH}")
    return jobs


def ffmpeg_path() -> str:
    local = ROOT / "ffmpeg.exe"
    executable = str(local) if local.is_file() else shutil.which("ffmpeg")
    if not executable:
        raise RuntimeError("FFmpeg is required. Put ffmpeg.exe in the project root or add it to PATH.")
    return executable


def generate_and_convert(
    jobs: list[tuple[dict[str, Any], int, int, dict[str, Any]]],
    voice: str,
    speed: float,
) -> list[Path]:
    try:
        import numpy
        import soundfile
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile") from exc

    pipeline = KPipeline(lang_code=voice[0], device="cpu")
    ffmpeg = ffmpeg_path()
    output_dir = narration.audio_directory(voice)
    output_dir.mkdir(parents=True, exist_ok=True)
    by_name, _by_id = narration.load_book_index()
    mp3_paths = []

    for period, period_index, story_index, story in jobs:
        text, verse_count = narration.build_story_text(story, by_name)
        asset_name = narration.story_asset_name(period_index, story_index)
        wav_path = output_dir / asset_name.replace(".mp3", ".wav")
        mp3_path = output_dir / asset_name
        print(f"Generating {period['title']} / {story['title']} with {voice} ({verse_count} verses)...")
        chunks = [
            audio.numpy()
            for _start, _end, audio in pipeline(
                text,
                voice=voice,
                speed=speed,
                split_pattern=r"\n+",
            )
            if audio is not None
        ]
        if not chunks:
            raise RuntimeError(f"Kokoro returned no audio for {period['title']} / {story['title']}")
        temporary_wav = wav_path.with_name(wav_path.stem + ".tmp.wav")
        soundfile.write(temporary_wav, numpy.concatenate(chunks), 24000, subtype="PCM_16")
        temporary_wav.replace(wav_path)

        temporary_mp3 = mp3_path.with_name(mp3_path.stem + ".tmp.mp3")
        result = subprocess.run(
            [
                ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "2", str(temporary_mp3),
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if result.returncode:
            temporary_mp3.unlink(missing_ok=True)
            raise RuntimeError(f"FFmpeg failed for {asset_name}: {result.stderr.strip() or result.returncode}")
        temporary_mp3.replace(mp3_path)
        with mp3_path.open("rb") as stream:
            if not narration.has_playable_mp3_frames(stream.read(narration.RANGE_BYTES)):
                raise RuntimeError(f"MP3 frame validation failed: {mp3_path.relative_to(ROOT)}")
        print(f"  Generated and validated {mp3_path.relative_to(ROOT)}")
        mp3_paths.append(mp3_path)
    return mp3_paths


def gh(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    attempts = 5 if check else 1
    for attempt in range(1, attempts + 1):
        try:
            result = subprocess.run(
                ["gh", *args],
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                check=False,
            )
        except OSError as exc:
            raise RuntimeError(f"Could not start GitHub CLI (gh): {exc}") from exc
        if not (check and result.returncode):
            return result
        message = result.stderr.strip() or result.stdout.strip() or f"gh exited {result.returncode}"
        transient = any(
            marker in message.casefold()
            for marker in ("not found", "http 5", "timeout", "timed out", "connection", "eof", "reset", "try again")
        )
        if not transient or attempt == attempts:
            raise RuntimeError(f"gh {' '.join(args[:3])} failed: {message}")
        wait = attempt * 5
        print(f"  gh {' '.join(args[:3])} failed ({message}); retrying in {wait}s ({attempt}/{attempts - 1})...")
        time.sleep(wait)
    return result


def upload_and_validate(jobs: list[tuple[dict[str, Any], int, int, dict[str, Any]]], voice: str, mp3_paths: list[Path]) -> None:
    tag = narration.GITHUB_TAG_PREFIX + voice
    viewed = gh("release", "view", tag, "--repo", REPOSITORY, "--json", "isDraft,isImmutable,assets", check=False)
    if viewed.returncode:
        message = (viewed.stderr or viewed.stdout).casefold()
        if "not found" not in message:
            raise RuntimeError(viewed.stderr.strip() or viewed.stdout.strip())
        gh(
            "release", "create", tag, "--repo", REPOSITORY,
            "--title", f"Bible Journey story narrations ({voice})",
            "--notes", f"Story narrations generated with Kokoro voice {voice}.",
            "--draft",
        )
        viewed = gh("release", "view", tag, "--repo", REPOSITORY, "--json", "isDraft,isImmutable,assets")
    release = json.loads(viewed.stdout)
    if release.get("isImmutable"):
        raise RuntimeError(f"GitHub Release {tag} is immutable and cannot be updated.")

    gh("release", "upload", tag, *(str(path) for path in mp3_paths), "--repo", REPOSITORY, "--clobber")
    refreshed = json.loads(gh("release", "view", tag, "--repo", REPOSITORY, "--json", "isDraft,assets").stdout)
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    mismatches = [path.name for path in mp3_paths if assets.get(path.name) != path.stat().st_size]
    if mismatches:
        raise RuntimeError(f"GitHub asset verification failed for {tag}: {', '.join(mismatches)}")
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", REPOSITORY)

    for period, period_index, story_index, story in jobs:
        filename = narration.story_asset_name(period_index, story_index)
        url = (
            f"https://github.com/{REPOSITORY}/releases/download/"
            f"{urllib.parse.quote(tag, safe='-')}/{urllib.parse.quote(filename, safe='-')}"
        )
        ok, detail = narration.request_playable(url)
        print(f"{'OK  ' if ok else 'FAIL'} GitHub {period['title']} / {story['title']} / {voice}: {detail}")
        if not ok:
            raise RuntimeError(f"Remote Journey audio validation failed for {filename}: {detail}")
    print(f"GitHub upload and playable-audio validation passed for {len(mp3_paths)} stories ({tag}).")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--voice", action="append", choices=VOICE_CHOICES,
        help="Kokoro voice; repeat to select both (default: both am_michael and af_heart)",
    )
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--plan", action="store_true", help="show affected stories without generating audio")
    parser.add_argument("--execute", action="store_true", help="regenerate and replace GitHub Release assets")
    args = parser.parse_args()
    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")
    voices = list(dict.fromkeys(args.voice or VOICE_CHOICES))

    try:
        jobs = load_story_jobs()
        print(f"Affected stories: {len(jobs)}; voices: {', '.join(voices)}")
        for period, period_index, story_index, story in jobs:
            print(
                f"  {narration.story_asset_name(period_index, story_index)}: "
                f"{period['title']} / {story['title']}"
            )
        if args.plan or not args.execute:
            print("Plan only; no audio generated and no remote services contacted.")
            return 0

        if not shutil.which("gh"):
            raise RuntimeError("GitHub CLI (gh) is required; install it, run 'gh auth login', and retry.")
        gh("auth", "status", "--hostname", "github.com")
        confirmation = "REGENERATE JOURNEY AUDIO " + " ".join(voice.upper() for voice in voices)
        if input(f"Type {confirmation} to regenerate and replace the selected public audio: ").strip() != confirmation:
            print("Cancelled before generation or upload.")
            return 0

        for voice in voices:
            mp3_paths = generate_and_convert(jobs, voice, args.speed)
            upload_and_validate(jobs, voice, mp3_paths)
    except (RuntimeError, OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print("\nJourney narration regeneration completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
