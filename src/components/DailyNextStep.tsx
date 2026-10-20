import { useState } from "react";
import { NextStepPrompt } from "./NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { breviaryHourInfo, type BreviaryHour } from "../lib/breviary";
import { bibleBooks, getChapterCount } from "../lib/bible";
import { routineStreak, type DailyItem, type DailyStreakState, type Routine } from "../lib/dailyStreak";
import type { SmallCardProps } from "./LandingSmallCard";

type RandomSuggestion = { kind: "gospel" } | { kind: "psalm"; chapter: number } | { kind: "paul"; bookId: string; chapter: number } | { kind: "assistant" };

type Props = {
  page: "breviary" | "mass" | "rosary";
  doneToday: DailyItem[];
  streak: DailyStreakState;
  hour: BreviaryHour;
  journeyComplete: boolean;
  gospelReference: string;
  onOpenMass: () => void;
  onOpenBreviary: () => void;
  onOpenRosary: () => void;
  onOpenJourney: () => void;
  onOpenReference: (reference: string) => void;
  onOpenChapter: (bookId: string, chapter: number) => void;
};

const paulineBookIds = ["romans", "1_corinthians", "2_corinthians", "galatians", "ephesians", "philippians", "colossians", "1_thessalonians", "2_thessalonians", "1_timothy", "2_timothy", "titus", "philemon"];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeRandomSuggestion(): RandomSuggestion {
  const kind = randomItem(["gospel", "psalm", "paul", "assistant"] as const);
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

export function DailyNextStep({ page, doneToday, streak, hour, journeyComplete, gospelReference, onOpenMass, onOpenBreviary, onOpenRosary, onOpenJourney, onOpenReference, onOpenChapter }: Props) {
  const [randomSuggestion] = useState(makeRandomSuggestion);
  const breviaryDone = doneToday.some((item) => item === "lauds" || item === "vespers" || item === "compline");
  const massDone = doneToday.includes("mass");
  const rosaryDone = doneToday.includes("rosary");
  const routineOptions: { routine: Routine; complete: boolean; streakDays: number; card: SmallCardProps }[] = [
    {
      routine: "breviary", complete: breviaryDone, streakDays: routineStreak(streak, "breviary"),
      card: { art: "prayer", title: "Breviary", description: `Pray ${breviaryHourInfo[hour].name} with the Church.`, action: `Pray ${breviaryHourInfo[hour].name}`, onClick: onOpenBreviary },
    },
    {
      routine: "mass", complete: massDone, streakDays: routineStreak(streak, "mass"),
      card: { art: "readings", title: "Mass Reading", description: "Spend a little time with today's readings from Mass.", action: "Read today's Mass", onClick: onOpenMass },
    },
    {
      routine: "rosary", complete: rosaryDone, streakDays: routineStreak(streak, "rosary"),
      card: { art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus' life.", action: "Pray the Rosary", onClick: onOpenRosary },
    },
  ];
  const streakRoutine = routineOptions
    .filter((item) => !item.complete && item.streakDays > 0)
    .sort((a, b) => b.streakDays - a.streakDays)[0];
  const nextRoutine = streakRoutine ?? routineOptions.find((item) => !item.complete);

  let heading: string;
  let card: SmallCardProps;
  if (nextRoutine) {
    const hasActiveStreak = nextRoutine.streakDays > 0;
    heading = hasActiveStreak ? "Keep your prayer streak going" : nextRoutine.routine === "mass" ? "Continue with today's readings" : "Continue with prayer";
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
    } else {
      card = { art: "journey", title: `Ask ${ASSISTANT_NAME}`, description: "Bring a question, a worry, or a verse you're wondering about.", action: "Start a conversation", onClick: () => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT)) };
    }
  } else {
    heading = "Ready to go a little deeper?";
    card = { art: "journey", title: "Bible Journey", description: "Walk through the story of salvation, one period at a time.", action: "Start the Journey", onClick: onOpenJourney };
  }

  return <NextStepPrompt heading={heading} card={card} className={`daily-next-step daily-next-step--${page}`} />;
}
