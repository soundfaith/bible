import { ArrowLeft, ArrowRight, Check, Circle } from "lucide-react";
import { bibleJourney } from "../data/bibleJourney";
import { bibleBooks, getParagraphs } from "../lib/bible";
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

function groupReferences(references: string[]) {
  const groups: Array<{ key: string; label: string; references: string[] }> = [];
  for (const reference of references) {
    const match = reference.match(/^(.+?)\s+(\d+):(.+)$/);
    const key = match ? `${match[1]} ${match[2]}` : reference;
    const previous = groups[groups.length - 1];
    if (match && previous?.key === key) {
      previous.references.push(reference);
      previous.label += `, ${match[3]}`;
    } else {
      groups.push({ key, label: match ? `${match[1]} ${match[2]}:${match[3]}` : reference, references: [reference] });
    }
  }
  return groups;
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
      <span className="journey-artwork-object journey-artwork-object-one" aria-hidden="true" />
      <span className="journey-artwork-object journey-artwork-object-two" aria-hidden="true" />
      <span className="journey-artwork-object journey-artwork-object-three" aria-hidden="true" />
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

  return (
    <main className="journey-page journey-detail-page section-wrap">
      <nav className="journey-detail-nav" aria-label="Period navigation">
        <a className="button button-outline" href="#/journey"><ArrowLeft size={16} /> Back to journey</a>
        <button
          className={isComplete ? "journey-complete-button journey-complete-top-button completed" : "journey-complete-button journey-complete-top-button"}
          aria-pressed={isComplete}
          onClick={() => onToggleComplete(period.id)}
        >
          {isComplete ? <><Check size={14} /> Completed</> : <><Circle size={14} /> Mark as completed</>}
        </button>
      </nav>

      <header className="journey-detail-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> Period {String(periodIndex + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {bibleJourney.length}</p>
        <h1>{period.title}</h1>
        <p className="journey-detail-overview">{period.overview}</p>
      </header>

      <Artwork period={period} index={periodIndex} hero />

      <nav className="journey-toc" aria-label={`Stories in ${period.title}`}>
        <p className="eyebrow">In this period</p>
        <ol>{period.stories.map((story, storyIndex) => (
          <li key={`${period.id}-toc-${storyIndex}`}><a href={`#/journey/${period.id}`} onClick={(event) => {
            event.preventDefault();
            document.getElementById(`story-${period.id}-${storyIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>{story.title}</a></li>
        ))}</ol>
      </nav>

      <div className="journey-story-list">
        {period.stories.map((story, storyIndex) => (
          <article className="journey-story" id={`story-${period.id}-${storyIndex}`} key={`${period.id}-${story.title}`} aria-labelledby={`story-heading-${period.id}-${storyIndex}`}>
            <div className="journey-story-content">
              <h2 id={`story-heading-${period.id}-${storyIndex}`}>{story.title}</h2>
              <p className="journey-story-summary">{story.summary}</p>
              <div className="journey-story-passages">
                {groupReferences(story.references).map((group) => {
                  const firstReference = group.references[0];
                  const firstVerses = resolveReference(firstReference);
                  const firstBookId = referenceBookId(firstReference);
                  return (
                    <section className="journey-scripture" key={group.key} aria-label={group.label}>
                      <header className="journey-scripture-heading">
                        <h3>{group.references.length > 1 ? group.label : referenceLabel(firstReference)}</h3>
                        <button
                          className="journey-open-passage"
                          disabled={!firstVerses[0] || !firstBookId}
                          onClick={() => firstVerses[0] && firstBookId && onOpenPassage(firstBookId, firstVerses[0].chapter, firstVerses[0].verse)}
                          aria-label={`Open ${group.label} in the Bible reader`}
                        >
                          Open in Bible <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </header>
                      {group.references.map((reference) => {
                        const verses = resolveReference(reference);
                        const paragraphs = getParagraphs(verses);
                        return verses.length ? (
                          <div className="journey-scripture-verses bible-reading-copy" lang="en" key={reference}>
                            {paragraphs.map((paragraph) => (
                              <p key={paragraph.id}>{paragraph.verses.map((verse) => (
                                <span key={`${verse.chapter}:${verse.verse}`}><sup aria-label={`Verse ${verse.verse}`}>{verse.verse}</sup>{verse.text} </span>
                              ))}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="journey-reference-error" role="status" key={reference}>
                            This passage is not available in the local Bible text.
                          </p>
                        );
                      })}
                    </section>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="journey-detail-footer">
        <div className="journey-detail-actions" aria-label="Period navigation">
          {previous ? <a className="button button-outline journey-previous-action" href={`#/journey/${previous.id}`} rel="prev"><ArrowLeft size={15} /> Previous</a> : <span />}
          {next ? <a className="button button-outline journey-next-action" href={`#/journey/${next.id}`} rel="next">Next <ArrowRight size={15} /></a> : <span />}
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
            continuing mission of the Church. These {bibleJourney.length} stops offer representative readings, not an
            exhaustive account; take them at your own pace.
          </p>
        </div>
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
            <h2 id="journey-library-title">Thirteen places to pause.</h2>
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
