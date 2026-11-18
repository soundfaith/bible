import { bibleJourney } from "../data/bibleJourney";
import { guidedJourneyDays, type GuidedJourneyId } from "../data/guidedJourneys";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";

export type GuidedOverview = {
  active: boolean;
  complete: boolean;
  nextDay: number;
};

export type JourneyOverview = {
  freedom: GuidedOverview;
  noWorry: GuidedOverview;
  bible: {
    active: boolean;
    complete: boolean;
    lastPeriod: (typeof bibleJourney)[number] | null;
    resumePeriod: (typeof bibleJourney)[number] | null;
    completedCount: number;
    totalCount: number;
  };
  hasActiveJourney: boolean;
  featuredJourney: "freedom" | "bible";
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
  const bibleActive = !bibleComplete && Boolean(lastPeriod || completed.size > 0);
  return {
    freedom,
    noWorry,
    bible: {
      active: bibleActive,
      complete: bibleComplete,
      lastPeriod,
      resumePeriod,
      completedCount: completed.size,
      totalCount: bibleJourney.length,
    },
    hasActiveJourney: freedom.active || noWorry.active || bibleActive,
    featuredJourney: "freedom",
  };
}
