import { noWorryJourney } from "../data/noWorryJourney";
import { buildRosarySequence } from "../data/rosary";
import { bibleBooks, getChapterCount } from "./bible";
import { catechismEditions, catechismGroupHref, type CatechismEdition, type CatechismGroup } from "./catechism";
import { loadSummaData, loadedSummaData, summaArticleHref, summaQuestionHref, type SummaArticle, type SummaPart, type SummaQuestion } from "./summa";
import type { NarrationTrack } from "../components/NarratorButton";

export type PlaylistItem = { text: string; track: NarrationTrack };

export function noWorryItem(day: number): PlaylistItem | null {
  const entry = noWorryJourney[day - 1];
  if (!entry) return null;
  const path = `#/journeys/no-worry/${day}`;
  return {
    text: [entry.scripture, entry.reference, entry.reflection, entry.prayer].join("\n\n"),
    track: { title: `Day ${day} – No-Worry Journey`, path, art: "journey", sequence: { kind: "no-worry", day }, next: day < noWorryJourney.length ? { title: `Day ${day + 1} – No-Worry Journey`, path: `#/journeys/no-worry/${day + 1}` } : undefined },
  };
}

export function catechismItem(edition: CatechismEdition, group: CatechismGroup): PlaylistItem {
  const lessons = edition.groups.filter((item) => item.kind === "lesson");
  const next = lessons[lessons.findIndex((item) => item.id === group.id) + 1];
  const title = displayLessonTitle(group.title);
  return {
    text: [`${title}.`, ...group.questions.map((question) => `Question ${question.number}. ${question.question}\n${question.answer.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).join("\n")}`)].join("\n\n"),
    track: { title, path: catechismGroupHref(edition.number, group.id), art: "catechism", sequence: { kind: "catechism", edition: edition.number, groupId: group.id }, next: next ? { title: `Lesson ${next.number}: ${displayLessonTitle(next.title)}`, path: catechismGroupHref(edition.number, next.id) } : undefined },
  };
}

export function displayLessonTitle(title: string) {
  const minorWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "nor", "of", "on", "or", "the", "to", "with"]);
  let firstWord = true;
  return title.toLocaleLowerCase("en-US").split(/(\s+)/).map((part) => {
    if (!part.trim()) return part;
    return part.split(/(-)/).map((segment) => {
      if (segment === "-") return segment;
      const word = segment.match(/^([^a-z0-9]*)([a-z0-9])(.*)$/i);
      if (!word) return segment;
      const [, punctuation, initial, rest] = word;
      const lowerCaseWord = !firstWord && minorWords.has(`${initial}${rest}`.toLocaleLowerCase("en-US"));
      firstWord = false;
      return `${punctuation}${lowerCaseWord ? initial.toLocaleLowerCase("en-US") : initial.toLocaleUpperCase("en-US")}${rest}`;
    }).join("");
  }).join("");
}

function summaArticleText(article: SummaArticle) {
  const plain = (text: string) => text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph) => paragraph.replace(/\*+/g, "")).join("\n");
  return [
    `Article ${article.number}. ${article.title}.`,
    ...(article.objections.length ? ["The objections."] : []),
    ...article.objections.map((objection) => `Objection ${objection.n}. ${plain(objection.text)}`),
    ...(article.sed_contra ? ["On the contrary.", plain(article.sed_contra)] : []),
    ...(article.respondeo ? ["I answer that.", plain(article.respondeo)] : []),
    ...(article.replies.length ? ["Replies to the objections."] : []),
    ...article.replies.map((reply) => `Reply to objection ${reply.n}. ${plain(reply.text)}`),
  ].join("\n\n");
}

export function summaItem(part: SummaPart, question: SummaQuestion, article: SummaArticle, next?: { question: SummaQuestion; article: SummaArticle }): PlaylistItem {
  return {
    text: `${question.title}. ${summaArticleText(article)}`,
    track: { title: `Article ${article.number}: ${article.title}`, path: summaArticleHref(part.slug, question.number, article.number), art: "summa", sequence: { kind: "summa", partSlug: part.slug, question: question.number, article: article.number }, next: next ? { title: `Article ${next.article.number}: ${next.article.title}`, path: summaArticleHref(part.slug, next.question.number, next.article.number) } : undefined },
  };
}

// One episode per question: every article of the question plays in sequence.
export function summaQuestionItem(part: SummaPart, question: SummaQuestion, next?: SummaQuestion): PlaylistItem {
  return {
    text: [`${question.title}.`, ...question.articles.map(summaArticleText)].join("\n\n"),
    track: { title: `Question ${question.number}: ${question.title}`, path: summaQuestionHref(part.slug, question.number), art: "summa", sequence: { kind: "summa", partSlug: part.slug, question: question.number }, next: next ? { title: `Question ${next.number}: ${next.title}`, path: summaQuestionHref(part.slug, next.number) } : undefined },
  };
}

export function summaQuestionsInPart(questions: SummaQuestion[], partId: number) {
  return questions.filter((item) => item.part_id === partId && item.articles.length).sort((a, b) => a.number - b.number);
}

export function nextSummaArticle(questions: SummaQuestion[], question: SummaQuestion, article: SummaArticle) {
  const next = question.articles[question.articles.indexOf(article) + 1];
  if (next) return { question, article: next };
  const nextQuestion = questions.filter((item) => item.part_id === question.part_id && item.number > question.number && item.articles.length).sort((a, b) => a.number - b.number)[0];
  return nextQuestion ? { question: nextQuestion, article: nextQuestion.articles[0] } : undefined;
}


