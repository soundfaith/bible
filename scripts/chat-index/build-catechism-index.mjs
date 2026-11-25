import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/bge-small-en-v1.5";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataPath = join(root, "src", "data", "catechism.json");
const outDir = join(root, "public", "chat");
const dataset = JSON.parse(readFileSync(dataPath, "utf8"));
const questions = dataset.editions.flatMap((edition) => edition.groups.flatMap((group) => group.questions.map((question) => ({
  id: question.id,
  text: `${question.question}\n${question.answer}`,
}))));

console.log(`Embedding ${questions.length} catechism questions with ${MODEL}...`);
const extractor = await pipeline("feature-extraction", MODEL, { dtype: "q8" });
const dim = 384;
const bytes = new Int8Array(questions.length * dim);
const batchSize = 32;
for (let start = 0; start < questions.length; start += batchSize) {
  const batch = questions.slice(start, start + batchSize);
  const output = await extractor(batch.map((question) => question.text), { pooling: "cls", normalize: true });
  for (let row = 0; row < batch.length; row += 1) {
    for (let column = 0; column < dim; column += 1) {
      bytes[(start + row) * dim + column] = Math.round(output.data[row * dim + column] * 127);
    }
  }
  if ((start + batch.length) % 256 === 0 || start + batch.length === questions.length) {
    console.log(`Embedded ${start + batch.length}/${questions.length}`);
  }
}

mkdirSync(outDir, { recursive: true });
const index = { schemaVersion: 1, model: MODEL, dim, owners: questions.map((question) => question.id), vectors: Buffer.from(bytes.buffer).toString("base64") };
const outputPath = join(outDir, "catechism-index.json");
writeFileSync(outputPath, JSON.stringify(index));
console.log(`Wrote ${outputPath} (${Math.round(JSON.stringify(index).length / 1024)} KB)`);
