import { bibleJourney } from "../data/bibleJourney";
import { noWorryJourney } from "../data/noWorryJourney";
import type { GuidedJourneyProgress } from "./guidedJourneyProgress";

export type JourneyOverview = {
  noWorry: {
    active: boolean;
    complete: boolean;
    nextDay: number;
  };
  bible: {
    active: boolean;
    complete: boolean;
    lastPeriod: (typeof bibleJourney)[number] | null;
    resumePeriod: (typeof bibleJourney)[number] | null;
    completedCount: number;
    totalCount: number;
  };
  hasActiveJourney: boolean;
  featuredJourney: "no-worry" | "bible";
};

export function getJourneyOverview(
  guidedProgress: GuidedJourneyProgress,
  completedIds: string[],
  lastVisitedPeriodId: string | null,
): JourneyOverview {
  const completed = new Set(completedIds);
  const noWorryComplete = guidedProgress.completedDays.length >= noWorryJourney.length;
  const bibleComplete = bibleJourney.every((period) => completed.has(period.id));
  const lastPeriod = bibleJourney.find((period) => period.id === lastVisitedPeriodId) ?? null;
  const lastPeriodIndex = lastPeriod ? bibleJourney.indexOf(lastPeriod) : -1;
  const nextAfterLast = lastPeriodIndex >= 0 ? bibleJourney.slice(lastPeriodIndex + 1).find((period) => !completed.has(period.id)) : null;
  const resumePeriod = bibleComplete
    ? null
    : lastPeriod && !completed.has(lastPeriod.id)
      ? lastPeriod
      : nextAfterLast ?? bibleJourney.find((period) => !completed.has(period.id)) ?? null;
  const noWorryActive = guidedProgress.started && !noWorryComplete;
  const bibleActive = !bibleComplete && Boolean(lastPeriod || completed.size > 0);
  const featuredJourney = noWorryActive || !bibleActive ? "no-worry" : "bible";

  return {
    noWorry: {
      active: noWorryActive,
      complete: noWorryComplete,
      nextDay: Math.min(guidedProgress.completedDays.length + 1, noWorryJourney.length),
    },
    bible: {
      active: bibleActive,
      complete: bibleComplete,
      lastPeriod,
      resumePeriod,
      completedCount: completed.size,
      totalCount: bibleJourney.length,
    },
    hasActiveJourney: noWorryActive || bibleActive,
    featuredJourney,
  };
}
