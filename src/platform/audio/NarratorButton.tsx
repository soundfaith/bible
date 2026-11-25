import { Pause, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { NarrationGender } from "./narrationVoice";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { pickDeviceVoice, pickVoiceIndex } from "./deviceVoice";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";

const ESTIMATED_CHARS_PER_SECOND = 14;

type NarrationStatus = "idle" | "playing" | "paused";
// One continuous listening item made of several MP3s. Positions are measured from the start of the first part.
export type NarrationTimeline = { parts: { urls: string[]; chars: number }[]; index: number; startSeconds?: number; startPaused?: boolean };
export type NarrationTrack = {
  title: string;
  path: string;
  art: "bible" | "old-testament" | "new-testament" | "gospels" | "journey" | "freedom-journey" | "bible-journey" | "prayer" | "readings" | "rosary" | "saints" | "catechism" | "summa";
  next?: { title: string; path: string };
  timeline?: NarrationTimeline;
  // Full text of the whole item when its audio is split into parts; the player shows this as the transcript.
  transcript?: string;
  sequence?: { kind: "bible-journey"; periodId: string; storyIndex: number } | { kind: "rosary"; mysteryIndex: number; mode: "traditional" | "gospel"; clipIndex: number } | { kind: "breviary"; hour: string; date: string; segmentIndex: number } | { kind: "guided"; journeyId: GuidedJourneyId; day: number } | { kind: "catechism"; edition: number; groupId: string } | { kind: "summa"; partSlug: string; question: number; article?: number };
};
export type NarrationSnapshot = { status: NarrationStatus; text: string; position: number; duration: number; elapsedSeconds: number; usesAudioFile: boolean; track?: NarrationTrack; error?: string };
type SavedNarration = { snapshot: NarrationSnapshot; sources: string[]; preference: NarrationGender };
const NARRATION_STORAGE_KEY = "soundfaith-listening";
const POSITIONS_STORAGE_KEY = "soundfaith-listening-positions";
const FINISHED_FRACTION = 0.97;
type SavedPosition = { fraction: number; length: number };

function trackKey(track: NarrationTrack) {
  return `${track.path}|${JSON.stringify(track.sequence ?? null)}`;
}

// MP3 lengths measured in the browser, so each part sits at its real place on the cumulative timeline.
const probedSeconds = new Map<string, number>();
const probingUrls = new Set<string>();

function rememberDuration(url: string, seconds: number) {
  if (url && Number.isFinite(seconds) && seconds > 0) probedSeconds.set(url, seconds);
}

function probeTimelineDurations(timeline: NarrationTimeline) {
  if (!("Audio" in window)) return;
  for (const part of timeline.parts) {
    const url = part.urls[0];
    if (!url || probedSeconds.has(url) || probingUrls.has(url)) continue;
    probingUrls.add(url);
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      probingUrls.delete(url);
      rememberDuration(url, probe.duration);
      refreshTimelineDuration();
    };
    probe.onerror = () => { probingUrls.delete(url); };
    probe.src = url;
  }
}

function layoutTimeline(timeline: NarrationTimeline) {
  const starts: number[] = [];
  const durations: number[] = [];
  let total = 0;
  for (const part of timeline.parts) {
    const seconds = probedSeconds.get(part.urls[0] ?? "") ?? part.chars / ESTIMATED_CHARS_PER_SECOND;
    starts.push(total);
    durations.push(seconds);
    total += seconds;
  }
  return { starts, durations, total };
}

// Position and length within the MP3 that is currently playing.
function localPosition(state: NarrationSnapshot) {
  const timeline = state.track?.timeline;
  if (!timeline || !state.usesAudioFile) return { position: state.position, duration: state.duration };
  const layout = layoutTimeline(timeline);
  return { position: Math.max(0, state.position - (layout.starts[timeline.index] ?? 0)), duration: layout.durations[timeline.index] ?? 0 };
}

// Progress through the part being played, for bars that show one part at a time.
export function narrationPartProgress(state: NarrationSnapshot) {
  const local = localPosition(state);
  if (local.duration > 0) return Math.max(0, Math.min(1, local.position / local.duration));
  return state.text.length > 0 ? Math.max(0, Math.min(1, state.position / state.text.length)) : 0;
}

