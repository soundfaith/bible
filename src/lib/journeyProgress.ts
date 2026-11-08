import { resolveJourneyPeriodId } from "../data/journeyArtwork";
import { loadJourneyProgressData, saveJourneyProgressData } from "./journeyProgressStore";

export function loadJourneyProgress() {
  const { data, error } = loadJourneyProgressData();
  return { completedIds: data.bibleCompletedIds, storageError: error };
}

export function saveJourneyProgress(completedIds: string[]) {
  const { data, error } = loadJourneyProgressData();
  const normalizedIds = completedIds.flatMap((id) => {
    const periodId = resolveJourneyPeriodId(id);
    return periodId ? [periodId] : [];
  });
  return saveJourneyProgressData({ ...data, bibleCompletedIds: [...new Set(normalizedIds)] }) && !error;
}
