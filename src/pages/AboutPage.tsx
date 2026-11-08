import { ArrowRight, ArrowUpRight, BookOpen, Headphones, Heart, MessageCircle, Moon, Search, Sparkles } from "lucide-react";
import { AndroidDownload } from "../components/AndroidDownload";
import { OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { isNativeApp } from "../lib/platform";

const features = [
  { icon: BookOpen, title: "Read the Bible", description: "Explore the World English Bible, choose a book and chapter, and keep your place as you read.", href: "#/bible" },
  { icon: Sparkles, title: "Follow the story", description: "Travel through twelve periods in the Bible Journey, with guided introductions and artwork.", href: "#/journey" },
  { icon: Headphones, title: "Listen and pray", description: "Hear Bible Journey stories and pray Lauds, Vespers, or Compline with the daily Breviary.", href: "#/breviary" },
  { icon: Search, title: "Find and save", description: "Search Scripture, bookmark passages, and return to the words you want to keep close.", href: "#/read" },
  { icon: Moon, title: "Make it yours", description: "Choose a reading size, switch between light and dark themes, and select a narration voice.", href: "#/read" },
  { icon: Heart, title: "Keep a daily rhythm", description: "Read the Mass readings, track your daily practice, and share passages with others.", href: "#/mass" },
];

const soundfaithApps = [
  { name: "SoundFaith Catechism", description: "Explore the teachings of the Catholic faith.", href: "https://catechism.soundfaith.app", logo: "/apps/catechism.svg", category: "Faith formation" },
  { name: "Catechist Corner", description: "Build engaging lessons and find practical resources for catechists.", href: "https://catechistcorner.soundfaith.app", logo: "/apps/catechist-corner.svg", category: "For catechists" },
  { name: "Assembly", description: "Create polished presentations and song lyric slides in minutes.", href: "https://assembly.soundfaith.app", logo: "/apps/assembly.svg", category: "Presentations" },
  { name: "SoundFaith Giving", description: "Support faith communities through simple digital giving.", href: "https://giving.soundfaith.app", logo: "/apps/giving.svg", category: "Generosity" },
];

export function AboutPage() {
  return (
    <main className="about-page section-wrap">
      <header className="about-heading">
        <img className="about-logo" src="/favicon.svg" alt="SoundFaith logo" />
        <p className="eyebrow"><span className="eyebrow-dot" /> About SoundFaith</p>
        <h1>A faithful step,<br /><em>every day.</em></h1>
        <p className="page-intro">SoundFaith helps you find a steady rhythm of Scripture, prayer, and spiritual growth, with simple tools to meet you wherever you are.</p>
      </header>

      <section className="about-features" aria-labelledby="about-features-title">
        <div className="about-section-heading">
          <p className="eyebrow">Read, pray, return</p>
          <h2 id="about-features-title">A little room for faith, every day.</h2>
        </div>
        <div className="about-feature-grid">
          {features.map(({ icon: Icon, title, description, href }) => (
            <a className="about-feature-item" href={href} key={title}>
              <span className="about-feature-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="about-feature-copy">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <ArrowRight className="about-feature-arrow" size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="about-mission">
        <div><p className="eyebrow">Our mission</p><h2>Make room for what<br />brings us closer to God.</h2></div>
        <p>We create thoughtful digital tools for prayer, formation, service, and generosity, so faith can have a meaningful place in ordinary life.</p>
      </section>

      <section className="about-apps" aria-labelledby="about-apps-title">
        <div className="about-section-heading">
          <p className="eyebrow">One family of faith apps</p>
          <h2 id="about-apps-title">Explore SoundFaith</h2>
          <p>Each app is built for a different part of faith and service. Choose one to explore.</p>
        </div>
        <ul className="about-app-grid">{soundfaithApps.map((app) => (
          <li key={app.name}>
            <a className="about-app-card" href={app.href} target="_blank" rel="noreferrer">
              <span className="about-app-card-top">
                <img src={app.logo} alt="" />
                <span className="about-app-category">{app.category}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </span>
              <strong>{app.name}</strong>
              <span className="about-app-description">{app.description}</span>
              <span className="about-app-visit">Visit app <ArrowRight size={14} aria-hidden="true" /></span>
            </a>
          </li>
        ))}</ul>
      </section>

      {!isNativeApp() && (
        <section className="about-download" aria-labelledby="about-download-title">
          <div>
            <p className="eyebrow">Take it with you</p>
            <h2 id="about-download-title">SoundFaith for Android</h2>
            <p>Download the app for a focused, easy-to-return-to experience on your device.</p>
          </div>
          <AndroidDownload />
        </section>
      )}

      <a className="about-assistant-link" href="#/" onClick={(event) => { event.preventDefault(); window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT)); }}>
        <MessageCircle size={17} aria-hidden="true" /> Need a hand finding your way? Ask the Scripture guide <ArrowRight size={15} aria-hidden="true" />
      </a>
    </main>
  );
}
