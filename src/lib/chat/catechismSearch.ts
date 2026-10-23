import type { CatechismEdition, CatechismGroup, CatechismQuestion } from "../catechism";

type CatechismIndex = { schemaVersion: number; model: string; dim: number; owners: string[]; vectors: string };
type LoadedIndex = { model: string; dim: number; owners: string[]; vectors: Int8Array };
type Entry = { edition: CatechismEdition; group: CatechismGroup; question: CatechismQuestion };
export type CatechismMatch = Entry & { score: number; mode: "semantic" | "lexical" | "exact" };

const SEMANTIC_MIN = 0.74;
const SEMANTIC_MIN_MARGIN = 0.025;
const STOP = new Set([
  "a an the is are was were be been am i me my we our you your it its to of in on at for with and or but not",
  "do does did can could should would will what how why when where who which that this these those there",
  "about from by as if so have has had their them they he she his her all any much many each few some most",
  "other such being may might must shall before after into onto without across above below down up out over",
  "under again further then once here both more no nor only own same than too very per via versus etc",
  "say says teach teaches pray prayer catholic god christ jesus church holy spirit bible catechism baltimore question answer",
].join(" ").split(" "));
const words = (text: string) => text.toLocaleLowerCase("en-US").replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
  .filter((word) => word && !STOP.has(word))
  .map((word) => word.replace(/(ing|ed|es|s)$/, ""));
const compact = (text: string) => text.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");

let entriesPromise: Promise<Entry[]> | null = null;
function loadEntries() {
  entriesPromise ??= import("../catechism").then(({ catechismEditions }) => catechismEditions.flatMap((edition) => edition.groups.flatMap((group) => group.questions.map((question) => ({ edition, group, question })))));
  return entriesPromise;
}

let indexPromise: Promise<LoadedIndex> | null = null;
function loadIndex() {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}chat/catechism-index.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`catechism index ${response.status}`);
      return response.json() as Promise<CatechismIndex>;
    })
    .then((index) => {
      const binary = atob(index.vectors);
      const vectors = new Int8Array(binary.length);
      for (let position = 0; position < binary.length; position += 1) vectors[position] = (binary.charCodeAt(position) << 24) >> 24;
      if (index.schemaVersion !== 1 || vectors.length !== index.owners.length * index.dim) throw new Error("Invalid catechism index dimensions");
      return { model: index.model, dim: index.dim, owners: index.owners, vectors };
    })
    .catch((error) => {
      indexPromise = null;
      throw error;
    });
  return indexPromise;
}

function rankSemantic(index: LoadedIndex, vector: Float32Array, entriesById: Map<string, Entry>) {
  const best = new Map<string, number>();
  for (let row = 0; row < index.owners.length; row += 1) {
    let dot = 0;
    const base = row * index.dim;
    for (let column = 0; column < index.dim; column += 1) dot += index.vectors[base + column] * vector[column];
    const score = dot / 127;
    const id = index.owners[row];
    if (score > (best.get(id) ?? -1)) best.set(id, score);
  }
  return [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
    .flatMap(([id, score]) => entriesById.has(id) ? [{ ...entriesById.get(id)!, score }] : []);
}

function rankLexical(query: string, entries: Entry[]): CatechismMatch | null {
  const normalizedQuery = compact(query);
  const explicitQuestion = query.match(/\b(?:q(?:uestion)?\.?\s*)(\d{1,4})\b/i);
  const explicitEdition = query.match(/\bno\.?\s*([123])\b/i);
  if (explicitQuestion) {
    const questionNumber = Number(explicitQuestion[1]);
    const editions = explicitEdition ? [Number(explicitEdition[1])] : [2, 3, 1];
    const direct = editions.map((editionNumber) => entries.find((entry) => entry.edition.number === editionNumber && entry.question.number === questionNumber)).find(Boolean);
    if (direct) return { ...direct, score: 1, mode: "exact" };
  }

  const exact = entries.find((entry) => compact(entry.question.question) === normalizedQuery);
  if (exact) return { ...exact, score: 1, mode: "exact" };

  const wanted = new Set(words(query));
  if (wanted.size < 2) return null;
  const ranked = entries.map((entry) => {
    const phrase = new Set(words(entry.question.question));
    let shared = 0;
    for (const word of wanted) if (phrase.has(word)) shared += 1;
    const coverage = shared / wanted.size;
    const precision = phrase.size ? shared / phrase.size : 0;
    return { entry, shared, coverage, precision, score: (2 * coverage * precision) / (coverage + precision || 1) };
  }).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top || top.shared < 2 || top.coverage < 0.8 || top.precision < 0.5 || top.score < 0.62) return null;
  if (ranked[1] && top.score - ranked[1].score < 0.1) return null;
  return { ...top.entry, score: top.score, mode: "lexical" };
}

export async function searchCatechism(query: string, vector?: Float32Array): Promise<CatechismMatch | null> {
  const [entries, index] = await Promise.all([
    loadEntries(),
    vector ? loadIndex().catch(() => null) : Promise.resolve(null),
  ]);
  if (vector && index) {
    const entriesById = new Map(entries.map((entry) => [entry.question.id, entry]));
    const [top, runnerUp] = rankSemantic(index, vector, entriesById);
    if (top && top.score >= SEMANTIC_MIN && (!runnerUp || top.score - runnerUp.score >= SEMANTIC_MIN_MARGIN)) {
      return { ...top, mode: "semantic" };
    }
  }
  return rankLexical(query, entries);
}
