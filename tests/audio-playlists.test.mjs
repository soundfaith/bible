import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let server;
let playlists;
let editions;
let readings;
let journey;
let breviary;

before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
  playlists = await server.ssrLoadModule("/src/lib/audioPlaylists.ts");
  editions = (await server.ssrLoadModule("/src/lib/catechism.ts")).catechismEditions;
  readings = await server.ssrLoadModule("/src/lib/readings.ts");
  journey = (await server.ssrLoadModule("/src/data/bibleJourney.ts")).bibleJourney;
  breviary = await server.ssrLoadModule("/src/lib/breviary.ts");
});

after(async () => {
  await server?.close();
});

test("No-Worry advances through days without wrapping at the end", async () => {
  const first = playlists.noWorryItem(1);
  const next = await playlists.nextPlaylistItem(first.track);
  assert.equal(next.track.sequence.day, 2);
  assert.equal(first.track.next.path, next.track.path);
  const last = playlists.noWorryItem(15);
  assert.equal(last.track.next, undefined);
  assert.equal(await playlists.nextPlaylistItem(last.track), null);
});

test("Catechism advances to the following lesson and stops after the last", async () => {
  const edition = editions[0];
  const lessons = edition.groups.filter((group) => group.kind === "lesson");
  const first = playlists.catechismItem(edition, lessons[0]);
  const next = await playlists.nextPlaylistItem(first.track);
  assert.equal(next.track.sequence.groupId, lessons[1].id);
  assert.equal(first.track.next.path, next.track.path);
  const last = playlists.catechismItem(edition, lessons[lessons.length - 1]);
  assert.equal(last.track.next, undefined);
  assert.equal(await playlists.nextPlaylistItem(last.track), null);
});

test("Summa advances across questions without crossing parts", () => {
  const first = { part_id: 1, number: 1, articles: [{ number: 1 }, { number: 2 }] };
  const second = { part_id: 1, number: 2, articles: [{ number: 1 }] };
  const otherPart = { part_id: 2, number: 3, articles: [{ number: 1 }] };
  const questions = [first, second, otherPart];
  assert.deepEqual(playlists.nextSummaArticle(questions, first, first.articles[0]), { question: first, article: first.articles[1] });
  assert.deepEqual(playlists.nextSummaArticle(questions, first, first.articles[1]), { question: second, article: second.articles[0] });
  assert.equal(playlists.nextSummaArticle(questions, second, second.articles[0]), undefined);
});

test("Bible Journey transcripts match the narration manifest and include spoken introductions", async () => {
  const manifest = JSON.parse(await readFile(new URL("../scripts/period_narrations.json", import.meta.url), "utf8"));
  for (const [index, period] of journey.entries()) {
    assert.equal(period.id, manifest.periods[index].id);
    for (const [storyIndex, story] of period.stories.entries()) {
      const source = manifest.periods[index].stories[storyIndex];
      assert.equal(story.title, source.title);
      assert.deepEqual(story.references, source.references);
      assert.match(readings.journeyStoryNarration(story), new RegExp(`^${story.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\n`));
    }
  }
  const creation = readings.journeyStoryNarration(journey[0].stories[0]);
  assert.match(creation, /^Creation\n\nGenesis, chapter 1\./);
  assert.match(creation, /\n\nGenesis, chapter 2\./);
  const overlap = readings.journeyStoryNarration({ title: "Test", references: ["Genesis 1:1-2", "Genesis 1:2-3"] });
  assert.equal(overlap.split(readings.resolveReference("Genesis 1:2")[0].text.trim()).length, 2);
});

test("Breviary reading transcript includes the recorded reference", () => {
  const reading = breviary.assembleBreviary(new Date(2026, 10, 15), "lauds", "male").segments.find((segment) => segment.id === "reading");
  assert.equal(breviary.breviaryNarrationText(reading), `${reading.reference}. ${reading.text}`);
});
