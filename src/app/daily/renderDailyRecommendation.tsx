import { DailyNextStep, type RecommendationPage } from "@/features/daily";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { getTodaysMassReading } from "@/features/mass-readings";
import { currentBreviaryHour } from "@/features/breviary/breviary";
import { todaysRosaryPath } from "@/features/rosary/rosary";
import type { useAppNavigation } from "../navigation";
import type { DailyStreak } from "./useDailyCoordination";

type Navigation = ReturnType<typeof useAppNavigation>;

export type DailyRecommendationOptions = {
  dailyStreak: DailyStreak;
  journeyOverview: ReturnType<typeof getJourneyOverview>;
  setMassDate: (date: string) => void;
  openCurrentBreviary: Navigation["openCurrentBreviary"];
  openJourneyRecommendation: Navigation["openJourneyRecommendation"];
  openExploreJourneys: Navigation["openExploreJourneys"];
  openMassReference: Navigation["openMassReference"];
};

// Builds the "next step" prompt shown at the bottom of each page.
export function renderDailyRecommendation(page: RecommendationPage, { dailyStreak, journeyOverview, setMassDate, openCurrentBreviary, openJourneyRecommendation, openExploreJourneys, openMassReference }: DailyRecommendationOptions) {
  const todayGospelReference = Object.entries(getTodaysMassReading().readings).find(([name]) => name.toLowerCase() === "gospel")?.[1].reference ?? "John 1:1-5";
  return <DailyNextStep
    page={page}
    streak={dailyStreak}
    hour={currentBreviaryHour()}
    journeyOverview={journeyOverview}
    gospelReference={todayGospelReference}
    onOpenMass={() => { setMassDate(getTodaysMassReading().date); window.location.hash = "#/mass"; }}
    onOpenBreviary={openCurrentBreviary}
    onOpenRosary={() => { window.location.hash = todaysRosaryPath(); }}
    onOpenSaints={() => { window.location.hash = "#/saints/today"; }}
    onOpenJourney={openJourneyRecommendation}
    onExploreJourneys={openExploreJourneys}
    onOpenCatechism={() => { window.location.hash = "#/catechism"; }}
    onOpenSumma={() => { window.location.hash = "#/summa"; }}
    onOpenReference={openMassReference}
  />;
}
