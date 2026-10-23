import { ArrowLeft, ArrowRight, BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CatechismArtwork } from "../components/CatechismArtwork";
import { NextStepPrompt } from "../components/NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import {
  catechismData,
  catechismEditions,
  catechismGroupHref,
  catechismQuestionHref,
  type CatechismEdition,
  type CatechismGroup,
} from "../lib/catechism";

type Address = { edition: number; groupId: string | null; questionNumber: number | null };

function readAddress(): Address {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  const [, editionPart, entry] = path.match(/^catechism(?:\/(\d+)(?:\/([^/]+))?)?$/) ?? [];
  const requestedEdition = Number(editionPart);
  const edition = catechismEditions.some((item) => item.number === requestedEdition) ? requestedEdition : 2;
  if (!entry) return { edition, groupId: null, questionNumber: null };
  const question = entry.match(/^q-(\d+)$/);
  if (question) return { edition, groupId: null, questionNumber: Number(question[1]) };
  let groupId = entry;
  try { groupId = decodeURIComponent(entry); } catch { /* use the literal hash segment */ }
  return { edition, groupId, questionNumber: null };
}

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function displayLessonTitle(title: string) {
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

function AskSofiPrompt() {
  return <NextStepPrompt
    heading="Looking for one particular answer?"
    className="catechism-ask-sofi"
    card={{
      art: "catechism",
      title: `Ask ${ASSISTANT_NAME}`,
      description: "Tell Sofi what you are wondering about, and she can help you find a specific catechism question and answer.",
      action: "Ask Sofi",
      onClick: () => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT)),
    }}
  />;
}

function EditionNextStep({ edition }: { edition: CatechismEdition }) {
  const nextEdition = catechismEditions.find((item) => item.number === edition.number + 1);
  const target = nextEdition?.groups.find((item) => item.kind === "lesson");
  if (!nextEdition || !target) return null;
  return <NextStepPrompt
    heading="Continue with the next edition"
    className="catechism-edition-next"
    card={{
      art: "catechism",
      title: `Baltimore Catechism No. ${nextEdition.number}`,
      description: `Begin with Lesson ${target.number}: ${displayLessonTitle(target.title)}.`,
      action: "Read the next edition",
      onClick: () => { window.location.hash = catechismGroupHref(nextEdition.number, target.id); },
    }}
  />;
}

function EditionLibrary({ edition, onChooseEdition }: { edition: CatechismEdition; onChooseEdition: (number: number) => void }) {
  const [query, setQuery] = useState("");
  const lessons = useMemo(() => edition.groups.filter((group) => group.kind === "lesson"), [edition]);
  const filteredLessons = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-US");
    if (!search) return lessons;
    return lessons.filter((lesson) => `lesson ${lesson.number} ${lesson.title}`.toLocaleLowerCase("en-US").includes(search));
  }, [lessons, query]);

  return <>
    <section className="journey-library catechism-editions" aria-labelledby="catechism-editions-title">
      <div className="journey-library-heading">
        <div>
          <p className="eyebrow">A progressive course in the faith</p>
          <h2 id="catechism-editions-title">Choose a book.</h2>
        </div>
        <p>Three editions meet students at different stages, from First Communion through more advanced study.</p>
      </div>
      <ol className="journey-library-list catechism-edition-list">
        {catechismEditions.map((item) => <li className="journey-library-item" key={item.id}>
          <button
            type="button"
            className="journey-library-card catechism-edition-card"
            aria-pressed={item.number === edition.number}
            onClick={() => onChooseEdition(item.number)}
          >
            <CatechismArtwork edition={item.number} />
      <span className="journey-library-copy">
              <span className="journey-period-label"><span>No. {item.number}</span></span>
              <strong>{item.title}</strong>
              <span className="journey-library-teaser">{item.audience}</span>
              <span className="journey-library-meta">{item.lessonCount} lessons · {item.questionCount} questions <ArrowRight size={14} aria-hidden="true" /></span>
            </span>
          </button>
        </li>)}
      </ol>
    </section>

    <section className="catechism-lesson-library" aria-labelledby="catechism-lessons-title">
      <div className="catechism-lesson-library-heading">
        <div>
          <p className="eyebrow">Baltimore Catechism No. {edition.number}</p>
          <h2 id="catechism-lessons-title">Browse the lessons.</h2>
        </div>
        <span className="catechism-lesson-count">{filteredLessons.length} of {lessons.length} lessons</span>
      </div>
      <label className="catechism-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by lesson title or number"
          aria-label="Filter lessons by title or number"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear lesson filter"><X size={16} /></button>}
      </label>
      {filteredLessons.length ? <ol className="catechism-lesson-grid">
        {filteredLessons.map((lesson) => <li key={lesson.id}>
          <a className="catechism-lesson-card" href={catechismGroupHref(edition.number, lesson.id)}>
            <span className="catechism-lesson-card-number">Lesson {lesson.number}</span>
            <strong>{displayLessonTitle(lesson.title)}</strong>
            <span className="catechism-lesson-card-footer">{lesson.questions.length} {lesson.questions.length === 1 ? "question" : "questions"}<ArrowRight size={15} aria-hidden="true" /></span>
          </a>
        </li>)}
      </ol> : <p className="catechism-empty" aria-live="polite">No lesson titles or numbers match “{query.trim()}”. Try a shorter search.</p>}
    </section>

    <AskSofiPrompt />
    <footer className="catechism-rights-note">
      <span>Torch &amp; Lily records are cross-references:</span> <a href={catechismData.sources.torchLily} target="_blank" rel="noreferrer">torch-data on GitHub</a>. {catechismData.sources.rightsNote}
    </footer>
  </>;
}

