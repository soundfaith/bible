import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Compass,
  Church,
  CalendarDays,
  Bookmark as BookmarkMenuIcon,
  House,
  Home,
  CircleHelp,
  BookOpen,
  Landmark,
  Library,
  Headphones,
  Menu,
  Minus,
  Plus,
  Share2,
  Sunrise,
  Sparkles,
  ScrollText,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "./components/Brand";
import { DailyNextStep, type RecommendationPage } from "./components/DailyNextStep";
import { BibleMark } from "./components/BibleMark";
import { ModalLayer, type Modal } from "./components/ModalLayer";
import { SearchModal, type SearchResult } from "./components/SearchModal";
import { ChatWidget } from "./components/ChatWidget";
import { HomePage } from "./pages/HomePage";
import { DailyPage } from "./pages/DailyPage";
import { JourneysPage } from "./pages/JourneysPage";
import { NoWorryJourneyPage } from "./pages/NoWorryJourneyPage";
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
import { buildRosarySequence, todaysRosaryMysteryIndex, todaysRosaryPath, type RosaryMode } from "./data/rosary";
import { featuredSaintForDate, hasSaintSlug } from "./data/saintsDaily";
import { assembleBreviary, breviaryDayInfo, breviaryNarrationText, currentBreviaryHour, isBreviaryHour } from "./lib/breviary";
import { useScrollReveal } from "./lib/reveal";
import { hasEverDone, loadDailyStreak, localDateKey, recordDailyItem, recordJourneySession, routineDoneToday, type DailyItem, type Routine } from "./lib/dailyStreak";
import { syncSystemBars } from "./lib/platform";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ReferencePage } from "./pages/ReferencePage";
import { bibleBooks, getChapter, getChapterCount } from "./lib/bible";
import { bibleJourney } from "./data/bibleJourney";
import journeyIntros from "./data/journeyIntros.json";
import breviaryIntros from "./data/breviaryIntros.json";
import { resolveJourneyPeriodId, loadJourneyArtworkSelections, saveJourneyArtworkSelections } from "./data/journeyArtwork";
import { loadJourneyProgress, saveJourneyProgress } from "./lib/journeyProgress";
import { loadGuidedJourneyProgress, saveGuidedJourneyProgress } from "./lib/guidedJourneyProgress";
import { journeyProgressStorageKey, loadJourneyProgressData, updateJourneyProgressData } from "./lib/journeyProgressStore";
import { getJourneyOverview } from "./lib/journeyOverview";
import { noWorryJourney } from "./data/noWorryJourney";
import { journeyCadence } from "./data/journeyCatalog";
import { breviaryIntroAudioUrls, journeyIntroAudioUrls, journeyStoryAudioUrls, narrationAudioUrlsFor, rosaryAudioUrlsFor, saintNarrationAudioUrlsFor } from "./lib/narrationAudio";
import { getNarrationGender, saveNarrationGender, type NarrationGender } from "./lib/narrationVoice";
import { getMassReadingForDate, getTodaysMassReading, journeyStoryNarration, resolveReference } from "./lib/readings";
import { getBookmarkCategories, getBookmarks, isVerseBookmark, saveBookmarkCategories, saveBookmarks, type Bookmark } from "./lib/bookmarks";
import {
  changeNarrationVoice,
  getNarrationSnapshot,
  JourneyNarrationProgress,
  pauseSpeaking,
  resumeSpeaking,
  startSpeaking,
  loadWithoutPlaying,
  stopSpeaking,
  subscribeNarration,
  toggleActiveNarration,
  setNarrationCompletionHandler,
  dismissNarrationError,
  showNarrationError,
  playNextPlaylistItem,
  playPreviousPlaylistItem,
  estimatedNarrationDuration,
  narrationPartProgress,
  setNarrationPartSeekHandler,
  type NarrationTimeline,
  type NarrationTrack,
} from "./components/NarratorButton";
import { AudioPlayer, NavPlayer } from "./components/AudioPlayer";
import { ListenPage, type PlayKind } from "./pages/ListenPage";
import { catechismItem, noWorryItem, summaQuestionItem } from "./lib/audioPlaylists";
import { loadSummaData } from "./lib/summa";
import { catechismEditions } from "./lib/catechism";

const SaintPage = lazy(() => import("./pages/SaintsPage").then((module) => ({ default: module.SaintPage })));
const SaintsLibrary = lazy(() => import("./pages/SaintsPage").then((module) => ({ default: module.SaintsLibrary })));
const CatechismPage = lazy(() => import("./pages/CatechismPage").then((module) => ({ default: module.CatechismPage })));
const SummaPage = lazy(() => import("./pages/SummaPage").then((module) => ({ default: module.SummaPage })));

