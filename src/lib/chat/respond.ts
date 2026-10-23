import { bibleBooks } from "../bible";
import { THRESHOLDS, matchTopics, type TopicMatch } from "./matcher";
import { getTopic, parseRef, passageLabel, type ChatTopic } from "./topics";
import { searchVerses } from "./verseSearch";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  kind?: "welcome" | "answer" | "suggest" | "passage" | "fallback" | "verses" | "catechism";
  lead?: string;
  topicId?: string;
  optionIds?: string[];
  followUpIds?: string[];
  passageRef?: string;
  passageRefs?: string[];
  keyword?: string;
  crisis?: boolean;
  catechismEdition?: number;
  catechismEditionTitle?: string;
  catechismQuestionNumber?: number;
  catechismGroupTitle?: string;
  catechismQuestion?: string;
  catechismAnswer?: string;
  catechismSourceNote?: string;
};

const CRISIS = /\b(kill myself|end my life|suicid\w*|want to die|self[- ]?harm\w*|hurt myself|don'?t want to live|better off dead)\b/i;
const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|god bless( you)?|peace be with you|praise (the lord|god))\b[\s!.,]*$/i;
const REFERENCE = /^\s*((?:[1-4]\s*)?[a-z][a-z ]*?)\.?\s+(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*$/i;

const LEADS = [
  "Here is what Scripture offers on this.",
  "I found passages that speak directly to this.",
  "This is a question many people carry. Here is what the Word says.",
  "Let us look at what the Bible says about this.",
  "Here are the passages I would turn to first."
];
const FALLBACK_STARTERS = ["prayer", "anxiety", "forgiveness", "suffering", "purpose"];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const SUGGESTED_PROMPTS = ["How do I pray?", "I feel anxious", "Why does God allow suffering?", "How do I forgive someone?", "What happens after we die?", "Why do Catholics honor Mary?"];

export function welcomeMessage(): ChatMessage {
  return { id: uid(), role: "assistant", kind: "welcome" };
}

function followUps(topic: ChatTopic, runnersUp: TopicMatch[], minScore: number) {
  const ids = new Set(runnersUp.filter((match) => match.score >= minScore).map((match) => match.topic.id));
  topic.related.forEach((id) => { if (ids.size < 3 && getTopic(id)) ids.add(id); });
  ids.delete(topic.id);
  return [...ids].slice(0, 3);
}

export function topicReply(topicId: string): ChatMessage {
  const topic = getTopic(topicId)!;
  return { id: uid(), role: "assistant", kind: "answer", lead: pick(LEADS), topicId, followUpIds: followUps(topic, [], 1) };
}

export async function respondTo(query: string): Promise<ChatMessage> {
  const text = query.trim();
  if (GREETING.test(text)) return welcomeMessage();

  const reference = text.match(REFERENCE);
  if (reference) {
    const name = reference[1].trim().replace(/^psalm$/i, "Psalms");
    const book = bibleBooks.find((item) => item.name.toLowerCase() === name.toLowerCase() || item.id === name.toLowerCase().replace(/\s+/g, "_"));
    const passage = book && parseRef(`${book.name} ${reference[2]}:${reference[3]}${reference[4] ? `-${reference[4]}` : ""}`);
    if (passage) return { id: uid(), role: "assistant", kind: "passage", passageRef: passageLabel(passage), lead: "Here is that passage." };
  }

  if (CRISIS.test(text)) return { ...topicReply("suicide"), crisis: true };

  const { mode, matches, vector } = await matchTopics(text);
  const limits = THRESHOLDS[mode];
  const top = matches[0];
  try {
    const { searchCatechism } = await import("./catechismSearch");
    const catechism = await searchCatechism(text, vector);
    if (catechism) {
      const scriptureTopic = top && top.score >= limits.answer ? top.topic : undefined;
      const sourceNotes = [
        catechism.question.parallelNo2Question ? `No. 3 source note: parallel to No. 2, question ${catechism.question.parallelNo2Question}.` : "",
        catechism.question.sourceAnnotation && !catechism.question.parallelNo2Question ? `No. 3 source annotation: ${catechism.question.sourceAnnotation}.` : "",
        catechism.question.sourceNote ?? "",
      ].filter(Boolean).join(" ");
      return {
        id: uid(), role: "assistant", kind: "catechism",
        lead: "Here is a related question and answer from the historical Baltimore Catechism.",
        topicId: scriptureTopic?.id,
        catechismEdition: catechism.edition.number,
        catechismEditionTitle: catechism.edition.title,
        catechismQuestionNumber: catechism.question.number,
        catechismGroupTitle: catechism.group.kind === "lesson" ? `Lesson ${catechism.group.number}: ${catechism.group.title}` : catechism.group.title,
        catechismQuestion: catechism.question.question,
        catechismAnswer: catechism.question.answer,
        catechismSourceNote: sourceNotes || undefined,
      };
    }
  } catch {
    // If the catechism data or index cannot load, continue with Sofi's existing Scripture response.
  }
  if (top && top.score >= limits.answer) {
    return { id: uid(), role: "assistant", kind: "answer", lead: pick(LEADS), topicId: top.topic.id, followUpIds: followUps(top.topic, matches.slice(1, 3), limits.suggest) };
  }
  const nearby = matches.filter((match) => match.score >= limits.suggest).slice(0, 3).map((match) => match.topic.id);
  const found = searchVerses(text);
  if (found) {
    return { id: uid(), role: "assistant", kind: "verses", keyword: found.keyword, passageRefs: found.hits.map((hit) => hit.ref), optionIds: nearby };
  }
  if (top && top.score >= limits.suggest) {
    return { id: uid(), role: "assistant", kind: "suggest", optionIds: nearby };
  }
  return { id: uid(), role: "assistant", kind: "fallback", optionIds: FALLBACK_STARTERS.filter((id) => getTopic(id)) };
}
