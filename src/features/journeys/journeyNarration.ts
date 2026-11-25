import { findBook, resolveReference } from "@/features/mass-readings/readings";
import type { JourneyStory } from "./bibleJourney";

export function journeyStoryNarration(story: JourneyStory) {
  const sections = [story.title];
  const seen = new Set<string>();
  for (const reference of story.references) {
    const match = reference.replace(/[—–]/g, "-").match(/^(.+?)\s+(\d+):/);
    const book = match && findBook(match[1]);
    if (!match || !book) throw new Error(`Could not resolve journey narration reference: ${reference}`);
    const verses = resolveReference(reference);
    if (!verses.length) throw new Error(`No verses found for journey narration: ${reference}`);
    const text = verses.filter((verse) => {
      const key = `${book.id}:${verse.chapter}:${verse.verse}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(verse.text.trim());
    }).map((verse) => verse.text.trim()).join(" ");
    if (text) sections.push(`${book.name}, chapter ${Number(match[2])}. ${text}`);
  }
  return sections.join("\n\n");
}
