import { hasJourneySessionInCadence, type DailyItem, type DailyStreakState } from "./dailyStreak";
import type { JourneyOverview } from "@/features/journeys/journeyOverview";
import { journeyCadence } from "@/features/journeys/journeyCatalog";

export type RecommendationPage = "home" | "bible" | "mass" | "breviary" | "rosary" | "saints" | "catechism" | "summa" | "journey";
export type DailyRecommendation = "mass" | "bible" | "breviary" | "rosary" | "saints" | "catechism" | "summa" | "journey-freedom" | "journey-no-worry" | "journey-advent" | "journey-bible";

const priorities: Record<RecommendationPage, DailyRecommendation[]> = {
  home: ["journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "mass", "bible", "breviary", "rosary", "saints", "catechism", "summa"],
  bible: ["journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "breviary", "rosary", "saints", "catechism", "summa"],
  mass: ["journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "breviary", "rosary", "saints", "catechism", "summa"],
  breviary: ["mass", "bible", "journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "saints", "catechism", "summa"],
  rosary: ["mass", "bible", "journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "saints", "catechism", "summa"],
  saints: ["breviary", "rosary", "mass", "bible", "journey-freedom", "journey-no-worry", "journey-advent", "journey-bible"],
  catechism: ["mass", "bible", "journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "breviary", "rosary", "saints"],
  summa: ["mass", "bible", "journey-freedom", "journey-no-worry", "journey-advent", "journey-bible", "breviary", "rosary", "saints"],
  journey: ["breviary", "rosary", "mass", "bible"],
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isComplete(recommendation: DailyRecommendation, completed: Set<DailyItem>) {
  if (recommendation === "breviary") {
    return completed.has("lauds") || completed.has("vespers") || completed.has("compline");
  }
  if (recommendation === "journey-freedom" || recommendation === "journey-no-worry" || recommendation === "journey-advent" || recommendation === "journey-bible") {
    return false;
  }
  return completed.has(recommendation);
}

function isJourneyDue(
  recommendation: "journey-freedom" | "journey-no-worry" | "journey-advent" | "journey-bible",
  streak: DailyStreakState,
  overview: JourneyOverview,
  date: Date,
) {
  if (recommendation === "journey-freedom") {
    return overview.freedom.active
      && !hasJourneySessionInCadence(streak, "freedom", journeyCadence("freedom"), date);
  }
  if (recommendation === "journey-no-worry") {
    return overview.noWorry.active
      && !hasJourneySessionInCadence(streak, "no-worry", journeyCadence("no-worry"), date);
  }
  if (recommendation === "journey-advent") {
    return overview.advent.active
      && !hasJourneySessionInCadence(streak, "advent", journeyCadence("advent"), date);
  }
  return overview.bible.active
    && !hasJourneySessionInCadence(streak, "bible", journeyCadence("bible"), date);
}

export function selectDailyRecommendation(
  page: RecommendationPage,
  streak: DailyStreakState,
  journeyOverview: JourneyOverview,
  date = new Date(),
): DailyRecommendation {
  const completed = new Set(streak.log[localDateKey(date)] ?? []);
  const candidates = priorities[page].map((item) => {
    if (item === "journey-freedom" || item === "journey-no-worry" || item === "journey-advent" || item === "journey-bible") {
      return isJourneyDue(item, streak, journeyOverview, date) ? item : null;
    }
    return item;
  });

  const selected = candidates.find((item) =>
    item !== null && (
      item === "journey-freedom"
      || item === "journey-no-worry"
      || item === "journey-advent"
      || item === "journey-bible"
      || !isComplete(item, completed)
    ),
  );
  if (selected) return selected;

  const formation: DailyRecommendation[] = ["summa", "catechism", "saints"];
  const deeperFormation = formation.find((item) => item !== page && !isComplete(item, completed));
  if (deeperFormation) return deeperFormation;

  return page === "summa" ? "catechism" : "summa";
}
