import { noWorryJourney } from "../data/noWorryJourney";
import { loadJourneyProgressData, saveJourneyProgressData } from "./journeyProgressStore";

export type GuidedJourneyProgress = {
  started: boolean;
  completedDays: number[];
  storageError: boolean;
};

export function loadGuidedJourneyProgress(): GuidedJourneyProgress {
  const { data, error } = loadJourneyProgressData();
  return {
    started: data.noWorryStarted || data.noWorryCompletedDays.length > 0,
    completedDays: data.noWorryCompletedDays,
    storageError: error,
  };
}

export function saveGuidedJourneyProgress(progress: GuidedJourneyProgress): boolean {
  const { data, error } = loadJourneyProgressData();
  return saveJourneyProgressData({
    ...data,
    noWorryStarted: progress.started,
    noWorryCompletedDays: progress.completedDays,
  }) && !error;
}
