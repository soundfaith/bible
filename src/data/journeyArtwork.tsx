import {
  Apple,
  Bird,
  BookOpen,
  Castle,
  Church,
  Compass,
  Crown,
  Cross,
  Droplets,
  Eye,
  Feather,
  Fish,
  Flame,
  Flower2,
  Globe2,
  Hammer,
  HandHeart,
  Heart,
  House,
  Lamp,
  Landmark,
  Map,
  Mountain,
  Moon,
  Music2,
  Grape,
  ScrollText,
  Shield,
  Ship,
  Sparkles,
  Star,
  Sunrise,
  Sword,
  Tent,
  TreePine,
  Users,
  Waves,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export type JourneyArtworkOption = {
  id: string;
  name: string;
  description: string;
  icons: [LucideIcon, LucideIcon, LucideIcon];
};

export const journeyArtworkOptions: Record<string, JourneyArtworkOption[]> = {
  "a-world-awakened": [
    { id: "garden-tree", name: "Garden Tree", description: "The tree of life rises at the heart of Eden.", icons: [TreePine, Flower2, Apple] },
    { id: "first-light", name: "First Light", description: "Sunlight breaks across the first waters.", icons: [Sunrise, Waves, Sparkles] },
    { id: "garden-creatures", name: "Garden Creatures", description: "Birds and living things fill the garden.", icons: [Bird, TreePine, Flower2] },
    { id: "the-ark", name: "The Ark", description: "A small ark carries life through the flood.", icons: [Ship, Waves, Bird] },
    { id: "babel-tower", name: "The Tower", description: "A city reaches upward beneath scattered stars.", icons: [Castle, House, Star] },
  ],
  "a-promise-takes-root": [
    { id: "promise-stars", name: "Promise of Stars", description: "A night sky recalls the promise to Abraham.", icons: [Star, Sparkles, Tent] },
    { id: "family-caravan", name: "Family Caravan", description: "A tent and a path mark the family's journey.", icons: [Tent, Compass, Mountain] },
    { id: "the-well", name: "The Well", description: "A meeting at the well opens a new generation.", icons: [Droplets, Flower2, Heart] },
    { id: "wrestling-through-night", name: "Wrestling through Night", description: "Jacob's struggle becomes a turning point.", icons: [Users, Moon, Star] },
    { id: "josephs-coat", name: "Joseph's Coat", description: "A richly colored robe recalls Joseph's story.", icons: [Feather, Crown, Wheat] },
  ],
  "freedom-and-belonging": [
    { id: "burning-bush", name: "The Burning Bush", description: "A flame marks Moses' call in the wilderness.", icons: [Flame, TreePine, Sparkles] },
    { id: "passover-door", name: "Passover Doorway", description: "A doorway remembers the night of deliverance.", icons: [House, Lamp, Moon] },
    { id: "sea-crossing", name: "The Sea Crossing", description: "A path opens between the waters.", icons: [Waves, Compass, Ship] },
    { id: "covenant-tablets", name: "Covenant Tablets", description: "The law is received at Mount Sinai.", icons: [BookOpen, Mountain, Sparkles] },
    { id: "moses-staff", name: "Moses' Staff", description: "A shepherd's staff recalls God's signs in Egypt.", icons: [Sword, Flame, Waves] },
  ],
  "a-kingdom-under-question": [
    { id: "manna-at-dawn", name: "Manna at Dawn", description: "Daily bread appears with the morning light.", icons: [Wheat, Sunrise, Tent] },
    { id: "the-scouts", name: "The Scouts", description: "A route leads toward the hills of Canaan.", icons: [Map, Mountain, Grape] },
    { id: "water-from-rock", name: "Water from the Rock", description: "Fresh water flows in the desert.", icons: [Mountain, Droplets, Waves] },
    { id: "bronze-serpent", name: "The Bronze Serpent", description: "A raised sign offers hope in the wilderness.", icons: [Shield, Star, Mountain] },
    { id: "moses-on-nebo", name: "Moses on Nebo", description: "Moses looks toward the land from the mountain.", icons: [Mountain, Eye, Sunrise] },
  ],
  "voices-for-the-road-home": [
    { id: "jordan-crossing", name: "Jordan Crossing", description: "A river path opens before the people.", icons: [Waves, Compass, Star] },
    { id: "jericho-walls", name: "Jericho's Walls", description: "A fortified city stands beyond the road.", icons: [Castle, Music2, Mountain] },
    { id: "stones-of-remembrance", name: "Stones of Remembrance", description: "A cairn recalls the crossing into the land.", icons: [Mountain, Landmark, Map] },
    { id: "ruth-and-naomi", name: "Ruth and Naomi", description: "Two travelers stay close on the road home.", icons: [Users, Wheat, Heart] },
    { id: "harvest-field", name: "Harvest Field", description: "Ruth gathers grain in Boaz's field.", icons: [Wheat, Flower2, Sunrise] },
  ],
  "good-news-in-a-small-town": [
    { id: "samuel-and-saul", name: "A Kingdom Begins", description: "A crown marks Israel's first king.", icons: [Crown, Lamp, Star] },
    { id: "david-and-goliath", name: "David and Goliath", description: "A shepherd's courage faces a towering foe.", icons: [Shield, Mountain, Sword] },
    { id: "jerusalem-crowned", name: "Jerusalem", description: "The city becomes the home of David's throne.", icons: [Landmark, Crown, House] },
    { id: "davidic-promise", name: "A Lasting House", description: "A royal house recalls God's promise to David.", icons: [House, Sparkles, Crown] },
    { id: "solomons-temple", name: "Solomon's Temple", description: "The temple rises above the city.", icons: [Church, Sunrise, Landmark] },
  ],
  "love-given-to-the-end": [
    { id: "kingdoms-divide", name: "A Kingdom Divides", description: "Two royal houses face separate paths.", icons: [House, Sword, Compass] },
    { id: "elijahs-fire", name: "Elijah's Fire", description: "Fire answers Elijah on Mount Carmel.", icons: [Flame, Mountain, Sparkles] },
    { id: "samaria-falls", name: "Samaria Falls", description: "The northern kingdom's fortified city is taken.", icons: [Castle, Shield, Mountain] },
    { id: "hezekiahs-prayer", name: "Hezekiah's Prayer", description: "Jerusalem stands beneath a sign of hope.", icons: [Landmark, Lamp, Star] },
    { id: "josiahs-scroll", name: "Josiah's Scroll", description: "A recovered scroll renews the covenant.", icons: [ScrollText, Crown, Sparkles] },
  ],
  "morning-beyond-the-stone": [
    { id: "tobits-journey", name: "Tobit's Journey", description: "A traveler finds help along the road.", icons: [Compass, Feather, Heart] },
    { id: "daniel-in-babylon", name: "Daniel in Babylon", description: "A faithful witness stands in a foreign court.", icons: [Shield, Crown, Lamp] },
    { id: "rivers-of-babylon", name: "Rivers of Babylon", description: "A harp remembers a home far away.", icons: [Waves, Music2, Star] },
    { id: "valley-of-bones", name: "Valley of Bones", description: "Dry ground receives the breath of new life.", icons: [Mountain, Sparkles, Sunrise] },
    { id: "exile-scroll", name: "A Faithful Scroll", description: "Words of hope are carried into exile.", icons: [ScrollText, Feather, Lamp] },
  ],
  "a-welcome-without-borders": [
    { id: "rebuilt-temple", name: "The Rebuilt Temple", description: "The temple's stones catch the morning light.", icons: [Church, Hammer, Sunrise] },
    { id: "jerusalem-wall", name: "Jerusalem's Wall", description: "A rebuilt wall surrounds the returning city.", icons: [Castle, Hammer, Shield] },
    { id: "esthers-courage", name: "Esther's Courage", description: "A queen risks everything for her people.", icons: [Crown, Heart, Star] },
    { id: "law-read-aloud", name: "The Law Read Aloud", description: "A scroll gathers the community to listen.", icons: [ScrollText, Users, Lamp] },
    { id: "homecoming-road", name: "The Road Home", description: "The return journey leads toward Jerusalem.", icons: [Compass, Mountain, Sunrise] },
  ],
  "the-maccabean-resistance": [
    { id: "maccabean-resistance", name: "Resistance", description: "A raised sword stands for faithful resistance.", icons: [Sword, Shield, Mountain] },
    { id: "temple-lamp", name: "The Temple Lamp", description: "A lamp burns again in the sanctuary.", icons: [Lamp, Church, Sparkles] },
    { id: "family-of-witnesses", name: "A Family's Witness", description: "A family holds fast to faith under pressure.", icons: [Users, Shield, Heart] },
    { id: "rededicated-altar", name: "The Rededicated Altar", description: "The altar is restored for worship.", icons: [Flame, Landmark, Sunrise] },
    { id: "scroll-and-sword", name: "Scroll and Sword", description: "Covenant and courage meet in a time of trial.", icons: [BookOpen, Sword, Star] },
  ],
  "learning-to-be-one-body": [
    { id: "annunciation-star", name: "The Annunciation", description: "A bright star marks the promise given to Mary.", icons: [Star, Feather, Heart] },
    { id: "bethlehem-night", name: "Bethlehem Night", description: "A child is born beneath a guiding star.", icons: [Sparkles, Star, House] },
    { id: "teaching-by-the-water", name: "Teaching by the Water", description: "Jesus teaches beside the shore.", icons: [BookOpen, Waves, Fish] },
    { id: "healing-and-mercy", name: "Healing and Mercy", description: "A gesture of care restores the brokenhearted.", icons: [HandHeart, Heart, Flower2] },
    { id: "empty-tomb", name: "The Empty Tomb", description: "First light falls on the place where Jesus was laid.", icons: [Cross, Sunrise, Sparkles] },
  ],
  "the-story-in-our-hands": [
    { id: "pentecost-flame", name: "Pentecost", description: "Flames recall the Spirit's arrival.", icons: [Flame, Users, Sparkles] },
    { id: "shared-table", name: "A Shared Life", description: "The first believers gather in fellowship.", icons: [Users, Heart, House] },
    { id: "philip-and-the-road", name: "The Road to Ethiopia", description: "Philip meets a traveler on the desert road.", icons: [Compass, BookOpen, Feather] },
    { id: "pauls-voyage", name: "Paul's Voyage", description: "A ship carries the good news across the sea.", icons: [Ship, Waves, Star] },
    { id: "good-news-to-all", name: "Good News to All", description: "A globe points to the Church's continuing mission.", icons: [Globe2, Church, Sparkles] },
  ],
};

export const journeyArtworkAliases: Record<string, string> = {
  "a-future-worth-living-toward": "learning-to-be-one-body",
};

export function getJourneyArtworkOptions(periodId: string) {
  const canonicalId = journeyArtworkAliases[periodId] ?? periodId;
  return journeyArtworkOptions[canonicalId] ?? [];
}

export function resolveJourneyPeriodId(periodId: string | null) {
  return periodId ? journeyArtworkAliases[periodId] ?? periodId : null;
}

export function resolveJourneyArtwork(periodId: string, optionId?: string) {
  const options = getJourneyArtworkOptions(periodId);
  return options.find((option) => option.id === optionId) ?? options[0];
}

export const JOURNEY_ARTWORK_STORAGE_KEY = "soundfaith-bible-journey-artwork-v1";

export function loadJourneyArtworkSelections() {
  try {
    const stored = window.localStorage.getItem(JOURNEY_ARTWORK_STORAGE_KEY);
    if (!stored) return { selections: {} as Record<string, string>, storageError: false };
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { selections: {} as Record<string, string>, storageError: true };
    }
    const selections: Record<string, string> = {};
    let storageError = false;
    for (const [periodId, optionId] of Object.entries(parsed)) {
      const options = getJourneyArtworkOptions(periodId);
      if (typeof optionId !== "string" || !options.some((option) => option.id === optionId)) {
        storageError = true;
        continue;
      }
      selections[resolveJourneyPeriodId(periodId)!] = optionId;
    }
    return { selections, storageError };
  } catch {
    return { selections: {} as Record<string, string>, storageError: true };
  }
}

export function saveJourneyArtworkSelections(selections: Record<string, string>) {
  const validSelections = Object.fromEntries(
    Object.entries(selections).filter(([periodId, optionId]) =>
      getJourneyArtworkOptions(periodId).some((option) => option.id === optionId),
    ),
  );
  try {
    window.localStorage.setItem(JOURNEY_ARTWORK_STORAGE_KEY, JSON.stringify(validSelections));
    return true;
  } catch {
    return false;
  }
}
