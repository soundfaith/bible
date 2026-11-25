import { freedomJourney } from "./freedomJourney";
import { noWorryJourney, type GuidedJourneyDay } from "./noWorryJourney";

export type GuidedJourneyId = "freedom" | "no-worry";

export const guidedJourneyDays: Record<GuidedJourneyId, GuidedJourneyDay[]> = {
  freedom: freedomJourney,
  "no-worry": noWorryJourney,
};

export function isGuidedJourneyId(value: string): value is GuidedJourneyId {
  return value === "freedom" || value === "no-worry";
}
