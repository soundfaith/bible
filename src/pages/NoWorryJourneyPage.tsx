import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo } from "react";
import { NarrationProgress, NarratorButton } from "../components/NarratorButton";
import { noWorryJourney } from "../data/noWorryJourney";
import type { GuidedJourneyProgress } from "../lib/guidedJourneyProgress";
import type { NarrationGender } from "../lib/narrationVoice";
import type { ReactNode } from "react";

type Props = {
  progress: GuidedJourneyProgress;
  voicePreference: NarrationGender;
  nextStep: ReactNode;
  onStart: () => void;
  onCompleteDay: () => void;
};

export function NoWorryJourneyPage({ progress, voicePreference, nextStep, onStart, onCompleteDay }: Props) {
  const isComplete = progress.completedDays.length === noWorryJourney.length;
  const currentDay = Math.min(progress.completedDays.length + 1, noWorryJourney.length);
  const day = noWorryJourney[currentDay - 1];
  const narration = useMemo(
    () => [day.scripture, day.reference, day.reflection, day.prayer].join(". "),
    [day],
  );

  return (
    <main className="journey-page journey-detail-page section-wrap saints-page no-worry-page has-next-step">
      <nav className="journey-detail-nav" aria-label="Journey navigation">
        <a className="button button-outline" href="#/"><ArrowLeft size={16} /> Home</a>
      </nav>

      <header className="journey-detail-heading saints-detail-heading no-worry-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> No-Worry Challenge</p>
        <h1>{isComplete ? "Journey complete" : `Day ${currentDay} of the No-Worry Journey`}</h1>
        <p className="journey-detail-overview">{isComplete ? "Keep walking in trust, one day at a time." : "A 15-day journey through Scripture, reflection, and prayer."}</p>
        <div className="journey-audio-controls">
          <NarratorButton text={narration} voicePreference={voicePreference} />
        </div>
        <NarrationProgress className="narration-progress-desktop no-worry-narration-progress" />
      </header>

      {progress.storageError && (
        <p className="guided-journey-notice" role="status">
          Journey progress could not be saved on this device. Your changes will remain only for this visit.
        </p>
      )}

      <article className="journey-story breviary-segment no-worry-content" aria-label={`Day ${currentDay} of the No-Worry Journey`}>
        <section className="journey-scripture">
          <div className="rosary-prayer-parts">
            <div className="rosary-prayer-part">
              <div className="rosary-prayer-heading"><h4>Scripture / Quote</h4></div>
              <div className="rosary-prayer-reading no-worry-scripture">
                <p>“{day.scripture}”</p>
                <p className="rosary-scripture-reference">{day.reference}</p>
              </div>
            </div>
            <div className="rosary-prayer-part">
              <div className="rosary-prayer-heading"><h4>Reflection</h4></div>
              <div className="rosary-prayer-reading no-worry-reading">
                {day.reflection.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
            <div className="rosary-prayer-part">
              <div className="rosary-prayer-heading"><h4>Prayer</h4></div>
              <div className="rosary-prayer-reading no-worry-reading"><p>{day.prayer}</p></div>
            </div>
          </div>
        </section>
        {!progress.started ? (
          <button className="button button-coral no-worry-complete" type="button" onClick={onStart}>Begin the journey <ArrowRight size={15} /></button>
        ) : !isComplete ? (
          <button className="button button-coral no-worry-complete" type="button" onClick={onCompleteDay}>Complete Day {currentDay} <Check size={15} /></button>
        ) : null}
      </article>
      {nextStep}
    </main>
  );
}
