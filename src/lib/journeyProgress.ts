import { bibleJourney } from "../data/bibleJourney";

const JOURNEY_PROGRESS_KEY = "soundfaith-bible-journey-progress-v1";
const validPeriodIds = new Set(bibleJourney.map((period) => period.id));

export function loadJourneyProgress() {
  try {
    const saved = window.localStorage.getItem(JOURNEY_PROGRESS_KEY);
    if (!saved) return { completedIds: [] as string[], storageError: false };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return { completedIds: [] as string[], storageError: true };
    const completedIds = parsed.filter(
      (id): id is string => typeof id === "string" && validPeriodIds.has(id),
    );
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
      JSON.stringify(completedIds.filter((id) => validPeriodIds.has(id))),
    );
    return true;
  } catch {
    return false;
  }
}
