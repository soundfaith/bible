import { bibleJourney } from "../data/bibleJourney";
import type { JourneyArtworkOption } from "../data/journeyArtwork";
import {
  JourneyPeriodArtwork,
  getSavedJourneyTheme,
  getSavedJourneyVariant,
} from "./JourneyPeriodArtwork";

type JourneyArtworkProps = {
  periodId: string;
  optionId?: string;
  index?: number;
  hero?: boolean;
};

type KingdomBuilding = {
  x: number;
  y: number;
  width: number;
  height: number;
  lit: boolean;
};

type KingdomRidgePoint = [number, number];

function createKingdomTown(
  seed: number,
  center: number,
  span: number,
  ridge: KingdomRidgePoint[],
): KingdomBuilding[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const ridgeHeightAt = (x: number) => {
    const rightIndex = ridge.findIndex(([pointX]) => pointX >= x);
    if (rightIndex <= 0) return ridge[Math.max(0, rightIndex)][1];
    const [leftX, leftY] = ridge[rightIndex - 1];
    const [rightX, rightY] = ridge[rightIndex];
    return leftY + ((x - leftX) / (rightX - leftX)) * (rightY - leftY);
  };

  return Array.from({ length: 168 }, () => {
    const isOutlier = random() > 0.84;
    const spread = isOutlier
      ? (random() - 0.5) * span * 1.2
      : (random() + random() + random() - 1.5) * span * 0.32;
    const x = Math.max(0, Math.min(1000, center + spread));
    const width = 2.8 + random() * 4.5;
    const height = 4 + random() * 8;
    const slopeSetback = 15 + random() * 19;
    return {
      x,
      y: ridgeHeightAt(x) + slopeSetback,
      width,
      height,
      lit: random() > 0.9,
    };
  });
}

const distantKingdom = createKingdomTown(701, 112, 170, [
  [-40, 266], [89.6, 208.8], [219.2, 244], [381.2, 156], [532.4, 241.8],
  [660.8, 193.4], [802.4, 259.4], [932, 175.8], [1040, 217.6],
]);
const nearKingdom = createKingdomTown(1707, 785, 190, [
  [510.8, 282.6], [651.2, 324.4], [813.2, 265], [932, 315.6], [1040, 289.2],
]);

export function JourneyArtForeground({
  option,
  className = "",
}: {
  option: JourneyArtworkOption;
  className?: string;
}) {
  const [Primary, Secondary, Accent] = option.icons;
  return (
    <span className={`journey-art-foreground ${className}`} aria-hidden="true">
      <span className="journey-art-radiance" />
      <span className="journey-art-icon journey-art-icon-primary"><Primary strokeWidth={1.35} /></span>
      <span className="journey-art-icon journey-art-icon-secondary"><Secondary strokeWidth={1.45} /></span>
      <span className="journey-art-icon journey-art-icon-accent"><Accent strokeWidth={1.5} /></span>
      <span className="journey-art-ground" />
    </span>
  );
}

export function JourneyArtwork({
  periodId,
  index = 0,
  hero = false,
}: JourneyArtworkProps) {
  const period = bibleJourney.find((item) => item.id === periodId) ?? bibleJourney[0];
  const theme = getSavedJourneyTheme();
  const variant = getSavedJourneyVariant();

  return (
    <figure
      className={`journey-artwork journey-artwork--new ${hero ? "journey-artwork--hero" : ""}`}
      role="img"
      aria-label={`${period.title}: ${period.artPrompt}`}
    >
      <JourneyPeriodArtwork
        periodId={period.id}
        theme={theme}
        variant={variant}
        index={index}
        hero={hero}
      />
      {hero && <figcaption className="journey-artwork-caption">{period.title}</figcaption>}
    </figure>
  );
}
