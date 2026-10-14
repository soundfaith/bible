import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "@huggingface/transformers";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const index = JSON.parse(readFileSync(join(root, "public", "chat", "index.json"), "utf8"));
const vectors = new Int8Array(Buffer.from(index.vectors, "base64").buffer.slice(0));
const extractor = await pipeline("feature-extraction", index.model, { dtype: "q8" });

// [question, expected topic id or null when nothing should match confidently]
const cases = [
  ["My mom just passed away and I can't stop crying", "grief"],
  ["I keep worrying about my exams", "anxiety"],
  ["How can I get closer to God through prayer?", "prayer"],
  ["My husband cheated on me, how do I let it go?", "forgiveness"],
  ["Is there anything after this life?", "heaven"],
  ["Does God send non-believers to eternal fire?", "hell"],
  ["Can I marry again if my first marriage ended?", "divorce"],
  ["Why do innocent children get cancer?", "suffering"],
  ["Is Jesus really the son of God?", "who-is-jesus"],
  ["I am so tired of everything and feel empty", "hopelessness"],
  ["I don't have anyone to talk to", "loneliness"],
  ["Should I give ten percent of my paycheck to church?", "money"],
  ["Why were you born, what is life for?", "purpose"],
  ["Do I have to be baptized to go to heaven?", "baptism"],
  ["Why do Catholics pray to Mary?", "mary"],
  ["Is the bread at communion really Jesus?", "eucharist"],
  ["Where in the Bible is purgatory?", "purgatory"],
  ["What books are missing from Protestant Bibles?", "bible-canon"],
  ["Tell me the story of the guy who fought a giant with a sling", "david-goliath"],
  ["I got fired yesterday", "job-loss"],
  ["I can't stop drinking", "addiction"],
  ["How do I find a husband or wife God wants for me", "vocation"],
  ["I am terrified of dying", "fear"],
  ["I feel like God doesn't hear me", "disappointment"],
  ["Where should a beginner start in the Bible?", "read-bible"],
  ["What are the gifts of the Spirit?", "holy-spirit"],
  ["Is it okay to get a tattoo?", "tattoos"],
  ["Why is my coworker so rude and how should I respond", "bullying"],
  ["Am I saved by faith only?", "faith-and-works"],
  ["What does Lent mean", "lent"],
  ["Who are the angels", "angels"],
  ["I hate my body and myself", "self-worth"],
  ["Why do I envy my friends", "jealousy"],
  ["I'm so stressed from work", "stress"],
  ["How do I make a big life decision", "wisdom"],
  ["Is lying always wrong", "honesty"],
  ["What should I do when someone insults me", "bullying"],
  ["How do I explain the Trinity to my kids", "trinity"],
  ["Does the devil exist", "spiritual-warfare"],
  ["Who is my neighbor", "good-samaritan"],
  ["What's the best pizza topping", null],
  ["Who won the football game last night", null],
  ["How do I fix my laptop", null],
  ["what is the capital of France", null],
  ["bitcoin price today", null]
];

const owners = index.owners;
const dim = index.dim;
function rank(query, queryVector) {
  const best = new Map();
  for (let row = 0; row < owners.length; row += 1) {
    let dot = 0;
    for (let column = 0; column < dim; column += 1) dot += vectors[row * dim + column] * queryVector[column];
    const score = dot / 127;
    if (score > (best.get(owners[row]) ?? -1)) best.set(owners[row], score);
  }
  return [...best.entries()].sort((a, b) => b[1] - a[1]);
}

let hit1 = 0;
let hit3 = 0;
let expectedCount = 0;
const rows = [];
for (const [question, expected] of cases) {
  const output = await extractor(question, { pooling: "cls", normalize: true });
  const ranked = rank(question, output.data);
  const [top, second] = ranked;
  rows.push({ question, expected, top: top[0], score: top[1], margin: top[1] - second[1] });
  if (expected) {
    expectedCount += 1;
    if (top[0] === expected) hit1 += 1;
    if (ranked.slice(0, 3).some(([id]) => id === expected)) hit3 += 1;
  }
}
for (const row of rows) console.log(`${row.expected === row.top ? "OK  " : row.expected === null ? "OFF " : "MISS"} ${row.score.toFixed(3)} m=${row.margin.toFixed(3)}  ${row.question}  -> ${row.top}${row.expected && row.expected !== row.top ? `  (wanted ${row.expected})` : ""}`);
console.log(`\ntop-1 ${hit1}/${expectedCount}  top-3 ${hit3}/${expectedCount}`);
