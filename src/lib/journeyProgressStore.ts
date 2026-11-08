import { bibleJourney } from "../data/bibleJourney";
import { noWorryJourney } from "../data/noWorryJourney";
import { resolveJourneyPeriodId } from "../data/journeyArtwork";

const STORAGE_KEY = "soundfaith-journey-progress-v1";
const LEGACY_BIBLE_KEY = "soundfaith-bible-journey-progress-v1";
const LEGACY_GUIDED_KEY = "soundfaith-guided-journey-no-worry-v1";
const LEGACY_LAST_PERIOD_KEY = "soundfaith-bible-journey-last-period-v1";
const validPeriodIds = new Set(bibleJourney.map((period) => period.id));

export type JourneyProgressData = {
  bibleCompletedIds: string[];
  lastVisitedPeriodId: string | null;
  noWorryStarted: boolean;
  noWorryCompletedDays: number[];
};

const EMPTY_PROGRESS: JourneyProgressData = {
  bibleCompletedIds: [],
  lastVisitedPeriodId: null,
  noWorryStarted: false,
  noWorryCompletedDays: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseBibleIds(value: unknown) {
  if (!Array.isArray(value)) return { ids: [] as string[], error: true };
  const ids = value.flatMap((id) => {
    if (typeof id !== "string") return [];
    const resolvedId = resolveJourneyPeriodId(id);
    return resolvedId && validPeriodIds.has(resolvedId) ? [resolvedId] : [];
  });
  return { ids: [...new Set(ids)], error: ids.length !== value.length };
}

function parseNoWorry(value: unknown) {
  if (!isRecord(value) || typeof value.started !== "boolean" || !Array.isArray(value.completedDays)) {
    return { started: false, days: [] as number[], error: true };
  }
  const savedDays = [...new Set(value.completedDays.filter(
    (day): day is number => Number.isInteger(day) && Number(day) >= 1 && Number(day) <= noWorryJourney.length,
  ))].sort((a, b) => a - b);
  const days: number[] = [];
  for (let day = 1; savedDays.includes(day); day += 1) days.push(day);
  return {
    started: value.started || days.length > 0,
    days,
    error: days.length !== value.completedDays.length,
  };
}

function normalizeProgress(value: unknown) {
  if (!isRecord(value)) return { data: EMPTY_PROGRESS, error: true };
  const bible = parseBibleIds(value.bibleCompletedIds);
  const noWorry = parseNoWorry({ started: value.noWorryStarted, completedDays: value.noWorryCompletedDays });
  const lastVisitedPeriodId = typeof value.lastVisitedPeriodId === "string"
    ? resolveJourneyPeriodId(value.lastVisitedPeriodId)
    : null;
  const validLastPeriod = lastVisitedPeriodId && validPeriodIds.has(lastVisitedPeriodId)
    ? lastVisitedPeriodId
    : null;
  return {
    data: {
      bibleCompletedIds: bible.ids,
      lastVisitedPeriodId: validLastPeriod,
      noWorryStarted: noWorry.started,
      noWorryCompletedDays: noWorry.days,
    },
    error: bible.error || noWorry.error || (value.lastVisitedPeriodId !== null && value.lastVisitedPeriodId !== undefined && !validLastPeriod),
  };
}

function readLegacyProgress(): { data: JourneyProgressData; error: boolean } {
  let data = EMPTY_PROGRESS;
  let error = false;
  let savedBible: string | null = null;
  try { savedBible = window.localStorage.getItem(LEGACY_BIBLE_KEY); } catch { error = true; }
  if (savedBible !== null) {
    try {
      const parsed: unknown = JSON.parse(savedBible);
      const bible = parseBibleIds(parsed);
      data = { ...data, bibleCompletedIds: bible.ids };
      error ||= bible.error;
    } catch {
      error = true;
    }
  }

  let savedGuided: string | null = null;
  try { savedGuided = window.localStorage.getItem(LEGACY_GUIDED_KEY); } catch { error = true; }
  if (savedGuided !== null) {
    try {
      const guided = parseNoWorry(JSON.parse(savedGuided) as unknown);
      data = { ...data, noWorryStarted: guided.started, noWorryCompletedDays: guided.days };
      error ||= guided.error;
    } catch {
      error = true;
    }
  }

  let lastPeriod: string | null = null;
  try { lastPeriod = window.localStorage.getItem(LEGACY_LAST_PERIOD_KEY); } catch { error = true; }
  const resolvedPeriod = lastPeriod ? resolveJourneyPeriodId(lastPeriod) : null;
  if (resolvedPeriod && validPeriodIds.has(resolvedPeriod)) {
    data = { ...data, lastVisitedPeriodId: resolvedPeriod };
  } else if (lastPeriod) {
      error = true;
  }
  return { data, error };
}

export function loadJourneyProgressData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      const legacy = readLegacyProgress();
      return saveJourneyProgressData(legacy.data) ? legacy : { ...legacy, error: true };
    }
    const parsed: unknown = JSON.parse(saved);
    return normalizeProgress(parsed);
  } catch {
    return { data: EMPTY_PROGRESS, error: true };
  }
}

export function saveJourneyProgressData(data: JourneyProgressData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function updateJourneyProgressData(
  update: (progress: JourneyProgressData) => JourneyProgressData,
) {
  const current = loadJourneyProgressData();
  return saveJourneyProgressData(update(current.data)) && !current.error;
}

export const journeyProgressStorageKey = STORAGE_KEY;
