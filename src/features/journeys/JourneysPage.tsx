import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { CardArt, type CardArtKey } from "@/shared/ui/LandingSmallCard";
import { journeyCadence, journeyCatalog, journeyList, type AvailableJourneyId } from "./journeyCatalog";
import { guidedJourneyDays, isGuidedJourneyId, type GuidedJourneyId } from "./guidedJourneys";
import { getJourneyOverview } from "./journeyOverview";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";

type JourneyRecommendation = GuidedJourneyId | "bible";

type JourneysPageProps = {
  guidedProgress: Record<GuidedJourneyId, GuidedJourneyProgress>;
  bibleCompletedIds: string[];
  lastVisitedPeriodId: string | null;
  onSelectJourney: (id: JourneyRecommendation) => void;
  onContinueBibleJourney: () => void;
  nextStep?: ReactNode;
};

export function JourneysPage({
  guidedProgress,
  bibleCompletedIds,
  lastVisitedPeriodId,
  onSelectJourney,
  onContinueBibleJourney,
  nextStep,
}: JourneysPageProps) {
  const overview = getJourneyOverview(guidedProgress, bibleCompletedIds, lastVisitedPeriodId);
  const guided = { freedom: overview.freedom, "no-worry": overview.noWorry, advent: overview.advent };
  const { bible } = overview;

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
          <ol className="journey-library-list library-stack">
            {(["freedom", "no-worry", "advent"] as const).filter((id) => guided[id].active).map((id) => (
              <JourneyLibraryItem
                key={id}
                art={journeyCatalog[id].artwork}
                label={`In progress · ${journeyCadence(id)} cadence`}
                title={journeyCatalog[id].title}
                teaser={`Day ${guided[id].nextDay} of ${guidedJourneyDays[id].length} · Scripture, reflection, and prayer.`}
                meta={`Continue Day ${guided[id].nextDay}`}
                onClick={() => onSelectJourney(id)}
              />
            ))}
            {bible.active && bible.resumePeriod && (
              <JourneyLibraryItem
                art={journeyCatalog.bible.artwork}
                label={`In progress · ${journeyCadence("bible")} cadence`}
                title={journeyCatalog.bible.title}
                teaser={`Continue with ${bible.resumePeriod.title} in the story of salvation.`}
                meta="Continue journey"
                onClick={onContinueBibleJourney}
              />
            )}
          </ol>
        ) : (
          <p className="journeys-hub-empty">No journey in progress yet. The 15-Day Journey to Freedom from Attachment is a gentle place to start, or explore the Bible Journey below.</p>
        )}
      </section>

      <section className="journeys-hub-section" aria-labelledby="journeys-explore-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Find your next step</p>
          <h2 id="journeys-explore-title">Explore journeys.</h2>
          <p className="landing-section-description">Choose a guided path that meets you where you are.</p>
        </div>
        <ol className="journey-library-list library-stack">
          {journeyList.filter((journey) => !(isGuidedJourneyId(journey.id) && guided[journey.id].active) && !(journey.id === "bible" && bible.active)).map((journey) => {
            if (journey.id === "lent") {
              return (
                <JourneyLibraryItem
                  key={journey.id}
                  art={journey.artwork}
                  label={`Coming soon · ${journeyCadence(journey.id)} cadence`}
                  title={journey.title}
                  teaser={journey.description}
                  meta="Coming soon"
                  comingSoon
                />
              );
            }
            const guidedId = isGuidedJourneyId(journey.id) ? journey.id : null;
            const journeyId: JourneyRecommendation = guidedId ?? "bible";
            const action = guidedId
              ? guided[guidedId].complete ? "Revisit journey" : guided[guidedId].active ? "Continue journey" : "Begin journey"
              : bible.complete ? "Revisit Bible Journey" : bible.active ? "Continue Bible Journey" : "Explore Bible Journey";
            return (
              <JourneyLibraryItem
                key={journey.id}
                art={journey.artwork}
                label={`${journeyCadence(journeyId)} cadence`}
                title={journey.title}
                teaser={journey.description}
                meta={action}
                onClick={() => onSelectJourney(journeyId)}
              />
            );
          })}
        </ol>
      </section>
      {nextStep}
    </main>
  );
}

function JourneyLibraryItem({ art, label, title, teaser, meta, onClick, comingSoon = false }: { art: CardArtKey; label: string; title: string; teaser: string; meta: string; onClick?: () => void; comingSoon?: boolean }) {
  const body = <>
    <CardArt art={art} className={comingSoon ? "is-blurred" : ""} />
    <span className="journey-library-copy">
      <span className="journey-period-label"><span>{label}</span></span>
      <strong>{title}</strong>
      <span className="journey-library-teaser">{teaser}</span>
      <span className="journey-library-meta">{meta}{onClick && <ArrowRight size={14} aria-hidden="true" />}</span>
    </span>
  </>;
  return <li className="journey-library-item">
    {onClick ? <button type="button" className="journey-library-card" onClick={onClick}>{body}</button> : <div className="journey-library-card is-coming-soon">{body}</div>}
  </li>;
}
