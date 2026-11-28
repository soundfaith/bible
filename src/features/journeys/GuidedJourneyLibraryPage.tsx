import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Circle, Play, RotateCcw, X } from "lucide-react";
import { journeyCadence, journeyCatalog } from "./journeyCatalog";
import { guidedJourneyDays, guidedJourneyIntroductions, guidedJourneySections, type GuidedJourneyId } from "./guidedJourneys";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";
import { AdventHeroArtwork, AdventSectionArtwork } from "./AdventSectionArtwork";
import { FreedomHeroArtwork, FreedomSectionArtwork } from "./FreedomJourneyArtwork";
import { NoWorryHeroArtwork, NoWorrySectionArtwork } from "./NoWorryJourneyArtwork";

type Props = {
  journeyId: GuidedJourneyId;
  progress: GuidedJourneyProgress;
  onSelectDay: (day: number) => void;
  onRestart: () => void;
};

export function GuidedJourneyLibraryPage({ journeyId, progress, onSelectDay, onRestart }: Props) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  const journey = journeyCatalog[journeyId];
  const days = guidedJourneyDays[journeyId];
  const sections = guidedJourneySections[journeyId];
  const completedDays = new Set(progress.completedDays.filter((day) => day >= 1 && day <= days.length));
  const completedCount = completedDays.size;
  const firstIncomplete = days.findIndex((_, index) => !completedDays.has(index + 1));
  const nextDay = firstIncomplete < 0 ? null : firstIncomplete + 1;
  const remainingDays = days.length - completedCount;
  const action = nextDay === null ? "Revisit Day 1" : progress.started ? `Continue Day ${nextDay}` : "Begin Journey";
  const cadence = journeyCadence(journeyId);
  const isAdvent = journeyId === "advent";
  const isFreedom = journeyId === "freedom";
  const isNoWorry = journeyId === "no-worry";
  const primaryAction = <>
    <button className="button button-coral journey-resume-button guided-journey-primary-action" type="button" onClick={() => onSelectDay(nextDay ?? 1)}>
      {action} <ArrowRight size={16} aria-hidden="true" />
    </button>
    {nextDay === null && <button className="button button-outline journey-resume-button guided-journey-restart-action" type="button" onClick={() => setConfirmRestart(true)}>
      <RotateCcw size={16} aria-hidden="true" /> Restart journey
    </button>}
  </>;

  return (
    <main className={`journeys-hub-page section-wrap guided-journey-library-page${isAdvent ? " advent-journey-page" : isFreedom ? " freedom-journey-page" : isNoWorry ? " no-worry-journey-library-page" : ""}`}>
      <nav className="journey-detail-nav" aria-label="Journey navigation">
        <a className="button button-outline" href="#/journeys"><ArrowLeft size={16} /> All journeys</a>
      </nav>

      <header className={`journey-heading guided-journey-hero${isAdvent ? " advent-journey-hero" : isFreedom ? " freedom-journey-hero" : isNoWorry ? " no-worry-journey-hero" : ""}`}>
        <div className="journey-heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> {isAdvent ? "A season of hope" : isFreedom ? "A path to a freer heart" : isNoWorry ? "Peace for today, trust for tomorrow" : "Guided journey"}</p>
          <h1>{isFreedom ? "Freedom from Attachment" : isNoWorry ? "No-Worry Journey" : journey.title}</h1>
          <p className="journey-intro guided-journey-introduction">{guidedJourneyIntroductions[journeyId]}</p>
          <p className="guided-journey-metadata">
            {days.length} days <span aria-hidden="true">{"\u00b7"}</span> {cadence === "daily" ? "Daily" : "Weekly"} cadence <span aria-hidden="true">{"\u00b7"}</span> Scripture, reflection, and prayer
          </p>
          {(isAdvent || isFreedom || isNoWorry) && primaryAction}
          <div className="guided-journey-progress-summary">
            <div className="guided-journey-progress-copy">
              <strong>{completedCount} of {days.length} days completed</strong>
              <span>{nextDay === null ? "You have completed this journey." : `Day ${nextDay} is next · ${remainingDays} ${remainingDays === 1 ? "day" : "days"} remaining`}</span>
            </div>
            <progress value={completedCount} max={days.length} aria-label={`${completedCount} of ${days.length} days completed`} />
          </div>
          {!isAdvent && !isFreedom && !isNoWorry && primaryAction}
        </div>
        {isAdvent && <AdventHeroArtwork />}
        {isFreedom && <FreedomHeroArtwork />}
        {isNoWorry && <NoWorryHeroArtwork />}
      </header>

      {progress.storageError && <p className="guided-journey-notice" role="status">Journey progress could not be saved on this device. Your changes will remain only for this visit.</p>}

      <div className={`guided-journey-editorial-list${isAdvent ? " advent-journey-weeks" : isFreedom ? " freedom-journey-parts" : isNoWorry ? " no-worry-journey-parts" : ""}`} aria-label={`${journey.title} day progression`}>
        {sections.map((section, sectionIndex) => {
          const sectionDays = days.slice(section.startDay - 1, section.endDay);
          const sectionContent = <>
            <header className="guided-journey-section-heading">
              <p className="guided-journey-section-label">{section.label}</p>
              <h2 id={`guided-section-${sectionIndex}`}>{section.title}</h2>
            </header>
            {isAdvent && <p className="advent-section-description">{["Wait with hope for the light God has promised.", "Make a little room, and prepare the way.", "Share in Mary's joyful trust in God's promise.", "Welcome Christ, the light who draws near."][sectionIndex]}</p>}
            {isFreedom && <p className="freedom-section-description">{["Begin by noticing what your heart reaches for first.", "Practice holding life's good gifts with open hands.", "Love deeply, without trying to possess or control.", "Rest in God's steady love and the freedom it gives."][sectionIndex]}</p>}
            {isNoWorry && <p className="no-worry-section-description">{["Bring each concern into prayer, one honest moment at a time.", "Discover the steadiness of God's care in the quiet.", "Let the peace of Christ meet you in the midst of fear.", "Carry a small practice of trust into each new day."][sectionIndex]}</p>}
            <ol className="guided-journey-day-list" start={section.startDay}>
              {sectionDays.map((day, index) => {
                const dayNumber = section.startDay + index;
                const complete = completedDays.has(dayNumber);
                const current = dayNumber === nextDay;
                const status = complete ? "completed" : current ? "current" : "upcoming";
                return <li className={`guided-journey-day is-${status}`} key={dayNumber}>
                  <button type="button" className="guided-journey-day-link" onClick={() => onSelectDay(dayNumber)} aria-current={current ? "step" : undefined} aria-label={`${status} · Day ${dayNumber}: ${day.title}`}>
                    <span className="guided-journey-day-state" aria-hidden="true">
                      {complete ? <Check size={14} strokeWidth={1.8} /> : current ? <Play size={9} fill="currentColor" strokeWidth={1.8} /> : <Circle size={15} strokeWidth={1.25} />}
                    </span>
                    <span className="guided-journey-day-copy">
                      <span className="guided-journey-day-number">Day {dayNumber}{current && <span className="guided-journey-here-label">You are here</span>}</span>
                      <strong>{day.title}</strong>
                    </span>
                  </button>
                </li>;
              })}
            </ol>
          </>;

          return <section className={`guided-journey-section${isAdvent ? " advent-journey-week" : isFreedom ? " freedom-journey-part" : isNoWorry ? " no-worry-journey-part" : ""}`} key={`${section.label}-${sectionIndex}`} aria-labelledby={`guided-section-${sectionIndex}`}>
            {isAdvent && <AdventSectionArtwork week={(sectionIndex + 1) as 1 | 2 | 3 | 4} />}
            {isFreedom && <FreedomSectionArtwork part={(sectionIndex + 1) as 1 | 2 | 3 | 4} />}
            {isNoWorry && <NoWorrySectionArtwork part={(sectionIndex + 1) as 1 | 2 | 3 | 4} />}
            {isAdvent ? <div className="advent-week-content">{sectionContent}</div> : isFreedom ? <div className="freedom-part-content">{sectionContent}</div> : isNoWorry ? <div className="no-worry-part-content">{sectionContent}</div> : sectionContent}
          </section>;
        })}
      </div>

      {confirmRestart && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmRestart(false); }}>
        <section className="modal confirmation" role="dialog" aria-modal="true" aria-labelledby="guided-restart-title">
          <button className="modal-close" onClick={() => setConfirmRestart(false)} aria-label="Close dialog"><X size={18} /></button>
          <p className="eyebrow">Restart journey</p>
          <h2 id="guided-restart-title">Start over from <em>Day 1?</em></h2>
          <p>Your completed days in {journey.title} will be cleared.</p>
          <div className="guided-journey-restart-actions">
            <button className="button button-outline" type="button" onClick={() => setConfirmRestart(false)}>Cancel</button>
            <button className="button button-coral" type="button" onClick={() => { onRestart(); setConfirmRestart(false); }}>Restart journey</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
