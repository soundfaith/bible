import booksIndex from "../data/index.json";

export type BibleVerse = { chapter: number; verse: number; paragraph: number; poetry: boolean; text: string };
export type BibleBook = { id: string; name: string; abbreviation: string; translation: string; source: string; verses: BibleVerse[] };
export type BibleBookSummary = (typeof booksIndex.books)[number] & { narrationAudioBaseUrl?: string };
const dataModules = import.meta.glob("../data/*.json", { eager: true, import: "default" }) as Record<string, BibleBook | typeof booksIndex>;
export const bibleBooks = booksIndex.books as BibleBookSummary[];
export function getBook(bookId: string) { return dataModules[`../data/${bookId}.json`] as BibleBook; }
export function getChapter(bookId: string, chapter: number) { return getBook(bookId).verses.filter((verse) => verse.chapter === chapter); }
export function getChapterCount(bookId: string) { return Math.max(...getBook(bookId).verses.map((verse) => verse.chapter)); }
export function getParagraphs(verses: BibleVerse[]) { return verses.reduce<Array<{ id: number; verses: BibleVerse[] }>>((paragraphs, verse) => { const current = paragraphs[paragraphs.length - 1]; if (!current || current.id !== verse.paragraph) paragraphs.push({ id: verse.paragraph, verses: [verse] }); else current.verses.push(verse); return paragraphs; }, []); }
