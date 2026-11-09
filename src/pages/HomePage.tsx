import { ArrowRight, Share2 } from "lucide-react";
import { useState } from "react";
import { SofiAvatar } from "../components/ChatWidget";
import { CardArt, SmallCard, type CardArtKey } from "../components/LandingSmallCard";
import { NextStepPrompt } from "../components/NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "../lib/assistant";
import { breviaryHourInfo, currentBreviaryHour } from "../lib/breviary";
import { doneToday, hasEverDone, routineStreak, type DailyItem, type DailyStreakState } from "../lib/dailyStreak";
import { noWorryJourney } from "../data/noWorryJourney";
import { journeyCadence, journeyCatalog, journeyList } from "../data/journeyCatalog";
import type { GuidedJourneyProgress } from "../lib/guidedJourneyProgress";
import { getJourneyOverview } from "../lib/journeyOverview";
import { selectDailyRecommendation } from "../lib/dailyRecommendations";

type HomePageProps = {
  onJourney: () => void;
  onChoose: () => void;
  onRosary: () => void;
  onSaintToday: () => void;
  onCatechism: () => void;
  onSumma: () => void;
  onResume: () => void;
  onGuidedJourney: () => void;
  onContinueBibleJourney: () => void;
  onAllJourneys: () => void;
  onDaily: () => void;
  bible: { started: boolean; label: string };
  bibleJourney: { completedIds: string[]; lastVisitedPeriodId: string | null };
  guidedJourney: GuidedJourneyProgress;
  streak: DailyStreakState;
  onOpenDaily: (item: DailyItem) => void;
  onShare: () => Promise<"shared" | "copied">;
};

function streakText(days: number) {
  if (days >= 2) return `${days} days in a row`;
  if (days === 1) return "1 day, a lovely start";
  return "A new rhythm begins today";
}

