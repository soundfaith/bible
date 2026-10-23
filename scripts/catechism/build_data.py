#!/usr/bin/env python3
"""Build Soundfaith's complete, normalized Baltimore Catechism dataset.

The Gutenberg e-texts are the complete text source. Torch & Lily rows are used
for stable cross-reference IDs and as a completeness cross-check only.
"""

from __future__ import annotations

import gzip
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "data" / "catechism" / "sources"
OUTPUT = ROOT / "src" / "data" / "catechism.json"
EXPECTED_QUESTIONS = {1: 206, 2: 421, 3: 1400}
EXPECTED_LESSONS = {1: 33, 2: 37, 3: 37}
ORDINALS = [
    "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH",
    "ELEVENTH", "TWELFTH", "THIRTEENTH", "FOURTEENTH", "FIFTEENTH", "SIXTEENTH", "SEVENTEENTH",
    "EIGHTEENTH", "NINETEENTH", "TWENTIETH", "TWENTY-FIRST", "TWENTY-SECOND", "TWENTY-THIRD",
    "TWENTY-FOURTH", "TWENTY-FIFTH", "TWENTY-SIXTH", "TWENTY-SEVENTH", "TWENTY-EIGHTH",
    "TWENTY-NINTH", "THIRTIETH", "THIRTY-FIRST", "THIRTY-SECOND", "THIRTY-THIRD", "THIRTY-FOURTH",
    "THIRTY-FIFTH", "THIRTY-SIXTH", "THIRTY-SEVENTH",
]
ORDINAL_NUMBERS = {ordinal: index + 1 for index, ordinal in enumerate(ORDINALS)}
# The No. 1 e-text prints "NINTEENTH" (missing the second E) for lesson 19.
# Keep its printed heading in the generated source metadata while grouping it
# in its unambiguous ordinal position.
ORDINAL_NUMBERS["NINTEENTH"] = 19

EDITION_INFO = {
    1: (14551, "Baltimore Catechism No. 1", "For First Communion Classes"),
    2: (14552, "Baltimore Catechism No. 2", "For Confirmation Classes"),
    3: (14553, "Baltimore Catechism No. 3", "For a Two Years' Course for Post-Confirmation Classes"),
}


def read_gutenberg(number: int) -> str:
    ebook_id, _, _ = EDITION_INFO[number]
    source = (SOURCES / f"gutenberg-{ebook_id}.txt").read_text(encoding="utf-8")
    marker = re.search(r"\*\*\* START OF THE PROJECT GUTENBERG EBOOK .*?\*\*\*", source, re.I)
    if not marker:
        raise ValueError(f"Could not find Gutenberg start marker for No. {number}")
    return source[marker.end():]


def read_torch_lily() -> tuple[list[dict], list[dict], list[dict]]:
    def load(name: str) -> list[dict]:
        with gzip.open(SOURCES / name, "rt", encoding="utf-8") as handle:
            return json.load(handle)

    return (
        load("catechism_versions.json.gz"),
        load("catechism_lessons.json.gz"),
        load("catechism_questions.json.gz"),
    )


def clean_text(value: str) -> str:
    paragraphs = []
    for paragraph in re.split(r"\n\s*\n", value.strip()):
        lines = [re.sub(r"\s+", " ", line).strip() for line in paragraph.splitlines()]
        text = " ".join(line for line in lines if line)
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def lesson_heads(text: str) -> list[dict]:
    heads = []
    pattern = re.compile(r"(?m)^\s*LESSON\s+([A-Z]+(?:-[A-Z]+)?)\.?\s*$")
    for match in pattern.finditer(text):
        ordinal = match.group(1)
        if ordinal not in ORDINAL_NUMBERS:
            continue
        title = ""
        for line in text[match.end():].splitlines():
            if line.strip():
                title = line.strip().rstrip(".")
                break
        heads.append({
            "position": match.start(),
            "number": ORDINAL_NUMBERS[ordinal],
            "id": f"lesson-{ORDINAL_NUMBERS[ordinal]}",
            "title": title,
            "printedHeading": match.group(0).strip(),
        })
    return heads


