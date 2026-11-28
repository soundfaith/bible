import { ArrowRight, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "@/chat.css";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "./assistant";
import { clearChatHistory, loadChatHistory, saveChatHistory } from "./history";
import { warmUpChatModel } from "./matcher";
import { respondTo, SUGGESTED_PROMPTS, topicReply, welcomeMessage, type ChatMessage } from "./respond";
import { getTopic, parseRef, passageLabel, passageText, type ChatVerse } from "./topics";
import sofiLogo from "../../../assets/sofi.svg";

type Props = { onOpenVerse: (bookId: string, chapter: number, verse: number) => void; launcherHidden?: boolean };

const MIN_TYPING_MS = 700;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BOT_NAME = ASSISTANT_NAME;

export function SofiAvatar({ size = 46 }: { size?: number }) {
  return <img src={sofiLogo} width={size} height={size} alt="" aria-hidden="true" draggable={false} />;
}

function VerseCard({ reference, why, onOpen }: { reference: string; why?: string; onOpen: Props["onOpenVerse"] }) {
  const passage = parseRef(reference);
  if (!passage) return null;
  const full = passageText(passage).replace(/^[\s"'“”‘’«»]+|[\s"'“”‘’«»]+$/g, "");
  const text = full.length > 240 ? `${full.slice(0, 237).trimEnd()}…` : full;
  return (
    <button type="button" className="chat-verse" onClick={() => onOpen(passage.bookId, passage.chapter, passage.start)}>
      <span className="chat-verse-ref">{passageLabel(passage)}</span>
      {why && <span className="chat-verse-why">{why}</span>}
      <span className="chat-verse-text">“{text}”</span>
      <span className="chat-verse-open">Read in the Bible <ArrowRight size={12} /></span>
    </button>
  );
}

function Chips({ ids, onPick, label }: { ids: string[]; onPick: (id: string) => void; label?: string }) {
  const topics = ids.map((id) => getTopic(id)).filter((topic) => topic !== undefined);
  if (!topics.length) return null;
  return (
    <div className="chat-chips" role="group" aria-label={label}>
      {topics.map((topic) => <button type="button" key={topic.id} onClick={() => onPick(topic.id)}>{topic.title}</button>)}
    </div>
  );
}

function AssistantBubble({ message, onOpen, onOpenCatechism, onOpenSumma, onPick }: { message: ChatMessage; onOpen: Props["onOpenVerse"]; onOpenCatechism: (edition: number, question: number) => void; onOpenSumma: (partSlug: string, questionNumber: number, articleNumber: number) => void; onPick: (id: string) => void }) {
  const topic = message.topicId ? getTopic(message.topicId) : undefined;
  if (message.kind === "welcome") {
    return (
      <div className="chat-bubble assistant">
        <p>Explore questions and answers from the Bible, the Baltimore Catechism, and St. Thomas Aquinas's Summa Theologiae.</p>
        <div className="chat-chips">{SUGGESTED_PROMPTS.map((prompt) => <button type="button" key={prompt} data-prompt={prompt}>{prompt}</button>)}</div>
      </div>
    );
  }
  if (message.kind === "error") {
    return <div className="chat-bubble assistant"><p>{message.errorText}</p></div>;
  }
  if (message.kind === "passage" && message.passageRef) {
    return (
      <div className="chat-bubble assistant">
        <p className="chat-lead">{message.lead}</p>
        <VerseCard reference={message.passageRef} onOpen={onOpen} />
      </div>
    );
  }
  if (message.kind === "verses" && message.passageRefs?.length) {
    return (
      <div className="chat-bubble assistant">
        <p className="chat-lead">Here is where Scripture speaks of “{message.keyword}”.</p>
        <div className="chat-verses">
          {message.passageRefs.map((ref) => <VerseCard key={ref} reference={ref} onOpen={onOpen} />)}
        </div>
        {!!message.optionIds?.length && (
          <>
            <p className="chat-related">Or explore</p>
            <Chips ids={message.optionIds} onPick={onPick} label="Related topics" />
          </>
        )}
      </div>
    );
  }
  if (message.kind === "catechism" && message.catechismEdition && message.catechismQuestionNumber) {
    return (
      <div className="chat-bubble assistant">
        <p className="chat-lead">{message.lead}</p>
        <article className="chat-catechism-card">
          <span className="chat-catechism-source">{message.catechismEditionTitle} · {message.catechismGroupTitle} · Question {message.catechismQuestionNumber}</span>
          <h3>{message.catechismQuestion}</h3>
          <p className="chat-catechism-answer-label">Answer</p>
          {message.catechismAnswer?.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {message.catechismSourceNote && <p className="chat-catechism-note">{message.catechismSourceNote}</p>}
          <p className="chat-catechism-context">A historical Baltimore Catechism reference, separate from the Catechism of the Catholic Church.</p>
          <button type="button" className="chat-catechism-open" onClick={() => onOpenCatechism(message.catechismEdition!, message.catechismQuestionNumber!)}>Read in the catechism <ArrowRight size={13} /></button>
        </article>
        {topic && <div className="chat-catechism-scripture">
          <p className="chat-related">Related Scripture</p>
          <p>{topic.intro}</p>
          <div className="chat-verses">{topic.verses.map((verse: ChatVerse) => <VerseCard key={verse.ref} reference={verse.ref} why={verse.why} onOpen={onOpen} />)}</div>
        </div>}
      </div>
    );
  }
  if (message.kind === "summa" && message.summaPartSlug && message.summaQuestionNumber && message.summaArticleNumber) {
    return (
      <div className="chat-bubble assistant">
        <p className="chat-lead">{message.lead}</p>
        <article className="chat-summa-card">
          <span className="chat-summa-source">{message.summaPartName} · Question {message.summaQuestionNumber}, Article {message.summaArticleNumber}</span>
          <h3>{message.summaQuestionTitle}</h3>
          <p className="chat-summa-article-title">{message.summaArticleTitle}</p>
          <p className="chat-summa-answer-label">Aquinas’s response</p>
          <p>{message.summaResponse}</p>
          <button type="button" className="chat-catechism-open" onClick={() => onOpenSumma(message.summaPartSlug!, message.summaQuestionNumber!, message.summaArticleNumber!)}>Read the full article <ArrowRight size={13} /></button>
        </article>
        {topic && <div className="chat-catechism-scripture">
          <p className="chat-related">Related Scripture</p>
          <p>{topic.intro}</p>
          <div className="chat-verses">{topic.verses.map((verse: ChatVerse) => <VerseCard key={verse.ref} reference={verse.ref} why={verse.why} onOpen={onOpen} />)}</div>
        </div>}
      </div>
    );
  }
  if (message.kind === "suggest") {
    return (
      <div className="chat-bubble assistant">
        <p>Explore a related question:</p>
        <Chips ids={message.optionIds ?? []} onPick={onPick} label="Possible topics" />
      </div>
    );
  }
  if (message.kind === "fallback") {
    return (
      <div className="chat-bubble assistant">
        <p>No close match was found. Try different words, a verse such as “John 3:16”, or one of these topics.</p>
        <Chips ids={message.optionIds ?? []} onPick={onPick} label="Starting topics" />
      </div>
    );
  }
  if (!topic) return null;
  return (
    <div className="chat-bubble assistant">
      {message.crisis && (
        <p className="chat-crisis">If you are in danger or thinking of harming yourself, please contact your local emergency number or a crisis line right now, such as 988 in the United States. You are not alone.</p>
      )}
      <p className="chat-lead">{message.lead}</p>
      <h3>{topic.title}</h3>
      <p>{topic.intro}</p>
      <div className="chat-verses">
        {topic.verses.map((verse: ChatVerse) => <VerseCard key={verse.ref} reference={verse.ref} why={verse.why} onOpen={onOpen} />)}
      </div>
      {!!message.followUpIds?.length && (
        <>
          <p className="chat-related">You may also want to explore</p>
          <Chips ids={message.followUpIds} onPick={onPick} label="Related topics" />
        </>
      )}
    </div>
  );
}

export function ChatWidget({ onOpenVerse, launcherHidden = false }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatHistory();
    return saved.length ? saved : [welcomeMessage()];
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastQuestionIdRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  useEffect(() => {
    const openFromPage = (event: Event) => {
      const question = (event as CustomEvent<{ question?: string }>).detail?.question;
      if (question) setPendingQuestion(question);
      setOpen(true);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, openFromPage);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openFromPage);
  }, []);
  useEffect(() => {
    if (!open) return;
    warmUpChatModel();
  }, [open]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const questionId = lastQuestionIdRef.current;
    if (questionId) {
      const question = list.querySelector<HTMLElement>(`[data-message-id="${questionId}"]`);
      if (question) {
        const listTop = list.getBoundingClientRect().top;
        const questionTop = question.getBoundingClientRect().top;
        list.scrollTo({ top: Math.max(0, list.scrollTop + questionTop - listTop - 8), behavior: "smooth" });
        return;
      }
    }
    const last = messages[messages.length - 1];
    const bubble = list.lastElementChild as HTMLElement | null;
    // Show a fresh answer from its beginning instead of its end.
    if (!busy && last?.role !== "user" && bubble && messages.length > 1) {
      list.scrollTo({ top: Math.max(0, bubble.offsetTop - 16), behavior: "smooth" });
    } else {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [messages, busy, open]);
  useEffect(() => {
    if (!open || window.innerWidth > 760) return;
    const panel = panelRef.current;
    const viewport = window.visualViewport;
    if (!panel || !viewport) return;
    const updateViewport = () => {
      const keyboardHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      const keyboardOpen = keyboardHeight > 100;
      panel.classList.toggle("is-keyboard-open", keyboardOpen);
      if (keyboardOpen) {
        panel.style.setProperty("--chat-visible-height", `${viewport.height}px`);
        panel.style.setProperty("--chat-visible-top", `${viewport.offsetTop}px`);
      } else {
        panel.style.removeProperty("--chat-visible-height");
        panel.style.removeProperty("--chat-visible-top");
      }
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      panel.classList.remove("is-keyboard-open");
      panel.style.removeProperty("--chat-visible-height");
      panel.style.removeProperty("--chat-visible-top");
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (text: string, direct?: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const questionId = uid();
    lastQuestionIdRef.current = questionId;
    setMessages((current) => [...current, { id: questionId, role: "user", text: question }]);
    setDraft("");
    setBusy(true);
    let reply: ChatMessage;
    try {
      [reply] = await Promise.all([direct ? Promise.resolve(topicReply(direct)) : respondTo(question), wait(MIN_TYPING_MS)]);
    } catch (error) {
      console.error("Sofi could not search the reading sources.", error);
      reply = { id: uid(), role: "assistant", kind: "error", errorText: "I couldn’t search the reading sources just now. Please try again." };
    }
    setMessages((current) => [...current, reply]);
    setBusy(false);
  };

  useEffect(() => {
    if (!open || !pendingQuestion) return;
    setPendingQuestion(null);
    void ask(pendingQuestion);
  }, [open, pendingQuestion]);

  const openVerse = (bookId: string, chapter: number, verse: number) => {
    setOpen(false);
    onOpenVerse(bookId, chapter, verse);
  };

  const openCatechism = (edition: number, question: number) => {
    setOpen(false);
    window.location.hash = `#/catechism/${edition}/q-${question}`;
  };

  const openSumma = (partSlug: string, questionNumber: number, articleNumber: number) => {
    setOpen(false);
    window.location.hash = `#/summa/${encodeURIComponent(partSlug)}/q-${questionNumber}/a-${articleNumber}`;
  };

  const reset = () => {
    clearChatHistory();
    lastQuestionIdRef.current = null;
    setConfirmClear(false);
    setMessages([welcomeMessage()]);
  };
  const hasConversation = messages.some((message) => message.role === "user");

  return (
    <>
      {!open && (
        <button type="button" className={launcherHidden ? "chat-fab chat-fab--route-hidden" : "chat-fab"} aria-label={`Ask ${BOT_NAME} about Scripture and Catholic teaching`} onClick={() => setOpen(true)} onPointerEnter={() => warmUpChatModel()}>
          <span className="chat-fab-mark"><SofiAvatar size={24} /></span>
          <span>{BOT_NAME} Q&amp;A</span>
        </button>
      )}
      {open && (
        <section ref={panelRef} className="chat-panel" role="dialog" aria-label={`${BOT_NAME}, Scripture and Catholic teaching guide`}>
          <header className="chat-header">
            <span className="chat-avatar"><SofiAvatar size={46} /></span>
            <div>
              <strong>{BOT_NAME}</strong>
              <span className="chat-subtitle">Curated Catholic Questions &amp; Answers</span>
            </div>
            {hasConversation && <button type="button" aria-label="Clear questions" title="Clear questions" onClick={() => setConfirmClear(true)}><Trash2 size={16} /></button>}
            <button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          {confirmClear && <div className="chat-clear-confirm" role="alertdialog" aria-label="Clear conversation confirmation"><span>Clear this conversation?</span><button type="button" onClick={reset}>Clear</button><button type="button" onClick={() => setConfirmClear(false)}>Cancel</button></div>}
          <div className="chat-list" ref={listRef} aria-live="polite" onClick={(event) => {
            const prompt = (event.target as HTMLElement).closest<HTMLElement>("[data-prompt]")?.dataset.prompt;
            if (prompt) void ask(prompt);
          }}>
            {messages.slice(busy ? -1 : -2).map((message) => message.role === "user"
              ? <h2 className="sofi-question" data-message-id={message.id} key={message.id}>{message.text}</h2>
              : <AssistantBubble key={message.id} message={message} onOpen={openVerse} onOpenCatechism={openCatechism} onOpenSumma={openSumma} onPick={(id) => void ask(getTopic(id)?.title ?? "", id)} />)}
            {busy && <p role="status">Searching the sources…</p>}
          </div>
          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); void ask(draft); }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search questions or a verse…" maxLength={300} aria-label="Your question" />
            <button type="submit" aria-label="Search questions" disabled={busy || !draft.trim()}><Send size={17} /></button>
          </form>
        </section>
      )}
    </>
  );
}
