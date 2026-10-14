#!/usr/bin/env python3
"""Generate, convert, publish, and validate Bible chapter narration.

The script resumes from existing WAV/MP3 files and publishes each completed
chapter immediately to the selected voice's GitHub Release.

Example:
  python scripts/generate_bible_narration.py --chapter-plan scripts/audio_regeneration_plan.json --voice am_michael --overwrite --upload-github --replace-existing --execute
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
INDEX_PATH = DATA_DIR / "index.json"
OUTPUT_DIR = ROOT / "narration" / "female"
REPOSITORY = "soundfaith/bible"
VOICE = "af_heart"
VOICE_DESCRIPTION = "American female"
USER_AGENT = "soundfaith-bible-narration/1.0"
RANGE_BYTES = 256 * 1024
UPLOAD_BATCH_SIZE = 20
RETRIES = 3

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from generate_narration import VOICES, load_chapter
    from period_narration import has_playable_mp3_frames
except ImportError as exc:
    raise SystemExit(f"Could not load narration helpers: {exc}") from exc


def read_books() -> list[dict[str, Any]]:
    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise RuntimeError(f"Could not read Bible book index {INDEX_PATH}: {exc}") from exc
    if not isinstance(books, list) or not books:
        raise RuntimeError(f"No Bible books are listed in {INDEX_PATH}")
    return books


def read_chapters(book_id: str) -> list[int]:
    path = DATA_DIR / f"{book_id}.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        chapters = sorted({int(verse["chapter"]) for verse in data["verses"]})
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        raise RuntimeError(f"Could not read chapters for {book_id}: {exc}") from exc
    if not chapters:
        raise RuntimeError(f"No chapters found for {book_id}")
    return chapters


def read_chapter_plan(plan_path: Path, books: list[dict[str, Any]]) -> list[tuple[dict[str, Any], list[int]]]:
    try:
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        planned_books = plan["bible_books"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise RuntimeError(f"Could not read Bible chapter plan {plan_path}: {exc}") from exc
    if not isinstance(planned_books, list) or not planned_books:
        raise RuntimeError(f"No Bible chapter regeneration entries found in {plan_path}")

    books_by_id = {book["id"]: book for book in books}
    work: list[tuple[dict[str, Any], list[int]]] = []
    seen: set[str] = set()
    for entry in planned_books:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str):
            raise RuntimeError(f"Invalid book entry in {plan_path}")
        book_id = entry["id"]
        book = books_by_id.get(book_id)
        if book is None:
            raise RuntimeError(f"Unknown book ID {book_id!r} in {plan_path}")
        if book_id in seen:
            raise RuntimeError(f"Duplicate book ID {book_id!r} in {plan_path}")
        seen.add(book_id)
        chapters = entry.get("chapters")
        if not isinstance(chapters, list) or not chapters or any(
            not isinstance(chapter, int) or isinstance(chapter, bool) or chapter < 1
            for chapter in chapters
        ):
            raise RuntimeError(f"Invalid chapter list for {book_id} in {plan_path}")
        if len(set(chapters)) != len(chapters):
            raise RuntimeError(f"Duplicate chapter in {book_id} entry in {plan_path}")
        available = set(read_chapters(book_id))
        unavailable = sorted(set(chapters) - available)
        if unavailable:
            raise RuntimeError(f"{book_id} has no chapter(s) {unavailable} listed in {plan_path}")
        work.append((book, sorted(chapters)))
    return work


def ffmpeg_path() -> str:
    local = ROOT / "ffmpeg.exe"
    executable = str(local) if local.is_file() else shutil.which("ffmpeg")
    if not executable:
        raise RuntimeError("FFmpeg is required. Put ffmpeg.exe in the project root or add it to PATH.")
    return executable


def gh(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    executable = shutil.which("gh")
    if not executable:
        raise RuntimeError("GitHub CLI was not found on PATH.")
    attempts = 5 if check else 1
    for attempt in range(1, attempts + 1):
        result = subprocess.run(
            [executable, *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if not (check and result.returncode):
            return result
        message = result.stderr.strip() or result.stdout.strip() or f"gh exited with {result.returncode}"
        # GitHub intermittently reports "release not found" or 5xx right after release changes.
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


def chapter_paths(book_id: str, chapter: int) -> tuple[Path, Path]:
    folder = OUTPUT_DIR / book_id
    return folder / f"{chapter}.wav", folder / f"{chapter}.mp3"


def validate_local(path: Path) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError(f"MP3 is missing or empty: {path.relative_to(ROOT)}")
    with path.open("rb") as stream:
        if not has_playable_mp3_frames(stream.read(RANGE_BYTES)):
            raise RuntimeError(f"MP3 frame validation failed: {path.relative_to(ROOT)}")


def generate_chapter(
    book_id: str,
    book_name: str,
    chapter: int,
    pipeline: Any,
    numpy: Any,
    soundfile: Any,
    speed: float,
    overwrite: bool,
) -> Path:
    wav_path, _mp3_path = chapter_paths(book_id, chapter)
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    if wav_path.is_file() and not overwrite:
        print(f"  Reusing {wav_path.relative_to(ROOT)}")
        return wav_path
    resolved_name, text = load_chapter(book_id, chapter)
    if not text.strip():
        raise RuntimeError(f"{resolved_name} {chapter} has no narration text")
    print(f"  Generating {book_name} {chapter} ({len(text):,} characters) with {VOICE}...")
    chunks = [
        audio.numpy()
        for _start, _end, audio in pipeline(
            text,
            voice=VOICE,
            speed=speed,
            split_pattern=r"\n+",
        )
        if audio is not None
    ]
    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for {book_name} {chapter}")
    temporary = wav_path.with_name(f"{wav_path.stem}.tmp.wav")
    soundfile.write(temporary, numpy.concatenate(chunks), 24000, subtype="PCM_16")
    temporary.replace(wav_path)
    return wav_path


def convert_chapter(wav_path: Path, mp3_path: Path, executable: str, overwrite: bool) -> None:
    if mp3_path.is_file() and not overwrite:
        validate_local(mp3_path)
        print(f"  Reusing validated {mp3_path.relative_to(ROOT)}")
        return
    if not wav_path.is_file():
        raise RuntimeError(f"Cannot convert missing WAV file: {wav_path.relative_to(ROOT)}")
    temporary = mp3_path.with_name(f"{mp3_path.stem}.tmp.mp3")
    result = subprocess.run(
        [
            executable, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "2", str(temporary),
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if result.returncode:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"FFmpeg failed for {wav_path.name}: {result.stderr.strip() or result.returncode}")
    temporary.replace(mp3_path)
    validate_local(mp3_path)
    print(f"  Converted and validated {mp3_path.relative_to(ROOT)}")


def gh_release_tag(book_id: str) -> str:
    suffix = "" if VOICE == "am_michael" else f"-{VOICE}"
    return f"narration-{book_id}{suffix}"


def upload_book(book: dict[str, Any], mp3_paths: list[Path], replace_existing: bool = False) -> None:
    tag = gh_release_tag(book["id"])
    result = gh([
        "release", "view", tag, "--repo", REPOSITORY, "--json",
        "isDraft,isImmutable,assets",
    ], check=False)
    if result.returncode:
        message = (result.stderr or result.stdout).casefold()
        if "not found" not in message:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
        gh([
            "release", "create", tag, "--repo", REPOSITORY,
            "--title", f"{book['name']} Bible narration ({VOICE})",
            "--notes", f"{book['name']} chapter narration generated with Kokoro voice {VOICE}.",
        ])
        result = gh([
            "release", "view", tag, "--repo", REPOSITORY, "--json",
            "isDraft,isImmutable,assets",
        ])
    release = json.loads(result.stdout)
    if release.get("isImmutable"):
        raise RuntimeError(f"GitHub Release {tag} is immutable and cannot be updated.")
    assets = {asset["name"]: int(asset.get("size", -1)) for asset in release.get("assets", [])}
    to_upload = list(mp3_paths) if replace_existing else [
        path for path in mp3_paths if assets.get(path.name) != path.stat().st_size
    ]
    for offset in range(0, len(to_upload), UPLOAD_BATCH_SIZE):
        batch = to_upload[offset:offset + UPLOAD_BATCH_SIZE]
        args = ["release", "upload", tag, *(str(path) for path in batch), "--repo", REPOSITORY]
        if replace_existing or any(path.name in assets for path in batch):
            args.append("--clobber")
        gh(args)
    refreshed = json.loads(gh([
        "release", "view", tag, "--repo", REPOSITORY, "--json", "isDraft,assets",
    ]).stdout)
    refreshed_assets = {asset["name"]: int(asset.get("size", -1)) for asset in refreshed.get("assets", [])}
    mismatches = [
        path.name for path in mp3_paths
        if refreshed_assets.get(path.name) != path.stat().st_size
    ]
    if mismatches:
        raise RuntimeError(f"GitHub asset-size verification failed for {book['name']}: {', '.join(mismatches)}")
    if refreshed.get("isDraft"):
        gh(["release", "edit", tag, "--draft=false", "--repo", REPOSITORY])
    print(f"GitHub Release {tag} contains {len(mp3_paths)} verified chapter MP3 asset(s).")


def check_remote_asset(url: str) -> tuple[bool, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "identity",
            "Range": f"bytes=0-{RANGE_BYTES - 1}",
        },
    )
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                if response.status not in (200, 206):
                    return False, f"HTTP {response.status}"
                data = response.read(RANGE_BYTES)
            if has_playable_mp3_frames(data):
                return True, "playable MP3 frames"
            return False, "no consecutive MPEG audio frames"
        except urllib.error.HTTPError as exc:
            message = f"HTTP {exc.code} {exc.reason}"
            retryable = 500 <= exc.code < 600
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            message = str(exc)
            retryable = True
        if not retryable or attempt == RETRIES:
            return False, message
        time.sleep(attempt + 1)
    return False, "request failed"


def validate_remote(book: dict[str, Any], chapters: list[int]) -> None:
    tag = gh_release_tag(book["id"])
    base_url = f"https://github.com/{REPOSITORY}/releases/download/{urllib.parse.quote(tag, safe='-')}"
    checks: list[tuple[int, bool, str]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(
                check_remote_asset,
                f"{base_url}/{chapter}.mp3",
            ): chapter
            for chapter in chapters
        }
        for future in concurrent.futures.as_completed(futures):
            checks.append((futures[future], *future.result()))
    failures = [(chapter, result) for chapter, ok, result in checks if not ok]
    for chapter, _ok, result in sorted(checks):
        print(f"  {'OK' if result == 'playable MP3 frames' else 'FAIL'} GitHub {book['name']} {chapter}: {result}")
    if failures:
        summary = ", ".join(f"{chapter} ({reason})" for chapter, reason in failures)
        raise RuntimeError(f"GitHub remote audio validation failed for {book['name']}: {summary}")
    print(f"GitHub remote validation passed for all {len(chapters)} chapters in {book['name']}.")


def main() -> int:
    global OUTPUT_DIR, VOICE, VOICE_DESCRIPTION

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--book", action="append", help="limit to one or more book IDs; repeat to select several")
    parser.add_argument("--chapter-plan", type=Path, help="JSON plan listing only the book chapters to regenerate")
    parser.add_argument(
        "--voice", action="append", choices=("am_michael", "af_heart"),
        help="Kokoro voice; repeat to regenerate both supported voices (default: af_heart)",
    )
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed (0.5 to 1.5)")
    parser.add_argument("--overwrite", action="store_true", help="regenerate WAVs and replace MP3s")
    parser.add_argument("--plan", action="store_true", help="list the work without loading Kokoro")
    parser.add_argument("--upload-github", action="store_true", help="publish each completed chapter to its book's GitHub Release")
    parser.add_argument(
        "--replace-existing", action="store_true",
        help="clobber every selected GitHub asset, even when its size is unchanged",
    )
    parser.add_argument("--execute", action="store_true", help="confirm GitHub publishing after typing the confirmation phrase")
    args = parser.parse_args()
    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")
    if args.upload_github != args.execute:
        parser.error("--upload-github and --execute must be supplied together")
    if args.replace_existing and not args.upload_github:
        parser.error("--replace-existing requires --upload-github")
    if args.chapter_plan and args.book:
        parser.error("--chapter-plan cannot be combined with --book")

    voices = list(dict.fromkeys(args.voice or ["af_heart"]))

    try:
        books = read_books()
        if args.chapter_plan:
            work = read_chapter_plan(args.chapter_plan.resolve(), books)
        elif args.book:
            wanted = {book_id.casefold() for book_id in args.book}
            known = {book["id"].casefold() for book in books}
            unknown = wanted - known
            if unknown:
                parser.error("unknown book ID(s): " + ", ".join(sorted(unknown)))
            selected_books = [book for book in books if book["id"].casefold() in wanted]
            work = [(book, read_chapters(book["id"])) for book in selected_books]
        else:
            work = [(book, read_chapters(book["id"])) for book in books]
        chapter_count = sum(len(chapters) for _book, chapters in work)
        for voice in voices:
            VOICE = voice
            VOICE_DESCRIPTION = VOICES[voice]
            OUTPUT_DIR = ROOT / "narration" / ("female" if "female" in VOICE_DESCRIPTION else "male")
            print(f"\nVoice: {VOICE} ({VOICE_DESCRIPTION})")
            print(f"Books: {len(work)}; chapters: {chapter_count}")
            print(f"Output: {OUTPUT_DIR.relative_to(ROOT)}")
            for book, chapters in work:
                print(f"  {book['name']}: {len(chapters)} chapters -> {gh_release_tag(book['id'])}")
        if args.plan:
            return 0

        ffmpeg = ffmpeg_path()
        if args.upload_github:
            gh(["auth", "status", "--hostname", "github.com"])
            confirmation_phrase = "UPLOAD BIBLE " + " ".join(voice.upper() for voice in voices)
            confirmation = input(
                f"Type {confirmation_phrase} to generate and publish the selected Bible narrations: "
            ).strip()
            if confirmation != confirmation_phrase:
                raise RuntimeError("Confirmation phrase did not match; no narration was generated or uploaded.")

        import numpy
        import soundfile
        from kokoro import KPipeline

        for voice in voices:
            VOICE = voice
            VOICE_DESCRIPTION = VOICES[voice]
            OUTPUT_DIR = ROOT / "narration" / ("female" if "female" in VOICE_DESCRIPTION else "male")
            pipeline: Any = KPipeline(lang_code=VOICE[0], device="cpu")
            completed = 0
            print(f"\nGenerating with {VOICE} ({VOICE_DESCRIPTION}).")
            for book, chapters in work:
                print(f"\n{book['name']}: processing {len(chapters)} chapters.")
                for chapter in chapters:
                    wav_path, mp3_path = chapter_paths(book["id"], chapter)
                    if not mp3_path.is_file() or args.overwrite:
                        wav_path = generate_chapter(
                            book["id"], book["name"], chapter,
                            pipeline, numpy, soundfile, args.speed, args.overwrite,
                        )
                    convert_chapter(wav_path, mp3_path, ffmpeg, args.overwrite)
                    if args.upload_github:
                        upload_book(book, [mp3_path], args.replace_existing)
                        validate_remote(book, [chapter])
                    completed += 1
                    if completed % 25 == 0:
                        print(f"Progress: {completed}/{chapter_count} chapters converted and validated.")
            print(f"\nComplete: {completed} chapters generated/converted/validated with {VOICE}.")
        return 0
    except (RuntimeError, OSError, ValueError, KeyError, TypeError, json.JSONDecodeError, ImportError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
