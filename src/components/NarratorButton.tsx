import { Pause, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { NarrationGender } from "../lib/narrationVoice";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { pickDeviceVoice, pickVoiceIndex } from "../lib/deviceVoice";

const ESTIMATED_CHARS_PER_SECOND = 14;

type NarrationStatus = "idle" | "playing" | "paused";
export type NarrationSnapshot = { status: NarrationStatus; text: string; position: number; duration: number; elapsedSeconds: number; usesAudioFile: boolean };

let activeSpeech: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeAudioSources: string[] = [];
let activeAudioSourceIndex = 0;
let completionHandler: (() => void) | undefined;
let activePreference: NarrationGender = "male";
let snapshot: NarrationSnapshot = { status: "idle", text: "", position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
let elapsedTimer: number | undefined;
let elapsedBaseSeconds = 0;
let elapsedStartedAt = 0;
const listeners = new Set<() => void>();

// Android WebView has no working speechSynthesis, so the app uses the native text-to-speech engine instead.
const useNativeSpeech = () => Capacitor.isNativePlatform();
let nativeSession: object | null = null;
let nativeBase = 0;
let nativeListenerReady = false;
let nativeVoices: Promise<{ name: string; lang: string; localService: boolean }[]> | null = null;

function loadNativeVoices() {
  if (!nativeVoices) nativeVoices = TextToSpeech.getSupportedVoices().then((result) => result.voices).catch(() => []);
  return nativeVoices;
}

function ensureNativeListener() {
  if (nativeListenerReady) return;
  nativeListenerReady = true;
  void TextToSpeech.addListener("onRangeStart", (info) => {
    if (!nativeSession) return;
    snapshot = { ...snapshot, status: "playing", position: nativeBase + info.start };
    notify();
  });
}

function speakNatively(text: string, position: number, onEnded: (() => void) | undefined, onError: (() => void) | undefined, preference: NarrationGender) {
  const session = {};
  nativeSession = session;
  nativeBase = position;
  ensureNativeListener();
  void (async () => {
    try {
      const voices = await loadNativeVoices();
      if (nativeSession !== session) return;
      await TextToSpeech.speak({
        text: text.slice(position),
        lang: "en-US",
        rate: 0.92,
        pitch: 1,
        volume: 1,
        voice: pickVoiceIndex(voices, preference),
        queueStrategy: 0,
      });
      if (nativeSession !== session) return;
      nativeSession = null;
      stopElapsedTimer();
      snapshot = { ...snapshot, status: "idle" };
      const onComplete = completionHandler;
      completionHandler = undefined;
      notify();
      onComplete?.();
    } catch {
      if (nativeSession !== session) return;
      stopSpeaking();
      onError?.();
    }
  })();
}

function stopNativeSpeech() {
  if (!nativeSession) return;
  nativeSession = null;
  void TextToSpeech.stop().catch(() => undefined);
}

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
  stopNativeSpeech();
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
  const native = useNativeSpeech();
  if ((!native && !("speechSynthesis" in window)) || !text.trim()) return false;
  const position = snapshot.text === text ? Math.max(0, fromPosition) : 0;
  const elapsedBase = snapshot.text === text && (snapshot.status === "paused" || snapshot.status === "playing")
    ? snapshot.elapsedSeconds
    : 0;
  window.speechSynthesis?.cancel();
  stopNativeSpeech();
  activeAudio?.pause();
  activeAudio = null;
  completionHandler = onEnded;
  activePreference = preference;
  if (native) {
    activeSpeech = null;
    snapshot = { status: "playing", text, position, duration: 0, elapsedSeconds: elapsedBase, usesAudioFile: false };
    startElapsedTimer(elapsedBase);
    notify();
    speakNatively(text, position, onEnded, onError, preference);
    return true;
  }
  const utterance = new SpeechSynthesisUtterance(text.slice(position));
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.voice = pickDeviceVoice(preference);
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
  resume?: { fraction: number; paused: boolean },
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
  snapshot = { status: resume?.paused ? "paused" : "playing", text, position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: true };
  let pendingFraction = resume ? resume.fraction : null;
  const updateAudioProgress = () => {
    if (activeAudio !== audio) return;
    if (pendingFraction !== null && Number.isFinite(audio.duration) && audio.duration > 0) {
      // The other voice has a different length, so continue from the same relative spot.
      audio.currentTime = pendingFraction * audio.duration;
      pendingFraction = null;
    }
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
  if (resume?.paused) return true;
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
  stopNativeSpeech();
  activeSpeech = null;
  activeAudio?.pause();
  completionHandler = onEnded;
  return playAudioSource(text, 0, onEnded, onError, preference);
}

export function changeNarrationVoice(preference: NarrationGender) {
  const previous = activePreference;
  activePreference = preference;
  if (previous === preference || (snapshot.status !== "playing" && snapshot.status !== "paused")) return;
  const { text, status } = snapshot;
  if (activeAudio) {
    const old = activeAudio;
    const fraction = Number.isFinite(old.duration) && old.duration > 0 ? old.currentTime / old.duration : 0;
    // Source URLs carry the voice name, so swapping it keeps each list in the new preferred order.
    const swap = (url: string) => url.replace(/am_michael|af_heart/g, (voice) => (voice === "am_michael" ? "af_heart" : "am_michael"));
    activeAudioSources = activeAudioSources.map(swap);
    activeAudio = null;
    old.pause();
    playAudioSource(text, 0, completionHandler, undefined, preference, { fraction, paused: status === "paused" });
    return;
  }
  if (!snapshot.usesAudioFile && status === "playing") startTextToSpeech(text, completionHandler, snapshot.position, undefined, preference);
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
  else {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopNativeSpeech();
  }
  activeSpeech = null;
  snapshot = { ...snapshot, status: "paused" };
  notify();
}

export function seekSpeaking(position: number) {
  if (!activeAudio && snapshot.text && (snapshot.status === "playing" || snapshot.status === "paused") && !snapshot.usesAudioFile) {
    // Device speech has no timeline, so map the estimated time back to a character and restart at the nearest word.
    const text = snapshot.text;
    let index = Math.max(0, Math.min(Math.round(position * ESTIMATED_CHARS_PER_SECOND), text.length - 1));
    while (index > 0 && !/\s/.test(text[index - 1])) index -= 1;
    if (snapshot.status === "paused") {
      snapshot = { ...snapshot, position: index };
      notify();
      return;
    }
    startTextToSpeech(text, completionHandler, index, undefined, activePreference);
    return;
  }
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
  const [dragValue, setDragValue] = useState<number | null>(null);
  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);
  if (!enabled || (current.status !== "playing" && current.status !== "paused")) return null;
  // Device speech reports no duration, so estimate it from the text length and the reading position.
  const estimated = !current.usesAudioFile;
  const duration = estimated ? current.text.length / ESTIMATED_CHARS_PER_SECOND : current.duration;
  const position = estimated ? current.position / ESTIMATED_CHARS_PER_SECOND : current.position;
  return <div className={`narration-progress ${className}`}>
    <span className="narration-time">{formatTime(position)}</span>
    <input
      className="narration-seek"
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={Math.min(dragValue ?? position, duration || 0)}
      disabled={!duration}
      aria-label={estimated ? "Estimated narration progress" : "Audio progress"}
      onChange={(event) => {
        const value = Number(event.currentTarget.value);
        // Restarting device speech on every drag tick would stutter, so commit on release.
        if (estimated) setDragValue(value);
        else seekSpeaking(value);
      }}
      onPointerUp={() => { if (dragValue !== null) { seekSpeaking(dragValue); setDragValue(null); } }}
      onKeyUp={() => { if (dragValue !== null) { seekSpeaking(dragValue); setDragValue(null); } }}
      onBlur={() => { if (dragValue !== null) { seekSpeaking(dragValue); setDragValue(null); } }}
    />
    <span className="narration-time">{estimated ? "~" : ""}{formatTime(duration)}</span>
  </div>;
}

export function JourneyNarrationProgress({
  className,
  storyCount,
  activeStoryIndex,
  activeStoryProgress,
  status,
  onSelectStory,
  itemLabel = "Story",
  positionLabel = "Story position in period",
}: {
  className: string;
  storyCount: number;
  activeStoryIndex: number;
  activeStoryProgress: number;
  status: NarrationStatus;
  onSelectStory: (storyIndex: number) => void;
  itemLabel?: string;
  positionLabel?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(activeStoryIndex);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      setSliderPosition(activeStoryIndex + Math.max(0, Math.min(activeStoryProgress, 1)));
    }
  }, [activeStoryIndex, activeStoryProgress]);

  if (storyCount < 1 || (status !== "playing" && status !== "paused")) return null;

  const selectStory = () => {
    isDragging.current = false;
    const storyIndex = Math.max(0, Math.min(Math.round(sliderPosition), storyCount - 1));
    setSliderPosition(storyIndex);
    onSelectStory(storyIndex);
  };

  return (
    <div
      className={`narration-progress ${className} journey-narration-progress`}
      style={{ "--story-segment-width": `${100 / storyCount}%` } as CSSProperties}
    >
      <input
        className="narration-seek"
        type="range"
        min={0}
        max={storyCount}
        step={0.01}
        value={Math.max(0, Math.min(sliderPosition, storyCount))}
        aria-label={positionLabel}
        aria-valuetext={`${itemLabel} ${Math.max(1, Math.min(Math.round(sliderPosition) + 1, storyCount))} of ${storyCount}`}
        onPointerDown={() => { isDragging.current = true; }}
        onChange={(event) => setSliderPosition(Number(event.currentTarget.value))}
        onPointerUp={selectStory}
        onPointerCancel={selectStory}
        onKeyUp={selectStory}
        onBlur={() => {
          if (isDragging.current) selectStory();
        }}
      />
    </div>
  );
}

let pageNarrationToggle: (() => void) | null = null;

// Lets the mobile bottom-nav Listen button drive the narration of the reading page currently on screen.
export function triggerPageNarration() {
  if (!pageNarrationToggle) return false;
  pageNarrationToggle();
  return true;
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

  useEffect(() => {
    pageNarrationToggle = toggle;
    return () => { if (pageNarrationToggle === toggle) pageNarrationToggle = null; };
  });

  return <button className="narrator-button button button-outline" onClick={toggle} aria-label={isCurrent && current.status === "playing" ? "Pause narration" : "Listen to this reading"}>
    {isCurrent && current.status === "playing" ? <Pause size={15} /> : <Volume2 size={15} />}
    {isCurrent && current.status === "playing" ? "Pause" : current.status === "paused" && isCurrent ? "Resume" : "Listen"}
  </button>;
}