type Route = "home" | "listen" | "daily" | "read" | "bible" | "mass" | "bookmarks" | "library" | "about" | "journeys" | "journey" | "guided-journey" | "journey-artwork" | "breviary" | "rosary" | "rosary-prayer" | "saints" | "saint-profile" | "catechism" | "summa";
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
type BibleArt = Extract<NarrationTrack["art"], "bible" | "old-testament" | "new-testament" | "gospels">;
const isBibleArt = (art: NarrationTrack["art"]): art is BibleArt => art === "bible" || art === "old-testament" || art === "new-testament" || art === "gospels";
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

function journeyIntroText(periodId: string) {
  const intro = (journeyIntros as Record<string, string>)[periodId] ?? "";
  return intro.replace(/\s+/g, " ").trim();
}

function breviaryIntroText(hour: string) {
  return ((breviaryIntros as Record<string, string>)[hour] ?? "").replace(/\s+/g, " ").trim();
}

function getLastJourneyPeriodId() {
  return loadJourneyProgressData().data.lastVisitedPeriodId;
}

function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  return path === "journey-artwork" ? "journey-artwork"
    : path === "listen" ? "listen"
    : path === "journeys" ? "journeys"
    : path === "daily" ? "daily"
    : path.startsWith("journeys/") ? "guided-journey"
    : path === "summa" || path.startsWith("summa/") ? "summa"
    : path === "catechism" || path.startsWith("catechism/") ? "catechism"
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

function readGuidedJourneyDay() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const match = path.match(/^journeys\/no-worry\/(\d+)$/);
  if (!match) return null;
  const day = Number(match[1]);
  return Number.isInteger(day) && day >= 1 && day <= noWorryJourney.length ? day : null;
}

function RosaryMenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="6.2" strokeDasharray="0.2 2.45" />
      <path d="M12 14.7v3.1m-2.7 1.2h5.4M12 17.8v4" />
    </svg>
  );
}

