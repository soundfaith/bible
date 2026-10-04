import { bibleBooks } from "./bible";

export function narrationAudioUrlsFor(bookId: string, chapter: number): string[] {
  const book = bibleBooks.find((item) => item.id === bookId);
  if (!book) return [];
  return [book.narrationAudioBaseUrl, book.narrationAudioFallbackBaseUrl]
    .filter((baseUrl): baseUrl is string => Boolean(baseUrl))
    .map((baseUrl) => `${baseUrl.replace(/\/$/, "")}/${chapter}.mp3`);
}
