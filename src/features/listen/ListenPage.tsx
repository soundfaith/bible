import { ArrowRight, Play } from "lucide-react";
import { CardArt, type CardArtKey } from "@/shared/ui/LandingSmallCard";
import { FeedCard } from "@/shared/ui/FeedCard";
import { narrationDescription, type NarrationSnapshot } from "@/platform/audio/NarratorButton";
import { useHeaderAutoHide } from "@/lib/useHeaderAutoHide";

export type PlayKind = "old-testament" | "new-testament" | "gospels" | "bible-journey" | "freedom" | "no-worry" | "catechism" | "mass" | "rosary" | "breviary" | "summa" | "saint";
type Item = { title: string; detail: string; art: CardArtKey; path: string; play?: PlayKind };
const sections: { title: string; items: Item[] }[] = [
  { title: "Bible", items: [
    { title: "Old Testament", detail: "Begin with Genesis", art: "old-testament", path: "#/read?book=genesis&chapter=1", play: "old-testament" },
    { title: "New Testament", detail: "Begin with Matthew", art: "new-testament", path: "#/read?book=matthew&chapter=1", play: "new-testament" },
    { title: "Gospels", detail: "The life of Jesus", art: "gospels", path: "#/read?book=matthew&chapter=1", play: "gospels" },
    { title: "Bible Journey", detail: "The story of salvation", art: "bible-journey", path: "#/journey", play: "bible-journey" },
  ] },
  { title: "Prayer", items: [
    { title: "Rosary", detail: "Pray today's mysteries", art: "rosary", path: "#/rosary", play: "rosary" },
    { title: "Breviary", detail: "Pray the current hour", art: "prayer", path: "#/breviary", play: "breviary" },
    { title: "Mass Readings", detail: "Daily Scripture", art: "readings", path: "#/mass", play: "mass" },
  ] },
  { title: "Formation", items: [
    { title: "Baltimore Catechism", detail: "Lessons in the faith", art: "catechism", path: "#/catechism", play: "catechism" },
    { title: "Summa Theologiae", detail: "Begin with the first article", art: "summa", path: "#/summa", play: "summa" },
  ] },
  { title: "Saints", items: [{ title: "Saint of the Day", detail: "A life of faith", art: "saints", path: "#/saints/today", play: "saint" }, { title: "Explore the Saints", detail: "Stories of holy lives", art: "saints", path: "#/saints" }] },
  { title: "Journeys", items: [{ title: "15-Day Journey to Freedom from Attachment", detail: "Learning to let go", art: "freedom-journey", path: "#/journeys/freedom", play: "freedom" }, { title: "No-Worry Journey", detail: "Scripture, reflection and prayer", art: "journey", path: "#/journeys/no-worry", play: "no-worry" }, { title: "Bible Journey", detail: "Walk through Scripture", art: "bible-journey", path: "#/journey", play: "bible-journey" }] },
];

export function ListenPage({ narration, onOpenPlayer, onPlay, onPlayHero, durations, loading }: { narration: NarrationSnapshot; onOpenPlayer: () => void; onPlay: (kind: PlayKind, autoplay?: boolean) => void; onPlayHero: () => void; durations: Partial<Record<PlayKind, string>>; loading: PlayKind | null }) {
  useHeaderAutoHide();
  const openItem = (item: Item) => {
    if (item.play) onPlay(item.play);
    else window.location.hash = item.path;
  };
  const mobileItem = (item: Item) => <FeedCard
    key={item.title}
    art={item.art}
    title={item.title}
    meta={item.play && loading === item.play ? "Loading…" : item.play && durations[item.play] ? durations[item.play]! : item.detail}
    disabled={loading !== null && item.play !== undefined}
    onClick={() => openItem(item)}
  />;
  const recentlyAdded: Item = { title: "15-Day Journey to Freedom from Attachment", detail: "Learning to let go", art: "freedom-journey", path: "#/journeys/freedom", play: "freedom" };
  const renderItem = (item: Item) => <div className="listen-item listen-discovery-item" key={item.title}>
    <a className="listen-item-link" href={item.path}><CardArt art={item.art} showPlaying /><span><strong>{item.title}</strong><small>{item.detail}{item.play && durations[item.play] ? ` · ${durations[item.play]}` : ""}{loading && loading === item.play ? " · Loading…" : ""}</small></span></a>
    {item.play ? <button className="listen-play" type="button" aria-label={`Play ${item.title}`} disabled={loading !== null} onClick={() => item.play && onPlay(item.play)}><Play size={16} fill="currentColor" /></button> : <a className="listen-browse" href={item.path} aria-label={`Browse ${item.title}`}><ArrowRight size={16} /></a>}
  </div>;
  return <main className="listen-page section-wrap">
    <div className="mobile-home mobile-listen">
      <section className="feed-section feed-bleed">
        {narration.status !== "idle" && narration.track
          ? <FeedCard art={narration.track.art} title={narration.track.title} meta={narrationDescription(narration)} playBadge onClick={onPlayHero} />
          : <FeedCard art="bible" title="Start with Genesis" meta="Tap to start listening" playBadge onClick={() => onPlay(sections[0].items[0].play!, true)} />}
      </section>
      {sections.map((section) => <section className="feed-section" key={section.title}><p className="feed-eyebrow">{section.title}</p>
        <div className="feed-carousel">{section.items.filter((item) => item.play).map(mobileItem)}</div>
      </section>)}
      <section className="feed-section"><p className="feed-eyebrow">Recently Added</p>
        <div className="feed-carousel">{mobileItem(recentlyAdded)}</div>
      </section>
    </div>
    <div className="desktop-listen">
    <header><p className="eyebrow">A quieter way to listen</p><h1>Listen and <em>discover.</em></h1><p className="listen-empty">Tap play to start listening, or choose a collection to browse.</p></header>
    <section className="listen-section"><h2>Continue Listening</h2>
      {narration.status !== "idle" && narration.track
        ? <button className="listen-item" type="button" onClick={onOpenPlayer}><CardArt art={narration.track.art} /><span><strong>{narration.track.title}</strong><small>{narrationDescription(narration)}</small></span><ArrowRight size={16} /></button>
        : <p className="listen-empty">Choose something to listen to. Your current audio will appear here.</p>}
    </section>
    {sections.map((section) => <section className="listen-section" key={section.title}><h2>{section.title}</h2><div className="listen-grid">
      {section.items.map(renderItem)}
    </div></section>)}
    <section className="listen-section"><h2>Recently Added</h2><div className="listen-grid">{renderItem(recentlyAdded)}</div></section>
    </div>
  </main>;
}
