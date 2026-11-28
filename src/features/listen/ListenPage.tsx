import { ArrowRight } from "lucide-react";
import { CardArt, type CardArtKey } from "@/shared/ui/LandingSmallCard";
import { FeedCard } from "@/shared/ui/FeedCard";
import { SofiAvatar } from "@/features/chat";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "@/features/chat/assistant";
import { type NarrationSnapshot } from "@/platform/audio/NarratorButton";
import { useHeaderAutoHide } from "@/lib/useHeaderAutoHide";
import { journeyCatalog } from "@/features/journeys/journeyCatalog";

export type PlayKind = "old-testament" | "new-testament" | "gospels" | "bible-current" | "bible-reference" | "bible-journey" | "freedom" | "no-worry" | "advent" | "catechism" | "mass" | "rosary" | "breviary" | "summa" | "saint";
type Item = { title: string; detail: string; art: CardArtKey; path: string };
const sections: { title: string; items: Item[] }[] = [
  { title: "Bible", items: [
    { title: "Bible", detail: "Browse books and chapters", art: "bible", path: "#/bible" },
  ] },
  { title: "Prayer", items: [
    { title: "Rosary", detail: "Browse the mysteries", art: "rosary", path: "#/rosary" },
    { title: "Breviary", detail: "Browse the hours of prayer", art: "prayer", path: "#/breviary" },
    { title: "Mass Readings", detail: "Read today's Scripture", art: "readings", path: "#/mass" },
  ] },
  { title: "Formation", items: [
    { title: "Baltimore Catechism", detail: "Browse lessons in the faith", art: "catechism", path: "#/catechism" },
    { title: "Summa Theologiae", detail: "Browse questions and articles", art: "summa", path: "#/summa" },
  ] },
  { title: "Saints", items: [
    { title: "Saints", detail: "Browse the saints catalogue", art: "saints", path: "#/saints" },
  ] },
  { title: "Journeys", items: [
    { title: "Journeys", detail: "Browse guided paths through Scripture and prayer", art: "journey", path: "#/journeys" },
  ] },
];

type MobileDiscoveryItem = Item & { play?: PlayKind; comingSoon?: boolean };
const mobileSections: { title: string; items: MobileDiscoveryItem[] }[] = [
  { title: "Scripture", items: [
    { title: "The Bible", detail: "Continue with the chapter before you", art: "bible", path: "#/bible", play: "bible-current" },
    { title: "Old Testament", detail: "Listen to the story of God’s people", art: "old-testament", path: "#/bible", play: "old-testament" },
    { title: "New Testament", detail: "Meet Jesus and the early Church", art: "new-testament", path: "#/bible", play: "new-testament" },
    { title: "The Gospels", detail: "Walk with Jesus through the Gospels", art: "gospels", path: "#/bible", play: "gospels" },
    { title: "Mass Readings", detail: "Pray with today’s readings", art: "readings", path: "#/mass", play: "mass" },
  ] },
  { title: "Prayer", items: [
    { title: "The Rosary", detail: "Rest in the mysteries of Christ", art: "rosary", path: "#/rosary", play: "rosary" },
    { title: "The Breviary", detail: "Let the hours shape your day", art: "prayer", path: "#/breviary", play: "breviary" },
  ] },
  { title: "Formation", items: [
    { title: "Baltimore Catechism", detail: "Grow in the foundations of faith", art: "catechism", path: "#/catechism", play: "catechism" },
    { title: "Summa Theologiae", detail: "Explore the wisdom of St. Thomas", art: "summa", path: "#/summa", play: "summa" },
  ] },
  { title: "Guided Journeys", items: [
    { title: "Advent Journey", detail: "Make room for hope, one day at a time", art: "advent-hero", path: "#/journeys/advent", play: "advent" },
    { title: "No-Worry Journey", detail: "A gentle path from anxiety toward trust", art: "no-worry-hero", path: "#/journeys/no-worry", play: "no-worry" },
    { title: "Freedom from Attachment", detail: "A 15-day path toward a freer heart", art: "freedom-hero", path: "#/journeys/freedom", play: "freedom" },
    { title: "Bible Journey", detail: "Travel through the story of Scripture", art: "bible-journey", path: "#/journeys", play: "bible-journey" },
    { title: journeyCatalog.lent.title, detail: "Coming soon", art: journeyCatalog.lent.artwork, path: "", comingSoon: true },
    { title: journeyCatalog["the-art-of-quiet"].title, detail: "Coming soon", art: journeyCatalog["the-art-of-quiet"].artwork, path: "", comingSoon: true },
  ] },
  { title: "Saints & Witnesses", items: [
    { title: "Saint of the Day", detail: "Spend a moment with a faithful witness", art: "saints", path: "#/saints", play: "saint" },
  ] },
];

export function ListenPage({ narration, onPlay }: { narration: NarrationSnapshot; onPlay: (kind: PlayKind) => void }) {
  useHeaderAutoHide();
  const mobileItem = (item: MobileDiscoveryItem) => <FeedCard
    key={item.title}
    art={item.art}
    title={item.title}
    meta={item.detail}
    comingSoon={item.comingSoon}
    onClick={() => { if (item.play) onPlay(item.play); }}
  />;
  const renderItem = (item: Item) => <div className="listen-item listen-discovery-item" key={item.title}>
    <a className="listen-item-link" href={item.path}>
      <CardArt art={item.art} />
      <span><strong>{item.title}</strong><small>{item.detail}</small></span>
      <ArrowRight size={16} aria-hidden="true" />
    </a>
  </div>;

  return <main className="listen-page section-wrap">
    <div className="mobile-home mobile-listen">
      <header className="mobile-browse-heading">
        <p className="eyebrow">A place for every season</p>
        <h1>Find a place to <em>begin.</em></h1>
        <p>Scripture, prayer, and gentle paths for growing closer to God. Choose a card and settle in.</p>
      </header>
      {mobileSections.map((section) => <section className="feed-section" key={section.title}>
        <p className="feed-eyebrow">{section.title}</p>
        <div className="feed-carousel">{section.items.map(mobileItem)}</div>
      </section>)}
      <section className="feed-section home-sofi">
        <button className="home-sofi-launch" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))} aria-label={`Chat with ${ASSISTANT_NAME}`}>
          <span className="home-sofi-mark"><SofiAvatar size={76} /></span>
          <span className="home-sofi-label">Ask {ASSISTANT_NAME}</span>
        </button>
      </section>
    </div>
    <div className="desktop-listen">
      <header><p className="eyebrow">A quieter way to listen</p><h1>Listen and <em>discover.</em></h1><p className="listen-empty">Choose a collection to explore. Playback begins from its content page.</p></header>
      <section className="listen-section"><h2>Continue Listening</h2>
        {narration.status !== "idle" && narration.track
          ? <a className="listen-item listen-item-link" href={narration.track.path}><CardArt art={narration.track.art} /><span><strong>{narration.track.title}</strong><small>Return to the current content</small></span><ArrowRight size={16} aria-hidden="true" /></a>
          : <p className="listen-empty">Your current item will appear here while audio is active.</p>}
      </section>
      {sections.map((section) => <section className="listen-section" key={section.title}>
        <h2>{section.title}</h2>
        <div className="listen-grid">{section.items.map(renderItem)}</div>
      </section>)}
    </div>
  </main>;
}
