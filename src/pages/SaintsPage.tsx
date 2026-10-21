import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { getNarrationSnapshot, NarrationProgress, NarratorButton, pauseSpeaking, resumeSpeaking, startSpeaking } from "../components/NarratorButton";
import { SaintArtwork } from "../components/SaintArtwork";
import { saintGroups, saintGroupFor, saintNarrationText, saintSearchText, saints, saintsForDate, type SaintGroupId } from "../data/saints";
import { saintNarrationAudioUrlsFor } from "../lib/narrationAudio";
import { SAINT_NARRATION_TOGGLE_EVENT } from "../lib/saintsAudio";
import type { NarrationGender } from "../lib/narrationVoice";

const dateTitle = (date = new Date()) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
export function SaintsLibrary({ onOpenToday }: { onOpenToday: () => void }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | SaintGroupId>("all");
  const matching = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-US");
    const selectedGroup = saintGroups.find((item) => item.id === group);
    return saints.filter((saint) => {
      const inGroup = group === "all" || Boolean(selectedGroup && (selectedGroup.matches.length
        ? selectedGroup.matches.some((rank) => saint.ranks.includes(rank))
        : saintGroupFor(saint) === selectedGroup.id));
      return inGroup && (!normalized || saintSearchText(saint).includes(normalized));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [group, query]);
  const grouped = useMemo(() => (group === "all"
    ? saintGroups.map((entry) => ({ ...entry, entries: matching.filter((saint) => saintGroupFor(saint) === entry.id) }))
    : saintGroups.filter((entry) => entry.id === group).map((entry) => ({ ...entry, entries: matching })))
    .filter((entry) => entry.entries.length), [group, matching]);
  const columns = useMemo(() => {
    const result: typeof grouped[] = [[], []];
    const heights = [0, 0];
    grouped.forEach((entry) => {
      const column = heights[0] <= heights[1] ? 0 : 1;
      result[column].push(entry);
      heights[column] += entry.entries.length + 2;
    });
    return result;
  }, [grouped]);
  const filterPillsRef = useRef<HTMLDivElement>(null);
  const [filterScroll, setFilterScroll] = useState({ width: 100, left: 0, visible: false });

  useEffect(() => {
    const element = filterPillsRef.current;
    if (!element) return;
    const updateScrollIndicator = () => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      const width = maxScroll > 0 ? Math.max(12, (element.clientWidth / element.scrollWidth) * 100) : 100;
      const left = maxScroll > 0 ? (element.scrollLeft / maxScroll) * (100 - width) : 0;
      setFilterScroll({ width, left, visible: maxScroll > 0 });
    };
    updateScrollIndicator();
    element.addEventListener("scroll", updateScrollIndicator, { passive: true });
    const observer = new ResizeObserver(updateScrollIndicator);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", updateScrollIndicator);
      observer.disconnect();
    };
  }, [group]);

  return <main className="journey-page section-wrap saints-page">
    <header className="journey-heading saints-library-hero">
      <div className="journey-heading-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> Lives that point to Christ</p>
        <h1>Walk with the <em>saints.</em></h1>
        <p className="journey-intro">Meet the witnesses remembered by the Church, and spend a little time with their words and lives.</p>
        <button className="button button-coral journey-resume-button" type="button" onClick={onOpenToday}>Saint of the day <ArrowRight size={15} /></button>
      </div>
      <div className="saints-hero-art"><SaintArtwork hero /></div>
    </header>
    <section className="journey-library saints-library" aria-labelledby="saints-catalogue-title">
      <div className="journey-library-heading saints-catalogue-heading">
        <div><p className="eyebrow">A catalogue of witnesses</p><h2 id="saints-catalogue-title">Find a saint.</h2></div>
        <p>{saints.length} lives of holiness, grouped by their witness and service.</p>
      </div>
      <label className="saints-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search saints</span><input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search names, feast days, titles, patronage…" /><span className="saints-result-count">{matching.length}</span>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
      <div className="saints-filter-scroll">
        <div className="saints-filter-pills" ref={filterPillsRef} role="group" aria-label="Filter saints by group">
          <button type="button" className={group === "all" ? "active" : ""} aria-pressed={group === "all"} onClick={() => setGroup("all")}>All saints</button>
          {saintGroups.map((entry) => <button key={entry.id} type="button" className={group === entry.id ? "active" : ""} aria-pressed={group === entry.id} onClick={() => setGroup(entry.id)}>{entry.label}</button>)}
        </div>
        {filterScroll.visible && <div className="saints-filter-scroll-track" aria-hidden="true"><span style={{ width: `${filterScroll.width}%`, left: `${filterScroll.left}%` }} /></div>}
      </div>
      <div className="saints-groups">
        {columns.map((column, index) => <div className="saints-groups-column" key={index}>
          {column.map((entry) => <section className="saints-group" key={entry.id} aria-labelledby={`saints-group-${entry.id}`}>
            <header><h3 id={`saints-group-${entry.id}`}>{entry.label}</h3><span>{entry.entries.length}</span></header>
            <ul>{entry.entries.map((saint) => <li key={saint.slug}><a href={`#/saints/${saint.slug}`}><span><strong>{saint.name}</strong>{saint.title && <small>{saint.title}</small>}</span><span className="saints-row-feast">{saint.feast_day}<ArrowRight size={14} aria-hidden="true" /></span></a></li>)}</ul>
          </section>)}
        </div>)}
        {matching.length === 0 && <p className="saints-empty">No saints match “{query}”. Try another name, feast day, or group.</p>}
      </div>
      <p className="saints-source-note">Biographies and quotations are drawn from the <a href="https://github.com/joshx2415/torch-data" target="_blank" rel="noreferrer">Torch &amp; Lily saints dataset</a>. Visit <a href="https://torchandlily.com" target="_blank" rel="noreferrer">Torch &amp; Lily</a>.</p>
    </section>
  </main>;
}

