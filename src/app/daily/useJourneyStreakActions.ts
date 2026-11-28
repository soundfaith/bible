import { recordDailyItem, recordJourneySession } from "@/features/daily";
import { guidedDailyItemFor } from "./guidedDailyItem";
import { guidedJourneyDays, type GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import { journeyCadence } from "@/features/journeys/journeyCatalog";
import { loadJourneyProgress, saveJourneyProgress } from "@/features/journeys/journeyProgress";
import type { useJourneyAppState } from "../journeys";
import type { DailyStreakSetter } from "./useDailyCoordination";

type JourneyState = Pick<ReturnType<typeof useJourneyAppState>, "journeyProgress" | "setJourneyProgress" | "guidedJourneyProgress" | "updateGuidedProgress">;

// Journey progress changes that also count toward the daily streak.
export function useJourneyStreakActions({ setDailyStreak, journeyProgress, setJourneyProgress, guidedJourneyProgress, updateGuidedProgress }: JourneyState & { setDailyStreak: DailyStreakSetter }) {
  const toggleJourneyPeriod = (periodId: string) => {
    const wasCompleted = journeyProgress.completedIds.includes(periodId);
    const completedIds = wasCompleted
      ? journeyProgress.completedIds.filter((id) => id !== periodId)
      : [...journeyProgress.completedIds, periodId];
    const saved = saveJourneyProgress(completedIds);
    setJourneyProgress({ completedIds, storageError: !saved });
    if (!wasCompleted) setDailyStreak((state) => recordDailyItem(state, "journey-bible"));
  };
  // Reads storage at call time because playback callbacks can outlive the render that created them.
  const completeJourneyPeriod = (periodId: string) => {
    const current = loadJourneyProgress();
    if (current.completedIds.includes(periodId)) return;
    const completedIds = [...current.completedIds, periodId];
    const saved = saveJourneyProgress(completedIds);
    setJourneyProgress({ completedIds, storageError: !saved });
    setDailyStreak((state) => recordDailyItem(state, "journey-bible"));
  };
  const startGuidedJourney = (journeyId: GuidedJourneyId) => {
    updateGuidedProgress(journeyId, { ...guidedJourneyProgress[journeyId], started: true });
    setDailyStreak((state) => recordJourneySession(state, journeyId, journeyCadence(journeyId)));
  };
  const completeGuidedJourneyDay = (journeyId: GuidedJourneyId) => {
    const current = guidedJourneyProgress[journeyId];
    if (!current.started || current.completedDays.length >= guidedJourneyDays[journeyId].length) return;
    const nextDay = current.completedDays.length + 1;
    updateGuidedProgress(journeyId, { ...current, started: true, completedDays: [...current.completedDays, nextDay] });
    setDailyStreak((state) => recordDailyItem(state, guidedDailyItemFor[journeyId]));
    setDailyStreak((state) => recordJourneySession(state, journeyId, journeyCadence(journeyId)));
  };
  const markGuidedDayPlayed = (journeyId: GuidedJourneyId, day: number) => {
    const current = guidedJourneyProgress[journeyId];
    if (current.completedDays.includes(day)) return;
    const completedDays = [...current.completedDays, day].sort((a, b) => a - b);
    updateGuidedProgress(journeyId, { ...current, started: true, completedDays });
    setDailyStreak((state) => recordDailyItem(state, guidedDailyItemFor[journeyId]));
  };
  return { toggleJourneyPeriod, completeJourneyPeriod, startGuidedJourney, completeGuidedJourneyDay, markGuidedDayPlayed };
}
