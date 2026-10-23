import { chatTopics, type ChatTopic } from "./topics";

type ChatIndex = { model: string; dim: number; owners: string[]; vectors: string };
type Loaded = { model: string; dim: number; owners: string[]; vectors: Int8Array };
export type TopicMatch = { topic: ChatTopic; score: number };
export type MatchResult = { mode: "semantic" | "lexical"; matches: TopicMatch[]; vector?: Float32Array };

// Thresholds were measured with scripts/chat/eval.mjs: off-topic questions score <= 0.66, on-topic mostly >= 0.70.
export const THRESHOLDS = {
  semantic: { answer: 0.7, suggest: 0.64 },
  lexical: { answer: 0.6, suggest: 0.4 }
};
const MODEL_WAIT_MS = 5000;

let indexPromise: Promise<Loaded> | null = null;
function loadIndex() {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}chat/index.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`index ${response.status}`);
      return response.json() as Promise<ChatIndex>;
    })
    .then((index) => {
      const binary = atob(index.vectors);
      const vectors = new Int8Array(binary.length);
      for (let position = 0; position < binary.length; position += 1) vectors[position] = (binary.charCodeAt(position) << 24) >> 24;
      return { model: index.model, dim: index.dim, owners: index.owners, vectors };
    })
    .catch((error) => {
      indexPromise = null;
      throw error;
    });
  return indexPromise;
}

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<number, { resolve: (value: Float32Array | null) => void; reject: (error: Error) => void }>();
let modelReady = false;

function call(type: "init" | "embed", model: string, text?: string) {
  if (!worker) {
    worker = new Worker(new URL("./embed.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; vector?: Float32Array; error?: string }>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if (event.data.ok) entry.resolve(event.data.vector ?? null);
      else entry.reject(new Error(event.data.error));
    };
  }
  const id = (requestId += 1);
  return new Promise<Float32Array | null>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, type, model, text });
  });
}

let warming: Promise<void> | null = null;
export function warmUpChatModel() {
  warming ??= loadIndex()
    .then((index) => call("init", index.model))
    .then(() => { modelReady = true; })
    .catch(() => { warming = null; });
  return warming;
}

function rankSemantic(index: Loaded, query: Float32Array): TopicMatch[] {
  const best = new Map<string, number>();
  const rows = index.owners.length;
  for (let row = 0; row < rows; row += 1) {
    let dot = 0;
    const base = row * index.dim;
    for (let column = 0; column < index.dim; column += 1) dot += index.vectors[base + column] * query[column];
    const score = dot / 127;
    if (score > (best.get(index.owners[row]) ?? -1)) best.set(index.owners[row], score);
  }
  const byId = new Map(chatTopics.map((topic) => [topic.id, topic]));
  return [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .flatMap(([id, score]) => (byId.has(id) ? [{ topic: byId.get(id)!, score }] : []));
}

const STOP = new Set("a an the is are was were be been am i me my we our you your it its to of in on at for with and or but not do does did can could should would will what how why when where who which that this these those there about from by as if so have has had bible say says god".split(" "));
const tokens = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
  .filter((word) => word && !STOP.has(word))
  .map((word) => word.replace(/(ing|ed|es|s)$/, ""));

let lexicalIndex: Array<{ topic: ChatTopic; phrase: Set<string> }> | null = null;
function rankLexical(query: string): TopicMatch[] {
  lexicalIndex ??= chatTopics.flatMap((topic) => [topic.title, ...topic.phrasings].map((text) => ({ topic, phrase: new Set(tokens(text)) })));
  const wanted = new Set(tokens(query));
  if (!wanted.size) return [];
  const best = new Map<string, TopicMatch>();
  for (const entry of lexicalIndex) {
    if (!entry.phrase.size) continue;
    let shared = 0;
    wanted.forEach((word) => { if (entry.phrase.has(word)) shared += 1; });
    const score = (2 * shared) / (wanted.size + entry.phrase.size);
    if (score > (best.get(entry.topic.id)?.score ?? 0)) best.set(entry.topic.id, { topic: entry.topic, score });
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function matchTopics(query: string): Promise<MatchResult> {
  try {
    const index = await loadIndex();
    const ready = warmUpChatModel();
    if (!modelReady) await Promise.race([ready, new Promise((resolve) => setTimeout(resolve, MODEL_WAIT_MS))]);
    if (modelReady) {
      const vector = await call("embed", index.model, query);
      if (vector) return { mode: "semantic", matches: rankSemantic(index, vector), vector };
    }
  } catch {
    // fall through to lexical matching
  }
  return { mode: "lexical", matches: rankLexical(query) };
}
