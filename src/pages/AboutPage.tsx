import { ArrowRight, ArrowUpRight, BookOpen, Compass, Mail, MessageCircle, Sparkles, Sunrise } from "lucide-react";
import { AndroidDownload } from "../components/AndroidDownload";
import { OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { isNativeApp } from "../lib/platform";

const features = [
  { icon: BookOpen, title: "Bible", description: "Read Scripture, choose a book and chapter, and return to where you left off.", href: "#/bible" },
  { icon: Sunrise, title: "Breviary", description: "Pray Lauds, Vespers, or Compline with the daily prayer of the Church.", href: "#/breviary" },
  { icon: Compass, title: "Guided journeys", description: "Grow step by step with the No-Worry Journey and Bible Journey, with Advent, Lent, and more journeys to come.", href: "#/journeys" },
  { icon: Sparkles, title: "Faith formation", description: "Explore Catholic teaching and grow in understanding through the Catechism, Summa, and lives of the saints.", href: "#/catechism" },
  { icon: MessageCircle, title: "Conversations with Sofi", description: "Ask questions, seek guidance, and explore faith through thoughtful conversations with Sofi.", href: "#/" },
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
        <p className="page-intro">SoundFaith brings Bible, Breviary, guided journeys, and faith formation together to help you pray, learn, serve, and grow closer to God—with Sofi here for thoughtful questions and guidance along the way.</p>
      </header>

      <section className="about-features" aria-labelledby="about-features-title">
        <div className="about-section-heading">
          <p className="eyebrow">Pray, learn, grow</p>
          <h2 id="about-features-title">A daily path for faith.</h2>
        </div>
        <div className="about-feature-grid">
          {features.map(({ icon: Icon, title, description, href }) => (
            <a
              className="about-feature-item"
              href={href}
              key={title}
              onClick={title === "Conversations with Sofi" ? (event) => {
                event.preventDefault();
                window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
              } : undefined}
            >
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
        <div><p className="eyebrow">Our mission</p><h2>Helping you pray, learn,<br />serve, and grow closer to God.</h2></div>
        <p>We create thoughtful tools and guided experiences that support a life of prayer, deepen understanding, encourage service, and help faith take root in ordinary life.</p>
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

      <section className="about-contact" aria-labelledby="about-contact-title">
        <div className="about-contact-copy">
          <p className="eyebrow">A note from our team</p>
          <h2 id="about-contact-title">Built with faith</h2>
          <p>SoundFaith is an independent Catholic project created to help people pray, learn, serve, and grow closer to God through thoughtful digital tools.</p>
          <p>We welcome feedback, suggestions, bug reports, and ideas as SoundFaith continues to grow.</p>
          <a className="about-contact-email" href="mailto:soundfaith.core@gmail.com">soundfaith.core@gmail.com</a>
        </div>
        <div className="about-contact-actions">
          <a className="button button-primary" href="mailto:soundfaith.core@gmail.com">
            <MessageCircle size={16} aria-hidden="true" /> Send Feedback
          </a>
          <a className="button button-outline" href="mailto:soundfaith.core@gmail.com">
            <Mail size={16} aria-hidden="true" /> Contact Us
          </a>
        </div>
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
