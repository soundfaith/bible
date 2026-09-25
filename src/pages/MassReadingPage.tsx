import { ArrowRight, CalendarDays, BookOpen } from "lucide-react";
import { getParagraphs } from "../lib/bible";
import { getTodaysMassReading, referenceLabel, resolveReference } from "../lib/readings";
import { NarratorButton } from "../components/NarratorButton";

const labels: Record<string, string> = { firstReading: "First reading", secondReading: "Second reading", psalm: "Responsorial psalm", gospel: "Gospel" };
export function MassReadingPage({ onOpenReference }: { onOpenReference: (reference: string) => void }) {
  const entry = getTodaysMassReading();
  const readingDate = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const narrationText = Object.values(entry.readings).map((reading) => reading.text).join("\n\n");
  return <main className="mass-page section-wrap"><header className="mass-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> Today&apos;s Mass reading</p><h1>A daily table<br /><em>of the word.</em></h1><p className="mass-date"><strong>{readingDate}</strong><span>{entry.season}</span></p></div><div className="mass-heading-actions"><NarratorButton text={narrationText} /><CalendarDays size={22} /></div></header><div className="mass-reading-list">{Object.entries(entry.readings).map(([key, reading]) => <article className="mass-reading-card" key={key}><div className="mass-reading-meta"><span>{labels[key] || key}</span><strong>{referenceLabel(reading.reference)}</strong></div><div className="mass-reading-text">{getParagraphs(resolveReference(reading.reference)).map((paragraph) => <p key={paragraph.id}>{paragraph.verses.map((verse) => <span key={verse.verse}><sup>{verse.verse}</sup>{verse.text} </span>)}</p>)}</div><button className="text-link" onClick={() => onOpenReference(reading.reference)}>Read in chapter <ArrowRight size={14} /></button></article>)}</div><footer className="mass-source"><BookOpen size={15} /><span>World English Bible · Catholic lectionary references</span></footer></main>;
}