import { bibleBooks, getBook } from "../bible";

export type ChatVerse = { ref: string; why?: string };
export type ChatTopic = {
  id: string;
  title: string;
  category: string;
  tier?: number;
  intro: string;
  phrasings: string[];
  verses: ChatVerse[];
  related: string[];
};
type RawTopic = Omit<ChatTopic, "verses" | "related"> & { verses: Array<string | ChatVerse>; related?: string[] };

const modules = import.meta.glob("../../data/chat/topics/*.json", { eager: true, import: "default" }) as Record<string, RawTopic[]>;

export const chatTopics: ChatTopic[] = Object.values(modules).flat().map((topic) => ({
  ...topic,
  verses: topic.verses.map((verse) => (typeof verse === "string" ? { ref: verse } : verse)),
  related: topic.related ?? []
}));
const topicsById = new Map(chatTopics.map((topic) => [topic.id, topic]));
export const getTopic = (id: string) => topicsById.get(id);

export type PassageRef = { bookId: string; bookName: string; chapter: number; start: number; end: number };

export function parseRef(ref: string): PassageRef | null {
  const match = ref.replace(/^Psalm /, "Psalms ").match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const book = bibleBooks.find((item) => item.name.toLowerCase() === match[1].toLowerCase());
  if (!book) return null;
  const start = Number(match[3]);
  return { bookId: book.id, bookName: book.name, chapter: Number(match[2]), start, end: Number(match[4] ?? start) };
}

export function passageText(passage: PassageRef) {
  return getBook(passage.bookId).verses
    .filter((verse) => verse.chapter === passage.chapter && verse.verse >= passage.start && verse.verse <= passage.end)
    .map((verse) => verse.text)
    .join(" ");
}

export function passageLabel(passage: PassageRef) {
  return `${passage.bookName} ${passage.chapter}:${passage.start}${passage.end > passage.start ? `-${passage.end}` : ""}`;
}
