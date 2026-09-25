import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Home,
  Pause,
  Play,
  Menu,
  Search,
  Share2,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "./components/Brand";
import { ModalLayer, type Modal } from "./components/ModalLayer";
import { SearchModal, type SearchResult } from "./components/SearchModal";
import { HomePage } from "./pages/HomePage";
import {
  ChapterPage,
  getLastReading,
  type ReadingPosition,
} from "./pages/ChapterPage";
import { MassReadingPage } from "./pages/MassReadingPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { bibleBooks, getChapter } from "./lib/bible";
import { getTodaysMassReading, resolveReference } from "./lib/readings";
import { getBookmarks, saveBookmarks, type Bookmark } from "./lib/bookmarks";
import {
  getNarrationSnapshot,
  pauseSpeaking,
  startSpeaking,
  stopSpeaking,
  subscribeNarration,
} from "./components/NarratorButton";

type Route = "home" | "read" | "mass" | "bookmarks";
function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return path === "read" || path === "mass" || path === "bookmarks"
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
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);
  const [pendingNarration, setPendingNarration] = useState(false);
  const [narration, setNarration] = useState(getNarrationSnapshot);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getBookmarks);
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
  const isBookmarked =
    route === "read" &&
    bookmarks.some(
      (bookmark) =>
        bookmark.bookId === readingPosition.bookId &&
        bookmark.chapter === readingPosition.chapter,
    );
  const toggleBookmark = () => {
    setBookmarks((current) =>
      isBookmarked
        ? current.filter(
            (bookmark) =>
              bookmark.bookId !== readingPosition.bookId ||
              bookmark.chapter !== readingPosition.chapter,
          )
        : [{ ...readingPosition, createdAt: Date.now() }, ...current],
    );
  };
  const removeBookmark = (bookmark: Bookmark) =>
    setBookmarks((current) =>
      current.filter(
        (item) =>
          item.bookId !== bookmark.bookId || item.chapter !== bookmark.chapter,
      ),
    );
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
      : Object.values(getTodaysMassReading().readings)
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
    const listenButton = document.querySelector(".mobile-about");
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
        onToggleBookmark={toggleBookmark}
      />
    ) : route === "mass" ? (
      <MassReadingPage onOpenReference={openMassReference} />
    ) : route === "bookmarks" ? (
      <BookmarksPage
        bookmarks={bookmarks}
        onOpen={(bookmark) => openReader(bookmark)}
        onRemove={removeBookmark}
      />
    ) : (
      <HomePage
        lastReading={readingPosition}
        onResume={() => openReader()}
        onChoose={openPicker}
        onMass={() => {
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
          <a href="#/read">Read</a>
          <a href="#/mass">Mass reading</a>
          <a href="#/bookmarks">Bookmarks</a>
          <button className="nav-text-button" onClick={openSearch}>
            Explore
          </button>
          <div className="mobile-menu-theme">
            <span>Appearance</span>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
            />
          </div>
        </nav>
        <div className="header-actions">
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
        <a href="#/mass" className={route === "mass" ? "active" : ""}>
          <CalendarDays size={17} />
          <span>Mass</span>
        </a>
        <a href="#/read" className="mobile-donate">
          <BookOpen size={20} />
          <span>Resume</span>
        </a>
        <button onClick={openSearch}>
          <Search size={17} />
          <span>Explore</span>
        </button>
        <a href="#/" className="mobile-about">
          <Info size={17} />
          <span>About</span>
        </a>
      </nav>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="wordmark-mark">sf</span>
          <span>Soundfaith Bible</span>
        </div>
        <div className="footer-bottom">
          <span>© 2026</span>
          <span className="footer-status">
            <i /> Always free
          </span>
          <span>Take your time</span>
          <button className="footer-share" onClick={shareApp}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </footer>
      {modal?.type === "chapter" && (
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
