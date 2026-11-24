import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Headphones, Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { seriesFor } from "../lib/audioPlaylists";
import { bibleBooks } from "../lib/bible";
import { buildRosarySequence } from "../data/rosary";
import { CardArt } from "./LandingSmallCard";
import { NarrationProgress, type NarrationSnapshot, type NarrationTrack } from "./NarratorButton";

type Props = { narration: NarrationSnapshot; onToggle: () => void };

function contentActions(track: NarrationTrack): { label: string; href: string }[] {
  const sequence = track.sequence;
  if (track.path.startsWith("#/read?")) return [{ label: "Read Chapter", href: track.path }, { label: "Browse Book", href: "#/bible" }];
  if (sequence?.kind === "guided") return [{ label: "Browse Journey", href: `#/journeys/${sequence.journeyId}` }];
  if (sequence?.kind === "breviary") return [{ label: "Read Hour", href: track.path }, { label: "Browse Hours", href: "#/breviary" }];
  if (sequence?.kind === "rosary") return [{ label: "Read Rosary", href: track.path }, { label: "Browse Mysteries", href: "#/rosary" }];
  if (sequence?.kind === "bible-journey") return [{ label: "Read Period", href: `#/journey/${sequence.periodId}` }, { label: "Browse Journey", href: "#/journey" }];
  if (track.art === "readings") return [{ label: "Read Reading", href: track.path }, { label: "Browse Readings", href: "#/mass" }];
  if (track.art === "saints") return [{ label: "Read Saint", href: track.path }, { label: "Browse Saints", href: "#/saints" }];
  if (sequence?.kind === "catechism") return [{ label: "Read Lesson", href: track.path }, { label: "Browse Course", href: `#/catechism/${sequence.edition}` }];
  if (sequence?.kind === "summa") return [{ label: sequence.article === undefined ? "Read Question" : "Read Article", href: track.path }, { label: "Browse Summa", href: "#/summa" }];
  return [];
}

function trackContext(track: NarrationTrack) {
  if (track.path.startsWith("#/read?")) {
    const query = new URLSearchParams(track.path.split("?")[1] ?? "");
    const bookId = query.get("book");
    const bookIndex = bibleBooks.findIndex((book) => book.id === bookId);
    const book = bookIndex >= 0 ? bibleBooks[bookIndex] : undefined;
    const chapter = Number(query.get("chapter"));
    return {
      context: bookIndex >= 0 ? bookIndex < 39 ? "Old Testament" : "New Testament" : "Sacred Scripture",
      title: book?.name ?? track.title,
      detail: book && Number.isInteger(chapter) ? `${book.name} ${chapter}` : "",
    };
  }
  const sequence = track.sequence;
  if (sequence?.kind === "breviary") {
    const title = sequence.hour ? `${sequence.hour[0].toUpperCase()}${sequence.hour.slice(1)}` : "Prayer";
    return { context: "Liturgy of the Hours", title, detail: "" };
  }
  if (sequence?.kind === "rosary") {
    const rosary = buildRosarySequence(sequence.mode, sequence.mysteryIndex);
    const clip = rosary.clips[sequence.clipIndex];
    const segmentIndex = clip?.segmentIndex ?? 0;
    if (segmentIndex > 0 && segmentIndex <= rosary.decades.length) {
      const ordinal = ["First", "Second", "Third", "Fourth", "Fifth"][segmentIndex - 1] ?? `Mystery ${segmentIndex}`;
      const sceneTitle = rosary.decades[segmentIndex - 1]?.scene.title ?? "Rosary Mystery";
      return { context: "The Rosary", title: sceneTitle.replace(/^The\s+/i, ""), detail: `${ordinal} Mystery` };
    }
    return { context: "The Rosary", title: segmentIndex === 0 ? "Opening Prayers" : "Closing Prayers", detail: "" };
  }
  const context = sequence?.kind === "guided" ? "Guided Journey"
    : sequence?.kind === "catechism" ? "Baltimore Catechism"
          : sequence?.kind === "summa" ? "Summa Theologiae"
            : sequence?.kind === "bible-journey" ? "Bible Journey"
              : track.art === "readings" ? "Mass Readings"
                : track.art === "saints" ? "Saint of the Day"
                  : "SoundFaith Audio";
  return { context, title: track.title, detail: seriesFor(track)?.title ?? "" };
}

