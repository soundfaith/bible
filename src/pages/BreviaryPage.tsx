import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Headphones, Pause, Play, X } from "lucide-react";
import { BreviaryArtwork } from "../components/BreviaryArtwork";
import {
  breviaryHourInfo,
  breviaryHours,
  currentBreviaryHour,
  isBreviaryHour,
  type BreviaryDay,
  type BreviaryHour,
} from "../lib/breviary";

type BreviaryAudioStatus = "idle" | "playing" | "paused";

const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const CALENDAR_YEAR_SPAN = 3;
const dateLabel = (date: Date, weekday = true) =>
  date.toLocaleDateString(undefined, { ...(weekday ? { weekday: "long" as const } : {}), month: "long", day: "numeric", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

type DateProps = { date: Date; onDateChange: (date: Date) => void };

function BreviaryDateBar({ date, caption, onOpen }: { date: Date; caption: string; onOpen: () => void }) {
  return (
    <div className="mass-mobile-toolbar">
      <div><strong>{dateLabel(date)}</strong><span>{caption}</span></div>
      <button className="icon-button" onClick={onOpen} aria-label="Choose breviary date"><CalendarDays size={18} /></button>
    </div>
  );
}

export function BreviaryLibrary({ date, seasonName, saintName, onDateChange }: DateProps & { seasonName: string; saintName: string | null }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const caption = saintName ? `${saintName} · ${seasonName}` : seasonName;
  const currentHour = breviaryHourInfo[currentBreviaryHour()];
  return (
    <main className="journey-page breviary-page section-wrap">
      <header className="journey-heading">
        <div className="journey-heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> The Liturgy of the Hours</p>
          <h1>Daily <em>Breviary</em></h1>
          <p className="journey-intro">
            Pray with the Church at the turning points of the day: praise at dawn, thanksgiving at dusk, and trust as the night begins.
          </p>
          <p className="breviary-date-line"><strong>{dateLabel(date)}</strong><span>{caption}</span></p>
          <div className="breviary-heading-actions">
            <a className="button button-coral journey-resume-button" href={`#/breviary/${currentBreviaryHour()}`}>
              Pray {currentHour.name} <ArrowRight size={15} aria-hidden="true" />
            </a>
            <button className="button button-outline breviary-date-button" onClick={() => setCalendarOpen(true)}><CalendarDays size={17} /><span>Choose date</span></button>
          </div>
        </div>
      </header>

      <section className="journey-library" aria-labelledby="breviary-library-title">
        <div className="journey-library-heading">
          <div>
            <p className="eyebrow">Three hours of prayer</p>
            <h2 id="breviary-library-title">Pray the hours.</h2>
          </div>
        </div>
        <ol className="journey-library-list breviary-library-list">
          {breviaryHours.map((hour) => {
            const info = breviaryHourInfo[hour];
            return (
              <li className="journey-library-item" key={hour}>
                <a className="journey-library-card" href={`#/breviary/${hour}`} aria-label={`${info.name}, ${info.time}: ${info.blurb}`}>
                  <BreviaryArtwork hour={hour} />
                  <span className="journey-library-copy">
                    <span className="journey-period-label"><span>{info.time}</span></span>
                    <strong>{info.name}</strong>
                    <span className="journey-library-teaser">{info.blurb}</span>
                    <span className="journey-library-meta">Pray now <ArrowRight size={14} aria-hidden="true" /></span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>
      {calendarOpen && <BreviaryCalendar date={date} onSelect={(value) => { onDateChange(value); setCalendarOpen(false); }} onClose={() => setCalendarOpen(false)} />}
    </main>
  );
}

type BreviaryPageProps = DateProps & {
  hour: string;
  day: BreviaryDay | null;
  audioStatus: BreviaryAudioStatus;
  activeSegmentIndex: number;
  audioError: string | null;
  onToggleAudio: () => void;
  onSelectSegment: (index: number) => void;
};

export function BreviaryPage({ hour, day, date, onDateChange, audioStatus, activeSegmentIndex, audioError, onToggleAudio, onSelectSegment }: BreviaryPageProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  if (!isBreviaryHour(hour) || !day) {
    return (
      <main className="journey-page section-wrap">
        <a className="journey-back-link" href="#/breviary"><ArrowLeft size={16} /> All hours</a>
        <section className="journey-not-found" aria-labelledby="breviary-not-found-title">
          <p className="eyebrow">Breviary</p>
          <h1 id="breviary-not-found-title">Hour not found</h1>
          <p>Choose Lauds, Vespers, or Compline from the list of hours.</p>
          <a className="journey-action-link" href="#/breviary">Back to all hours <ArrowRight size={16} /></a>
        </section>
      </main>
    );
  }
  const info = breviaryHourInfo[hour];
  const index = breviaryHours.indexOf(hour);
  const previous: BreviaryHour | undefined = breviaryHours[index - 1];
  const next: BreviaryHour | undefined = breviaryHours[index + 1];
  const caption = day.saint ? `${day.saint.name} · ${day.season.name}` : day.season.name;
  return (
    <main className="journey-page journey-detail-page breviary-page section-wrap">
      <nav className="journey-detail-nav" aria-label="Breviary navigation">        <a className="button button-outline" href="#/breviary"><ArrowLeft size={16} /> All hours</a>
        <button className="mass-calendar-trigger" onClick={() => setCalendarOpen(true)}><CalendarDays size={17} /><span>Choose date</span></button>
      </nav>

      <header className="journey-detail-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> {info.time} <span aria-hidden="true">/</span> {dateLabel(date, false)}</p>
        <h1>{info.name}</h1>
        <p className="journey-detail-overview">{info.blurb}</p>
        <p className="breviary-day-caption">
          <strong>{day.season.name}</strong>
          {day.saint && <span>{day.saint.rank ? `${day.saint.rank}: ` : ""}{day.saint.name}</span>}
        </p>
        <div className="journey-audio-controls">
          <button
            className="button button-coral journey-audio-listen"
            type="button"
            onClick={onToggleAudio}
            aria-label={audioStatus === "playing" ? "Pause prayer audio" : audioStatus === "paused" ? "Resume prayer audio" : `Listen to ${info.name}`}
            aria-pressed={audioStatus === "playing"}
          >
            {audioStatus === "playing" ? <Pause size={16} /> : audioStatus === "paused" ? <Play size={16} /> : <Headphones size={17} />}
            {audioStatus === "playing" ? "Pause audio" : audioStatus === "paused" ? "Resume audio" : `Listen to ${info.name}`}
          </button>
        </div>
        {audioError && <p className="journey-audio-error" role="status">{audioError}</p>}
        {(audioStatus === "playing" || audioStatus === "paused") && (
          <p className="journey-audio-status" aria-live="polite">
            {audioStatus === "playing" ? "Playing" : "Paused"}: {day.segments[activeSegmentIndex]?.heading}
          </p>
        )}
      </header>

      <BreviaryArtwork hour={hour} hero />

      {day.saint && (
        <aside className="breviary-saint" aria-label="Saint of the day">
          <p className="eyebrow">Saint of the day</p>
          <strong>{day.saint.name}</strong>
          <p>{day.saint.shortBiography}</p>
        </aside>
      )}

      <div className="journey-story-list">
        {day.segments.map((segment, segmentIndex) => {
          const active = audioStatus !== "idle" && activeSegmentIndex === segmentIndex;
          return (
            <article className="journey-story breviary-segment" id={`breviary-${segment.id}`} key={segment.id} aria-labelledby={`breviary-heading-${segment.id}`}>
              <div className="journey-story-content">
                <section className="journey-scripture">
                  <header className="journey-scripture-heading">
                    <h3 id={`breviary-heading-${segment.id}`}>{segment.heading}{segment.reference && <span className="breviary-reference"> · {segment.reference}</span>}</h3>
                    <div className="journey-scripture-actions">
                      <button
                        className={active ? "journey-story-play active" : "journey-story-play"}
                        type="button"
                        onClick={() => onSelectSegment(segmentIndex)}
                        aria-label={`Play ${segment.heading} and the rest of ${info.name}`}
                        aria-current={active ? "true" : undefined}
                      ><Play size={14} aria-hidden="true" /></button>
                    </div>
                  </header>
                  <div className="journey-scripture-verses bible-reading-copy" lang="en">
                    {segment.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                  </div>
                </section>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="journey-detail-footer">
        <div className="journey-detail-actions" aria-label="Hour navigation">
          {previous ? <a className="button button-outline journey-previous-action" href={`#/breviary/${previous}`} rel="prev"><ArrowLeft size={15} /> {breviaryHourInfo[previous].name}</a> : <span />}
          {next ? <a className="button button-outline journey-next-action" href={`#/breviary/${next}`} rel="next">{breviaryHourInfo[next].name} <ArrowRight size={15} /></a> : <span />}
        </div>
      </footer>
      {calendarOpen && <BreviaryCalendar date={date} onSelect={(value) => { onDateChange(value); setCalendarOpen(false); }} onClose={() => setCalendarOpen(false)} />}
    </main>
  );
}

function BreviaryCalendar({ date, onSelect, onClose }: { date: Date; onSelect: (date: Date) => void; onClose: () => void }) {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1));
  useEffect(() => setMonth(new Date(date.getFullYear(), date.getMonth(), 1)), [date]);
  const minMonth = monthIndex(today) - CALENDAR_YEAR_SPAN * 12;
  const maxMonth = monthIndex(today) + CALENDAR_YEAR_SPAN * 12;
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <div className="modal-backdrop mass-calendar-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal confirmation mass-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="breviary-calendar-title" style={{ "--library-accent": "var(--accent)", "--library-sage": "var(--sage)" } as React.CSSProperties}>
        <button className="modal-close" onClick={onClose} aria-label="Close calendar"><X size={18} /></button>
        <p className="eyebrow">Breviary</p><h2 id="breviary-calendar-title">Choose a <em>date.</em></h2>
        <div className="library-calendar mass-calendar">
          <div className="calendar-header">
            <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
            <span>
              <button disabled={monthIndex(month) <= minMonth} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={14} /></button>
              <button disabled={monthIndex(month) >= maxMonth} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={14} /></button>
            </span>
          </div>
          <div className="calendar-week">{weekdayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="calendar-days">
            {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
            {Array.from({ length: dayCount }, (_, index) => {
              const value = new Date(month.getFullYear(), month.getMonth(), index + 1);
              return <button key={index} className={sameDay(value, date) ? "selected" : ""} onClick={() => onSelect(value)} aria-label={dateLabel(value)}>{index + 1}</button>;
            })}
          </div>
        </div>
        <p className="mass-calendar-selected">{dateLabel(date)}</p>
      </section>
    </div>
  );
}
