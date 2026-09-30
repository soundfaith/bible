import { ArrowUpRight } from "lucide-react";

const soundfaithApps = [
  { name: "Breviary", description: "Pray the Liturgy of the Hours.", href: "https://breviary.soundfaith.app" },
  { name: "Catechism", description: "Explore the teachings of the Catholic faith.", href: "https://catechism.soundfaith.app" },
  { name: "Catechist Corner", description: "Find support and resources for catechesis.", href: "https://catechistcorner.soundfaith.app" },
  { name: "Giving", description: "Support faith communities through digital giving.", href: "https://giving.soundfaith.app" },
];

export function AboutPage() {
  return <main className="about-page section-wrap">
    <header className="about-heading">
      <p className="eyebrow"><span className="eyebrow-dot" /> About Soundfaith Bible</p>
      <h1>Scripture for<br /><em>everyday life.</em></h1>
      <p className="page-intro">Soundfaith Bible is a welcoming place to read, reflect, and return to the Word. Read a chapter at your own pace, follow the day’s Mass readings, search by topic or phrase, and save passages that stay with you.</p>
    </header>

    <section className="about-mission">
      <p className="eyebrow">Our mission</p>
      <div><h2>Help faith find a place<br />in the rhythm of each day.</h2><p>Soundfaith brings together simple digital tools for Scripture, prayer, learning, and generosity—so people can keep growing in faith wherever they are.</p></div>
    </section>

    <section className="about-apps" aria-labelledby="about-apps-title">
      <div className="about-apps-heading"><div><p className="eyebrow">One family of faith apps</p><h2 id="about-apps-title">Explore Soundfaith</h2></div><p>Each app has its own purpose, brought together by a shared desire to serve the life of faith.</p></div>
      <ul className="about-app-list">{soundfaithApps.map((app) => <li key={app.name}><a href={app.href} target="_blank" rel="noreferrer"><span><strong>{app.name}</strong><small>{app.description}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a></li>)}</ul>
    </section>
  </main>;
}
