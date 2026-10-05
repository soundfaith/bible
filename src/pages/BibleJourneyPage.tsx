import { useState } from "react";
import { ArrowRight, BookOpen, Check, Circle, Milestone } from "lucide-react";
import { bibleJourney } from "../data/bibleJourney";
import { resolveReference } from "../lib/readings";
import { bibleBooks } from "../lib/bible";

type JourneyPageProps = {
  completedIds: string[];
  storageError: boolean;
  onToggleComplete: (periodId: string) => void;
  onOpenPassage: (bookId: string, chapter: number, verse: number) => void;
};

function getBookId(reference: string) {
  const normalized = reference.toLowerCase();
  return bibleBooks.find((book) => normalized.startsWith(`${book.name.toLowerCase()} `))?.id;
}

export function BibleJourneyPage({
  completedIds,
  storageError,
  onToggleComplete,
  onOpenPassage,
}: JourneyPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const nextPeriod = bibleJourney.find((period) => !completedIds.includes(period.id));
    return nextPeriod?.id ?? bibleJourney[0].id;
  });
  const completedCount = completedIds.length;
  const currentPeriod = bibleJourney.find((period) => !completedIds.includes(period.id));

  return (
    <main className="journey-page section-wrap">
      <header className="journey-heading">
        <div className="journey-heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A guided way through Scripture</p>
          <h1>Bible <em>Journey</em></h1>
          <p className="journey-intro">
            Follow the Bible’s story in chronological order, from creation through Jesus to the forming and
            continuing mission of the Church. These twelve stops offer representative readings, not an
            exhaustive account; take them at your own pace.
          </p>
        </div>
        <aside className="journey-progress" aria-label="Journey progress">
          <div className="journey-progress-top">
            <span>Journey progress</span>
            <strong>{completedCount}<small> / {bibleJourney.length}</small></strong>
          </div>
          <progress value={completedCount} max={bibleJourney.length} aria-label={`${completedCount} of ${bibleJourney.length} periods completed`} />
          <p>{completedCount === bibleJourney.length ? "All twelve periods complete" : currentPeriod ? `Next: ${currentPeriod.title}` : "Your journey is ready"}</p>
        </aside>
      </header>

      {storageError && (
        <p className="journey-storage-notice" role="status">
          Progress could not be read or saved on this device. Your changes will remain only for this visit.
        </p>
      )}

      <section className="journey-timeline" aria-label="The twelve periods of the Bible journey">
        <div className="journey-timeline-intro">
          <div>
            <p className="eyebrow">The unfolding story</p>
            <h2>Twelve places to pause.</h2>
          </div>
          <p>Open a period for its story, illustration direction, and representative passages.</p>
        </div>
        <ol className="journey-period-list">
          {bibleJourney.map((period, index) => {
            const isComplete = completedIds.includes(period.id);
            const isCurrent = currentPeriod?.id === period.id;
            const isExpanded = expandedId === period.id;
            return (
              <li
                key={period.id}
                className={`journey-period${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}${isExpanded ? " is-expanded" : ""}`}
              >
                <span className="journey-node" aria-hidden="true">
                  {isComplete ? <Check size={14} strokeWidth={2.5} /> : <span>{String(index + 1).padStart(2, "0")}</span>}
                </span>
                <details
                  open={isExpanded}
                  onToggle={(event) => {
                    if (event.currentTarget.open) setExpandedId(period.id);
                    else if (expandedId === period.id) setExpandedId(null);
                  }}
                >
                  <summary aria-label={`${isExpanded ? "Collapse" : "Expand"} period ${index + 1}: ${period.title}`}>
                    <span className="journey-period-label">
                      <span>Period {String(index + 1).padStart(2, "0")}</span>
                      {isCurrent && <span className="journey-current-label">Up next</span>}
                      {isComplete && <span className="journey-done-label">Complete</span>}
                    </span>
                    <span className="journey-period-title">{period.title}</span>
                    <span className="journey-expand-indicator" aria-hidden="true"><ArrowRight size={17} /></span>
                  </summary>
                  {isExpanded && (
                    <div className="journey-period-content">
                      <p className="journey-period-overview">{period.overview}</p>
                      <figure
                        className={`journey-artwork journey-artwork--${period.scene}`}
                        role="img"
                        aria-label={`Illustration placeholder for ${period.title}. ${period.artPrompt}`}
                      >
                        <span className="journey-artwork-sky" aria-hidden="true" />
                        <span className="journey-artwork-orbit" aria-hidden="true" />
                        <span className="journey-artwork-land journey-artwork-land-back" aria-hidden="true" />
                        <span className="journey-artwork-land journey-artwork-land-front" aria-hidden="true" />
                        <span className="journey-artwork-motif" aria-hidden="true" />
                        <span className="journey-artwork-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <span className="journey-artwork-label">Illustration placeholder</span>
                        <figcaption className="journey-artwork-caption">{period.title}</figcaption>
                      </figure>
                      <details className="journey-art-prompt">
                        <summary>Original illustration prompt</summary>
                        <p>{period.artPrompt}</p>
                      </details>
                      <div className="journey-passages">
                        <p className="eyebrow">Read the passages</p>
                        {period.references.map((reference) => {
                          const verses = resolveReference(reference);
                          const bookId = getBookId(reference);
                          const firstVerse = verses[0];
                          return (
                            <div className="journey-passage" key={reference}>
                              <div className="journey-passage-copy">
                                <strong>{reference}</strong>
                                {firstVerse ? (
                                  <p>“{firstVerse.text}”</p>
                                ) : (
                                  <p className="journey-reference-error" role="status">
                                    This passage is not available in the local Bible text.
                                  </p>
                                )}
                              </div>
                              <button
                                className="journey-open-passage"
                                disabled={!firstVerse || !bookId}
                                onClick={() => firstVerse && bookId && onOpenPassage(bookId, firstVerse.chapter, firstVerse.verse)}
                              >
                                <BookOpen size={15} /> Open
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="journey-period-footer">
                        <span className="journey-reader-note"><Milestone size={15} /> Read at your own pace</span>
                        <button
                          className={isComplete ? "journey-complete-button completed" : "journey-complete-button"}
                          aria-pressed={isComplete}
                          onClick={() => onToggleComplete(period.id)}
                        >
                          {isComplete ? <><Check size={15} /> Completed</> : <><Circle size={15} /> Mark complete</>}
                        </button>
                      </div>
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
