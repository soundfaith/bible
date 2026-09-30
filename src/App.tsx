import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Home,
  Headphones,
  LibraryBig,
  Pause,
  Play,
  Menu,
  Search,
  Share2,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "./components/Brand";
import { BibleMark } from "./components/BibleMark";
import { ModalLayer, type Modal } from "./components/ModalLayer";
import { SearchModal, type SearchResult } from "./components/SearchModal";
import { HomePage } from "./pages/HomePage";
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
import { bibleBooks, getChapter } from "./lib/bible";
import { getMassReadingForDate, getTodaysMassReading, resolveReference } from "./lib/readings";
import { getBookmarkCategories, getBookmarks, isVerseBookmark, saveBookmarkCategories, saveBookmarks, type Bookmark } from "./lib/bookmarks";
import {
  getNarrationSnapshot,
  pauseSpeaking,
  startSpeaking,
  stopSpeaking,
  subscribeNarration,
} from "./components/NarratorButton";

type Route = "home" | "read" | "mass" | "bookmarks" | "library" | "about";
function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return path === "read" || path === "mass" || path === "bookmarks" || path === "library" || path === "about"
    ? path
    : "home";
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.localStorage.getItem("template-theme") === "dark" ? "dark" : "light",
  );
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(getLastReading);
  const [massDate, setMassDate] = useState(() => getTodaysMassReading().date);
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [pendingNarration, setPendingNarration] = useState(false);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
  const [bookmarkCategories, setBookmarkCategories] = useState<string[]>(getBookmarkCategories);
  const menuRef = useRef<HTMLElement | null>(null);
  const searchSheetStartY = useRef<number | null>(null);
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("template-theme", theme);
  }, [theme]);
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
    startSpeaking(
      getChapter(readingPosition.bookId, readingPosition.chapter)
        .map((verse) => verse.text)
        .join(" "),
    );
    setPendingNarration(false);
  }, [pendingNarration, readingPosition, route]);
  useEffect(() => () => stopSpeaking(), [route, readingPosition]);
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
  const currentNarration = () =>
    route === "read"
      ? getChapter(readingPosition.bookId, readingPosition.chapter)
          .map((verse) => verse.text)
          .join(" ")
      : Object.values((getMassReadingForDate(massDate) || getTodaysMassReading()).readings)
          .map((reading) => reading.text)
          .join("\n\n");
  const startNarration = () => {
    const current = getNarrationSnapshot();
    if (current.status === "playing") {
      pauseSpeaking();
      return;
    }
    if (route === "home") {
      setPendingNarration(true);
      openReader();
    } else startSpeaking(currentNarration());
  };
  useEffect(() => {
    const listenButton = document.querySelector(".mobile-listen");
    if (!listenButton) return;
    const handleListen = (event: Event) => {
      event.preventDefault();
      startNarration();
    };
    listenButton.addEventListener("click", handleListen);
    return () => listenButton.removeEventListener("click", handleListen);
  }, [route, readingPosition, narration]);
  const openPicker = () =>
    setModal({
      type: "chapter",
      current: readingPosition,
      onChoose: (position) => openReader(position),
    });
  const openSearch = () =>
    setModal({
      type: "search",
      onChoose: (result) =>
        openReader(
          { bookId: result.bookId, chapter: result.chapter },
          result.verse,
        ),
    });
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
        onSelectChapter={openPicker}
        highlightVerse={highlightVerse}
        isBookmarked={isBookmarked}
        isChapterBookmarked={isChapterBookmarked}
        onToggleBookmark={toggleBookmark}
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
    ) : route === "library" ? (
      <ReferencePage eyebrow="Component library" title={<>A practical<br /><em>design library.</em></>} copy="A reference for the components and patterns used across the template." />
    ) : route === "about" ? (
      <AboutPage />
    ) : (
      <HomePage
        lastReading={readingPosition}
        onResume={() => openReader()}
        onChoose={openPicker}
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
        <nav
          className={menuOpen ? "main-nav nav-open" : "main-nav"}
          aria-label="Primary navigation"
        >
          <div className="menu-heading">
            <strong>Menu</strong>
            <button
              className="icon-button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <a href="#/">Home</a>
          <a href="#/read">Read Scripture</a>
          <a href="#/mass">Daily Mass</a>
          <a href="#/bookmarks">Saved passages</a>
          <a href="#/about">About</a>
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
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
          />
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
        <a href="#/" className={route === "home" ? "active" : ""}>
          <Home size={17} />
          <span>Home</span>
        </a>
        <button className={route === "read" ? "active" : ""} onClick={openPicker}>
          <LibraryBig size={17} />
          <span>Books</span>
        </button>
        <a href="#/read" className="mobile-donate">
          <BookOpen size={20} />
          <span>Resume</span>
        </a>
        <button onClick={openSearch}>
          <Search size={17} />
          <span>Explore</span>
        </button>
        <a href="#/" className="mobile-listen">
          <Headphones size={17} />
          <span>Listen</span>
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
            className="modal search-modal-shell"
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
