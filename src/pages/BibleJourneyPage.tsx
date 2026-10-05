import { ArrowLeft, ArrowRight, BookOpen, Check, Circle, Milestone } from "lucide-react";
import { bibleJourney } from "../data/bibleJourney";
import { getBook, bibleBooks } from "../lib/bible";
import { resolveReference, referenceLabel } from "../lib/readings";

type JourneyPageProps = {
  periodId: string | null;
  completedIds: string[];
  storageError: boolean;
  onToggleComplete: (periodId: string) => void;
  onOpenPassage: (bookId: string, chapter: number, verse: number) => void;
};

function referenceBookId(reference: string) {
  const match = reference.match(/^(.+?)\s+\d+:/);
  if (!match) return undefined;
  const name = match[1].toLowerCase().replace(/\s+/g, "_");
  if (name === "psalm") return "psalms";
  return bibleBooks.find((book) => book.name.toLowerCase().replace(/\s+/g, "_") === name)?.id;
}

function Artwork({ period, index, hero = false }: { period: typeof bibleJourney[number]; index: number; hero?: boolean }) {
  return (
    <figure
      className={`journey-artwork journey-artwork--${period.scene}${hero ? " journey-artwork--hero" : ""}`}
      role="img"
      aria-label={`${period.title}: ${period.artPrompt}`}
    >
      <span className="journey-artwork-sky" aria-hidden="true" />
      <span className="journey-artwork-orbit" aria-hidden="true" />
      <span className="journey-artwork-land journey-artwork-land-back" aria-hidden="true" />
      <span className="journey-artwork-land journey-artwork-land-front" aria-hidden="true" />
      <span className="journey-artwork-motif" aria-hidden="true" />
      <span className="journey-artwork-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      {hero && <figcaption className="journey-artwork-caption">{period.title}</figcaption>}
    </figure>
  );
}

