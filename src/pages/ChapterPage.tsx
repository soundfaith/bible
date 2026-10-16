import { ArrowLeft, ArrowRight, BookOpen, Bookmark, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bibleBooks, getBook, getChapter, getChapterCount, getParagraphs, type BibleBookSummary } from "../lib/bible";
import { NarrationProgress, NarratorButton } from "../components/NarratorButton";
import { narrationAudioUrlsFor } from "../lib/narrationAudio";
import type { NarrationGender } from "../lib/narrationVoice";

const READING_KEY = "bible-last-reading";
export type ReadingPosition = { bookId: string; chapter: number };
export type SelectedVerseRange = { verseStart: number; verseEnd: number };

export function hasOpenedBible() {
  try {
    return window.localStorage.getItem(READING_KEY) !== null;
  } catch {
    return false;
  }
}

export function getLastReading(): ReadingPosition {
  try {
    const saved = JSON.parse(window.localStorage.getItem(READING_KEY) || "null") as ReadingPosition | null;
    if (saved && getBook(saved.bookId) && saved.chapter > 0) return saved;
  } catch { /* use the opening chapter */ }
  return { bookId: "genesis", chapter: 1 };
}

export function ChapterPage({ position, voicePreference, onPositionChange, onSelectChapter, highlightVerse, isBookmarked, isChapterBookmarked, onToggleBookmark, onNarrationEnded }: { position: ReadingPosition; voicePreference: NarrationGender; onPositionChange: (position: ReadingPosition) => void; onSelectChapter: () => void; highlightVerse?: number | null; isBookmarked: boolean; isChapterBookmarked: boolean; onToggleBookmark: (range?: SelectedVerseRange) => void; onNarrationEnded: () => void }) {
  const touchStart = useRef<number | null>(null);
  const readingCopyRef = useRef<HTMLDivElement | null>(null);
  const [selectedVerseRange, setSelectedVerseRange] = useState<(SelectedVerseRange & { top: number; left: number }) | null>(null);
  const book = getBook(position.bookId);
  const verses = getChapter(position.bookId, position.chapter);
  const paragraphs = getParagraphs(verses);
  const narrationText = verses.map((verse) => verse.text).join(" ");
  const narrationAudioUrls = narrationAudioUrlsFor(position.bookId, position.chapter, voicePreference);
  const bookIndex = bibleBooks.findIndex((item) => item.id === position.bookId);
  const isFirst = bookIndex === 0 && position.chapter === 1;
  const isLast = bookIndex === bibleBooks.length - 1 && position.chapter === getChapterCount(position.bookId);

  useEffect(() => { window.localStorage.setItem(READING_KEY, JSON.stringify(position)); }, [position]);
  useEffect(() => {
    if (!highlightVerse) return;
    readingCopyRef.current?.querySelector(`[data-verse="${highlightVerse}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightVerse, position.bookId, position.chapter]);
  useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();
      const copy = readingCopyRef.current;
      if (!selection || selection.isCollapsed || !copy || !selection.rangeCount) { setSelectedVerseRange(null); return; }
      const range = selection.getRangeAt(0);
      if (!copy.contains(range.startContainer) || !copy.contains(range.endContainer)) { setSelectedVerseRange(null); return; }
      const verseFor = (node: Node) => {
        const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
        const value = element?.closest<HTMLElement>("[data-verse]")?.dataset.verse;
        return value ? Number(value) : null;
      };
      const start = verseFor(range.startContainer);
      const end = verseFor(range.endContainer);
      if (!start || !end) { setSelectedVerseRange(null); return; }
      const rect = range.getBoundingClientRect();
      setSelectedVerseRange({ verseStart: Math.min(start, end), verseEnd: Math.max(start, end), top: Math.max(8, rect.top - 48), left: Math.min(Math.max(12, rect.left + rect.width / 2 - 58), window.innerWidth - 128) });
    };
    document.addEventListener("selectionchange", updateSelection);
    window.addEventListener("scroll", updateSelection, true);
    return () => { document.removeEventListener("selectionchange", updateSelection); window.removeEventListener("scroll", updateSelection, true); };
  }, [position.bookId, position.chapter]);
  const move = (direction: -1 | 1) => {
    if ((direction === -1 && isFirst) || (direction === 1 && isLast)) return;
    if (direction === -1 && position.chapter > 1) return onPositionChange({ ...position, chapter: position.chapter - 1 });
    if (direction === 1 && position.chapter < getChapterCount(position.bookId)) return onPositionChange({ ...position, chapter: position.chapter + 1 });
    const nextBook = bibleBooks[bookIndex + direction];
    if (nextBook) onPositionChange({ bookId: nextBook.id, chapter: direction === -1 ? getChapterCount(nextBook.id) : 1 });
  };

  return <main className="journey-page journey-detail-page bible-chapter-page section-wrap" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (!window.getSelection()?.toString() && Math.abs(distance) > 55) move(distance > 0 ? -1 : 1); touchStart.current = null; }}>
    <nav className="journey-detail-nav" aria-label="Chapter actions">
      <a className="button button-outline" href="#/bible"><ArrowLeft size={16} /> Bible books</a>
      <div className="detail-nav-actions">
        <button className={isBookmarked ? "icon-button bible-bookmark-button active" : "icon-button bible-bookmark-button"} onClick={() => onToggleBookmark()} aria-label={isChapterBookmarked ? "Remove chapter bookmark" : "Bookmark chapter"}><Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} /></button>
      </div>
    </nav>
    <header className="journey-detail-heading">
      <p className="eyebrow"><span className="eyebrow-dot" /> Soundfaith Bible <span aria-hidden="true">/</span> Chapter {position.chapter} of {getChapterCount(position.bookId)}</p>
      <h1>{book.name} <em>{position.chapter}</em></h1>
      <div className="journey-audio-controls"><NarratorButton text={narrationText} audioUrls={narrationAudioUrls} voicePreference={voicePreference} onEnded={onNarrationEnded} /></div>
    </header>
    <NarrationProgress className="narration-progress-desktop narration-progress-centered" enabled={narrationAudioUrls.length > 0} />
    <article className="bible-reading-panel"><div className="bible-reading-copy" ref={readingCopyRef}>{paragraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.verses.map((verse) => <span key={verse.verse} data-verse={verse.verse} className={highlightVerse === verse.verse ? "verse-highlight" : ""}><sup>{verse.verse}</sup>{verse.text} </span>)}</p>)}</div></article>
    {selectedVerseRange && <button className="verse-bookmark-float" style={{ top: selectedVerseRange.top, left: selectedVerseRange.left }} onMouseDown={(event) => event.preventDefault()} onClick={() => { onToggleBookmark({ verseStart: selectedVerseRange.verseStart, verseEnd: selectedVerseRange.verseEnd }); setSelectedVerseRange(null); }}><Bookmark size={14} /> Save verses</button>}
    <nav className="bible-chapter-nav" aria-label="Chapter navigation"><button className="button button-outline" disabled={isFirst} onClick={() => move(-1)}><ArrowLeft size={15} /> Previous</button><button className="button button-coral" onClick={onSelectChapter}><BookOpen size={15} /> Choose chapter</button><button className="button button-outline" disabled={isLast} onClick={() => move(1)}>Next <ArrowRight size={15} /></button></nav>
  </main>;
}

export function ChapterPicker({ current, onChoose }: { current: ReadingPosition; onChoose: (position: ReadingPosition) => void }) {
  const [bookId, setBookId] = useState(current.bookId);
  const [chapter, setChapter] = useState(current.chapter);
  const [query, setQuery] = useState("");
  const visibleBooks = bibleBooks.filter((book) => `${book.name} ${book.abbreviation}`.toLowerCase().includes(query.toLowerCase()));
  const chapters = Array.from({ length: getChapterCount(bookId) }, (_, index) => index + 1);

  return <div className="bible-picker">
    <p className="eyebrow">Choose a passage</p>
    <h2>Find a place <em>to begin.</em></h2>
    <label className="picker-search">Search books<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by book name" /></label>
    <div className="picker-pills">{visibleBooks.map((book: BibleBookSummary) => <button key={book.id} className={book.id === bookId ? "picker-pill active" : "picker-pill"} onClick={() => { setBookId(book.id); setChapter(1); }}>{book.name}</button>)}</div>
    <p className="picker-label">Chapter</p>
    <div className="chapter-pills">{chapters.map((number) => <button key={number} className={number === chapter ? "picker-pill active" : "picker-pill"} onClick={() => { setChapter(number); onChoose({ bookId, chapter: number }); }}>{number}</button>)}</div>
  </div>;
}