// Set by the page that owns the item, so it can start another part of the same item at a local offset.
type PartSeekHandler = (partIndex: number, seconds: number, paused: boolean) => void;
let partSeekHandler: PartSeekHandler | undefined;

export function setNarrationPartSeekHandler(handler: PartSeekHandler | undefined) {
  partSeekHandler = handler;
}

function partIndexAt(layout: { starts: number[] }, seconds: number) {
  let index = 0;
  layout.starts.forEach((start, i) => {
    if (start <= seconds) index = i;
  });
  return index;
}

function refreshTimelineDuration() {
  const timeline = snapshot.track?.timeline;
  if (!timeline) return;
  const layout = layoutTimeline(timeline);
  const position = activeAudio ? (layout.starts[timeline.index] ?? 0) + activeAudio.currentTime : snapshot.position;
  snapshot = { ...snapshot, position, duration: layout.total };
  notify();
}

function loadSavedPositions(): Record<string, SavedPosition> {
  try {
    return JSON.parse(window.localStorage.getItem(POSITIONS_STORAGE_KEY) || "{}") as Record<string, SavedPosition>;
  } catch {
    return {};
  }
}

// Remembers how far each item got so tapping it again resumes rather than restarting.
function rememberPosition(state: NarrationSnapshot) {
  if (!state.track || state.status === "idle" || !state.text) return;
  const local = localPosition(state);
  const fraction = state.usesAudioFile && local.duration > 0 ? local.position / local.duration : state.position / state.text.length;
  if (!Number.isFinite(fraction)) return;
  try {
    const positions = loadSavedPositions();
    positions[trackKey(state.track)] = { fraction: Math.max(0, Math.min(1, fraction)), length: state.text.length };
    window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.warn("Could not save playback position.", error);
  }
}

function savedFractionFor(track: NarrationTrack, text: string) {
  const saved = loadSavedPositions()[trackKey(track)];
  if (!saved || saved.length !== text.length || saved.fraction >= FINISHED_FRACTION) return 0;
  return saved.fraction;
}

function loadSavedNarration(): SavedNarration | null {
  try {
    const raw = window.localStorage.getItem(NARRATION_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedNarration;
    const track = saved.snapshot?.track;
    if (!track || typeof track.title !== "string" || typeof track.path !== "string" || !track.path.startsWith("#/") ||
      !["bible", "journey", "bible-journey", "prayer", "readings", "rosary", "saints", "catechism", "summa"].includes(track.art) ||
      typeof saved.snapshot.text !== "string" || !saved.snapshot.text.trim() ||
      !Number.isFinite(saved.snapshot.position) || !Number.isFinite(saved.snapshot.duration) ||
      !Array.isArray(saved.sources) || !saved.sources.every((source) => typeof source === "string")) return null;
    return saved;
  } catch (error) {
    console.warn("Could not restore listening progress.", error);
    return null;
  }
}

function currentTrack(): NarrationTrack {
  const path = window.location.hash || "#/";
  const art = path.startsWith("#/read") ? "bible" : path.startsWith("#/journeys/freedom") ? "freedom-journey" : path.startsWith("#/journeys") ? "journey" : path.startsWith("#/journey") ? "bible-journey" : path.startsWith("#/breviary") ? "prayer" : path.startsWith("#/rosary") ? "rosary" : path.startsWith("#/saints") ? "saints" : path.startsWith("#/catechism") ? "catechism" : path.startsWith("#/summa") ? "summa" : "readings";
  return { title: document.querySelector("main h1")?.textContent?.trim() || "SoundFaith narration", path, art };
}

let activeSpeech: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
const savedNarration = loadSavedNarration();
let activeAudioSources: string[] = savedNarration?.sources ?? [];
let activeAudioSourceIndex = 0;
let completionHandler: (() => void) | undefined;
let activePreference: NarrationGender = savedNarration?.preference === "female" ? "female" : "male";
let snapshot: NarrationSnapshot = savedNarration
  ? { ...savedNarration.snapshot, status: "paused" }
  : { status: "idle", text: "", position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
let elapsedTimer: number | undefined;
// Many device voices never fire word-boundary events, so progress also advances from the clock.
let deviceClock: { char: number; seconds: number } | null = null;
let elapsedBaseSeconds = 0;
let elapsedStartedAt = 0;
const listeners = new Set<() => void>();
let lastSavedAt = 0;
let lastSavedText = "";
let lastSavedStatus: NarrationStatus = "idle";
let lastSavedTrack: NarrationTrack | undefined;
let storageWarningShown = false;

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
    } catch (error) {
      if (nativeSession !== session) return;
      console.error("Device narration failed.", error);
      nativeSession = null;
      stopElapsedTimer();
      onError?.();
    }
  })();
}

