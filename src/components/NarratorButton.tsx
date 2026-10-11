import { Pause, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { NarrationGender } from "../lib/narrationVoice";

type NarrationStatus = "idle" | "playing" | "paused";
export type NarrationSnapshot = { status: NarrationStatus; text: string; position: number; duration: number; elapsedSeconds: number; usesAudioFile: boolean };

let activeSpeech: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeAudioSources: string[] = [];
let activeAudioSourceIndex = 0;
let completionHandler: (() => void) | undefined;
let snapshot: NarrationSnapshot = { status: "idle", text: "", position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
let elapsedTimer: number | undefined;
let elapsedBaseSeconds = 0;
let elapsedStartedAt = 0;
const listeners = new Set<() => void>();

function notify() { listeners.forEach((listener) => listener()); }

function stopElapsedTimer() {
  if (elapsedTimer !== undefined) window.clearInterval(elapsedTimer);
  elapsedTimer = undefined;
}

function startElapsedTimer(baseSeconds: number) {
  stopElapsedTimer();
  elapsedBaseSeconds = baseSeconds;
  elapsedStartedAt = Date.now();
  elapsedTimer = window.setInterval(() => {
    const elapsedSeconds = elapsedBaseSeconds + Math.floor((Date.now() - elapsedStartedAt) / 1000);
    if (elapsedSeconds === snapshot.elapsedSeconds) return;
    snapshot = { ...snapshot, elapsedSeconds };
    notify();
  }, 250);
}

export function getNarrationSnapshot() { return snapshot; }

export function subscribeNarration(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  stopElapsedTimer();
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  activeSpeech = null;
  activeAudioSources = [];
  activeAudioSourceIndex = 0;
  completionHandler = undefined;
  snapshot = { status: "idle", text: "", position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
  notify();
}

function startTextToSpeech(
  text: string,
  onEnded?: () => void,
  fromPosition = 0,
  onError?: () => void,
  preference: NarrationGender = "male",
) {
  if (!("speechSynthesis" in window) || !text.trim()) return false;
  const position = snapshot.text === text ? Math.max(0, fromPosition) : 0;
  const elapsedBase = snapshot.text === text && (snapshot.status === "paused" || snapshot.status === "playing")
    ? snapshot.elapsedSeconds
    : 0;
  window.speechSynthesis.cancel();
  activeAudio?.pause();
  activeAudio = null;
  completionHandler = onEnded;
  const utterance = new SpeechSynthesisUtterance(text.slice(position));
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voiceHints = preference === "male"
    ? /male|man|david|mark|alex|daniel|fred|jorge|aaron|guy|ryan|brian|matthew|justin|joey/i
    : /female|woman|zira|samantha|victoria|karen|moira|tessa|susan|hazel|aria|jenny|sara|ava|emma|allison|joanna|kendra|kimberly|salli|ivy/i;
  utterance.voice = window.speechSynthesis.getVoices().find((voice) =>
    voice.lang.toLowerCase().startsWith("en") && voiceHints.test(voice.name),
  ) ?? null;
  utterance.onboundary = (event) => {
    if (activeSpeech !== utterance) return;
    snapshot = { ...snapshot, status: "playing", text, position: position + event.charIndex };
    notify();
  };
  utterance.onend = () => {
    if (activeSpeech !== utterance) return;
    activeSpeech = null;
    stopElapsedTimer();
    snapshot = { ...snapshot, status: "idle" };
    const onComplete = completionHandler;
    completionHandler = undefined;
    notify();
    onComplete?.();
  };
  utterance.onerror = () => {
    if (activeSpeech !== utterance) return;
    stopSpeaking();
    onError?.();
  };
  activeSpeech = utterance;
  snapshot = { status: "playing", text, position, duration: 0, elapsedSeconds: elapsedBase, usesAudioFile: false };
  startElapsedTimer(elapsedBase);
  window.speechSynthesis.speak(utterance);
  notify();
  return true;
}

function playAudioSource(
  text: string,
  sourceIndex: number,
  onEnded?: () => void,
  onError?: () => void,
  preference: NarrationGender = "male",
) {
  if (sourceIndex >= activeAudioSources.length) {
    activeAudio = null;
    const started = startTextToSpeech(text, onEnded, 0, onError, preference);
    if (!started) {
      activeAudioSources = [];
      activeAudioSourceIndex = 0;
      completionHandler = undefined;
      snapshot = { status: "idle", text, position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
      notify();
      onError?.();
    }
    return started;
  }
  activeAudioSourceIndex = sourceIndex;
  const audioUrl = activeAudioSources[sourceIndex];
  const audio = new Audio(audioUrl);
  activeAudio = audio;
  snapshot = { status: "playing", text, position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: true };
  const updateAudioProgress = () => {
    if (activeAudio !== audio) return;
    snapshot = {
      ...snapshot,
      position: audio.currentTime,
      elapsedSeconds: Math.floor(audio.currentTime),
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    };
    notify();
  };
  audio.onloadedmetadata = updateAudioProgress;
  audio.ondurationchange = updateAudioProgress;
  audio.ontimeupdate = updateAudioProgress;
  audio.onended = () => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    stopElapsedTimer();
    activeAudioSources = [];
    activeAudioSourceIndex = 0;
    snapshot = { ...snapshot, status: "idle", position: 0, duration: 0, usesAudioFile: false };
    const onComplete = completionHandler;
    completionHandler = undefined;
    notify();
    onComplete?.();
  };
  audio.onerror = () => {
    if (activeAudio !== audio) return;
    console.warn(`Narration MP3 could not be loaded: ${audioUrl}`, audio.error);
    activeAudio = null;
    snapshot = { ...snapshot, status: "playing", usesAudioFile: false };
    void playAudioSource(text, sourceIndex + 1, onEnded, onError, preference);
  };
  notify();
  void audio.play().catch((error: unknown) => {
    if (activeAudio !== audio) return;
    console.warn(`Narration MP3 could not be played: ${audioUrl}`, error);
    activeAudio = null;
    snapshot = { ...snapshot, status: "playing", usesAudioFile: false };
    void playAudioSource(text, sourceIndex + 1, onEnded, onError, preference);
  });
  return true;
}

export function startSpeaking(
  text: string,
  audioUrls: string[] = [],
  onEnded?: () => void,
  onError?: () => void,
  preference: NarrationGender = "male",
) {
  if (!text.trim()) return false;
  stopElapsedTimer();
  snapshot = { ...snapshot, status: "idle", text, position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
  activeAudioSources = [...new Set(audioUrls)];
  activeAudioSourceIndex = 0;
  if (!activeAudioSources.length || !("Audio" in window)) {
    const started = startTextToSpeech(text, onEnded, 0, onError, preference);
    if (!started) onError?.();
    return started;
  }
  window.speechSynthesis?.cancel();
  activeSpeech = null;
  activeAudio?.pause();
  completionHandler = onEnded;
  return playAudioSource(text, 0, onEnded, onError, preference);
}

export function resumeSpeaking(
  text: string,
  audioUrls: string[] = [],
  onEnded?: () => void,
  onError?: () => void,
  preference: NarrationGender = "male",
) {
  if (snapshot.text !== text || snapshot.status !== "paused") return startSpeaking(text, audioUrls, onEnded, onError, preference);
  if (onEnded) completionHandler = onEnded;
  if (activeAudio) {
    const audio = activeAudio;
    snapshot = { ...snapshot, status: "playing" };
    notify();
    void audio.play().catch(() => {
      if (activeAudio !== audio) return;
      activeAudio = null;
      void playAudioSource(text, activeAudioSourceIndex + 1, onEnded, onError, preference);
    });
    return true;
  }
  return startTextToSpeech(text, onEnded, snapshot.usesAudioFile ? 0 : snapshot.position, onError, preference);
}

export function pauseSpeaking() {
  if (snapshot.status !== "playing") return;
  if (elapsedTimer !== undefined) {
    elapsedBaseSeconds += Math.floor((Date.now() - elapsedStartedAt) / 1000);
    stopElapsedTimer();
  }
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
  if (!enabled || (current.status !== "playing" && current.status !== "paused") || !current.usesAudioFile) return null;
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

export function NarratorButton({
  text,
  audioUrls,
  voicePreference,
  onEnded,
}: {
  text: string;
  audioUrls?: string[];
  voicePreference: NarrationGender;
  onEnded?: () => void;
}) {
  const [current, setCurrent] = useState(getNarrationSnapshot);

  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);

  const isCurrent = current.text === text && current.status !== "idle";
  const toggle = () => {
    if (isCurrent && current.status === "playing") pauseSpeaking();
    else if (isCurrent && current.status === "paused") resumeSpeaking(text, audioUrls, onEnded, undefined, voicePreference);
    else startSpeaking(text, audioUrls, onEnded, undefined, voicePreference);
  };

  return <button className="narrator-button button button-outline" onClick={toggle} aria-label={isCurrent && current.status === "playing" ? "Pause narration" : "Listen to this reading"}>
    {isCurrent && current.status === "playing" ? <Pause size={15} /> : <Volume2 size={15} />}
    {isCurrent && current.status === "playing" ? "Pause" : current.status === "paused" && isCurrent ? "Resume" : "Listen"}
  </button>;
}
