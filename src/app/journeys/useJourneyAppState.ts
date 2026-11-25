import { useEffect, useState } from "react";
import { loadJourneyArtworkSelections, saveJourneyArtworkSelections } from "@/features/journeys/journeyArtwork";
import { loadJourneyProgress } from "@/features/journeys/journeyProgress";
import { loadGuidedJourneyProgress, saveGuidedJourneyProgress } from "@/features/journeys/guidedJourneyProgress";
import { journeyProgressStorageKey, loadJourneyProgressData, updateJourneyProgressData } from "@/features/journeys/journeyProgressStore";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import type { Route } from "../routing";

function getLastJourneyPeriodId() {
  return loadJourneyProgressData().data.lastVisitedPeriodId;
}

export function useJourneyAppState(route: Route, journeyPeriodId: string | null) {
  const [lastJourneyPeriodId, setLastJourneyPeriodId] = useState<string | null>(getLastJourneyPeriodId);
  const [journeyProgress, setJourneyProgress] = useState(loadJourneyProgress);
  const [guidedJourneyProgress, setGuidedJourneyProgress] = useState(() => ({
    freedom: loadGuidedJourneyProgress("freedom"),
    "no-worry": loadGuidedJourneyProgress("no-worry"),
  }));
  const [journeyArtwork, setJourneyArtwork] = useState(loadJourneyArtworkSelections);
  useEffect(() => {
    const syncJourneyProgress = (event: StorageEvent) => {
      if (event.key !== journeyProgressStorageKey) return;
      const { data, error } = loadJourneyProgressData();
      setJourneyProgress({ completedIds: data.bibleCompletedIds, storageError: error });
      setGuidedJourneyProgress({
        freedom: {
          started: data.freedomStarted || data.freedomCompletedDays.length > 0,
          completedDays: data.freedomCompletedDays,
          storageError: error,
        },
        "no-worry": {
          started: data.noWorryStarted || data.noWorryCompletedDays.length > 0,
          completedDays: data.noWorryCompletedDays,
          storageError: error,
        },
      });
      setLastJourneyPeriodId(data.lastVisitedPeriodId);
    };
    window.addEventListener("storage", syncJourneyProgress);
    return () => window.removeEventListener("storage", syncJourneyProgress);
  }, []);
  useEffect(() => {
    if (route !== "journey" || !journeyPeriodId) return;
    setLastJourneyPeriodId(journeyPeriodId);
    const saved = updateJourneyProgressData((progress) => ({ ...progress, lastVisitedPeriodId: journeyPeriodId }));
    if (!saved) setJourneyProgress((progress) => ({ ...progress, storageError: true }));
  }, [route, journeyPeriodId]);
  const updateGuidedProgress = (journeyId: GuidedJourneyId, progress: (typeof guidedJourneyProgress)[GuidedJourneyId]) => {
    const storageError = !saveGuidedJourneyProgress(journeyId, progress);
    setGuidedJourneyProgress((current) => ({ ...current, [journeyId]: { ...progress, storageError } }));
  };
  const selectJourneyArtwork = (periodId: string, optionId: string) => {
    const selections = { ...journeyArtwork.selections, [periodId]: optionId };
    setJourneyArtwork({ selections, storageError: !saveJourneyArtworkSelections(selections) });
  };
  return {
    lastJourneyPeriodId,
    journeyProgress,
    setJourneyProgress,
    guidedJourneyProgress,
    journeyArtwork,
    updateGuidedProgress,
    selectJourneyArtwork,
  };
}
