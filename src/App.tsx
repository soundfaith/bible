import { useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { X } from "lucide-react";
import { localDateKey, type RecommendationPage } from "@/features/daily";
import { type Modal } from "./components/ModalLayer";
import { useAppNavigation } from "./app/navigation";
import { useAppBookmarks } from "./app/bookmarks";
import { useJourneyAppState } from "./app/journeys";
import { renderDailyRecommendation, useDailyCoordination, useJourneyStreakActions } from "./app/daily";
import { useListenLaunch } from "./app/listen";
import { AppRoutes } from "./app/router";
import { breviaryIntroText, isBibleArt, journeyIntroText, type BibleArt } from "./app/audio";
import { AppOverlays } from "./app/overlays";
import { MobileBottomNav, SiteFooter, SiteHeader } from "./app/layout";
import { readBreviaryHour, readGuidedJourney, readJourneyPeriodId, readJourneyStoryAnchor, readRoute, readRosaryMysteryIndex, readSaintSlug, type Route } from "./app/routing";
import { useReaderFontSize, useTheme, useVoicePreference } from "./app/preferences";
import { journeyStoryNarration } from "@/features/journeys";
import { bibleBooks, getChapter, getChapterCount, getLastReading, type ReadingPosition } from "@/features/bible";
import { buildRosarySequence, type RosaryMode } from "@/features/rosary/rosary";
import { assembleBreviary, breviaryNarrationText, isBreviaryHour, type BreviaryHour } from "@/features/breviary/breviary";
import { useScrollReveal } from "./lib/reveal";
import { bibleJourney } from "@/features/journeys/bibleJourney";
import { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { breviaryIntroAudioUrls, journeyIntroAudioUrls, journeyStoryAudioUrls, narrationAudioUrlsFor, rosaryAudioUrlsFor } from "@/platform/audio/narrationAudio";
import { getTodaysMassReading } from "@/features/mass-readings";
import {
  getNarrationSnapshot,
  JourneyNarrationProgress,
  pauseSpeaking,
  resumeSpeaking,
  startSpeaking,
  stopSpeaking,
  subscribeNarration,
  toggleActiveNarration,
  setNarrationCompletionHandler,
  dismissNarrationError,
  playNextPlaylistItem,
  playPreviousPlaylistItem,
  narrationPartProgress,
  setNarrationPartSeekHandler,
  type NarrationTimeline,
  type NarrationTrack,
} from "@/platform/audio/NarratorButton";
import { AudioPlayer } from "@/platform/audio/AudioPlayer";

type JourneyAudioStatus = "idle" | "playing" | "paused";
type JourneyAudioState = {
  periodId: string | null;
  storyIndex: number;
  status: JourneyAudioStatus;
  error: string | null;
};
type BreviaryAudioState = { segmentIndex: number; status: JourneyAudioStatus; error: string | null };
const INITIAL_BREVIARY_AUDIO: BreviaryAudioState = { segmentIndex: 0, status: "idle", error: null };
type RosaryAudioState = { segmentIndex: number; clipIndex: number; segmentElapsedSeconds: number; prayedBeadIndices: number[]; status: JourneyAudioStatus; error: string | null };
const INITIAL_ROSARY_AUDIO: RosaryAudioState = { segmentIndex: 0, clipIndex: 0, segmentElapsedSeconds: 0, prayedBeadIndices: [], status: "idle", error: null };
const ROSARY_MODE_KEY = "rosary-mode";
const INITIAL_JOURNEY_AUDIO: JourneyAudioState = { periodId: null, storyIndex: 0, status: "idle", error: null };
const JOURNEY_INTRO_INDEX = -1;
const BREVIARY_INTRO_INDEX = -1;
// Where to resume inside a part of a multi-MP3 item, used when seeking across parts.
type PartStart = { seconds: number; paused: boolean };
type BreviaryPart = { segmentIndex: number; title: string; text: string; audioUrls: string[]; scrollId?: string };

function readRosaryMode(): RosaryMode {
  try {
    return window.localStorage.getItem(ROSARY_MODE_KEY) === "gospel" ? "gospel" : "traditional";
  } catch {
    return "traditional";
  }
}

export default function App() {
  useScrollReveal();
  const [route, setRoute] = useState<Route>(readRoute);
  const [saintSlug, setSaintSlug] = useState<string>(readSaintSlug);
  const [rosaryMysteryIndex, setRosaryMysteryIndex] = useState<number>(readRosaryMysteryIndex);
  const [journeyPeriodId, setJourneyPeriodId] = useState<string | null>(readJourneyPeriodId);
  const [journeyStoryAnchor, setJourneyStoryAnchor] = useState<string | null>(readJourneyStoryAnchor);
  const [guidedJourneyRoute, setGuidedJourneyRoute] = useState(readGuidedJourney);
  const [menuOpen, setMenuOpen] = useState(false);
  const { fontSize, setFontSize } = useReaderFontSize();
  const [modal, setModal] = useState<Modal | null>(null);
  const { theme, setTheme } = useTheme();
  const { voicePreference, voicePreferenceError, voicePreferenceRef, changeVoicePreference } = useVoicePreference();
  const [rosaryMode, setRosaryModeState] = useState<RosaryMode>(readRosaryMode);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(getLastReading);
  const [massDate, setMassDate] = useState(() => getTodaysMassReading().date);
  const [breviaryDate, setBreviaryDate] = useState(() => new Date());
  const [breviaryHour, setBreviaryHour] = useState<string | null>(readBreviaryHour);
  const [breviaryAudio, setBreviaryAudio] = useState<BreviaryAudioState>(INITIAL_BREVIARY_AUDIO);
  const [rosaryAudio, setRosaryAudio] = useState<RosaryAudioState>(INITIAL_ROSARY_AUDIO);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [playerOpen, setPlayerOpenState] = useState(false);
  // Stays mounted while the close animation runs so the player can slide down before unmounting.
  const [playerClosing, setPlayerClosing] = useState(false);
  const playerCloseTimerRef = useRef<number | undefined>(undefined);
  // The full player is mobile-only. On desktop, playback continues without opening it.
  const setPlayerOpen = (open: boolean) => {
    if (open && window.innerWidth > 760) return;
    window.clearTimeout(playerCloseTimerRef.current);
    if (open) {
      // Read the active track before opening so the player cannot render a stale narration snapshot.
      setNarration(getNarrationSnapshot());
      setPlayerClosing(false);
      setPlayerOpenState(true);
      return;
    }
    if (!playerOpen) return;
    setPlayerOpenState(false);
    setPlayerClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    playerCloseTimerRef.current = window.setTimeout(() => setPlayerClosing(false), reduceMotion ? 0 : 280);
  };
  const [journeyAudio, setJourneyAudio] = useState<JourneyAudioState>(INITIAL_JOURNEY_AUDIO);
  const { bookmarks, bookmarkCategories, isChapterBookmarked, isBookmarked, toggleBookmark, removeBookmark, removeBookmarkCategory } = useAppBookmarks({ route, readingPosition, setModal });
  const { lastJourneyPeriodId, journeyProgress, setJourneyProgress, guidedJourneyProgress, journeyArtwork, updateGuidedProgress, selectJourneyArtwork } = useJourneyAppState(route, journeyPeriodId);
  const activeGuidedId = guidedJourneyRoute?.journeyId ?? "freedom";
  const activeGuidedDay = guidedJourneyRoute?.day ?? null;
  const menuRef = useRef<HTMLElement | null>(null);
  const activeGuidedStarted = guidedJourneyProgress[activeGuidedId].started;
  const { dailyStreak, setDailyStreak } = useDailyCoordination({ route, breviaryHour, breviaryDate, massDate, saintSlug, journeyPeriodId, activeGuidedId, activeGuidedStarted });
  const { toggleJourneyPeriod, startGuidedJourney, completeGuidedJourneyDay, markGuidedDayPlayed } = useJourneyStreakActions({ setDailyStreak, journeyProgress, setJourneyProgress, guidedJourneyProgress, updateGuidedProgress });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const root = document.documentElement;
    let lastY = Math.max(0, window.scrollY);
    let mode = "";
    const apply = (next: string) => {
      if (next === mode) return;
      mode = next;
      root.dataset.chrome = next;
    };
    apply("both");
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (y <= 8) apply("both");
      else if (Math.abs(delta) > 10) apply(delta > 0 ? "nav" : "header");
      if (Math.abs(delta) > 10 || y <= 8) lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.chrome;
    };
  }, []);
  const journeyAudioStateRef = useRef(journeyAudio);
  const breviaryAudioStateRef = useRef(breviaryAudio);
  const rosaryAudioStateRef = useRef(rosaryAudio);
  const rosarySequence = useMemo(() => buildRosarySequence(rosaryMode, rosaryMysteryIndex), [rosaryMode, rosaryMysteryIndex]);
  const rosarySegmentsRef = useRef(rosarySequence.segments);
  const rosaryClipsRef = useRef(rosarySequence.clips);
  if (rosaryAudio.status === "idle") {
    rosarySegmentsRef.current = rosarySequence.segments;
    rosaryClipsRef.current = rosarySequence.clips;
  }
  const breviaryDay = route === "breviary" && isBreviaryHour(breviaryHour)
    ? assembleBreviary(breviaryDate, breviaryHour, voicePreference)
    : null;
  const breviaryDayRef = useRef(breviaryDay);
  if (breviaryAudio.status === "idle" && breviaryDay) breviaryDayRef.current = breviaryDay;
  const nextBiblePosition = (position: ReadingPosition): ReadingPosition | null => {
    if (position.chapter < getChapterCount(position.bookId)) return { ...position, chapter: position.chapter + 1 };
    const index = bibleBooks.findIndex((book) => book.id === position.bookId);
    const nextBook = index >= 0 ? bibleBooks[index + 1] : undefined;
    return nextBook ? { bookId: nextBook.id, chapter: 1 } : null;
  };
  const bibleTrack = (position: ReadingPosition, art: BibleArt = "bible"): NarrationTrack => {
    const book = bibleBooks.find((item) => item.id === position.bookId);
    const path = `#/read?book=${encodeURIComponent(position.bookId)}&chapter=${position.chapter}`;
    const next = nextBiblePosition(position);
    const nextBook = next && bibleBooks.find((item) => item.id === next.bookId);
    return { title: `${book?.name ?? position.bookId} ${position.chapter}`, path, art, next: next ? { title: `${nextBook?.name ?? next.bookId} ${next.chapter}`, path: `#/read?book=${encodeURIComponent(next.bookId)}&chapter=${next.chapter}` } : undefined };
  };
  // Keeps the artwork chosen when playback started (e.g. Old Testament or Gospels) while moving between chapters.
  const advanceNarration = (position: ReadingPosition, art: BibleArt = "bible") => {
    const next = nextBiblePosition(position);
    if (!next) return;
    const text = getChapter(next.bookId, next.chapter).map((verse) => verse.text).join(" ");
    setReadingPosition((current) => current.bookId === position.bookId && current.chapter === position.chapter ? next : current);
    startSpeaking(text, narrationAudioUrlsFor(next.bookId, next.chapter, voicePreferenceRef.current), () => advanceNarration(next, art), undefined, voicePreferenceRef.current, bibleTrack(next, art));
  };
  useEffect(() => {
    const track = getNarrationSnapshot().track;
    if (!track?.path.startsWith("#/read?")) return;
    const query = new URLSearchParams(track.path.split("?")[1]);
    const bookId = query.get("book");
    const chapter = Number(query.get("chapter"));
    if (bookId && bibleBooks.some((book) => book.id === bookId) && Number.isInteger(chapter) && chapter > 0 && chapter <= getChapterCount(bookId)) {
      setNarrationCompletionHandler(() => advanceNarration({ bookId, chapter }));
    }
  }, []);
  const updateJourneyAudio = (next: JourneyAudioState) => {
    journeyAudioStateRef.current = next;
    setJourneyAudio(next);
  };
  const failJourneyAudio = (periodId: string, storyIndex: number) => {
    const current = journeyAudioStateRef.current;
    if (current.periodId !== periodId || current.storyIndex !== storyIndex) return;
    updateJourneyAudio({
      ...current,
      status: "idle",
      error: "This story's GitHub MP3 and browser text-to-speech could not be played.",
    });
  };
  const journeyPlayback = (periodIndex: number, storyIndex: number) => {
    const period = bibleJourney[periodIndex];
    if (storyIndex === JOURNEY_INTRO_INDEX) {
      return { text: journeyIntroText(period.id), audioUrls: journeyIntroAudioUrls(periodIndex, voicePreferenceRef.current) };
    }
    const text = journeyStoryNarration(period.stories[storyIndex]);
    return { text, audioUrls: journeyStoryAudioUrls(periodIndex, storyIndex, voicePreferenceRef.current) };
  };
  const journeyTimelineFor = (periodIndex: number, storyIndex: number, start?: PartStart): NarrationTimeline => {
    const period = bibleJourney[periodIndex];
    const indices = [JOURNEY_INTRO_INDEX, ...period.stories.map((_, index) => index)];
    return {
      parts: indices.map((index) => {
        const { text, audioUrls } = journeyPlayback(periodIndex, index);
        return { urls: audioUrls, chars: text.length };
      }),
      index: storyIndex + 1,
      startSeconds: start?.seconds,
      startPaused: start?.paused,
    };
  };
  const playJourneyStory = (periodId: string, storyIndex: number, shouldPlay: boolean, start?: PartStart) => {
    const periodIndex = bibleJourney.findIndex((period) => period.id === periodId);
    const period = bibleJourney[periodIndex];
    if (!period || storyIndex < JOURNEY_INTRO_INDEX || storyIndex >= period.stories.length) return;
    const { text, audioUrls } = journeyPlayback(periodIndex, storyIndex);
    const playing = shouldPlay && !start?.paused;
    const next: JourneyAudioState = {
      periodId,
      storyIndex,
      status: playing ? "playing" : "paused",
      error: null,
    };
    updateJourneyAudio(next);
    if (shouldPlay) {
      const started = startSpeaking(
        text,
        audioUrls,
        advanceJourneyAudio,
        () => failJourneyAudio(periodId, storyIndex),
        voicePreferenceRef.current,
        { title: storyIndex < 0 ? `${period.title}: Introduction` : period.stories[storyIndex].title, path: `#/journey/${period.id}`, art: "bible-journey", sequence: { kind: "bible-journey", periodId, storyIndex }, timeline: journeyTimelineFor(periodIndex, storyIndex, start), next: period.stories[storyIndex + 1] ? { title: period.stories[storyIndex + 1].title, path: `#/journey/${period.id}?story=story-${period.id}-${storyIndex + 1}` } : bibleJourney[periodIndex + 1] ? { title: `${bibleJourney[periodIndex + 1].title}: Introduction`, path: `#/journey/${bibleJourney[periodIndex + 1].id}` } : undefined },
      );
      if (!started) {
        failJourneyAudio(periodId, storyIndex);
      }
    } else stopSpeaking();
  };
  const toggleJourneyAudio = () => {
    if (!journeyPeriodId) return;
    const current = journeyAudioStateRef.current;
    if (current.periodId === journeyPeriodId && current.status === "playing") {
      pauseSpeaking();
      updateJourneyAudio({ ...current, status: "paused" });
      return;
    }
    if (current.periodId === journeyPeriodId && current.status === "paused") {
      const periodIndex = bibleJourney.findIndex((period) => period.id === journeyPeriodId);
      if (periodIndex < 0) return;
      const { text, audioUrls } = journeyPlayback(periodIndex, current.storyIndex);
      const saved = getNarrationSnapshot();
      const matching = saved.track?.sequence?.kind === "bible-journey" && saved.track.sequence.periodId === journeyPeriodId && saved.track.sequence.storyIndex === current.storyIndex;
      const started = resumeSpeaking(
        matching ? saved.text : text,
        audioUrls,
        advanceJourneyAudio,
        () => failJourneyAudio(journeyPeriodId, current.storyIndex),
        voicePreferenceRef.current,
      );
      updateJourneyAudio({ ...current, status: "playing", error: null });
      if (!started) failJourneyAudio(journeyPeriodId, current.storyIndex);
      return;
    }
    playJourneyStory(journeyPeriodId, JOURNEY_INTRO_INDEX, true);
  };
  const skipJourneyIntro = () => {
    const current = journeyAudioStateRef.current;
    if (current.status === "idle" || current.storyIndex !== JOURNEY_INTRO_INDEX) return;
    const periodId = current.periodId;
    if (!periodId) return;
    playJourneyStory(periodId, 0, true);
    window.requestAnimationFrame(() => {
      document.getElementById(`story-${periodId}-0`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const selectJourneyAudioStory = (storyIndex: number) => {
    if (!journeyPeriodId) return;
    playJourneyStory(journeyPeriodId, storyIndex, true);
    window.requestAnimationFrame(() => {
      document.getElementById(`story-${journeyPeriodId}-${storyIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const advanceJourneyAudio = () => {
    const current = journeyAudioStateRef.current;
    const period = bibleJourney.find((item) => item.id === current.periodId);
    if (!period) return;
    const nextStoryIndex = current.storyIndex + 1;
    if (nextStoryIndex >= period.stories.length) {
      updateJourneyAudio(INITIAL_JOURNEY_AUDIO);
      return;
    }
    playJourneyStory(period.id, nextStoryIndex, true);
    window.requestAnimationFrame(() => {
      document.getElementById(`story-${period.id}-${nextStoryIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const updateBreviaryAudio = (next: BreviaryAudioState) => {
    breviaryAudioStateRef.current = next;
    setBreviaryAudio(next);
  };
  const updateRosaryAudio = (next: RosaryAudioState) => {
    rosaryAudioStateRef.current = next;
    setRosaryAudio(next);
  };
  const failRosaryAudio = (clipIndex: number) => {
    const current = rosaryAudioStateRef.current;
    if (current.clipIndex !== clipIndex) return;
    updateRosaryAudio({ ...current, status: "idle", error: "This prayer's audio and browser text-to-speech could not be played." });
  };
  const rosaryTimelineFor = (clipIndex: number, start?: PartStart): NarrationTimeline => ({
    parts: rosaryClipsRef.current.map((clip) => ({ urls: rosaryAudioUrlsFor(clip.audioAsset, voicePreferenceRef.current), chars: clip.spokenText.length })),
    index: clipIndex,
    startSeconds: start?.seconds,
    startPaused: start?.paused,
  });
  const playRosaryClip = (clipIndex: number, resetSegmentElapsed = false, initial?: { mysteryIndex: number; mode: RosaryMode; path: string }, start?: PartStart) => {
    const clip = rosaryClipsRef.current[clipIndex];
    if (!clip) return;
    const current = rosaryAudioStateRef.current;
    const prayedBeadIndices = current.status === "idle" && clipIndex === 0 ? [] : current.prayedBeadIndices;
    const segmentElapsedSeconds = resetSegmentElapsed || current.segmentIndex !== clip.segmentIndex ? 0 : current.segmentElapsedSeconds;
    updateRosaryAudio({ segmentIndex: clip.segmentIndex, clipIndex, segmentElapsedSeconds, prayedBeadIndices, status: start?.paused ? "paused" : "playing", error: null });
    const audioUrls = rosaryAudioUrlsFor(clip.audioAsset, voicePreferenceRef.current);
    const previous = getNarrationSnapshot().track;
    const sequence = initial ? { kind: "rosary" as const, mysteryIndex: initial.mysteryIndex, mode: initial.mode, clipIndex } : current.status !== "idle" && previous?.sequence?.kind === "rosary" ? previous.sequence : { kind: "rosary" as const, mysteryIndex: rosaryMysteryIndex, mode: rosaryMode, clipIndex };
    const path = initial?.path ?? (current.status !== "idle" && previous?.sequence?.kind === "rosary" ? previous.path : window.location.hash);
    const next = rosaryClipsRef.current[clipIndex + 1];
    const transcript = rosaryClipsRef.current.map((item) => item.spokenText).join("\n\n");
    const started = startSpeaking(clip.spokenText, audioUrls, advanceRosaryAudio, () => failRosaryAudio(clipIndex), voicePreferenceRef.current, { title: clip.title, path, art: "rosary", sequence: { ...sequence, clipIndex }, timeline: rosaryTimelineFor(clipIndex, start), transcript, next: next ? { title: next.title, path } : undefined });
    if (!started) failRosaryAudio(clipIndex);
    window.requestAnimationFrame(() => {
      const targetId = clip.groupId
        ? `rosary-prayer-${clip.groupId}`
        : `rosary-heading-${clip.segmentIndex - 1}`;
      const target = document.getElementById(targetId);
      if (!target) return;

      const bounds = target.getBoundingClientRect();
      const mobileNav = document.querySelector<HTMLElement>(".mobile-bottom-nav");
      const navBounds = mobileNav?.getBoundingClientRect();
      const visibleBottom = navBounds && navBounds.top < window.innerHeight ? navBounds.top : window.innerHeight;
      const visibleHeight = Math.max(0, Math.min(bounds.bottom, visibleBottom) - Math.max(bounds.top, 0));
      const enoughVisible = Math.min(bounds.height * 0.6, 72);
      if (visibleHeight < enoughVisible) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };
  const playRosarySegment = (segmentIndex: number) => {
    const segment = rosarySegmentsRef.current[segmentIndex];
    if (segment) playRosaryClip(segment.firstClipIndex, true);
  };
  const selectRosarySegment = (segmentIndex: number) => {
    const sequence = getNarrationSnapshot().track?.sequence;
    if (sequence?.kind !== "rosary" || sequence.mysteryIndex !== rosaryMysteryIndex || sequence.mode !== rosaryMode) {
      updateRosaryAudio(INITIAL_ROSARY_AUDIO);
      rosarySegmentsRef.current = rosarySequence.segments;
      rosaryClipsRef.current = rosarySequence.clips;
    }
    playRosarySegment(segmentIndex);
  };
  const advanceRosaryAudio = () => {
    const current = rosaryAudioStateRef.current;
    const activeClip = rosaryClipsRef.current[current.clipIndex];
    const completedClipSeconds = Math.max(0, Math.floor(getNarrationSnapshot().elapsedSeconds));
    const prayedBeadIndices = activeClip?.beadIndex === null || activeClip?.beadIndex === undefined || current.prayedBeadIndices.includes(activeClip.beadIndex)
      ? current.prayedBeadIndices
      : [...current.prayedBeadIndices, activeClip.beadIndex];
    const nextClipIndex = current.clipIndex + 1;
    const nextClip = rosaryClipsRef.current[nextClipIndex];
    const segmentElapsedSeconds = activeClip && nextClip?.segmentIndex === activeClip.segmentIndex
      ? current.segmentElapsedSeconds + completedClipSeconds
      : 0;
    updateRosaryAudio({ ...current, segmentElapsedSeconds, prayedBeadIndices });
    if (nextClipIndex >= rosaryClipsRef.current.length) {
      updateRosaryAudio({ ...rosaryAudioStateRef.current, status: "idle", error: null });
      return;
    }
    playRosaryClip(nextClipIndex);
  };
  const toggleRosaryAudio = () => {
    let current = rosaryAudioStateRef.current;
    const sequence = getNarrationSnapshot().track?.sequence;
    if (sequence?.kind !== "rosary" || sequence.mysteryIndex !== rosaryMysteryIndex || sequence.mode !== rosaryMode) {
      current = INITIAL_ROSARY_AUDIO;
      updateRosaryAudio(current);
      rosarySegmentsRef.current = rosarySequence.segments;
      rosaryClipsRef.current = rosarySequence.clips;
    }
    if (current.status === "playing") {
      pauseSpeaking();
      updateRosaryAudio({ ...current, status: "paused" });
      return;
    }
    const clip = rosaryClipsRef.current[current.clipIndex];
    if (current.status === "paused" && clip) {
      const audioUrls = rosaryAudioUrlsFor(clip.audioAsset, voicePreferenceRef.current);
      const started = resumeSpeaking(clip.spokenText, audioUrls, advanceRosaryAudio, () => failRosaryAudio(current.clipIndex), voicePreferenceRef.current);
      updateRosaryAudio({ ...current, status: "playing", error: null });
      if (!started) failRosaryAudio(current.clipIndex);
      return;
    }
    playRosarySegment(0);
  };
  const changeRosaryMode = (mode: RosaryMode) => {
    if (mode === rosaryMode) return;
    if (getNarrationSnapshot().track?.art === "rosary") stopSpeaking();
    updateRosaryAudio(INITIAL_ROSARY_AUDIO);
    setRosaryModeState(mode);
    try {
      window.localStorage.setItem(ROSARY_MODE_KEY, mode);
    } catch {
      // The selected mode still applies for this visit if storage is unavailable.
    }
  };
  const failBreviaryAudio = (segmentIndex: number) => {
    const current = breviaryAudioStateRef.current;
    if (current.segmentIndex !== segmentIndex) return;
    updateBreviaryAudio({ ...current, status: "idle", error: "This prayer's audio and browser text-to-speech could not be played." });
  };
  // Intro (when present) and every prayer segment, in the order they are read. Each part keeps its own MP3.
  const breviaryPartsFor = (hour: string): BreviaryPart[] => {
    const day = breviaryDayRef.current;
    if (!day || !isBreviaryHour(hour)) return [];
    const parts: BreviaryPart[] = [];
    const intro = breviaryIntroText(hour);
    if (intro) {
      parts.push({ segmentIndex: BREVIARY_INTRO_INDEX, title: `${hour[0].toUpperCase()}${hour.slice(1)}: Introduction`, text: intro, audioUrls: breviaryIntroAudioUrls(hour, voicePreferenceRef.current) });
    }
    day.segments.forEach((segment, segmentIndex) => {
      parts.push({ segmentIndex, title: segment.heading, text: breviaryNarrationText(segment), audioUrls: segment.audioUrls, scrollId: `breviary-${segment.id}` });
    });
    return parts;
  };
  const playBreviarySegment = (segmentIndex: number, initial?: { hour: string; date: string; path: string }, start?: PartStart) => {
    const previous = getNarrationSnapshot().track;
    const sequence = initial ? { kind: "breviary" as const, hour: initial.hour, date: initial.date, segmentIndex } : previous?.sequence?.kind === "breviary" ? previous.sequence : { kind: "breviary" as const, hour: breviaryHour ?? "", date: localDateKey(breviaryDate), segmentIndex };
    const parts = breviaryPartsFor(sequence.hour);
    const partIndex = parts.findIndex((part) => part.segmentIndex === segmentIndex);
    const part = parts[partIndex];
    if (!part) return;
    const nextPart = parts[partIndex + 1];
    updateBreviaryAudio({ segmentIndex, status: start?.paused ? "paused" : "playing", error: null });
    const path = initial?.path ?? (previous?.sequence?.kind === "breviary" ? previous.path : window.location.hash);
    const timeline: NarrationTimeline = {
      parts: parts.map((item) => ({ urls: item.audioUrls, chars: item.text.length })),
      index: partIndex,
      startSeconds: start?.seconds,
      startPaused: start?.paused,
    };
    const transcript = parts.map((item) => item.text).join("\n\n");
    const started = startSpeaking(part.text, part.audioUrls, advanceBreviaryAudio, () => failBreviaryAudio(segmentIndex), voicePreferenceRef.current, { title: part.title, path, art: "prayer", sequence: { ...sequence, segmentIndex }, timeline, transcript, next: nextPart ? { title: nextPart.title, path } : undefined });
    if (!started) failBreviaryAudio(segmentIndex);
    if (!part.scrollId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(part.scrollId as string)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  const selectBreviarySegment = (segmentIndex: number) => {
    if (!breviaryDay || !isBreviaryHour(breviaryHour)) return;
    const date = localDateKey(breviaryDate);
    const sequence = getNarrationSnapshot().track?.sequence;
    if (sequence?.kind !== "breviary" || sequence.hour !== breviaryHour || sequence.date !== date) {
      updateBreviaryAudio(INITIAL_BREVIARY_AUDIO);
      breviaryDayRef.current = breviaryDay;
      playBreviarySegment(segmentIndex, { hour: breviaryHour, date, path: `#/breviary/${breviaryHour}?date=${date}` });
      return;
    }
    playBreviarySegment(segmentIndex);
  };
  const playBreviaryIntro = (hour = breviaryHour, date = breviaryDate) => {
    if (!isBreviaryHour(hour)) return;
    const hasIntro = Boolean(breviaryIntroText(hour));
    playBreviarySegment(hasIntro ? BREVIARY_INTRO_INDEX : 0, { hour, date: localDateKey(date), path: `#/breviary/${hour}?date=${localDateKey(date)}` });
  };
  const skipBreviaryIntro = () => {
    const current = breviaryAudioStateRef.current;
    if (current.status === "idle" || current.segmentIndex !== BREVIARY_INTRO_INDEX) return;
    playBreviarySegment(0);
    const firstSegment = breviaryDayRef.current?.segments[0];
    if (firstSegment) window.requestAnimationFrame(() => {
      document.getElementById(`breviary-${firstSegment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  const advanceBreviaryAudio = () => {
    const day = breviaryDayRef.current;
    if (!day) return;
    const nextIndex = breviaryAudioStateRef.current.segmentIndex + 1;
    if (nextIndex >= day.segments.length) {
      updateBreviaryAudio(INITIAL_BREVIARY_AUDIO);
      return;
    }
    playBreviarySegment(nextIndex);
  };
  const toggleBreviaryAudio = () => {
    let current = breviaryAudioStateRef.current;
    const track = getNarrationSnapshot().track;
    if (track?.sequence?.kind !== "breviary" || track.sequence.hour !== breviaryHour || track.sequence.date !== localDateKey(breviaryDate)) {
      current = INITIAL_BREVIARY_AUDIO;
      updateBreviaryAudio(current);
      if (breviaryDay) breviaryDayRef.current = breviaryDay;
    }
    if (current.status === "playing") {
      pauseSpeaking();
      updateBreviaryAudio({ ...current, status: "paused" });
      return;
    }
    const segment = breviaryDayRef.current?.segments[current.segmentIndex];
    if (current.status === "paused" && current.segmentIndex === BREVIARY_INTRO_INDEX && isBreviaryHour(breviaryHour)) {
      const text = breviaryIntroText(breviaryHour);
      const started = resumeSpeaking(text, breviaryIntroAudioUrls(breviaryHour, voicePreferenceRef.current), advanceBreviaryAudio, () => failBreviaryAudio(BREVIARY_INTRO_INDEX), voicePreferenceRef.current);
      updateBreviaryAudio({ ...current, status: "playing", error: null });
      if (!started) failBreviaryAudio(BREVIARY_INTRO_INDEX);
      return;
    }
    if (current.status === "paused" && segment) {
      const saved = getNarrationSnapshot();
      const matching = saved.track?.sequence?.kind === "breviary" && saved.track.sequence.hour === breviaryHour && saved.track.sequence.date === localDateKey(breviaryDate) && saved.track.sequence.segmentIndex === current.segmentIndex;
      const started = resumeSpeaking(matching ? saved.text : breviaryNarrationText(segment), segment.audioUrls, advanceBreviaryAudio, () => failBreviaryAudio(current.segmentIndex), voicePreferenceRef.current);
      updateBreviaryAudio({ ...current, status: "playing", error: null });
      if (!started) failBreviaryAudio(current.segmentIndex);
      return;
    }
    playBreviaryIntro();
  };
  // Re-registered every render so the handler always sees current state.
  useEffect(() => {
    setNarrationPartSeekHandler((partIndex, seconds, paused) => {
      const sequence = getNarrationSnapshot().track?.sequence;
      if (!sequence) return;
      const start = { seconds, paused };
      if (sequence.kind === "bible-journey") {
        playJourneyStory(sequence.periodId, partIndex - 1, true, start);
      } else if (sequence.kind === "rosary") {
        playRosaryClip(partIndex, false, undefined, start);
      } else if (sequence.kind === "breviary") {
        const part = breviaryPartsFor(sequence.hour)[partIndex];
        if (part) playBreviarySegment(part.segmentIndex, undefined, start);
      }
    });
  });
  useEffect(() => {
    const sequence = getNarrationSnapshot().track?.sequence;
    if (!sequence) return;
    if (sequence.kind === "bible-journey") {
      const period = bibleJourney.find((item) => item.id === sequence.periodId);
      if (!period || !Number.isInteger(sequence.storyIndex) || sequence.storyIndex < -1 || sequence.storyIndex >= period.stories.length) return;
      updateJourneyAudio({ periodId: period.id, storyIndex: sequence.storyIndex, status: "paused", error: null });
      setNarrationCompletionHandler(advanceJourneyAudio);
    } else if (sequence.kind === "rosary") {
      if (!Number.isInteger(sequence.mysteryIndex) || sequence.mysteryIndex < 0 || sequence.mysteryIndex > 3 || !["traditional", "gospel"].includes(sequence.mode)) return;
      const restored = buildRosarySequence(sequence.mode, sequence.mysteryIndex);
      const clip = restored.clips[sequence.clipIndex];
      if (!clip) return;
      rosarySegmentsRef.current = restored.segments;
      rosaryClipsRef.current = restored.clips;
      updateRosaryAudio({ ...INITIAL_ROSARY_AUDIO, clipIndex: sequence.clipIndex, segmentIndex: clip.segmentIndex, status: "paused" });
      setNarrationCompletionHandler(advanceRosaryAudio);
    } else if (sequence.kind === "breviary" && isBreviaryHour(sequence.hour)) {
      const date = new Date(`${sequence.date}T00:00:00`);
      if (Number.isNaN(date.getTime()) || !Number.isInteger(sequence.segmentIndex)) return;
      const day = assembleBreviary(date, sequence.hour, voicePreferenceRef.current);
      if (sequence.segmentIndex < -1 || sequence.segmentIndex >= day.segments.length) return;
      breviaryDayRef.current = day;
      updateBreviaryAudio({ segmentIndex: sequence.segmentIndex, status: "paused", error: null });
      setNarrationCompletionHandler(advanceBreviaryAudio);
    }
  }, []);
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      const query = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
      const date = query.get("date");
      if (readRoute() === "breviary" && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const selected = new Date(`${date}T00:00:00`);
        if (!Number.isNaN(selected.getTime()) && localDateKey(selected) === date) setBreviaryDate(selected);
      }
      if (readRoute() === "mass" && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setMassDate(date);
      const bookId = query.get("book");
      const chapter = Number(query.get("chapter"));
      if (readRoute() === "read" && bookId && bibleBooks.some((book) => book.id === bookId) && Number.isInteger(chapter) && chapter > 0 && chapter <= getChapterCount(bookId)) {
        setReadingPosition({ bookId, chapter });
      }
      setSaintSlug(readSaintSlug());
      setRosaryMysteryIndex(readRosaryMysteryIndex());
      setBreviaryHour(readBreviaryHour());
      setJourneyPeriodId(readJourneyPeriodId());
      setJourneyStoryAnchor(readJourneyStoryAnchor());
      setGuidedJourneyRoute(readGuidedJourney());
      setMenuOpen(false);
      if (!readJourneyStoryAnchor()) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    change();
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (route !== "journey" || !journeyStoryAnchor) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(journeyStoryAnchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route, journeyPeriodId, journeyStoryAnchor]);
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);
  useEffect(() => {
    if (!highlightVerse) return;
    const timeout = window.setTimeout(() => setHighlightVerse(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [highlightVerse]);
  useEffect(() => subscribeNarration(() => {
    const current = getNarrationSnapshot();
    setNarration(current);
    if (current.status === "idle") {
      void Promise.resolve().then(() => {
        if (getNarrationSnapshot().status !== "idle") return;
        setJourneyAudio((state) => { const next = { ...state, status: "idle" as const }; journeyAudioStateRef.current = next; return next; });
        setBreviaryAudio((state) => { const next = { ...state, status: "idle" as const }; breviaryAudioStateRef.current = next; return next; });
        setRosaryAudio((state) => { const next = { ...state, status: "idle" as const }; rosaryAudioStateRef.current = next; return next; });
      });
      return;
    }
    const sync = (status: JourneyAudioStatus) => status === "idle" ? status : current.status;
    setJourneyAudio((state) => {
      const next = current.track?.art === "bible-journey" ? { ...state, status: sync(state.status) } : INITIAL_JOURNEY_AUDIO;
      journeyAudioStateRef.current = next;
      return next;
    });
    setBreviaryAudio((state) => {
      const next = current.track?.art === "prayer" ? { ...state, status: sync(state.status) } : INITIAL_BREVIARY_AUDIO;
      breviaryAudioStateRef.current = next;
      return next;
    });
    setRosaryAudio((state) => {
      const next = current.track?.art === "rosary" ? { ...state, status: sync(state.status) } : INITIAL_ROSARY_AUDIO;
      rosaryAudioStateRef.current = next;
      return next;
    });
  }), []);
  useEffect(() => {
    const open = () => setPlayerOpen(true);
    window.addEventListener("soundfaith:open-player", open);
    return () => window.removeEventListener("soundfaith:open-player", open);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);
  const journeyOverview = getJourneyOverview(guidedJourneyProgress, journeyProgress.completedIds, lastJourneyPeriodId);
  const { openReader, resumeJourney, openJourneyRecommendation, openCurrentBreviary, openDailyItem, openPicker, openBibleBooks, openMassReference } = useAppNavigation({
    readingPosition,
    setReadingPosition,
    setHighlightVerse,
    setModal,
    setMassDate,
    setBreviaryDate,
    journeyOverview,
  });
  const journeyAudioForPage =
    journeyPeriodId && journeyAudio.periodId === journeyPeriodId ? journeyAudio : INITIAL_JOURNEY_AUDIO;
  const activeSequence = narration.status === "idle" ? undefined : narration.track?.sequence;
  const rosaryAudioForPage = activeSequence?.kind === "rosary" && activeSequence.mysteryIndex === rosaryMysteryIndex && activeSequence.mode === rosaryMode
    ? rosaryAudio : INITIAL_ROSARY_AUDIO;
  const breviaryAudioForPage = activeSequence?.kind === "breviary" && activeSequence.hour === breviaryHour && activeSequence.date === localDateKey(breviaryDate)
    ? breviaryAudio : INITIAL_BREVIARY_AUDIO;
  const journeyStoryProgress = narrationPartProgress(narration);
  const rosaryActiveSegment = rosarySequence.segments[rosaryAudioForPage.segmentIndex];
  const rosaryActiveClip = rosarySequence.clips[rosaryAudioForPage.clipIndex];
  const activeRosaryBeadIndex = rosaryAudioForPage.status === "idle" ? null : rosaryActiveClip?.beadIndex ?? null;
  const rosarySegmentClipCount = rosaryActiveSegment ? rosaryActiveSegment.endClipIndex - rosaryActiveSegment.firstClipIndex : 0;
  const rosarySegmentProgress = rosaryActiveSegment && rosarySegmentClipCount > 0
    ? (rosaryAudioForPage.clipIndex - rosaryActiveSegment.firstClipIndex + journeyStoryProgress) / rosarySegmentClipCount
    : 0;
  const isJourneyDetail = route === "journey" && Boolean(journeyPeriodId);
  const journeyIntroActive = isJourneyDetail && journeyAudioForPage.storyIndex === JOURNEY_INTRO_INDEX && journeyAudioForPage.status !== "idle";
  const isBreviaryDetail = route === "breviary" && breviaryDay !== null;
  const isRosaryDetail = route === "rosary-prayer";
  const breviaryIntroActive = isBreviaryDetail && breviaryAudioForPage.segmentIndex === BREVIARY_INTRO_INDEX && breviaryAudioForPage.status !== "idle";
  const playerIntroSkip = activeSequence?.kind === "breviary" && breviaryAudio.segmentIndex === BREVIARY_INTRO_INDEX && breviaryAudio.status !== "idle"
    ? skipBreviaryIntro
    : activeSequence?.kind === "bible-journey" && journeyAudio.periodId === activeSequence.periodId && journeyAudio.storyIndex === JOURNEY_INTRO_INDEX && journeyAudio.status !== "idle"
      ? skipJourneyIntro
      : undefined;
  const journeyDesktopProgress = isJourneyDetail ? <JourneyNarrationProgress
    className="narration-progress-desktop narration-progress-centered"
    storyCount={bibleJourney.find((period) => period.id === journeyPeriodId)?.stories.length ?? 0}
    activeStoryIndex={Math.max(0, journeyAudioForPage.storyIndex)}
    activeStoryProgress={journeyIntroActive ? 0 : journeyStoryProgress}
    status={journeyAudioForPage.status}
    onSelectStory={selectJourneyAudioStory}
  /> : null;
  const breviaryDesktopProgress = isBreviaryDetail && breviaryDay ? <JourneyNarrationProgress
    className="narration-progress-desktop narration-progress-centered"
    storyCount={breviaryDay.segments.length}
    activeStoryIndex={Math.max(0, breviaryAudioForPage.segmentIndex)}
    activeStoryProgress={breviaryIntroActive ? 0 : journeyStoryProgress}
    status={breviaryAudioForPage.status}
    onSelectStory={selectBreviarySegment}
  /> : null;
  const rosaryDesktopProgress = isRosaryDetail ? <JourneyNarrationProgress
    className="narration-progress-desktop narration-progress-centered"
    storyCount={rosarySequence.segments.length}
    activeStoryIndex={rosaryAudioForPage.segmentIndex}
    activeStoryProgress={rosarySegmentProgress}
    status={rosaryAudioForPage.status}
    onSelectStory={selectRosarySegment}
    itemLabel="Segment"
    positionLabel="Rosary segment position"
  /> : null;
  const prepareRosaryPlayback = (mysteryIndex: number) => {
    const sequence = buildRosarySequence(rosaryMode, mysteryIndex);
    rosarySegmentsRef.current = sequence.segments;
    rosaryClipsRef.current = sequence.clips;
    updateRosaryAudio(INITIAL_ROSARY_AUDIO);
  };
  const prepareBreviaryPlayback = (date: Date, hour: BreviaryHour) => {
    breviaryDayRef.current = assembleBreviary(date, hour, voicePreferenceRef.current);
  };
  const { loadingListen, playListening, playHero, stepMassReading, openActiveJourney, openDailyRoutine } = useListenLaunch({
    voicePreferenceRef,
    readingPosition,
    setPlayerOpen,
    journeyOverview,
    dailyStreak,
    rosaryMode,
    advanceNarration,
    bibleTrack,
    playJourneyIntro: (periodId) => playJourneyStory(periodId, JOURNEY_INTRO_INDEX, true),
    prepareRosaryPlayback,
    playRosaryClip,
    prepareBreviaryPlayback,
    playBreviaryIntro,
    markGuidedDayPlayed,
  });
  const recommendation = (page: RecommendationPage) => renderDailyRecommendation(page, { dailyStreak, journeyOverview, setMassDate, openCurrentBreviary, openJourneyRecommendation, openMassReference, playListening });
  const activeRosaryPrayerGroupId = rosaryAudioForPage.status === "idle" ? null : rosaryClipsRef.current[rosaryAudioForPage.clipIndex]?.groupId ?? null;
  return (
    <div className={route === "read" ? "app-shell app-shell--reader" : "app-shell"}>
      <SiteHeader
        route={route}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={menuRef}
        fontSize={fontSize}
        setFontSize={setFontSize}
        voicePreference={voicePreference}
        voicePreferenceError={voicePreferenceError}
        onChangeVoicePreference={changeVoicePreference}
        theme={theme}
        onThemeChange={setTheme}
      />
      <AppRoutes
        route={route}
        recommendation={recommendation}
        voicePreference={voicePreference}
        narration={narration}
        setPlayerOpen={setPlayerOpen}
        dailyStreak={dailyStreak}
        journeyOverview={journeyOverview}
        readingPosition={readingPosition}
        setReadingPosition={setReadingPosition}
        highlightVerse={highlightVerse}
        bibleTrack={bibleTrack}
        advanceNarration={advanceNarration}
        bookmarks={bookmarks}
        bookmarkCategories={bookmarkCategories}
        isBookmarked={isBookmarked}
        isChapterBookmarked={isChapterBookmarked}
        toggleBookmark={toggleBookmark}
        removeBookmark={removeBookmark}
        removeBookmarkCategory={removeBookmarkCategory}
        openReader={openReader}
        openBibleBooks={openBibleBooks}
        openMassReference={openMassReference}
        openDailyItem={openDailyItem}
        resumeJourney={resumeJourney}
        massDate={massDate}
        setMassDate={setMassDate}
        breviaryHour={breviaryHour}
        breviaryDate={breviaryDate}
        setBreviaryDate={setBreviaryDate}
        breviaryDay={breviaryDay}
        breviaryAudioForPage={breviaryAudioForPage}
        breviaryDesktopProgress={breviaryDesktopProgress}
        toggleBreviaryAudio={toggleBreviaryAudio}
        selectBreviarySegment={selectBreviarySegment}
        skipBreviaryIntro={skipBreviaryIntro}
        rosaryMysteryIndex={rosaryMysteryIndex}
        rosaryMode={rosaryMode}
        changeRosaryMode={changeRosaryMode}
        rosaryAudioForPage={rosaryAudioForPage}
        activeRosaryPrayerGroupId={activeRosaryPrayerGroupId}
        activeRosaryBeadIndex={activeRosaryBeadIndex}
        rosaryDesktopProgress={rosaryDesktopProgress}
        toggleRosaryAudio={toggleRosaryAudio}
        selectRosarySegment={selectRosarySegment}
        saintSlug={saintSlug}
        journeyPeriodId={journeyPeriodId}
        activeGuidedId={activeGuidedId}
        activeGuidedDay={activeGuidedDay}
        journeyProgress={journeyProgress}
        guidedJourneyProgress={guidedJourneyProgress}
        journeyArtwork={journeyArtwork}
        lastJourneyPeriodId={lastJourneyPeriodId}
        selectJourneyArtwork={selectJourneyArtwork}
        startGuidedJourney={startGuidedJourney}
        completeGuidedJourneyDay={completeGuidedJourneyDay}
        toggleJourneyPeriod={toggleJourneyPeriod}
        journeyAudioForPage={journeyAudioForPage}
        journeyDesktopProgress={journeyDesktopProgress}
        toggleJourneyAudio={toggleJourneyAudio}
        selectJourneyAudioStory={selectJourneyAudioStory}
        skipJourneyIntro={skipJourneyIntro}
        playHero={playHero}
        playListening={playListening}
      />
      {narration.error && <div className="audio-error" role="alert">{narration.error}<button type="button" onClick={dismissNarrationError} aria-label="Dismiss audio error"><X size={16} /></button></div>}
      {(playerOpen || playerClosing) && getNarrationSnapshot().track && <AudioPlayer narration={getNarrationSnapshot()} closing={!playerOpen} onClose={() => setPlayerOpen(false)} onToggle={toggleActiveNarration} onSelectEpisode={(index) => {
        const track = getNarrationSnapshot().track;
        if (track?.sequence?.kind === "bible-journey") playJourneyStory(track.sequence.periodId, index - 1, true);
        else selectRosarySegment(index);
      }} onSkipIntro={playerIntroSkip} onPrevious={() => {
        const track = getNarrationSnapshot().track;
        if (track && isBibleArt(track.art)) {
          const query = new URLSearchParams(track.path.split("?")[1] ?? "");
          const bookId = query.get("book");
          const chapter = Number(query.get("chapter"));
          const bookIndex = bibleBooks.findIndex((book) => book.id === bookId);
          if (bookId && bookIndex >= 0 && chapter > 1) advanceNarration({ bookId, chapter: chapter - 1 }, track.art);
          else if (bookIndex > 0) {
            const previousBook = bibleBooks[bookIndex - 1];
            advanceNarration({ bookId: previousBook.id, chapter: getChapterCount(previousBook.id) }, track.art);
          }
        } else if (track?.sequence?.kind === "bible-journey" && track.sequence.storyIndex > -1) {
          playJourneyStory(track.sequence.periodId, track.sequence.storyIndex - 1, true);
        } else if (track?.art === "readings") {
          stepMassReading(track.path, -1);
        } else if (track?.sequence?.kind === "rosary") {
          playRosaryClip(track.sequence.clipIndex - 1);
        } else if (track?.sequence?.kind === "breviary") {
          playBreviarySegment(track.sequence.segmentIndex - 1);
        } else if (track?.sequence?.kind === "guided" || track?.sequence?.kind === "catechism") {
          void playPreviousPlaylistItem();
        }
      }} onNext={() => {
        const track = getNarrationSnapshot().track;
        if (track?.art === "readings") {
          stepMassReading(track.path, 1);
        } else if (track && isBibleArt(track.art)) {
          const query = new URLSearchParams(track.path.split("?")[1] ?? "");
          const bookId = query.get("book");
          const chapter = Number(query.get("chapter"));
          if (bookId && bibleBooks.some((book) => book.id === bookId) && Number.isInteger(chapter) && chapter > 0 && chapter <= getChapterCount(bookId)) {
            const next = nextBiblePosition({ bookId, chapter });
            if (next) advanceNarration(next, track.art);
          }
        } else if (track?.art === "bible-journey" && journeyAudioStateRef.current.periodId) {
          advanceJourneyAudio();
        } else if (track?.sequence?.kind === "rosary") {
          playRosaryClip(rosaryAudioStateRef.current.clipIndex + 1);
        } else if (track?.sequence?.kind === "breviary") {
          playBreviarySegment(breviaryAudioStateRef.current.segmentIndex + 1);
        } else if (track?.sequence?.kind === "guided" || track?.sequence?.kind === "catechism" || track?.sequence?.kind === "summa") {
          void playNextPlaylistItem();
        } else if (track?.next) {
          setPlayerOpen(false);
          window.location.hash = track.next.path;
        }
      }} onNavigate={(path) => {
        setPlayerOpen(false);
        if (path.startsWith("#/read?")) {
          const query = new URLSearchParams(path.split("?")[1]);
          const bookId = query.get("book");
          const chapter = Number(query.get("chapter"));
          if (bookId && bibleBooks.some((book) => book.id === bookId) && Number.isInteger(chapter) && chapter > 0 && chapter <= getChapterCount(bookId)) setReadingPosition({ bookId, chapter });
        }
        window.location.hash = path;
      }} />}
      <MobileBottomNav
        route={route}
        narration={narration}
        playerOpen={playerOpen}
        onToggle={toggleActiveNarration}
        setPlayerOpen={setPlayerOpen}
        onOpenActiveJourney={openActiveJourney}
        onOpenDailyRoutine={openDailyRoutine}
      />
      <SiteFooter />
      <AppOverlays modal={modal} setModal={setModal} onOpenVerse={(bookId, chapter, verse) => openReader({ bookId, chapter }, verse)} />
    </div>
  );
}
