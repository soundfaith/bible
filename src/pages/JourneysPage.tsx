import { ArrowRight } from "lucide-react";
import { CardArt } from "../components/LandingSmallCard";
import { journeyCatalog, journeyList, type AvailableJourneyId } from "../data/journeyCatalog";
import { noWorryJourney } from "../data/noWorryJourney";
import { getJourneyOverview } from "../lib/journeyOverview";
import type { GuidedJourneyProgress } from "../lib/guidedJourneyProgress";

type JourneysPageProps = {
  guidedProgress: GuidedJourneyProgress;
  bibleCompletedIds: string[];
  lastVisitedPeriodId: string | null;
  onSelectJourney: (id: AvailableJourneyId) => void;
  onContinueBibleJourney: () => void;
};

export function JourneysPage({
  guidedProgress,
  bibleCompletedIds,
  lastVisitedPeriodId,
  onSelectJourney,
  onContinueBibleJourney,
}: JourneysPageProps) {
  const overview = getJourneyOverview(guidedProgress, bibleCompletedIds, lastVisitedPeriodId);
  const { noWorry, bible } = overview;

  return (
    <main className="journeys-hub-page section-wrap">
      <header className="journeys-hub-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> Guided spiritual growth</p>
        <h1>Journeys for<br /><em>the road ahead.</em></h1>
        <p className="page-intro">Take one step at a time through Scripture, reflection, and prayer. Continue a path you have started, or choose one for today.</p>
      </header>

      <section className="journeys-hub-section" aria-labelledby="journeys-current-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Your path</p>
          <h2 id="journeys-current-title">{overview.hasActiveJourney ? "Continue where you left off." : "Choose a place to begin."}</h2>
        </div>
        {overview.hasActiveJourney ? (
          <div className="journeys-hub-current-grid">
            {noWorry.active && (
              <button className="landing-card" type="button" onClick={() => onSelectJourney("no-worry")}>
                <CardArt art={journeyCatalog["no-worry"].artwork} />
                <div className="landing-card-copy">
                  <p className="eyebrow">In progress</p>
                  <h3>{journeyCatalog["no-worry"].title}</h3>
                  <p>Day {noWorry.nextDay} of {noWorryJourney.length} · Scripture, reflection, and prayer for a more trusting heart.</p>
                  <span className="text-link">Continue Day {noWorry.nextDay} <ArrowRight size={15} /></span>
                </div>
              </button>
            )}
            {bible.active && bible.resumePeriod && (
              <button className="landing-card" type="button" onClick={onContinueBibleJourney}>
                <CardArt art={journeyCatalog.bible.artwork} />
                <div className="landing-card-copy">
                  <p className="eyebrow">In progress</p>
                  <h3>{journeyCatalog.bible.title}</h3>
                  <p>Continue with {bible.resumePeriod.title} in the story of salvation.</p>
                  <span className="text-link">Continue journey <ArrowRight size={15} /></span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <p className="journeys-hub-empty">No journey in progress yet. The No-Worry Journey is a gentle place to start, or explore the Bible Journey below.</p>
        )}
      </section>

      <section className="journeys-hub-section" aria-labelledby="journeys-explore-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Find your next step</p>
          <h2 id="journeys-explore-title">Explore journeys.</h2>
          <p className="landing-section-description">Choose a guided path that meets you where you are.</p>
        </div>
        <div className="landing-card-grid">
          {journeyList.filter((journey) => !(journey.id === "no-worry" && noWorry.active) && !(journey.id === "bible" && bible.active)).map((journey) => {
            if (journey.id === "advent" || journey.id === "lent") {
              return (
                <article className="landing-card landing-card--coming-soon" key={journey.id}>
                  <CardArt art={journey.artwork} className="is-blurred" />
                  <div className="landing-card-copy">
                    <h3>{journey.title}</h3>
                    <p>{journey.description}</p>
                    <span className="journey-coming-soon-pill">Coming soon</span>
                  </div>
                </article>
              );
            }
            const journeyId: AvailableJourneyId = journey.id === "no-worry" ? "no-worry" : "bible";
            const action = journeyId === "no-worry"
              ? noWorry.complete ? "Revisit journey" : noWorry.active ? "Continue journey" : "Begin journey"
              : bible.complete ? "Revisit Bible Journey" : bible.active ? "Continue Bible Journey" : "Explore Bible Journey";
            return (
              <button className="landing-card" type="button" key={journey.id} onClick={() => onSelectJourney(journeyId)}>
                <CardArt art={journey.artwork} />
                <div className="landing-card-copy">
                  <h3>{journey.title}</h3>
                  <p>{journey.description}</p>
                  <span className="text-link">{action} <ArrowRight size={15} /></span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
