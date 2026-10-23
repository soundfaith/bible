export type SummaPart = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

export type SummaObjection = { n: number; text: string };
export type SummaReply = { n: number; text: string };

export type SummaArticle = {
  id: number;
  question_id: number;
  number: number;
  title: string;
  slug: string;
  objections: SummaObjection[];
  sed_contra: string;
  respondeo: string;
  replies: SummaReply[];
};

export type SummaQuestion = {
  id: number;
  part_id: number;
  number: number;
  title: string;
  slug: string;
  articles: SummaArticle[];
};

export type SummaDataset = {
  parts: SummaPart[];
  questions: SummaQuestion[];
};

let datasetPromise: Promise<SummaDataset> | null = null;

async function readCompressedJson<T>(filename: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/summa/${filename}`);
  if (!response.ok || !response.body) {
    throw new Error(`Could not load ${filename}.`);
  }

  const bytes = await response.arrayBuffer();
  const signature = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 2));
  const isGzip = signature[0] === 0x1f && signature[1] === 0x8b;
  if (!isGzip) return await new Response(bytes).json() as T;
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Compressed reading is not supported in this browser.");
  }

  const decompressed = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(decompressed).json() as T;
}

async function loadDataset(): Promise<SummaDataset> {
  const [parts, questionRows, articles] = await Promise.all([
    readCompressedJson<SummaPart[]>("summa_parts.json.gz"),
    readCompressedJson<Omit<SummaQuestion, "articles">[]>("summa_questions.json.gz"),
    readCompressedJson<SummaArticle[]>("summa_articles.json.gz"),
  ]);

  const articlesByQuestion = new Map<number, SummaArticle[]>();
  for (const article of articles) {
    const questionArticles = articlesByQuestion.get(article.question_id) ?? [];
    questionArticles.push(article);
    articlesByQuestion.set(article.question_id, questionArticles);
  }

  const questions = questionRows.map((question) => ({
    ...question,
    articles: (articlesByQuestion.get(question.id) ?? []).sort((a, b) => a.number - b.number),
  }));

  return {
    parts: [...parts].sort((a, b) => a.sort_order - b.sort_order),
    questions,
  };
}

export function loadSummaData() {
  datasetPromise ??= loadDataset().catch((error: unknown) => {
    datasetPromise = null;
    throw error;
  });
  return datasetPromise;
}

export function summaQuestionHref(partSlug: string, questionNumber: number) {
  return `#/summa/${encodeURIComponent(partSlug)}/q-${questionNumber}`;
}

export function summaArticleHref(partSlug: string, questionNumber: number, articleNumber: number) {
  return `${summaQuestionHref(partSlug, questionNumber)}/a-${articleNumber}`;
}
