#!/usr/bin/env python3
"""Generate Bible chapter narration locally with Kokoro-82M.

Install dependencies with: python -m pip install kokoro soundfile
Audio is written under narration/<male-or-female>/<book>/<chapter>.wav.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
OUT = ROOT / "narration"
BOOKS_INDEX = DATA / "index.json"
SAMPLES = [("genesis", 1), ("psalms", 23), ("john", 1)]
PREVIEW_TEXT = 'In the beginning, God created the heavens and the earth. God said, "Let there be light," and there was light. God saw that the light was good.'
VOICES = {
    "af_alloy": "American female", "af_aoede": "American female",
    "af_bella": "American female", "af_heart": "American female",
    "af_jessica": "American female", "af_kore": "American female",
    "af_nicole": "American female", "af_nova": "American female",
    "af_river": "American female", "af_sarah": "American female",
    "af_sky": "American female", "am_adam": "American male",
    "am_echo": "American male", "am_eric": "American male",
    "am_fenrir": "American male", "am_liam": "American male",
    "am_michael": "American male", "am_onyx": "American male",
    "am_puck": "American male", "bf_alice": "British female",
    "bf_emma": "British female", "bf_isabella": "British female",
    "bf_lily": "British female", "bm_daniel": "British male",
    "bm_fable": "British male", "bm_george": "British male",
    "bm_lewis": "British male",
}


def parse_chapter(value: str) -> tuple[str, int]:
    try:
        book, chapter = value.rsplit(":", 1)
        return book.strip().lower().replace(" ", "_").replace("-", "_"), int(chapter)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Expected BOOK:CHAPTER, e.g. john:3") from error


def load_chapter(book_id: str, chapter: int) -> tuple[str, str]:
    path = DATA / f"{book_id}.json"
    if not path.exists():
        raise ValueError(f"Unknown book {book_id!r}; no {path.name} in src/data")
    book = json.loads(path.read_text(encoding="utf-8"))
    verses = [verse for verse in book["verses"] if verse["chapter"] == chapter]
    if not verses:
        raise ValueError(f"{book.get('name', book_id)} has no chapter {chapter}")
    text = "\n\n".join(verse["text"].strip() for verse in verses if verse["text"].strip())
    return book.get("name", book_id), text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample", action="store_true", help="Generate Genesis 1, Psalms 23, and John 1")
    parser.add_argument("--book", action="append", help="Generate every chapter in this book; repeat for multiple books (e.g. --book genesis --book exodus)")
    parser.add_argument("--all-books", action="store_true", help="Generate every book listed in src/data/index.json")
    parser.add_argument("--chapter", action="append", type=parse_chapter, help="Chapter as book-id:number; repeat as needed")
    parser.add_argument("--voice", action="append", choices=sorted(VOICES), help="Kokoro voice; repeat to compare (default: af_heart and am_michael)")
    parser.add_argument("--list-voices", action="store_true", help="List built-in English Kokoro voices")
    parser.add_argument("--voice-previews", action="store_true", help="Create a short Genesis clip for every built-in English voice")
    parser.add_argument("--speed", type=float, default=0.94, help="Speech speed; 1.0 is the model default")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    if args.list_voices:
        for voice, description in VOICES.items():
            print(f"{voice:14} {description}")
        return 0
    if args.voice_previews and (args.sample or args.chapter or args.book or args.all_books):
        parser.error("--voice-previews cannot be combined with --sample, --book, --all-books, or --chapter")
    if args.voice_previews and args.voice:
        parser.error("--voice-previews uses every voice automatically; omit --voice")
    if args.chapter and (args.sample or args.book or args.all_books):
        parser.error("use --chapter by itself, or choose --sample, --book, or --all-books")
    selection_count = sum(bool(x) for x in (args.sample, args.book, args.all_books))
    if selection_count > 1:
        parser.error("choose only one of --sample, --book, or --all-books")
    chapters = list(SAMPLES) if args.sample else list(args.chapter or [])
    selected_books = args.book
    if args.all_books:
        index = json.loads(BOOKS_INDEX.read_text(encoding="utf-8"))
        selected_books = [book["id"] for book in index["books"]]
    if selected_books:
        for book_id in selected_books:
            path = DATA / f"{book_id}.json"
            if not path.exists():
                parser.error(f"unknown book {book_id!r}; use a book id such as genesis or 1_samuel")
            book = json.loads(path.read_text(encoding="utf-8"))
            chapters.extend((book_id, n) for n in sorted({v["chapter"] for v in book["verses"]}))
    if not args.voice_previews and not chapters:
        parser.error("choose --sample, one or more --book BOOK_ID values, --all-books, or --chapter BOOK:NUMBER")
    if not 0.5 <= args.speed <= 1.5:
        parser.error("--speed must be between 0.5 and 1.5")
    voices = list(VOICES) if args.voice_previews else (args.voice or ["af_heart", "am_michael"])

    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as error:
        print("Kokoro dependencies are missing. Install them with: python -m pip install kokoro soundfile", file=sys.stderr)
        print(f"Import detail: {error}", file=sys.stderr)
        return 2

    try:
        # Keep one pipeline per English accent: "a" is US and "b" is UK.
        pipelines = {}
        if args.voice_previews:
            dest_dir = OUT / "voice-previews"
            dest_dir.mkdir(parents=True, exist_ok=True)
            for voice in voices:
                dest = dest_dir / f"{voice}.wav"
                if dest.exists() and not args.overwrite:
                    print(f"Skip existing {dest.relative_to(ROOT)} (use --overwrite to replace)")
                    continue
                print(f"Previewing {voice} ({VOICES[voice]})...")
                language = voice[0]
                if language not in pipelines:
                    pipelines[language] = KPipeline(lang_code=language)
                audio_parts = [audio.numpy() for _, _, audio in pipelines[language](PREVIEW_TEXT, voice=voice, speed=args.speed, split_pattern=r"\n+") if audio is not None]
                if not audio_parts:
                    raise RuntimeError(f"Kokoro returned no preview audio for voice {voice}")
                temp = dest.with_suffix(".tmp.wav")
                sf.write(temp, np.concatenate(audio_parts), 24000, subtype="PCM_16")
                temp.replace(dest)
            index_path = dest_dir / "voices.txt"
            index_path.write_text("\n".join(f"{voice}\t{description}\t{PREVIEW_TEXT}" for voice, description in VOICES.items()) + "\n", encoding="utf-8")
            print(f"Saved {len(voices)} voice previews under {dest_dir.relative_to(ROOT)}")
            return 0
        for book_id, chapter in chapters:
            book_name, text = load_chapter(book_id, chapter)
            counts_by_gender = {
                gender: sum(1 for voice in voices if gender in VOICES[voice])
                for gender in ("male", "female")
            }
            for voice in voices:
                gender_folder = "female" if "female" in VOICES[voice] else "male"
                chapter_dir = OUT / gender_folder / book_id
                chapter_dir.mkdir(parents=True, exist_ok=True)
                voice_suffix = f"-{voice}" if counts_by_gender[gender_folder] > 1 else ""
                dest = chapter_dir / f"{chapter}{voice_suffix}.wav"
                if dest.exists() and not args.overwrite:
                    print(f"Skip existing {dest.relative_to(ROOT)} (use --overwrite to replace)")
                    continue
                print(f"{book_name} {chapter}: generating {voice} ({VOICES[voice]})...")
                language = voice[0]
                if language not in pipelines:
                    pipelines[language] = KPipeline(lang_code=language)
                audio_parts = [audio.numpy() for _, _, audio in pipelines[language](text, voice=voice, speed=args.speed, split_pattern=r"\n+") if audio is not None]
                if not audio_parts:
                    raise RuntimeError(f"Kokoro returned no audio for {book_name} {chapter} with voice {voice}")
                audio = np.concatenate(audio_parts)
                temp = dest.with_suffix(".tmp.wav")
                sf.write(temp, audio, 24000, subtype="PCM_16")
                temp.replace(dest)
                print(f"  Saved {dest.relative_to(ROOT)}")
    except (RuntimeError, ValueError, OSError, json.JSONDecodeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
