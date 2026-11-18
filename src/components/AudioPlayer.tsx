import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Headphones, Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { seriesFor } from "../lib/audioPlaylists";
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
        {playing ? <span className="mobile-nav-player-bars"><i /><i /><i /></span> : <Play size={18} />}
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
  return <div ref={overlayRef} className={`audio-player-overlay${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={`Player: ${track.title}`}>
    <div ref={panelRef} className="audio-player">

      <div className={`audio-player-art${narration.status === "playing" ? " is-playing" : ""}`} onPointerDown={startDrag}>
        <CardArt art={track.art} />
        <button ref={closeRef} className="audio-player-close" type="button" onClick={onClose} aria-label="Back"><ArrowLeft size={20} /></button>
      </div>
      <h1>{track.title}</h1>
      <NarrationProgress className="audio-player-seek" narration={narration} />
      <button className="audio-player-play" type="button" onClick={onToggle} aria-label={narration.status === "playing" ? "Pause" : narration.status === "paused" ? "Resume" : "Play again"}>{narration.status === "playing" ? <Pause size={26} /> : <Play size={26} />}</button>
      <div className="audio-player-skip">
        <button type="button" onClick={onPrevious} disabled={currentIndex <= 0}><ChevronLeft size={18} /> Previous</button>
        <button type="button" onClick={onNext}>Next <ChevronRight size={18} /></button>
      </div>
      {onSkipIntro && <button className="audio-player-skip-intro" type="button" onClick={onSkipIntro}><SkipForward size={15} aria-hidden="true" /> Skip intro</button>}
      {series && <details key={`series:${track.path}`} className="audio-player-section audio-player-series"><summary><span className="audio-player-head">This series</span><span className="audio-player-series-name">{series.title}</span><ChevronDown size={18} className="audio-player-chevron" aria-hidden="true" /></summary><ol>{series.entries.map((entry) => <li key={entry.label}><button type="button" className={entry.current ? "current" : undefined} aria-current={entry.current ? "true" : undefined} onClick={() => entry.path ? onNavigate(entry.path) : entry.playIndex !== undefined && onSelectEpisode?.(entry.playIndex)}><span className={entry.done ? "audio-player-check is-done" : "audio-player-check"} aria-hidden="true">{entry.done ? "✓" : ""}</span>{entry.label}</button></li>)}</ol></details>}
      <details key={track.path} className="audio-player-section audio-player-transcript"><summary><span className="audio-player-head">Transcript</span><ChevronDown size={18} className="audio-player-chevron" aria-hidden="true" /></summary><div>{(track.transcript ?? narration.text).split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>
      {actions.length > 0 && <nav className="audio-player-actions" aria-label="Content actions">{actions.map((action) => <button key={action.label} type="button" onClick={() => onNavigate(action.href)}>{action.label} <ChevronRight size={16} /></button>)}</nav>}
    </div>
  </div>;
}
