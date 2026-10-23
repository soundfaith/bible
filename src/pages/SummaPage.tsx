import { ArrowLeft, ArrowRight, BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  loadSummaData,
  summaArticleHref,
  summaQuestionHref,
  type SummaArticle,
  type SummaDataset,
  type SummaPart,
  type SummaQuestion,
} from "../lib/summa";

type Address = { partSlug: string | null; questionNumber: number | null; articleNumber: number | null };

function readAddress(): Address {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  const [, partSlug, questionNumber, articleNumber] = path.match(/^summa(?:\/([^/]+)(?:\/q-(\d+)(?:\/a-(\d+))?)?)?$/) ?? [];
  let decodedPartSlug = partSlug ?? null;
  if (decodedPartSlug) {
    try { decodedPartSlug = decodeURIComponent(decodedPartSlug); } catch { /* use the literal hash segment */ }
  }
  return {
    partSlug: decodedPartSlug,
    questionNumber: questionNumber ? Number(questionNumber) : null,
    articleNumber: articleNumber ? Number(articleNumber) : null,
  };
}

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function formatInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function TextParagraphs({ text }: { text: string }) {
  return <>{splitParagraphs(text).map((paragraph, index) => <p key={index}>{formatInline(paragraph)}</p>)}</>;
}

function partQuestionCount(data: SummaDataset, part: SummaPart) {
  return data.questions.filter((question) => question.part_id === part.id).length;
}

function partArticleCount(data: SummaDataset, part: SummaPart) {
  return data.questions.filter((question) => question.part_id === part.id)
    .reduce((count, question) => count + question.articles.length, 0);
}

function attribution() {
  return <footer className="summa-attribution">
    Text and structure from the <a href="https://github.com/joshx2415/torch-data" target="_blank" rel="noreferrer">Torch &amp; Lily open data</a>.
    The English translation is in the public domain. Visit <a href="https://torchandlily.com" target="_blank" rel="noreferrer">Torch &amp; Lily</a>.
  </footer>;
}

