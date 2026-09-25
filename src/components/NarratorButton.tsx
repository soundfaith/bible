import { Pause, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

type NarrationStatus = "idle" | "playing" | "paused";
export type NarrationSnapshot = { status: NarrationStatus; text: string; position: number };

let activeSpeech: SpeechSynthesisUtterance | null = null;
let snapshot: NarrationSnapshot = { status: "idle", text: "", position: 0 };
const listeners = new Set<() => void>();

function notify() { listeners.forEach((listener) => listener()); }

export function getNarrationSnapshot() { return snapshot; }

export function subscribeNarration(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  activeSpeech = null;
  snapshot = { status: "idle", text: "", position: 0 };
  notify();
}

export function startSpeaking(text: string) {
  if (!("speechSynthesis" in window) || !text.trim()) return false;
  const position = snapshot.text === text ? snapshot.position : 0;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(position));
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.onboundary = (event) => {
    if (activeSpeech !== utterance) return;
    snapshot = { status: "playing", text, position: position + event.charIndex };
    notify();
  };
  utterance.onend = () => {
    if (activeSpeech !== utterance) return;
    activeSpeech = null;
    snapshot = { status: "idle", text: "", position: 0 };
    notify();
  };
  utterance.onerror = () => { if (activeSpeech === utterance) stopSpeaking(); };
  activeSpeech = utterance;
  snapshot = { status: "playing", text, position };
  window.speechSynthesis.speak(utterance);
  notify();
  return true;
}

export function pauseSpeaking() {
  if (!("speechSynthesis" in window) || snapshot.status !== "playing") return;
  window.speechSynthesis.cancel();
  activeSpeech = null;
  snapshot = { ...snapshot, status: "paused" };
  notify();
}

export function NarratorButton({ text }: { text: string }) {
  const [current, setCurrent] = useState(getNarrationSnapshot);

  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);

  const isCurrent = current.text === text && current.status !== "idle";
  const toggle = () => {
    if (isCurrent && current.status === "playing") pauseSpeaking();
    else startSpeaking(text);
  };

  return <button className="narrator-button button button-outline" onClick={toggle} aria-label={isCurrent && current.status === "playing" ? "Pause narration" : "Listen to this reading"}>
    {isCurrent && current.status === "playing" ? <Pause size={15} /> : <Volume2 size={15} />}
    {isCurrent && current.status === "playing" ? "Pause" : current.status === "paused" && isCurrent ? "Resume" : "Listen"}
  </button>;
}
