import { KokoroTTS } from "kokoro-js";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

type Request =
  | { id: number; type: "init" }
  | { id: number; type: "generate"; text: string; voice: string };

let engine: Promise<KokoroTTS> | null = null;

function report(percent: number) {
  self.postMessage({ type: "progress", percent });
}

async function load(): Promise<KokoroTTS> {
  const progress_callback = (info: { status?: string; progress?: number }) => {
    if (info.status === "progress" && typeof info.progress === "number") report(info.progress);
  };
  if ((navigator as Navigator & { gpu?: unknown }).gpu) {
    try {
      return await KokoroTTS.from_pretrained(MODEL, { dtype: "fp32", device: "webgpu", progress_callback });
    } catch (error) {
      console.warn("Kokoro WebGPU unavailable, falling back to WASM", error);
    }
  }
  return KokoroTTS.from_pretrained(MODEL, { dtype: "q8", device: "wasm", progress_callback });
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    const tts = await (engine ??= load());
    if (request.type === "init") {
      self.postMessage({ type: "result", id: request.id, ok: true });
      return;
    }
    const audio = await tts.generate(request.text, { voice: request.voice as never });
    const samples = Float32Array.from(audio.audio);
    self.postMessage(
      { type: "result", id: request.id, ok: true, samples, rate: audio.sampling_rate },
      { transfer: [samples.buffer] },
    );
  } catch (error) {
    if (request.type === "init") engine = null;
    self.postMessage({ type: "result", id: request.id, ok: false, error: String(error) });
  }
};