function AudioSeries({ track, onNavigate, onSelectEpisode }: { track: NarrationTrack; onNavigate: (path: string) => void; onSelectEpisode?: (index: number) => void }) {
  const series = seriesFor(track);
  const [expanded, setExpanded] = useState(false);
  if (!series) return null;
  const currentIndex = series.entries.findIndex((entry) => entry.current);
  const initialEntries = series.entries.filter((entry, index) => index < 5 || index === currentIndex);
  const visibleEntries = expanded ? series.entries : initialEntries;
  const renderEntry = (entry: (typeof series.entries)[number]) => <li key={entry.label}><button type="button" className={entry.current ? "current" : undefined} aria-current={entry.current ? "true" : undefined} onClick={() => entry.path ? onNavigate(entry.path) : entry.playIndex !== undefined && onSelectEpisode?.(entry.playIndex)}><span className={entry.done ? "audio-player-check is-done" : "audio-player-check"} aria-hidden="true">{entry.done ? "✓" : entry.current ? "•" : ""}</span><span className="audio-player-series-entry">{entry.label}</span>{entry.current && <span className="audio-player-now">Now playing</span>}</button></li>;
  return <section className="audio-player-series">
    <h2>This Series <span>{series.title}</span></h2>
    <ol>{visibleEntries.map(renderEntry)}</ol>
    {series.entries.length > initialEntries.length && <button type="button" className="audio-player-series-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : `Show all ${series.entries.length} items`}</button>}
  </section>;
}

const MINIMISE_DISTANCE = 120;

export function NavPlayer({ narration, playerOpen, onToggle, onOpen, onListen }: { narration: NarrationSnapshot; playerOpen: boolean; onToggle: () => void; onOpen: () => void; onListen: () => void }) {
  const tapTimer = useRef<number | null>(null);
  useEffect(() => () => { if (tapTimer.current !== null) window.clearTimeout(tapTimer.current); }, []);
  const track = narration.track;
  const hasTrack = narration.status !== "idle" && !!track;
  const showArt = hasTrack && !playerOpen && !!track;
  const playing = narration.status === "playing";
  const handleTap = () => {
    if (!hasTrack || playerOpen) { onListen(); return; }
    if (tapTimer.current !== null) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      onOpen();
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      onToggle();
    }, 250);
  };
  return <button type="button" className={showArt ? "mobile-nav-player has-art" : "mobile-nav-player"} onClick={handleTap} aria-label={showArt ? `${playing ? "Pause" : "Resume"} ${track?.title ?? ""}. Double tap to open the player` : "Listen"}>
    {showArt && track ? <>
      <CardArt art={track.art} className="mobile-nav-player-art" />
      <span className={playing ? "mobile-nav-player-state is-playing" : "mobile-nav-player-state"} aria-hidden="true">
        {playing ? <span className="mobile-nav-player-bars"><i /><i /><i /></span> : narration.status === "paused" ? <Pause size={18} fill="currentColor" /> : <Play size={18} />}
      </span>
    </> : <Headphones size={22} />}
  </button>;
}

