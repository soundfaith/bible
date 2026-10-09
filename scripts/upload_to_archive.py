#!/usr/bin/env python3
"""Upload narration MP3s to Internet Archive, one item per Bible book."""

from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "src" / "data" / "index.json"
AUDIO_ROOT = ROOT / "narration" / "male"
STATE_PATH = ROOT / ".archive_upload_state.json"

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Upload each local book folder as an Archive.org item."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="list the planned items without asking for credentials or uploading",
    )
    parser.add_argument(
        "--only", metavar="BOOK_ID",
        help="upload just one book folder, for example: --only ezra",
    )
    args = parser.parse_args()

    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"Could not read book list from {INDEX_PATH}: {exc}", file=sys.stderr)
        return 1

    plan = []
    no_audio = []
    for book in books:
        book_id = book["id"]
        if args.only and book_id.casefold() != args.only.casefold():
            continue
        folder = AUDIO_ROOT / book_id
        if not folder.is_dir():
            no_audio.append(book)
            continue
        files = sorted(folder.glob("*.mp3"), key=lambda p: p.name.casefold())
        if not files:
            no_audio.append(book)
            continue
        # The item IDs follow the existing index convention, e.g. sf_ezra.
        identifier = book.get("narrationAudioFallbackBaseUrl", "").rstrip("/").rsplit("/", 1)[-1]
        if not identifier:
            identifier = "sf_" + book_id
        plan.append((book, identifier, files))

    print(f"Found {len(plan)} book(s) with MP3 files to upload:")
    for book, identifier, files in plan:
        print(f"  {book['name']} -> {identifier} ({len(files)} MP3 files)")
    if no_audio:
        print(f"No local MP3s yet (skipping {len(no_audio)} book(s); later books will still be checked):")
        for book in no_audio:
            print(f"  {book['name']}")
    if args.dry_run or not plan:
        if args.only and not plan:
            print(f"No MP3 files found for book ID '{args.only}'. Check the folder name.")
            return 1
        return 0

    try:
        from internetarchive import upload
    except ImportError:
        print("Missing dependency. Install it with: python -m pip install -r requirements-upload.txt", file=sys.stderr)
        return 1

    access_key = os.environ.get("IA_ACCESS_KEY", "").strip()
    secret_key = os.environ.get("IA_SECRET_KEY", "").strip()
    if not access_key or not secret_key:
        print("\nEnter your Internet Archive S3 keys (input is hidden).")
        if not access_key:
            access_key = getpass.getpass("Access key: ").strip()
        if not secret_key:
            secret_key = getpass.getpass("Secret key: ").strip()
    if not access_key or not secret_key:
        print("Both keys are required.", file=sys.stderr)
        return 1

    print("\nFor each item, existing Archive.org filenames and the local checkpoint will be checked.")
    print("Only chapter files not already recorded as uploaded will be sent.")
    if input("Type UPLOAD to continue: ").strip() != "UPLOAD":
        print("Cancelled.")
        return 0

    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read upload checkpoint {STATE_PATH}: {exc}", file=sys.stderr)
        return 1

    failures = 0
    for book, identifier, files in plan:
        metadata = {
            "title": f"{book['name']} - World English Bible (Updated) Narration",
            "mediatype": "audio",
            "collection": "opensource_audio",
            "description": (
                f"Chapter-by-chapter audio narration of {book['name']} from the "
                "World English Bible (Updated)."
            ),
            "language": "eng",
            "subject": ["World English Bible", "Bible", "audio narration"],
        }
        print(f"\nChecking {book['name']} on Archive.org ({identifier})...")
        try:
            remote_names = get_remote_filenames(identifier)
            completed = set(state.get(identifier, [])) | remote_names
            pending = [path for path in files if path.name not in completed]
            print(f"{len(completed & {p.name for p in files})} of {len(files)} files already present; {len(pending)} to upload.")
            for path in pending:
                print(f"Uploading {path.name}...")
                response = upload(
                    identifier,
                    # internetarchive 5.x calls str.replace(old, new) on paths;
                    # pass strings because pathlib.Path.replace only accepts a target.
                    [str(path)],
                    metadata=metadata,
                    access_key=access_key,
                    secret_key=secret_key,
                    retries=5,
                    retries_sleep=5,
                    verbose=True,
                )
                responses = response if isinstance(response, list) else [response]
                bad_responses = [
                    result for result in responses
                    if getattr(result, "status_code", 200) >= 400
                ]
                if bad_responses:
                    statuses = ", ".join(str(result.status_code) for result in bad_responses)
                    raise RuntimeError(f"Archive.org returned HTTP {statuses} for {path.name}")
                state.setdefault(identifier, [])
                if path.name not in state[identifier]:
                    state[identifier].append(path.name)
                save_state(state)
            print(f"Finished {book['name']}.")
        except Exception as exc:  # Keep later books moving after a failed item.
            failures += 1
            print(f"FAILED {book['name']} ({identifier}): {exc}", file=sys.stderr)

    print(f"\nUpload run complete: {len(plan) - failures} succeeded, {failures} failed.")
    return 1 if failures else 0


def get_remote_filenames(identifier: str) -> set[str]:
    """Read the public item metadata to find files already on Archive.org."""
    url = f"https://archive.org/metadata/{urllib.parse.quote(identifier, safe='')}"
    request = urllib.request.Request(url, headers={"User-Agent": "bible-narration-uploader/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return set()
        raise RuntimeError(f"Could not check existing Archive.org files (HTTP {exc.code})") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not check existing Archive.org files: {exc}") from exc
    return {entry["name"] for entry in data.get("files", []) if isinstance(entry, dict) and "name" in entry}


def save_state(state: dict[str, list[str]]) -> None:
    """Write the local checkpoint after each confirmed file upload."""
    temporary = STATE_PATH.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, STATE_PATH)


if __name__ == "__main__":
    raise SystemExit(main())