function stopNativeSpeech() {
  if (!nativeSession) return;
  nativeSession = null;
  void TextToSpeech.stop().catch(() => undefined);
}

function saveListeningProgress() {
  const now = Date.now();
  rememberPosition(snapshot);
  try {
    if (snapshot.status === "idle" || !snapshot.track) window.localStorage.removeItem(NARRATION_STORAGE_KEY);
    else window.localStorage.setItem(NARRATION_STORAGE_KEY, JSON.stringify({ snapshot, sources: activeAudioSources, preference: activePreference }));
    lastSavedAt = now;
    lastSavedText = snapshot.text;
    lastSavedStatus = snapshot.status;
    lastSavedTrack = snapshot.track;
  } catch (error) {
    if (!storageWarningShown) console.warn("Could not save listening progress.", error);
    storageWarningShown = true;
  }
}

function notify() {
  const now = Date.now();
  if (snapshot.text !== lastSavedText || snapshot.status !== lastSavedStatus || snapshot.track !== lastSavedTrack || now - lastSavedAt >= 5000) saveListeningProgress();
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("pagehide", saveListeningProgress);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveListeningProgress();
  });
}

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
    const clockPosition = deviceClock && !snapshot.usesAudioFile && snapshot.text
      ? Math.min(snapshot.text.length - 1, deviceClock.char + Math.floor((elapsedSeconds - deviceClock.seconds) * ESTIMATED_CHARS_PER_SECOND))
      : 0;
    const position = clockPosition > snapshot.position ? clockPosition : snapshot.position;
    snapshot = { ...snapshot, elapsedSeconds, position };
    notify();
  }, 250);
}

export function getNarrationSnapshot() { return snapshot; }

export function estimatedNarrationDuration(text: string) {
  return `~${Math.max(1, Math.ceil(text.length / ESTIMATED_CHARS_PER_SECOND / 60))} min`;
}

export function narrationDescription(current: NarrationSnapshot) {
  const duration = current.duration || (current.text.length / ESTIMATED_CHARS_PER_SECOND);
  const progress = current.duration > 0 ? current.position / current.duration : current.text.length ? current.position / current.text.length : 0;
  const minutes = Math.max(1, Math.ceil(duration / 60));
  return `${current.duration ? "" : "~"}${minutes} min · ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}% complete`;
}

