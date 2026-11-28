export type JourneyCatalogId = "freedom" | "no-worry" | "bible" | "advent" | "lent" | "the-art-of-quiet";
export type AvailableJourneyId = "freedom" | "no-worry" | "bible" | "advent";
export type JourneyCadence = "daily" | "weekly";

export type JourneyCatalogEntry = {
  id: JourneyCatalogId;
  title: string;
  description: string;
  artwork: "journey" | "freedom-journey" | "freedom-hero" | "no-worry-hero" | "advent-hero" | "bible-journey";
  available: boolean;
  cadence?: JourneyCadence;
};

export const journeyCatalog: Record<JourneyCatalogId, JourneyCatalogEntry> = {
  freedom: {
    id: "freedom",
    title: "15-Day Journey to Freedom from Attachment",
    description: "Learning to let go of what keeps us from God.",
    artwork: "freedom-hero",
    available: true,
    cadence: "daily",
  },
  "no-worry": {
    id: "no-worry",
    title: "15-Day No-Worry Journey",
    description: "Fifteen days of Scripture, reflection, and prayer for a more trusting heart.",
    artwork: "no-worry-hero",
    available: true,
    cadence: "daily",
  },
  bible: {
    id: "bible",
    title: "Bible Journey",
    description: "Walk through the story of salvation, one period at a time.",
    artwork: "bible-journey",
    available: true,
    cadence: "weekly",
  },
  advent: {
    id: "advent",
    title: "Advent Journey",
    description: "Prepare your heart for the coming of Christ.",
    artwork: "advent-hero",
    available: true,
  },
  lent: {
    id: "lent",
    title: "Lent Journey",
    description: "Walk with Jesus through prayer, fasting, and almsgiving.",
    artwork: "journey",
    available: false,
  },
  "the-art-of-quiet": {
    id: "the-art-of-quiet",
    title: "The Art of Quiet",
    description: "A gentle path toward stillness, prayer, and a listening heart.",
    artwork: "freedom-journey",
    available: false,
  },
};

export const journeyList = Object.values(journeyCatalog);

export const journeyDisplayOrder: JourneyCatalogId[] = ["advent", "no-worry", "freedom", "bible", "lent", "the-art-of-quiet"];

export const orderedJourneyList = journeyDisplayOrder.map((id) => journeyCatalog[id]);

export function journeyCadence(id: JourneyCatalogId): JourneyCadence {
  return journeyCatalog[id].cadence ?? "daily";
}