function SummaLibrary({ data, selectedPart }: { data: SummaDataset; selectedPart: SummaPart | undefined }) {
  const [query, setQuery] = useState("");
  const partQuestions = useMemo(() => selectedPart
    ? data.questions.filter((question) => question.part_id === selectedPart.id)
    : [], [data.questions, selectedPart]);
  const filteredQuestions = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-US");
    if (!search) return partQuestions;
    return partQuestions.filter((question) => {
      const text = `question ${question.number} ${question.title} ${question.articles.map((article) => article.title).join(" ")}`;
      return text.toLocaleLowerCase("en-US").includes(search);
    });
  }, [partQuestions, query]);
  const questionCount = data.questions.length;
  const articleCount = data.questions.reduce((count, question) => count + question.articles.length, 0);

  return <>
    <header className="journey-heading catechism-library-hero summa-library-hero">
      <div className="journey-heading-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> A guide to sacred doctrine</p>
        <h1>Summa <em>Theologiae.</em></h1>
        <p className="journey-intro">Read the work of St. Thomas Aquinas by part, question, and article. Follow each article through its objections, the contrary authority, Aquinas’s response, and replies.</p>
        <div className="catechism-context"><BookOpen size={18} aria-hidden="true" /><span>Explore five parts, {questionCount.toLocaleString()} questions, and {articleCount.toLocaleString()} articles. Article links can be shared directly.</span></div>
      </div>
    </header>

    <section className="journey-library summa-parts" aria-labelledby="summa-parts-title">
      <div className="journey-library-heading">
        <div>
          <p className="eyebrow">The structure of the work</p>
          <h2 id="summa-parts-title">Choose a part.</h2>
        </div>
        <p>Begin with a division of the Summa, then browse its questions and articles.</p>
      </div>
      <ol className="journey-library-list catechism-edition-list summa-part-grid">
        {data.parts.map((part, index) => <li className="journey-library-item" key={part.id}>
          <a className="journey-library-card summa-part-card" href={`#/summa/${encodeURIComponent(part.slug)}`}>
            <span className="summa-part-mark"><BookOpen size={22} aria-hidden="true" /></span>
            <span className="journey-library-copy">
              <span className="journey-period-label"><span>Part {index + 1}</span></span>
              <strong>{part.name}</strong>
              <span className="journey-library-teaser">Aquinas’s questions and articles, in their original order.</span>
              <span className="journey-library-meta">{partQuestionCount(data, part)} questions · {partArticleCount(data, part)} articles <ArrowRight size={14} aria-hidden="true" /></span>
            </span>
          </a>
        </li>)}
      </ol>
    </section>

    {selectedPart && <section className="catechism-lesson-library summa-question-library" aria-labelledby="summa-questions-title">
      <div className="catechism-lesson-library-heading">
        <div>
          <p className="eyebrow">{selectedPart.name}</p>
          <h2 id="summa-questions-title">Browse the questions.</h2>
        </div>
        <span className="catechism-lesson-count">{filteredQuestions.length} of {partQuestions.length} questions</span>
      </div>
      <label className="catechism-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by question or article title"
          aria-label="Filter questions by question or article title"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear question filter"><X size={16} /></button>}
      </label>
      {filteredQuestions.length ? <ol className="catechism-lesson-grid">
        {filteredQuestions.map((question) => <li key={question.id}>
          <a className="catechism-lesson-card" href={summaQuestionHref(selectedPart.slug, question.number)}>
            <span className="catechism-lesson-card-number">Question {question.number}</span>
            <strong>{question.title}</strong>
            <span className="catechism-lesson-card-footer">{question.articles.length} {question.articles.length === 1 ? "article" : "articles"}<ArrowRight size={15} aria-hidden="true" /></span>
          </a>
        </li>)}
      </ol> : <p className="catechism-empty" aria-live="polite">No questions or article titles match “{query.trim()}”. Try a shorter search.</p>}
    </section>}
    {attribution()}
  </>;
}

function ArticleText({ article, partSlug, questionNumber }: { article: SummaArticle; partSlug: string; questionNumber: number }) {
  return <div className="summa-article-body">
    {article.objections.length > 0 && <section>
      <h3>The objections</h3>
      <ol className="summa-objections">
        {article.objections.map((objection) => <li key={objection.n}>
          <span>Objection {objection.n}</span>
          <TextParagraphs text={objection.text} />
        </li>)}
      </ol>
    </section>}
    {article.sed_contra && <section className="summa-sed-contra">
      <h3>On the contrary</h3>
      <TextParagraphs text={article.sed_contra} />
    </section>}
    {article.respondeo && <section className="summa-respondeo">
      <h3>I answer that</h3>
      <TextParagraphs text={article.respondeo} />
    </section>}
    {article.replies.length > 0 && <section className="summa-replies">
      <h3>Replies to the objections</h3>
      <ol>
        {article.replies.map((reply) => <li key={reply.n}>
          <span>Reply to objection {reply.n}</span>
          <TextParagraphs text={reply.text} />
        </li>)}
      </ol>
    </section>}
    <a className="summa-article-permalink" href={summaArticleHref(partSlug, questionNumber, article.number)}>Link to this article <ArrowRight size={13} /></a>
  </div>;
}

