#!/usr/bin/env python3
"""Generate, convert, publish, and validate Bible Journey story narrations.

Examples:
  python scripts/period_narration.py --list
  python scripts/period_narration.py --voice af_heart
  python scripts/period_narration.py --voice bm_george --period love-given-to-the-end
  python scripts/period_narration.py --voice am_michael --upload-github --upload-archive --execute

Local files are written to narration/periods/<voice>/period-01.wav and .mp3, then period-02, period-03, and so on.
Remote uploads are never performed without --execute and an interactive confirmation.
"""

from __future__ import annotations

import argparse
import concurrent.futures
from functools import lru_cache
import getpass
import json
import os
import re
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
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT / "src" / "data"
INDEX_PATH = DATA_DIR / "index.json"
TIMELINE_PATH = DATA_DIR / "bibleJourney.ts"
MANIFEST_PATH = SCRIPT_DIR / "period_narrations.json"
OUTPUT_ROOT = ROOT / "narration" / "periods"
GITHUB_REPOSITORY = "soundfaith/bible"
GITHUB_TAG_PREFIX = "journey-narration-"
ARCHIVE_IDENTIFIER_PREFIX = "soundfaith-bible-journey-"
USER_AGENT = "soundfaith-bible-journey-narration/1.0"
RANGE_BYTES = 256 * 1024
RETRIES = 3

sys.path.insert(0, str(SCRIPT_DIR))
try:
    from generate_narration import VOICES
except ImportError as exc:
    raise SystemExit(f"Could not load voice choices from generate_narration.py: {exc}") from exc


def story_asset_name(period_index: int, story_index: int) -> str:
    return f"period-{period_index:02}-story-{story_index:02}.mp3"


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not read {path}: {exc}") from exc


def extract_timeline_periods() -> list[tuple[str, str]]:
    """Read period IDs and titles from the app source to detect manifest drift."""
    source = TIMELINE_PATH.read_text(encoding="utf-8")
    marker = "export const bibleJourney: JourneyPeriod[] = ["
    start = source.find(marker)
    if start < 0:
        raise RuntimeError(f"Could not find bibleJourney array in {TIMELINE_PATH}")
    source = source[start + len(marker):]
    periods: list[tuple[str, str]] = []
    depth = 0
    quote: str | None = None
    escaped = False
    object_start: int | None = None
    for index, char in enumerate(source):
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char == '"' or char == "'" or char == "`":
            quote = char
        elif char == "{":
            if depth == 0:
                object_start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and object_start is not None:
                block = source[object_start:index + 1]
                id_match = re.search(r'\bid:\s*"([^"]+)"', block)
                title_match = re.search(r'\btitle:\s*"([^"]+)"', block)
                if id_match and title_match:
                    periods.append((id_match.group(1), title_match.group(1)))
                object_start = None
        elif char == "]" and depth == 0:
            break
    return periods


def load_periods() -> list[dict[str, Any]]:
    manifest = read_json(MANIFEST_PATH)
    periods = manifest.get("periods") if isinstance(manifest, dict) else None
    if not isinstance(periods, list) or len(periods) != 12:
        raise RuntimeError(f"{MANIFEST_PATH} must contain exactly 12 periods")
    ids: set[str] = set()
    for period in periods:
        if not isinstance(period, dict) or not all(isinstance(period.get(key), str) for key in ("id", "title")):
            raise RuntimeError("Every period needs string id and title values")
        if period["id"] in ids:
            raise RuntimeError(f"Duplicate period ID in manifest: {period['id']}")
        ids.add(period["id"])
        stories = period.get("stories")
        if not isinstance(stories, list) or not stories:
            raise RuntimeError(f"Period {period['id']} has no stories")
        for story in stories:
            if not isinstance(story, dict) or not isinstance(story.get("title"), str) or not isinstance(story.get("references"), list):
                raise RuntimeError(f"Invalid story in period {period['id']}")
            if not story["references"] or not all(isinstance(ref, str) for ref in story["references"]):
                raise RuntimeError(f"Story {story['title']!r} needs one or more references")
    source_periods = extract_timeline_periods()
    if [(p["id"], p["title"]) for p in periods] != source_periods:
        raise RuntimeError(
            "Narration manifest period IDs/titles do not match src/data/bibleJourney.ts. "
            "Update scripts/period_narrations.json to match the app timeline."
        )
    return periods


