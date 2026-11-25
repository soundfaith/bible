import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { loadDailyStreak, localDateKey, recordDailyItem, recordJourneySession } from "@/features/daily";
import { featuredSaintForDate, hasSaintSlug } from "@/features/saints/saintsDaily";
import { getTodaysMassReading } from "@/features/mass-readings";
import { isBreviaryHour } from "@/features/breviary/breviary";
import { journeyCadence } from "@/features/journeys/journeyCatalog";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import type { Route } from "../routing";

type DailyCoordinationOptions = {
  route: Route;
  breviaryHour: string | null;
  breviaryDate: Date;
  massDate: string;
  saintSlug: string;
  journeyPeriodId: string | null;
  activeGuidedId: GuidedJourneyId;
  activeGuidedStarted: boolean;
};

export type DailyStreak = ReturnType<typeof loadDailyStreak>;
export type DailyStreakSetter = Dispatch<SetStateAction<DailyStreak>>;

// Records the daily streak for the page being visited today.
export function useDailyCoordination({ route, breviaryHour, breviaryDate, massDate, saintSlug, journeyPeriodId, activeGuidedId, activeGuidedStarted }: DailyCoordinationOptions) {
  const [dailyStreak, setDailyStreak] = useState(loadDailyStreak);
  useEffect(() => {
    const today = localDateKey();
    if (route === "breviary" && breviaryHour && isBreviaryHour(breviaryHour) && localDateKey(breviaryDate) === today) {
      setDailyStreak((state) => recordDailyItem(state, breviaryHour, today));
    } else if (route === "mass" && massDate === getTodaysMassReading().date) {
      setDailyStreak((state) => recordDailyItem(state, "mass", today));
    } else if (route === "rosary-prayer") {
      setDailyStreak((state) => recordDailyItem(state, "rosary", today));
    } else if (route === "saint-profile" && (saintSlug === "today" ? featuredSaintForDate() : hasSaintSlug(saintSlug))) {
      setDailyStreak((state) => recordDailyItem(state, "saints", today));
    } else if (route === "read") {
      setDailyStreak((state) => recordDailyItem(state, "bible", today));
    } else if (route === "catechism") {
      setDailyStreak((state) => recordDailyItem(state, "catechism", today));
    } else if (route === "summa") {
      setDailyStreak((state) => recordDailyItem(state, "summa", today));
    }
  }, [route, breviaryHour, breviaryDate, massDate, saintSlug]);
  useEffect(() => {
    if (route === "guided-journey" && activeGuidedStarted) {
      setDailyStreak((state) => recordJourneySession(state, activeGuidedId, journeyCadence(activeGuidedId)));
    } else if (route === "journey" && journeyPeriodId) {
      setDailyStreak((state) => recordJourneySession(state, "bible", journeyCadence("bible")));
    }
  }, [route, journeyPeriodId, activeGuidedId, activeGuidedStarted]);
  return { dailyStreak, setDailyStreak };
}