export function SaintPage({ slug, voicePreference, nextStep }: { slug: string; voicePreference: NarrationGender; nextStep?: ReactNode }) {
  const daily = slug === "today";
  const todaysSaints = daily ? saintsForDate() : [];
  const featured = daily ? (todaysSaints.find((saint) => saint.quotes.length > 0) ?? todaysSaints[0]) : saints.find((saint) => saint.slug === slug);
  const saint = featured;
  const narration = useMemo(() => saint ? saintNarrationText(saint) : "", [saint?.slug]);
  const audioUrls = useMemo(() => saint ? saintNarrationAudioUrlsFor(saint.slug, voicePreference) : [], [saint?.slug, voicePreference]);

  useEffect(() => {
    if (!saint) return;
    const toggle = () => {
      const current = getNarrationSnapshot();
      if (current.text === narration && current.status === "playing") pauseSpeaking();
      else if (current.text === narration && current.status === "paused") resumeSpeaking(narration, audioUrls, undefined, undefined, voicePreference);
      else startSpeaking(narration, audioUrls, undefined, undefined, voicePreference);
    };
    window.addEventListener(SAINT_NARRATION_TOGGLE_EVENT, toggle);
    return () => window.removeEventListener(SAINT_NARRATION_TOGGLE_EVENT, toggle);
  }, [saint?.slug, narration, audioUrls, voicePreference]);

  if (!saint) return <main className="journey-page section-wrap saints-page saints-empty-day">
    <nav className="journey-detail-nav"><a className="button button-outline" href="#/saints">All saints</a></nav>
    <div className="saints-empty-day-card"><p className="eyebrow">{daily ? dateTitle() : "Saint profile"}</p><h1>{daily ? <>No saint is listed for <em>today yet.</em></> : <>This saint could not be <em>found.</em></>}</h1><p>{daily ? "This catalogue does not include a feast entry for this date. Browse the saints by name or group while the catalogue is updated." : "Browse the saints by name, feast day, or group to find another profile."}</p><a className="button button-coral" href="#/saints">Browse the saints <ArrowRight size={15} /></a></div>
    {nextStep}
  </main>;

  const otherSaints = daily ? todaysSaints.filter((item) => item.slug !== saint.slug) : [];
  const biography = saint.bio_markdown.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);

  return <main className={`journey-page journey-detail-page section-wrap saints-page${nextStep ? " has-next-step" : ""}`}>
    <nav className="journey-detail-nav" aria-label="Saint navigation"><a className="button button-outline" href="#/saints">All saints</a></nav>
    <header className="journey-detail-heading saints-detail-heading">
      <p className="eyebrow"><span className="eyebrow-dot" />{daily ? `Saints of the day · ${dateTitle()}` : `Feast day · ${saint.feast_day}`}</p>
      <h1>{saint.name}</h1>
      {saint.title && <p className="journey-detail-overview">{saint.title}</p>}
      <div className="journey-audio-controls"><NarratorButton text={narration} audioUrls={audioUrls} voicePreference={voicePreference} /></div>
      <NarrationProgress className="saint-narration-progress" />
    </header>
    <div className="saints-detail-art"><SaintArtwork saint={saint} hero /></div>
    <article className="saint-biography">
      {saint.quotes[0] && <blockquote className="saint-quote"><p>“{saint.quotes[0]}”</p><cite>{saint.name}</cite></blockquote>}
      <div className="saint-biography-copy bible-reading-copy" lang="en">{biography.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {saint.patronage.length > 0 && <p className="saint-patronage"><strong>Patron of:</strong> {saint.patronage.join(", ")}</p>}
    </article>
    {otherSaints.length > 0 && <section className="saints-also-today" aria-labelledby="also-today-title">
      <p className="eyebrow">Remembered today</p><h2 id="also-today-title">Also on {dateTitle()}.</h2>
      <div>{otherSaints.map((item) => <a key={item.slug} href={`#/saints/${item.slug}`}><strong>{item.name}</strong><span>{item.title ?? item.ranks.slice(1, 3).join(" · ")}</span><ArrowRight size={14} /></a>)}</div>
    </section>}
    <p className="saints-source-note">Biography and quotations from the <a href="https://github.com/joshx2415/torch-data" target="_blank" rel="noreferrer">Torch &amp; Lily saints dataset</a>. Visit <a href="https://torchandlily.com" target="_blank" rel="noreferrer">Torch &amp; Lily</a>.</p>
    {nextStep}
  </main>;
}
