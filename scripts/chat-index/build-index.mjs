import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";
import { loadTopics } from "./validate-topics.mjs";

const MODEL = "Xenova/bge-small-en-v1.5";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = join(root, "public", "chat");

const topics = loadTopics();
const texts = [];
const owners = [];
for (const topic of topics) {
  for (const text of new Set([topic.title, ...topic.phrasings])) {
    texts.push(text);
    owners.push(topic.id);
  }
}

console.log(`Embedding ${texts.length} phrasings for ${topics.length} topics with ${MODEL}...`);
const extractor = await pipeline("feature-extraction", MODEL, { dtype: "q8" });
const dim = 384;
const bytes = new Int8Array(texts.length * dim);
const batchSize = 32;
for (let start = 0; start < texts.length; start += batchSize) {
  const batch = texts.slice(start, start + batchSize);
  const output = await extractor(batch, { pooling: "cls", normalize: true });
  const data = output.data;
  for (let row = 0; row < batch.length; row += 1) {
    for (let column = 0; column < dim; column += 1) bytes[(start + row) * dim + column] = Math.round(data[row * dim + column] * 127);
  }
}

mkdirSync(outDir, { recursive: true });
const index = { model: MODEL, dim, owners, vectors: Buffer.from(bytes.buffer).toString("base64") };
writeFileSync(join(outDir, "index.json"), JSON.stringify(index));
console.log(`Wrote public/chat/index.json (${Math.round(JSON.stringify(index).length / 1024)} KB)`);
