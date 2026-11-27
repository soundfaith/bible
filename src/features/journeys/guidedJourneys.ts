import { freedomJourney } from "./freedomJourney";
import { noWorryJourney, type GuidedJourneyDay } from "./noWorryJourney";
import { adventJourney } from "./adventJourney";

export type GuidedJourneyId = "freedom" | "no-worry" | "advent";

export const guidedJourneyDays: Record<GuidedJourneyId, GuidedJourneyDay[]> = {
  freedom: freedomJourney,
  "no-worry": noWorryJourney,
  advent: adventJourney,
};

export function isGuidedJourneyId(value: string): value is GuidedJourneyId {
  return value === "freedom" || value === "no-worry" || value === "advent";
}