export function subscribeNarration(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function reportPlaybackFailure(onError?: () => void) {
  snapshot = { ...snapshot, status: "idle", error: "Audio could not be played on this device. Please try again." };
  notify();
  onError?.();
}

export function dismissNarrationError() {
  snapshot = { ...snapshot, error: undefined };
  notify();
}

export function showNarrationError(message: string) {
  snapshot = { ...snapshot, error: message };
  notify();
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
  deviceClock = { char: position, seconds: elapsedBase };
  if (native) {
    activeSpeech = null;
    snapshot = { ...snapshot, status: "playing", text, position, duration: 0, elapsedSeconds: elapsedBase, usesAudioFile: false };
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
  utterance.onerror = (error) => {
    if (activeSpeech !== utterance) return;
    console.error("Device narration failed.", error);
    activeSpeech = null;
    stopElapsedTimer();
    onError?.();
  };
  activeSpeech = utterance;
  snapshot = { ...snapshot, status: "playing", text, position, duration: 0, elapsedSeconds: elapsedBase, usesAudioFile: false };
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
  resume?: { fraction: number; paused: boolean; seconds?: number },
) {
  // Timeline items keep their cumulative position between parts, so the bar does not jump back to zero.
  const keepPosition = Boolean(resume || snapshot.track?.timeline);
  if (sourceIndex >= activeAudioSources.length) {
    activeAudio = null;
    const position = resume ? Math.min(text.length - 1, Math.max(0, Math.floor(resume.fraction * text.length))) : 0;
    if (resume?.paused && (useNativeSpeech() || "speechSynthesis" in window)) {
      completionHandler = onEnded;
      activePreference = preference;
      snapshot = { ...snapshot, status: "paused", text, position, duration: 0, usesAudioFile: false };
      notify();
      return true;
    }
    const started = startTextToSpeech(text, onEnded, position, onError, preference);
    if (!started) {
      activeAudioSources = [];
      activeAudioSourceIndex = 0;
      completionHandler = undefined;
      snapshot = { ...snapshot, status: "idle", text, position: 0, duration: 0, elapsedSeconds: 0, usesAudioFile: false };
      notify();
      onError?.();
    }
    return started;
  }
  activeAudioSourceIndex = sourceIndex;
  const audioUrl = activeAudioSources[sourceIndex];
  const audio = new Audio(audioUrl);
  activeAudio = audio;
  snapshot = {
    ...snapshot,
    status: resume?.paused ? "paused" : "playing",
    text,
    position: keepPosition ? snapshot.position : 0,
    duration: keepPosition ? snapshot.duration : 0,
    elapsedSeconds: resume ? snapshot.elapsedSeconds : 0,
    usesAudioFile: true,
  };
  let pendingStart: { fraction: number; seconds?: number } | null = resume ? { fraction: resume.fraction, seconds: resume.seconds } : null;
  const updateAudioProgress = () => {
    if (activeAudio !== audio) return;
    if (pendingStart !== null) {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      // The other voice has a different length, so continue from the same relative spot.
      audio.currentTime = Math.min(pendingStart.seconds ?? pendingStart.fraction * audio.duration, audio.duration);
      pendingStart = null;
    }
    if (sourceIndex === 0) rememberDuration(audioUrl, audio.duration);
    const timeline = snapshot.track?.timeline;
    if (timeline) {
      const layout = layoutTimeline(timeline);
      snapshot = {
        ...snapshot,
        position: (layout.starts[timeline.index] ?? 0) + audio.currentTime,
        elapsedSeconds: Math.floor(audio.currentTime),
        duration: layout.total,
      };
    } else {
      snapshot = {
        ...snapshot,
        position: audio.currentTime,
        elapsedSeconds: Math.floor(audio.currentTime),
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      };
    }
    notify();
  };
  audio.onloadedmetadata = updateAudioProgress;
  audio.ondurationchange = updateAudioProgress;
  audio.ontimeupdate = updateAudioProgress;
  audio.onended = () => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    stopElapsedTimer();
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
    tryNextAudioSource(text, sourceIndex + 1, onEnded, onError, preference);
  };
  notify();
  if (resume?.paused) return true;
  void audio.play().catch((error: unknown) => {
    if (activeAudio !== audio) return;
    console.warn(`Narration MP3 could not be played: ${audioUrl}`, error);
    tryNextAudioSource(text, sourceIndex + 1, onEnded, onError, preference);
  });
  return true;
}

function tryNextAudioSource(text: string, sourceIndex: number, onEnded?: () => void, onError?: () => void, preference: NarrationGender = "male") {
  const local = localPosition(snapshot);
  const fraction = local.duration > 0 ? Math.max(0, Math.min(1, local.position / local.duration)) : 0;
  const paused = snapshot.status === "paused";
  activeAudio = null;
  return playAudioSource(text, sourceIndex, onEnded, onError, preference, { fraction, paused });
}

let holdingPlayback = false;

// Loads an item in the paused state, so opening it never makes sound until the user presses play.
export function loadWithoutPlaying<T>(load: () => T): T {
  holdingPlayback = true;
  try {
    return load();
  } finally {
    holdingPlayback = false;
  }
}

export function startSpeaking(
  text: string,
  audioUrls: string[] = [],
  onEnded?: () => void,
  onError?: () => void,
  preference: NarrationGender = "male",
  track: NarrationTrack = currentTrack(),
) {
  if (!text.trim()) {
    reportPlaybackFailure(onError);
    return false;
  }
  const paused = holdingPlayback;
  // Tapping the item that is already playing or paused keeps its place instead of restarting it.
  if (snapshot.track && snapshot.text === text && trackKey(snapshot.track) === trackKey(track) && (snapshot.status === "playing" || snapshot.status === "paused")) {
    if (snapshot.status === "paused" && !paused) resumeSpeaking(text, audioUrls, onEnded, onError, preference);
    return true;
  }
  rememberPosition(snapshot);
  const fraction = savedFractionFor(track, text);
  stopElapsedTimer();
  window.speechSynthesis?.cancel();
  stopNativeSpeech();
  activeAudio?.pause();
  activeAudio = null;
  activeSpeech = null;
  activePreference = preference;
  const useAudio = audioUrls.length > 0 && "Audio" in window;
  const timeline = track.timeline;
  const layout = timeline ? layoutTimeline(timeline) : undefined;
  if (timeline) probeTimelineDurations(timeline);
  const charPosition = useAudio ? 0 : Math.floor(fraction * text.length);
  const timelinePosition = timeline && layout && useAudio ? (layout.starts[timeline.index] ?? 0) + (timeline.startSeconds ?? 0) : charPosition;
  snapshot = { ...snapshot, status: "idle", text, position: timelinePosition, duration: layout?.total ?? 0, elapsedSeconds: 0, usesAudioFile: false, track, error: undefined };
  activeAudioSources = [...new Set(audioUrls)];
  activeAudioSourceIndex = 0;
  const sequence = track.sequence?.kind;
  if (!onEnded && (sequence === "catechism" || sequence === "summa")) onEnded = () => { void playNextPlaylistItem(); };
  const fail = () => reportPlaybackFailure(onError);
  if (!useAudio) {
    if (paused && (useNativeSpeech() || "speechSynthesis" in window)) {
      completionHandler = onEnded;
      activePreference = preference;
      snapshot = { ...snapshot, status: "paused", text, position: charPosition, duration: 0, usesAudioFile: false };
      notify();
      return true;
    }
    const started = startTextToSpeech(text, onEnded, charPosition, fail, preference);
    if (!started) fail();
    return started;
  }
  completionHandler = onEnded;
  const resume = timeline?.startSeconds !== undefined
    ? { fraction: 0, paused: paused || (timeline.startPaused ?? false), seconds: timeline.startSeconds }
    : fraction > 0 || paused ? { fraction, paused } : undefined;
  return playAudioSource(text, 0, onEnded, fail, preference, resume);
}

export async function playNextPlaylistItem() {
  const track = snapshot.track;
  if (!track?.next) return;
  try {
    const { nextPlaylistItem } = await import("./audioPlaylists");
    const next = await nextPlaylistItem(track);
    if (snapshot.track !== track) return;
    if (!next) {
      reportPlaybackFailure();
      return;
    }
    startSpeaking(next.text, [], undefined, undefined, activePreference, next.track);
  } catch (error) {
    console.error("Could not load the next listening item.", error);
    if (snapshot.track === track) reportPlaybackFailure();
  }
}

export async function playPreviousPlaylistItem() {
  const track = snapshot.track;
  if (!track) return;
  try {
    const { previousPlaylistItem } = await import("./audioPlaylists");
    const previous = await previousPlaylistItem(track);
    if (snapshot.track !== track || !previous) return;
    startSpeaking(previous.text, [], undefined, undefined, activePreference, previous.track);
  } catch (error) {
    console.error("Could not load the previous listening item.", error);
  }
}

export function toggleActiveNarration() {
  if (snapshot.status === "playing") pauseSpeaking();
  else if (snapshot.status === "paused") resumeSpeaking(snapshot.text, activeAudioSources, completionHandler, undefined, activePreference);
  else if (snapshot.text && snapshot.track) startSpeaking(snapshot.text, activeAudioSources, undefined, undefined, activePreference, snapshot.track);
}

export function setNarrationCompletionHandler(onEnded: () => void) {
  completionHandler = onEnded;
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
    playAudioSource(text, 0, completionHandler, () => reportPlaybackFailure(), preference, { fraction, paused: status === "paused" });
    return;
  }
  if (!snapshot.usesAudioFile && status === "playing" && !startTextToSpeech(text, completionHandler, snapshot.position, () => reportPlaybackFailure(), preference)) reportPlaybackFailure();
}