def load_book_index() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    books = read_json(INDEX_PATH).get("books", [])
    by_name: dict[str, dict[str, Any]] = {}
    by_id: dict[str, dict[str, Any]] = {}
    for book in books:
        by_id[book["id"]] = book
        by_name[book["name"].strip().casefold()] = book
    by_name["psalm"] = by_name["psalms"]
    return by_name, by_id


def parse_reference(reference: str, by_name: dict[str, dict[str, Any]]) -> tuple[dict[str, Any], int, list[int]]:
    normalized = reference.replace("—", "-").replace("–", "-").strip()
    match = re.fullmatch(r"(.+?)\s+(\d+):(.+)", normalized)
    if not match:
        raise ValueError(f"Invalid Bible reference: {reference!r}")
    book_name = match.group(1).strip().casefold()
    book = by_name.get(book_name)
    if not book:
        raise ValueError(f"Book {match.group(1)!r} in {reference!r} is not in src/data/index.json")
    chapter = int(match.group(2))
    verses: set[int] = set()
    for item in match.group(3).split(","):
        range_match = re.fullmatch(r"\s*(\d+)(?:\s*-\s*(\d+))?\s*", item)
        if not range_match:
            raise ValueError(f"Unsupported verse range {item!r} in {reference!r}")
        first = int(range_match.group(1))
        last = int(range_match.group(2) or first)
        if last < first:
            raise ValueError(f"Descending verse range in {reference!r}")
        verses.update(range(first, last + 1))
    return book, chapter, sorted(verses)


@lru_cache(maxsize=None)
def load_book_text(book_id: str) -> dict[str, Any]:
    return read_json(DATA_DIR / f"{book_id}.json")


def resolve_reference(reference: str, by_name: dict[str, dict[str, Any]]) -> tuple[str, int, list[dict[str, Any]]]:
    book, chapter, wanted = parse_reference(reference, by_name)
    book_data = load_book_text(book["id"])
    found = {
        int(verse["verse"]): verse
        for verse in book_data.get("verses", [])
        if int(verse["chapter"]) == chapter
    }
    missing = [number for number in wanted if number not in found]
    if missing:
        raise ValueError(f"{reference}: verse(s) not found in local text: {', '.join(map(str, missing))}")
    return book["name"], chapter, [found[number] for number in wanted]


def build_story_text(story: dict[str, Any], by_name: dict[str, dict[str, Any]]) -> tuple[str, int]:
    sections = [story["title"]]
    verse_total = 0
    seen: set[tuple[str, int, int]] = set()
    for reference in story["references"]:
        book_name, chapter, verses = resolve_reference(reference, by_name)
        new_verses = []
        for verse in verses:
            key = (book_name, chapter, int(verse["verse"]))
            if key in seen:
                continue
            seen.add(key)
            text = str(verse.get("text", "")).strip()
            if text:
                new_verses.append(text)
                verse_total += 1
        if new_verses:
            sections.append(f"{book_name}, chapter {chapter}. " + " ".join(new_verses))
    if verse_total == 0:
        raise RuntimeError(f"No local verse text was resolved for {story['title']}")
    return "\n\n".join(sections), verse_total


def story_jobs(periods: list[dict[str, Any]]) -> list[tuple[dict[str, Any], int, int, dict[str, Any]]]:
    jobs: list[tuple[dict[str, Any], int, int, dict[str, Any]]] = []
    for period_index, period in enumerate(periods, start=1):
        for story_index, story in enumerate(period["stories"], start=1):
            jobs.append((period, period_index, story_index, story))
    return jobs


