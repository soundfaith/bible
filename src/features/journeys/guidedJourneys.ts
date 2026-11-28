import { freedomJourney, freedomJourneyIntroduction, freedomJourneySections } from "./freedomJourney";
import { noWorryJourney, noWorryJourneyIntroduction, noWorryJourneySections, type GuidedJourneyDay, type GuidedJourneySection } from "./noWorryJourney";
import { adventJourney, adventJourneyIntroduction, adventJourneySections } from "./adventJourney";

export type GuidedJourneyId = "freedom" | "no-worry" | "advent";

export const guidedJourneyDays: Record<GuidedJourneyId, GuidedJourneyDay[]> = {
  freedom: freedomJourney,
  "no-worry": noWorryJourney,
  advent: adventJourney,
};

export const guidedJourneyIntroductions: Record<GuidedJourneyId, string> = {
  freedom: freedomJourneyIntroduction,
  "no-worry": noWorryJourneyIntroduction,
  advent: adventJourneyIntroduction,
};

export const guidedJourneySections: Record<GuidedJourneyId, GuidedJourneySection[]> = {
  freedom: freedomJourneySections,
  "no-worry": noWorryJourneySections,
  advent: adventJourneySections,
};

export function isGuidedJourneyId(value: string): value is GuidedJourneyId {
  return value === "freedom" || value === "no-worry" || value === "advent";
}
