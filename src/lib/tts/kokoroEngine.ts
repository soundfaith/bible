import type { NarrationGender } from "../narrationVoice";

const ENABLED_KEY = "soundfaith-kokoro-enabled-v1";
const DECLINED_KEY = "soundfaith-kokoro-declined-v1";
const MAX_CHUNK = 220;
const LOOKAHEAD_SECONDS = 20;

type Result = { ok: boolean; samples?: Float32Array; rate?: number; error?: string };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (result: Result) => void>();
let progressListener: ((percent: number) => void) | null = null;
let audioContext: AudioContext | null = null;
let modelReady = false;

function readFlag(key: string) {
  try { return window.localStorage.getItem(key) === "1"; } catch { return false; }
}
function writeFlag(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}

export function kokoroSupported() {
  if (typeof window === "undefined" || !("Worker" in window) || !("AudioContext" in window || "webkitAudioContext" in window)) return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return memory === undefined || memory >= 4;
}

export function isKokoroEnabled() { return readFlag(ENABLED_KEY); }
export function isKokoroDeclined() { return readFlag(DECLINED_KEY); }
export function declineKokoro() { writeFlag(DECLINED_KEY, true); }

export function enableKokoro() {
  writeFlag(ENABLED_KEY, true);
  writeFlag(DECLINED_KEY, false);
  void navigator.storage?.persist?.().catch(() => undefined);
}

export async function removeKokoroModel() {
  writeFlag(ENABLED_KEY, false);
  writeFlag(DECLINED_KEY, false);
  worker?.terminate();
  worker = null;
  modelReady = false;
  pending.forEach((resolve) => resolve({ ok: false, error: "removed" }));
  pending.clear();
  if ("caches" in window) {
    for (const name of await caches.keys()) {
      if (/transformers|onnx|kokoro/i.test(name)) await caches.delete(name);
    }
  }
}

export function onCellularConnection() {
  const connection = (navigator as Navigator & { connection?: { type?: string; saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection && (connection.type === "cellular" || connection.saveData || /^(slow-2g|2g|3g)$/.test(connection.effectiveType ?? "")));
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data;
    if (data.type === "progress") {
      progressListener?.(Math.min(100, Math.round(data.percent)));
      return;
    }
    const resolve = pending.get(data.id);
    if (!resolve) return;
    pending.delete(data.id);
    resolve(data);
  };
  worker.onerror = () => {
    pending.forEach((resolve) => resolve({ ok: false, error: "worker crashed" }));
    pending.clear();
    worker = null;
    modelReady = false;
  };
  return worker;
}

function request(message: { type: "init" } | { type: "generate"; text: string; voice: string }) {
  return new Promise<Result>((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    getWorker().postMessage({ ...message, id });
  });
}

function getContext() {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!audioContext || audioContext.state === "closed") audioContext = new Ctor();
  return audioContext;
}

// Call from a user gesture so later playback is not blocked by autoplay policy.
export function primeKokoroAudio() {
  if (!kokoroSupported() || !isKokoroEnabled()) return;
  void getContext().resume().catch(() => undefined);
}

export function splitIntoChunks(text: string) {
  const chunks: { text: string; start: number; end: number }[] = [];
  const sentence = /[^.!?;:\n]+(?:[.!?;:]+["'”’)\]]*|\n+|$)\s*/g;
  let current: { text: string; start: number; end: number } | null = null;
  for (const match of text.matchAll(sentence)) {
    const piece = match[0];
    if (!piece.trim()) continue;
    const start = match.index ?? 0;
    const end = start + piece.length;
    if (current && current.text.length + piece.length <= MAX_CHUNK) {
      current.text += piece;
      current.end = end;
    } else {
      if (current) chunks.push(current);
      current = { text: piece, start, end };
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export type KokoroSession = { stop: () => void; pause: () => void; resume: () => void };

export type KokoroHooks = {
  onLoading: (percent: number | null) => void;
  onProgress: (charPosition: number) => void;
  onEnd: () => void;
  onError: () => void;
};

export function speakWithKokoro(text: string, preference: NarrationGender, hooks: KokoroHooks): KokoroSession {
  const voice = preference === "male" ? "am_michael" : "af_heart";
  const chunks = splitIntoChunks(text);
  const context = getContext();
  void context.resume().catch(() => undefined);
  let stopped = false;
  const sources: AudioBufferSourceNode[] = [];

  const stop = () => {
    if (stopped) return;
    stopped = true;
    progressListener = null;
    sources.forEach((source) => { source.onended = null; try { source.stop(); } catch { /* not started */ } });
    sources.length = 0;
    void context.resume().catch(() => undefined);
  };

  const fail = () => {
    if (stopped) return;
    stop();
    hooks.onError();
  };

  void (async () => {
    if (!modelReady) {
      hooks.onLoading(0);
      progressListener = (percent) => { if (!stopped) hooks.onLoading(percent); };
      const init = await request({ type: "init" });
      progressListener = null;
      if (stopped) return;
      if (!init.ok) { fail(); return; }
      modelReady = true;
      hooks.onLoading(null);
    }
    if (!chunks.length) { stopped = true; hooks.onEnd(); return; }
    let nextStart = 0;
    let remaining = chunks.length;
    for (let index = 0; index < chunks.length && !stopped; index++) {
      while (!stopped && context.state === "running" && nextStart - context.currentTime > LOOKAHEAD_SECONDS) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const result = await request({ type: "generate", text: chunks[index].text, voice });
      if (stopped) return;
      if (!result.ok || !result.samples || !result.rate) { fail(); return; }
      const buffer = context.createBuffer(1, result.samples.length, result.rate);
      buffer.copyToChannel(result.samples as Float32Array<ArrayBuffer>, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      const startAt = Math.max(context.currentTime, nextStart);
      nextStart = startAt + buffer.duration;
      const following = chunks[index + 1];
      source.onended = () => {
        if (stopped) return;
        remaining--;
        if (following) hooks.onProgress(following.start);
        else if (remaining <= 0) { stopped = true; hooks.onEnd(); }
      };
      sources.push(source);
      source.start(startAt);
      if (index === 0) hooks.onProgress(chunks[0].start);
    }
  })();

  return {
    stop,
    pause: () => { void context.suspend().catch(() => undefined); },
    resume: () => { void context.resume().catch(() => undefined); },
  };
}
