import { bibleJourney } from "../data/bibleJourney";
import { resolveJourneyPeriodId } from "../data/journeyArtwork";

const JOURNEY_PROGRESS_KEY = "soundfaith-bible-journey-progress-v1";
const validPeriodIds = new Set(bibleJourney.map((period) => period.id));

export function loadJourneyProgress() {
  try {
    const saved = window.localStorage.getItem(JOURNEY_PROGRESS_KEY);
    if (!saved) return { completedIds: [] as string[], storageError: false };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return { completedIds: [] as string[], storageError: true };
    const completedIds = parsed.flatMap((id) => {
      if (typeof id !== "string") return [];
      const periodId = resolveJourneyPeriodId(id);
      return periodId && validPeriodIds.has(periodId) ? [periodId] : [];
    });
    return {
      completedIds: [...new Set(completedIds)],
      storageError: completedIds.length !== parsed.length,
    };
  } catch {
    return { completedIds: [] as string[], storageError: true };
  }
}

export function saveJourneyProgress(completedIds: string[]) {
  try {
    window.localStorage.setItem(
      JOURNEY_PROGRESS_KEY,
      JSON.stringify(completedIds.flatMap((id) => {
        const periodId = resolveJourneyPeriodId(id);
        return periodId && validPeriodIds.has(periodId) ? [periodId] : [];
      })),
    );
    return true;
  } catch {
    return false;
  }
}
