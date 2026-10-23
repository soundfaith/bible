import data from "../data/catechism.json";

export type CatechismQuestion = {
  id: string;
  number: number;
  question: string;
  answer: string;
  torchLilyId?: number;
  torchLilyTextMatches?: boolean;
  sourceAnnotation?: string;
  parallelNo2Question?: number;
  sourceNote?: string;
};

export type CatechismGroup = {
  id: string;
  kind: "preliminary" | "lesson";
  number: number | null;
  title: string;
  printedHeading?: string;
  torchLilyId?: number;
  torchLilyTitle?: string;
  questions: CatechismQuestion[];
};

export type CatechismEdition = {
  number: number;
  id: string;
  title: string;
  audience: string;
  gutenbergEbookId: number;
  sourceUrl: string;
  note: string | null;
  questionCount: number;
  lessonCount: number;
  groups: CatechismGroup[];
};

export type CatechismDataset = {
  schemaVersion: number;
  title: string;
  context: string;
  sources: { torchLily: string; fullTextCollection: string; attribution: string; rightsNote: string };
  editions: CatechismEdition[];
};

export const catechismData = data as CatechismDataset;
export const catechismEditions = catechismData.editions;

export function catechismQuestion(editionNumber: number, questionNumber: number) {
  const edition = catechismEditions.find((item) => item.number === editionNumber);
  if (!edition) return undefined;
  for (const group of edition.groups) {
    const question = group.questions.find((item) => item.number === questionNumber);
    if (question) return { edition, group, question };
  }
  return undefined;
}

export function catechismQuestionHref(editionNumber: number, questionNumber: number) {
  return `#/catechism/${editionNumber}/q-${questionNumber}`;
}

export function catechismGroupHref(editionNumber: number, groupId: string) {
  return `#/catechism/${editionNumber}/${encodeURIComponent(groupId)}`;
}
