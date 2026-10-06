import { ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import { bibleBooks, getChapterCount } from "../lib/bible";
import type { ReadingPosition } from "./ChapterPage";

type Testament = { title: string; books: typeof bibleBooks };

export function BibleBooksPage({ current, onChoose }: { current: ReadingPosition; onChoose: (position: ReadingPosition) => void }) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(current.bookId);
  const currentBookName = bibleBooks.find((book) => book.id === current.bookId)?.name ?? current.bookId;
  const newTestamentStart = bibleBooks.findIndex((book) => book.id === "matthew");
  const splitAt = newTestamentStart < 0 ? bibleBooks.length : newTestamentStart;
  const testaments: Testament[] = [
    { title: "Old Testament", books: bibleBooks.slice(0, splitAt) },
    { title: "New Testament", books: bibleBooks.slice(splitAt) },
  ];

  return (
    <main className="bible-library-page section-wrap">
      <header className="bible-library-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> World English Bible</p>
          <h1>Find your place<br /><em>in the Word.</em></h1>
        </div>
        <p className="bible-library-intro">Choose a book, then a chapter. Your reading place is saved as you go.</p>
      </header>

      <div className="bible-library-testaments">
        {testaments.map(({ title, books }) => (
          <section className="bible-testament" key={title} aria-labelledby={`testament-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            <header className="bible-testament-heading">
              <div>
                <p className="eyebrow">The library</p>
                <h2 id={`testament-${title.toLowerCase().replace(/\s+/g, "-")}`}>{title}</h2>
              </div>
              <span>{books.length} books</span>
            </header>
            {books.length ? (
              <ol className="bible-book-list">
                {books.map((book, index) => {
                  const selected = selectedBookId === book.id;
                  const chapters = getChapterCount(book.id);
                  const panelId = `book-chapters-${book.id}`;
                  return (
                    <li className={selected ? "bible-book-item is-selected" : "bible-book-item"} key={book.id}>
                      <button
                        className="bible-book-button"
                        type="button"
                        aria-label={`${book.name}, ${chapters} chapters`}
                        aria-pressed={selected}
                        aria-expanded={selected}
                        aria-controls={selected ? panelId : undefined}
                        onClick={() => setSelectedBookId(book.id)}
                      >
                        <span className="bible-book-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="bible-book-name">{book.name}</span>
                        <span className="bible-book-count">{chapters} chapters</span>
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                      {selected && (
                        <div className="bible-chapters-panel" id={panelId} aria-label={`${book.name} chapters`}>
                          <p>Select a chapter in {book.name}</p>
                          <div className="bible-chapter-grid">
                            {Array.from({ length: chapters }, (_, index) => {
                              const chapter = index + 1;
                              const isCurrent = current.bookId === book.id && current.chapter === chapter;
                              return (
                                <button
                                  className={isCurrent ? "bible-chapter-button is-current" : "bible-chapter-button"}
                                  key={chapter}
                                  type="button"
                                  aria-label={`${book.name} chapter ${chapter}${isCurrent ? ", current reading" : ""}`}
                                  aria-current={isCurrent ? "page" : undefined}
                                  onClick={() => onChoose({ bookId: book.id, chapter })}
                                >
                                  {chapter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="bible-library-empty" role="status">No books are available in this section yet.</p>
            )}
          </section>
        ))}
      </div>

      <a className="bible-library-return" href="#/read">
        <BookOpen size={16} aria-hidden="true" />
        <span>Return to {currentBookName} {current.chapter}</span>
        <ArrowRight size={15} aria-hidden="true" />
      </a>
    </main>
  );
}
