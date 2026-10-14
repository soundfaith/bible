# Prompt: expand the chat topics

Paste everything below the line into Copilot Desktop (agent mode, workspace = this repo).

---

You are extending the curated topic library of the Bible app's chat assistant. The assistant does NOT generate text. A semantic matcher maps a user's question to one curated topic, and the app returns that topic's `intro` and verses. Quality of the curated content is everything.

## Task
Add **N new topics** (replace N, e.g. 40) for the category: **<CATEGORY>** (e.g. "Old Testament stories", "Catholic practices and prayers", "Saints and feast days", "Christian living", "Hard questions and doubts", "Bible figures", "Church teaching").
Write them in a NEW file `src/data/chat/topics/<category-kebab>.json`. Never edit other files' topics, except to add `related` links. First read `src/data/chat/topics/catholic-bible.json` and `top20.json` for format and tone, and list all existing ids/titles so you don't duplicate any topic.

## Schema (array of objects)
```json
{
  "id": "kebab-case-unique",
  "title": "Short title shown to the user",
  "category": "Same category label per file",
  "tier": 2,
  "intro": "2-4 sentences, original wording, warm Catholic tone.",
  "phrasings": ["8+ real user questions, different wording each"],
  "verses": ["Book C:V", "Book C:V-V", "..."],
  "related": ["existing-topic-id"]
}
```
- Tier 2 verses are plain strings. Use 4-6 verses. (Tier 1 uses `{ "ref": "...", "why": "..." }`; use it only for the most common questions.)
- Book names must exactly match `src/data/index.json` (e.g. "Psalms", "Song of Solomon", "1 Corinthians", "Sirach", "Wisdom", "2 Maccabees"). Verse numbers must exist in the WEB text in `src/data/`. Prefer ranges of 1-4 verses; the best, most on-point verse first.
- `related`: 2-4 ids that really exist.

## Phrasing rules (most important for accuracy)
- Write how real people type: first person, casual, emotional, short, sometimes misspelled-free but informal ("my dad left and I can't stop being angry", "is it a sin to...", "what does the Bible say about...").
- Mix: direct question, feeling statement, scenario, keyword-ish ("tattoos bible"), and a Catholic-specific wording where relevant.
- Each phrasing must be globally unique across ALL topic files (the validator rejects duplicates).
- Phrasings must clearly belong to this topic and not be better answered by a neighbouring topic. If two topics overlap, make their phrasings distinct or merge them.

## Content rules
- Catholic perspective, faithful to the Catechism, gentle and pastoral. Do not invent quotes, saints' sayings, or doctrine. If unsure, stay general.
- Sensitive topics (suicide, abuse, self-harm, abortion, sexuality, divorce): compassionate, no condemnation of the person, and include a note to seek a priest/trusted person; for crisis topics mention calling or texting 988 (US) or local emergency services.
- Do not claim to be an AI that reasons. Intros are static text.
- Verse text is NOT written by you; only references.

## Workflow (run in the terminal, from repo root, after each batch of ~20-30 topics)
1. `npm run chat:validate` - fix every error (unknown verse, duplicate phrasing, missing related id).
2. `npm run chat:index` - rebuilds `public/chat/index.json` (takes about a minute).
3. `npm run chat:eval` - must not regress below the current top-1/top-3 numbers. Then add 5-10 NEW unseen test questions for your topics to `scripts/chat/eval.mjs` (in the on-topic list as `[question, expectedId]`). If a question maps to the wrong topic, fix the phrasings (not the test) or merge overlapping topics.
4. `npm run build` must pass.

Work in batches by sub-theme, report after each batch: topics added, validator result, eval numbers, and any overlaps you resolved. Commit the new topic file, `public/chat/index.json` and the eval changes together.
