import { DailyNextStep, type RecommendationPage } from "@/features/daily";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { getTodaysMassReading } from "@/features/mass-readings";
import { currentBreviaryHour } from "@/features/breviary/breviary";
import { todaysRosaryPath } from "@/features/rosary/rosary";
import { catechismEditions, catechismGroupHref } from "@/features/catechism/catechism";
import { summaQuestionHref } from "@/features/summa/summa";
import type { PlayKind } from "@/features/listen";
import type { useAppNavigation } from "../navigation";
import type { DailyStreak } from "./useDailyCoordination";

type Navigation = ReturnType<typeof useAppNavigation>;

export type DailyRecommendationOptions = {
  dailyStreak: DailyStreak;
  journeyOverview: ReturnType<typeof getJourneyOverview>;
  setMassDate: (date: string) => void;
  openCurrentBreviary: Navigation["openCurrentBreviary"];
  openJourneyRecommendation: Navigation["openJourneyRecommendation"];
  openMassReference: Navigation["openMassReference"];
  playListening: (kind: PlayKind, autoplay?: boolean, reference?: string) => Promise<void>;
};

// Builds the "next step" prompt shown at the bottom of each page.
export function renderDailyRecommendation(page: RecommendationPage, { dailyStreak, journeyOverview, setMassDate, openCurrentBreviary, openJourneyRecommendation, openMassReference, playListening }: DailyRecommendationOptions) {
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
    onOpenJourney={(journey) => {
      if (journey === "bible") {
        openJourneyRecommendation(journey);
        return;
      }
      const nextDay = journeyOverview[journey === "no-worry" ? "noWorry" : journey].nextDay;
      window.location.hash = `#/journeys/${journey}/${nextDay}`;
    }}
    onOpenCatechism={() => {
      const edition = catechismEditions[0];
      const firstLesson = edition?.groups.find((group) => group.kind === "lesson");
      window.location.hash = edition && firstLesson ? catechismGroupHref(edition.number, firstLesson.id) : "#/catechism";
    }}
    onOpenSumma={() => { window.location.hash = summaQuestionHref("prima-pars", 1); }}
    onOpenReference={openMassReference}
    onPlay={(kind, autoplay, reference) => { void playListening(kind, autoplay, reference); }}
  />;
}
