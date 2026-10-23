import { ArrowRight, Share2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import { SofiAvatar } from "../components/ChatWidget";
import { CardArt, SmallCard } from "../components/LandingSmallCard";
import { NextStepPrompt } from "../components/NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { breviaryHourInfo, currentBreviaryHour } from "../lib/breviary";
import { doneToday, hasEverDone, routineStreak, type DailyItem, type DailyStreakState } from "../lib/dailyStreak";
import { featuredSaintForDate } from "../data/saintsDaily";

type HomePageProps = {
  onChoose: () => void;
  onMass: () => void;
  onJourney: () => void;
  onBreviary: () => void;
  onRosary: () => void;
  onSaints: () => void;
  onSaintToday: () => void;
  onCatechism: () => void;
  onResume: () => void;
  bible: { started: boolean; label: string };
  streak: DailyStreakState;
  onOpenDaily: (item: DailyItem) => void;
  onShare: () => Promise<"shared" | "copied">;
};

const primaryCards = [
  { art: "bible", title: "Bible", description: "Return to the Scriptures, one chapter at a time.", action: "Open Bible", onClick: "onChoose" },
  { art: "journey", title: "Bible Journey", description: "Follow the story of salvation through 12 periods.", action: "Continue Journey", onClick: "onJourney" },
  { art: "prayer", title: "Breviary", description: "Pray Lauds, Vespers, and Compline each day.", action: "Pray the Hours", onClick: "onBreviary" },
  { art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus’ life, one bead at a time.", action: "Pray the Rosary", onClick: "onRosary" },
  { art: "readings", title: "Mass Reading", description: "Pray with today’s liturgy.", action: "Today’s Readings", onClick: "onMass" },
  { art: "saints", title: "Saint of the day", description: "Meet a witness whose life points to Christ.", action: "Meet today's saint", onClick: "onSaints" },
  { art: "catechism", title: "Baltimore Catechism", description: "Explore this historic series by edition, lesson, and question.", action: "Browse the catechism", onClick: "onCatechism" },
] as const;

function streakText(days: number) {
  if (days >= 2) return `${days} days in a row`;
  if (days === 1) return "1 day, a lovely start";
  return "Welcome back. Begin again";
}

export function HomePage({ onChoose, onMass, onJourney, onBreviary, onRosary, onSaints, onSaintToday, onCatechism, onResume, bible, streak, onOpenDaily, onShare }: HomePageProps) {
  const [shareNote, setShareNote] = useState("");
  const actions = { onChoose, onMass, onJourney, onBreviary, onRosary, onSaints, onCatechism };
  const featuredSaint = featuredSaintForDate();
  const saintQuote = featuredSaint?.quotes[0];
  const hour = currentBreviaryHour();
  const hourName = breviaryHourInfo[hour].name;
  const done = doneToday(streak);
  const breviaryDone = done.includes(hour);
  const massDone = done.includes("mass");
  const rosaryDone = done.includes("rosary");
  const saintsDone = done.includes("saints");
  const breviaryEver = hasEverDone(streak, "breviary");
  const massEver = hasEverDone(streak, "mass");
  const rosaryEver = hasEverDone(streak, "rosary");
  const saintsEver = hasEverDone(streak, "saints");

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
  if (rosaryEver) {
    routineCards.push(
      <SmallCard
        key="rosary"
        art="rosary"
        title="Rosary"
        stat={streakText(routineStreak(streak, "rosary"))}
        action={rosaryDone ? "Prayed today" : "Pray the Rosary"}
        done={rosaryDone}
        onClick={onRosary}
      />,
    );
  }
  if (saintsEver) {
    routineCards.push(
      <SmallCard
        key="saints"
        art="saints"
        title="Saint of the day"
        stat={streakText(routineStreak(streak, "saints"))}
        action={saintsDone ? "Visited today" : "Meet today's saint"}
        done={saintsDone}
        onClick={onSaintToday}
      />,
    );
  }

  const started = breviaryEver || massEver || rosaryEver || saintsEver;
  const next =
    !started
      ? { heading: "Not sure where to start?", art: "prayer" as const, title: "Breviary", description: `Begin with a few quiet minutes of prayer. ${hourName} is ready for you.`, action: `Pray ${hourName}`, onClick: () => onOpenDaily(hour) }
      : !breviaryDone
        ? { heading: massDone ? "Still have a little time?" : "Not sure what to do next?", art: "prayer" as const, title: "Breviary", description: `Pause and pray ${hourName} with the Church.`, action: `Pray ${hourName}`, onClick: () => onOpenDaily(hour) }
        : !massDone
          ? { heading: "Not sure what to do next?", art: "readings" as const, title: "Mass Reading", description: "Sit with today’s readings from the Mass.", action: "Today’s readings", onClick: () => onOpenDaily("mass") }
          : !rosaryDone
            ? { heading: "Ready for a moment of prayer?", art: "rosary" as const, title: "Rosary", description: "Pray with the mysteries of Jesus’ life.", action: "Pray the Rosary", onClick: onRosary }
            : !saintsDone
              ? { heading: "Meet a witness of faith", art: "saints" as const, title: "Saint of the day", description: "Spend a moment with the life and words of a saint remembered today.", action: "Meet today's saint", onClick: onSaintToday }
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
          {featuredSaint && <aside className="home-saint-quote" aria-label="Quote from today's saint">
            <p className="eyebrow">Saint of the day · {featuredSaint.name}</p>
            {saintQuote ? <blockquote>“{saintQuote}”</blockquote> : <p className="home-saint-quote-title">{featuredSaint.title ?? `Remember the witness of ${featuredSaint.name}.`}</p>}
            <button type="button" className="text-link" onClick={onSaintToday}>Meet today's saint <ArrowRight size={14} /></button>
          </aside>}
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
          <SofiAvatar size={56} />
          <span className="landing-ask-copy">
            <strong>Bring {ASSISTANT_NAME} what is on your heart.</strong>
            <span>A question, a worry, or a verse you’re wondering about. {ASSISTANT_NAME} will point you to passages that speak to it.</span>
            <span className="text-link">Start a conversation <ArrowRight size={14} /></span>
          </span>
        </button>
      </section>

      <NextStepPrompt heading={next.heading} card={{ art: next.art, title: next.title, description: next.description, action: next.action, onClick: next.onClick }} />

      <section className="landing-share section-wrap" aria-label="Share Soundfaith">
        <button className="button button-outline" type="button" onClick={share}>
          <Share2 size={15} /> Share Soundfaith
        </button>
        <a className="android-download-badge" href="/downloads/soundfaith-bible.apk" download aria-label="Download Soundfaith Bible for Android">
          <svg className="android-download-badge-icon" viewBox="0 0 48 48" aria-hidden="true">
            <g fill="currentColor">
              <path d="M12 20a12 12 0 0 1 24 0H12Z" />
              <path d="M12 22h24v13a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V22Z" />
              <path d="M5 22a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V22Zm32 0a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V22ZM15 37h6v6a3 3 0 0 1-6 0v-6Zm12 0h6v6a3 3 0 0 1-6 0v-6Z" />
            </g>
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.5">
              <path d="m16 8-3-4m19 4 3-4" />
            </g>
            <g fill="#173b2b">
              <circle cx="19" cy="14" r="1.2" />
              <circle cx="29" cy="14" r="1.2" />
            </g>
          </svg>
          <span className="android-download-badge-copy">
            <small>DOWNLOAD THE APP</small>
            <strong>For Android</strong>
          </span>
          <span className="android-download-badge-format">APK</span>
        </a>
        <p className="landing-share-note" role="status">{shareNote}</p>
      </section>
    </main>
  );
}
