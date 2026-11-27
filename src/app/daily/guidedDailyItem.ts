import type { DailyItem } from "@/features/daily";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";

export const guidedDailyItemFor: Record<GuidedJourneyId, DailyItem> = {
  freedom: "journey-freedom",
  "no-worry": "journey-no-worry",
  advent: "journey-advent",
};
