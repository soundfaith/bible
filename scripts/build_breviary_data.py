"""One-time import of breviary data (seasons, saints, canticles, readings, reflections)
from the simplified breviary project into src/data/breviary.json.

Usage: python scripts/build_breviary_data.py [--source D:\\projects\\breviary\\frontend]
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "breviary.json"

CANTICLES = [
    "song_of_zechariah", "song_of_mary", "song_of_simeon",
    "ephesians_1", "philippians_2", "colossians_1", "first_peter_2",
    "revelation_4_5", "revelation_11_12", "revelation_15",
]
OPENING = "O God, come to my assistance. O Lord, make haste to help me."
NIGHT_PRAYER = (
    "Visit this dwelling, Lord, and keep far from it every snare of the enemy. "
    "May your holy angels dwell here to preserve us in peace, and may your blessing be upon us always."
)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def strip_verse_numbers(text: str) -> str:
    lines = [re.sub(r"^\d+:\d+\.\s*", "", re.sub(r"^\d+\.\s*", "", line.strip())) for line in text.splitlines()]
    return " ".join(line for line in lines if line)


def unescape(value: str) -> str:
    return value.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")


def reference_text(reference: str) -> str:
    match = re.match(r"^(.+?)\s+(\d+):(.*)$", reference.replace("\u2013", "-").replace("\u2014", "-"))
    if not match:
        raise SystemExit(f"cannot parse reference {reference}")
    name = match.group(1).strip().lower().replace(" ", "_")
    book_id = "psalms" if name in ("psalm", "psalms") else name
    path = ROOT / "src" / "data" / f"{book_id}.json"
    if not path.exists():
        raise SystemExit(f"unknown book for {reference}")
    wanted: set[int] = set()
    for rng in re.findall(r"\d+[a-z]?(?:-\d+[a-z]?)?", match.group(3)):
        parts = rng.split("-")
        start = int("".join(ch for ch in parts[0] if ch.isdigit()))
        end = int("".join(ch for ch in parts[-1] if ch.isdigit()))
        wanted.update(range(start, end + 1))
    verses = read_json(path)["verses"]
    text = " ".join(v["text"].strip() for v in verses if v["chapter"] == int(match.group(2)) and v["verse"] in wanted)
    if not text:
        raise SystemExit(f"no text for {reference}")
    return text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=r"D:\projects\breviary\frontend")
    src = Path(parser.parse_args().source)
    data = src / "data"

    seasons = {}
    for season in read_json(data / "seasons.json")["seasons"].values():
        seasons[season["id"]] = {
            "name": season["name"],
            "antiphon": season["antiphon"]["text"],
            "shortPrayer": season["shortPrayer"]["text"],
            "intercessions": season["intercessions"]["text"],
            "concludingPrayer": season["concludingPrayer"]["text"],
        }

    saints = [
        {k: s[k] for k in ("id", "name", "date", "rank", "shortBiography", "antiphon", "intercession", "concludingPrayer")}
        for s in read_json(data / "saints.json")["saints"]
    ]

    canticles = {}
    for cid in CANTICLES:
        item = read_json(data / "library" / "canticles" / f"{cid}.json")
        canticles[cid] = {"reference": item["reference"], "text": strip_verse_numbers(item["text"])}

    blessings = {}
    for hour in ("lauds", "vespers", "compline"):
        blessings[hour] = read_json(data / "library" / "blessings" / f"blessing_{hour}.json")["text"]

    cycle = (src / "src" / "readingCycle.ts").read_text(encoding="utf-8")
    block = cycle[cycle.index("const weeks"):cycle.index("const baseWeeks")]
    str_re = r'"((?:[^"\\]|\\.)*)"'
    rows = re.findall(rf"\[{str_re},{str_re},{str_re}\]", block)
    readings = [{"theme": unescape(t), "reference": unescape(r), "text": reference_text(unescape(r))} for t, r, _ in rows]

    refl = (src / "src" / "reflections.ts").read_text(encoding="utf-8")
    by_psalm = {}
    for number, text in re.findall(r"^  (\d+): '(.*)',$", refl, re.M):
        by_psalm[number] = unescape(text)
    fallback = re.search(r"fallback[^']*'(.*)'", refl)
    fallback_text = unescape(fallback.group(1)) if fallback else (
        "Let this psalm gather your attention and turn it toward God. Carry one line of prayer into the next ordinary task."
    )

    payload = {
        "opening": OPENING,
        "nightPrayer": NIGHT_PRAYER,
        "blessings": blessings,
        "seasons": seasons,
        "saints": saints,
        "canticles": canticles,
        "complinePsalm91": {"reference": "Psalm 91:1-6", "text": reference_text("Psalm 91:1-6")},
        "readings": readings,
        "reflections": {"byPsalm": by_psalm, "fallback": fallback_text},
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"seasons={len(seasons)} saints={len(saints)} canticles={len(canticles)} readings={len(readings)} reflections={len(by_psalm)}")


if __name__ == "__main__":
    main()



