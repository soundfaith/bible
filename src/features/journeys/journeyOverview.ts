import { bibleJourney } from "./bibleJourney";
import { guidedJourneyDays, type GuidedJourneyId } from "./guidedJourneys";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";
import { journeyList, type AvailableJourneyId } from "./journeyCatalog";

export type GuidedOverview = {
  active: boolean;
  complete: boolean;
  nextDay: number;
};

export type JourneyOverview = {
  freedom: GuidedOverview;
  noWorry: GuidedOverview;
  advent: GuidedOverview;
  bible: {
    active: boolean;
    complete: boolean;
    lastPeriod: (typeof bibleJourney)[number] | null;
    resumePeriod: (typeof bibleJourney)[number] | null;
    completedCount: number;
    totalCount: number;
  };
  hasActiveJourney: boolean;
  featuredJourney: AvailableJourneyId | null;
};

function guidedOverview(journeyId: GuidedJourneyId, progress: GuidedJourneyProgress): GuidedOverview {
  const length = guidedJourneyDays[journeyId].length;
  const complete = progress.completedDays.length >= length;
  return {
    active: progress.started && !complete,
    complete,
    nextDay: Math.min(progress.completedDays.length + 1, length),
  };
}

export function getJourneyOverview(
  guidedProgress: Record<GuidedJourneyId, GuidedJourneyProgress>,
  completedIds: string[],
  lastVisitedPeriodId: string | null,
): JourneyOverview {
  const completed = new Set(completedIds);
  const bibleComplete = bibleJourney.every((period) => completed.has(period.id));
  const lastPeriod = bibleJourney.find((period) => period.id === lastVisitedPeriodId) ?? null;
  const lastPeriodIndex = lastPeriod ? bibleJourney.indexOf(lastPeriod) : -1;
  const nextAfterLast = lastPeriodIndex >= 0 ? bibleJourney.slice(lastPeriodIndex + 1).find((period) => !completed.has(period.id)) : null;
  const resumePeriod = bibleComplete
    ? null
    : lastPeriod && !completed.has(lastPeriod.id)
      ? lastPeriod
      : nextAfterLast ?? bibleJourney.find((period) => !completed.has(period.id)) ?? null;
  const freedom = guidedOverview("freedom", guidedProgress.freedom);
  const noWorry = guidedOverview("no-worry", guidedProgress["no-worry"]);
  const advent = guidedOverview("advent", guidedProgress.advent);
  const bibleActive = !bibleComplete && Boolean(lastPeriod || completed.size > 0);
  const hasActiveJourney = freedom.active || noWorry.active || advent.active || bibleActive;
  const isJourneyComplete = (id: AvailableJourneyId) => id === "bible"
    ? bibleComplete
    : id === "freedom" ? freedom.complete
      : id === "no-worry" ? noWorry.complete
        : advent.complete;
  // Preserve the existing active-journey priority. When none remain active,
  // use catalog order so the newest available, incomplete journey comes first.
  const nextJourney = [...journeyList].reverse().find(
    (journey) => journey.available && !isJourneyComplete(journey.id as AvailableJourneyId),
  );
  const featuredJourney: AvailableJourneyId | null = freedom.active
    ? "freedom"
    : noWorry.active
      ? "no-worry"
      : bibleActive
        ? "bible"
        : advent.active
          ? "advent"
          : nextJourney ? nextJourney.id as AvailableJourneyId : null;
  return {
    freedom,
    noWorry,
    advent,
    bible: {
      active: bibleActive,
      complete: bibleComplete,
      lastPeriod,
      resumePeriod,
      completedCount: completed.size,
      totalCount: bibleJourney.length,
    },
    hasActiveJourney,
    featuredJourney,
  };
}
