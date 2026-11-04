import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/bge-small-en-v1.5";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataDir = join(root, "public", "data", "summa");
const readCompressed = (name) => JSON.parse(gunzipSync(readFileSync(join(dataDir, name))).toString("utf8"));
const questions = readCompressed("summa_questions.json.gz");
const articles = readCompressed("summa_articles.json.gz");
const questionTitles = new Map(questions.map((question) => [question.id, question.title]));
const entries = articles.filter((article) => article.respondeo?.trim()).map((article) => ({
  id: String(article.id),
  text: [
    questionTitles.get(article.question_id),
    article.title,
    article.respondeo.slice(0, 1600),
    article.sed_contra.slice(0, 300),
    article.objections.map((item) => item.text).join(" ").slice(0, 500),
    article.replies.map((item) => item.text).join(" ").slice(0, 300),
  ].filter(Boolean).join("\n"),
}));

console.log(`Embedding ${entries.length} Summa articles with ${MODEL}...`);
const extractor = await pipeline("feature-extraction", MODEL, { dtype: "q8" });
const dim = 384;
const bytes = new Int8Array(entries.length * dim);
const batchSize = 32;
for (let start = 0; start < entries.length; start += batchSize) {
  const batch = entries.slice(start, start + batchSize);
  const output = await extractor(batch.map((entry) => entry.text), { pooling: "cls", normalize: true });
  for (let row = 0; row < batch.length; row += 1) {
    for (let column = 0; column < dim; column += 1) {
      bytes[(start + row) * dim + column] = Math.round(output.data[row * dim + column] * 127);
    }
  }
  if ((start + batch.length) % 256 === 0 || start + batch.length === entries.length) {
    console.log(`Embedded ${start + batch.length}/${entries.length}`);
  }
}

const outDir = join(root, "public", "chat");
mkdirSync(outDir, { recursive: true });
const index = {
  schemaVersion: 1,
  model: MODEL,
  dim,
  owners: entries.map((entry) => entry.id),
  vectors: Buffer.from(bytes.buffer).toString("base64"),
};
const outputPath = join(outDir, "summa-index.json");
writeFileSync(outputPath, JSON.stringify(index));
console.log(`Wrote ${outputPath} (${Math.round(JSON.stringify(index).length / 1024)} KB)`);
