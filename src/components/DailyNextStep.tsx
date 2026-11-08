import { useState } from "react";
import { NextStepPrompt } from "./NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { breviaryHourInfo, type BreviaryHour } from "../lib/breviary";
import { bibleBooks, getChapterCount } from "../lib/bible";
import { journeyCatalog } from "../data/journeyCatalog";
import { nextDailyRoutine, routineStreak, type DailyStreakState, type Routine } from "../lib/dailyStreak";
import type { JourneyOverview } from "../lib/journeyOverview";
import type { SmallCardProps } from "./LandingSmallCard";

type RandomSuggestion = { kind: "gospel" } | { kind: "psalm"; chapter: number } | { kind: "paul"; bookId: string; chapter: number } | { kind: "assistant" } | { kind: "catechism" };

type Props = {
  page: "breviary" | "mass" | "rosary" | "saints" | "catechism" | "journey";
  streak: DailyStreakState;
  hour: BreviaryHour;
  journeyComplete: boolean;
  journeyOverview: JourneyOverview;
  gospelReference: string;
  onOpenMass: () => void;
  onOpenBreviary: () => void;
  onOpenRosary: () => void;
  onOpenSaints: () => void;
  onOpenJourney: () => void;
  onOpenReference: (reference: string) => void;
  onOpenChapter: (bookId: string, chapter: number) => void;
};

const paulineBookIds = ["romans", "1_corinthians", "2_corinthians", "galatians", "ephesians", "philippians", "colossians", "1_thessalonians", "2_thessalonians", "1_timothy", "2_timothy", "titus", "philemon"];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeRandomSuggestion(): RandomSuggestion {
  const kind = randomItem(["gospel", "psalm", "paul", "assistant", "catechism"] as const);
  if (kind === "psalm") return { kind, chapter: 1 + Math.floor(Math.random() * 150) };
  if (kind === "paul") {
    const bookId = randomItem(paulineBookIds);
    return { kind, bookId, chapter: 1 + Math.floor(Math.random() * getChapterCount(bookId)) };
  }
  return { kind };
}

function streakText(days: number) {
  if (days >= 2) return `${days} days in a row`;
  return "1 day, a lovely start";
}

export function DailyNextStep({ page, streak, hour, journeyComplete, journeyOverview, gospelReference, onOpenMass, onOpenBreviary, onOpenRosary, onOpenSaints, onOpenJourney, onOpenReference, onOpenChapter }: Props) {
  const [randomSuggestion] = useState(makeRandomSuggestion);
  const routineOptions: { routine: Routine; streakDays: number; card: SmallCardProps }[] = [
    {
      routine: "breviary", streakDays: routineStreak(streak, "breviary"),
      card: { art: "prayer", title: "Breviary", description: `Pray ${breviaryHourInfo[hour].name} with the Church.`, action: `Pray ${breviaryHourInfo[hour].name}`, onClick: onOpenBreviary },
    },
    {
      routine: "mass", streakDays: routineStreak(streak, "mass"),
      card: { art: "readings", title: "Mass Reading", description: "Spend a little time with today's readings from Mass.", action: "Read today's Mass", onClick: onOpenMass },
    },
    {
      routine: "rosary", streakDays: routineStreak(streak, "rosary"),
      card: { art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus' life.", action: "Pray the Rosary", onClick: onOpenRosary },
    },
    {
      routine: "saints", streakDays: routineStreak(streak, "saints"),
      card: { art: "saints", title: "Saint of the day", description: "Spend a moment with a witness to the Gospel.", action: "Meet today's saint", onClick: onOpenSaints },
    },
  ];
  const nextRoutineId = nextDailyRoutine(streak);
  const nextRoutine = routineOptions.find((item) => item.routine === nextRoutineId);

  let heading: string;
  let card: SmallCardProps;
  if (page !== "journey" && journeyOverview.noWorry.active) {
    heading = "Keep going with your current journey";
    card = {
      art: journeyCatalog["no-worry"].artwork,
      title: journeyCatalog["no-worry"].title,
      description: `Continue with day ${journeyOverview.noWorry.nextDay} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${journeyOverview.noWorry.nextDay}`,
      onClick: onOpenJourney,
    };
  } else if (page !== "journey" && journeyOverview.bible.active) {
    heading = "Keep going with your current journey";
    card = {
      art: journeyCatalog.bible.artwork,
      title: journeyCatalog.bible.title,
      description: journeyOverview.bible.resumePeriod
        ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.`
        : journeyCatalog.bible.description,
      action: "Continue Bible Journey",
      onClick: onOpenJourney,
    };
  } else if (nextRoutine) {
    const hasActiveStreak = nextRoutine.streakDays > 0;
    heading = hasActiveStreak ? "Keep your prayer streak going" : nextRoutine.routine === "mass" ? "Continue with today's readings" : nextRoutine.routine === "saints" ? "Meet a witness of faith" : "Continue with prayer";
    card = hasActiveStreak
      ? { ...nextRoutine.card, stat: streakText(nextRoutine.streakDays), description: "Keep this daily rhythm going today.", action: "Continue your streak" }
      : nextRoutine.card;
  } else if (journeyComplete) {
    heading = "Keep exploring Scripture";
    if (randomSuggestion.kind === "gospel") {
      card = { art: "bible", title: "Today's Gospel", description: `Spend a little time with ${gospelReference}.`, action: "Open the Gospel", onClick: () => onOpenReference(gospelReference) };
    } else if (randomSuggestion.kind === "psalm") {
      card = { art: "readings", title: `Psalm ${randomSuggestion.chapter}`, description: "Let a psalm give words to prayer today.", action: "Read this psalm", onClick: () => onOpenChapter("psalms", randomSuggestion.chapter) };
    } else if (randomSuggestion.kind === "paul") {
      const book = bibleBooks.find((item) => item.id === randomSuggestion.bookId);
      card = { art: "journey", title: book ? `${book.name} ${randomSuggestion.chapter}` : "A letter from Paul", description: "Read a chapter from one of Paul's letters.", action: "Open this letter", onClick: () => onOpenChapter(randomSuggestion.bookId, randomSuggestion.chapter) };
    } else if (randomSuggestion.kind === "catechism") {
      card = { art: "catechism", title: "Baltimore Catechism", description: "Explore a lesson from the historic Baltimore Catechism.", action: "Browse the lessons", onClick: () => { window.location.hash = "#/catechism"; } };
    } else {
      card = { art: "journey", title: `Ask ${ASSISTANT_NAME}`, description: "Bring a question, a worry, or a verse you're wondering about.", action: "Start a conversation", onClick: () => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT)) };
    }
  } else {
    heading = "Ready to go a little deeper?";
    card = { art: journeyCatalog.bible.artwork, title: journeyCatalog.bible.title, description: journeyCatalog.bible.description, action: "Explore journeys", onClick: onOpenJourney };
  }

  return <NextStepPrompt heading={heading} card={card} className={`daily-next-step daily-next-step--${page}`} />;
}
