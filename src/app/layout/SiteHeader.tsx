import type { RefObject } from "react";
import {
  Compass,
  Church,
  CalendarDays,
  Bookmark as BookmarkMenuIcon,
  House,
  CircleHelp,
  BookOpen,
  Landmark,
  Headphones,
  Menu,
  Minus,
  Plus,
  Sunrise,
  Sparkles,
  ScrollText,
  MessageCircle,
  X,
} from "lucide-react";
import { Brand, ThemeToggle } from "@/shared/ui";
import type { NarrationGender } from "@/platform/audio/narrationVoice";
import type { Route } from "../routing";
import { OPEN_ASSISTANT_EVENT } from "@/features/chat/assistant";

function RosaryMenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="6.2" strokeDasharray="0.2 2.45" />
      <path d="M12 14.7v3.1m-2.7 1.2h5.4M12 17.8v4" />
    </svg>
  );
}

type SiteHeaderProps = {
  route: Route;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  menuRef: RefObject<HTMLElement | null>;
  fontSize: number;
  setFontSize: (update: (size: number) => number) => void;
  voicePreference: NarrationGender;
  voicePreferenceError: boolean;
  onChangeVoicePreference: (gender: NarrationGender) => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
};

export function SiteHeader({
  route,
  menuOpen,
  setMenuOpen,
  menuRef,
  fontSize,
  setFontSize,
  voicePreference,
  voicePreferenceError,
  onChangeVoicePreference,
  theme,
  onThemeChange,
}: SiteHeaderProps) {
  return (
    <>
      <header className="site-header" ref={menuRef}>
        <Brand />
        <nav
          id="primary-navigation"
          className={menuOpen ? "main-nav nav-open" : "main-nav"}
          aria-label="Primary navigation"
        >
          <div className="menu-heading">
            <button
              className="icon-button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <a href="#/" className="mobile-drawer-link" aria-current={route === "home" ? "page" : undefined} onClick={() => setMenuOpen(false)}><House size={17} />Home</a>
          <a href="#/listen" className="mobile-drawer-link" aria-current={route === "listen" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Headphones size={17} />Listen</a>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Scripture &amp; growth</p>
            <a href="#/bible" className="mobile-drawer-link" aria-current={route === "read" || route === "bible" ? "page" : undefined} onClick={() => setMenuOpen(false)}><BookOpen size={17} />Bible</a>
            <a href="#/journeys" className="mobile-drawer-link mobile-catalog-link" aria-current={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Compass size={17} />Journeys</a>
            <a href="#/catechism" className="mobile-drawer-link" aria-current={route === "catechism" ? "page" : undefined} onClick={() => setMenuOpen(false)}><ScrollText size={17} />Catechism</a>
            <a href="#/summa" className="mobile-drawer-link" aria-current={route === "summa" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Landmark size={17} />Summa Theologiae</a>
          </div>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Prayer &amp; daily life</p>
            <a href="#/daily" className="mobile-drawer-link mobile-catalog-link" aria-current={route === "daily" ? "page" : undefined} onClick={() => setMenuOpen(false)}><CalendarDays size={17} />Daily rhythm</a>
            <a href="#/breviary" className="mobile-drawer-link" aria-current={route === "breviary" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Sunrise size={17} />Breviary</a>
            <a href="#/rosary" className="mobile-drawer-link" aria-current={route === "rosary" || route === "rosary-prayer" ? "page" : undefined} onClick={() => setMenuOpen(false)}><RosaryMenuIcon />Rosary</a>
            <a href="#/saints" className="mobile-drawer-link" aria-current={route === "saints" || route === "saint-profile" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Sparkles size={17} />Saints</a>
            <a href="#/mass" className="mobile-drawer-link" aria-current={route === "mass" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Church size={17} />Mass Readings</a>
          </div>
          <div className="mobile-drawer-group">
            <p className="mobile-drawer-group-title">Your library</p>
            <a href="#/bookmarks" className="mobile-drawer-link" aria-current={route === "bookmarks" ? "page" : undefined} onClick={() => setMenuOpen(false)}><BookmarkMenuIcon size={17} />Saved Passages</a>
            <a href="#/about" className="mobile-drawer-link" aria-current={route === "about" ? "page" : undefined} onClick={() => setMenuOpen(false)}><CircleHelp size={17} />About SoundFaith</a>
            <button type="button" className="mobile-drawer-link" onClick={() => { setMenuOpen(false); window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT)); }}><MessageCircle size={17} />Ask Sofi</button>
          </div>
          <section className="font-size-control" aria-label="Reading font size">
            <div className="font-size-heading"><span>Text size</span><span>{fontSize}px</span></div>
            <div className="font-size-preview">The Lord is my shepherd; I shall not want.</div>
            <div className="font-size-buttons">
              <button className="icon-button" aria-label="Decrease font size" disabled={fontSize <= 16} onClick={() => setFontSize((size) => Math.max(16, size - 2))}><Minus size={16} /></button>
              <button className="icon-button" aria-label="Increase font size" disabled={fontSize >= 30} onClick={() => setFontSize((size) => Math.min(30, size + 2))}><Plus size={16} /></button>
            </div>
          </section>
          <section className="voice-preference-control" aria-label="Narration voice">
            <span className="voice-preference-label">Narration voice</span>
            <div className="voice-preference-options">
              {(["male", "female"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={voicePreference === gender}
                  onClick={() => onChangeVoicePreference(gender)}
                >
                  {gender === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
            {voicePreferenceError && <p role="status">Could not save this preference. It will apply until you close the app.</p>}
          </section>
          <div className="mobile-menu-theme">
            <span>Theme</span>
            <ThemeToggle
              theme={theme}
              onChange={onThemeChange}
            />
          </div>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button mobile-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <button
          className="menu-scrim"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