export type SeriesEntry = { label: string; path: string; done: boolean; current: boolean; playIndex?: number };
export type SeriesInfo = { title: string; entries: SeriesEntry[] };

export function seriesFor(track: NarrationTrack): SeriesInfo | null {
  const sequence = track.sequence;
  if (sequence?.kind === "no-worry") {
    return { title: "No-Worry Journey", entries: noWorryJourney.map((_, index) => {
      const day = index + 1;
      return { label: `Day ${day}`, path: `#/journeys/no-worry/${day}`, done: day < sequence.day, current: day === sequence.day };
    }) };
  }
  if (sequence?.kind === "rosary") {
    const { segments, clips } = buildRosarySequence(sequence.mode, sequence.mysteryIndex);
    const currentSegment = clips[sequence.clipIndex]?.segmentIndex ?? -1;
    // Rosary episodes play within the open page, so each entry starts its episode instead of navigating.
    return { title: "Rosary", entries: segments.map((segment, index) => ({ label: segment.title, path: "", done: index < currentSegment, current: index === currentSegment, playIndex: index })) };
  }
  if (sequence?.kind === "summa") {
    const data = loadedSummaData();
    const part = data?.parts.find((item) => item.slug === sequence.partSlug);
    if (!data || !part) return null;
    return { title: part.name, entries: summaQuestionsInPart(data.questions, part.id).map((question) => ({
      label: `Question ${question.number}: ${question.title}`,
      path: summaQuestionHref(part.slug, question.number),
      done: question.number < sequence.question,
      current: question.number === sequence.question,
    })) };
  }
  if (sequence?.kind === "catechism") {
    const edition = catechismEditions.find((item) => item.number === sequence.edition);
    if (!edition) return null;
    const lessons = edition.groups.filter((item) => item.kind === "lesson");
    const currentIndex = lessons.findIndex((item) => item.id === sequence.groupId);
    return { title: "Catechism lessons", entries: lessons.map((lesson, index) => ({
      label: `${lesson.number}. ${displayLessonTitle(lesson.title)}`,
      path: catechismGroupHref(edition.number, lesson.id),
      done: currentIndex >= 0 && index < currentIndex,
      current: index === currentIndex,
    })) };
  }
  if (track.path.startsWith("#/read?")) {
    const query = new URLSearchParams(track.path.split("?")[1] ?? "");
    const book = bibleBooks.find((item) => item.id === query.get("book"));
    const chapter = Number(query.get("chapter"));
    if (!book || !Number.isInteger(chapter)) return null;
    return { title: book.name, entries: Array.from({ length: getChapterCount(book.id) }, (_, index) => {
      const number = index + 1;
      return { label: `${book.name} ${number}`, path: `#/read?book=${encodeURIComponent(book.id)}&chapter=${number}`, done: number < chapter, current: number === chapter };
    }) };
  }
  return null;
}

export async function previousPlaylistItem(track: NarrationTrack): Promise<PlaylistItem | null> {
  const sequence = track.sequence;
  if (sequence?.kind === "no-worry") return sequence.day > 1 ? noWorryItem(sequence.day - 1) : null;
  if (sequence?.kind === "catechism") {
    const edition = catechismEditions.find((item) => item.number === sequence.edition);
    const lessons = edition?.groups.filter((item) => item.kind === "lesson") ?? [];
    const index = lessons.findIndex((item) => item.id === sequence.groupId);
    return edition && index > 0 ? catechismItem(edition, lessons[index - 1]) : null;
  }
  if (sequence?.kind === "summa" && sequence.article === undefined) {
    const data = await loadSummaData();
    const part = data.parts.find((item) => item.slug === sequence.partSlug);
    if (!part) return null;
    const questions = summaQuestionsInPart(data.questions, part.id);
    const index = questions.findIndex((item) => item.number === sequence.question);
    return index > 0 ? summaQuestionItem(part, questions[index - 1], questions[index]) : null;
  }
  return null;
}

export async function nextPlaylistItem(track: NarrationTrack): Promise<PlaylistItem | null> {
  const sequence = track.sequence;
  if (sequence?.kind === "no-worry") return noWorryItem(sequence.day + 1);
  if (sequence?.kind === "catechism") {
    const edition = catechismEditions.find((item) => item.number === sequence.edition);
    const lessons = edition?.groups.filter((item) => item.kind === "lesson") ?? [];
    const index = lessons.findIndex((item) => item.id === sequence.groupId);
    const group = edition?.groups.find((item) => item.id === sequence.groupId);
    const next = index >= 0 ? lessons[index + 1] : group?.kind === "preliminary" ? lessons[0] : undefined;
    return edition && next ? catechismItem(edition, next) : null;
  }
  if (sequence?.kind === "summa") {
    const data = await loadSummaData();
    const part = data.parts.find((item) => item.slug === sequence.partSlug);
    if (sequence.article === undefined) {
      const questions = part ? summaQuestionsInPart(data.questions, part.id) : [];
      const index = questions.findIndex((item) => item.number === sequence.question);
      if (!part || index < 0 || index + 1 >= questions.length) return null;
      return summaQuestionItem(part, questions[index + 1], questions[index + 2]);
    }
    const question = part && data.questions.find((item) => item.part_id === part.id && item.number === sequence.question);
    const article = question?.articles.find((item) => item.number === sequence.article);
    if (!part || !question || !article) return null;
    const next = nextSummaArticle(data.questions, question, article);
    return next ? summaItem(part, next.question, next.article, nextSummaArticle(data.questions, next.question, next.article)) : null;
  }
  return null;
}

