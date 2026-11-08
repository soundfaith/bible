export type JourneyCatalogId = "no-worry" | "bible" | "advent" | "lent";
export type AvailableJourneyId = "no-worry" | "bible";

export type JourneyCatalogEntry = {
  id: JourneyCatalogId;
  title: string;
  description: string;
  artwork: "journey" | "bible-journey";
  available: boolean;
};

export const journeyCatalog: Record<JourneyCatalogId, JourneyCatalogEntry> = {
  "no-worry": {
    id: "no-worry",
    title: "15-Day No-Worry Journey",
    description: "Fifteen days of Scripture, reflection, and prayer for a more trusting heart.",
    artwork: "journey",
    available: true,
  },
  bible: {
    id: "bible",
    title: "Bible Journey",
    description: "Walk through the story of salvation, one period at a time.",
    artwork: "bible-journey",
    available: true,
  },
  advent: {
    id: "advent",
    title: "Advent Journey",
    description: "Prepare your heart for the coming of Christ.",
    artwork: "journey",
    available: false,
  },
  lent: {
    id: "lent",
    title: "Lent Journey",
    description: "Walk with Jesus through prayer, fasting, and almsgiving.",
    artwork: "journey",
    available: false,
  },
};

export const journeyList = Object.values(journeyCatalog);
