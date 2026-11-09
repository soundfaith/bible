import { hasJourneySessionInCadence, type DailyItem, type DailyStreakState } from "./dailyStreak";
import type { JourneyOverview } from "./journeyOverview";
import { journeyCadence } from "../data/journeyCatalog";

export type RecommendationPage = "home" | "bible" | "mass" | "breviary" | "rosary" | "saints" | "catechism" | "summa" | "journey";
export type DailyRecommendation = "mass" | "bible" | "breviary" | "rosary" | "saints" | "catechism" | "summa" | "journey-no-worry" | "journey-bible" | "journey-library";

const priorities: Record<RecommendationPage, DailyRecommendation[]> = {
  home: ["journey-no-worry", "journey-bible", "mass", "bible", "breviary", "rosary", "saints", "catechism", "summa"],
  bible: ["journey-no-worry", "journey-bible", "breviary", "rosary", "saints", "catechism", "summa"],
  mass: ["journey-no-worry", "journey-bible", "breviary", "rosary", "saints", "catechism", "summa"],
  breviary: ["mass", "bible", "journey-no-worry", "journey-bible", "saints", "catechism", "summa"],
  rosary: ["mass", "bible", "journey-no-worry", "journey-bible", "saints", "catechism", "summa"],
  saints: ["breviary", "rosary", "mass", "bible", "journey-no-worry", "journey-bible", "journey-library"],
  catechism: ["mass", "bible", "journey-no-worry", "journey-bible", "breviary", "rosary", "saints"],
  summa: ["mass", "bible", "journey-no-worry", "journey-bible", "breviary", "rosary", "saints"],
  journey: ["breviary", "rosary", "mass", "bible"],
};

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isComplete(recommendation: DailyRecommendation, completed: Set<DailyItem>) {
  if (recommendation === "breviary") {
    return completed.has("lauds") || completed.has("vespers") || completed.has("compline");
  }
  if (recommendation === "journey-no-worry" || recommendation === "journey-bible" || recommendation === "journey-library") {
    return false;
  }
  return completed.has(recommendation);
}

function isJourneyDue(
  recommendation: "journey-no-worry" | "journey-bible",
  streak: DailyStreakState,
  overview: JourneyOverview,
  date: Date,
) {
  if (recommendation === "journey-no-worry") {
    return overview.noWorry.active
      && !hasJourneySessionInCadence(streak, "no-worry", journeyCadence("no-worry"), date);
  }
  return overview.bible.active
    && !hasJourneySessionInCadence(streak, "bible", journeyCadence("bible"), date);
}

function hasJourneyToExplore(streak: DailyStreakState, overview: JourneyOverview, date: Date) {
  const noWorryUnstarted = !overview.noWorry.active
    && !overview.noWorry.complete
    && !hasJourneySessionInCadence(streak, "no-worry", journeyCadence("no-worry"), date);
  const bibleUnstarted = !overview.bible.active
    && !overview.bible.complete
    && !hasJourneySessionInCadence(streak, "bible", journeyCadence("bible"), date);
  return noWorryUnstarted || bibleUnstarted;
}

export function selectDailyRecommendation(
  page: RecommendationPage,
  streak: DailyStreakState,
  journeyOverview: JourneyOverview,
  date = new Date(),
): DailyRecommendation {
  const completed = new Set(streak.log[localDateKey(date)] ?? []);
  const candidates = priorities[page].map((item) => {
    if (item === "journey-no-worry" || item === "journey-bible") {
      return isJourneyDue(item, streak, journeyOverview, date) ? item : null;
    }
    if (item === "journey-library" && !hasJourneyToExplore(streak, journeyOverview, date)) return null;
    return item;
  });

  const selected = candidates.find((item) =>
    item !== null && (
      item === "journey-library"
      || item === "journey-no-worry"
      || item === "journey-bible"
      || !isComplete(item, completed)
    ),
  );
  if (selected) return selected;

  const formation: DailyRecommendation[] = ["summa", "catechism", "saints"];
  const deeperFormation = formation.find((item) => item !== page && !isComplete(item, completed));
  if (deeperFormation) return deeperFormation;

  if (hasJourneyToExplore(streak, journeyOverview, date)) return "journey-library";
  return page === "summa" ? "catechism" : "summa";
}
