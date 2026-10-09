import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { bibleJourney } from "../data/bibleJourney";
import { getJourneyArtworkOptions, resolveJourneyArtwork } from "../data/journeyArtwork";
import { JourneyArtForeground } from "../components/JourneyArtwork";

type JourneyArtworkPageProps = {
  selections: Record<string, string>;
  storageError: boolean;
  onSelect: (periodId: string, optionId: string) => void;
};

export function JourneyArtworkPage({ selections, storageError, onSelect }: JourneyArtworkPageProps) {
  return (
    <main className="journey-page journey-artwork-page section-wrap">
      <nav className="journey-detail-nav" aria-label="Artwork navigation">
        <a className="button button-outline" href="#/journey"><ArrowLeft size={16} /> Back to journey</a>
        <a className="journey-artwork-link" href="#/journey">Return to the journey library <ArrowRight size={14} /></a>
      </nav>
      <header className="journey-heading">
        <div className="journey-heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Make the story your own</p>
          <h1>Choose your <em>artwork</em></h1>
          <p className="journey-intro">
            Choose one original foreground illustration for each period. Your selection is saved on this device
            and appears over the shared landscape throughout the journey.
          </p>
        </div>
      </header>
      {storageError && (
        <p className="journey-storage-notice" role="status">
          Artwork choices could not be saved on this device. Your selections will remain only for this visit.
        </p>
      )}
      <div className="journey-artwork-gallery">
        {bibleJourney.map((period, index) => {
          const options = getJourneyArtworkOptions(period.id);
          const selected = resolveJourneyArtwork(period.id, selections[period.id]);
          return (
            <section className="journey-artwork-period" id={`artwork-${period.id}`} key={period.id} aria-labelledby={`artwork-heading-${period.id}`}>
              <header className="journey-artwork-heading">
                <h2 id={`artwork-heading-${period.id}`}>{period.title}</h2>
                <p>Period {String(index + 1).padStart(2, "0")} <span aria-hidden="true">·</span> {options.length} illustrations</p>
              </header>
              <div className="journey-artwork-period-meta">
                <p>{period.teaser}</p>
                <span className="journey-artwork-selected-label" aria-live="polite">
                  {selected ? `Selected: ${selected.name}` : "No selection"}
                </span>
              </div>
              <ul className="journey-artwork-options" aria-label={`Artwork options for ${period.title}`}>
                {options.map((option) => {
                  const isSelected = selections[period.id] === option.id || (!selections[period.id] && options[0]?.id === option.id);
                  return (
                    <li className="journey-artwork-option" key={option.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${option.name}. ${option.description}${isSelected ? ". Selected" : ""}`}
                        onClick={() => onSelect(period.id, option.id)}
                      >
                        <span className="journey-artwork-preview">
                          <JourneyArtForeground option={option} className="journey-art-foreground--preview" />
                        </span>
                        <span className="journey-artwork-option-copy">
                          <strong>{option.name}</strong>
                          <span>{option.description}</span>
                          <small>{isSelected ? <><Check size={12} aria-hidden="true" /> Selected</> : "Choose illustration"}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <a className="journey-artwork-link" href={`#/journey/${period.id}`}>
                View {period.title} in the journey <ArrowRight size={14} />
              </a>
            </section>
          );
        })}
      </div>
    </main>
  );
}