def extract_questions(number: int, text: str) -> list[dict]:
    if number == 3:
        # The Gutenberg transcript omits the period after the printed numbers
        # for Q. 53 and Q. 74; accept either the usual "Q. 1." or "Q. 53 " form.
        marker = re.compile(r"(?m)^[ \t]*Q\.[ \t]*(\d+)\.?[ \t]+(?:\{([^}\n]+)\}[ \t]*)?(.*)$")
    else:
        marker = re.compile(r"(?m)^\s*(\d+)\.\s*Q\.\s*(.*)$")

    matches = list(marker.finditer(text))
    records = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.end():end]
        # The next lesson heading occurs between the last answer in one lesson
        # and the next question. It belongs to the group, not that answer.
        block = re.split(r"(?m)^\s*LESSON\s+", block, maxsplit=1)[0]
        question_number = int(match.group(1))
        initial_question = match.group(3) if number == 3 else match.group(2)
        combined = f"{initial_question}\n{block}"
        answer_start = re.search(r"(?m)^\s*A\.\s*", combined)
        if not answer_start:
            # The Gutenberg No. 3 transcript has a missing "A." before the
            # answer to Q. 630. Its question fits on the marker line, so keep
            # the answer verbatim and surface the source omission as metadata.
            if number != 3 or question_number != 630:
                raise ValueError(f"No answer marker in No. {number}, question {question_number}")
            question = clean_text(initial_question)
            answer = clean_text(block)
            answer_label_omitted = True
        else:
            question = clean_text(combined[:answer_start.start()])
            answer = clean_text(combined[answer_start.end():])
            answer_label_omitted = False
        if not question or not answer:
            raise ValueError(f"Empty question or answer in No. {number}, question {question_number}")

        record = {
            "id": f"no-{number}-q-{question_number}",
            "number": question_number,
            "question": question,
            "answer": answer,
        }
        if number == 3 and match.group(2):
            record["sourceAnnotation"] = match.group(2).strip()
            if record["sourceAnnotation"].isdigit():
                record["parallelNo2Question"] = int(record["sourceAnnotation"])
        if answer_label_omitted:
            record["sourceNote"] = "The source e-text omits the usual A. label before this answer."
        if number == 3 and question_number in (53, 74):
            record["sourceNote"] = "The source e-text omits the period after this question number."
        records.append({"position": match.start(), "record": record})
    return records


