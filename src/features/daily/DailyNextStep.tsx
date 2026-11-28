import { NextStepPrompt } from "@/shared/ui/NextStepPrompt";
import { breviaryHourInfo, type BreviaryHour } from "@/features/breviary/breviary";
import { type DailyStreakState } from "./dailyStreak";
import { selectDailyRecommendation, type RecommendationPage } from "./dailyRecommendations";
import { journeyCatalog } from "@/features/journeys/journeyCatalog";
import { guidedJourneyDays, type GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import type { JourneyOverview } from "@/features/journeys/journeyOverview";
import type { SmallCardProps } from "@/shared/ui/LandingSmallCard";
import type { PlayKind } from "@/features/listen";
export type { RecommendationPage } from "./dailyRecommendations";

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
  onOpenJourney: (journey: GuidedJourneyId | "bible") => void;
  onOpenCatechism: () => void;
  onOpenSumma: () => void;
  onOpenReference: (reference: string) => void;
  onPlay: (kind: PlayKind, autoplay?: boolean, reference?: string) => void;
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
  onOpenCatechism,
  onOpenSumma,
  onOpenReference,
  onPlay,
}: Props) {
  const recommendation = selectDailyRecommendation(page, streak, journeyOverview);
  const guidedOverview = { freedom: journeyOverview.freedom, "no-worry": journeyOverview.noWorry, advent: journeyOverview.advent };
  const action = (kind: PlayKind, openContent: () => void, reference?: string) => () => {
    if (window.innerWidth <= 760) onPlay(kind, false, reference);
    else openContent();
  };
  const guidedCard = (journey: GuidedJourneyId): SmallCardProps => ({
    art: journeyCatalog[journey].artwork,
    title: journeyCatalog[journey].title,
    description: `Continue with day ${guidedOverview[journey].nextDay} of ${guidedJourneyDays[journey].length}.`,
    action: `Continue Day ${guidedOverview[journey].nextDay}`,
    onClick: action(journey, () => onOpenJourney(journey)),
  });
  const journeyCard = (journey: GuidedJourneyId | "bible"): SmallCardProps => journey !== "bible"
    ? guidedCard(journey)
    : {
      art: journeyCatalog.bible.artwork,
      title: journeyCatalog.bible.title,
      description: journeyOverview.bible.resumePeriod
        ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.`
        : journeyCatalog.bible.description,
      action: "Continue Bible Journey",
      onClick: action("bible-journey", () => onOpenJourney("bible")),
    };

  const cards: Record<string, SmallCardProps> = {
    mass: { art: "readings", title: "Mass Readings", description: "Spend a little time with today's readings from Mass.", action: "Read today's Mass", onClick: action("mass", onOpenMass) },
    bible: { art: "bible", title: "Today's Gospel", description: `Spend a little time with ${gospelReference}.`, action: "Open the Gospel", onClick: action("bible-reference", () => onOpenReference(gospelReference), gospelReference) },
    breviary: { art: "prayer", title: "Breviary", description: `Pray ${breviaryHourInfo[hour].name} with the Church.`, action: `Pray ${breviaryHourInfo[hour].name}`, onClick: action("breviary", onOpenBreviary) },
    rosary: { art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus' life.", action: "Pray the Rosary", onClick: action("rosary", onOpenRosary) },
    saints: { art: "saints", title: "Saint of the Day", description: "Spend a moment with a witness to the Gospel.", action: "Meet today's saint", onClick: action("saint", onOpenSaints) },
    catechism: { art: "catechism", title: "Baltimore Catechism", description: "Explore a lesson from the historic Baltimore Catechism.", action: "Open the first lesson", onClick: action("catechism", onOpenCatechism) },
    summa: { art: "summa", title: "Summa Theologiae", description: "Explore a question from the Summa Theologiae.", action: "Open Question 1", onClick: action("summa", onOpenSumma) },
    "journey-freedom": journeyCard("freedom"),
    "journey-no-worry": journeyCard("no-worry"),
    "journey-advent": journeyCard("advent"),
    "journey-bible": journeyCard("bible"),
  };

  return <NextStepPrompt
    heading="Recommended next step"
    card={cards[recommendation]}
    className={`daily-next-step daily-next-step--${page}`}
  />;
}
