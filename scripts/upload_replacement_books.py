#!/usr/bin/env python3
"""Upload four narration books under fresh sfb_* Internet Archive IDs."""

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
BOOK_IDS = ("genesis", "exodus", "2_chronicles", "ecclesiastes")
ITEM_PREFIX = "sfb_"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Upload Genesis, Exodus, 2 Chronicles, and Ecclesiastes under sfb_* item IDs."
    )
    parser.add_argument(
        "--execute", action="store_true",
        help="upload files (without this flag, only show the plan)",
    )
    args = parser.parse_args()

    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"Could not read book list from {INDEX_PATH}: {exc}", file=sys.stderr)
        return 1

    by_id = {book["id"]: book for book in books}
    missing = [book_id for book_id in BOOK_IDS if book_id not in by_id]
    if missing:
        print(f"Book IDs missing from {INDEX_PATH}: {', '.join(missing)}", file=sys.stderr)
        return 1

    plan = []
    for book_id in BOOK_IDS:
        book = by_id[book_id]
        files = sorted((AUDIO_ROOT / book_id).glob("*.mp3"), key=lambda path: path.name.casefold())
        if not files:
            print(f"No chapter MP3s found for {book['name']} in {AUDIO_ROOT / book_id}", file=sys.stderr)
            return 1
        plan.append((book, ITEM_PREFIX + book_id, files))

    print("Replacement upload plan:")
    for book, identifier, files in plan:
        print(f"  {book['name']} -> {identifier} ({len(files)} MP3 files)")
    if not args.execute:
        print("Preview only. Add --execute to continue with the upload.")
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

    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read upload checkpoint {STATE_PATH}: {exc}", file=sys.stderr)
        return 1

    print("\nChecking that each new identifier is available or is an existing partial upload.")
    try:
        for _book, identifier, _files in plan:
            remote_names = get_remote_filenames(identifier)
            if remote_names or state.get(identifier):
                print(f"  {identifier}: existing upload found; will resume missing files.")
                continue
            if not identifier_available(identifier):
                raise RuntimeError(
                    f"{identifier} is already reserved on Archive.org but has no known upload checkpoint/files. "
                    "Refusing to upload into an existing item."
                )
            print(f"  {identifier}: available.")
    except Exception as exc:
        print(f"Preflight failed: {exc}", file=sys.stderr)
        return 1

    print("\nOnly chapter files not already on Archive.org or in the local checkpoint will be uploaded.")
    if input("Type UPLOAD to continue: ").strip() != "UPLOAD":
        print("Cancelled.")
        return 0

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
            print(f"{len(completed & {path.name for path in files})} of {len(files)} files already present; {len(pending)} to upload.")
            for path in pending:
                print(f"Uploading {path.name}...")
                responses = upload(
                    identifier,
                    [str(path)],
                    metadata=metadata,
                    access_key=access_key,
                    secret_key=secret_key,
                    retries=5,
                    retries_sleep=5,
                    verbose=True,
                )
                responses = responses if isinstance(responses, list) else [responses]
                if not responses:
                    raise RuntimeError(f"Archive.org returned no response for {path.name}")
                bad_responses = []
                for response in responses:
                    status = getattr(response, "status_code", 200)
                    body = getattr(response, "text", "").strip()
                    if status >= 400 or "<Error" in body or "AccessDenied" in body:
                        bad_responses.append(f"HTTP {status}: {body[:500]}")
                if bad_responses:
                    raise RuntimeError(f"Upload rejected for {path.name}: {'; '.join(bad_responses)}")
                state.setdefault(identifier, [])
                if path.name not in state[identifier]:
                    state[identifier].append(path.name)
                save_state(state)
            print(f"Finished {book['name']} ({identifier}).")
        except Exception as exc:
            failures += 1
            print(f"FAILED {book['name']} ({identifier}): {exc}", file=sys.stderr)

    print(f"\nReplacement upload run complete: {len(plan) - failures} succeeded, {failures} failed.")
    return 1 if failures else 0


def get_remote_filenames(identifier: str) -> set[str]:
    url = f"https://archive.org/metadata/{urllib.parse.quote(identifier, safe='')}"
    request = urllib.request.Request(url, headers={"User-Agent": "bible-narration-uploader/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return set()
        raise RuntimeError(f"Could not check {identifier} on Archive.org (HTTP {exc.code})") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not check {identifier} on Archive.org: {exc}") from exc
    return {
        entry["name"] for entry in data.get("files", [])
        if isinstance(entry, dict) and "name" in entry
    }


def identifier_available(identifier: str) -> bool:
    query = urllib.parse.urlencode({"output": "json", "identifier": identifier})
    url = f"https://archive.org/services/check_identifier.php?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "bible-narration-uploader/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not check availability of {identifier}: {exc}") from exc
    return data.get("code") == "available"


def save_state(state: dict[str, list[str]]) -> None:
    temporary = STATE_PATH.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, STATE_PATH)


if __name__ == "__main__":
    raise SystemExit(main())
