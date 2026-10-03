#!/usr/bin/env python3
"""Delete the 15 manually uploaded Archive.org book items."""

from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "src" / "data" / "index.json"
STATE_PATH = ROOT / ".archive_upload_state.json"
BOOK_IDS = {
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
    "joshua", "judges", "ruth", "1_samuel", "2_samuel", "1_kings",
    "2_kings", "1_chronicles", "2_chronicles", "ecclesiastes",
}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Delete the 15 manually uploaded Archive.org book items using IDs from the project index."
    )
    parser.add_argument(
        "--execute", action="store_true",
        help="perform deletion (without this flag, only show the plan)",
    )
    args = parser.parse_args()

    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        print(f"Could not read book list from {INDEX_PATH}: {exc}", file=sys.stderr)
        return 1

    books_by_id = {book["id"]: book for book in books}
    missing_ids = BOOK_IDS - books_by_id.keys()
    if missing_ids:
        print(f"Book index is missing expected IDs: {sorted(missing_ids)}", file=sys.stderr)
        return 1

    candidates = []
    for book in books:
        if book["id"] not in BOOK_IDS:
            continue
        identifier = book.get("narrationAudioBaseUrl", "").rstrip("/").rsplit("/", 1)[-1]
        if not identifier:
            print(f"No Archive.org item ID found for {book['name']} in the index.", file=sys.stderr)
            return 1
        candidates.append((book, identifier))

    print(f"{'Deletion plan' if args.execute else 'Preview only'}: {len(candidates)} indexed Archive.org items")
    for book, identifier in candidates:
        print(f"  {book['name']} -> {identifier}")

    if not args.execute:
        print("No changes made. Add --execute to delete these items.")
        return 0

    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read upload checkpoint {STATE_PATH}: {exc}", file=sys.stderr)
        return 1

    try:
        from internetarchive import delete
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

    confirmation = "DELETE 15 ITEMS"
    if input(f"This permanently deletes files in all listed items. Type {confirmation} to continue: ").strip() != confirmation:
        print("Cancelled.")
        return 0

    failures = 0
    for book, identifier in candidates:
        print(f"\nDeleting {book['name']} ({identifier})...")
        try:
            responses = delete(
                identifier,
                access_key=access_key,
                secret_key=secret_key,
                cascade_delete=True,
                verbose=True,
            )
            responses = responses if isinstance(responses, list) else [responses]
            bad_responses = [
                response for response in responses
                if getattr(response, "status_code", 200) >= 400
            ]
            if bad_responses:
                statuses = ", ".join(str(response.status_code) for response in bad_responses)
                raise RuntimeError(f"Archive.org returned HTTP {statuses}")
            state.pop(identifier, None)
            save_state(state)
            print(f"Deleted {book['name']}; removed its local upload checkpoint.")
        except Exception as exc:
            failures += 1
            print(f"FAILED {book['name']} ({identifier}): {exc}", file=sys.stderr)

    print(f"\nDeletion run complete: {len(candidates) - failures} succeeded, {failures} failed.")
    return 1 if failures else 0


def save_state(state: dict[str, list[str]]) -> None:
    temporary = STATE_PATH.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, STATE_PATH)


if __name__ == "__main__":
    raise SystemExit(main())
