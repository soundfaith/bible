import { loadSummaData, type SummaArticle, type SummaPart, type SummaQuestion } from "../summa";

type SummaIndex = { schemaVersion: number; model: string; dim: number; owners: string[]; vectors: string };
type LoadedIndex = { model: string; dim: number; owners: string[]; vectors: Int8Array };
type Entry = { part: SummaPart; question: SummaQuestion; article: SummaArticle };
type LexicalEntry = Entry & { titleWords: Set<string>; contentWords: Set<string> };
export type SummaMatch = Entry & { score: number; mode: "semantic" | "lexical" };

const SEMANTIC_MIN = 0.72;
const STOP = new Set("a an the is are was were be been am i me my we our you your it its to of in on at for with and or but not do does did can could should would will what how why when where who which that this these those there about from by as if so have has had their them they he she his her all any much many each few some most other such being may might must shall before after into onto without across above below down up out over under again further then once here both more no nor only own same than too very per via versus and thomistic summa question article whether how many".split(" "));
const words = (text: string) => text.toLocaleLowerCase("en-US").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word && !STOP.has(word))
  .map((word) => word.replace(/(ing|ed|es|s)$/, ""));

let entriesPromise: Promise<Entry[]> | null = null;
function loadEntries() {
  entriesPromise ??= loadSummaData().then((data) => {
    const parts = new Map(data.parts.map((part) => [part.id, part]));
    return data.questions.flatMap((question) => {
      const part = parts.get(question.part_id);
      if (!part) throw new Error(`Unknown Summa part ${question.part_id}.`);
      return question.articles.filter((article) => article.respondeo.trim()).map((article) => ({ part, question, article }));
    });
  }).catch((error: unknown) => {
    entriesPromise = null;
    throw error;
  });
  return entriesPromise;
}

let lexicalEntriesPromise: Promise<LexicalEntry[]> | null = null;
function loadLexicalEntries(entries: Entry[]) {
  lexicalEntriesPromise ??= Promise.resolve(entries.map((entry) => ({
    ...entry,
    titleWords: new Set(words(`${entry.question.title} ${entry.article.title}`)),
    contentWords: new Set(words(`${entry.article.respondeo} ${entry.article.sed_contra} ${entry.article.objections.map((item) => item.text).join(" ")} ${entry.article.replies.map((item) => item.text).join(" ")}`)),
  })));
  return lexicalEntriesPromise;
}

let indexPromise: Promise<LoadedIndex> | null = null;
let indexWarningShown = false;
function loadIndex() {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}chat/summa-index.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Summa index ${response.status}`);
      return response.json() as Promise<SummaIndex>;
    })
    .then((index) => {
      const binary = atob(index.vectors);
      const vectors = new Int8Array(binary.length);
      for (let position = 0; position < binary.length; position += 1) {
        vectors[position] = (binary.charCodeAt(position) << 24) >> 24;
      }
      if (index.schemaVersion !== 1 || index.dim !== 384 || vectors.length !== index.owners.length * index.dim) {
        throw new Error("Invalid Summa index dimensions.");
      }
      return { model: index.model, dim: index.dim, owners: index.owners, vectors };
    })
    .catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  return indexPromise;
}

function rankSemantic(index: LoadedIndex, vector: Float32Array) {
  if (vector.length !== index.dim) throw new Error("The Summa index and chat model dimensions do not match.");
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
    .map(([id, score]) => ({ id, score }));
}

function rankLexical(query: string, entries: LexicalEntry[]): SummaMatch | null {
  const wanted = new Set(words(query));
  if (wanted.size < 2) return null;

  const ranked = entries.map((entry) => {
    let shared = 0;
    let titleHits = 0;
    for (const word of wanted) {
      if (entry.contentWords.has(word) || entry.titleWords.has(word)) shared += 1;
      if (entry.titleWords.has(word)) titleHits += 1;
    }
    const coverage = shared / wanted.size;
    const titleCoverage = titleHits / wanted.size;
    return { entry, shared, coverage, score: Math.min(1, coverage * 0.75 + titleCoverage * 0.25) };
  }).sort((a, b) => b.score - a.score);

  const [top, runnerUp] = ranked;
  if (!top || top.shared < 2 || top.coverage < 0.65 || top.score < 0.55) return null;
  if (runnerUp && top.score - runnerUp.score < 0.08 && top.entry.question.id !== runnerUp.entry.question.id) return null;
  return { ...top.entry, score: top.score, mode: "lexical" };
}

export async function searchSumma(query: string, vector?: Float32Array): Promise<SummaMatch | null> {
  if (vector) {
    const index = await loadIndex().catch((error: unknown) => {
      if (!indexWarningShown) {
        console.warn("Sofi is using text search because the Summa semantic index could not be loaded.", error);
        indexWarningShown = true;
      }
      return null;
    });
    if (index) {
      const [top] = rankSemantic(index, vector);
      if (top && top.score >= SEMANTIC_MIN) {
        const entries = await loadEntries();
        const match = entries.find((entry) => String(entry.article.id) === top.id);
        if (match) return { ...match, score: top.score, mode: "semantic" };
      }
      return null;
    }
  }
  const entries = await loadEntries();
  return rankLexical(query, await loadLexicalEntries(entries));
}
