import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const topicsDir = join(root, "src", "data", "chat", "topics");
const dataDir = join(root, "src", "data");

export function loadTopics() {
  return readdirSync(topicsDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .flatMap((file) => JSON.parse(readFileSync(join(topicsDir, file), "utf8")).map((topic) => ({ ...topic, file })));
}

const books = JSON.parse(readFileSync(join(dataDir, "index.json"), "utf8")).books;
const bookCache = new Map();
function bookVerses(id) {
  if (!bookCache.has(id)) {
    const verses = JSON.parse(readFileSync(join(dataDir, `${id}.json`), "utf8")).verses;
    bookCache.set(id, new Set(verses.map((verse) => `${verse.chapter}:${verse.verse}`)));
  }
  return bookCache.get(id);
}

export function missingVerses(ref) {
  const match = ref.replace(/^Psalm /, "Psalms ").match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return [`unparseable "${ref}"`];
  const book = books.find((item) => item.name === match[1]);
  if (!book) return [`unknown book "${match[1]}"`];
  const available = bookVerses(book.id);
  const start = Number(match[3]);
  const end = Number(match[4] ?? match[3]);
  const missing = [];
  for (let verse = start; verse <= end; verse += 1) if (!available.has(`${match[2]}:${verse}`)) missing.push(`${ref} (verse ${verse} not found)`);
  return missing;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const topics = loadTopics();
  const ids = new Set();
  const errors = [];
  for (const topic of topics) {
    if (ids.has(topic.id)) errors.push(`duplicate id ${topic.id}`);
    ids.add(topic.id);
  }
  for (const topic of topics) {
    const where = `${topic.file}:${topic.id}`;
    for (const field of ["id", "title", "category", "intro"]) if (!topic[field]) errors.push(`${where} missing ${field}`);
    if (!Array.isArray(topic.phrasings) || topic.phrasings.length < 5) errors.push(`${where} needs at least 5 phrasings`);
    if (!Array.isArray(topic.verses) || topic.verses.length < 3) errors.push(`${where} needs at least 3 verses`);
    for (const verse of topic.verses ?? []) {
      const ref = typeof verse === "string" ? verse : verse.ref;
      if (topic.tier === 1 && typeof verse === "string") errors.push(`${where} tier 1 verses need a "why"`);
      errors.push(...missingVerses(ref).map((problem) => `${where} ${problem}`));
    }
    for (const related of topic.related ?? []) if (!ids.has(related)) errors.push(`${where} related id "${related}" does not exist`);
  }
  const allPhrasings = new Map();
  for (const topic of topics) for (const phrasing of topic.phrasings ?? []) {
    const key = phrasing.toLowerCase();
    if (allPhrasings.has(key) && allPhrasings.get(key) !== topic.id) errors.push(`phrasing "${phrasing}" used by ${allPhrasings.get(key)} and ${topic.id}`);
    allPhrasings.set(key, topic.id);
  }
  console.log(`${topics.length} topics, ${allPhrasings.size} unique phrasings`);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("Topics OK");
}
