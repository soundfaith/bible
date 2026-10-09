#!/usr/bin/env python3
"""Check that every app-linked GitHub Release chapter URL can start MP3 playback."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "src" / "data" / "index.json"
DATA_DIR = ROOT / "src" / "data"
PREFIX_BYTES = 256 * 1024
RETRIES = 3
RETRY_DELAY_SECONDS = 1
USER_AGENT = "bible-narration-github-audio-check/1.0"

BITRATES = {
    (3, 3): (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320),
    (3, 2): (0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256),
    (3, 1): (0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448),
    (2, 3): (0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256),
    (2, 2): (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
    (2, 1): (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
}


def chapter_count(book_id: str) -> int:
    """Read chapter numbers from the same verse data used by the app."""
    path = DATA_DIR / f"{book_id}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    chapters = [int(verse["chapter"]) for verse in data["verses"]]
    if not chapters:
        raise ValueError(f"No verses found in {path}")
    return max(chapters)


def mpeg_frame_info(data: bytes, offset: int) -> tuple[int, int, int] | None:
    if offset + 4 > len(data):
        return None
    b1, b2, b3, _b4 = data[offset : offset + 4]
    if b1 != 0xFF or (b2 & 0xE0) != 0xE0:
        return None
    version = (b2 >> 3) & 0x03
    layer = (b2 >> 1) & 0x03
    bitrate_index = (b3 >> 4) & 0x0F
    sample_index = (b3 >> 2) & 0x03
    if version == 1 or layer == 0 or bitrate_index in (0, 15) or sample_index == 3:
        return None
    version_group = 3 if version == 3 else 2
    sample_rates = (44100, 48000, 32000)
    sample_rate = sample_rates[sample_index] // (1 if version == 3 else 2 if version == 2 else 4)
    bitrate_table = BITRATES.get((version_group, layer))
    if bitrate_table is None:
        return None
    bitrate = bitrate_table[bitrate_index] * 1000
    padding = (b3 >> 1) & 1
    if layer == 3:
        frame_size = ((12 * bitrate) // sample_rate + padding) * 4
    elif layer == 1 and version != 3:
        frame_size = (72 * bitrate) // sample_rate + padding
    else:
        frame_size = (144 * bitrate) // sample_rate + padding
    if frame_size < 4:
        return None
    return frame_size, version, layer


def has_playable_mp3_frames(data: bytes) -> bool:
    start = 0
    if data.startswith(b"ID3") and len(data) >= 10:
        tag_size = (
            ((data[6] & 0x7F) << 21)
            | ((data[7] & 0x7F) << 14)
            | ((data[8] & 0x7F) << 7)
            | (data[9] & 0x7F)
        )
        start = 10 + tag_size
    for offset in range(start, max(start, len(data) - 4)):
        first = mpeg_frame_info(data, offset)
        if first is None:
            continue
        second = mpeg_frame_info(data, offset + first[0])
        if second and second[1:] == first[1:]:
            return True
    return False


def check_url(chapter: int, url: str, timeout: float) -> tuple[str, bool, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "identity",
            "Range": f"bytes=0-{PREFIX_BYTES - 1}",
        },
    )
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                status = response.status
                if status not in (200, 206):
                    return url, False, f"unexpected HTTP {status}"
                content_range = response.headers.get("Content-Range", "")
                if status == 206 and not content_range.lower().startswith("bytes 0-"):
                    return url, False, f"unexpected Content-Range {content_range!r}"
                audio = response.read(PREFIX_BYTES)
                content_type = response.headers.get("Content-Type", "unknown")
            if not audio:
                return url, False, "empty response body"
            if not has_playable_mp3_frames(audio):
                return url, False, f"received {content_type}, but found no consecutive MP3 frames in first {len(audio)} bytes"
            suffix = f" (succeeded after {attempt} retries)" if attempt else ""
            return url, True, f"HTTP {status}; playable MP3 frames ({content_type}){suffix}"
        except urllib.error.HTTPError as exc:
            message = f"HTTP {exc.code} {exc.reason}"
            retryable = 500 <= exc.code <= 599
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            message = str(exc)
            retryable = True
        if not retryable or attempt == RETRIES:
            return url, False, f"{message} after {attempt} retries" if attempt else message
        time.sleep(RETRY_DELAY_SECONDS * (attempt + 1))
    return url, False, "request failed"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check GitHub Release MP3 URLs configured as the app's primary narration source."
    )
    parser.add_argument("--jobs", type=int, default=6, help="parallel requests (default: 6)")
    parser.add_argument("--timeout", type=float, default=30, help="per-request timeout in seconds")
    args = parser.parse_args()
    if args.jobs < 1 or args.timeout <= 0:
        parser.error("--jobs and --timeout must be positive")

    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"Could not load {INDEX_PATH}: {exc}", file=sys.stderr)
        return 2

    tasks: list[tuple[str, int, str]] = []
    books_checked = 0
    for book in books:
        base_url = book.get("narrationAudioBaseUrl")
        if not base_url:
            continue
        parsed = urlparse(base_url)
        if parsed.hostname not in {"github.com", "www.github.com"} or "/releases/download/" not in parsed.path:
            print(
                f"Skipping {book.get('name', book.get('id', '<unknown>'))}: "
                f"narrationAudioBaseUrl is not a GitHub Release URL ({base_url})",
                file=sys.stderr,
            )
            continue
        book_id = book.get("id")
        if not isinstance(book_id, str) or not book.get("name"):
            print(f"Invalid book entry in {INDEX_PATH}: {book!r}", file=sys.stderr)
            return 2
        try:
            count = chapter_count(book_id)
        except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
            print(f"Cannot determine app chapters for {book['name']}: {exc}", file=sys.stderr)
            return 2
        books_checked += 1
        for chapter in range(1, count + 1):
            # Match the app's URL construction: base URL + /<chapter>.mp3.
            tasks.append((book["name"], chapter, f"{base_url.rstrip('/')}/{chapter}.mp3"))

    if not tasks:
        print("No GitHub Release narration URLs were found in index.json.", file=sys.stderr)
        return 2

    print(f"Checking {len(tasks)} GitHub Release chapter URLs across {books_checked} books.")
    print("Each URL is fetched with an HTTP Range request and checked for consecutive MP3 frames.\n")
    outcomes: dict[tuple[str, int, str], bool] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as executor:
        futures = {
            executor.submit(check_url, chapter, url, args.timeout): (name, chapter, url)
            for name, chapter, url in tasks
        }
        for done, future in enumerate(concurrent.futures.as_completed(futures), start=1):
            task = futures[future]
            try:
                _url, ok, message = future.result()
            except Exception as exc:
                ok, message = False, str(exc)
            outcomes[task] = ok
            name, chapter, url = task
            print(f"[{done}/{len(tasks)}] {'OK' if ok else 'FAIL':4} {name} {chapter}: {message}")
            if not ok:
                print(f"      {url}")

    passed = sum(outcomes.values())
    failed = len(tasks) - passed
    print(f"\nGitHub audio check complete: {passed}/{len(tasks)} passed, {failed} failed.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
