import { ArrowRight, BookOpen, ChevronRight, Headphones, Heart, Share2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { FeedCard } from "@/shared/ui/FeedCard";
import { SofiAvatar } from "@/features/chat";
import { CardArt, SmallCard, type CardArtKey } from "@/shared/ui/LandingSmallCard";
import { NextStepPrompt } from "@/shared/ui/NextStepPrompt";
import { ASSISTANT_NAME, OPEN_ASSISTANT_EVENT } from "@/features/chat/assistant";
import { breviaryHourInfo, currentBreviaryHour } from "@/features/breviary/breviary";
import { doneToday, hasEverDone, routineStreak, type DailyItem, type DailyStreakState } from "@/features/daily";
import { guidedJourneyDays, type GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import { journeyCadence, journeyCatalog, orderedJourneyList } from "@/features/journeys/journeyCatalog";
import type { GuidedJourneyProgress } from "@/features/journeys/guidedJourneyProgress";
import { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { selectDailyRecommendation } from "@/features/daily";
import { catechismEditions, catechismGroupHref } from "@/features/catechism/catechism";
import { summaQuestionHref } from "@/features/summa/summa";
import { narrationDescription, narrationProgress, type NarrationSnapshot, type NarrationTrack } from "@/platform/audio/NarratorButton";
import { guidedJourneyTitles } from "@/platform/audio/audioPlaylists";
import { useHeaderAutoHide } from "@/lib/useHeaderAutoHide";
import type { PlayKind } from "@/features/listen";

type HomePageProps = {
  onChoose: () => void;
  onCatechism: () => void;
  onSumma: () => void;
  onResume: () => void;
  onContinueBibleJourney: () => void;
  onAllJourneys: () => void;
  onDaily: () => void;
  bible: { started: boolean; label: string };
  bibleJourney: { completedIds: string[]; lastVisitedPeriodId: string | null };
  guidedJourney: Record<GuidedJourneyId, GuidedJourneyProgress>;
  streak: DailyStreakState;
  onOpenDaily: (item: DailyItem) => void;
  onShare: () => Promise<"shared" | "copied">;
  narration: NarrationSnapshot;
  onPlay: (kind: PlayKind, autoplay?: boolean) => void;
  onPlayHero: () => void;
};

const routineDuration = { breviary: "10 min", mass: "5 min", rosary: "20 min", saints: "3 min" };

function streakText(days: number) {
  if (days >= 2) return `${days} days in a row`;
  if (days === 1) return "1 day, a lovely start";
  return "A new rhythm begins today";
}

function heroTitles(track: NarrationTrack) {
  const series = track.sequence?.kind === "rosary" ? "Rosary" : track.sequence?.kind === "guided" ? guidedJourneyTitles[track.sequence.journeyId] : null;
  return series ? { title: series, part: track.title } : { title: track.title, part: "" };
}

export function HomePage({ onChoose, onCatechism, onSumma, onResume, onContinueBibleJourney, onAllJourneys, onDaily, bible, bibleJourney, guidedJourney, streak, onOpenDaily, onShare, narration, onPlayHero, onPlay }: HomePageProps) {
  const [shareNote, setShareNote] = useState("");
  const [recommendationDismissed, setRecommendationDismissed] = useState(() => {
    try { return window.sessionStorage.getItem("home-recommendation-dismissed") === "1"; } catch { return false; }
  });
  useHeaderAutoHide();
  const hour = currentBreviaryHour();
  const hourName = breviaryHourInfo[hour].name;
  const done = doneToday(streak);
  const breviaryDone = done.some((item) => item === "lauds" || item === "vespers" || item === "compline");
  const massDone = done.includes("mass");
  const rosaryDone = done.includes("rosary");
  const saintsDone = done.includes("saints");
  const journeyOverview = getJourneyOverview(guidedJourney, bibleJourney.completedIds, bibleJourney.lastVisitedPeriodId);
  const featuredJourney = journeyOverview.featuredJourney;
  const featuredJourneyInfo = featuredJourney ? journeyCatalog[featuredJourney] : null;
  const routineCards = [
    { routine: "breviary" as const, art: "prayer" as const, title: "Breviary", stat: hasEverDone(streak, "breviary") ? streakText(routineStreak(streak, "breviary")) : undefined, action: breviaryDone ? `${hourName} prayed` : `Pray ${hourName}`, done: breviaryDone, onClick: () => { window.location.hash = "#/breviary"; }, play: "breviary" as const },
    { routine: "mass" as const, art: "readings" as const, title: "Mass Readings", stat: hasEverDone(streak, "mass") ? streakText(routineStreak(streak, "mass")) : undefined, action: massDone ? "Read today" : "Today's readings", done: massDone, onClick: () => onOpenDaily("mass"), play: "mass" as const },
    { routine: "rosary" as const, art: "rosary" as const, title: "Rosary", stat: hasEverDone(streak, "rosary") ? streakText(routineStreak(streak, "rosary")) : undefined, action: rosaryDone ? "Prayed today" : "Pray the Rosary", done: rosaryDone, onClick: () => { window.location.hash = "#/rosary"; }, play: "rosary" as const },
    { routine: "saints" as const, art: "saints" as const, title: "Saint of the Day", stat: hasEverDone(streak, "saints") ? streakText(routineStreak(streak, "saints")) : undefined, action: saintsDone ? "Visited today" : "Meet today's saint", done: saintsDone, onClick: () => { window.location.hash = "#/saints"; }, play: "saint" as const },
  ];

  const formationCards: { art: CardArtKey; title: string; description: string; action: string; onClick: () => void; play: PlayKind }[] = [
    { art: "bible", title: "Bible", description: "Read the Scriptures from Genesis to Revelation, one chapter at a time.", action: bible.started ? `Continue ${bible.label}` : "Open the Bible", onClick: onChoose, play: "old-testament" },
    { art: "catechism", title: "Baltimore Catechism", description: "Explore the Catholic faith by lesson and question.", action: "Browse lessons", onClick: onCatechism, play: "catechism" },
    { art: "summa", title: "Summa Theologiae", description: "Study St. Thomas Aquinas's enduring work of theology.", action: "Explore the Summa", onClick: onSumma, play: "summa" },
  ];

  const guidedOverview = { freedom: journeyOverview.freedom, "no-worry": journeyOverview.noWorry, advent: journeyOverview.advent };
  const guidedTotal = (id: GuidedJourneyId) => guidedJourneyDays[id].length;
  const guidedDone = (id: GuidedJourneyId) => guidedJourney[id].completedDays.length;
  const featuredGuidedId: GuidedJourneyId | null = featuredJourney && featuredJourney !== "bible" ? featuredJourney : null;
  const featuredGuidedOverview = featuredGuidedId ? guidedOverview[featuredGuidedId] : null;
  const journeyNextSteps = {
    "journey-freedom": {
      art: journeyCatalog.freedom.artwork,
      title: journeyCatalog.freedom.title,
      description: `Continue with day ${guidedOverview.freedom.nextDay} of ${guidedTotal("freedom")} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${guidedOverview.freedom.nextDay}`,
      onClick: () => { window.location.hash = `#/journeys/freedom/${guidedOverview.freedom.nextDay}`; },
      play: "freedom" as const,
    },
    "journey-no-worry": {
      art: journeyCatalog["no-worry"].artwork,
      title: journeyCatalog["no-worry"].title,
      description: `Continue with day ${guidedOverview["no-worry"].nextDay} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${guidedOverview["no-worry"].nextDay}`,
      onClick: () => { window.location.hash = `#/journeys/no-worry/${guidedOverview["no-worry"].nextDay}`; },
      play: "no-worry" as const,
    },
    "journey-bible": {
      art: journeyCatalog.bible.artwork,
      title: journeyCatalog.bible.title,
      description: journeyOverview.bible.resumePeriod
        ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.`
        : journeyCatalog.bible.description,
      action: "Continue Bible Journey",
      onClick: onContinueBibleJourney,
      play: "bible-journey" as const,
    },
    "journey-advent": {
      art: journeyCatalog.advent.artwork,
      title: journeyCatalog.advent.title,
      description: `Continue with day ${guidedOverview.advent.nextDay} of ${guidedTotal("advent")} of Scripture, reflection, and prayer.`,
      action: `Continue Day ${guidedOverview.advent.nextDay}`,
      onClick: () => { window.location.hash = `#/journeys/advent/${guidedOverview.advent.nextDay}`; },
      play: "advent" as const,
    },
  };
  const recommendation = selectDailyRecommendation("home", streak, journeyOverview);
  const routineByRecommendation = {
    mass: "mass",
    breviary: "breviary",
    rosary: "rosary",
    saints: "saints",
  } as const;
  const nextStepCard = recommendation === "journey-freedom" || recommendation === "journey-no-worry" || recommendation === "journey-advent" || recommendation === "journey-bible"
    ? journeyNextSteps[recommendation]
      : recommendation === "bible"
        ? {
          art: "bible" as const,
          title: "Continue reading Scripture",
          description: "Spend a little time with God's Word today.",
          action: bible.started ? `Continue ${bible.label}` : "Start with Genesis",
          onClick: onResume,
          play: bible.started ? "bible-current" as const : "old-testament" as const,
        }
        : recommendation === "catechism"
          ? {
            ...formationCards.find((card) => card.title.toLowerCase().includes("catechism"))!,
            action: "Open the first lesson",
            onClick: () => {
              const edition = catechismEditions[0];
              const firstLesson = edition?.groups.find((group) => group.kind === "lesson");
              if (edition && firstLesson) window.location.hash = catechismGroupHref(edition.number, firstLesson.id);
              else window.location.hash = "#/catechism";
            },
          }
          : recommendation === "summa"
            ? {
              ...formationCards.find((card) => card.title.toLowerCase().includes("summa"))!,
              action: "Open Question 1",
              onClick: () => { window.location.hash = summaQuestionHref("prima-pars", 1); },
            }
            : recommendation === "breviary"
              ? { ...routineCards.find((card) => card.routine === "breviary")!, onClick: () => { window.location.hash = `#/breviary/${hour}`; } }
              : recommendation === "rosary"
                ? { ...routineCards.find((card) => card.routine === "rosary")!, onClick: () => { window.location.hash = "#/rosary/joyful"; } }
                : recommendation === "saints"
                  ? { ...routineCards.find((card) => card.routine === "saints")!, onClick: () => { window.location.hash = "#/saints/today"; } }
                  : routineCards.find((card) => card.routine === routineByRecommendation[recommendation])!;
  const hasPriorActivity = bible.started
    || Boolean(narration.track)
    || bibleJourney.completedIds.length > 0
    || Object.values(guidedJourney).some((progress) => progress.started || progress.completedDays.length > 0)
    || streak.total > 0;
  const recommendationIcon = nextStepCard.play === "old-testament" || nextStepCard.play === "new-testament" || nextStepCard.play === "gospels"
    ? <BookOpen size={20} />
    : nextStepCard.play === "breviary" || nextStepCard.play === "rosary" || nextStepCard.play === "mass"
      ? <Heart size={20} />
      : nextStepCard.play === "freedom" || nextStepCard.play === "no-worry" || nextStepCard.play === "advent" || nextStepCard.play === "bible-journey"
        ? <Sparkles size={20} />
        : <Headphones size={20} />;
  const dismissRecommendation = () => {
    setRecommendationDismissed(true);
    try { window.sessionStorage.setItem("home-recommendation-dismissed", "1"); } catch { /* Keep the dismissal for this render. */ }
  };

  const share = async () => {
    try {
      setShareNote((await onShare()) === "copied" ? "Link copied. Pass it along." : "");
    } catch {
      setShareNote("");
    }
  };

  const heroTrack = narration.status !== "idle" ? narration.track : null;
  const heroLabels = heroTrack ? heroTitles(heroTrack) : null;

  return (
    <main className="landing-page">
      <div className="mobile-home section-wrap">
        <section className="feed-section feed-bleed">
          {heroTrack && heroLabels
            ? <FeedCard art={heroTrack.art} title={heroLabels.title} meta={[heroLabels.part, narrationDescription(narration)].filter(Boolean).join(" · ")} artProgress={narrationProgress(narration)} playBadge onClick={onPlayHero} />

            : bible.started
              ? <FeedCard art="bible" title={`Continue ${bible.label}`} meta="Resume your current chapter" playBadge onClick={() => onPlay("bible-current")} />
              : <FeedCard art="bible" title="Begin with Genesis" meta="Listen to the opening story of Scripture" playBadge onClick={() => onPlay("old-testament", true)} />}
        </section>
        <section className="feed-section"><p className="feed-eyebrow">Today's Rhythm</p>
          <div className="feed-carousel">
            {routineCards.map((card) => <FeedCard key={card.title} art={card.art} title={card.title} meta={card.done ? "Done today" : routineDuration[card.routine]} onClick={() => onPlay(card.play)} />)}
          </div>
        </section>
        <section className="feed-section feed-bleed"><p className="feed-eyebrow">{journeyOverview.hasActiveJourney ? "Current Journey" : "A Journey for You"}</p>
          {featuredJourneyInfo ? <FeedCard
            art={featuredJourneyInfo.artwork}
            title={featuredJourneyInfo.title}
            meta={featuredGuidedId ? `Day ${featuredGuidedOverview!.nextDay} of ${guidedTotal(featuredGuidedId)}` : `${journeyOverview.bible.completedCount} of ${journeyOverview.bible.totalCount} periods complete`}
            progress={featuredGuidedId ? guidedDone(featuredGuidedId) / guidedTotal(featuredGuidedId) : journeyOverview.bible.totalCount ? journeyOverview.bible.completedCount / journeyOverview.bible.totalCount : 0}
            onClick={() => onPlay(featuredJourney === "bible" ? "bible-journey" : featuredGuidedId!)}
          /> : <FeedCard art="bible-journey" title="Return to Bible Journey" meta="Revisit the story of Scripture" onClick={() => onPlay("bible-journey")} />}
        </section>
        <section className="feed-section"><p className="feed-eyebrow">Recommended</p>
          <div className="feed-carousel">
            {[
              ...(featuredJourney === "advent" ? [] : [journeyNextSteps["journey-advent"]]),
              nextStepCard,
              ...formationCards.filter((card) => card.title !== nextStepCard.title),
            ]
              .filter((card, index, cards) => cards.findIndex((other) => other.title === card.title) === index)
              .filter((card) => card.title !== featuredJourneyInfo?.title)
              .map((card) => <FeedCard key={card.title} art={card.art} title={card.title} meta={card.action} onClick={() => onPlay(card.play)} />)}
          </div>
        </section>
        <section className="feed-section home-sofi">
          <button className="home-sofi-launch" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))} aria-label={`Chat with ${ASSISTANT_NAME}`}>
            <span className="home-sofi-mark"><SofiAvatar size={76} /></span>
            <span className="home-sofi-label">Ask {ASSISTANT_NAME}</span>
          </button>
        </section>
        {!recommendationDismissed && <aside className="home-recommendation-prompt" aria-label={hasPriorActivity ? "Continue your recommended next step" : "Recommended place to start"}>
          <button className="home-recommendation-action" type="button" onClick={() => onPlay(nextStepCard.play)}>
            <span className="home-recommendation-icon" aria-hidden="true">{recommendationIcon}</span>
            <span className="home-recommendation-copy"><span className="home-recommendation-eyebrow">{hasPriorActivity ? "Continue" : "Start here"}</span><strong>{nextStepCard.title}</strong><small>{nextStepCard.action}</small></span>
            <ChevronRight className="home-recommendation-chevron" size={18} aria-hidden="true" />
          </button>
          <button className="home-recommendation-dismiss" type="button" onClick={dismissRecommendation} aria-label="Dismiss recommendation"><X size={16} /></button>
        </aside>}
      </div>
      <div className="desktop-home">
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
          <h2 id="current-journey-title">{journeyOverview.hasActiveJourney ? "Keep walking, one day at a time." : featuredJourney ? "A little more peace, one day at a time." : "Choose your next journey."}</h2>
        </div>
        <button className="landing-journey-card" type="button" onClick={() => {
          window.location.hash = featuredJourney === "bible" ? "#/journey" : `#/journeys/${featuredJourney ?? "advent"}`;
        }}>
          <CardArt art={featuredJourneyInfo?.artwork ?? journeyCatalog.advent.artwork} mode="cover" />
          <span className="landing-journey-copy">
            {featuredGuidedId && featuredGuidedOverview && featuredJourneyInfo ? <>
              <span className="eyebrow">{featuredGuidedOverview.active ? "In progress" : "Featured journey"}</span>
              <strong>{featuredJourneyInfo.title}</strong>
              <span>{featuredJourneyInfo.description}</span>
              <span className="landing-journey-day">Recommended cadence: {journeyCadence(featuredGuidedId)}</span>
              <span className="landing-journey-day">Day {featuredGuidedOverview.nextDay} of {guidedTotal(featuredGuidedId)}</span>
              <progress value={guidedDone(featuredGuidedId)} max={guidedTotal(featuredGuidedId)} aria-label={`${guidedDone(featuredGuidedId)} of ${guidedTotal(featuredGuidedId)} days complete`} />
              <span className="text-link">Open this journey <ArrowRight size={15} /></span>
            </> : <>
              {featuredJourneyInfo ? <>
                <span className="eyebrow">{journeyOverview.bible.active ? "In progress" : "Featured journey"}</span>
                <strong>{featuredJourneyInfo.title}</strong>
                <span>{journeyOverview.bible.resumePeriod ? `Continue with ${journeyOverview.bible.resumePeriod.title} in the story of salvation.` : featuredJourneyInfo.description}</span>
                <span className="landing-journey-day">Recommended cadence: {journeyCadence("bible")}</span>
                <span className="landing-journey-day">{journeyOverview.bible.completedCount} of {journeyOverview.bible.totalCount} periods complete</span>
                <span className="text-link">Open Bible Journey <ArrowRight size={15} /></span>
              </> : <>
                <span className="eyebrow">All journeys complete</span>
                <strong>Revisit a guided journey</strong>
                <span>Return to a journey's day list and continue at your own pace.</span>
                <span className="text-link">Browse Advent days <ArrowRight size={15} /></span>
              </>}
            </>}
          </span>
        </button>
        {Object.values(guidedJourney).some((progress) => progress.storageError) && <p className="guided-journey-notice" role="status">Journey progress could not be saved on this device. Your changes will remain only for this visit.</p>}
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
          <p className="eyebrow">Curated Catholic Questions &amp; Answers</p>
          <h2 id="ask-title">Ask {ASSISTANT_NAME}</h2>
        </div>
        <button className="landing-ask-card" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}>
          <SofiAvatar size={56} />
          <span className="landing-ask-copy">
            <strong>Explore questions rooted in the faith.</strong>
            <span>Find answers and passages from Scripture, the Baltimore Catechism, and the Summa Theologiae.</span>
            <span className="text-link">Explore questions <ArrowRight size={14} /></span>
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
          {orderedJourneyList.filter((journey) => journey.id !== featuredJourney && journey.id !== "the-art-of-quiet").map((journey) => {
            if (!journey.available) {
              return (
                <article className="landing-card landing-card--coming-soon" key={journey.id}>
                  <CardArt art={journey.artwork} className="is-blurred" />
                  <div className="landing-card-copy"><h3>{journey.title}</h3><p>{journey.description}</p><span className="journey-coming-soon-pill">Coming soon</span></div>
                </article>
              );
            }
            const onSelect = () => { window.location.hash = journey.id === "bible" ? "#/journey" : `#/journeys/${journey.id}`; };
            const action = journey.id === "bible" ? "Explore Bible Journey" : "View journey days";
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
      </div>
    </main>
  );
}
