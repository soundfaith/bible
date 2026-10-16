import { ArrowRight, Check, Flame, Share2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import { SofiaAvatar } from "../components/ChatWidget";
import { LandingBibleArtwork, LandingBreviaryArtwork, LandingChurchArtwork } from "../components/LandingArtwork";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { breviaryHourInfo, currentBreviaryHour } from "../lib/breviary";
import { doneToday, hasEverDone, routineStreak, type DailyItem, type DailyStreakState } from "../lib/dailyStreak";

type CardArtKey = "bible" | "journey" | "prayer" | "readings";

type HomePageProps = {
  onChoose: () => void;
  onMass: () => void;
  onJourney: () => void;
  onBreviary: () => void;
  onResume: () => void;
  bible: { started: boolean; label: string };
  streak: DailyStreakState;
  onOpenDaily: (item: DailyItem) => void;
  onShare: () => Promise<"shared" | "copied">;
};

function JourneyArtwork() {
  return (
    <svg className="landing-card-artwork" viewBox="0 0 400 200">
      <ellipse className="landing-journey-sun" cx="200" cy="100" rx="60" ry="22" />
      <path className="landing-journey-mountains-distant" d="M0 138l48-18 68-30 64 24 20-6 20 6 64-24 68 30 48 18v62H0z" />
      <path className="landing-journey-mountains-mid-left" d="M0 156q88-30 178-14v58H0z" />
      <path className="landing-journey-mountains-mid-right" d="M400 150q-92-32-184-10v60h184z" />
      <path className="landing-journey-ground" d="M0 176q100-14 200-2t200 4v22H0z" />
      <path
        className="landing-journey-path"
        d="M197 108C206 118 223 125 223 136C223 148 174 152 174 165C174 178 164 188 164 200H236C236 188 200 178 200 165C200 152 239 148 239 136C239 125 203 118 203 108Z"
      />
      <path className="landing-journey-path-line" d="M200 110C209 119 231 126 231 136C231 148 187 152 187 165C187 178 200 188 200 200" />
      <ellipse className="landing-journey-cairn" cx="140" cy="182" rx="10" ry="4.5" />
      <ellipse className="landing-journey-cairn" cx="141" cy="175" rx="7.5" ry="3.5" />
      <ellipse className="landing-journey-cairn" cx="142" cy="169" rx="5" ry="2.5" />
      <circle className="landing-journey-star-glow" cx="200" cy="42" r="16" />
      <path className="landing-journey-star" d="M200 22q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
      <circle className="landing-journey-star-center" cx="200" cy="42" r="2.5" />
      <path className="landing-journey-star-rays" d="M200 14v6m0 44v6m-28-28h6m44 0h6" />
    </svg>
  );
}

function CardArt({ art }: { art: CardArtKey }) {
  return (
    <div className={`landing-card-art landing-card-art--${art}`} aria-hidden="true">
      {art === "bible" ? <LandingBibleArtwork /> : art === "journey" ? <JourneyArtwork /> : art === "prayer" ? <LandingBreviaryArtwork /> : <LandingChurchArtwork />}
    </div>
  );
}

const primaryCards = [
  { art: "bible", title: "Bible", description: "Return to the Scriptures, one chapter at a time.", action: "Open Bible", onClick: "onChoose" },
  { art: "journey", title: "Bible Journey", description: "Follow the story of salvation through 12 periods.", action: "Continue Journey", onClick: "onJourney" },
  { art: "prayer", title: "Breviary", description: "Pray Lauds, Vespers, and Compline each day.", action: "Pray the Hours", onClick: "onBreviary" },
  { art: "readings", title: "Mass Reading", description: "Pray with today’s liturgy.", action: "Today’s Readings", onClick: "onMass" },
] as const;

type SmallCardProps = {
  art: CardArtKey;
  title: string;
  stat?: string;
  description?: string;
  action: string;
  done?: boolean;
  onClick: () => void;
};

function SmallCard({ art, title, stat, description, action, done, onClick }: SmallCardProps) {
  return (
    <button className={`landing-card landing-card--small${done ? " is-done" : ""}`} type="button" aria-label={`${title}: ${action}`} onClick={onClick}>
      <CardArt art={art} />
      <div className="landing-card-copy">
        <h3>{title}</h3>
        {stat && <p className="landing-card-stat"><Flame size={12} aria-hidden="true" /> {stat}</p>}
        {description && <p>{description}</p>}
        <span className="text-link">
          {done && <Check size={13} aria-hidden="true" />}
          {action} {!done && <ArrowRight size={14} />}
        </span>
      </div>
    </button>
  );
}

function streakText(days: number) {
  if (days >= 2) return `${days} days in a row`;
  if (days === 1) return "1 day, a lovely start";
  return "Welcome back. Begin again";
}

export function HomePage({ onChoose, onMass, onJourney, onBreviary, onResume, bible, streak, onOpenDaily, onShare }: HomePageProps) {
  const [shareNote, setShareNote] = useState("");
  const actions = { onChoose, onMass, onJourney, onBreviary };
  const hour = currentBreviaryHour();
  const hourName = breviaryHourInfo[hour].name;
  const done = doneToday(streak);
  const breviaryDone = done.includes(hour);
  const massDone = done.includes("mass");
  const breviaryEver = hasEverDone(streak, "breviary");
  const massEver = hasEverDone(streak, "mass");

  const routineCards: ReactElement[] = [];
  if (breviaryEver) {
    routineCards.push(
      <SmallCard
        key="breviary"
        art="prayer"
        title="Breviary"
        stat={streakText(routineStreak(streak, "breviary"))}
        action={breviaryDone ? `${hourName} prayed` : `Pray ${hourName}`}
        done={breviaryDone}
        onClick={() => onOpenDaily(hour)}
      />,
    );
  }
  if (massEver) {
    routineCards.push(
      <SmallCard
        key="mass"
        art="readings"
        title="Mass Reading"
        stat={streakText(routineStreak(streak, "mass"))}
        action={massDone ? "Read today" : "Today’s readings"}
        done={massDone}
        onClick={() => onOpenDaily("mass")}
      />,
    );
  }

  const started = breviaryEver || massEver;
  const next =
    !started
      ? { heading: "Not sure where to start?", art: "prayer" as const, title: "Breviary", description: `Begin with a few quiet minutes of prayer. ${hourName} is ready for you.`, action: `Pray ${hourName}`, onClick: () => onOpenDaily(hour) }
      : !breviaryDone
        ? { heading: massDone ? "Still have a little time?" : "Not sure what to do next?", art: "prayer" as const, title: "Breviary", description: `Pause and pray ${hourName} with the Church.`, action: `Pray ${hourName}`, onClick: () => onOpenDaily(hour) }
        : !massDone
          ? { heading: "Not sure what to do next?", art: "readings" as const, title: "Mass Reading", description: "Sit with today’s readings from the Mass.", action: "Today’s readings", onClick: () => onOpenDaily("mass") }
          : { heading: "Ready to go a little deeper?", art: "journey" as const, title: "Bible Journey", description: "You’ve prayed and listened today. Walk through the story of salvation, one period at a time.", action: "Start the Journey", onClick: onJourney };

  const share = async () => {
    try {
      setShareNote((await onShare()) === "copied" ? "Link copied. Pass it along." : "");
    } catch {
      setShareNote("");
    }
  };

  return (
    <main className="landing-page">
      <section className="landing-hero section-wrap" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A quieter way to meet the Word</p>
          <h1 id="landing-title">Find your <em>quiet rhythm.</em></h1>
          <p className="hero-description">Scripture, prayer, and reflection — one step at a time.</p>
          <div className="hero-actions">
            <button className="button button-coral" onClick={onResume}>
              {bible.started ? `Continue ${bible.label}` : "Start with Genesis"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {routineCards.length > 0 && (
        <section className="landing-routine section-wrap" aria-labelledby="routine-title">
          <p className="eyebrow" id="routine-title">Your daily routine</p>
          <div className="landing-routine-grid">{routineCards}</div>
        </section>
      )}

      <section className="landing-actions section-wrap" aria-label="Explore">
        <div className="landing-section-heading">
          <p className="eyebrow">Make room for what matters</p>
          <h2>A rhythm for every day.</h2>
        </div>
        <div className="landing-card-grid">
          {primaryCards.map(({ art, title, description, action, onClick }) => (
            <button className="landing-card" key={title} type="button" aria-label={`${title}: ${action}`} onClick={actions[onClick]}>
              <CardArt art={art} />
              <div className="landing-card-copy">
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="text-link">
                  {action} <ArrowRight size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-ask section-wrap" aria-labelledby="ask-title">
        <div className="landing-section-heading landing-centered-heading">
          <p className="eyebrow">A guide for your questions</p>
          <h2 id="ask-title">Ask {ASSISTANT_NAME}</h2>
        </div>
        <button className="landing-ask-card" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}>
          <SofiaAvatar size={56} />
          <span className="landing-ask-copy">
            <strong>Bring {ASSISTANT_NAME} what is on your heart.</strong>
            <span>A question, a worry, or a verse you’re wondering about. {ASSISTANT_NAME} will point you to passages that speak to it.</span>
            <span className="text-link">Start a conversation <ArrowRight size={14} /></span>
          </span>
        </button>
      </section>

      <section className="landing-next section-wrap" aria-labelledby="next-title">
        <div className="landing-section-heading landing-centered-heading">
          <h2 id="next-title">{next.heading}</h2>
        </div>
        <div className="landing-next-card">
          <SmallCard art={next.art} title={next.title} description={next.description} action={next.action} onClick={next.onClick} />
        </div>
      </section>

      <section className="landing-share section-wrap" aria-label="Share Soundfaith">
        <button className="button button-outline" type="button" onClick={share}>
          <Share2 size={15} /> Share Soundfaith
        </button>
        <p className="landing-share-note" role="status">{shareNote}</p>
      </section>
    </main>
  );
}
