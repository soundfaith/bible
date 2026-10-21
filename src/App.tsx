import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  Church,
  Bookmark as BookmarkMenuIcon,
  House,
  Home,
  CircleHelp,
  BookOpen,
  Headphones,
  Pause,
  SkipForward,
  Play,
  Menu,
  Minus,
  Plus,
  Share2,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "./components/Brand";
import { DailyNextStep } from "./components/DailyNextStep";
import { BibleMark } from "./components/BibleMark";
import { ModalLayer, type Modal } from "./components/ModalLayer";
import { SearchModal, type SearchResult } from "./components/SearchModal";
import { ChatWidget } from "./components/ChatWidget";
import { HomePage } from "./pages/HomePage";
import { BibleJourneyLibrary, BibleJourneyPage } from "./pages/BibleJourneyPage";
import { JourneyArtworkPage } from "./pages/JourneyArtworkPage";
import { BibleBooksPage } from "./pages/BibleBooksPage";
import { AboutPage } from "./pages/AboutPage";
import {
  ChapterPage,
  getLastReading,
  hasOpenedBible,
  type ReadingPosition,
  type SelectedVerseRange,
} from "./pages/ChapterPage";
import { MassReadingPage } from "./pages/MassReadingPage";
import { BreviaryLibrary, BreviaryPage } from "./pages/BreviaryPage";
import { RosaryLibrary, RosaryPrayerPage } from "./pages/RosaryPage";
import { buildRosarySequence, todaysRosaryPath, type RosaryMode } from "./data/rosary";
import { featuredSaintForDate, hasSaintSlug } from "./data/saintsDaily";
import { assembleBreviary, breviaryDayInfo, currentBreviaryHour, isBreviaryHour } from "./lib/breviary";
import { useScrollReveal } from "./lib/reveal";
import { doneToday as getDoneToday, loadDailyStreak, localDateKey, recordDailyItem } from "./lib/dailyStreak";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ReferencePage } from "./pages/ReferencePage";
import { bibleBooks, getChapter, getChapterCount } from "./lib/bible";
import { bibleJourney } from "./data/bibleJourney";
import journeyIntros from "./data/journeyIntros.json";
import breviaryIntros from "./data/breviaryIntros.json";
import { resolveJourneyPeriodId, loadJourneyArtworkSelections, saveJourneyArtworkSelections } from "./data/journeyArtwork";
import { loadJourneyProgress, saveJourneyProgress } from "./lib/journeyProgress";
import { breviaryIntroAudioUrls, journeyIntroAudioUrls, journeyStoryAudioUrls, narrationAudioUrlsFor, rosaryAudioUrlsFor } from "./lib/narrationAudio";
import { requestSaintNarrationToggle } from "./lib/saintsAudio";
import { getNarrationGender, saveNarrationGender, type NarrationGender } from "./lib/narrationVoice";
import { getMassReadingForDate, getTodaysMassReading, resolveReference } from "./lib/readings";
import { getBookmarkCategories, getBookmarks, isVerseBookmark, saveBookmarkCategories, saveBookmarks, type Bookmark } from "./lib/bookmarks";
import {
  getNarrationSnapshot,
  JourneyNarrationProgress,
  NarrationProgress,
  pauseSpeaking,
  resumeSpeaking,
  startSpeaking,
  stopSpeaking,
  subscribeNarration,
} from "./components/NarratorButton";

const SaintPage = lazy(() => import("./pages/SaintsPage").then((module) => ({ default: module.SaintPage })));
const SaintsLibrary = lazy(() => import("./pages/SaintsPage").then((module) => ({ default: module.SaintsLibrary })));

type Route = "home" | "read" | "bible" | "mass" | "bookmarks" | "library" | "about" | "journey" | "journey-artwork" | "breviary" | "rosary" | "rosary-prayer" | "saints" | "saint-profile";
type PendingNarration = "start" | "pause" | "resume" | null;
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
const LAST_JOURNEY_PERIOD_KEY = "soundfaith-bible-journey-last-period-v1";
const ROSARY_MODE_KEY = "rosary-mode";
const INITIAL_JOURNEY_AUDIO: JourneyAudioState = { periodId: null, storyIndex: 0, status: "idle", error: null };
const JOURNEY_INTRO_INDEX = -1;
const BREVIARY_INTRO_INDEX = -1;

function readRosaryMode(): RosaryMode {
  try {
    return window.localStorage.getItem(ROSARY_MODE_KEY) === "gospel" ? "gospel" : "traditional";
  } catch {
    return "traditional";
  }
}

function journeyIntroText(periodId: string) {
  const intro = (journeyIntros as Record<string, string>)[periodId] ?? "";
  return intro.replace(/\s+/g, " ").trim();
}

function breviaryIntroText(hour: string) {
  return ((breviaryIntros as Record<string, string>)[hour] ?? "").replace(/\s+/g, " ").trim();
}

function getLastJourneyPeriodId() {
  try {
    const saved = window.localStorage.getItem(LAST_JOURNEY_PERIOD_KEY);
    return saved && bibleJourney.some((period) => period.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  return path === "journey-artwork" ? "journey-artwork"
    : path.startsWith("rosary/") ? "rosary-prayer"
    : path === "rosary" ? "rosary"
    : path.startsWith("saints/") ? "saint-profile"
    : path === "saints" ? "saints"
    : path === "breviary" || path.startsWith("breviary/") ? "breviary"
    : path.startsWith("journey/") ? "journey"
    : path === "read" || path === "bible" || path === "mass" || path === "bookmarks" || path === "library" || path === "about" || path === "journey"
      ? path
    : "home";
}

function readSaintSlug() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  if (!path.startsWith("saints/")) return "today";
  try { return decodeURIComponent(path.slice("saints/".length)); } catch { return path.slice("saints/".length); }
}

function readJourneyPeriodId() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  if (!path.startsWith("journey/")) return null;
  try {
    return resolveJourneyPeriodId(decodeURIComponent(path.slice("journey/".length)));
  } catch {
    return resolveJourneyPeriodId(path.slice("journey/".length));
  }
}