export default function App() {
  useScrollReveal();
  const [route, setRoute] = useState<Route>(readRoute);
  const [saintSlug, setSaintSlug] = useState<string>(readSaintSlug);
  const [rosaryMysteryIndex, setRosaryMysteryIndex] = useState<number>(readRosaryMysteryIndex);
  const [journeyPeriodId, setJourneyPeriodId] = useState<string | null>(readJourneyPeriodId);
  const [lastJourneyPeriodId, setLastJourneyPeriodId] = useState<string | null>(getLastJourneyPeriodId);
  const [journeyStoryAnchor, setJourneyStoryAnchor] = useState<string | null>(readJourneyStoryAnchor);
  const [guidedJourneyDay, setGuidedJourneyDay] = useState<number | null>(readGuidedJourneyDay);
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
  const voicePreferenceRef = useRef(voicePreference);
  voicePreferenceRef.current = voicePreference;
  const [rosaryMode, setRosaryModeState] = useState<RosaryMode>(readRosaryMode);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(getLastReading);
  const [massDate, setMassDate] = useState(() => getTodaysMassReading().date);
  const [breviaryDate, setBreviaryDate] = useState(() => new Date());
  const [breviaryHour, setBreviaryHour] = useState<string | null>(readBreviaryHour);
  const [dailyStreak, setDailyStreak] = useState(loadDailyStreak);
  useEffect(() => {
    const syncJourneyProgress = (event: StorageEvent) => {
      if (event.key !== journeyProgressStorageKey) return;
      const { data, error } = loadJourneyProgressData();
      setJourneyProgress({ completedIds: data.bibleCompletedIds, storageError: error });
      setGuidedJourneyProgress({
        started: data.noWorryStarted || data.noWorryCompletedDays.length > 0,
        completedDays: data.noWorryCompletedDays,
        storageError: error,
      });
      setLastJourneyPeriodId(data.lastVisitedPeriodId);
    };
    window.addEventListener("storage", syncJourneyProgress);
    return () => window.removeEventListener("storage", syncJourneyProgress);
  }, []);
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
    } else if (route === "read") {
      setDailyStreak((state) => recordDailyItem(state, "bible", today));
    } else if (route === "catechism") {
      setDailyStreak((state) => recordDailyItem(state, "catechism", today));
    } else if (route === "summa") {
      setDailyStreak((state) => recordDailyItem(state, "summa", today));
    }
  }, [route, breviaryHour, breviaryDate, massDate, saintSlug]);
  const [breviaryAudio, setBreviaryAudio] = useState<BreviaryAudioState>(INITIAL_BREVIARY_AUDIO);
  const [rosaryAudio, setRosaryAudio] = useState<RosaryAudioState>(INITIAL_ROSARY_AUDIO);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [playerOpen, setPlayerOpenState] = useState(false);
  // The full player is mobile-only. On desktop, playback continues without opening it.
  const setPlayerOpen = (open: boolean) => {
    if (open && window.innerWidth > 760) return;
    setPlayerOpenState(open);
  };
  const [loadingListen, setLoadingListen] = useState<PlayKind | null>(null);
  const listenRequestRef = useRef(0);
  const [journeyAudio, setJourneyAudio] = useState<JourneyAudioState>(INITIAL_JOURNEY_AUDIO);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
  const [bookmarkCategories, setBookmarkCategories] = useState<string[]>(getBookmarkCategories);
  const [journeyProgress, setJourneyProgress] = useState(loadJourneyProgress);
  const [guidedJourneyProgress, setGuidedJourneyProgress] = useState(loadGuidedJourneyProgress);
  const [journeyArtwork, setJourneyArtwork] = useState(loadJourneyArtworkSelections);
  const menuRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (route === "guided-journey" && guidedJourneyProgress.started) {
      setDailyStreak((state) => recordJourneySession(state, "no-worry", journeyCadence("no-worry")));
    } else if (route === "journey" && journeyPeriodId) {
      setDailyStreak((state) => recordJourneySession(state, "bible", journeyCadence("bible")));
    }
  }, [route, journeyPeriodId, guidedJourneyProgress.started]);

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
  const searchSheetStartY = useRef<number | null>(null);
  const changeVoicePreference = (gender: NarrationGender) => {
    voicePreferenceRef.current = gender;
    setVoicePreference(gender);
    changeNarrationVoice(gender);
    try {
      saveNarrationGender(gender);
      setVoicePreferenceError(false);
    } catch {
      setVoicePreferenceError(true);
    }
  };
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
      setGuidedJourneyDay(readGuidedJourneyDay());
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
    if (route !== "journey" || !journeyPeriodId) return;
    setLastJourneyPeriodId(journeyPeriodId);
    const saved = updateJourneyProgressData((progress) => ({ ...progress, lastVisitedPeriodId: journeyPeriodId }));
    if (!saved) setJourneyProgress((progress) => ({ ...progress, storageError: true }));
  }, [route, journeyPeriodId]);
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("template-theme", theme);
    syncSystemBars(theme);
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
  const openReader = (
    position = readingPosition,
    verse: number | null = null,
  ) => {
    setReadingPosition(position);
    setHighlightVerse(verse);
    window.location.hash = "#/read";
  };
  const toggleJourneyPeriod = (periodId: string) => {
    const wasCompleted = journeyProgress.completedIds.includes(periodId);
    const completedIds = wasCompleted
      ? journeyProgress.completedIds.filter((id) => id !== periodId)
      : [...journeyProgress.completedIds, periodId];
    const saved = saveJourneyProgress(completedIds);
    setJourneyProgress({ completedIds, storageError: !saved });
    if (!wasCompleted) setDailyStreak((state) => recordDailyItem(state, "journey-bible"));
  };
  const startGuidedJourney = () => {
    const progress = { ...guidedJourneyProgress, started: true };
    setGuidedJourneyProgress({ ...progress, storageError: !saveGuidedJourneyProgress(progress) });
    setDailyStreak((state) => recordJourneySession(state, "no-worry", journeyCadence("no-worry")));
  };
  const completeGuidedJourneyDay = () => {
    if (!guidedJourneyProgress.started || guidedJourneyProgress.completedDays.length >= noWorryJourney.length) return;
    const nextDay = guidedJourneyProgress.completedDays.length + 1;
    const progress = {
      ...guidedJourneyProgress,
      started: true,
      completedDays: [...guidedJourneyProgress.completedDays, nextDay],
    };
    setGuidedJourneyProgress({ ...progress, storageError: !saveGuidedJourneyProgress(progress) });
    setDailyStreak((state) => recordDailyItem(state, "journey-no-worry"));
    setDailyStreak((state) => recordJourneySession(state, "no-worry", journeyCadence("no-worry")));
  };
  const journeyOverview = getJourneyOverview(guidedJourneyProgress, journeyProgress.completedIds, lastJourneyPeriodId);
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
      title: "SoundFaith",
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
  const resumeJourney = () => {
    const periodId = journeyOverview.bible.resumePeriod?.id ?? bibleJourney[0].id;
    window.location.hash = `#/journey/${periodId}`;
  };
  const openJourneyRecommendation = (journey: "no-worry" | "bible") => {
    if (journey === "no-worry") {
      window.location.hash = "#/journeys/no-worry";
    } else {
      resumeJourney();
    }
  };
  const openExploreJourneys = () => {
    if (route === "journeys") {
      if (!journeyOverview.noWorry.complete) openJourneyRecommendation("no-worry");
      else window.location.hash = "#/journey";
    } else {
      window.location.hash = "#/journeys";
    }
  };
  const openCurrentBreviary = () => {
    setBreviaryDate(new Date());
    window.location.hash = `#/breviary/${currentBreviaryHour()}`;
  };
  const openDailyItem = (item: DailyItem) => {
    if (item === "mass") {
      setMassDate(getTodaysMassReading().date);
      window.location.hash = "#/mass";
    } else if (item === "rosary") {
      window.location.hash = todaysRosaryPath();
    } else if (item === "saints") {
      window.location.hash = "#/saints/today";
    } else if (item === "bible") {
      window.location.hash = "#/bible";
    } else if (item === "catechism") {
      window.location.hash = "#/catechism";
    } else if (item === "summa") {
      window.location.hash = "#/summa";
    } else if (item === "journey-no-worry") {
      window.location.hash = "#/journeys/no-worry";
    } else if (item === "journey-bible") {
      resumeJourney();
    } else {
      setBreviaryDate(new Date());
      window.location.hash = `#/breviary/${item}`;
    }
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
  const todayGospelReference = Object.entries(getTodaysMassReading().readings).find(([name]) => name.toLowerCase() === "gospel")?.[1].reference ?? "John 1:1-5";
  const recommendation = (page: RecommendationPage) => <DailyNextStep
    page={page}
    streak={dailyStreak}
    hour={currentBreviaryHour()}
    journeyOverview={journeyOverview}
    gospelReference={todayGospelReference}
    onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
    onOpenBreviary={openCurrentBreviary}
    onOpenRosary={() => { window.location.hash = todaysRosaryPath(); }}
    onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
    onOpenJourney={openJourneyRecommendation}
    onExploreJourneys={openExploreJourneys}
    onOpenCatechism={() => { window.location.hash = "#/catechism"; }}
    onOpenSumma={() => { window.location.hash = "#/summa"; }}
    onOpenReference={openMassReference}
  />;
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
  const markNoWorryDayPlayed = (day: number) => {
    if (guidedJourneyProgress.completedDays.includes(day)) return;
    const completedDays = [...guidedJourneyProgress.completedDays, day].sort((a, b) => a - b);
    const progress = { ...guidedJourneyProgress, started: true, completedDays };
    setGuidedJourneyProgress({ ...progress, storageError: !saveGuidedJourneyProgress(progress) });
    setDailyStreak((state) => recordDailyItem(state, "journey-no-worry"));
  };
  const playMassReading = (entry: ReturnType<typeof getTodaysMassReading>) => {
    const text = Object.values(entry.readings).map((reading) => reading.text).join("\n\n");
    const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    return startSpeaking(text, [], undefined, undefined, voicePreferenceRef.current, { title: `Mass Readings · ${date}`, path: `#/mass?date=${entry.date}`, art: "readings" });
  };
  const stepMassReading = (path: string, offset: number) => {
    const current = new Date(`${path.split("date=")[1] ?? ""}T00:00:00`);
    if (Number.isNaN(current.getTime())) return;
    current.setDate(current.getDate() + offset);
    const entry = getMassReadingForDate(localDateKey(current));
    if (entry) playMassReading(entry);
  };
  // Mobile opens items paused so tapping a card never plays sound; only the hero card and the play action start audio.
  const playListening = async (kind: PlayKind, autoplay = true) => {
    const request = ++listenRequestRef.current;
    const previousTrack = getNarrationSnapshot().track;
    const hold = !autoplay && window.innerWidth <= 760 && getNarrationSnapshot().status === "idle";
    const start = <T,>(load: () => T): T => (hold ? loadWithoutPlaying(load) : load());
    setLoadingListen(kind === "summa" || kind === "saint" ? kind : null);
    try {
      if (kind === "old-testament" || kind === "new-testament" || kind === "gospels") {
        const position = { bookId: kind === "old-testament" ? "genesis" : "matthew", chapter: 1 };
        const art: BibleArt = kind;
        const text = getChapter(position.bookId, position.chapter).map((verse) => verse.text).join(" ");
        if (start(() => startSpeaking(text, narrationAudioUrlsFor(position.bookId, position.chapter, voicePreferenceRef.current), () => advanceNarration(position, art), undefined, voicePreferenceRef.current, bibleTrack(position, art)))) setPlayerOpen(true);
      } else if (kind === "bible-journey") {
        start(() => playJourneyStory(journeyOverview.bible.resumePeriod?.id ?? bibleJourney[0].id, JOURNEY_INTRO_INDEX, true));
        setPlayerOpen(true);
      } else if (kind === "rosary") {
        const mysteryIndex = todaysRosaryMysteryIndex();
        const sequence = buildRosarySequence(rosaryMode, mysteryIndex);
        rosarySegmentsRef.current = sequence.segments;
        rosaryClipsRef.current = sequence.clips;
        updateRosaryAudio(INITIAL_ROSARY_AUDIO);
        start(() => playRosaryClip(0, true, { mysteryIndex, mode: rosaryMode, path: todaysRosaryPath() }));
        setPlayerOpen(true);
      } else if (kind === "breviary") {
        const date = new Date();
        const hour = currentBreviaryHour(date);
        breviaryDayRef.current = assembleBreviary(date, hour, voicePreferenceRef.current);
        start(() => playBreviaryIntro(hour, date));
        setPlayerOpen(true);
      } else if (kind === "mass") {
        if (start(() => playMassReading(getTodaysMassReading()))) setPlayerOpen(true);
      } else if (kind === "saint") {
        const { featuredSaintForDate: getSaint, saintNarrationText } = await import("./data/saints");
        if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
        const saint = getSaint();
        if (!saint) throw new Error("No saint is listed for today.");
        if (start(() => startSpeaking(saintNarrationText(saint), saintNarrationAudioUrlsFor(saint.slug, voicePreferenceRef.current), undefined, undefined, voicePreferenceRef.current, { title: saint.name, path: `#/saints/${saint.slug}`, art: "saints" }))) setPlayerOpen(true);
      } else if (kind === "summa") {
        const data = await loadSummaData();
        if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
        const part = data.parts[0];
        const question = part && data.questions.filter((item) => item.part_id === part.id && item.articles.length).sort((a, b) => a.number - b.number)[0];
        if (!part || !question) throw new Error("The first Summa question is unavailable.");
        const item = summaQuestionItem(part, question, data.questions.find((item) => item.part_id === part.id && item.number > question.number && item.articles.length));
        if (start(() => startSpeaking(item.text, [], undefined, undefined, voicePreferenceRef.current, item.track))) setPlayerOpen(true);
      } else {
        const edition = catechismEditions[0];
        const group = edition?.groups.find((item) => item.questions.length > 0);
        const item = kind === "no-worry" ? noWorryItem(journeyOverview.noWorry.nextDay) : edition && group ? catechismItem(edition, group) : null;
        if (!item) throw new Error("This listening item is unavailable.");
        if (start(() => startSpeaking(item.text, [], undefined, undefined, voicePreferenceRef.current, item.track))) {
          if (item.track.sequence?.kind === "no-worry") markNoWorryDayPlayed(item.track.sequence.day);
          setPlayerOpen(true);
        }
      }
    } catch (error) {
      if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
      console.error("Could not start listening.", error);
      showNarrationError(error instanceof Error ? error.message : "Could not load this listening item.");
    } finally {
      if (listenRequestRef.current === request) setLoadingListen(null);
    }
  };
  const playHero = () => {
    setPlayerOpen(true);
    if (getNarrationSnapshot().status !== "playing") toggleActiveNarration();
  };
  const openActiveJourney = () => {
    void playListening(journeyOverview.bible.active ? "bible-journey" : "no-worry", false);
  };
  const openDailyRoutine = () => {
    const routines: Routine[] = ["breviary", "mass", "rosary", "saints"];
    const owned = routines.filter((routine) => hasEverDone(dailyStreak, routine));
    const routine = owned.length === 0
      ? routines[Math.floor(Math.random() * routines.length)]
      : owned.find((item) => !routineDoneToday(dailyStreak, item)) ?? owned[0];
    const kinds: Record<Routine, PlayKind> = { breviary: "breviary", mass: "mass", rosary: "rosary", saints: "saint" };
    void playListening(kinds[routine], false);
  };
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
        onNarrationEnded={() => advanceNarration(readingPosition)}
        narrationTrack={bibleTrack(readingPosition)}
        nextStep={recommendation("bible")}
      />
    ) : route === "bible" ? (
      <BibleBooksPage
        current={readingPosition}
        onResume={() => openReader(readingPosition)}
        onChoose={(position) => openReader(position)}
        nextStep={recommendation("bible")}
      />
    ) : route === "catechism" ? (
      <Suspense fallback={<main className="catechism-page section-wrap"><p className="eyebrow">Opening the Baltimore Catechism…</p></main>}><CatechismPage voicePreference={voicePreference} nextStep={recommendation("catechism")} /></Suspense>
    ) : route === "summa" ? (
      <Suspense fallback={<main className="catechism-page section-wrap"><p className="eyebrow">Opening the Summa Theologiae…</p></main>}><SummaPage voicePreference={voicePreference} nextStep={recommendation("summa")} /></Suspense>
    ) : route === "mass" ? (
      <MassReadingPage
        onOpenReference={openMassReference}
        selectedDate={massDate}
        onSelectedDateChange={setMassDate}
        voicePreference={voicePreference}
        nextStep={recommendation("mass")}
      />
    ) : route === "breviary" ? breviaryHour ? (
      <BreviaryPage
        hour={breviaryHour}
        day={breviaryDay}
        date={breviaryDate}
        onDateChange={setBreviaryDate}
        audioStatus={breviaryAudioForPage.status}
        activeSegmentIndex={breviaryAudioForPage.segmentIndex}
        audioError={breviaryAudioForPage.error}
        onToggleAudio={() => { const wasPlaying = breviaryAudioForPage.status === "playing"; toggleBreviaryAudio(); if (!wasPlaying) setPlayerOpen(true); }}
        onSelectSegment={(index) => { selectBreviarySegment(index); setPlayerOpen(true); }}
        onSkipIntro={skipBreviaryIntro}
        audioProgress={breviaryDesktopProgress}
        nextStep={recommendation("breviary")}
      />
    ) : (
      <BreviaryLibrary date={breviaryDate} onDateChange={setBreviaryDate} {...breviaryDayInfo(breviaryDate)} nextStep={recommendation("breviary")} />
    ) : route === "rosary-prayer" ? (
      <RosaryPrayerPage key={rosaryMysteryIndex} mysteryIndex={rosaryMysteryIndex} mode={rosaryMode} onModeChange={changeRosaryMode} audioStatus={rosaryAudioForPage.status} activeSegmentIndex={rosaryAudioForPage.segmentIndex} activePrayerGroupId={rosaryAudioForPage.status === "idle" ? null : rosaryClipsRef.current[rosaryAudioForPage.clipIndex]?.groupId ?? null} prayedBeadIndices={rosaryAudioForPage.prayedBeadIndices} activeBeadIndex={activeRosaryBeadIndex} audioError={rosaryAudioForPage.error} onToggleAudio={() => { const wasPlaying = rosaryAudioForPage.status === "playing"; toggleRosaryAudio(); if (!wasPlaying) setPlayerOpen(true); }} onSelectSegment={(index) => { selectRosarySegment(index); setPlayerOpen(true); }} audioProgress={rosaryDesktopProgress} nextStep={recommendation("rosary")} />
    ) : route === "saints" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening the saints catalogue…</p></main>}><SaintsLibrary onOpenToday={() => { window.location.hash = "#/saints/today"; }} nextStep={recommendation("saints")} /></Suspense>
    ) : route === "saint-profile" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening saint profile…</p></main>}><SaintPage slug={saintSlug} voicePreference={voicePreference} nextStep={recommendation("saints")} /></Suspense>
    ) : route === "rosary" ? (
      <RosaryLibrary nextStep={recommendation("rosary")} />
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
    ) : route === "guided-journey" ? (
      <NoWorryJourneyPage
        progress={guidedJourneyProgress}
        voicePreference={voicePreference}
        nextStep={recommendation("journey")}
        selectedDay={guidedJourneyDay}
        onSelectDay={(day) => {
          window.location.hash = day === null ? "#/journeys/no-worry" : `#/journeys/no-worry/${day}`;
        }}
        onStart={startGuidedJourney}
        onCompleteDay={() => {
          completeGuidedJourneyDay();
          window.location.hash = "#/journeys/no-worry";
        }}
      />
    ) : route === "journeys" ? (
      <JourneysPage
        guidedProgress={guidedJourneyProgress}
        bibleCompletedIds={journeyProgress.completedIds}
        lastVisitedPeriodId={lastJourneyPeriodId}
        onSelectJourney={(id) => {
          window.location.hash = id === "no-worry" ? "#/journeys/no-worry" : "#/journey";
        }}
        onContinueBibleJourney={resumeJourney}
        nextStep={recommendation("journey")}
      />
    ) : route === "listen" ? (
      <ListenPage narration={narration} onOpenPlayer={() => setPlayerOpen(true)} onPlayHero={playHero} loading={loadingListen} durations={{
        "old-testament": estimatedNarrationDuration(getChapter("genesis", 1).map((verse) => verse.text).join(" ")),
        "new-testament": estimatedNarrationDuration(getChapter("matthew", 1).map((verse) => verse.text).join(" ")),
        "gospels": estimatedNarrationDuration(getChapter("matthew", 1).map((verse) => verse.text).join(" ")),
        "bible-journey": estimatedNarrationDuration(journeyIntroText(bibleJourney[0].id)),
        "no-worry": estimatedNarrationDuration(noWorryItem(journeyOverview.noWorry.nextDay)?.text ?? ""),
        "catechism": estimatedNarrationDuration(catechismItem(catechismEditions[0], catechismEditions[0].groups.find((item) => item.questions.length > 0)!).text),
        "mass": estimatedNarrationDuration(Object.values(getTodaysMassReading().readings).map((reading) => reading.text).join("\n\n")),
        "rosary": estimatedNarrationDuration(buildRosarySequence(rosaryMode, todaysRosaryMysteryIndex()).clips.map((clip) => clip.spokenText).join(" ")),
        "breviary": estimatedNarrationDuration([breviaryIntroText(currentBreviaryHour()), ...assembleBreviary(new Date(), currentBreviaryHour(), voicePreference).segments.map((segment) => segment.text)].join(" ")),
      }} onPlay={(kind, autoplay = false) => { void playListening(kind, autoplay); }} />
    ) : route === "daily" ? (
      <DailyPage streak={dailyStreak} onOpenDaily={openDailyItem} />
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
        onToggleAudio={() => { const wasPlaying = journeyAudioForPage.status === "playing"; toggleJourneyAudio(); if (!wasPlaying) setPlayerOpen(true); }}
        onSelectAudioStory={(index) => { selectJourneyAudioStory(index); setPlayerOpen(true); }}
        onSkipIntro={skipJourneyIntro}
        audioProgress={journeyDesktopProgress}
        nextStep={recommendation("journey")}
        onOpenPassage={(bookId, chapter, verse) => openReader({ bookId, chapter }, verse)}
      />
    ) : (
      <BibleJourneyLibrary
        completedIds={journeyProgress.completedIds}
        storageError={journeyProgress.storageError}
        artworkSelections={journeyArtwork.selections}
        lastVisitedPeriodId={lastJourneyPeriodId}
        onResume={resumeJourney}
        nextStep={recommendation("journey")}
      />
    ) : route === "library" ? (
      <ReferencePage eyebrow="Component library" title={<>A practical<br /><em>design library.</em></>} copy="A reference for the components and patterns used across the template." />
    ) : route === "about" ? (
      <AboutPage />
    ) : (
      <HomePage
        narration={narration}
        onPlayHero={playHero}
        onPlayDaily={() => { void playListening("mass", false); }}
        onPlay={(kind, autoplay = false) => { void playListening(kind, autoplay); }}
        onResume={() => openReader()}
        onChoose={() => { window.location.hash = "#/bible"; }}
        onJourney={() => { window.location.hash = "#/journey"; }}
        onRosary={() => { window.location.hash = todaysRosaryPath(); }}
        onSaintToday={() => { window.location.hash = "#/saints/today"; }}
        onCatechism={() => { window.location.hash = "#/catechism"; }}
        onSumma={() => { window.location.hash = "#/summa"; }}
        onGuidedJourney={() => { window.location.hash = "#/journeys/no-worry"; }}
        onContinueBibleJourney={resumeJourney}
        onAllJourneys={() => { window.location.hash = "#/journeys"; }}
        onDaily={() => { window.location.hash = "#/daily"; }}
        streak={dailyStreak}
        guidedJourney={guidedJourneyProgress}
        bibleJourney={{
          completedIds: journeyProgress.completedIds,
          lastVisitedPeriodId: lastJourneyPeriodId,
        }}
        bible={{
          started: hasOpenedBible(),
          label: `${bibleBooks.find((book) => book.id === readingPosition.bookId)?.name ?? "Genesis"} ${readingPosition.chapter}`,
        }}
        onShare={shareApp}
        onOpenDaily={openDailyItem}
      />
    );
  return (
    <div className={route === "read" ? "app-shell app-shell--reader" : "app-shell"}>
      <header className="site-header" ref={menuRef}>
        <Brand />
        <nav
          id="primary-navigation"
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
          <a href="#/" className="mobile-drawer-link" aria-current={route === "home" ? "page" : undefined} onClick={() => setMenuOpen(false)}><House size={17} />Home</a>
          <a href="#/listen" className="mobile-drawer-link" aria-current={route === "listen" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Headphones size={17} />Listen</a>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Scripture &amp; growth</p>
            <a href="#/read" className="mobile-drawer-link" aria-current={route === "read" || route === "bible" ? "page" : undefined} onClick={() => setMenuOpen(false)}><BookOpen size={17} />Bible</a>
            <a href="#/journeys" className="mobile-drawer-link" aria-current={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Compass size={17} />Journeys</a>
            <a href="#/catechism" className="mobile-drawer-link" aria-current={route === "catechism" ? "page" : undefined} onClick={() => setMenuOpen(false)}><ScrollText size={17} />Catechism</a>
            <a href="#/summa" className="mobile-drawer-link" aria-current={route === "summa" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Landmark size={17} />Summa Theologiae</a>
          </div>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Prayer &amp; daily life</p>
            <a href="#/daily" className="mobile-drawer-link" aria-current={route === "daily" ? "page" : undefined} onClick={() => setMenuOpen(false)}><CalendarDays size={17} />Daily rhythm</a>
            <a href="#/breviary" className="mobile-drawer-link" aria-current={route === "breviary" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Sunrise size={17} />Breviary</a>
            <a href="#/rosary" className="mobile-drawer-link" aria-current={route === "rosary" || route === "rosary-prayer" ? "page" : undefined} onClick={() => setMenuOpen(false)}><RosaryMenuIcon />Rosary</a>
            <a href="#/saints" className="mobile-drawer-link" aria-current={route === "saints" || route === "saint-profile" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Sparkles size={17} />Saints</a>
            <a href="#/mass" className="mobile-drawer-link" aria-current={route === "mass" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Church size={17} />Mass Readings</a>
          </div>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Your library</p>
            <a href="#/bookmarks" className="mobile-drawer-link" aria-current={route === "bookmarks" ? "page" : undefined} onClick={() => setMenuOpen(false)}><BookmarkMenuIcon size={17} />Saved Passages</a>
            <a href="#/about" className="mobile-drawer-link" aria-current={route === "about" ? "page" : undefined} onClick={() => setMenuOpen(false)}><CircleHelp size={17} />About SoundFaith</a>
          </div>
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
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
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
      {narration.error && <div className="audio-error" role="alert">{narration.error}<button type="button" onClick={dismissNarrationError} aria-label="Dismiss audio error"><X size={16} /></button></div>}
      {playerOpen && narration.track && <AudioPlayer narration={narration} onClose={() => setPlayerOpen(false)} onToggle={toggleActiveNarration} onSelectEpisode={selectRosarySegment} onSkipIntro={playerIntroSkip} onPrevious={() => {
        const track = getNarrationSnapshot().track;
        if (track && isBibleArt(track.art)) {
          const query = new URLSearchParams(track.path.split("?")[1] ?? "");
          const bookId = query.get("book");
          const chapter = Number(query.get("chapter"));
          if (bookId && bibleBooks.some((book) => book.id === bookId) && chapter > 1) advanceNarration({ bookId, chapter: chapter - 1 }, track.art);
        } else if (track?.art === "readings") {
          stepMassReading(track.path, -1);
        } else if (track?.sequence?.kind === "no-worry" || track?.sequence?.kind === "catechism") {
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
          if (bookId && bibleBooks.some((book) => book.id === bookId) && Number.isInteger(chapter) && chapter > 0 && chapter <= getChapterCount(bookId)) advanceNarration({ bookId, chapter }, track.art);
        } else if (track?.art === "bible-journey" && journeyAudioStateRef.current.periodId) {
          advanceJourneyAudio();
        } else if (track?.sequence?.kind === "rosary") {
          playRosaryClip(rosaryAudioStateRef.current.clipIndex + 1);
        } else if (track?.sequence?.kind === "breviary") {
          playBreviarySegment(breviaryAudioStateRef.current.segmentIndex + 1);
        } else if (track?.sequence?.kind === "no-worry" || track?.sequence?.kind === "catechism" || track?.sequence?.kind === "summa") {
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
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <a href="#/" className={route === "home" ? "active" : ""} aria-current={route === "home" ? "page" : undefined} onClick={() => setPlayerOpen(false)}>
          <Home size={17} />
          <span>Home</span>
        </a>
        <a
          href="#/listen"
          className={route === "listen" ? "active" : ""}
          aria-current={route === "listen" ? "page" : undefined}
          onClick={() => setPlayerOpen(false)}
        >
          <Library size={17} />
          <span>Browse</span>
        </a>
        <NavPlayer
          narration={narration}
          playerOpen={playerOpen}
          onToggle={toggleActiveNarration}
          onOpen={() => setPlayerOpen(true)}
          onListen={() => {
            setPlayerOpen(false);
            window.location.hash = "#/listen";
          }}
        />
        <a href="#/journeys" onClick={(event) => { event.preventDefault(); setPlayerOpen(false); openActiveJourney(); }} className={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "mobile-listen active" : "mobile-listen"} aria-current={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "page" : undefined}>
          <Compass size={17} />
          <span>Journeys</span>
        </a>
        <a href="#/daily" onClick={(event) => { event.preventDefault(); setPlayerOpen(false); openDailyRoutine(); }} className={route === "daily" || route === "breviary" || route === "mass" || route === "rosary" || route === "rosary-prayer" || route === "saints" || route === "saint-profile" ? "active" : ""} aria-current={route === "daily" ? "page" : undefined}>
          <CalendarDays size={17} />
          <span>Daily</span>
        </a>
      </nav>
      <footer className="site-footer">
        <section className="footer-contact" aria-labelledby="footer-contact-title">
          <div className="footer-contact-copy">
            <h2 id="footer-contact-title">Questions, feedback, or ideas?</h2>
            <p>We'd love to hear from you.</p>
            <a href="mailto:soundfaith.core@gmail.com">soundfaith.core@gmail.com</a>
          </div>
          <div className="footer-contact-actions">
            <a href="mailto:soundfaith.core@gmail.com">Contact Us</a>
            <a href="mailto:soundfaith.core@gmail.com">Send Feedback</a>
          </div>
        </section>
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