export function AudioPlayer({ narration, closing = false, onToggle, onClose, onPrevious, onNext, onNavigate, onSelectEpisode, onSkipIntro }: Props & { closing?: boolean; onClose: () => void; onPrevious: () => void; onNext: () => void; onNavigate: (path: string) => void; onSelectEpisode?: (index: number) => void; onSkipIntro?: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    window.scrollTo(0, 0);
    overlayRef.current?.scrollTo(0, 0);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".audio-player-close")) return;
    const startY = event.clientY;
    let dy = 0;
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    const move = (moveEvent: PointerEvent) => {
      dy = Math.max(0, moveEvent.clientY - startY);
      if (panel) panel.style.transform = `translateY(${dy}px)`;
      if (overlay) overlay.style.opacity = String(Math.max(0.3, 1 - dy / 400));
    };
    const release = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      if (dy > MINIMISE_DISTANCE) {
        // The close animation starts from the current drag position so the sheet doesn't snap back first.
        panel?.style.setProperty("--drag-y", `${dy}px`);
        overlay?.style.setProperty("--overlay-o", overlay.style.opacity || "1");
        onCloseRef.current();
        return;
      }
      if (panel) panel.style.transition = "transform 220ms ease";
      if (overlay) overlay.style.transition = "opacity 220ms ease";
      if (panel) panel.style.transform = "";
      if (overlay) overlay.style.opacity = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  };
  const track = narration.track;
  if (!track) return null;
  const series = seriesFor(track);
  const currentIndex = series?.entries.findIndex((entry) => entry.current) ?? -1;
  const actions = contentActions(track);
  const context = trackContext(track);
  const bibleQuery = track.path.startsWith("#/read?") ? new URLSearchParams(track.path.split("?")[1] ?? "") : null;
  const bibleBookIndex = bibleQuery ? bibleBooks.findIndex((book) => book.id === bibleQuery.get("book")) : -1;
  const canPrevious = track.sequence?.kind === "guided" && track.sequence.day > 1
    || track.sequence?.kind === "catechism" && currentIndex > 0
    || track.sequence?.kind === "bible-journey" && track.sequence.storyIndex > -1
    || track.sequence?.kind === "rosary" && track.sequence.clipIndex > 0
    || track.sequence?.kind === "breviary" && track.sequence.segmentIndex > 0
    || track.sequence?.kind === "summa" && track.sequence.article === undefined && currentIndex > 0
    || track.art === "readings"
    || !!bibleQuery && (bibleBookIndex > 0 || Number(bibleQuery.get("chapter")) > 1);
  return <div ref={overlayRef} className={`audio-player-overlay${closing ? " is-closing" : ""}`} data-art={track.art} role="dialog" aria-modal="true" aria-label={`Player: ${track.title}`}>
    <div ref={panelRef} className="audio-player">
      <div className={`audio-player-art${narration.status === "playing" ? " is-playing" : ""}`} onPointerDown={startDrag}>
        <CardArt art={track.art} />
        <button ref={closeRef} className="audio-player-close" type="button" onClick={onClose} aria-label="Back"><ArrowLeft size={20} /></button>
      </div>
      <div className="audio-player-context"><span>{context.context}</span><h1>{context.title}</h1>{context.detail && context.detail !== context.title && <p>{context.detail}</p>}</div>
      <NarrationProgress className="audio-player-seek" narration={narration} />
      <button className="audio-player-play" type="button" onClick={onToggle} aria-label={narration.status === "playing" ? "Pause" : narration.status === "paused" ? "Resume" : "Play again"}>{narration.status === "playing" || narration.status === "paused" ? <Pause size={26} /> : <Play size={26} />}</button>
      {onSkipIntro && <button className="audio-player-skip-intro" type="button" onClick={onSkipIntro}><SkipForward size={15} aria-hidden="true" /> Skip intro</button>}
      <div className="audio-player-skip">
        <button type="button" onClick={onPrevious} disabled={!canPrevious}><ChevronLeft size={20} /><span>Previous</span></button>
        <button type="button" onClick={onNext}><span>Next</span><ChevronRight size={20} /></button>
      </div>
      <AudioSeries key={`${track.path}:${JSON.stringify(track.sequence ?? null)}`} track={track} onNavigate={onNavigate} onSelectEpisode={onSelectEpisode} />
      <details key={track.path} className="audio-player-section audio-player-transcript"><summary><span className="audio-player-head">Transcript</span><ChevronDown size={18} className="audio-player-chevron" aria-hidden="true" /></summary><div>{(track.transcript ?? narration.text).split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>
      {actions.length > 0 && <nav className="audio-player-links" aria-label="Related content">{actions.map((action) => <button key={action.label} type="button" onClick={() => onNavigate(action.href)}>{action.label}</button>)}</nav>}
    </div>
  </div>;
}