def build() -> dict:
    versions, source_lessons, source_questions = read_torch_lily()
    if len(versions) != 3:
        raise ValueError(f"Expected 3 Torch & Lily versions, found {len(versions)}")

    torch_rows = {
        (row["version_id"], row["number"]): row
        for row in source_questions
    }
    torch_lesson_rows = {
        (row["version_id"], row["number"]): row
        for row in source_lessons
    }
    editions = []
    comparison = []

    for number, (ebook_id, title, audience) in EDITION_INFO.items():
        full_text = read_gutenberg(number)
        headings = lesson_heads(full_text)
        records = extract_questions(number, full_text)
        if len(records) != EXPECTED_QUESTIONS[number]:
            raise ValueError(f"No. {number}: expected {EXPECTED_QUESTIONS[number]} Q&As, parsed {len(records)}")
        printed_numbers = [parsed["record"]["number"] for parsed in records]
        if len(set(printed_numbers)) != len(printed_numbers):
            raise ValueError(f"No. {number}: duplicate printed question numbers found")
        if number in (2, 3) and printed_numbers != list(range(1, EXPECTED_QUESTIONS[number] + 1)):
            raise ValueError(f"No. {number}: printed question numbering is incomplete or out of order")
        if len(headings) != EXPECTED_LESSONS[number]:
            raise ValueError(f"No. {number}: expected {EXPECTED_LESSONS[number]} lessons, parsed {len(headings)}")

        groups = []
        if number == 3:
            groups.append({
                "id": "preliminary-questions",
                "kind": "preliminary",
                "number": None,
                "title": "Preliminary Questions",
                "questions": [],
            })
        for heading in headings:
            group = {
                "id": heading["id"],
                "kind": "lesson",
                "number": heading["number"],
                "title": heading["title"],
                "printedHeading": heading["printedHeading"],
                "questions": [],
            }
            torch_lesson = torch_lesson_rows.get((number, heading["number"]))
            if torch_lesson:
                group["torchLilyId"] = torch_lesson["id"]
                group["torchLilyTitle"] = torch_lesson["title"]
            groups.append(group)

        lesson_by_id = {group["id"]: group for group in groups}
        exact_matches = 0
        mismatches = 0
        missing = []
        for parsed in records:
            record = parsed["record"]
            preceding = [head for head in headings if head["position"] < parsed["position"]]
            if preceding:
                group_id = preceding[-1]["id"]
            elif number == 3:
                group_id = "preliminary-questions"
            else:
                raise ValueError(f"No. {number}, question {record['number']} appears before its first lesson")
            row = torch_rows.get((number, record["number"]))
            if row is None:
                missing.append(record["number"])
            else:
                record["torchLilyId"] = row["id"]
                question_matches = normalized(row["question"]) == normalized(record["question"])
                answer_matches = normalized(row["answer"]) == normalized(record["answer"])
                record["torchLilyTextMatches"] = question_matches and answer_matches
                if record["torchLilyTextMatches"]:
                    exact_matches += 1
                else:
                    mismatches += 1
            lesson_by_id[group_id]["questions"].append(record)

        editions.append({
            "number": number,
            "id": f"no-{number}",
            "title": title,
            "audience": audience,
            "gutenbergEbookId": ebook_id,
            "sourceUrl": f"https://www.gutenberg.org/ebooks/{ebook_id}",
            "note": "Supplemented by Rev. Thomas L. Kinkead." if number == 3 else None,
            "questionCount": len(records),
            "lessonCount": len(headings),
            "groups": groups,
        })
        comparison.append({
            "edition": number,
            "parsedQuestionCount": len(records),
            "lessonCount": len(headings),
            "torchLilyLessonCount": sum(1 for row in source_lessons if row["version_id"] == number),
            "torchLilyQuestionCount": sum(1 for key in torch_rows if key[0] == number),
            "missingFromTorchLily": missing,
            "torchLilyTextMatches": exact_matches,
            "torchLilyTextDifferences": mismatches,
        })

    source_lesson_counts = {version: sum(1 for row in source_lessons if row["version_id"] == version) for version in (1, 2, 3)}
    for edition in editions:
        if source_lesson_counts[edition["number"]] > edition["lessonCount"]:
            raise ValueError(f"Torch & Lily lesson count unexpectedly exceeds complete edition {edition['number']}")

    return {
        "schemaVersion": 1,
        "title": "Baltimore Catechism",
        "context": "Historical Baltimore Catechism editions; distinct from the Catechism of the Catholic Church (CCC).",
        "sources": {
            "torchLily": "https://github.com/joshx2415/torch-data",
            "fullTextCollection": "Project Gutenberg eBooks 14551, 14552, and 14553",
            "attribution": "Question and answer wording follows the cited Project Gutenberg e-texts. Torch & Lily IDs are cross-references, not the completeness source.",
            "rightsNote": "Project Gutenberg describes these texts as public domain in the United States. Review applicable distribution rights by jurisdiction.",
        },
        "sourceComparison": comparison,
        "editions": editions,
    }


if __name__ == "__main__":
    dataset = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(edition["questionCount"] for edition in dataset["editions"])
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: {total} Q&As in {len(dataset['editions'])} editions")
    for row in dataset["sourceComparison"]:
        print(
            f"No. {row['edition']}: {row['parsedQuestionCount']} questions, {row['lessonCount']} lessons, "
            f"{row['torchLilyLessonCount']} Torch & Lily lesson rows, "
            f"{row['torchLilyQuestionCount']} Torch & Lily rows, {len(row['missingFromTorchLily'])} absent, "
            f"{row['torchLilyTextMatches']} exact text matches, {row['torchLilyTextDifferences']} text differences"
        )
