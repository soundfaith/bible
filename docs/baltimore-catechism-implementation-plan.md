# Baltimore Catechism in Soundfaith: implementation plan

## Implementation status

As of 2026-10-23, the data import, reader, home card, routes, and initial Sofi retrieval path are implemented. Audio remains deferred. The semantic retrieval index was generated from the complete question corpus; retrieval thresholds still need a product review before release. No app build or tests have been run in this implementation pass.

## Goal and scope

Add the Baltimore Catechism as a browsable, searchable, offline-first part of Soundfaith, with a home-page card, a dedicated landing/reader page, and a carefully labeled source for Sofi's answers. The reader will present the historical book structure (edition, preliminary questions, lessons, questions and answers) rather than recasting it as a modern course. This is the Baltimore Catechism, not the Catechism of the Catholic Church (CCC); the interface and Sofi must make that distinction clear.

Initial content scope: Baltimore Catechism Nos. 1, 2, and 3. The source repository also describes Nos. 00, 0, and 4, but does not provide their full texts in the files audited for this work. They are out of scope until separately sourced and reviewed.

## Source audit and completeness

### Torch & Lily

Use the structured data in [Torch & Lily's torch-data repository](https://github.com/joshx2415/torch-data) as a useful cross-check and source of stable record IDs and lesson metadata. Its README reports 3 editions, 82 lesson rows, and 1,721 question/answer rows. The rows use edition IDs, lesson IDs, question numbers, question text, and answer text. They are not complete transcripts of Nos. 1–3.

### Full-text comparison

The corresponding Project Gutenberg e-texts were compared with those structured rows:

| Edition | Complete e-text Q&A count | Torch & Lily Q&A count | Coverage issue |
| --- | ---: | ---: | --- |
| Baltimore Catechism No. 1 | 206 | 54 | 152 Q&As absent; the e-text has 33 lessons while the structured data has 8 lesson rows. No. 1 is intentionally abridged and its question numbers have gaps. |
| Baltimore Catechism No. 2 | 421 | 411 | 10 numbered Q&As absent: 12, 20, 35, 77, 153, 182, 256, 289, 377, and 388. |
| Baltimore Catechism No. 3 | 1,400 | 1,256 | 19 lesson Q&As absent: 171, 179, 274, 375, 515, 565, 630, 641, 711, 722, 775, 867, 1101, 1103, 1107, 1110, 1118, 1212, and 1330. The first 125 preliminary Q&As are also outside Torch & Lily's lesson data. |
| **Total** | **2,027** | **1,721** | **306 missing from the structured dataset.** |

The normalized import compares same-edition, same-number rows against the Gutenberg wording. It finds exact text matches for 48 of No. 1's 54 rows, 383 of No. 2's 411 rows, and 1,099 of No. 3's 1,256 lesson rows; the other matched-number rows have wording differences. Use Gutenberg wording consistently and retain Torch & Lily IDs only as cross-references, with a per-record match flag. The No. 3 transcript itself omits the period after questions 53 and 74 and the usual `A.` marker before the answer to question 630; preserve those source details and annotate the missing answer marker.

The full No. 1 text has 33 lessons, No. 2 has 37, and No. 3 has 37 lessons after its preliminary Q&As. No. 3's edition was supplemented by Rev. Thomas L. Kinkead; the primary text uses braces to associate some No. 3 questions with their No. 2 question numbers. Preserve these source annotations when present and do not invent authorship labels that the source does not provide.

Full-text references:

- [No. 1, Project Gutenberg eBook 14551](https://www.gutenberg.org/ebooks/14551)
- [No. 2, Project Gutenberg eBook 14552](https://www.gutenberg.org/ebooks/14552)
- [No. 3, Project Gutenberg eBook 14553](https://www.gutenberg.org/ebooks/14553)

The e-texts include prayers, hymns, prefatory material, and notes as well as the catechism. The first reader release focuses on the complete numbered Q&A corpus and its edition/lesson hierarchy; ancillary material should only be added in a separate, clearly identified content type. The Gutenberg notices describe US public-domain status; retain attribution and review distribution rights for the jurisdictions in which Soundfaith is distributed.

## Product experience

1. Add a **Baltimore Catechism** card to the home-page collection, linking to `#/catechism`.
2. Add a landing page with a short historical-context note, edition selector for Nos. 1–3, question/lesson totals, search, and a browse-by-lesson list. The copy will state that it is a historical catechism and is distinct from the CCC.
3. The reader will retain the book's numbering and hierarchy: edition → preliminary questions (where applicable) or lesson → question → answer. No. 1's numbering gaps remain as printed; do not renumber the questions.
4. Support direct links such as `#/catechism/3/lesson-first` and `#/catechism/3/q-708`, back navigation, and a question search across editions. Selecting a result opens the correct edition and scrolls to that question.
5. Keep the experience usable offline: ship normalized text as local app data; do not fetch catechism text at runtime. Load the page/data lazily so the data does not inflate the initial home-page bundle unnecessarily.
6. Do not create recorded audio for launch. The complete Q&A corpus is about 107,000 words: roughly 14,100 in No. 1, 21,800 in No. 2, and 71,100 in No. 3. At 145 words per minute that is about 12.3 hours of audio for one voice (about 37 hours for three voices), before prayers, introductions, editing, or retakes. If audio is later desired, first evaluate device/browser speech synthesis as an optional reader control; do not generate and host hundreds of clips as part of this feature.

## Sofi integration

Sofi currently responds from local curated Scripture topics, exact Bible references, and verse search rather than an unrestricted generative model. Add catechism retrieval as another local, attributed source:

1. Build a separate search index over the complete Q&A text, with the question, answer, edition, question number, lesson/preliminary grouping, and source annotation as metadata.
2. Reuse the existing local embedding model and lexical fallback, but load the catechism index only when needed. Keep it separate from the Scripture topic index so it can be audited and maintained independently.
3. Keep the existing exact-reference handling and crisis response precedence. For an ordinary question, compare catechism retrieval with the existing topic/verse results using conservative confidence thresholds. Show a catechism result only when it is a strong match; otherwise preserve today's Sofi behavior.
4. Render a matched Q&A as a clearly attributed historical source: **Baltimore Catechism No. X, question N**, lesson where available, and a link that opens the reader at that question. Do not present it as a CCC quotation or as a claim that the historical source is current Church teaching. Keep Bible passages available as Scripture references where they help answer the user's question.
5. Add retrieval evaluation cases for direct paraphrases, low-confidence unrelated questions, ambiguous doctrinal questions, and overlap with the existing Scripture topic responses. Tune thresholds against those cases before release.

## Data model and implementation order

Normalize the source into a versioned local dataset with stable identifiers. Each edition has its display title, source citation, question count, and ordered groups. Each group is either a preliminary section or a lesson and contains its source number/title plus ordered Q&A records. Each Q&A stores its printed number, verbatim question and answer, optional Torch & Lily ID, and source-note/cross-reference metadata when supplied by the e-text. Preserve source wording and line breaks as paragraphs where meaningful.

Repository artifacts: the pinned source snapshots are under `data/catechism/sources/`; `scripts/catechism/build_data.py` recreates `src/data/catechism.json`; the lazy catechism page lives in `src/pages/CatechismPage.tsx`; shared Q&A lookup and hash links are in `src/lib/catechism.ts`; Sofi's matcher is in `src/lib/chat/catechismSearch.ts`; and `scripts/chat/build-catechism-index.mjs` recreates `public/chat/catechism-index.json` with the same local embedding model used for topic matching. Run `python scripts/catechism/build_data.py` after changing source snapshots and `npm run chat:catechism-index` after changing the normalized corpus.

The generated normalized dataset is about 1.12 MB and the semantic vectors are about 1.06 MB before transport compression. The catechism page is lazy-loaded, and the Sofi index is requested from the chat retrieval path rather than added to the initial app bundle.

Sofi's initial semantic gate is a cosine score of at least `0.74` and a lead of `0.025` over the runner-up. Its offline lexical fallback accepts an exact question or a strong, unambiguous word match. These are conservative starting values; tune them after reviewing representative catechism questions, close alternatives, and unrelated prompts.

Implementation sequence:

1. **Complete and validate data.** Preserve the audited source snapshots and attribution; import complete Gutenberg question/answer text; reconcile it against Torch & Lily by edition and question number; attach lesson headings and source annotations; ensure the expected complete counts (206, 421, 1,400) and report any parse ambiguity instead of silently dropping text.
2. **Build the offline reader.** Add the home card, hash routes, lazy-loaded catechism page, edition/lesson/question navigation, search, direct question links, and historical-source notices.
3. **Connect Sofi.** Generate the separate retrieval index, add high-confidence attributed Q&A replies with reader links, and evaluate against explicit retrieval cases.
4. **Defer audio.** No audio files or narration pipeline are part of this implementation. Consider browser speech only as a later, optional enhancement.

## Acceptance checklist

- All 2,027 numbered Q&A entries from the three full e-texts appear exactly once, with original printed numbering and edition attribution.
- All 33/37/37 lesson headings are available; No. 3's preliminary Q&As remain browsable outside lesson groups.
- Torch & Lily cross-reference IDs are attached where a source record matches, while missing source rows are filled only from the cited full e-text.
- Reader search and deep links identify both edition and printed question number.
- The home card opens the landing page; the experience is locally available offline.
- Sofi cites edition/question/lesson, links into the reader, keeps Bible references and crisis handling intact, and abstains on weak matches.
- No pre-generated audio is included.
