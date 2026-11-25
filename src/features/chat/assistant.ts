export const ASSISTANT_NAME = import.meta.env.VITE_ASSISTANT_NAME?.trim() || "Sofi";
export const OPEN_ASSISTANT_EVENT = "soundfaith:open-assistant";

export function openAssistant(question?: string) {
  window.dispatchEvent(new CustomEvent<{ question?: string }>(OPEN_ASSISTANT_EVENT, { detail: { question } }));
}
