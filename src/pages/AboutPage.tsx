import { ArrowRight, ArrowUpRight, BookOpen, Headphones, Heart, MessageCircle, Moon, Search, Sparkles } from "lucide-react";
import { OPEN_ASSISTANT_EVENT } from "../lib/assistant";

const features = [
  { icon: BookOpen, title: "Read the Bible", description: "Explore the World English Bible, choose a book and chapter, and keep your place as you read.", href: "#/bible" },
  { icon: Sparkles, title: "Follow the story", description: "Travel through twelve periods in the Bible Journey, with guided introductions and artwork.", href: "#/journey" },
  { icon: Headphones, title: "Listen and pray", description: "Hear Bible Journey stories and pray Lauds, Vespers, or Compline with the daily Breviary.", href: "#/breviary" },
  { icon: Search, title: "Find and save", description: "Search Scripture, bookmark passages, and return to the words you want to keep close.", href: "#/read" },
  { icon: Moon, title: "Make it yours", description: "Choose a reading size, switch between light and dark themes, and select a narration voice.", href: "#/read" },
  { icon: Heart, title: "Keep a daily rhythm", description: "Read the Mass readings, track your daily practice, and share passages with others.", href: "#/mass" },
];

const soundfaithApps = [
  { name: "Soundfaith Catechism", description: "Explore the teachings of the Catholic faith.", href: "https://catechism.soundfaith.app" },
  { name: "Catechist Corner", description: "Find support and resources for catechesis.", href: "https://catechistcorner.soundfaith.app" },
  { name: "Soundfaith Giving", description: "Support faith communities through digital giving.", href: "https://giving.soundfaith.app" },
];

export function AboutPage() {
  return (
    <main className="about-page section-wrap">
      <header className="about-heading">
        <img className="about-logo" src="/favicon.svg" alt="Soundfaith Bible logo" />
        <p className="eyebrow"><span className="eyebrow-dot" /> About Soundfaith Bible</p>
        <h1>Scripture for<br /><em>everyday life.</em></h1>
        <p className="page-intro">A welcoming place to read Scripture, pray with the Church, and build a steady rhythm of faith. Move at your own pace, listen when you need to, and return to the passages that speak to you.</p>
      </header>

      <section className="about-features" aria-labelledby="about-features-title">
        <div className="about-section-heading">
          <p className="eyebrow">Read, pray, return</p>
          <h2 id="about-features-title">A little room for faith, every day.</h2>
        </div>
        <div className="about-feature-grid">
          {features.map(({ icon: Icon, title, description, href }) => (
            <a className="about-feature-card" href={href} key={title}>
              <span className="about-feature-icon"><Icon size={18} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="about-feature-link">Explore <ArrowRight size={14} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="about-mission">
        <div><p className="eyebrow">Our mission</p><h2>Help faith find a place<br />in the rhythm of each day.</h2></div>
        <p>Soundfaith brings together simple digital tools for Scripture, prayer, learning, and generosity, serving people wherever they are on the journey of faith.</p>
      </section>

      <section className="about-apps" aria-labelledby="about-apps-title">
        <div className="about-section-heading">
          <p className="eyebrow">One family of faith apps</p>
          <h2 id="about-apps-title">Explore Soundfaith</h2>
          <p>Discover more ways to learn, serve, and support faith communities.</p>
        </div>
        <ul className="about-app-list">{soundfaithApps.map((app) => (
          <li key={app.name}><a href={app.href} target="_blank" rel="noreferrer"><span><strong>{app.name}</strong><small>{app.description}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a></li>
        ))}</ul>
      </section>

      <a className="about-assistant-link" href="#/" onClick={(event) => { event.preventDefault(); window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT)); }}>
        <MessageCircle size={17} aria-hidden="true" /> Need a hand finding your way? Ask the Scripture guide <ArrowRight size={15} aria-hidden="true" />
      </a>
    </main>
  );
}