def selected_periods(periods: list[dict[str, Any]], period_ids: list[str] | None) -> list[dict[str, Any]]:
    if not period_ids:
        return periods
    requested = set(period_ids)
    known = {period["id"] for period in periods}
    unknown = requested - known
    if unknown:
        raise ValueError("Unknown period ID(s): " + ", ".join(sorted(unknown)))
    return [period for period in periods if period["id"] in requested]


def audio_directory(voice: str) -> Path:
    return OUTPUT_ROOT / voice


def ffmpeg_path() -> str:
    local = ROOT / "ffmpeg.exe"
    found = str(local) if local.is_file() else shutil.which("ffmpeg")
    if not found:
        raise RuntimeError("FFmpeg is required. Put ffmpeg.exe in the project root or add FFmpeg to PATH.")
    return found


def generate(periods: list[dict[str, Any]], voice: str, speed: float, overwrite: bool, by_name: dict[str, dict[str, Any]]) -> None:
    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise RuntimeError("Kokoro dependencies missing. Install with: python -m pip install kokoro soundfile") from exc

    language = voice[0]
    pipeline = KPipeline(lang_code=language)
    folder = audio_directory(voice)
    folder.mkdir(parents=True, exist_ok=True)
    for period, period_index, story_index, story in story_jobs(periods):
        destination = folder / story_asset_name(period_index, story_index).replace(".mp3", ".wav")
        if destination.exists() and not overwrite:
            print(f"Skip existing {destination.relative_to(ROOT)} (use --overwrite to replace)")
            continue
        text, count = build_story_text(story, by_name)
        print(f"Generating {period['title']} / {story['title']} with {voice} ({count} verses)...")
        chunks = [audio.numpy() for _, _, audio in pipeline(text, voice=voice, speed=speed, split_pattern=r"\n+") if audio is not None]
        if not chunks:
            raise RuntimeError(f"Kokoro returned no audio for {period['title']} / {story['title']}")
        temporary = destination.with_name(destination.stem + ".tmp.wav")
        sf.write(temporary, np.concatenate(chunks), 24000, subtype="PCM_16")
        temporary.replace(destination)
        print(f"  Saved {destination.relative_to(ROOT)}")


def convert(periods: list[dict[str, Any]], voice: str, overwrite: bool) -> None:
    ffmpeg = ffmpeg_path()
    folder = audio_directory(voice)
    converted = skipped = 0
    for period, period_index, story_index, story in story_jobs(periods):
        source = folder / story_asset_name(period_index, story_index).replace(".mp3", ".wav")
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


BITRATES = {
    (3, 3): (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320),
    (3, 2): (0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256),
    (3, 1): (0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448),
    (2, 3): (0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256),
    (2, 2): (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
    (2, 1): (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
}


def frame_info(data: bytes, offset: int) -> tuple[int, int, int] | None:
    if offset + 4 > len(data):
        return None
    first, second, third = data[offset:offset + 3]
    if first != 0xFF or (second & 0xE0) != 0xE0:
        return None
    version = (second >> 3) & 3
    layer = (second >> 1) & 3
    bitrate_index = (third >> 4) & 15
    sample_index = (third >> 2) & 3
    if version == 1 or layer == 0 or bitrate_index in (0, 15) or sample_index == 3:
        return None
    version_group = 3 if version == 3 else 2
    sample_rate = (44100, 48000, 32000)[sample_index] // (1 if version == 3 else 2 if version == 2 else 4)
    table = BITRATES.get((version_group, layer))
    if table is None:
        return None
    bitrate = table[bitrate_index] * 1000
    padding = (third >> 1) & 1
    if layer == 3:
        size = ((12 * bitrate) // sample_rate + padding) * 4
    elif layer == 1 and version != 3:
        size = (72 * bitrate) // sample_rate + padding
    else:
        size = (144 * bitrate) // sample_rate + padding
    return (size, version, layer) if size >= 4 else None


def has_playable_mp3_frames(data: bytes) -> bool:
    start = 0
    if data.startswith(b"ID3") and len(data) >= 10:
        tag_size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) | ((data[8] & 0x7F) << 7) | (data[9] & 0x7F)
        start = 10 + tag_size
    for offset in range(start, max(start, len(data) - 4)):
        first = frame_info(data, offset)
        if first is None:
            continue
        second = frame_info(data, offset + first[0])
        if second and second[1:] == first[1:]:
            return True
    return False


def local_validate(periods: list[dict[str, Any]], voice: str) -> int:
    folder = audio_directory(voice)
    failures = 0
    for period, period_index, story_index, story in story_jobs(periods):
        path = folder / story_asset_name(period_index, story_index)
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


def request_playable(url: str, timeout: float = 30) -> tuple[bool, str]:
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "identity",
        "Range": f"bytes=0-{RANGE_BYTES - 1}",
    })
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if response.status not in (200, 206):
                    return False, f"HTTP {response.status}"
                data = response.read(RANGE_BYTES)
                content_type = response.headers.get("Content-Type", "unknown")
            if not data:
                return False, "empty response body"
            if not has_playable_mp3_frames(data):
                return False, f"no consecutive MP3 frames ({content_type})"
            return True, f"playable MP3 frames ({content_type})"
        except urllib.error.HTTPError as exc:
            message = f"HTTP {exc.code} {exc.reason}"
            retryable = 500 <= exc.code <= 599
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            message = str(exc)
            retryable = True
        if not retryable or attempt == RETRIES:
            return False, message
        time.sleep(attempt + 1)
    return False, "request failed"


