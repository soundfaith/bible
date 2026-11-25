import type { ChatMessage } from "./respond";

const KEY = "soundfaith-chat-history-v1";
const MAX_MESSAGES = 60;

export function loadChatHistory(): ChatMessage[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((message) => message && typeof message.id === "string" && (message.role === "user" || message.role === "assistant")) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // storage unavailable or full; history is a convenience only
  }
}

export function clearChatHistory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
