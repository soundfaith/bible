import { bibleBooks, getBook } from "./bible";

type Request = { query: string; sequence: number };
type Result = { bookId: string; chapter: number; verse: number; label: string; text: string };

const verses = bibleBooks.flatMap((book) => getBook(book.id).verses.map((verse) => ({
  bookId: book.id,
  chapter: verse.chapter,
  verse: verse.verse,
  label: `${book.name} ${verse.chapter}:${verse.verse}`,
  text: verse.text,
  normalized: verse.text.toLowerCase(),
  words: verse.text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
})));

function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}

self.onmessage = (event: MessageEvent<Request>) => {
  const query = event.data.query.toLowerCase();
  let results: Result[] = verses.filter((verse) => verse.normalized.includes(query)).slice(0, 18);
  if (!results.length && query.length >= 3) {
    const words = query.split(/\s+/).filter(Boolean);
    const threshold = words.reduce((sum, word) => sum + Math.max(1, Math.floor(word.length * 0.28)), 0);
    const distances = new Map<string, number>();
    const ranked = verses.map((verse) => {
      const score = words.reduce((sum, word) => {
        let best = word.length;
        for (const candidate of verse.words) {
          const key = `${word}\0${candidate}`;
          let distance = distances.get(key);
          if (distance === undefined) {
            distance = candidate.startsWith(word) ? 0 : editDistance(word, candidate);
            distances.set(key, distance);
          }
          if (distance < best) best = distance;
          if (best === 0) break;
        }
        return sum + best;
      }, 0);
      return { verse, score };
    }).filter(({ score }) => score <= threshold).sort((a, b) => a.score - b.score).slice(0, 18);
    results = ranked.map(({ verse }) => verse);
  }
  self.postMessage({ sequence: event.data.sequence, results });
};