def remote_validate(periods: list[dict[str, Any]], voice: str, target: str, archive_identifier: str) -> int:
    tag = GITHUB_TAG_PREFIX + voice
    failures = 0
    for period, period_index, story_index, story in story_jobs(periods):
        filename = urllib.parse.quote(story_asset_name(period_index, story_index), safe="-")
        urls = []
        if target in ("github", "all"):
            urls.append(("GitHub", f"https://github.com/{GITHUB_REPOSITORY}/releases/download/{tag}/{filename}"))
        if target in ("archive", "all"):
            urls.append(("Archive.org", f"https://archive.org/download/{urllib.parse.quote(archive_identifier, safe='')}/{filename}"))
        for service, url in urls:
            ok, detail = request_playable(url)
            print(f"{'OK  ' if ok else 'FAIL'} {service}: {period['title']} / {story['title']} / {voice}: {detail}")
            if not ok:
                failures += 1
    return failures


def gh(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(["gh", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", check=False)
    except OSError as exc:
        raise RuntimeError(f"Could not start GitHub CLI (gh): {exc}") from exc
    if check and result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"gh exited {result.returncode}")
    return result


def upload_github(periods: list[dict[str, Any]], voice: str, replace_existing: bool) -> None:
    folder = audio_directory(voice)
    files = [(period, period_index, story_index, folder / story_asset_name(period_index, story_index)) for period, period_index, story_index, story in story_jobs(periods)]
    missing = [str(path.relative_to(ROOT)) for _, _, _, path in files if not path.is_file()]
    if missing:
        raise RuntimeError("Convert all selected periods before upload; missing: " + ", ".join(missing))
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
    for period, period_index, story_index, path in files:
        name = story_asset_name(period_index, story_index)
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
    wrong = [
        story_asset_name(period_index, story_index)
        for period, period_index, story_index, path in files
        if refreshed_assets.get(story_asset_name(period_index, story_index)) != path.stat().st_size
    ]
    if wrong:
        raise RuntimeError("GitHub release verification failed for: " + ", ".join(wrong))
    if refreshed.get("isDraft"):
        gh("release", "edit", tag, "--draft=false", "--repo", GITHUB_REPOSITORY)
    print(f"GitHub upload verified: {len(files)} story file(s) in release {tag}.")


def archive_files(identifier: str) -> set[str]:
    url = f"https://archive.org/metadata/{urllib.parse.quote(identifier, safe='')}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            metadata = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return set()
        raise RuntimeError(f"Archive.org metadata returned HTTP {exc.code}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not read Archive.org metadata: {exc}") from exc
    return {entry["name"] for entry in metadata.get("files", []) if isinstance(entry, dict) and "name" in entry}


def upload_archive(periods: list[dict[str, Any]], voice: str, identifier: str) -> None:
    try:
        from internetarchive import upload
    except ImportError as exc:
        raise RuntimeError("Install Archive.org upload support with: python -m pip install -r requirements-upload.txt") from exc
    files = [(period, period_index, story_index, audio_directory(voice) / story_asset_name(period_index, story_index)) for period, period_index, story_index, story in story_jobs(periods)]
    missing = [str(path.relative_to(ROOT)) for _, _, _, path in files if not path.is_file()]
    if missing:
        raise RuntimeError("Convert all selected periods before upload; missing: " + ", ".join(missing))
    access_key = os.environ.get("IA_ACCESS_KEY", "").strip() or getpass.getpass("Archive.org S3 access key: ").strip()
    secret_key = os.environ.get("IA_SECRET_KEY", "").strip() or getpass.getpass("Archive.org S3 secret key: ").strip()
    if not access_key or not secret_key:
        raise RuntimeError("Both IA_ACCESS_KEY and IA_SECRET_KEY are required")
    existing = archive_files(identifier)
    pending = [(period, period_index, story_index, path) for period, period_index, story_index, path in files if story_asset_name(period_index, story_index) not in existing]
    for period, period_index, story_index, path in files:
        name = story_asset_name(period_index, story_index)
        if name in existing:
            print(f"Already on Archive.org: {name}")
    metadata = {
        "title": f"Soundfaith Bible Journey narration ({voice})",
        "mediatype": "audio",
        "collection": "opensource_audio",
        "description": "Narrated stories for the Soundfaith Bible Journey, using selected World English Bible (Updated) passages.",
        "language": "eng",
        "subject": ["Bible", "Bible timeline", "audio narration", "World English Bible"],
    }
    for period, period_index, story_index, path in pending:
        name = story_asset_name(period_index, story_index)
        print(f"Uploading {period['title']} / {period['stories'][story_index - 1]['title']} to Archive.org as {name}...")
        response = upload(
            identifier, [str(path)], metadata=metadata,
            access_key=access_key, secret_key=secret_key,
            retries=5, retries_sleep=5, verbose=True,
        )
        responses = response if isinstance(response, list) else [response]
        bad = [item for item in responses if getattr(item, "status_code", 200) >= 400]
        if bad:
            raise RuntimeError(f"Archive.org returned HTTP status {bad[0].status_code} for {name}")
    remote = archive_files(identifier)
    missing_after = [story_asset_name(period_index, story_index) for _, period_index, story_index, _ in files if story_asset_name(period_index, story_index) not in remote]
    if missing_after:
        raise RuntimeError("Archive.org upload could not be verified for: " + ", ".join(missing_after))
    print(f"Archive.org upload verified: {len(files)} story file(s) in {identifier}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list periods and their stories")
    parser.add_argument("--voice", choices=sorted(VOICES), default="am_michael", help="Kokoro voice (default: am_michael)")
    parser.add_argument("--period", action="append", help="process every story in a period by ID; repeat for multiple, default is all")
    parser.add_argument("--speed", type=float, default=0.94, help="Kokoro speech speed, from 0.5 to 1.5")
    parser.add_argument("--overwrite", action="store_true", help="replace local WAV/MP3 files")
    parser.add_argument("--upload-github", action="store_true", help="upload MP3s to a GitHub Release")
    parser.add_argument("--upload-archive", action="store_true", help="upload MP3s to Archive.org")
    parser.add_argument("--archive-identifier", help="override Archive.org item ID")
    parser.add_argument("--replace-existing", action="store_true", help="replace same-name, different-size GitHub assets")
    parser.add_argument("--execute", action="store_true", help="allow remote uploads after a typed confirmation")
    parser.add_argument("--skip-generate", action="store_true", help="reuse existing WAV files")
    parser.add_argument("--skip-convert", action="store_true", help="reuse existing MP3 files")
    parser.add_argument("--validate-remote", choices=("github", "archive", "all"), help="check remote URLs for playable MP3 frames")
    parser.add_argument("--validate-only", action="store_true", help="only check remote URLs; do not generate, convert, or require local MP3s")
    parser.add_argument("--plan", action="store_true", help="validate references and print the plan without generating or uploading")
    args = parser.parse_args()

    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")
    if (args.upload_github or args.upload_archive) and not args.execute:
        parser.error("remote uploads require --execute")
    if args.replace_existing and not args.upload_github:
        parser.error("--replace-existing requires --upload-github")
    if args.execute and not (args.upload_github or args.upload_archive):
        parser.error("--execute requires --upload-github and/or --upload-archive")
    if args.validate_only and not args.validate_remote:
        parser.error("--validate-only requires --validate-remote github, archive, or all")
    if args.validate_only and (args.upload_github or args.upload_archive):
        parser.error("--validate-only cannot be combined with upload options")

    try:
        periods = selected_periods(load_periods(), args.period)
        by_name, _by_id = load_book_index()
        archive_identifier = args.archive_identifier or f"{ARCHIVE_IDENTIFIER_PREFIX}{args.voice}"
        plan_rows = []
        for period, period_index, story_index, story in story_jobs(periods):
            text, verse_count = build_story_text(story, by_name)
            plan_rows.append((period, period_index, story_index, story, verse_count, len(text)))
    except (RuntimeError, ValueError, OSError, KeyError, TypeError) as exc:
        print(f"Cannot prepare period narration: {exc}", file=sys.stderr)
        return 2

    if args.list:
        for index, period in enumerate(load_periods(), start=1):
            print(f"{index:02}  {period['id']}: {period['title']} ({len(period['stories'])} stories)")
            for story_index, story in enumerate(period["stories"], start=1):
                print(f"      {story_asset_name(index, story_index)}   {story['title']}")
        return 0

    print(f"Voice: {args.voice} ({VOICES[args.voice]})")
    print(f"Output: {audio_directory(args.voice).relative_to(ROOT)}")
    print(f"Periods selected: {len(periods)}")
    print(f"Story files selected: {len(plan_rows)}")
    for period, period_index, story_index, story, verse_count, character_count in plan_rows:
        filename = story_asset_name(period_index, story_index)
        print(f"  {filename}: {period['title']} / {story['title']} ({verse_count} verses, {character_count:,} text characters)")
    if args.plan:
        print("Plan only; no audio generated and no remote services contacted.")
        return 0

    confirmation_actions = []
    if args.upload_github:
        confirmation_actions.append(f"publish audio to GitHub releases in {GITHUB_REPOSITORY}")
    if args.upload_archive:
        confirmation_actions.append(f"upload audio to Archive.org item {archive_identifier}")
    if confirmation_actions:
        print("\nRemote action requested: " + " and ".join(confirmation_actions))
        if input("Type UPLOAD STORY NARRATIONS to continue: ").strip() != "UPLOAD STORY NARRATIONS":
            print("Cancelled before any generation or upload.")
            return 0

    try:
        if not args.validate_only:
            if not args.skip_generate:
                generate(periods, args.voice, args.speed, args.overwrite, by_name)
            if not args.skip_convert:
                convert(periods, args.voice, args.overwrite)
            failures = local_validate(periods, args.voice)
            if failures:
                raise RuntimeError(f"Local MP3 validation failed for {failures} story file(s); remote upload stopped")
        if args.upload_github:
            if not shutil.which("gh"):
                raise RuntimeError("GitHub CLI (gh) is required; install it, run gh auth login, and retry")
            gh("auth", "status", "--hostname", "github.com")
            upload_github(periods, args.voice, args.replace_existing)
        if args.upload_archive:
            upload_archive(periods, args.voice, archive_identifier)
        if args.validate_remote:
            remote_failures = remote_validate(periods, args.voice, args.validate_remote, archive_identifier)
            if remote_failures:
                raise RuntimeError(f"Remote playable-audio validation failed for {remote_failures} URL(s)")
    except (RuntimeError, OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        return 1
    print("\nPeriod narration workflow completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
