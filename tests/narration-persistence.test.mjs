import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const key = "soundfaith-listening";
const values = new Map([[key, JSON.stringify({
  snapshot: {
    status: "paused",
    text: "A reading to resume.",
    position: 42,
    duration: 100,
    elapsedSeconds: 42,
    usesAudioFile: true,
    track: { title: "Test reading", path: "#/read?book=genesis&chapter=1", art: "bible" },
  },
  sources: ["https://example.invalid/audio.mp3"],
  preference: "male",
})]]);
const handlers = new Map();
const storage = {
  getItem: (name) => values.get(name) ?? null,
  setItem: (name, value) => values.set(name, value),
  removeItem: (name) => values.delete(name),
};
let currentAudio;
let currentUtterance;
class FakeAudio {
  currentTime = 0;
  duration = 100;
  constructor() { currentAudio = this; }
  pause() {}
  play() { return Promise.resolve(); }
}
class FakeUtterance {
  constructor(text) { this.text = text; currentUtterance = this; }
}

let server;
let narrator;

before(async () => {
  globalThis.window = {
    localStorage: storage,
    speechSynthesis: { cancel() {}, getVoices: () => [], speak() {} },
    Audio: FakeAudio,
    addEventListener: (name, handler) => handlers.set(name, handler),
    setInterval,
    clearInterval,
  };
  globalThis.document = { addEventListener: (name, handler) => handlers.set(name, handler), visibilityState: "visible" };
  globalThis.Audio = FakeAudio;
  globalThis.SpeechSynthesisUtterance = FakeUtterance;
  server = await createServer({ server: { middlewareMode: true, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
  narrator = await server.ssrLoadModule("/src/components/NarratorButton.tsx");
});

after(async () => {
  narrator?.stopSpeaking();
  await server?.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.Audio;
  delete globalThis.SpeechSynthesisUtterance;
});

test("resuming saved audio retains its position while metadata loads", () => {
  const saved = narrator.getNarrationSnapshot();
  assert.equal(saved.position, 42);
  narrator.resumeSpeaking(saved.text);
  assert.equal(narrator.getNarrationSnapshot().position, 42);
  assert.equal(JSON.parse(storage.getItem(key)).snapshot.position, 42);
  currentAudio.duration = NaN;
  currentAudio.ondurationchange();
  assert.equal(narrator.getNarrationSnapshot().position, 42);
  currentAudio.duration = 100;
  currentAudio.onloadedmetadata();
});

test("pagehide saves the latest seek position without waiting for the throttle", () => {
  narrator.seekSpeaking(65);
  assert.equal(narrator.getNarrationSnapshot().position, 65);
  handlers.get("pagehide")();
  assert.equal(JSON.parse(storage.getItem(key)).snapshot.position, 65);
});

test("backgrounding the app saves the latest position", () => {
  narrator.seekSpeaking(75);
  document.visibilityState = "hidden";
  handlers.get("visibilitychange")();
  assert.equal(JSON.parse(storage.getItem(key)).snapshot.position, 75);
});

test("speech errors retain the track and transcript for retry", () => {
  const track = { title: "Test speech", path: "#/listen", art: "prayer" };
  narrator.startSpeaking("A transcript to retry.", [], undefined, undefined, "male", track);
  currentUtterance.onerror({ error: "synthesis-failed" });
  const failed = narrator.getNarrationSnapshot();
  assert.equal(failed.status, "idle");
  assert.equal(failed.track, track);
  assert.equal(failed.text, "A transcript to retry.");
  assert.match(failed.error, /could not be played/i);
  narrator.toggleActiveNarration();
  assert.equal(narrator.getNarrationSnapshot().status, "playing");
  assert.equal(narrator.getNarrationSnapshot().error, undefined);
});

test("switching tracks with identical words saves the new sequence immediately", () => {
  const first = { title: "Opening prayer", path: "#/rosary/joyful", art: "rosary", sequence: { kind: "rosary", mysteryIndex: 0, mode: "traditional", clipIndex: 0 } };
  const second = { ...first, path: "#/rosary/sorrowful", sequence: { ...first.sequence, mysteryIndex: 2 } };
  narrator.startSpeaking("The same prayer.", ["https://example.invalid/audio.mp3"], undefined, undefined, "male", first);
  narrator.startSpeaking("The same prayer.", ["https://example.invalid/audio.mp3"], undefined, undefined, "male", second);
  assert.equal(JSON.parse(storage.getItem(key)).snapshot.track.sequence.mysteryIndex, 2);
});

test("a failed recording continues device speech at the same relative position", () => {
  const text = "One two three four five six seven eight nine ten";
  const track = { title: "Test", path: "#/listen", art: "prayer" };
  narrator.startSpeaking(text, ["https://example.invalid/audio.mp3"], undefined, undefined, "male", track);
  currentAudio.onloadedmetadata();
  narrator.seekSpeaking(50);
  currentAudio.onerror();
  const current = narrator.getNarrationSnapshot();
  assert.equal(current.usesAudioFile, false);
  assert.equal(current.status, "playing");
  assert.equal(current.position, Math.floor(text.length / 2));
  assert.equal(current.elapsedSeconds, 50);
  assert.equal(currentUtterance.text, text.slice(current.position));
});

test("a failed recording while paused stays paused at its relative position", () => {
  const text = "One two three four five six seven eight nine ten";
  const track = { title: "Test", path: "#/listen", art: "prayer" };
  narrator.startSpeaking(text, ["https://example.invalid/audio.mp3"], undefined, undefined, "male", track);
  currentAudio.onloadedmetadata();
  narrator.seekSpeaking(50);
  narrator.pauseSpeaking();
  currentAudio.onerror();
  const current = narrator.getNarrationSnapshot();
  assert.equal(current.status, "paused");
  assert.equal(current.usesAudioFile, false);
  assert.equal(current.position, Math.floor(text.length / 2));
});
