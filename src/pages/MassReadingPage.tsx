import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getParagraphs } from "../lib/bible";
import { getAvailableMassReadingDates, getMassReadingForDate, getTodaysMassReading, referenceLabel, resolveReference } from "../lib/readings";
import { NarratorButton } from "../components/NarratorButton";

const labels: Record<string, string> = { firstReading: "First reading", secondReading: "Second reading", psalm: "Responsorial psalm", gospel: "Gospel" };
const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const dateLabel = (date: string, weekday = true) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { ...(weekday ? { weekday: "long" as const } : {}), month: "long", day: "numeric", year: "numeric" });
const dateKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function MassReadingPage({ onOpenReference, selectedDate, onSelectedDateChange }: { onOpenReference: (reference: string) => void; selectedDate: string; onSelectedDateChange: (date: string) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const entry = getMassReadingForDate(selectedDate) || getTodaysMassReading();
  const narrationText = Object.values(entry.readings).map((reading) => reading.text).join("\n\n");
  const changeDate = (date: string) => { onSelectedDateChange(date); setCalendarOpen(false); };
  return <main className="mass-page section-wrap">
    <div className="mass-mobile-toolbar"><div><strong>{dateLabel(entry.date)}</strong><span>{entry.season}</span></div><button className="icon-button" onClick={() => setCalendarOpen(true)} aria-label="Choose Mass reading date"><CalendarDays size={18} /></button></div>
    <header className="mass-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> Mass reading</p><h1>A daily table<br /><em>of the word.</em></h1><p className="mass-date"><strong>{dateLabel(entry.date)}</strong><span>{entry.season}</span></p></div><div className="mass-heading-actions"><NarratorButton text={narrationText} /><button className="mass-calendar-trigger" onClick={() => setCalendarOpen(true)}><CalendarDays size={17} /><span>Choose date</span></button></div></header>
    <div className="mass-reading-list">{Object.entries(entry.readings).map(([key, reading]) => <article className="mass-reading-card" key={key}><div className="mass-reading-meta"><span>{labels[key] || key}</span><strong>{referenceLabel(reading.reference)}</strong></div><div className="mass-reading-text">{getParagraphs(resolveReference(reading.reference)).map((paragraph) => <p key={paragraph.id}>{paragraph.verses.map((verse) => <span key={verse.verse}><sup>{verse.verse}</sup>{verse.text} </span>)}</p>)}</div><button className="text-link" onClick={() => onOpenReference(reading.reference)}>Read in chapter <ArrowRight size={14} /></button></article>)}</div>
    <footer className="mass-source"><BookOpen size={15} /><span>World English Bible · Catholic lectionary references</span></footer>
    {calendarOpen && <MassCalendar selectedDate={entry.date} onSelect={changeDate} onClose={() => setCalendarOpen(false)} />}
  </main>;
}

function MassCalendar({ selectedDate, onSelect, onClose }: { selectedDate: string; onSelect: (date: string) => void; onClose: () => void }) {
  const availableDates = getAvailableMassReadingDates();
  const available = new Set(availableDates);
  const selected = new Date(`${selectedDate}T00:00:00`);
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  useEffect(() => setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)), [selectedDate]);
  const firstMonth = new Date(Number(availableDates[0].slice(0, 4)), Number(availableDates[0].slice(5, 7)) - 1, 1);
  const lastDate = availableDates[availableDates.length - 1];
  const lastMonth = new Date(Number(lastDate.slice(0, 4)), Number(lastDate.slice(5, 7)) - 1, 1);
  const minMonth = month.getFullYear() === firstMonth.getFullYear() && month.getMonth() === firstMonth.getMonth();
  const maxMonth = month.getFullYear() === lastMonth.getFullYear() && month.getMonth() === lastMonth.getMonth();
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <div className="modal-backdrop mass-calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal confirmation mass-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="mass-calendar-title" style={{ "--library-accent": "var(--accent)", "--library-sage": "var(--sage)" } as React.CSSProperties}>
      <button className="modal-close" onClick={onClose} aria-label="Close calendar"><X size={18} /></button>
      <p className="eyebrow">Mass readings</p><h2 id="mass-calendar-title">Choose a <em>date.</em></h2>
      <div className="library-calendar mass-calendar">
        <div className="calendar-header"><strong id="mass-calendar-month">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><span><button disabled={minMonth} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={14} /></button><button disabled={maxMonth} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={14} /></button></span></div>
        <div className="calendar-week">{weekdayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="calendar-days">{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: dayCount }, (_, index) => {
          const day = index + 1;
          const key = dateKey(month.getFullYear(), month.getMonth(), day);
          const enabled = available.has(key);
          return <button key={key} className={key === selectedDate ? "selected" : ""} disabled={!enabled} onClick={() => onSelect(key)} aria-label={dateLabel(key)}>{day}</button>;
        })}</div>
      </div>
      <p className="mass-calendar-selected">{dateLabel(selectedDate)}</p>
    </section>
  </div>;
}
