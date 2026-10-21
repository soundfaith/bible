import records from "./saints-daily.json";

export type SaintPreview = {
  name: string;
  slug: string;
  title: string | null;
  feast_day: string;
  quotes: string[];
};

const dailySaints = records as SaintPreview[];

export function featuredSaintForDate(date = new Date()): SaintPreview | undefined {
  const month = date.toLocaleString("en-US", { month: "long" });
  const feastDay = `${month} ${date.getDate()}`.toLocaleLowerCase("en-US");
  const matches = dailySaints
    .filter((saint) => saint.feast_day.trim().toLocaleLowerCase("en-US") === feastDay)
    .sort((a, b) => a.name.localeCompare(b.name));
  return matches.find((saint) => saint.quotes.some((quote) => quote.trim())) ?? matches[0];
}

export function hasSaintSlug(slug: string): boolean {
  return dailySaints.some((saint) => saint.slug === slug);
}