export function BibleJourneyPage({
  periodId,
  completedIds,
  storageError,
  onToggleComplete,
  onOpenPassage,
}: JourneyPageProps) {
  const completedCount = completedIds.length;
  const currentPeriod = bibleJourney.find((period) => period.id === periodId);
  const periodIndex = currentPeriod ? bibleJourney.indexOf(currentPeriod) : -1;

  if (!currentPeriod) {
    return (
      <main className="journey-page section-wrap">
        <a className="journey-back-link" href="#/journey"><ArrowLeft size={16} /> All periods</a>
        <section className="journey-not-found" aria-labelledby="journey-not-found-title">
          <p className="eyebrow">Bible Journey</p>
          <h1 id="journey-not-found-title">Period not found</h1>
          <p>That stop is not part of this journey. Return to the library to choose a period.</p>
          <a className="journey-action-link" href="#/journey">Back to all periods <ArrowRight size={16} /></a>
        </section>
      </main>
    );
  }

  const period = currentPeriod;
  const previous = bibleJourney[periodIndex - 1];
  const next = bibleJourney[periodIndex + 1];
  const isComplete = completedIds.includes(period.id);
  const translation = getBook(referenceBookId(period.stories[0].references[0]) ?? "genesis").translation;

  return (
    <main className="journey-page journey-detail-page section-wrap">
      <nav className="journey-detail-nav" aria-label="Period navigation">
        <a className="journey-back-link" href="#/journey"><ArrowLeft size={16} /> All periods</a>
        <div>
          {previous ? <a href={`#/journey/${previous.id}`} rel="prev"><ArrowLeft size={15} /> Previous</a> : <span />}
          {next ? <a href={`#/journey/${next.id}`} rel="next">Next <ArrowRight size={15} /></a> : <span />}
        </div>
      </nav>

      <header className="journey-detail-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> Period {String(periodIndex + 1).padStart(2, "0")} <span aria-hidden="true">/</span> 12</p>
        <h1>{period.title}</h1>
        <p className="journey-detail-overview">{period.overview}</p>
      </header>

      <Artwork period={period} index={periodIndex} hero />

      <div className="journey-story-intro">
        <span className="eyebrow">The unfolding story</span>
        <p>{period.stories.length} readings · {translation}</p>
      </div>

      <div className="journey-story-list">
        {period.stories.map((story, storyIndex) => (
          <article className="journey-story" key={`${period.id}-${story.title}`} aria-labelledby={`story-${period.id}-${storyIndex}`}>
            <div className="journey-story-marker" aria-hidden="true">{String(storyIndex + 1).padStart(2, "0")}</div>
            <div className="journey-story-content">
              <h2 id={`story-${period.id}-${storyIndex}`}>{story.title}</h2>
              <p className="journey-story-summary">{story.summary}</p>
              <div className="journey-story-passages">
                {story.references.map((reference, referenceIndex) => {
                  const verses = resolveReference(reference);
                  const bookId = referenceBookId(reference);
                  const firstVerse = verses[0];
                  return (
                    <section className="journey-scripture" key={reference} aria-label={`${referenceIndex === 0 ? "Primary passage" : `Additional passage ${referenceIndex}`}: ${reference}`}>
                      <header className="journey-scripture-heading">
                        <div>
                          {referenceIndex > 0 && <span className="journey-secondary-label">Also read</span>}
                          <h3>{referenceLabel(reference)}</h3>
                        </div>
                        <button
                          className="journey-open-passage"
                          disabled={!firstVerse || !bookId}
                          onClick={() => firstVerse && bookId && onOpenPassage(bookId, firstVerse.chapter, firstVerse.verse)}
                          aria-label={`Open ${referenceLabel(reference)} in the Bible reader`}
                        >
                          <BookOpen size={15} /> Open in Bible
                        </button>
                      </header>
                      {verses.length ? (
                        <div className="journey-scripture-verses" lang="en">
                          {verses.map((verse) => (
                            <p key={`${verse.chapter}:${verse.verse}`}>
                              <sup aria-label={`Verse ${verse.verse}`}>{verse.verse}</sup>
                              <span>{verse.text}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="journey-reference-error" role="status">
                          This passage is not available in the local Bible text.
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="journey-detail-footer">
        <p className="journey-reader-note"><Milestone size={16} /> Read at your own pace. Scripture text: {translation}.</p>
        <div className="journey-detail-actions">
          <button
            className={isComplete ? "journey-complete-button completed" : "journey-complete-button"}
            aria-pressed={isComplete}
            onClick={() => onToggleComplete(period.id)}
          >
            {isComplete ? <><Check size={15} /> Completed</> : <><Circle size={15} /> Mark period complete</>}
          </button>
          <a className="journey-action-link" href="#/journey">Back to all periods <ArrowRight size={16} /></a>
          {next && <a className="journey-action-link journey-next-action" href={`#/journey/${next.id}`}>Continue to {next.title} <ArrowRight size={16} /></a>}
        </div>
      </footer>
      {storageError && <p className="journey-storage-notice" role="status">Progress could not be saved on this device. Your change will remain only for this visit.</p>}
    </main>
  );
}

export function BibleJourneyLibrary({
  completedIds,
  storageError,
}: Pick<JourneyPageProps, "completedIds" | "storageError">) {
  const nextPeriod = bibleJourney.find((period) => !completedIds.includes(period.id));
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
            <strong>{completedIds.length}<small> / {bibleJourney.length}</small></strong>
          </div>
          <progress value={completedIds.length} max={bibleJourney.length} aria-label={`${completedIds.length} of ${bibleJourney.length} periods completed`} />
          <p>{completedIds.length === bibleJourney.length ? "All twelve periods complete" : nextPeriod ? `Next: ${nextPeriod.title}` : "Your journey is ready"}</p>
        </aside>
      </header>

      {storageError && (
        <p className="journey-storage-notice" role="status">
          Progress could not be read or saved on this device. Your changes will remain only for this visit.
        </p>
      )}

      <section className="journey-library" aria-labelledby="journey-library-title">
        <div className="journey-library-heading">
          <div>
            <p className="eyebrow">The unfolding story</p>
            <h2 id="journey-library-title">Twelve places to pause.</h2>
          </div>
          <p>Move through the biblical story one illustrated chapter at a time.</p>
        </div>
        <ol className="journey-library-list">
          {bibleJourney.map((period, index) => {
            const done = completedIds.includes(period.id);
            const isNext = nextPeriod?.id === period.id;
            return (
              <li className={`journey-library-item${done ? " is-complete" : ""}${isNext ? " is-current" : ""}`} key={period.id}>
                <a className="journey-library-card" href={`#/journey/${period.id}`} aria-label={`Period ${index + 1}, ${period.title}: ${period.teaser}`}>
                  <span className="journey-library-number" aria-hidden="true">{done ? <Check size={15} /> : String(index + 1).padStart(2, "0")}</span>
                  <Artwork period={period} index={index} />
                  <span className="journey-library-copy">
                    <span className="journey-period-label">
                      <span>Period {String(index + 1).padStart(2, "0")}</span>
                      {isNext && <span className="journey-current-label">Up next</span>}
                      {done && <span className="journey-done-label">Complete</span>}
                    </span>
                    <strong>{period.title}</strong>
                    <span className="journey-library-teaser">{period.teaser}</span>
                    <span className="journey-library-meta">{period.stories.length} stories <ArrowRight size={14} aria-hidden="true" /></span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
