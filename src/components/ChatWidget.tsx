import { ArrowRight, Send, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import "../chat.css";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { clearChatHistory, loadChatHistory, saveChatHistory } from "../lib/chat/history";
import { warmUpChatModel } from "../lib/chat/matcher";
import { respondTo, SUGGESTED_PROMPTS, topicReply, welcomeMessage, type ChatMessage } from "../lib/chat/respond";
import { getTopic, parseRef, passageLabel, passageText, type ChatVerse } from "../lib/chat/topics";

type Props = { onOpenVerse: (bookId: string, chapter: number, verse: number) => void };

const MIN_TYPING_MS = 700;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BOT_NAME = ASSISTANT_NAME;

export function SofiAvatar({ size = 46 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="6" y1="44" x2="42" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.45" stopColor="#8b5cf6" />
          <stop offset="0.8" stopColor="#ec4899" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${id}-bg)`} />
      <circle cx="24" cy="24" r="24" fill={`url(#${id}-glow)`} />
      <path fill="#fff" fillOpacity="0.95" d="M24 24.500c-3.500-2.400-7.300-3.200-11.500-2.700v10.700c4.200-.4 8 .4 11.500 2.800 3.500-2.400 7.300-3.200 11.500-2.800V21.800c-4.200-.5-8 .3-11.500 2.700Z" />
      <path stroke="#8b5cf6" strokeOpacity="0.45" strokeWidth="1.200" d="M24 24.500v10.800" />
      <path fill="#fff" d="M24 6.500c.4 3.300 1.900 4.800 5.200 5.200-3.300.4-4.800 1.900-5.200 5.200-.4-3.300-1.900-4.800-5.200-5.200 3.300-.4 4.800-1.900 5.200-5.200Z" />
      <circle cx="36.500" cy="14" r="1.500" fill="#fff" fillOpacity="0.85" />
      <circle cx="11.500" cy="13" r="1" fill="#fff" fillOpacity="0.7" />
    </svg>
  );
}

function SparkleIcon({ size = 22, tone = "gradient" }: { size?: number; tone?: "gradient" | "white" }) {
  const id = useId();
  const fill = tone === "white" ? "#fff" : `url(#${id})`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {tone === "gradient" && (
        <defs>
          <linearGradient id={id} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4f8cff" />
            <stop offset="0.4" stopColor="#9b6bff" />
            <stop offset="0.75" stopColor="#ff6fae" />
            <stop offset="1" stopColor="#ffb347" />
          </linearGradient>
        </defs>
      )}
      <path fill={fill} d="M10 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.600-2.900-7-7.500-7.500 4.600-.5 7-2.900 7.500-7.500Z" />
      <path fill={fill} d="M18.500 14c.3 2.300 1.400 3.400 3.700 3.700-2.300.3-3.400 1.400-3.700 3.700-.3-2.300-1.400-3.400-3.700-3.700 2.300-.3 3.400-1.400 3.700-3.700Z" />
    </svg>
  );
}

function VerseCard({ reference, why, onOpen }: { reference: string; why?: string; onOpen: Props["onOpenVerse"] }) {
  const passage = parseRef(reference);
  if (!passage) return null;
  const full = passageText(passage);
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

function AssistantBubble({ message, onOpen, onPick }: { message: ChatMessage; onOpen: Props["onOpenVerse"]; onPick: (id: string) => void }) {
  const topic = message.topicId ? getTopic(message.topicId) : undefined;
  if (message.kind === "welcome") {
    return (
      <div className="chat-bubble assistant">
        <p>Peace be with you. I am {BOT_NAME}, your guide through Scripture. Tell me what you are carrying or wondering about, and I will bring you the passages that speak to it.</p>
        <div className="chat-chips">{SUGGESTED_PROMPTS.map((prompt) => <button type="button" key={prompt} data-prompt={prompt}>{prompt}</button>)}</div>
      </div>
    );
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
  if (message.kind === "suggest") {
    return (
      <div className="chat-bubble assistant">
        <p>I want to make sure I understand you. Is your question closest to one of these?</p>
        <Chips ids={message.optionIds ?? []} onPick={onPick} label="Possible topics" />
      </div>
    );
  }
  if (message.kind === "fallback") {
    return (
      <div className="chat-bubble assistant">
        <p>I could not find a close match for that. Try describing what you are feeling or asking in a few different words, type a verse such as “John 3:16”, or start from one of these.</p>
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

export function ChatWidget({ onOpenVerse }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatHistory();
    return saved.length ? saved : [welcomeMessage()];
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  useEffect(() => {
    const openFromPage = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, openFromPage);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openFromPage);
  }, []);
  useEffect(() => {
    if (!open) return;
    warmUpChatModel();
    inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (text: string, direct?: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setMessages((current) => [...current, { id: uid(), role: "user", text: question }]);
    setDraft("");
    setBusy(true);
    const [reply] = await Promise.all([direct ? Promise.resolve(topicReply(direct)) : respondTo(question), wait(MIN_TYPING_MS)]);
    setMessages((current) => [...current, reply]);
    setBusy(false);
  };

  const openVerse = (bookId: string, chapter: number, verse: number) => {
    setOpen(false);
    onOpenVerse(bookId, chapter, verse);
  };

  const reset = () => {
    clearChatHistory();
    setMessages([welcomeMessage()]);
  };

  return (
    <>
      {!open && (
        <button type="button" className="chat-fab" aria-label={`Ask ${BOT_NAME} about Scripture`} onClick={() => setOpen(true)} onPointerEnter={() => warmUpChatModel()}>
          <SparkleIcon size={22} tone="white" />
          <span>Ask {BOT_NAME}</span>
        </button>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label={`${BOT_NAME}, Scripture guide`}>
          <header className="chat-header">
            <span className="chat-avatar"><SofiAvatar size={46} /></span>
            <div>
              <strong>{BOT_NAME}</strong>
              <span>Your Scripture guide</span>
            </div>
            <button type="button" aria-label="Clear conversation" title="Clear conversation" onClick={reset}><Trash2 size={16} /></button>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          <div className="chat-list" ref={listRef} aria-live="polite" onClick={(event) => {
            const prompt = (event.target as HTMLElement).closest<HTMLElement>("[data-prompt]")?.dataset.prompt;
            if (prompt) void ask(prompt);
          }}>
            {messages.map((message) => message.role === "user"
              ? <div key={message.id} className="chat-bubble user">{message.text}</div>
              : <AssistantBubble key={message.id} message={message} onOpen={openVerse} onPick={(id) => void ask(getTopic(id)?.title ?? "", id)} />)}
            {busy && <div className="chat-bubble assistant chat-typing" aria-label="Searching Scripture"><i /><i /><i /></div>}
          </div>
          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); void ask(draft); }}>
            <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Ask ${BOT_NAME} about faith, life, or a verse…`} maxLength={300} aria-label="Your question" />
            <button type="submit" aria-label="Send" disabled={busy || !draft.trim()}><Send size={17} /></button>
          </form>
        </section>
      )}
    </>
  );
}
