import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bookmark as BookmarkMenuIcon,
  CalendarDays,
  House,
  CircleHelp,
  Home,
  Headphones,
  Milestone,
  Pause,
  Play,
  Menu,
  Minus,
  Plus,
  Search,
  Share2,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "./components/Brand";
import { BibleMark } from "./components/BibleMark";
import { ModalLayer, type Modal } from "./components/ModalLayer";
import { SearchModal, type SearchResult } from "./components/SearchModal";
import { HomePage } from "./pages/HomePage";
import { BibleJourneyLibrary, BibleJourneyPage } from "./pages/BibleJourneyPage";
import { JourneyArtworkPage } from "./pages/JourneyArtworkPage";
import { BibleBooksPage } from "./pages/BibleBooksPage";
import { AboutPage } from "./pages/AboutPage";
import {
  ChapterPage,
  getLastReading,
  type ReadingPosition,
  type SelectedVerseRange,
} from "./pages/ChapterPage";
import { MassReadingPage } from "./pages/MassReadingPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ReferencePage } from "./pages/ReferencePage";
import { bibleBooks, getChapter, getChapterCount } from "./lib/bible";
import { bibleJourney } from "./data/bibleJourney";
import { resolveJourneyPeriodId, loadJourneyArtworkSelections, saveJourneyArtworkSelections } from "./data/journeyArtwork";
import { loadJourneyProgress, saveJourneyProgress } from "./lib/journeyProgress";
import { narrationAudioUrlsFor } from "./lib/narrationAudio";
import { getMassReadingForDate, getTodaysMassReading, resolveReference } from "./lib/readings";
import { getBookmarkCategories, getBookmarks, isVerseBookmark, saveBookmarkCategories, saveBookmarks, type Bookmark } from "./lib/bookmarks";
import {
  getNarrationSnapshot,
  NarrationProgress,
  pauseSpeaking,
  resumeSpeaking,
  startSpeaking,
  stopSpeaking,
  subscribeNarration,
} from "./components/NarratorButton";

type Route = "home" | "read" | "bible" | "mass" | "bookmarks" | "library" | "about" | "journey" | "journey-artwork";
type PendingNarration = "start" | "pause" | "resume" | null;
const LAST_JOURNEY_PERIOD_KEY = "soundfaith-bible-journey-last-period-v1";

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
    : path.startsWith("journey/") ? "journey"
    : path === "read" || path === "bible" || path === "mass" || path === "bookmarks" || path === "library" || path === "about" || path === "journey"
      ? path
    : "home";
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

