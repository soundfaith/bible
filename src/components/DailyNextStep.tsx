import { NextStepPrompt } from "./NextStepPrompt";
import { breviaryHourInfo, type BreviaryHour } from "../lib/breviary";
import { type DailyStreakState } from "../lib/dailyStreak";
import { selectDailyRecommendation, type RecommendationPage } from "../lib/dailyRecommendations";
import { journeyCatalog } from "../data/journeyCatalog";
import type { JourneyOverview } from "../lib/journeyOverview";
import type { SmallCardProps } from "./LandingSmallCard";

export type { RecommendationPage } from "../lib/dailyRecommendations";

type Props = {
  page: RecommendationPage;
  streak: DailyStreakState;
  hour: BreviaryHour;
  journeyOverview: JourneyOverview;
  gospelReference: string;
  onOpenMass: () => void;
  onOpenBreviary: () => void;
  onOpenRosary: () => void;
  onOpenSaints: () => void;
  onOpenJourney: (journey: "no-worry" | "bible") => void;
  onExploreJourneys: () => void;
  onOpenCatechism: () => void;
  onOpenSumma: () => void;
  onOpenReference: (reference: string) => void;
};

export function DailyNextStep({
  page,
  streak,
  hour,
  journeyOverview,
  gospelReference,
  onOpenMass,
  onOpenBreviary,
  onOpenRosary,
  onOpenSaints,
  onOpenJourney,
  onExploreJourneys,
  onOpenCatechism,
  onOpenSumma,
  onOpenReference,
}: Props) {
  const recommendation = selectDailyRecommendation(page, streak, journeyOverview);
  const journeyCard = (journey: "no-worry" | "bible"): SmallCardProps => journey === "no-worry"
    ? {
      art: journeyCatalog["no-worry"].artwork,
      title: journeyCatalog["no-worry"].title,
      description: `Continue with day ${journeyOverview.noWorry.nextDay} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${journeyOverview.noWorry.nextDay}`,
      onClick: () => onOpenJourney("no-worry"),
    }
    : {
      art: journeyCatalog.bible.artwork,
      title: journeyCatalog.bible.title,
      description: journeyOverview.bible.resumePeriod
        ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.`
        : journeyCatalog.bible.description,
      action: "Continue Bible Journey",
      onClick: () => onOpenJourney("bible"),
    };

  const cards: Record<string, SmallCardProps> = {
    mass: { art: "readings", title: "Mass Readings", description: "Spend a little time with today's readings from Mass.", action: "Read today's Mass", onClick: onOpenMass },
    bible: { art: "bible", title: "Today's Gospel", description: `Spend a little time with ${gospelReference}.`, action: "Open the Gospel", onClick: () => onOpenReference(gospelReference) },
    breviary: { art: "prayer", title: "Breviary", description: `Pray ${breviaryHourInfo[hour].name} with the Church.`, action: `Pray ${breviaryHourInfo[hour].name}`, onClick: onOpenBreviary },
    rosary: { art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus' life.", action: "Pray the Rosary", onClick: onOpenRosary },
    saints: { art: "saints", title: "Saint of the Day", description: "Spend a moment with a witness to the Gospel.", action: "Meet today's saint", onClick: onOpenSaints },
    catechism: { art: "catechism", title: "Baltimore Catechism", description: "Explore a lesson from the historic Baltimore Catechism.", action: "Browse the lessons", onClick: onOpenCatechism },
    summa: { art: "summa", title: "Summa Theologiae", description: "Explore a question from the Summa Theologiae.", action: "Browse the Summa", onClick: onOpenSumma },
    "journey-no-worry": journeyCard("no-worry"),
    "journey-bible": journeyCard("bible"),
    "journey-library": {
      art: journeyCatalog.bible.artwork,
      title: "Explore Another Journey",
      description: "Choose a guided journey through Scripture and daily life.",
      action: "Explore journeys",
      onClick: onExploreJourneys,
    },
  };

  return <NextStepPrompt
    heading="Recommended next step"
    card={cards[recommendation]}
    className={`daily-next-step daily-next-step--${page}`}
  />;
}
