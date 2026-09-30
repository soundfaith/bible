import { ArrowRight, BookOpen, Bookmark, Compass, Layers3 } from "lucide-react";
import type { ReadingPosition } from "./ChapterPage";

export function HomePage({ lastReading, onResume, onChoose, onMass, onExplore }: { lastReading: ReadingPosition; onResume: () => void; onChoose: () => void; onMass: () => void; onExplore: () => void }) {
  const card = (icon: React.ReactNode, title: string, copy: string, action: string, onClick: () => void) => <article className="landing-card" onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }} role="button" tabIndex={0}>{icon}<h3>{title}</h3><p>{copy}</p><button className="text-link" onClick={(event) => { event.stopPropagation(); onClick(); }}>{action} <ArrowRight size={14} /></button></article>;
  const isBeginning = lastReading.bookId === "genesis" && lastReading.chapter === 1;
  return <main className="landing-page">
    <section className="landing-hero section-wrap"><div className="landing-hero-copy reveal"><p className="eyebrow"><span className="eyebrow-dot" /> Soundfaith Bible</p><h1>A little more<br /><em>room to read.</em></h1><p className="hero-description">A quiet place to return to the Scriptures, one chapter at a time. Pick up where you left off or find a new passage to sit with.</p><div className="hero-actions"><button className="button button-coral" onClick={onResume}>Resume reading <ArrowRight size={16} /></button><button className="text-link" onClick={onChoose}>Choose a passage <ArrowRight size={14} /></button></div></div></section>
    <section className="landing-intro section-wrap"><div><p className="eyebrow">A simple rhythm</p><h2>Find the words<br /><em>you need today.</em></h2></div></section>
    <section className="landing-principles section-wrap">
      {card(<BookOpen size={21} />, "Pray with today’s readings", "Enter the Scriptures appointed for today’s Mass and carry their words into your day.", "Open today’s readings", onMass)}
      {card(<Bookmark size={21} />, "Return to your place", "Pick up the thread where you last read, and let the next chapter meet you there.", "Continue reading", onResume)}
      {card(<Compass size={21} />, "Seek a word", "Bring a question, a hope, or a feeling. Find a passage to sit with.", "Explore Scripture", onExplore)}
    </section>
    <section className="landing-invitation section-wrap"><Layers3 size={20} /><p className="eyebrow">Your next quiet moment</p><h2>{isBeginning ? "Begin at the beginning." : "Your place is still here."}</h2><button className="button button-dark" onClick={onResume}>Open {isBeginning ? "Genesis 1" : "your last chapter"} <ArrowRight size={15} /></button></section>
  </main>;
}
