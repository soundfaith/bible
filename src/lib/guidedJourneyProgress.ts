import type { GuidedJourneyId } from "../data/guidedJourneys";
import { getGuidedSlot, loadJourneyProgressData, saveJourneyProgressData, withGuidedSlot } from "./journeyProgressStore";

export type GuidedJourneyProgress = {
  started: boolean;
  completedDays: number[];
  storageError: boolean;
};

export function loadGuidedJourneyProgress(journeyId: GuidedJourneyId): GuidedJourneyProgress {
  const { data, error } = loadJourneyProgressData();
  const slot = getGuidedSlot(data, journeyId);
  return {
    started: slot.started || slot.completedDays.length > 0,
    completedDays: slot.completedDays,
    storageError: error,
  };
}

export function saveGuidedJourneyProgress(journeyId: GuidedJourneyId, progress: GuidedJourneyProgress): boolean {
  const { data, error } = loadJourneyProgressData();
  return saveJourneyProgressData(withGuidedSlot(data, journeyId, {
    started: progress.started,
    completedDays: progress.completedDays,
  })) && !error;
}
