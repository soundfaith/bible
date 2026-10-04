import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bibleBooks, getBook } from "../lib/bible";
import { referenceLabel, resolveReference } from "../lib/readings";
import topicVerses from "../data/topic-verses.json";
import topics from "../data/topics.json";

export type SearchResult = { bookId: string; chapter: number; verse: number; label: string; text: string };

const topicGroups = topics as Record<string, string[]>;
const initialTopicPool = [...topicGroups.Virtues, ...topicGroups["Emotions & Life Situations"]];

function randomTopics() {
  return [...initialTopicPool].sort(() => Math.random() - 0.5).slice(0, 5);
}

function referenceResults(reference: string): SearchResult[] {
  const normalized = reference.trim();
  const partial = normalized.match(/^(.+?)(?:\s+(\d+))?(?:\s*:\s*(\d+(?:-\d+)?))?$/);
  if (!partial) return [];
  const enteredBook = partial[1].trim().toLowerCase();
  const book = bibleBooks.find((item) => item.name.toLowerCase() === enteredBook || item.id === enteredBook.replace(/\s+/g, "_") || item.name.toLowerCase().startsWith(enteredBook));
  if (!book) return [];
  const chapter = partial[2] ? Number(partial[2]) : undefined;
  const verses = partial[3] && chapter
    ? resolveReference(`${book.name} ${chapter}:${partial[3]}`)
    : chapter
      ? getBook(book.id).verses.filter((verse) => verse.chapter === chapter)
      : getBook(book.id).verses;
  return verses.slice(0, 18).map((verse) => ({
    bookId: book.id,
    chapter: verse.chapter,
    verse: verse.verse,
    label: `${book.name} ${verse.chapter}:${verse.verse}`,
    text: verse.text
  }));
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

export function SearchModal({ onChoose, close, onInteraction }: { onChoose: (result: SearchResult) => void; close: () => void; onInteraction: () => void }) {
  const [query, setQuery] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [suggestedTopics] = useState(randomTopics);
  const [textResults, setTextResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const searchSequence = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/search.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ sequence: number; results: SearchResult[] }>) => {
      if (event.data.sequence !== searchSequence.current) return;
      setTextResults(event.data.results);
      setSearching(false);
    };
    return () => { worker.terminate(); workerRef.current = null; };
  }, []);

  useEffect(() => {
    const value = query.trim();
    const sequence = ++searchSequence.current;
    setTextResults([]);
    const knownResults = value
      ? referenceResults(value).length ? referenceResults(value) : curatedTopicResults(value)
      : [];
    if (!value || knownResults.length) { setSearching(false); return; }
    setSearching(true);
    const timer = window.setTimeout(() => workerRef.current?.postMessage({ query: value, sequence }), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const directResults = query.trim()
    ? referenceResults(query.trim()).length ? referenceResults(query.trim()) : curatedTopicResults(query.trim())
    : [];
  const results = directResults.length ? directResults : textResults;

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
      <input autoFocus value={query} onChange={(event) => { onInteraction(); setQuery(event.target.value); }} placeholder="Search by word, topic, or reference" />
    </label>

    {!query.trim() && <div className={showAllTopics ? "topic-picker topic-picker-expanded" : "topic-picker"}>
      {(showAllTopics ? Object.entries(topicGroups) : [["Virtues", suggestedTopics]] as [string, string[]][]).map(([group, items]) => <section className="topic-group" key={group}>
        {showAllTopics && <h3>{group}</h3>}
        <div className="prompt-grid">{items.map((topic) => <button key={topic} className="prompt-chip" onClick={() => { onInteraction(); setQuery(topic); }}>{topic}</button>)}</div>
      </section>)}
      {!showAllTopics && <button className="show-more-topics" onClick={() => { onInteraction(); setShowAllTopics(true); }}>Show more topics</button>}
    </div>}

    {results.length > 0 && <div className="search-results">{results.map((result) => <button className="search-result" key={`${result.bookId}-${result.chapter}-${result.verse}`} onClick={() => { onChoose(result); close(); }}><span><strong>{result.label}</strong><small>{result.text}</small></span><ArrowRight size={15} /></button>)}</div>}

    {!query.trim() && <p className="search-empty">Choose a topic or search the Bible.</p>}
    {query.trim() && !results.length && <p className="search-empty">{searching ? "Searching for passages…" : "No passages found yet. Try a different word, verse reference, or topic."}</p>}
  </div>;
}
