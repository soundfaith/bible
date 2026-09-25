import { ArrowRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { bibleBooks, getBook, type BibleBookSummary, type BibleVerse } from "../lib/bible";
import { referenceLabel, resolveReference } from "../lib/readings";
import topicVerses from "../data/topic-verses.json";

export type SearchResult = { bookId: string; chapter: number; verse: number; label: string; text: string };

const promptIdeas = [
  { label: "Are you struggling with prayer?", value: "prayer" },
  { label: "Do you need peace today?", value: "peace" },
  { label: "Looking for hope?", value: "hope" },
  { label: "What about strength for this week?", value: "strength" },
  { label: "Need wisdom for an important decision?", value: "wisdom" },
  { label: "How are you feeling today?", value: "comfort" }
];

function referenceResult(reference: string): SearchResult | null {
  const normalized = reference.trim();
  const verses = resolveReference(normalized);
  const first = verses[0];
  const bookName = normalized.split(/\s+\d+:/)[0];
  const chapter = first?.chapter;

  return first && chapter ? {
    bookId: bibleBooks.find((book) => book.name.toLowerCase() === bookName.toLowerCase() || (bookName.toLowerCase() === "psalm" && book.id === "psalms"))?.id || "",
    chapter,
    verse: first.verse,
    label: referenceLabel(normalized),
    text: first.text
  } : null;
}

function textResults(query: string) {
  const lower = query.toLowerCase();
  return bibleBooks.flatMap((book: BibleBookSummary) => getBook(book.id).verses.filter((verse: BibleVerse) => verse.text.toLowerCase().includes(lower)).slice(0, 4).map((verse) => ({
    bookId: book.id,
    chapter: verse.chapter,
    verse: verse.verse,
    label: `${book.name} ${verse.chapter}:${verse.verse}`,
    text: verse.text
  }))).slice(0, 18);
}

function curatedTopicResults(query: string): SearchResult[] {
  const topic = Object.keys(topicVerses).find((label) => label.toLowerCase() === query.trim().toLowerCase());
  if (!topic) return [];

  return topicVerses[topic as keyof typeof topicVerses].flatMap((reference) => {
    const verse = resolveReference(reference)[0];
    const bookName = reference.split(/\s+\d+:/)[0];
    const book = bibleBooks.find((item) => item.name.toLowerCase() === bookName.toLowerCase() || (bookName.toLowerCase() === "psalm" && item.id === "psalms"));
    return verse && book ? [{ bookId: book.id, chapter: verse.chapter, verse: verse.verse, label: referenceLabel(reference), text: verse.text }] : [];
  });
}

export function SearchModal({ onChoose, close }: { onChoose: (result: SearchResult) => void; close: () => void }) {
  const [query, setQuery] = useState("");
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  const results: SearchResult[] = query.trim()
     ? (referenceResult(query.trim()) ? [referenceResult(query.trim()) as SearchResult] : curatedTopicResults(query.trim()).length > 0 ? curatedTopicResults(query.trim()) : textResults(query))
    : [];

  return <div className="search-modal" onTouchStart={(event) => { if (window.innerWidth <= 760) touchStartY.current = event.touches[0].clientY; }} onTouchMove={(event) => { if (window.innerWidth <= 760 && touchStartY.current !== null) touchCurrentY.current = event.touches[0].clientY; }} onTouchEnd={() => { if (window.innerWidth <= 760 && touchStartY.current !== null && touchCurrentY.current !== null) {
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 90) close();
  }
  touchStartY.current = null;
  touchCurrentY.current = null; }}>
    <div className="search-modal-top">
      <div>
        <p className="eyebrow">Explore the Bible</p>
        <h2>Find a word <em>for this moment.</em></h2>
      </div>
      <button className="modal-close" onClick={close} aria-label="Close search"><X size={18} /></button>
    </div>

    <label className="picker-search">
      Search the Bible
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by word, topic, or reference" />
    </label>

    <div className="prompt-grid">
      {promptIdeas.map((prompt) => <button key={prompt.value} className="prompt-chip" onClick={() => setQuery(prompt.value)}>{prompt.label}</button>)}
    </div>

    {results.length > 0 && <div className="search-results">{results.map((result) => <button className="search-result" key={`${result.bookId}-${result.chapter}-${result.verse}`} onClick={() => { onChoose(result); close(); }}><span><strong>{result.label}</strong><small>{result.text}</small></span><ArrowRight size={15} /></button>)}</div>}

    {!query.trim() && <p className="search-empty">Try a prompt above or search for a book, chapter, verse, or the words you need today.</p>}
    {query.trim() && !results.length && <p className="search-empty">No passages found yet. Try a different word, verse reference, or topic.</p>}
  </div>;
}