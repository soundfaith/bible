import { Pause, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

type NarrationStatus = "idle" | "playing" | "paused";
export type NarrationSnapshot = { status: NarrationStatus; text: string; position: number; duration: number };

let activeSpeech: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let completionHandler: (() => void) | undefined;
let snapshot: NarrationSnapshot = { status: "idle", text: "", position: 0, duration: 0 };
const listeners = new Set<() => void>();

function notify() { listeners.forEach((listener) => listener()); }

export function getNarrationSnapshot() { return snapshot; }

export function subscribeNarration(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  activeSpeech = null;
  completionHandler = undefined;
  snapshot = { status: "idle", text: "", position: 0, duration: 0 };
  notify();
}

function startTextToSpeech(text: string, onEnded?: () => void) {
  if (!("speechSynthesis" in window) || !text.trim()) return false;
  const position = snapshot.text === text ? snapshot.position : 0;
  window.speechSynthesis.cancel();
  activeAudio?.pause();
  activeAudio = null;
  completionHandler = onEnded;
  const utterance = new SpeechSynthesisUtterance(text.slice(position));
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.onboundary = (event) => {
    if (activeSpeech !== utterance) return;
    snapshot = { ...snapshot, status: "playing", text, position: position + event.charIndex };
    notify();
  };
  utterance.onend = () => {
    if (activeSpeech !== utterance) return;
    activeSpeech = null;
    snapshot = { ...snapshot, status: "idle" };
    const onComplete = completionHandler;
    completionHandler = undefined;
    notify();
    onComplete?.();
  };
  utterance.onerror = () => { if (activeSpeech === utterance) stopSpeaking(); };
  activeSpeech = utterance;
  snapshot = { status: "playing", text, position, duration: 0 };
  window.speechSynthesis.speak(utterance);
  notify();
  return true;
}

export function startSpeaking(text: string, audioUrl?: string, onEnded?: () => void) {
  if (!text.trim()) return false;
  if (!audioUrl) return startTextToSpeech(text, onEnded);

  if (!("Audio" in window)) return startTextToSpeech(text, onEnded);
  window.speechSynthesis?.cancel();
  activeSpeech = null;
  activeAudio?.pause();
  completionHandler = onEnded;
  const audio = new Audio(audioUrl);
  activeAudio = audio;
  snapshot = { status: "playing", text, position: 0, duration: 0 };
  const updateAudioProgress = () => {
    if (activeAudio !== audio) return;
    snapshot = { ...snapshot, position: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 };
    notify();
  };
  audio.onloadedmetadata = updateAudioProgress;
  audio.ondurationchange = updateAudioProgress;
  audio.ontimeupdate = updateAudioProgress;
  audio.onended = () => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    snapshot = { ...snapshot, status: "idle", position: 0, duration: 0 };
    const onComplete = completionHandler;
    completionHandler = undefined;
    notify();
    onComplete?.();
  };
  audio.onerror = () => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    console.warn(`Narration MP3 could not be loaded: ${audioUrl}`, audio.error);
    startTextToSpeech(text, onEnded);
  };
  notify();
  void audio.play().catch((error: unknown) => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    console.warn(`Narration MP3 could not be played: ${audioUrl}`, error);
    startTextToSpeech(text, onEnded);
  });
  return true;
}

export function resumeSpeaking(text: string, audioUrl?: string, onEnded?: () => void) {
  if (snapshot.text !== text || snapshot.status !== "paused") return startSpeaking(text, audioUrl, onEnded);
  if (onEnded) completionHandler = onEnded;
  if (activeAudio) {
    snapshot = { ...snapshot, status: "playing" };
    notify();
    void activeAudio.play().catch(() => {
      activeAudio = null;
      startTextToSpeech(text, onEnded);
    });
    return true;
  }
  return startTextToSpeech(text, onEnded);
}

export function pauseSpeaking() {
  if (snapshot.status !== "playing") return;
  if (activeAudio) activeAudio.pause();
  else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  activeSpeech = null;
  snapshot = { ...snapshot, status: "paused" };
  notify();
}

export function seekSpeaking(position: number) {
  if (!activeAudio || !Number.isFinite(activeAudio.duration)) return;
  activeAudio.currentTime = Math.max(0, Math.min(position, activeAudio.duration));
  snapshot = { ...snapshot, position: activeAudio.currentTime };
  notify();
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function NarrationProgress({ className, enabled = true }: { className: string; enabled?: boolean }) {
  const [current, setCurrent] = useState(getNarrationSnapshot);
  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);
  if (!enabled) return null;
  return <div className={`narration-progress ${className}`}>
    <span className="narration-time">{formatTime(current.position)}</span>
    <input
      className="narration-seek"
      type="range"
      min={0}
      max={current.duration || 0}
      step={0.1}
      value={Math.min(current.position, current.duration || 0)}
      disabled={!current.duration}
      aria-label="Audio progress"
      onChange={(event) => seekSpeaking(Number(event.currentTarget.value))}
    />
    <span className="narration-time">{formatTime(current.duration)}</span>
  </div>;
}

export function NarratorButton({ text, audioUrl, onEnded }: { text: string; audioUrl?: string; onEnded?: () => void }) {
  const [current, setCurrent] = useState(getNarrationSnapshot);

  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);

  const isCurrent = current.text === text && current.status !== "idle";
  const toggle = () => {
    if (isCurrent && current.status === "playing") pauseSpeaking();
    else if (isCurrent && current.status === "paused") resumeSpeaking(text, audioUrl, onEnded);
    else startSpeaking(text, audioUrl, onEnded);
  };

  return <button className="narrator-button button button-outline" onClick={toggle} aria-label={isCurrent && current.status === "playing" ? "Pause narration" : "Listen to this reading"}>
    {isCurrent && current.status === "playing" ? <Pause size={15} /> : <Volume2 size={15} />}
    {isCurrent && current.status === "playing" ? "Pause" : current.status === "paused" && isCurrent ? "Resume" : "Listen"}
  </button>;
}
