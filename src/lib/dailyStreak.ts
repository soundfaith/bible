import type { BreviaryHour } from "./breviary";

export type DailyItem = BreviaryHour | "mass" | "rosary" | "saints" | "bible" | "catechism" | "summa" | "journey-no-worry" | "journey-bible";
export type DailyStreakState = {
  log: Record<string, DailyItem[]>;
  journeySessions: Record<string, string[]>;
  total: number;
  storageError: boolean;
};

const KEY = "soundfaith-daily-streak-v1";
const KEEP_DAYS = 400;
const KEEP_JOURNEY_WINDOWS = 100;
const ITEMS: DailyItem[] = ["lauds", "vespers", "compline", "mass", "rosary", "saints", "bible", "catechism", "summa", "journey-no-worry", "journey-bible"];
const validDateKey = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key);

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  return localDateKey(new Date(year, month - 1, day + days));
}

export function journeyCadenceWindowKey(cadence: "daily" | "weekly", date = new Date()) {
  if (cadence === "daily") return localDateKey(date);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return localDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday));
}

export function loadDailyStreak(): DailyStreakState {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (parsed && typeof parsed === "object" && parsed.log && typeof parsed.log === "object") {
      const log: Record<string, DailyItem[]> = {};
      for (const [day, items] of Object.entries(parsed.log as Record<string, unknown>)) {
        if (!validDateKey(day) || !Array.isArray(items)) continue;
        const valid = items.filter((item): item is DailyItem => ITEMS.includes(item as DailyItem));
        if (valid.length) log[day] = [...new Set(valid)];
      }
      const journeySessions: Record<string, string[]> = {};
      if (parsed.journeySessions && typeof parsed.journeySessions === "object" && !Array.isArray(parsed.journeySessions)) {
        for (const [journeyId, windows] of Object.entries(parsed.journeySessions as Record<string, unknown>)) {
          if (!/^[a-z0-9-]+$/i.test(journeyId) || !Array.isArray(windows)) continue;
          const validWindows = [...new Set(windows.filter((window): window is string => typeof window === "string" && validDateKey(window)))].slice(-KEEP_JOURNEY_WINDOWS);
          if (validWindows.length) journeySessions[journeyId] = validWindows;
        }
      }
      const total = Number.isFinite(parsed.total) ? Math.max(Number(parsed.total), Object.keys(log).length) : Object.keys(log).length;
      return { log, journeySessions, total, storageError: false };
    }
    return { log: {}, journeySessions: {}, total: 0, storageError: false };
  } catch {
    return { log: {}, journeySessions: {}, total: 0, storageError: true };
  }
}

export function recordDailyItem(state: DailyStreakState, item: DailyItem, today = localDateKey()): DailyStreakState {
  const existing = state.log[today] ?? [];
  if (existing.includes(item)) return state;
  const log: Record<string, DailyItem[]> = { ...state.log, [today]: [...existing, item] };
  const cutoff = shiftKey(today, -KEEP_DAYS);
  for (const day of Object.keys(log)) if (day < cutoff) delete log[day];
  const total = existing.length ? state.total : state.total + 1;
  let storageError = false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ log, journeySessions: state.journeySessions, total }));
  } catch {
    storageError = true;
  }
  return { ...state, log, total, storageError };
}

export function recordJourneySession(
  state: DailyStreakState,
  journeyId: string,
  cadence: "daily" | "weekly",
  date = new Date(),
): DailyStreakState {
  if (!/^[a-z0-9-]+$/i.test(journeyId)) {
    throw new Error(`Invalid journey id: ${journeyId}`);
  }
  const windowKey = journeyCadenceWindowKey(cadence, date);
  const existing = state.journeySessions[journeyId] ?? [];
  if (existing.includes(windowKey)) return state;
  const journeySessions = {
    ...state.journeySessions,
    [journeyId]: [...existing, windowKey].slice(-KEEP_JOURNEY_WINDOWS),
  };
  let storageError = false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ log: state.log, journeySessions, total: state.total }));
  } catch {
    storageError = true;
  }
  return { ...state, journeySessions, storageError };
}

export function hasJourneySessionInCadence(
  state: DailyStreakState,
  journeyId: string,
  cadence: "daily" | "weekly",
  date = new Date(),
) {
  const windowKey = journeyCadenceWindowKey(cadence, date);
  if (state.journeySessions[journeyId]?.includes(windowKey)) return true;

  const legacyItem: DailyItem | null = journeyId === "no-worry"
    ? "journey-no-worry"
    : journeyId === "bible"
      ? "journey-bible"
      : null;
  if (!legacyItem) return false;
  if (cadence === "daily") return (state.log[windowKey] ?? []).includes(legacyItem);
  const [year, month, day] = windowKey.split("-").map(Number);
  for (let offset = 0; offset < 7; offset += 1) {
    const dateKey = localDateKey(new Date(year, month - 1, day + offset));
    if ((state.log[dateKey] ?? []).includes(legacyItem)) return true;
  }
  return false;
}

export type Routine = "breviary" | "mass" | "rosary" | "saints";

const inRoutine = (routine: Routine, item: DailyItem) => routine === "mass"
  ? item === "mass"
  : routine === "rosary"
    ? item === "rosary"
    : routine === "saints"
      ? item === "saints"
      : item === "lauds" || item === "vespers" || item === "compline";

export function nextDailyRoutine(state: DailyStreakState, today = localDateKey()): Routine | null {
  const completed = (routine: Routine) => (state.log[today] ?? []).some((item) => inRoutine(routine, item));
  const available: Routine[] = ["breviary", "mass", "rosary", "saints"];
  const unfinished = available.filter((routine) => !completed(routine));
  if (unfinished.length === 0) return null;
  return unfinished.sort((left, right) => routineStreak(state, right, today) - routineStreak(state, left, today))[0];
}

/** Consecutive days with this routine. Today is not required yet, so a streak stays alive until a full day is missed. */
export function routineStreak(state: DailyStreakState, routine: Routine, today = localDateKey()) {
  const hasDay = (day: string) => (state.log[day] ?? []).some((item) => inRoutine(routine, item));
  let cursor = hasDay(today) ? today : shiftKey(today, -1);
  let count = 0;
  while (hasDay(cursor)) {
    count += 1;
    cursor = shiftKey(cursor, -1);
  }
  return count;
}

export function hasEverDone(state: DailyStreakState, routine: Routine) {
  return Object.values(state.log).some((items) => items.some((item) => inRoutine(routine, item)));
}

export function doneToday(state: DailyStreakState, today = localDateKey()): DailyItem[] {
  return state.log[today] ?? [];
}