function readJourneyStoryAnchor() {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("story");
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
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
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(getLastReading);
  const [massDate, setMassDate] = useState(() => getTodaysMassReading().date);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [pendingNarration, setPendingNarration] = useState<PendingNarration>(null);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
  const [bookmarkCategories, setBookmarkCategories] = useState<string[]>(getBookmarkCategories);
  const [journeyProgress, setJourneyProgress] = useState(loadJourneyProgress);
  const [journeyArtwork, setJourneyArtwork] = useState(loadJourneyArtworkSelections);
  const menuRef = useRef<HTMLElement | null>(null);
  const searchSheetStartY = useRef<number | null>(null);
  const preserveNarrationOnNavigation = useRef(false);
  const advanceNarration = () => {
    if (route !== "read") return;
    if (readingPosition.chapter >= getChapterCount(readingPosition.bookId)) {
      stopSpeaking();
      return;
    }
    setReadingPosition({ ...readingPosition, chapter: readingPosition.chapter + 1 });
    setPendingNarration("start");
  };
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
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
    const audioUrls = narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter);
    const text = getChapter(readingPosition.bookId, readingPosition.chapter)
      .map((verse) => verse.text)
      .join(" ");
    if (pendingNarration === "pause") pauseSpeaking();
    else if (pendingNarration === "resume") resumeSpeaking(text, audioUrls[0], audioUrls[1], advanceNarration);
    else startSpeaking(text, audioUrls[0], audioUrls[1], advanceNarration);
    setPendingNarration(null);
  }, [pendingNarration, readingPosition, route]);
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
  const shareApp = async () => {
    const shareData = {
      title: "Soundfaith Bible",
      text: "A quiet place to return to the Scriptures.",
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard?.writeText(window.location.href);
    }
  };
  const chapterNarration = (position: ReadingPosition) => getChapter(position.bookId, position.chapter)
    .map((verse) => verse.text)
    .join(" ");
  const narrationForCurrentPage = (): { text: string; audioUrls: string[]; onEnded?: () => void } | null => {
    if (route === "read") {
      const audioUrls = narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter);
      return { text: chapterNarration(readingPosition), audioUrls, onEnded: advanceNarration };
    }
    if (route === "mass") {
      const entry = getMassReadingForDate(massDate) || getTodaysMassReading();
      return {
        text: Object.values(entry.readings).map((reading) => reading.text).join("\n\n"),
        audioUrls: [] as string[],
      };
    }
    if (route === "journey" && journeyPeriodId) {
      const period = bibleJourney.find((item) => item.id === journeyPeriodId);
      if (period) {
        return {
          text: period.stories.map((story) => [
            story.title,
            ...story.references.map((reference) => resolveReference(reference).map((verse) => verse.text).join(" ")),
          ].filter(Boolean).join(". ")).join("\n\n"),
          audioUrls: [] as string[],
        };
      }
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
          resumeSpeaking(narrationForPage.text);
        } else startSpeaking(narrationForPage.text);
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
    const [audioUrl, fallbackAudioUrl] = narrationForPage.audioUrls;
    if (current.text === narrationForPage.text && current.status === "playing") pauseSpeaking();
    else if (current.text === narrationForPage.text && current.status === "paused") {
      resumeSpeaking(narrationForPage.text, audioUrl, fallbackAudioUrl, narrationForPage.onEnded);
    } else startSpeaking(narrationForPage.text, audioUrl, fallbackAudioUrl, narrationForPage.onEnded);
  };
  const resumeJourney = () => {
    const periodId = lastJourneyPeriodId ?? bibleJourney[0].id;
    window.location.hash = `#/journey/${periodId}`;
  };
  const openTodaysReading = () => {
    setMassDate(getTodaysMassReading().date);
    window.location.hash = "#/mass";
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
  const openSearch = () => {
    setSearchInteracted(false);
    setModal({
      type: "search",
      onChoose: (result) =>
        openReader(
          { bookId: result.bookId, chapter: result.chapter },
          result.verse,
        ),
    });
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
  const page =
    route === "read" ? (
      <ChapterPage
        position={readingPosition}
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
      <MassReadingPage onOpenReference={openMassReference} selectedDate={massDate} onSelectedDateChange={setMassDate} />
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
        onToggleComplete={toggleJourneyPeriod}
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
        lastReading={readingPosition}
        onResume={() => openReader()}
        onChoose={() => { window.location.hash = "#/bible"; }}
        onJourney={() => { window.location.hash = "#/journey"; }}
        onMass={() => {
          setMassDate(getTodaysMassReading().date);
          window.location.hash = "#/mass";
        }}
        onExplore={openSearch}
      />
    );
  return (
    <div className="app-shell">
      <header className="site-header" ref={menuRef}>
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#/" className={route === "home" ? "active" : ""}>Home</a>
          <a href="#/bible" className={route === "read" || route === "bible" ? "active" : ""}>Bible</a>
          <a href="#/mass" className={route === "mass" ? "active" : ""}>Daily Mass</a>
          <a href="#/journey" className={route === "journey" || route === "journey-artwork" ? "active" : ""}>Bible Journey</a>
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
          <a href="#/read" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><BookOpen size={17} />Read Scripture</a>
          <a href="#/bible" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><BookOpen size={17} />Bible books</a>
          <a href="#/mass" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><CalendarDays size={17} />Daily Mass</a>
          <a href="#/journey" className="mobile-drawer-link" aria-current={route === "journey" || route === "journey-artwork" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Milestone size={17} />Bible Journey</a>
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
          <div className="mobile-menu-theme">
            <span>Theme</span>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
            />
          </div>
        </nav>
        <div className="header-actions">
          <button className="icon-button header-search-button" aria-label="Explore Scripture" onClick={openSearch}>
            <Search size={18} />
          </button>
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
        {route === "read" && <NarrationProgress className="narration-progress-mobile" enabled={narrationAudioUrlsFor(readingPosition.bookId, readingPosition.chapter).length > 0} />}
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
          onClick={toggleNarration}
          aria-label={narration.status === "playing" ? "Pause narration" : narration.status === "paused" ? "Resume narration" : "Listen to this reading"}
        >
          {narration.status === "playing" ? <><span className="audio-equalizer" aria-hidden="true"><i /><i /><i /><i /></span><span>Listen</span></> : narration.status === "paused" ? <><Play size={17} /><span>Listen</span></> : <><Headphones size={19} /><span>Listen</span></>}
        </button>
        <a href="#/journey" className={route === "journey" || route === "journey-artwork" ? "mobile-listen active" : "mobile-listen"} aria-current={route === "journey" || route === "journey-artwork" ? "page" : undefined}>
          <Milestone size={17} />
          <span>Journey</span>
        </a>
        <a href="#/mass" className={route === "mass" ? "active" : ""} aria-current={route === "mass" ? "page" : undefined} onClick={openTodaysReading}>
          <CalendarDays size={17} />
          <span>Reading</span>
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
    </div>
  );
}