export function resumeSpeaking(
  text: string,
  audioUrls: string[] = [],
  onEnded?: () => void,
  onError?: () => void,
  preference: NarrationGender = "male",
) {
  if (snapshot.text !== text || snapshot.status !== "paused") return startSpeaking(text, audioUrls, onEnded, onError, preference);
  const sequence = snapshot.track?.sequence?.kind;
  onEnded = onEnded ?? completionHandler ?? (sequence === "catechism" || sequence === "summa" ? () => { void playNextPlaylistItem(); } : undefined);
  const fail = () => reportPlaybackFailure(onError);
  if (onEnded) completionHandler = onEnded;
  if (activeAudio) {
    const audio = activeAudio;
    snapshot = { ...snapshot, status: "playing" };
    notify();
    void audio.play().catch((error: unknown) => {
      if (activeAudio !== audio) return;
      console.warn("Narration MP3 could not be resumed.", error);
      void tryNextAudioSource(text, activeAudioSourceIndex + 1, onEnded, fail, preference);
    });
    return true;
  }
  if (snapshot.usesAudioFile && activeAudioSources.length) {
    const local = localPosition(snapshot);
    const fraction = local.duration > 0 ? local.position / local.duration : 0;
    completionHandler = onEnded;
    return playAudioSource(text, 0, onEnded, fail, preference, { fraction: Math.max(0, Math.min(1, fraction)), paused: false, seconds: local.position });
  }
  const started = startTextToSpeech(text, onEnded, snapshot.usesAudioFile ? 0 : snapshot.position, fail, preference);
  if (!started) fail();
  return started;
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
  const timeline = snapshot.track?.timeline;
  if (timeline && snapshot.usesAudioFile) {
    const layout = layoutTimeline(timeline);
    const target = partIndexAt(layout, position);
    const local = Math.max(0, Math.min(position - (layout.starts[target] ?? 0), layout.durations[target] ?? 0));
    if (target !== timeline.index) {
      partSeekHandler?.(target, local, snapshot.status === "paused");
      return;
    }
    if (!activeAudio || !Number.isFinite(activeAudio.duration)) return;
    activeAudio.currentTime = Math.max(0, Math.min(local, activeAudio.duration));
    snapshot = { ...snapshot, position: (layout.starts[target] ?? 0) + activeAudio.currentTime, elapsedSeconds: Math.floor(activeAudio.currentTime) };
    notify();
    return;
  }
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
    if (!startTextToSpeech(text, completionHandler, index, () => reportPlaybackFailure(), activePreference)) reportPlaybackFailure();
    return;
  }
  if (!activeAudio || !Number.isFinite(activeAudio.duration)) return;
  activeAudio.currentTime = Math.max(0, Math.min(position, activeAudio.duration));
  snapshot = { ...snapshot, position: activeAudio.currentTime, elapsedSeconds: Math.floor(activeAudio.currentTime) };
  notify();
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function NarrationProgress({ className, enabled = true, narration }: { className: string; enabled?: boolean; narration?: NarrationSnapshot }) {
  const [subscribed, setCurrent] = useState(getNarrationSnapshot);
  const [dragValue, setDragValue] = useState<number | null>(null);
  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);
  const current = narration ?? subscribed;
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