function readBreviaryHour() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  return path.startsWith("breviary/") ? path.slice("breviary/".length) : null;
}

function readRosaryMysteryIndex() {
  const segment = window.location.hash.split("?")[0].replace(/^#\/?/, "").split("/")[1];
  const ids = ["joyful", "luminous", "sorrowful", "glorious"];
  const index = ids.indexOf(segment ?? "");
  return index < 0 ? 0 : index;
}

function readJourneyStoryAnchor() {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("story");
}

export default function App() {
  useScrollReveal();
  const [route, setRoute] = useState<Route>(readRoute);
  const [saintSlug, setSaintSlug] = useState<string>(readSaintSlug);
  const [rosaryMysteryIndex, setRosaryMysteryIndex] = useState<number>(readRosaryMysteryIndex);
  const BreviaryHourIcon = { lauds: Sunrise, vespers: Sunset, compline: Moon }[currentBreviaryHour()];
  const [journeyPeriodId, setJourneyPeriodId] = useState<string | null>(readJourneyPeriodId);
  const [lastJourneyPeriodId, setLastJourneyPeriodId] = useState<string | null>(getLastJourneyPeriodId);
  const [journeyStoryAnchor, setJourneyStoryAnchor] = useState<string | null>(readJourneyStoryAnchor);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(window.localStorage.getItem("reader-font-size"));
    return Number.isFinite(saved) && saved >= 16 && saved <= 30 ? saved : 22;
  });
  const [modal, setModal] = useState<Modal | null>(null);
  const [searchInteracted, setSearchInteracted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.localStorage.getItem("template-theme") === "dark" ? "dark" : "light",
  );
  const [voicePreference, setVoicePreference] = useState<NarrationGender>(getNarrationGender);
  const [voicePreferenceError, setVoicePreferenceError] = useState(false);
  const [rosaryMode, setRosaryModeState] = useState<RosaryMode>(readRosaryMode);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(getLastReading);
  const [massDate, setMassDate] = useState(() => getTodaysMassReading().date);
  const [breviaryDate, setBreviaryDate] = useState(() => new Date());
  const [breviaryHour, setBreviaryHour] = useState<string | null>(readBreviaryHour);
  const [dailyStreak, setDailyStreak] = useState(loadDailyStreak);
  useEffect(() => {
    const today = localDateKey();
    if (route === "breviary" && breviaryHour && isBreviaryHour(breviaryHour) && localDateKey(breviaryDate) === today) {
      setDailyStreak((state) => recordDailyItem(state, breviaryHour, today));
    } else if (route === "mass" && massDate === getTodaysMassReading().date) {
      setDailyStreak((state) => recordDailyItem(state, "mass", today));
    } else if (route === "rosary-prayer") {
      setDailyStreak((state) => recordDailyItem(state, "rosary", today));
    } else if (route === "saint-profile" && (saintSlug === "today" ? featuredSaintForDate() : hasSaintSlug(saintSlug))) {
      setDailyStreak((state) => recordDailyItem(state, "saints", today));
    }
  }, [route, breviaryHour, breviaryDate, massDate, saintSlug]);
  const [breviaryAudio, setBreviaryAudio] = useState<BreviaryAudioState>(INITIAL_BREVIARY_AUDIO);
  const [rosaryAudio, setRosaryAudio] = useState<RosaryAudioState>(INITIAL_ROSARY_AUDIO);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [pendingNarration, setPendingNarration] = useState<PendingNarration>(null);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [journeyAudio, setJourneyAudio] = useState<JourneyAudioState>(INITIAL_JOURNEY_AUDIO);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
  const [bookmarkCategories, setBookmarkCategories] = useState<string[]>(getBookmarkCategories);
  const [journeyProgress, setJourneyProgress] = useState(loadJourneyProgress);
  const [journeyArtwork, setJourneyArtwork] = useState(loadJourneyArtworkSelections);
  const menuRef = useRef<HTMLElement | null>(null);
  const journeyAudioStateRef = useRef(journeyAudio);
  const breviaryAudioStateRef = useRef(breviaryAudio);
  const rosaryAudioStateRef = useRef(rosaryAudio);
  const rosarySequence = useMemo(() => buildRosarySequence(rosaryMode, rosaryMysteryIndex), [rosaryMode, rosaryMysteryIndex]);
  const rosarySegmentsRef = useRef(rosarySequence.segments);
  const rosaryClipsRef = useRef(rosarySequence.clips);
  rosarySegmentsRef.current = rosarySequence.segments;
  rosaryClipsRef.current = rosarySequence.clips;
  const breviaryDay = route === "breviary" && isBreviaryHour(breviaryHour)
    ? assembleBreviary(breviaryDate, breviaryHour, voicePreference)
    : null;
  const breviaryDayRef = useRef(breviaryDay);
  breviaryDayRef.current = breviaryDay;
  const searchSheetStartY = useRef<number | null>(null);
  const preserveNarrationOnNavigation = useRef(false);
  const changeVoicePreference = (gender: NarrationGender) => {
    setVoicePreference(gender);
    try {
      saveNarrationGender(gender);
      setVoicePreferenceError(false);
    } catch {
      setVoicePreferenceError(true);
    }
  };
  const advanceNarration = () => {
    if (route !== "read") return;
    if (readingPosition.chapter >= getChapterCount(readingPosition.bookId)) {
      stopSpeaking();
      return;
    }
    setReadingPosition({ ...readingPosition, chapter: readingPosition.chapter + 1 });
    setPendingNarration("start");
  };
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
      return { text: journeyIntroText(period.id), audioUrls: journeyIntroAudioUrls(periodIndex, voicePreference) };
    }
    const text = period.stories[storyIndex].references.flatMap((reference) => resolveReference(reference).map((verse) => verse.text)).join(" ");
    return { text, audioUrls: journeyStoryAudioUrls(periodIndex, storyIndex, voicePreference) };
  };
  const playJourneyStory = (periodId: string, storyIndex: number, shouldPlay: boolean) => {
    const periodIndex = bibleJourney.findIndex((period) => period.id === periodId);
    const period = bibleJourney[periodIndex];
    if (!period || storyIndex < JOURNEY_INTRO_INDEX || storyIndex >= period.stories.length) return;
    const { text, audioUrls } = journeyPlayback(periodIndex, storyIndex);
    const next: JourneyAudioState = {
      periodId,
      storyIndex,
      status: shouldPlay ? "playing" : "paused",
      error: null,
    };
    updateJourneyAudio(next);
    if (shouldPlay) {
      const started = startSpeaking(
        text,
        audioUrls,
        advanceJourneyAudio,
        () => failJourneyAudio(periodId, storyIndex),
        voicePreference,
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
      const started = resumeSpeaking(
        text,
        audioUrls,
        advanceJourneyAudio,
        () => failJourneyAudio(journeyPeriodId, current.storyIndex),
        voicePreference,
      );
      updateJourneyAudio({ ...current, status: "playing", error: null });
      if (!started) failJourneyAudio(journeyPeriodId, current.storyIndex);
      return;
    }
    playJourneyStory(journeyPeriodId, JOURNEY_INTRO_INDEX, true);
  };
  const skipJourneyIntro = () => {
    const current = journeyAudioStateRef.current;
    if (!journeyPeriodId || current.periodId !== journeyPeriodId || current.storyIndex !== JOURNEY_INTRO_INDEX) return;
    playJourneyStory(journeyPeriodId, 0, true);
    window.requestAnimationFrame(() => {
      document.getElementById(`story-${journeyPeriodId}-0`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    if (route !== "journey" || !period) return;
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
  const playRosaryClip = (clipIndex: number, resetSegmentElapsed = false) => {
    const clip = rosaryClipsRef.current[clipIndex];
    if (!clip) return;
    const current = rosaryAudioStateRef.current;
    const prayedBeadIndices = current.status === "idle" && clipIndex === 0 ? [] : current.prayedBeadIndices;
    const segmentElapsedSeconds = resetSegmentElapsed || current.segmentIndex !== clip.segmentIndex ? 0 : current.segmentElapsedSeconds;
    updateRosaryAudio({ segmentIndex: clip.segmentIndex, clipIndex, segmentElapsedSeconds, prayedBeadIndices, status: "playing", error: null });
    const audioUrls = rosaryAudioUrlsFor(clip.audioAsset, voicePreference);
    const started = startSpeaking(clip.spokenText, audioUrls, advanceRosaryAudio, () => failRosaryAudio(clipIndex), voicePreference);
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
  const advanceRosaryAudio = () => {
    if (route !== "rosary-prayer") return;
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
    const current = rosaryAudioStateRef.current;
    if (current.status === "playing") {
      pauseSpeaking();
      updateRosaryAudio({ ...current, status: "paused" });
      return;
    }
    const clip = rosaryClipsRef.current[current.clipIndex];
    if (current.status === "paused" && clip) {
      const audioUrls = rosaryAudioUrlsFor(clip.audioAsset, voicePreference);
      const started = resumeSpeaking(clip.spokenText, audioUrls, advanceRosaryAudio, () => failRosaryAudio(current.clipIndex), voicePreference);
      updateRosaryAudio({ ...current, status: "playing", error: null });
      if (!started) failRosaryAudio(current.clipIndex);
      return;
    }
    playRosarySegment(0);
  };
  const changeRosaryMode = (mode: RosaryMode) => {
    if (mode === rosaryMode) return;
    stopSpeaking();
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
  const playBreviarySegment = (segmentIndex: number) => {
    const segment = breviaryDayRef.current?.segments[segmentIndex];
    if (!segment) return;
    updateBreviaryAudio({ segmentIndex, status: "playing", error: null });
    const started = startSpeaking(segment.text, segment.audioUrls, advanceBreviaryAudio, () => failBreviaryAudio(segmentIndex), voicePreference);
    if (!started) failBreviaryAudio(segmentIndex);
    window.requestAnimationFrame(() => {
      document.getElementById(`breviary-${segment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  const playBreviaryIntro = () => {
    if (!isBreviaryHour(breviaryHour)) return;
    const text = breviaryIntroText(breviaryHour);
    if (!text) return playBreviarySegment(0);
    updateBreviaryAudio({ segmentIndex: BREVIARY_INTRO_INDEX, status: "playing", error: null });
    const started = startSpeaking(text, breviaryIntroAudioUrls(breviaryHour, voicePreference), advanceBreviaryAudio, () => failBreviaryAudio(BREVIARY_INTRO_INDEX), voicePreference);
    if (!started) failBreviaryAudio(BREVIARY_INTRO_INDEX);
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
    const current = breviaryAudioStateRef.current;
    if (current.status === "playing") {
      pauseSpeaking();
      updateBreviaryAudio({ ...current, status: "paused" });
      return;
    }
    const segment = breviaryDayRef.current?.segments[current.segmentIndex];
    if (current.status === "paused" && current.segmentIndex === BREVIARY_INTRO_INDEX && isBreviaryHour(breviaryHour)) {
      const text = breviaryIntroText(breviaryHour);
      const started = resumeSpeaking(text, breviaryIntroAudioUrls(breviaryHour, voicePreference), advanceBreviaryAudio, () => failBreviaryAudio(BREVIARY_INTRO_INDEX), voicePreference);
      updateBreviaryAudio({ ...current, status: "playing", error: null });
      if (!started) failBreviaryAudio(BREVIARY_INTRO_INDEX);
      return;
    }
    if (current.status === "paused" && segment) {
      const started = resumeSpeaking(segment.text, segment.audioUrls, advanceBreviaryAudio, () => failBreviaryAudio(current.segmentIndex), voicePreference);
      updateBreviaryAudio({ ...current, status: "playing", error: null });
      if (!started) failBreviaryAudio(current.segmentIndex);
      return;
    }
    playBreviaryIntro();
  };
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setSaintSlug(readSaintSlug());
      setRosaryMysteryIndex(readRosaryMysteryIndex());
      setBreviaryHour(readBreviaryHour());
      setJourneyPeriodId(readJourneyPeriodId());
      setJourneyStoryAnchor(readJourneyStoryAnchor());
      setMenuOpen(false);
      if (!readJourneyStoryAnchor()) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
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
    if (route !== "journey" || !journeyPeriodId) return;
    setLastJourneyPeriodId(journeyPeriodId);
    try {
      window.localStorage.setItem(LAST_JOURNEY_PERIOD_KEY, journeyPeriodId);
    } catch {
      // Keep the current period available for this visit if storage is unavailable.
    }
  }, [route, journeyPeriodId]);
  useEffect(() => {
    const current = journeyAudioStateRef.current;
    if (route === "journey" && current.periodId === journeyPeriodId) return;
    stopSpeaking();
    journeyAudioStateRef.current = INITIAL_JOURNEY_AUDIO;
    setJourneyAudio(INITIAL_JOURNEY_AUDIO);
  }, [route, journeyPeriodId]);
  useEffect(() => {
    if (breviaryAudioStateRef.current.status === "idle") return;
    stopSpeaking();
    updateBreviaryAudio(INITIAL_BREVIARY_AUDIO);
  }, [route, breviaryHour, breviaryDate]);
  useEffect(() => {
    const current = rosaryAudioStateRef.current;
    if (route === "rosary-prayer" && current.status === "idle") return;
    if (current.status !== "idle") stopSpeaking();
    updateRosaryAudio(INITIAL_ROSARY_AUDIO);
  }, [route, rosaryMysteryIndex, rosaryMode]);
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("template-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty("--reader-font-size", `${fontSize}px`);
    window.localStorage.setItem("reader-font-size", String(fontSize));
  }, [fontSize]);
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);
  useEffect(() => {
    if (!highlightVerse) return;
    const timeout = window.setTimeout(() => setHighlightVerse(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [highlightVerse]);
  useEffect(
    () => subscribeNarration(() => setNarration(getNarrationSnapshot())),
    [],
  );
  useEffect(() => {
    if (!pendingNarration || route !== "read") return;
    const audioUrls = narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter, voicePreference);
    const text = getChapter(readingPosition.bookId, readingPosition.chapter)
      .map((verse) => verse.text)
      .join(" ");
    if (pendingNarration === "pause") pauseSpeaking();
    else if (pendingNarration === "resume") resumeSpeaking(text, audioUrls, advanceNarration, undefined, voicePreference);
    else startSpeaking(text, audioUrls, advanceNarration, undefined, voicePreference);
    setPendingNarration(null);
  }, [pendingNarration, readingPosition, route, voicePreference]);
  useEffect(() => () => {
    if (preserveNarrationOnNavigation.current) {
      preserveNarrationOnNavigation.current = false;
      return;
    }
    stopSpeaking();
  }, [route, readingPosition]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);
  const openReader = (
    position = readingPosition,
    verse: number | null = null,
  ) => {
    setReadingPosition(position);
    setHighlightVerse(verse);
    window.location.hash = "#/read";
  };
  const toggleJourneyPeriod = (periodId: string) => {
    const completedIds = journeyProgress.completedIds.includes(periodId)
      ? journeyProgress.completedIds.filter((id) => id !== periodId)
      : [...journeyProgress.completedIds, periodId];
    const saved = saveJourneyProgress(completedIds);
    setJourneyProgress({ completedIds, storageError: !saved });
  };
  const selectJourneyArtwork = (periodId: string, optionId: string) => {
    const selections = { ...journeyArtwork.selections, [periodId]: optionId };
    setJourneyArtwork({ selections, storageError: !saveJourneyArtworkSelections(selections) });
  };
  const isChapterBookmarked =
    route === "read" &&
    bookmarks.some(
      (bookmark) =>
        bookmark.bookId === readingPosition.bookId &&
        bookmark.chapter === readingPosition.chapter &&
        !isVerseBookmark(bookmark),
    );
  const isBookmarked = route === "read" && bookmarks.some(
    (bookmark) => bookmark.bookId === readingPosition.bookId && bookmark.chapter === readingPosition.chapter,
  );
  const toggleBookmark = (verseRange?: SelectedVerseRange) => {
    if (!verseRange && isChapterBookmarked) {
      setBookmarks((current) => current.filter((bookmark) => bookmark.bookId !== readingPosition.bookId || bookmark.chapter !== readingPosition.chapter || isVerseBookmark(bookmark)));
      return;
    }
    setModal({ type: "bookmark", categories: bookmarkCategories, onSave: (category) => {
      setBookmarkCategories((current) => {
        if (current.some((item) => item.toLowerCase() === category.toLowerCase())) return current;
        const next = [...current, category];
        saveBookmarkCategories(next);
        return next;
      });
      setBookmarks((current) => {
        const bookmark: Bookmark = { ...readingPosition, createdAt: Date.now(), category };
        if (verseRange) Object.assign(bookmark, verseRange);
        return [bookmark, ...current];
      });
    }, onAddCategory: (category) => {
      setBookmarkCategories((current) => {
        const next = current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category];
        saveBookmarkCategories(next);
        return next;
      });
    } });
  };
  const removeBookmark = (bookmark: Bookmark) =>
    setBookmarks((current) =>
      current.filter(
        (item) =>
          item.bookId !== bookmark.bookId || item.chapter !== bookmark.chapter ||
          item.verseStart !== bookmark.verseStart || item.verseEnd !== bookmark.verseEnd,
      ),
    );
  const removeBookmarkCategory = (category: string) => {
    const next = bookmarkCategories.filter((item) => item !== category);
    setBookmarkCategories(next);
    saveBookmarkCategories(next);
  };
  const shareApp = async (): Promise<"shared" | "copied"> => {
    const shareData = {
      title: "Soundfaith Bible",
      text: "A quiet place to return to the Scriptures.",
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return "shared";
    }
    await navigator.clipboard?.writeText(window.location.href);
    return "copied";
  };
  const chapterNarration = (position: ReadingPosition) => getChapter(position.bookId, position.chapter)
    .map((verse) => verse.text)
    .join(" ");
  const narrationForCurrentPage = (): { text: string; audioUrls: string[]; onEnded?: () => void } | null => {
    if (route === "read") {
      const audioUrls = narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter, voicePreference);
      return { text: chapterNarration(readingPosition), audioUrls, onEnded: advanceNarration };
    }
    if (route === "mass") {
      const entry = getMassReadingForDate(massDate) || getTodaysMassReading();
      return {
        text: Object.values(entry.readings).map((reading) => reading.text).join("\n\n"),
        audioUrls: [],
      };
    }
    return null;
  };
  const toggleNarration = () => {
    const current = getNarrationSnapshot();
    const readingText = chapterNarration(readingPosition);
    if (route !== "read") {
      const narrationForPage = narrationForCurrentPage();
      if (narrationForPage) {
        if (current.text === narrationForPage.text && current.status === "playing") pauseSpeaking();
        else if (current.text === narrationForPage.text && current.status === "paused") {
          resumeSpeaking(narrationForPage.text, narrationForPage.audioUrls, narrationForPage.onEnded, undefined, voicePreference);
        } else startSpeaking(narrationForPage.text, narrationForPage.audioUrls, narrationForPage.onEnded, undefined, voicePreference);
        return;
      }
      const action = current.text === readingText && current.status === "playing"
        ? "pause"
        : current.text === readingText && current.status === "paused" ? "resume" : "start";
      if (current.text === readingText && current.status !== "idle") preserveNarrationOnNavigation.current = true;
      setPendingNarration(action);
      openReader(readingPosition);
      return;
    }
    const narrationForPage = narrationForCurrentPage();
    if (!narrationForPage) return;
    if (current.text === narrationForPage.text && current.status === "playing") pauseSpeaking();
    else if (current.text === narrationForPage.text && current.status === "paused") {
      resumeSpeaking(narrationForPage.text, narrationForPage.audioUrls, narrationForPage.onEnded, undefined, voicePreference);
    } else startSpeaking(narrationForPage.text, narrationForPage.audioUrls, narrationForPage.onEnded, undefined, voicePreference);
  };
  const resumeJourney = () => {
    const periodId = lastJourneyPeriodId ?? bibleJourney[0].id;
    window.location.hash = `#/journey/${periodId}`;
  };
  const openCurrentBreviary = () => {
    setBreviaryDate(new Date());
    window.location.hash = `#/breviary/${currentBreviaryHour()}`;
  };
  const openPicker = () =>
    setModal({
      type: "chapter",
      current: readingPosition,
      onChoose: (position) => openReader(position),
    });
  const openBibleBooks = () => {
    window.location.hash = "#/bible";
  };
  const openMassReference = (reference: string) => {
    const verses = resolveReference(reference);
    const bookName = reference.split(/\s+\d+:/)[0].toLowerCase();
    const book = bibleBooks.find(
      (item) =>
        item.name.toLowerCase() === bookName ||
        (bookName === "psalm" && item.id === "psalms"),
    );
    if (book && verses[0])
      openReader(
        { bookId: book.id, chapter: verses[0].chapter },
        verses[0].verse,
      );
  };
  const Info = ({ size }: { size: number }) =>
    narration.status === "playing" ? (
      <Pause size={size} />
    ) : (
      <Play size={size} />
    );
  const journeyAudioForPage =
    journeyPeriodId && journeyAudio.periodId === journeyPeriodId ? journeyAudio : INITIAL_JOURNEY_AUDIO;
  const journeyStoryProgress = narration.duration > 0
    ? narration.position / narration.duration
    : narration.text.length > 0 ? narration.position / narration.text.length : 0;
  const rosaryActiveSegment = rosarySequence.segments[rosaryAudio.segmentIndex];
  const rosaryActiveClip = rosarySequence.clips[rosaryAudio.clipIndex];
  const activeRosaryBeadIndex = rosaryAudio.status === "idle" ? null : rosaryActiveClip?.beadIndex ?? null;
  const rosarySegmentClipCount = rosaryActiveSegment ? rosaryActiveSegment.endClipIndex - rosaryActiveSegment.firstClipIndex : 0;
  const rosarySegmentProgress = rosaryActiveSegment && rosarySegmentClipCount > 0
    ? (rosaryAudio.clipIndex - rosaryActiveSegment.firstClipIndex + journeyStoryProgress) / rosarySegmentClipCount
    : 0;
  const isJourneyDetail = route === "journey" && Boolean(journeyPeriodId);
  const journeyIntroActive = isJourneyDetail && journeyAudioForPage.storyIndex === JOURNEY_INTRO_INDEX && journeyAudioForPage.status !== "idle";
  const isBreviaryDetail = route === "breviary" && breviaryDay !== null;
  const isRosaryDetail = route === "rosary-prayer";
  const isSaintDetail = route === "saint-profile";
  const breviaryIntroActive = isBreviaryDetail && breviaryAudio.segmentIndex === BREVIARY_INTRO_INDEX && breviaryAudio.status !== "idle";
  const todayGospelReference = Object.entries(getTodaysMassReading().readings).find(([name]) => name.toLowerCase() === "gospel")?.[1].reference ?? "John 1:1-5";
  const journeyComplete = bibleJourney.every((period) => journeyProgress.completedIds.includes(period.id));
  const mobileListenStatus = isRosaryDetail ? rosaryAudio.status : isBreviaryDetail ? breviaryAudio.status : isJourneyDetail ? journeyAudioForPage.status : narration.status;
  const mobileListenLabel = mobileListenStatus === "playing"
    ? isJourneyDetail || isBreviaryDetail || isRosaryDetail ? "Pause prayer audio" : "Pause narration"
    : mobileListenStatus === "paused"
      ? isJourneyDetail || isBreviaryDetail || isRosaryDetail ? "Resume prayer audio" : "Resume narration"
      : isRosaryDetail ? "Listen to the Rosary"
      : isBreviaryDetail ? "Listen to this hour of prayer"
      : isJourneyDetail
        ? `Listen to all stories in ${bibleJourney.find((period) => period.id === journeyPeriodId)?.title ?? "this period"}`
        : isSaintDetail ? "Listen to this saint's story"
        : "Listen to this reading";
  const mobileListenIcon = mobileListenStatus === "playing"
    ? <span className="audio-equalizer" aria-hidden="true"><i /><i /><i /><i /></span>
    : mobileListenStatus === "paused" ? <Play size={17} /> : <Headphones size={19} />;
  const mobileListenElapsedSeconds = isRosaryDetail ? rosaryAudio.segmentElapsedSeconds + narration.elapsedSeconds : narration.elapsedSeconds;
  const mobileListenText = mobileListenStatus === "playing"
    ? `${String(Math.floor(mobileListenElapsedSeconds / 60)).padStart(2, "0")}:${String(mobileListenElapsedSeconds % 60).padStart(2, "0")}`
    : mobileListenStatus === "paused" ? "Resume" : "Listen";
  const page =
    route === "read" ? (
      <ChapterPage
        position={readingPosition}
        voicePreference={voicePreference}
        onPositionChange={setReadingPosition}
        onSelectChapter={openBibleBooks}
        highlightVerse={highlightVerse}
        isBookmarked={isBookmarked}
        isChapterBookmarked={isChapterBookmarked}
        onToggleBookmark={toggleBookmark}
        onNarrationEnded={advanceNarration}
      />
    ) : route === "bible" ? (
      <BibleBooksPage
        current={readingPosition}
        onResume={() => openReader(readingPosition)}
        onChoose={(position) => openReader(position)}
      />
    ) : route === "mass" ? (
      <MassReadingPage
        onOpenReference={openMassReference}
        selectedDate={massDate}
        onSelectedDateChange={setMassDate}
        voicePreference={voicePreference}
        nextStep={<DailyNextStep
          page="mass"
          doneToday={getDoneToday(dailyStreak)}
          streak={dailyStreak}
          hour={currentBreviaryHour()}
          journeyComplete={journeyComplete}
          gospelReference={todayGospelReference}
          onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
          onOpenBreviary={openCurrentBreviary}
          onOpenRosary={() => { window.location.hash = "#/rosary"; }}
          onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
          onOpenJourney={() => { window.location.hash = "#/journey"; }}
          onOpenReference={openMassReference}
          onOpenChapter={(bookId, chapter) => openReader({ bookId, chapter })}
        />}
      />
    ) : route === "breviary" ? breviaryHour ? (
      <BreviaryPage
        hour={breviaryHour}
        day={breviaryDay}
        date={breviaryDate}
        onDateChange={setBreviaryDate}
        audioStatus={breviaryAudio.status}
        activeSegmentIndex={breviaryAudio.segmentIndex}
        audioError={breviaryAudio.error}
        onToggleAudio={toggleBreviaryAudio}
        onSelectSegment={playBreviarySegment}
        onSkipIntro={skipBreviaryIntro}
        nextStep={<DailyNextStep
          page="breviary"
          doneToday={getDoneToday(dailyStreak)}
          streak={dailyStreak}
          hour={isBreviaryHour(breviaryHour) ? breviaryHour : currentBreviaryHour()}
          journeyComplete={journeyComplete}
          gospelReference={todayGospelReference}
          onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
          onOpenBreviary={openCurrentBreviary}
          onOpenRosary={() => { window.location.hash = "#/rosary"; }}
          onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
          onOpenJourney={() => { window.location.hash = "#/journey"; }}
          onOpenReference={openMassReference}
          onOpenChapter={(bookId, chapter) => openReader({ bookId, chapter })}
        />}
      />
    ) : (
      <BreviaryLibrary date={breviaryDate} onDateChange={setBreviaryDate} {...breviaryDayInfo(breviaryDate)} />
    ) : route === "rosary-prayer" ? (
      <RosaryPrayerPage key={rosaryMysteryIndex} mysteryIndex={rosaryMysteryIndex} mode={rosaryMode} onModeChange={changeRosaryMode} audioStatus={rosaryAudio.status} activeSegmentIndex={rosaryAudio.segmentIndex} activePrayerGroupId={rosaryClipsRef.current[rosaryAudio.clipIndex]?.groupId ?? null} prayedBeadIndices={rosaryAudio.prayedBeadIndices} activeBeadIndex={activeRosaryBeadIndex} audioError={rosaryAudio.error} onToggleAudio={toggleRosaryAudio} onSelectSegment={playRosarySegment} nextStep={<DailyNextStep
        page="rosary"
        doneToday={getDoneToday(dailyStreak)}
        streak={dailyStreak}
        hour={currentBreviaryHour()}
        journeyComplete={journeyComplete}
        gospelReference={todayGospelReference}
        onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
        onOpenBreviary={openCurrentBreviary}
        onOpenRosary={() => { window.location.hash = "#/rosary"; }}
        onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
        onOpenJourney={() => { window.location.hash = "#/journey"; }}
        onOpenReference={openMassReference}
        onOpenChapter={(bookId, chapter) => openReader({ bookId, chapter })}
      />} />
    ) : route === "saints" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening the saints catalogue…</p></main>}><SaintsLibrary onOpenToday={() => { window.location.hash = "#/saints/today"; }} /></Suspense>
    ) : route === "saint-profile" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening saint profile…</p></main>}><SaintPage slug={saintSlug} voicePreference={voicePreference} nextStep={<DailyNextStep
        page="saints"
        doneToday={getDoneToday(dailyStreak)}
        streak={dailyStreak}
        hour={currentBreviaryHour()}
        journeyComplete={journeyComplete}
        gospelReference={todayGospelReference}
        onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
        onOpenBreviary={openCurrentBreviary}
        onOpenRosary={() => { window.location.hash = "#/rosary"; }}
        onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
        onOpenJourney={() => { window.location.hash = "#/journey"; }}
        onOpenReference={openMassReference}
        onOpenChapter={(bookId, chapter) => openReader({ bookId, chapter })}
      />} /></Suspense>
    ) : route === "rosary" ? (
      <RosaryLibrary />
    ) : route === "bookmarks" ? (
      <BookmarksPage
        bookmarks={bookmarks}
        categories={bookmarkCategories}
        onOpen={(bookmark) => openReader(bookmark, isVerseBookmark(bookmark) ? bookmark.verseStart! : null)}
        onRemove={removeBookmark}
        onRemoveCategory={removeBookmarkCategory}
      />
    ) : route === "journey-artwork" ? (
      <JourneyArtworkPage
        selections={journeyArtwork.selections}
        storageError={journeyArtwork.storageError}
        onSelect={selectJourneyArtwork}
      />
    ) : route === "journey" ? journeyPeriodId ? (
      <BibleJourneyPage
        periodId={journeyPeriodId}
        completedIds={journeyProgress.completedIds}
        storageError={journeyProgress.storageError}
        artworkSelections={journeyArtwork.selections}
        audioStatus={journeyAudioForPage.status}
        activeStoryIndex={journeyAudioForPage.storyIndex}
        audioError={journeyAudioForPage.error}
        onToggleComplete={toggleJourneyPeriod}
        onToggleAudio={toggleJourneyAudio}
        onSelectAudioStory={selectJourneyAudioStory}
        onSkipIntro={skipJourneyIntro}
        onOpenPassage={(bookId, chapter, verse) => openReader({ bookId, chapter }, verse)}
      />
    ) : (
      <BibleJourneyLibrary
        completedIds={journeyProgress.completedIds}
        storageError={journeyProgress.storageError}
        artworkSelections={journeyArtwork.selections}
        lastVisitedPeriodId={lastJourneyPeriodId}
        onResume={resumeJourney}
      />
    ) : route === "library" ? (
      <ReferencePage eyebrow="Component library" title={<>A practical<br /><em>design library.</em></>} copy="A reference for the components and patterns used across the template." />
    ) : route === "about" ? (
      <AboutPage />
    ) : (
      <HomePage
        onResume={() => openReader()}
        onChoose={() => { window.location.hash = "#/bible"; }}
        onJourney={() => { window.location.hash = "#/journey"; }}
        onBreviary={() => { window.location.hash = "#/breviary"; }}
        onRosary={() => { window.location.hash = todaysRosaryPath(); }}
        onSaints={() => { window.location.hash = "#/saints"; }}
        onSaintToday={() => { window.location.hash = "#/saints/today"; }}
        onMass={() => {
          setMassDate(getTodaysMassReading().date);
          window.location.hash = "#/mass";
        }}
        streak={dailyStreak}
        bible={{
          started: hasOpenedBible(),
          label: `${bibleBooks.find((book) => book.id === readingPosition.bookId)?.name ?? "Genesis"} ${readingPosition.chapter}`,
        }}
        onShare={shareApp}
        onOpenDaily={(item) => {
          if (item === "mass") {
            setMassDate(getTodaysMassReading().date);
            window.location.hash = "#/mass";
          } else if (item === "rosary") {
            window.location.hash = "#/rosary";
          } else if (item === "saints") {
            window.location.hash = "#/saints/today";
          } else {
            setBreviaryDate(new Date());
            window.location.hash = `#/breviary/${item}`;
          }
        }}
      />
    );
  return (
    <div className="app-shell">
      <header className="site-header" ref={menuRef}>
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#/" className={route === "home" ? "active" : ""}>Home</a>
          <a href="#/bible" className={route === "read" || route === "bible" ? "active" : ""}>Bible</a>
          <a href="#/journey" className={route === "journey" || route === "journey-artwork" ? "active" : ""}>Bible Journey</a>
          <a href="#/breviary" className={route === "breviary" ? "active" : ""}>Breviary</a>
          <a href="#/rosary" className={route === "rosary" || route === "rosary-prayer" ? "active" : ""}>Rosary</a>
          <a href="#/saints" className={route === "saints" || route === "saint-profile" ? "active" : ""}>Saints</a>
          <a href="#/mass" className={route === "mass" ? "active" : ""}>Mass Reading</a>
        </nav>
        <nav
          className={menuOpen ? "main-nav nav-open" : "main-nav"}
          aria-label="Primary navigation"
        >
          <div className="menu-heading">
            <button
              className="icon-button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <a href="#/" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><House size={17} />Home</a>
          <a href="#/read" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><BookOpen size={17} />Bible</a>
          <a href="#/journey" className="mobile-drawer-link" aria-current={route === "journey" || route === "journey-artwork" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Compass size={17} />Bible Journey</a>
          <a href="#/breviary" className="mobile-drawer-link" aria-current={route === "breviary" ? "page" : undefined} onClick={() => setMenuOpen(false)}><BreviaryHourIcon size={17} />Breviary</a>
          <a href="#/rosary" className="mobile-drawer-link" aria-current={route === "rosary" || route === "rosary-prayer" ? "page" : undefined} onClick={() => setMenuOpen(false)}><CircleHelp size={17} />Rosary</a>
          <a href="#/saints" className="mobile-drawer-link" aria-current={route === "saints" || route === "saint-profile" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Sparkles size={17} />Saints</a>
          <a href="#/mass" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><Church size={17} />Mass Reading</a>
          <a href="#/bookmarks" onClick={() => setMenuOpen(false)}><BookmarkMenuIcon size={17} />Saved Passages</a>
          <a href="#/about" onClick={() => setMenuOpen(false)}><CircleHelp size={17} />About</a>
          <section className="font-size-control" aria-label="Reading font size">
            <div className="font-size-heading"><span>Text size</span><span>{fontSize}px</span></div>
            <div className="font-size-preview">The Lord is my shepherd; I shall not want.</div>
            <div className="font-size-buttons">
              <button className="icon-button" aria-label="Decrease font size" disabled={fontSize <= 16} onClick={() => setFontSize((size) => Math.max(16, size - 2))}><Minus size={16} /></button>
              <button className="icon-button" aria-label="Increase font size" disabled={fontSize >= 30} onClick={() => setFontSize((size) => Math.min(30, size + 2))}><Plus size={16} /></button>
            </div>
          </section>
          <section className="voice-preference-control" aria-label="Narration voice">
            <span className="voice-preference-label">Narration voice</span>
            <div className="voice-preference-options">
              {(["male", "female"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={voicePreference === gender}
                  onClick={() => changeVoicePreference(gender)}
                >
                  {gender === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
            {voicePreferenceError && <p role="status">Could not save this preference. It will apply until you close the app.</p>}
          </section>
          <div className="mobile-menu-theme">
            <span>Theme</span>
            <ThemeToggle
              theme={theme}
              onChange={setTheme}
            />
          </div>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button mobile-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <button
          className="menu-scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {page}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {route === "read" && <NarrationProgress className="narration-progress-mobile" enabled={narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter, voicePreference).length > 0} />}
        {isSaintDetail && <NarrationProgress className="narration-progress-mobile" />}
        {isJourneyDetail && <JourneyNarrationProgress
          className="narration-progress-mobile"
          storyCount={bibleJourney.find((period) => period.id === journeyPeriodId)?.stories.length ?? 0}
          activeStoryIndex={Math.max(0, journeyAudioForPage.storyIndex)}
          activeStoryProgress={journeyIntroActive ? 0 : journeyStoryProgress}
          status={journeyAudioForPage.status}
          onSelectStory={selectJourneyAudioStory}
        />}
        {journeyIntroActive && (
          <button type="button" className="journey-skip-intro journey-skip-intro-floating" onClick={skipJourneyIntro}>
            <SkipForward size={12} aria-hidden="true" /> Skip intro
          </button>
        )}
        {isBreviaryDetail && breviaryDay && <JourneyNarrationProgress
          className="narration-progress-mobile"
          storyCount={breviaryDay.segments.length}
          activeStoryIndex={Math.max(0, breviaryAudio.segmentIndex)}
          activeStoryProgress={breviaryIntroActive ? 0 : journeyStoryProgress}
          status={breviaryAudio.status}
          onSelectStory={playBreviarySegment}
        />}
        {isRosaryDetail && <JourneyNarrationProgress
          className="narration-progress-mobile"
          storyCount={rosarySequence.segments.length}
          activeStoryIndex={rosaryAudio.segmentIndex}
          activeStoryProgress={rosarySegmentProgress}
          status={rosaryAudio.status}
          onSelectStory={playRosarySegment}
          itemLabel="Segment"
          positionLabel="Rosary segment position"
        />}
        {breviaryIntroActive && (
          <button type="button" className="journey-skip-intro journey-skip-intro-floating" onClick={skipBreviaryIntro}>
            <SkipForward size={12} aria-hidden="true" /> Skip intro
          </button>
        )}
        <a href="#/" className={route === "home" ? "active" : ""} aria-current={route === "home" ? "page" : undefined}>
          <Home size={17} />
          <span>Home</span>
        </a>
        <a
          href="#/bible"
          className={route === "read" || route === "bible" ? "active" : ""}
          aria-current={route === "read" || route === "bible" ? "page" : undefined}
        >
          <BookOpen size={17} />
          <span>Bible</span>
        </a>
        <button
          className="mobile-donate mobile-center-playback mobile-listen-button"
          onClick={isSaintDetail ? requestSaintNarrationToggle : isRosaryDetail ? toggleRosaryAudio : isBreviaryDetail ? toggleBreviaryAudio : isJourneyDetail ? toggleJourneyAudio : toggleNarration}
          aria-label={mobileListenLabel}
        >
          {mobileListenIcon}<span>{mobileListenText}</span>
        </button>
        <a href="#/journey" className={route === "journey" || route === "journey-artwork" ? "mobile-listen active" : "mobile-listen"} aria-current={route === "journey" || route === "journey-artwork" ? "page" : undefined}>
          <Compass size={17} />
          <span>Journey</span>
        </a>
        <a href="#/breviary" className={route === "breviary" ? "active" : ""} aria-current={route === "breviary" ? "page" : undefined} onClick={(event) => { event.preventDefault(); openCurrentBreviary(); }}>
          <BreviaryHourIcon size={17} />
          <span>Breviary</span>
        </a>
      </nav>
      <footer className="site-footer">
        <div className="footer-bottom">
          <span>© 2026</span>
          <button className="footer-share" onClick={shareApp}><Share2 size={14} /> Share</button>
        </div>
      </footer>
      {(modal?.type === "chapter" || modal?.type === "bookmark") && (
        <ModalLayer modal={modal} close={() => setModal(null)} />
      )}
      {modal?.type === "search" && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section
            className={searchInteracted ? "modal search-modal-shell search-modal-engaged" : "modal search-modal-shell"}
            role="dialog"
            aria-modal="true"
            onTouchStart={(event) => {
              if (window.innerWidth <= 760) {
                searchSheetStartY.current = event.touches[0].clientY;
              }
            }}
            onTouchMove={(event) => {
              if (
                window.innerWidth <= 760 &&
                searchSheetStartY.current !== null
              ) {
                const delta =
                  event.touches[0].clientY - searchSheetStartY.current;
                if (delta > 90) setModal(null);
              }
            }}
            onTouchEnd={() => {
              searchSheetStartY.current = null;
            }}
          >
            <SearchModal
              onInteraction={() => setSearchInteracted(true)}
              close={() => setModal(null)}
              onChoose={(result: SearchResult) => {
                modal.onChoose(result);
                setModal(null);
              }}
            />
          </section>
        </div>
      )}
      <ChatWidget onOpenVerse={(bookId, chapter, verse) => openReader({ bookId, chapter }, verse)} />
    </div>
  );
}