export function HomePage({ onJourney, onChoose, onRosary, onSaintToday, onCatechism, onSumma, onResume, onGuidedJourney, onContinueBibleJourney, onAllJourneys, onDaily, bible, bibleJourney, guidedJourney, streak, onOpenDaily, onShare }: HomePageProps) {
  const [shareNote, setShareNote] = useState("");
  const hour = currentBreviaryHour();
  const hourName = breviaryHourInfo[hour].name;
  const done = doneToday(streak);
  const breviaryDone = done.some((item) => item === "lauds" || item === "vespers" || item === "compline");
  const massDone = done.includes("mass");
  const rosaryDone = done.includes("rosary");
  const saintsDone = done.includes("saints");
  const journeyOverview = getJourneyOverview(guidedJourney, bibleJourney.completedIds, bibleJourney.lastVisitedPeriodId);
  const featuredJourney = journeyOverview.featuredJourney;
  const featuredJourneyInfo = journeyCatalog[featuredJourney];
  const routineCards = [
    { routine: "breviary" as const, art: "prayer" as const, title: "Breviary", stat: hasEverDone(streak, "breviary") ? streakText(routineStreak(streak, "breviary")) : undefined, action: breviaryDone ? `${hourName} prayed` : `Pray ${hourName}`, done: breviaryDone, onClick: () => onOpenDaily(hour) },
    { routine: "mass" as const, art: "readings" as const, title: "Mass Readings", stat: hasEverDone(streak, "mass") ? streakText(routineStreak(streak, "mass")) : undefined, action: massDone ? "Read today" : "Today's readings", done: massDone, onClick: () => onOpenDaily("mass") },
    { routine: "rosary" as const, art: "rosary" as const, title: "Rosary", stat: hasEverDone(streak, "rosary") ? streakText(routineStreak(streak, "rosary")) : undefined, action: rosaryDone ? "Prayed today" : "Pray the Rosary", done: rosaryDone, onClick: onRosary },
    { routine: "saints" as const, art: "saints" as const, title: "Saint of the Day", stat: hasEverDone(streak, "saints") ? streakText(routineStreak(streak, "saints")) : undefined, action: saintsDone ? "Visited today" : "Meet today's saint", done: saintsDone, onClick: onSaintToday },
  ];

  const formationCards: { art: CardArtKey; title: string; description: string; action: string; onClick: () => void }[] = [
    { art: "bible", title: "Bible", description: "Read the Scriptures from Genesis to Revelation, one chapter at a time.", action: bible.started ? `Continue ${bible.label}` : "Open the Bible", onClick: onChoose },
    { art: "catechism", title: "Baltimore Catechism", description: "Explore the Catholic faith by lesson and question.", action: "Browse lessons", onClick: onCatechism },
    { art: "summa", title: "Summa Theologiae", description: "Study St. Thomas Aquinas's enduring work of theology.", action: "Explore the Summa", onClick: onSumma },
  ];

  const journeyNextSteps = {
    "journey-no-worry": {
      art: journeyCatalog["no-worry"].artwork,
      title: journeyCatalog["no-worry"].title,
      description: `Continue with day ${journeyOverview.noWorry.nextDay} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${journeyOverview.noWorry.nextDay}`,
      onClick: onGuidedJourney,
    },
    "journey-bible": {
      art: journeyCatalog.bible.artwork,
      title: journeyCatalog.bible.title,
      description: journeyOverview.bible.resumePeriod
        ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.`
        : journeyCatalog.bible.description,
      action: "Continue Bible Journey",
      onClick: journeyOverview.bible.active ? onContinueBibleJourney : onJourney,
    },
  };
  const recommendation = selectDailyRecommendation("home", streak, journeyOverview);
  const routineByRecommendation = {
    mass: "mass",
    breviary: "breviary",
    rosary: "rosary",
    saints: "saints",
  } as const;
  const nextStepCard = recommendation === "journey-no-worry" || recommendation === "journey-bible"
    ? journeyNextSteps[recommendation]
    : recommendation === "journey-library"
      ? {
        art: journeyCatalog.bible.artwork,
        title: "Explore Another Journey",
        description: "Choose a guided journey through Scripture and daily life.",
        action: "Explore journeys",
        onClick: onAllJourneys,
      }
      : recommendation === "bible"
        ? {
          art: "bible" as const,
          title: "Continue reading Scripture",
          description: "Spend a little time with God's Word today.",
          action: bible.started ? `Continue ${bible.label}` : "Start with Genesis",
          onClick: onResume,
        }
        : recommendation === "catechism" || recommendation === "summa"
          ? formationCards.find((card) => card.title.toLowerCase().includes(recommendation))!
          : routineCards.find((card) => card.routine === routineByRecommendation[recommendation])!;

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
          <p className="eyebrow"><span className="eyebrow-dot" /> A daily rhythm of prayer and formation</p>
          <h1 id="landing-title">Find your <em>quiet rhythm.</em></h1>
          <p className="hero-description">A little prayer, a little Scripture, and one faithful step closer to God each day.</p>
          <div className="hero-actions">
            <button className="button button-coral" onClick={nextStepCard.onClick}>
              {nextStepCard.action} <ArrowRight size={16} />
            </button>
            <button className="button button-outline" onClick={onDaily}>Today's rhythm</button>
          </div>
        </div>
      </section>

      <section className="landing-current-journey section-wrap" aria-labelledby="current-journey-title">
        <div className="landing-section-heading">
          <p className="eyebrow">{journeyOverview.hasActiveJourney ? "Your current journey" : "A journey for today"}</p>
          <h2 id="current-journey-title">{journeyOverview.hasActiveJourney ? "Keep walking, one day at a time." : featuredJourney === "no-worry" && journeyOverview.noWorry.complete ? "Celebrate the journey you completed." : "A little more peace, one day at a time."}</h2>
        </div>
        <button className="landing-journey-card" type="button" onClick={featuredJourney === "no-worry" ? onGuidedJourney : journeyOverview.bible.active ? onContinueBibleJourney : onJourney}>
          <CardArt art={featuredJourneyInfo.artwork} />
          <span className="landing-journey-copy">
            {featuredJourney === "no-worry" ? <>
              <span className="eyebrow">{journeyOverview.noWorry.active ? "In progress" : journeyOverview.noWorry.complete ? "Journey complete" : "Featured journey"}</span>
              <strong>{featuredJourneyInfo.title}</strong>
              <span>{journeyOverview.noWorry.complete ? "Return to the reflections and prayers whenever you need them." : featuredJourneyInfo.description}</span>
              <span className="landing-journey-day">Recommended cadence: {journeyCadence("no-worry")}</span>
              <span className="landing-journey-day">{journeyOverview.noWorry.complete ? `${noWorryJourney.length} of ${noWorryJourney.length} days complete` : `Day ${journeyOverview.noWorry.nextDay} of ${noWorryJourney.length}`}</span>
              <progress value={guidedJourney.completedDays.length} max={noWorryJourney.length} aria-label={`${guidedJourney.completedDays.length} of ${noWorryJourney.length} days complete`} />
              <span className="text-link">{journeyOverview.noWorry.active ? "Continue journey" : journeyOverview.noWorry.complete ? "Revisit journey" : "Begin journey"} <ArrowRight size={15} /></span>
            </> : <>
              <span className="eyebrow">{journeyOverview.bible.active ? "In progress" : "Featured journey"}</span>
              <strong>{featuredJourneyInfo.title}</strong>
              <span>{journeyOverview.bible.resumePeriod ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.` : featuredJourneyInfo.description}</span>
              <span className="landing-journey-day">Recommended cadence: {journeyCadence("bible")}</span>
              <span className="landing-journey-day">{journeyOverview.bible.completedCount} of {journeyOverview.bible.totalCount} periods complete</span>
              <span className="text-link">{journeyOverview.bible.active ? "Continue journey" : "Explore journey"} <ArrowRight size={15} /></span>
            </>}
          </span>
        </button>
        {guidedJourney.storageError && <p className="guided-journey-notice" role="status">Journey progress could not be saved on this device. Your changes will remain only for this visit.</p>}
      </section>

      <section className="landing-routine section-wrap" aria-labelledby="routine-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Today's essentials · repeatable habits</p>
          <h2 id="routine-title">Your daily rhythm.</h2>
        </div>
        <div className="landing-routine-grid">{routineCards.map((card) => <SmallCard key={card.title} {...card} />)}</div>
      </section>

      <section className="landing-actions section-wrap" aria-labelledby="formation-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Faith formation</p>
          <h2 id="formation-title">Grow in understanding.</h2>
        </div>
        <div className="landing-card-grid landing-formation-grid">
          {formationCards.map(({ art, title, description, action, onClick }) => (
            <button className="landing-card" key={title} type="button" aria-label={`${title}: ${action}`} onClick={onClick}>
              <CardArt art={art} />
              <div className="landing-card-copy"><h3>{title}</h3><p>{description}</p><span className="text-link">{action} <ArrowRight size={15} /></span></div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-ask section-wrap" aria-labelledby="ask-title">
        <div className="landing-section-heading landing-centered-heading">
          <p className="eyebrow">Faith conversation</p>
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

      <section className="landing-explore-journeys section-wrap" aria-labelledby="explore-journeys-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Guided spiritual growth</p>
          <h2 id="explore-journeys-title">Choose your next journey.</h2>
          <p className="landing-section-description">Grow through Scripture, prayer, and guided steps for the season you are in.</p>
        </div>
        <div className="landing-explore-actions">
          <button className="button button-outline" type="button" onClick={onAllJourneys}>More journeys <ArrowRight size={15} /></button>
        </div>
        <div className="landing-explore-grid">
          {journeyList.filter((journey) => journey.id !== featuredJourney).map((journey) => {
            if (!journey.available) {
              return (
                <article className="landing-card landing-card--coming-soon" key={journey.id}>
                  <CardArt art={journey.artwork} className="is-blurred" />
                  <div className="landing-card-copy"><h3>{journey.title}</h3><p>{journey.description}</p><span className="journey-coming-soon-pill">Coming soon</span></div>
                </article>
              );
            }
            const onSelect = journey.id === "no-worry" ? onGuidedJourney : onJourney;
            const action = journey.id === "no-worry"
              ? journeyOverview.noWorry.complete ? "Revisit journey" : journeyOverview.noWorry.active ? "Continue journey" : "Begin journey"
              : journeyOverview.bible.complete ? "Revisit Bible Journey" : journeyOverview.bible.active ? "Continue Bible Journey" : "Explore Bible Journey";
            return (
              <button className="landing-card" type="button" key={journey.id} onClick={onSelect}>
                <CardArt art={journey.artwork} />
                <div className="landing-card-copy"><h3>{journey.title}</h3><p>{journey.description}</p><p>Recommended cadence: {journeyCadence(journey.id)}</p><span className="text-link">{action} <ArrowRight size={15} /></span></div>
              </button>
            );
          })}
        </div>
      </section>

      <NextStepPrompt
        heading="Your Next Faithful Step"
        card={nextStepCard}
        className="landing-home-next"
      />

      <section className="landing-share section-wrap" aria-label="Share SoundFaith">
        <button className="button button-outline" type="button" onClick={share}>
          <Share2 size={15} /> Share SoundFaith
        </button>
        <p className="landing-share-note" role="status">{shareNote}</p>
      </section>
    </main>
  );
}