export function NarratorButton({
  text,
  audioUrls,
  voicePreference,
  onEnded,
  track,
}: {
  text: string;
  audioUrls?: string[];
  voicePreference: NarrationGender;
  onEnded?: () => void;
  track?: NarrationTrack;
}) {
  const [current, setCurrent] = useState(getNarrationSnapshot);

  useEffect(() => subscribeNarration(() => setCurrent(getNarrationSnapshot())), []);

  const isCurrent = current.text === text && current.status !== "idle";
  const toggle = () => {
    if (isCurrent && current.status === "playing") pauseSpeaking();
    else {
      const started = isCurrent && current.status === "paused"
        ? resumeSpeaking(text, audioUrls, onEnded, undefined, voicePreference)
        : startSpeaking(text, audioUrls, onEnded, undefined, voicePreference, track);
      if (started) window.dispatchEvent(new Event("soundfaith:open-player"));
    }
  };

  return <button className="narrator-button button button-outline" onClick={toggle} aria-label={isCurrent && current.status === "playing" ? "Pause narration" : "Listen to this reading"}>
    {isCurrent && current.status === "playing" ? <Pause size={15} /> : <Volume2 size={15} />}
    {isCurrent && current.status === "playing" ? "Pause" : current.status === "paused" && isCurrent ? "Resume" : "Listen"}
  </button>;
}
