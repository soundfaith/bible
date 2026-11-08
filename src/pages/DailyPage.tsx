import { ArrowRight } from "lucide-react";
import { SmallCard, type CardArtKey } from "../components/LandingSmallCard";
import { breviaryHourInfo, currentBreviaryHour } from "../lib/breviary";
import { doneToday, nextDailyRoutine, routineStreak, type DailyItem, type DailyStreakState, type Routine } from "../lib/dailyStreak";

type DailyPageProps = {
  streak: DailyStreakState;
  onOpenDaily: (item: DailyItem) => void;
};

export function DailyPage({ streak, onOpenDaily }: DailyPageProps) {
  const hour = currentBreviaryHour();
  const completed = doneToday(streak);
  const nextRoutine = nextDailyRoutine(streak);
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const openRoutine = (routine: Routine) => onOpenDaily(
    routine === "breviary" ? hour : routine === "mass" ? "mass" : routine === "rosary" ? "rosary" : "saints",
  );
  const routines: Array<{
    routine: Routine;
    art: CardArtKey;
    title: string;
    description: string;
    item: DailyItem;
    done: boolean;
    action: string;
  }> = [
    { routine: "breviary", art: "prayer", title: "Breviary", description: `Pray ${breviaryHourInfo[hour].name} with the Church.`, item: hour, done: completed.some((item) => item === "lauds" || item === "vespers" || item === "compline"), action: `Pray ${breviaryHourInfo[hour].name}` },
    { routine: "mass", art: "readings", title: "Mass Readings", description: "Spend a little time with today's readings from Mass.", item: "mass", done: completed.includes("mass"), action: "Read today's Mass" },
    { routine: "rosary", art: "rosary", title: "Rosary", description: "Pray with the mysteries of Jesus' life.", item: "rosary", done: completed.includes("rosary"), action: "Pray the Rosary" },
    { routine: "saints", art: "saints", title: "Saint of the Day", description: "Meet a witness to the Gospel and their life of faith.", item: "saints", done: completed.includes("saints"), action: "Meet today's saint" },
  ];
  const next = routines.find((routine) => routine.routine === nextRoutine);
  const completedCount = routines.filter((routine) => routine.done).length;

  return (
    <main className="daily-page section-wrap">
      <header className="daily-page-heading">
        <p className="eyebrow"><span className="eyebrow-dot" /> A gentle rhythm for today</p>
        <h1>Your daily<br /><em>rhythm.</em></h1>
        <p className="page-intro">{dateLabel} · Choose one prayerful practice at a time. There is no need to do everything.</p>
      </header>

      <section className="daily-page-focus" aria-labelledby="daily-focus-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Your next step</p>
          <h2 id="daily-focus-title">{next ? "Begin with what is still waiting." : "You have made room for prayer today."}</h2>
        </div>
        {next ? (
          <div className="daily-focus-card">
            <div className="daily-focus-copy">
              <span className="eyebrow">{routineStreak(streak, next.routine) > 0 ? `${routineStreak(streak, next.routine)}-day rhythm` : "A moment with God"}</span>
              <h3>{next.title}</h3>
              <p>{next.description}</p>
              <button className="button button-coral" type="button" onClick={() => openRoutine(next.routine)}>{next.action} <ArrowRight size={16} /></button>
            </div>
            <span className="daily-focus-count">{completedCount}<small>of {routines.length}<br />practices</small></span>
          </div>
        ) : (
          <p className="daily-page-complete">You have visited each of today's daily practices. Return to any of them whenever you need a moment of prayer.</p>
        )}
      </section>

      <section className="daily-page-practices" aria-labelledby="daily-practices-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Prayer and daily anchors</p>
          <h2 id="daily-practices-title">Choose a practice.</h2>
        </div>
        <div className="daily-practice-grid">
          {routines.map((routine) => (
            <SmallCard
              key={routine.routine}
              art={routine.art}
              title={routine.title}
              description={routine.description}
              stat={routineStreak(streak, routine.routine) > 0 ? `${routineStreak(streak, routine.routine)} day rhythm` : undefined}
              action={routine.done ? "Done for today" : routine.action}
              done={routine.done}
              onClick={() => openRoutine(routine.routine)}
            />
          ))}
        </div>
        {streak.storageError && <p className="daily-page-storage-error" role="status">Daily progress could not be saved on this device. Your changes will remain only for this visit.</p>}
      </section>
    </main>
  );
}
