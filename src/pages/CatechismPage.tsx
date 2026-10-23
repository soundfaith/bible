import { ArrowLeft, ArrowRight, BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  catechismData,
  catechismEditions,
  catechismGroupHref,
  catechismQuestionHref,
  type CatechismEdition,
  type CatechismGroup,
  type CatechismQuestion,
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

type SearchHit = { edition: CatechismEdition; group: CatechismGroup; question: CatechismQuestion };

export function CatechismPage() {
  const [address, setAddress] = useState<Address>(readAddress);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const update = () => setAddress(readAddress());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const edition = catechismEditions.find((item) => item.number === address.edition) ?? catechismEditions[1];
  const selectedGroup = address.questionNumber === null
    ? edition.groups.find((group) => group.id === address.groupId) ?? edition.groups.find((group) => group.questions.length > 0)
    : edition.groups.find((group) => group.questions.some((question) => question.number === address.questionNumber));

  const matchingQuestions = useMemo<SearchHit[]>(() => {
    const search = query.trim().toLocaleLowerCase("en-US");
    if (!search) return [];
    const hits: SearchHit[] = [];
    for (const item of catechismEditions) {
      for (const group of item.groups) {
        for (const question of group.questions) {
          if (`${question.number} ${question.question} ${question.answer}`.toLocaleLowerCase("en-US").includes(search)) {
            hits.push({ edition: item, group, question });
            if (hits.length >= 100) return hits;
          }
        }
      }
    }
    return hits;
  }, [query]);

  useEffect(() => {
    if (address.questionNumber === null) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`catechism-q-${address.edition}-${address.questionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [address]);

  const chooseEdition = (number: number) => {
    setQuery("");
    window.location.hash = catechismGroupHref(number, catechismEditions.find((item) => item.number === number)?.groups.find((group) => group.questions.length)?.id ?? "lesson-1");
  };

  const chooseGroup = (groupId: string) => {
    window.location.hash = catechismGroupHref(edition.number, groupId);
  };

  const openQuestion = (hit: SearchHit) => {
    setQuery("");
    window.location.hash = catechismQuestionHref(hit.edition.number, hit.question.number);
  };

  const clearSearch = () => setQuery("");

  return <main className="catechism-page section-wrap">
    <a className="catechism-back" href="#/"><ArrowLeft size={15} /> Home</a>
    <header className="catechism-hero">
      <p className="eyebrow"><span className="eyebrow-dot" /> A historical catechism</p>
      <h1>The Baltimore <em>Catechism.</em></h1>
      <p className="catechism-intro">Browse three editions by their original lessons and question numbers. This historical series is distinct from the Catechism of the Catholic Church (CCC).</p>
      <div className="catechism-context"><BookOpen size={18} /><span>The books use a progressive structure: No. 1 for First Communion classes, No. 2 for Confirmation classes, and No. 3 for post-Confirmation study.</span></div>
    </header>

    <section className="catechism-controls" aria-label="Choose an edition and search">
      <div className="catechism-edition-picker" role="group" aria-label="Catechism edition">
        {catechismEditions.map((item) => <button type="button" key={item.id} className={item.number === edition.number ? "active" : ""} aria-pressed={item.number === edition.number} onClick={() => chooseEdition(item.number)}>
          <strong>No. {item.number}</strong><span>{item.questionCount.toLocaleString()} questions</span>
        </button>)}
      </div>
      <label className="catechism-search">
        <Search size={18} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions and answers across all editions" aria-label="Search the Baltimore Catechism" />
        {query && <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={16} /></button>}
      </label>
    </section>

    {query.trim() ? <section className="catechism-results" aria-live="polite">
      <div className="catechism-results-heading"><h2>Search results</h2><span>{matchingQuestions.length}{matchingQuestions.length === 100 ? "+" : ""}</span></div>
      {matchingQuestions.length ? <div className="catechism-result-list">{matchingQuestions.map(({ edition: resultEdition, group, question }) => <button type="button" className="catechism-result" key={question.id} onClick={() => openQuestion({ edition: resultEdition, group, question })}>
        <span className="catechism-result-meta">Baltimore Catechism No. {resultEdition.number} · {group.kind === "lesson" ? `Lesson ${group.number}` : "Preliminary questions"} · Q. {question.number}</span>
        <strong>{question.question}</strong>
        <span>{question.answer.replace(/\s+/g, " ").slice(0, 240)}{question.answer.length > 240 ? "…" : ""}</span>
        <span className="catechism-result-open">Open question <ArrowRight size={14} /></span>
      </button>)}</div> : <p className="catechism-empty">No questions or answers matched “{query.trim()}”. Try a shorter phrase.</p>}
    </section> : <div className="catechism-reader-layout">
      <aside className="catechism-sidebar" aria-label={`Baltimore Catechism No. ${edition.number} lessons`}>
        <div className="catechism-sidebar-heading"><span>No. {edition.number}</span><h2>Browse the book</h2></div>
        <nav className="catechism-group-list" aria-label="Sections and lessons">
          {edition.groups.map((group) => <button type="button" key={group.id} className={selectedGroup?.id === group.id ? "active" : ""} aria-current={selectedGroup?.id === group.id ? "page" : undefined} onClick={() => chooseGroup(group.id)}>
            <span>{group.kind === "lesson" ? `Lesson ${group.number}` : "Before the lessons"}</span>
            <strong>{group.title}</strong>
            <small>{group.questions.length} {group.questions.length === 1 ? "question" : "questions"}</small>
          </button>)}
        </nav>
      </aside>

      <article className="catechism-reading">
        <header className="catechism-reading-heading">
          <p className="eyebrow">{edition.title}</p>
          <h2>{selectedGroup?.kind === "lesson" ? `Lesson ${selectedGroup.number}` : selectedGroup?.title}</h2>
          {selectedGroup?.kind === "lesson" && <p className="catechism-lesson-title">{selectedGroup.title}</p>}
          <p className="catechism-audience">{edition.audience}</p>
          {edition.note && <p className="catechism-edition-note">{edition.note} Individual questions are shown with their printed numbering and source notes.</p>}
        </header>
        {selectedGroup?.questions.length ? <div className="catechism-question-list">
          {selectedGroup.questions.map((question) => <details className="catechism-question" id={`catechism-q-${edition.number}-${question.number}`} key={question.id} open={address.questionNumber === question.number}>
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
        </div> : <p className="catechism-empty">Choose a lesson to begin reading.</p>}
        {selectedGroup && <nav className="catechism-group-pagination" aria-label="Lesson navigation">
          {(() => {
            const index = edition.groups.findIndex((group) => group.id === selectedGroup.id);
            const previous = edition.groups[index - 1];
            const next = edition.groups[index + 1];
            return <>
              {previous ? <button type="button" onClick={() => chooseGroup(previous.id)}><ArrowLeft size={14} /> {previous.kind === "lesson" ? `Lesson ${previous.number}` : "Preliminary questions"}</button> : <span />}
              {next && <button type="button" onClick={() => chooseGroup(next.id)}>{next.kind === "lesson" ? `Lesson ${next.number}` : "Preliminary questions"} <ArrowRight size={14} /></button>}
            </>;
          })()}
        </nav>}
        <footer className="catechism-attribution">
          <span>Text source: Project Gutenberg eBook {edition.gutenbergEbookId}.</span>
          <a href={edition.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowRight size={13} /></a>
        </footer>
      </article>
    </div>}

    <footer className="catechism-rights-note">
      <span>Torch &amp; Lily structured records are cross-referenced in this dataset:</span> <a href={catechismData.sources.torchLily} target="_blank" rel="noreferrer">torch-data on GitHub</a>. {catechismData.sources.rightsNote}
    </footer>
  </main>;
}