function QuestionReader({ part, question, articleNumber }: { part: SummaPart; question: SummaQuestion; articleNumber: number | null }) {
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);
  const directArticle = articleNumber === null ? undefined : question.articles.find((article) => article.number === articleNumber);
  const defaultArticle = directArticle ?? question.articles[0];

  useEffect(() => {
    setExpandedArticleId(defaultArticle?.id ?? null);
  }, [question.id, defaultArticle?.id]);

  useEffect(() => {
    if (articleNumber === null || !directArticle) return;
    const frame = window.requestAnimationFrame(() => {
      const article = document.getElementById(`summa-article-${articleNumber}`);
      article?.scrollIntoView({ behavior: "smooth", block: "center" });
      article?.querySelector("summary")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [articleNumber, directArticle]);

  return <>
    <nav className="journey-detail-nav catechism-detail-nav summa-detail-nav" aria-label="Summa navigation">
      <a className="button button-outline" href={`#/summa/${encodeURIComponent(part.slug)}`}><ArrowLeft size={16} /> All questions</a>
      <span className="catechism-detail-edition">{part.name}</span>
    </nav>
    <header className="journey-detail-heading catechism-detail-heading summa-detail-heading">
      <p className="eyebrow"><span className="eyebrow-dot" /> {part.name} <span aria-hidden="true">/</span> Question {question.number}</p>
      <h1>{question.title}</h1>
      <p className="catechism-audience">{question.articles.length} {question.articles.length === 1 ? "article" : "articles"}</p>
    </header>

    <article className="summa-reading" aria-label={`${part.name}, Question ${question.number}: ${question.title}`}>
      <div className="summa-article-list">
        {question.articles.map((article) => <details
          className="summa-article"
          id={`summa-article-${article.number}`}
          key={article.id}
          open={expandedArticleId === article.id}
          onToggle={(event) => setExpandedArticleId(event.currentTarget.open ? article.id : null)}
        >
          <summary>
            <span className="summa-article-label">Article {article.number}</span>
            <span className="summa-article-title">{article.title}</span>
          </summary>
          <div className="summa-article-content"><ArticleText article={article} partSlug={part.slug} questionNumber={question.number} /></div>
        </details>)}
      </div>
      <footer className="catechism-attribution summa-question-attribution">
        <span>Text and article structure from Torch &amp; Lily.</span>
        <a href={summaQuestionHref(part.slug, question.number)}>Question link <ArrowRight size={13} /></a>
      </footer>
    </article>
    {attribution()}
  </>;
}

export function SummaPage() {
  const [address, setAddress] = useState<Address>(readAddress);
  const [data, setData] = useState<SummaDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setAddress(readAddress());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadSummaData().then((loaded) => {
      if (active) setData(loaded);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Could not load the Summa text.");
    });
    return () => { active = false; };
  }, []);

  if (!data) return <main className="journey-page section-wrap catechism-page summa-page">
    <p className="eyebrow" role={loadError ? "alert" : undefined}>{loadError ? "The reader could not be opened" : "Opening the Summa Theologiae…"}</p>
    {loadError && <><p className="summa-load-error">{loadError}</p><button className="button button-outline" type="button" onClick={() => {
      setLoadError(null);
      loadSummaData().then(setData).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load the Summa text."));
    }}>Try again</button></>}
  </main>;

  const selectedPart = data.parts.find((part) => part.slug === address.partSlug);
  const selectedQuestion = selectedPart && address.questionNumber !== null
    ? data.questions.find((question) => question.part_id === selectedPart.id && question.number === address.questionNumber)
    : undefined;
  const isDetail = address.questionNumber !== null;

  return <main className={`journey-page section-wrap catechism-page summa-page${isDetail ? " catechism-detail-page summa-detail-page" : ""}`}>
    {!isDetail ? <SummaLibrary key={selectedPart?.id ?? "parts"} data={data} selectedPart={selectedPart} />
      : selectedPart && selectedQuestion ? <QuestionReader part={selectedPart} question={selectedQuestion} articleNumber={address.articleNumber} />
        : <section className="journey-not-found catechism-not-found summa-not-found">
          <p className="eyebrow">Summa Theologiae</p>
          <h1>{selectedPart ? "Question not found" : "Part not found"}</h1>
          <p>Choose a part of the Summa to continue reading.</p>
          <a className="journey-action-link" href="#/summa">Browse the parts <ArrowRight size={16} /></a>
        </section>}
  </main>;
}