function LessonReader({ edition, group, questionNumber, nextStep }: { edition: CatechismEdition; group: CatechismGroup; questionNumber: number | null; nextStep?: ReactNode }) {
  const lessons = edition.groups.filter((item) => item.kind === "lesson");
  const lessonIndex = lessons.findIndex((item) => item.id === group.id);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined;
  const next = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;
  const isLesson = group.kind === "lesson";
  const [collapsedQuestionsByGroup, setCollapsedQuestionsByGroup] = useState<Record<string, Set<string>>>({});
  const collapsedQuestions = collapsedQuestionsByGroup[group.id] ?? new Set<string>();
  const allExpanded = group.questions.every((question) => !collapsedQuestions.has(question.id));
  const toggleAllQuestions = () => setCollapsedQuestionsByGroup((current) => ({
    ...current,
    [group.id]: allExpanded ? new Set(group.questions.map((question) => question.id)) : new Set<string>(),
  }));
  const updateQuestionState = (questionId: string, open: boolean) => setCollapsedQuestionsByGroup((current) => {
    const nextCollapsed = new Set(current[group.id] ?? []);
    if (open) nextCollapsed.delete(questionId);
    else nextCollapsed.add(questionId);
    return { ...current, [group.id]: nextCollapsed };
  });
  const lessonTitle = displayLessonTitle(group.title);

  useEffect(() => {
    if (questionNumber === null) return;
    const target = group.questions.find((question) => question.number === questionNumber);
    if (!target) return;
    setCollapsedQuestionsByGroup((current) => {
      if (!current[group.id]?.has(target.id)) return current;
      const nextCollapsed = new Set(current[group.id] ?? []);
      nextCollapsed.delete(target.id);
      return { ...current, [group.id]: nextCollapsed };
    });
  }, [group.id, group.questions, questionNumber]);

  return <>
    <nav className="journey-detail-nav catechism-detail-nav" aria-label="Catechism navigation">
      <a className="button button-outline" href={`#/catechism/${edition.number}`}><ArrowLeft size={16} /> All lessons</a>
      <span className="catechism-detail-edition">Baltimore Catechism No. {edition.number}</span>
    </nav>
    <header className="journey-detail-heading catechism-detail-heading">
      <p className="eyebrow"><span className="eyebrow-dot" /> {edition.title}{isLesson && <> <span aria-hidden="true">/</span> Lesson {group.number}</>}</p>
      <h1>{lessonTitle}</h1>
      <p className="catechism-audience">{edition.audience}</p>
      {edition.note && <p className="catechism-edition-note">{edition.note}</p>}
    </header>

    <article className="catechism-reading" aria-label={`${edition.title}, ${isLesson ? `Lesson ${group.number}: ${lessonTitle}` : lessonTitle}`}>
      {group.questions.length ? <>
        <div className="catechism-answer-controls">
          <button type="button" className="button button-outline" onClick={toggleAllQuestions} aria-expanded={allExpanded}>
            {allExpanded ? "Collapse all answers" : "Expand all answers"}
          </button>
        </div>
        <div className="catechism-question-list">
        {group.questions.map((question) => <details className="catechism-question" id={`catechism-q-${edition.number}-${question.number}`} key={question.id} open={!collapsedQuestions.has(question.id)} onToggle={(event) => updateQuestionState(question.id, event.currentTarget.open)}>
          <summary><span className="catechism-question-number">{question.number}</span><span>{question.question}</span></summary>
          <div className="catechism-answer">
            <p className="catechism-answer-label">Answer</p>
            {splitParagraphs(question.answer).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {question.parallelNo2Question && <p className="catechism-source-note">No. 3 source annotation: parallel to No. 2, question {question.parallelNo2Question}.</p>}
            {question.sourceAnnotation && !question.parallelNo2Question && <p className="catechism-source-note">No. 3 source annotation: {question.sourceAnnotation}.</p>}
            {question.sourceNote && <p className="catechism-source-note">{question.sourceNote}</p>}
            <a className="catechism-question-link" href={catechismQuestionHref(edition.number, question.number)}>Link to question <ArrowRight size={13} /></a>
          </div>
        </details>)}
        </div>
      </> : <p className="catechism-empty">This section has no questions.</p>}

      <footer className="catechism-attribution">
        <span>Text source: Project Gutenberg eBook {edition.gutenbergEbookId}.</span>
        <a href={edition.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowRight size={13} /></a>
      </footer>
    </article>
    {isLesson && <footer className="journey-detail-footer catechism-detail-footer">
      <nav className="journey-detail-actions" aria-label="Lesson navigation">
        {previous ? <a className="button button-outline journey-previous-action" href={catechismGroupHref(edition.number, previous.id)} rel="prev">
          <ArrowLeft size={15} aria-hidden="true" /><span className="catechism-detail-action-copy"><small>Previous lesson</small><strong>Lesson {previous.number}: {displayLessonTitle(previous.title)}</strong></span>
        </a> : <span />}
        {next ? <a className="button button-outline journey-next-action" href={catechismGroupHref(edition.number, next.id)} rel="next">
          <span className="catechism-detail-action-copy"><small>Next lesson</small><strong>Lesson {next.number}: {displayLessonTitle(next.title)}</strong></span><ArrowRight size={15} aria-hidden="true" />
        </a> : <span />}
      </nav>
    </footer>}
    {isLesson && next && <AskSofiPrompt />}
    {edition.number < 3 && isLesson && !next && <EditionNextStep edition={edition} />}
    {edition.number === 3 && isLesson && !next && nextStep}
    <footer className="catechism-rights-note catechism-detail-rights">
      {catechismData.sources.attribution} {catechismData.sources.rightsNote}
    </footer>
  </>;
}

export function CatechismPage({ nextStep }: { nextStep?: ReactNode }) {
  const [address, setAddress] = useState<Address>(readAddress);

  useEffect(() => {
    const update = () => setAddress(readAddress());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  const edition = catechismEditions.find((item) => item.number === address.edition) ?? catechismEditions[1];
  const selectedGroup = address.questionNumber === null
    ? edition.groups.find((group) => group.id === address.groupId)
    : edition.groups.find((group) => group.questions.some((question) => question.number === address.questionNumber));
  const isDetail = address.groupId !== null || address.questionNumber !== null;

  useEffect(() => {
    if (address.questionNumber === null) return;
    const frame = window.requestAnimationFrame(() => {
      const question = document.getElementById(`catechism-q-${address.edition}-${address.questionNumber}`);
      question?.scrollIntoView({ behavior: "smooth", block: "center" });
      question?.querySelector("summary")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [address]);

  const chooseEdition = (number: number) => {
    window.history.pushState(null, "", `#/catechism/${number}`);
    setAddress(readAddress());
  };

  const missingQuestion = address.questionNumber !== null && !selectedGroup;
  const missingGroup = address.groupId !== null && !selectedGroup;

  return <main className={`journey-page section-wrap catechism-page${isDetail ? " catechism-detail-page" : ""}`}>
    {!isDetail ? <>
      <header className="journey-heading catechism-library-hero">
        <div className="journey-heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A historical catechism</p>
          <h1>The Baltimore <em>Catechism.</em></h1>
          <p className="journey-intro">Read the historic Baltimore Catechism by edition and lesson. No. 1 introduces the faith for First Communion, No. 2 continues for Confirmation, and No. 3 offers more advanced study.</p>
          <div className="catechism-context"><BookOpen size={18} aria-hidden="true" /><span>This historical series is distinct from the Catechism of the Catholic Church (CCC). Browse a lesson to read its original questions and answers.</span></div>
        </div>
      </header>
      <EditionLibrary key={edition.id} edition={edition} onChooseEdition={chooseEdition} />
    </> : selectedGroup ? <LessonReader edition={edition} group={selectedGroup} questionNumber={address.questionNumber} nextStep={nextStep} /> : <section className="journey-not-found catechism-not-found">
      <p className="eyebrow">Baltimore Catechism No. {edition.number}</p>
      <h1>{missingQuestion ? "Question not found" : missingGroup ? "Lesson not found" : "Section not found"}</h1>
      <p>Choose a lesson from this edition to continue reading.</p>
      <a className="journey-action-link" href={`#/catechism/${edition.number}`}>Browse the lessons <ArrowRight size={16} /></a>
    </section>}
  </main>;
}
