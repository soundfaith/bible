import { bibleBooks, getBook } from "../bible";

export type VerseHit = { ref: string; bookId: string; chapter: number; verse: number };

const STOPWORDS = new Set((
  "a an and are as at be been being but by can could did do does for from had has have how i if in is it its me my of on or our " +
  "should so than that the their them then there these they this those to us was we were what when where which who whom why will with would you your " +
  "about tell say says said mean means meaning bible biblical verse verses scripture scriptures catholic explain explained please know want need " +
  "really exactly actually any some more most much many other another"
).split(" "));

const MIN_QUERY_LENGTH = 3;
const MAX_RARE_DF = 60;
const MAX_RESULTS = 5;

type Index = { words: Map<string, number[]>; verses: { bookId: string; name: string; chapter: number; verse: number; text: string }[] };
let cached: Index | undefined;

export function stem(word: string) {
  let value = word.toLowerCase().replace(/[’']s$/, "");
  if (value.length > 4 && value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.length > 3 && value.endsWith("s") && !value.endsWith("ss")) value = value.slice(0, -1);
  return value;
}

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s’']/g, " ").split(/\s+/).filter(Boolean);
}

function buildIndex(): Index {
  const verses: Index["verses"] = [];
  const words = new Map<string, number[]>();
  for (const book of bibleBooks) {
    for (const item of getBook(book.id).verses) {
      const position = verses.length;
      verses.push({ bookId: book.id, name: book.name, chapter: item.chapter, verse: item.verse, text: item.text });
      for (const token of new Set(tokenize(item.text).map(stem))) {
        const list = words.get(token);
        if (list) list.push(position);
        else words.set(token, [position]);
      }
    }
  }
  return { words, verses };
}

export function keywordsOf(query: string) {
  return [...new Set(tokenize(query).filter((word) => !STOPWORDS.has(word) && word.length > 1).map(stem))];
}

/** Finds verses that contain the rare, specific words of a question (for topics we have no curated answer for). */
export function searchVerses(query: string): { keyword: string; hits: VerseHit[] } | null {
  const keywords = keywordsOf(query);
  if (!keywords.length || query.trim().length < MIN_QUERY_LENGTH) return null;
  cached ??= buildIndex();
  const { words, verses } = cached;
  const known = keywords.map((word) => ({ word, list: words.get(word) })).filter((item): item is { word: string; list: number[] } => !!item.list);
  const needed = keywords.length <= 3 ? keywords.length : Math.ceil((keywords.length * 2) / 3);
  if (known.length < needed) return null;
  const rarest = known.reduce((best, item) => (item.list.length < best.list.length ? item : best));
  if (rarest.list.length > MAX_RARE_DF) return null;

  const total = verses.length;
  const weights = new Map(known.map((item) => [item.word, Math.log(total / item.list.length)]));
  const scored = rarest.list.map((position) => {
    const tokens = new Set(tokenize(verses[position].text).map(stem));
    const score = known.reduce((sum, item) => sum + (tokens.has(item.word) ? weights.get(item.word)! : 0), 0);
    return { position, score: score - verses[position].text.length / 4000 };
  }).sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);

  const original = tokenize(query).find((token) => stem(token) === rarest.word) ?? rarest.word;
  return {
    keyword: original,
    hits: scored.map(({ position }) => {
      const verse = verses[position];
      return { ref: `${verse.name} ${verse.chapter}:${verse.verse}`, bookId: verse.bookId, chapter: verse.chapter, verse: verse.verse };
    })
  };
}
