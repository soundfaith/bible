import massReadings from "../data/mass-readings.json";
import { bibleBooks, getBook, type BibleVerse } from "./bible";

type MassReading = { reference: string; text: string };
export type MassEntry = { date: string; season: string; readings: Record<string, MassReading> };

const entries = massReadings.entries as Record<string, MassEntry>;
export function getAvailableMassReadingDates() { return Object.keys(entries).sort(); }
export function getMassReadingForDate(date: string) { return entries[date] ?? null; }

export function getTodaysMassReading(date = new Date()) {
  const target = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (entries[target]) return entries[target];
  const fallback = Object.keys(entries).filter((key) => key <= target).sort().pop();
  return fallback ? entries[fallback] : entries[Object.keys(entries).sort()[0]];
}

function findBook(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "psalm" || normalized === "psalms") return bibleBooks.find((book) => book.id === "psalms");
  return bibleBooks.find((book) => book.name.toLowerCase().replace(/\s+/g, "_") === normalized);
}

export function resolveReference(reference: string) {
  const match = reference.replace(/[—–]/g, "-").match(/^(.+?)\s+(\d+):(.*)$/);
  if (!match) return [] as BibleVerse[];
  const book = findBook(match[1]);
  if (!book) return [] as BibleVerse[];
  const chapter = Number(match[2]);
  const ranges = match[3].match(/\d+[a-z]?(?:-\d+[a-z]?)?/g) ?? [];
  const wanted = new Set<number>();
  ranges.forEach((range) => { const [startText, endText] = range.split("-"); const start = Number(startText.replace(/\D/g, "")); const end = Number((endText || startText).replace(/\D/g, "")); for (let verse = start; verse <= end; verse += 1) wanted.add(verse); });
  return getBook(book.id).verses.filter((verse) => verse.chapter === chapter && wanted.has(verse.verse));
}

export function referenceLabel(reference: string) { return reference.replace(/^Psalm\b/, "Psalms"); }
