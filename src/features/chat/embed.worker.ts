import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

let extractor: Promise<FeatureExtractionPipeline> | null = null;
const load = (model: string) => (extractor ??= pipeline("feature-extraction", model, { dtype: "q8" }) as Promise<FeatureExtractionPipeline>);

type Request = { id: number; type: "init" | "embed"; model: string; text?: string };

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, type, model, text } = event.data;
  try {
    const instance = await load(model);
    if (type === "init") {
      self.postMessage({ id, ok: true });
      return;
    }
    const output = await instance(text ?? "", { pooling: "cls", normalize: true });
    self.postMessage({ id, ok: true, vector: Float32Array.from(output.data as Float32Array) });
  } catch (error) {
    extractor = null;
    self.postMessage({ id, ok: false, error: String(error) });
  }
};
