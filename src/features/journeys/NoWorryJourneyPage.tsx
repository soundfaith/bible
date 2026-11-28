import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { NarrationProgress, NarratorButton } from "@/platform/audio/NarratorButton";
import { guidedJourneyDays, type GuidedJourneyId } from "./guidedJourneys";
import { freedomJourneyIntro } from "./freedomJourney";
import { adventJourneyIntro } from "./adventJourney";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";
import type { NarrationGender } from "@/platform/audio/narrationVoice";
import type { ReactNode } from "react";
import { guidedItem } from "@/platform/audio/audioPlaylists";

const journeyNames: Record<GuidedJourneyId, string> = {
  freedom: "15-Day Journey to Freedom from Attachment",
  "no-worry": "No-Worry Journey",
  advent: "Advent Journey",
};

type Props = {
  journeyId: GuidedJourneyId;
  progress: GuidedJourneyProgress;
  voicePreference: NarrationGender;
  nextStep: ReactNode;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onStart: () => void;
  onCompleteDay: () => void;
};

export function NoWorryJourneyPage({ journeyId, progress, voicePreference, nextStep, selectedDay, onSelectDay, onStart, onCompleteDay }: Props) {
  const days = guidedJourneyDays[journeyId];
  const journeyName = journeyNames[journeyId];
  const isComplete = progress.completedDays.length === days.length;
  const currentDay = Math.min(progress.completedDays.length + 1, days.length);
  const dayNumber = selectedDay ?? currentDay;
  const day = days[dayNumber - 1];
  const narration = guidedItem(journeyId, dayNumber)!;
  const canCompleteDay = progress.started && !isComplete && dayNumber === currentDay;
  const intro = journeyId === "freedom" ? freedomJourneyIntro : journeyId === "advent" ? adventJourneyIntro : null;

  return (
    <main className="journey-page journey-detail-page section-wrap saints-page no-worry-page has-next-step">
      <nav className="journey-detail-nav" aria-label="Journey navigation">
        <a className="button button-outline" href={`#/journeys/${journeyId}`}><ArrowLeft size={16} /> All days</a>
      </nav>

      <header className="journey-detail-heading saints-detail-heading no-worry-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> {journeyName}</p>
        <h1>{`Day ${dayNumber}: ${day.title}`}</h1>
        <p className="journey-detail-overview">{isComplete ? "Journey complete. Revisit any day whenever you need it." : `${days.length}-day journey through Scripture, reflection, and prayer.`}</p>
        <div className="journey-audio-controls">
          <NarratorButton text={narration.text} voicePreference={voicePreference} track={narration.track} />
        </div>
        <NarrationProgress className="narration-progress-desktop no-worry-narration-progress" />
      </header>

      {progress.storageError && (
        <p className="guided-journey-notice" role="status">
          Journey progress could not be saved on this device. Your changes will remain only for this visit.
        </p>
      )}

      <article className="journey-story breviary-segment no-worry-content" aria-label={`Day ${dayNumber} of the ${journeyName}`}>
        {intro && dayNumber === 1 && (
          <section className="journey-scripture">
            <div className="rosary-prayer-parts">
              <div className="rosary-prayer-part">
                <div className="rosary-prayer-heading"><h4>Anchor Verse</h4></div>
                <div className="rosary-prayer-reading no-worry-scripture">
                  <p>“{intro.anchorVerse}”</p>
                  <p className="rosary-scripture-reference">{intro.anchorReference}</p>
                </div>
              </div>
              <div className="rosary-prayer-part">
                <div className="rosary-prayer-heading"><h4>Grace We Seek</h4></div>
                <div className="rosary-prayer-reading no-worry-reading"><p>{intro.grace}</p></div>
              </div>
            </div>
          </section>
        )}
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
        {intro && dayNumber === days.length && (
          <section className="journey-scripture">
            <div className="rosary-prayer-parts">
              <div className="rosary-prayer-part">
                <div className="rosary-prayer-heading"><h4>Journey Takeaway</h4></div>
                <div className="rosary-prayer-reading no-worry-reading">
                  {intro.takeaway.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            </div>
          </section>
        )}
        {!progress.started && dayNumber === currentDay ? (
          <button className="button button-coral no-worry-complete" type="button" onClick={onStart}>Begin the journey <ArrowRight size={15} /></button>
        ) : canCompleteDay ? (
          <button className="button button-coral no-worry-complete" type="button" onClick={onCompleteDay}>Complete Day {dayNumber} <Check size={15} /></button>
        ) : null}
      </article>
      <nav className="bible-chapter-nav no-worry-day-nav" aria-label="No-Worry Journey days">
        <button type="button" className="button button-outline" onClick={() => onSelectDay(dayNumber - 1)} disabled={dayNumber <= 1}>
          <ArrowLeft size={16} /> Previous
        </button>
        <span>Day {dayNumber} of {days.length}</span>
        <button type="button" className="button button-outline" onClick={() => onSelectDay(dayNumber + 1)} disabled={dayNumber >= days.length}>
          Next <ArrowRight size={16} />
        </button>
      </nav>
      {nextStep}
    </main>
  );
}
