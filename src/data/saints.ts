import sourceRecords from "./saints.json";

/**
 * Saints catalogue adapted from Torch & Lily's public saints dataset:
 * https://github.com/joshx2415/torch-data
 * Keep biographies and quotations sourced; do not add generated text here.
 */
export type Saint = {
  id: number;
  name: string;
  slug: string;
  title: string | null;
  feast_day: string;
  born_year: number | null;
  born_display: string | null;
  died_year: number | null;
  died_display: string | null;
  canonization_year: number | null;
  ranks: string[];
  patronage: string[];
  iconography: string[];
  attributes: string[];
  quotes: string[];
  bio_markdown: string;
  liturgical_rank: string | null;
};

export const saints = sourceRecords as Saint[];

export const saintGroups = [
  { id: "apostles", label: "Apostles", matches: ["Apostle"] },
  { id: "martyrs", label: "Martyrs", matches: ["Martyr"] },
  { id: "doctors", label: "Doctors of the Church", matches: ["Doctor of the Church"] },
  { id: "bishops", label: "Bishops", matches: ["Bishop"] },
  { id: "religious", label: "Monastics & religious", matches: ["Abbot", "Abbess", "Monk", "Nun", "Religious"] },
  { id: "confessors", label: "Confessors", matches: ["Confessor"] },
  { id: "other", label: "Other saints", matches: [] },
] as const;

export type SaintGroupId = (typeof saintGroups)[number]["id"];

export function saintGroupFor(saint: Saint): SaintGroupId {
  return saintGroups.find((group) => group.matches.some((rank) => saint.ranks.includes(rank)))?.id ?? "other";
}

function feastKey(month: string, day: number) {
  return `${month} ${day}`.toLocaleLowerCase("en-US");
}

export function saintsForDate(date = new Date()): Saint[] {
  const key = feastKey(date.toLocaleString("en-US", { month: "long" }), date.getDate());
  return saints
    .filter((saint) => saint.feast_day.trim().toLocaleLowerCase("en-US") === key)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function featuredSaintForDate(date = new Date()): Saint | undefined {
  const matches = saintsForDate(date);
  return matches.find((saint) => saint.quotes.length > 0) ?? matches[0];
}

export function getSaintBySlug(slug: string): Saint | undefined {
  return saints.find((saint) => saint.slug === slug);
}

export function saintNarrationText(saint: Saint): string {
  const parts = [saint.name, saint.title, `Feast day: ${saint.feast_day}.`, saint.quotes[0], saint.bio_markdown]
    .filter((part): part is string => Boolean(part?.trim()));
  return parts.join("\n\n");
}

export function saintSearchText(saint: Saint): string {
  return [saint.name, saint.title, saint.feast_day, saint.ranks.join(" "), saint.patronage.join(" "), saint.quotes.join(" "), saint.bio_markdown]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");
}

