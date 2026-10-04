#!/usr/bin/env python3
"""Upload narration MP3s as one GitHub Release per book."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIO_ROOT = ROOT / "narration" / "male"
INDEX_PATH = ROOT / "src" / "data" / "index.json"
REPOSITORY = "soundfaith/bible"
TAG_PREFIX = "narration-"
MAX_ASSETS = 1000
MAX_ASSET_BYTES = 2 * 1024**3


class GitHubCLIError(RuntimeError):
    pass


def gh(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
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
        raise GitHubCLIError(f"Could not start GitHub CLI (gh): {exc}") from exc
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or f"exit code {result.returncode}"
        raise GitHubCLIError(detail)
    return result


def load_plan() -> list[dict[str, object]]:
    try:
        books = json.loads(INDEX_PATH.read_text(encoding="utf-8"))["books"]
    except (OSError, json.JSONDecodeError, KeyError) as exc:
        raise RuntimeError(f"Could not read {INDEX_PATH}: {exc}") from exc

    names = {book["id"]: book["name"] for book in books}
    if not AUDIO_ROOT.is_dir():
        raise RuntimeError(f"Audio folder not found: {AUDIO_ROOT}")
    loose_mp3s = [path for path in AUDIO_ROOT.iterdir() if path.is_file() and path.suffix.casefold() == ".mp3"]
    if loose_mp3s:
        raise RuntimeError(f"Found MP3 files outside book folders: {loose_mp3s[0]}")

    plan = []
    for folder in sorted((path for path in AUDIO_ROOT.iterdir() if path.is_dir()), key=lambda p: p.name.casefold()):
        files = sorted(
            (path for path in folder.rglob("*") if path.is_file() and path.suffix.casefold() == ".mp3"),
            key=lambda p: (p.name.casefold(), str(p).casefold()),
        )
        if not files:
            continue
        duplicate_names: set[str] = set()
        seen: set[str] = set()
        for path in files:
            normalized_name = path.name.casefold()
            if normalized_name in seen:
                duplicate_names.add(path.name)
            seen.add(normalized_name)
            if path.stat().st_size >= MAX_ASSET_BYTES:
                raise RuntimeError(f"{path} is at least 2 GiB; GitHub release assets must be under 2 GiB.")
        if duplicate_names:
            raise RuntimeError(
                f"{folder.name} has duplicate MP3 basenames ({', '.join(sorted(duplicate_names))}); "
                "GitHub release assets in one release need unique names."
            )
        if len(files) > MAX_ASSETS:
            raise RuntimeError(f"{folder.name} has more than {MAX_ASSETS} MP3 assets for one release.")
        book_name = names.get(folder.name, folder.name.replace("_", " ").title())
        plan.append({
            "book_id": folder.name,
            "book_name": book_name,
            "tag": TAG_PREFIX + folder.name,
            "files": files,
        })
    return plan


def release_view(tag: str) -> dict[str, object] | None:
    result = gh(
        "release", "view", tag, "--repo", REPOSITORY,
        "--json", "tagName,isDraft,isImmutable,assets",
        check=False,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout).lower()
        if "release not found" in message or "not found" in message:
            return None
        raise GitHubCLIError(result.stderr.strip() or result.stdout.strip())
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise GitHubCLIError(f"Could not parse release details for {tag}: {exc}") from exc


def upload_release(book: dict[str, object], replace_existing: bool) -> None:
    tag = str(book["tag"])
    name = str(book["book_name"])
    files = book["files"]
    assert isinstance(files, list)

    release = release_view(tag)
    created_now = release is None
    if created_now:
        print(f"Creating draft release {tag}...")
        gh(
            "release", "create", tag,
            "--repo", REPOSITORY,
            "--title", f"{name} audio narration",
            "--notes", f"Chapter MP3 narration for {name}.",
            "--draft",
        )
        release = release_view(tag)
        if release is None:
            raise GitHubCLIError(f"Draft release {tag} was created but could not be read back.")

    is_draft = bool(release.get("isDraft"))
    is_immutable = bool(release.get("isImmutable"))
    assets = release.get("assets", [])
    existing = {
        str(asset.get("name")): int(asset.get("size", -1))
        for asset in assets if isinstance(asset, dict)
    }

    to_upload: list[Path] = []
    conflicts: list[Path] = []
    for path in files:
        previous_size = existing.get(path.name)
        if previous_size is None:
            to_upload.append(path)
        elif previous_size == path.stat().st_size:
            print(f"  Already present: {path.name}")
        elif replace_existing:
            to_upload.append(path)
            conflicts.append(path)
        else:
            raise GitHubCLIError(
                f"{tag}/{path.name} exists with a different size. "
                "Rerun with --replace-existing to replace it."
            )

    if is_immutable and to_upload:
        raise GitHubCLIError(
            f"Release {tag} is immutable and cannot accept or replace assets. "
            "Create a new release tag for updated audio."
        )

    if to_upload:
        print(f"Uploading {len(to_upload)} MP3 file(s) to {tag}...")
        upload_args = ["release", "upload", tag, *(str(path) for path in to_upload), "--repo", REPOSITORY]
        if conflicts:
            upload_args.append("--clobber")
        gh(*upload_args)
    else:
        print(f"All MP3 files are already present in {tag}.")

    # New releases are created as drafts so interrupted uploads can be resumed.
    # Publish only after all expected assets have been uploaded and verified.
    refreshed = release_view(tag)
    if refreshed is None:
        raise GitHubCLIError(f"Could not verify release {tag} after upload.")
    refreshed_assets = {
        str(asset.get("name")): int(asset.get("size", -1))
        for asset in refreshed.get("assets", []) if isinstance(asset, dict)
    }
    missing_or_wrong = [
        path.name for path in files
        if refreshed_assets.get(path.name) != path.stat().st_size
    ]
    if missing_or_wrong:
        raise GitHubCLIError(
            f"Release verification failed for {tag}; missing or wrong-sized assets: "
            + ", ".join(missing_or_wrong[:12])
        )
    if bool(refreshed.get("isDraft")):
        print(f"Publishing {tag}...")
        gh("release", "edit", tag, "--draft=false", "--repo", REPOSITORY)
    print(f"Finished {name}: {len(files)} MP3 asset(s), {tag}.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create or resume one GitHub Release per book and upload its MP3 files."
    )
    parser.add_argument(
        "--execute", action="store_true",
        help="create releases and upload MP3s (without this flag, only show the plan)",
    )
    parser.add_argument(
        "--replace-existing", action="store_true",
        help="replace a release asset when its filename exists but its size differs",
    )
    args = parser.parse_args()

    try:
        plan = load_plan()
    except Exception as exc:
        print(f"Could not prepare upload plan: {exc}", file=sys.stderr)
        return 1
    if not plan:
        print(f"No MP3 files found under {AUDIO_ROOT}.", file=sys.stderr)
        return 1

    total_files = sum(len(book["files"]) for book in plan)
    total_bytes = sum(path.stat().st_size for book in plan for path in book["files"])
    print(f"GitHub repository: {REPOSITORY}")
    print(f"One release per book: {len(plan)} releases, {total_files} MP3 files, {total_bytes / 1024**3:.2f} GiB total")
    for book in plan:
        print(f"  {book['book_name']} -> {book['tag']} ({len(book['files'])} MP3 files)")
    if not args.execute:
        print("Preview only. Add --execute to upload these MP3s.")
        return 0

    if not shutil.which("gh"):
        print("GitHub CLI (gh) is required. Install it and run 'gh auth login'.", file=sys.stderr)
        return 1

    try:
        gh("auth", "status", "--hostname", "github.com")
    except GitHubCLIError as exc:
        print(f"GitHub CLI authentication failed: {exc}\nRun 'gh auth login' and retry.", file=sys.stderr)
        return 1

    confirm = f"UPLOAD {len(plan)} BOOK RELEASES"
    if input(f"This will create or update public releases in {REPOSITORY}. Type {confirm} to continue: ").strip() != confirm:
        print("Cancelled.")
        return 0

    failures = 0
    for book in plan:
        try:
            upload_release(book, args.replace_existing)
        except Exception as exc:
            failures += 1
            print(f"FAILED {book['book_name']} ({book['tag']}): {exc}", file=sys.stderr)

    print(f"\nUpload run complete: {len(plan) - failures} release(s) succeeded, {failures} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
