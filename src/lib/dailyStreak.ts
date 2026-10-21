import type { BreviaryHour } from "./breviary";

export type DailyItem = BreviaryHour | "mass" | "rosary" | "saints";
export type DailyStreakState = {
  log: Record<string, DailyItem[]>;
  total: number;
  storageError: boolean;
};

const KEY = "soundfaith-daily-streak-v1";
const KEEP_DAYS = 400;
const ITEMS: DailyItem[] = ["lauds", "vespers", "compline", "mass", "rosary", "saints"];

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  return localDateKey(new Date(year, month - 1, day + days));
}

export function loadDailyStreak(): DailyStreakState {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (parsed && typeof parsed === "object" && parsed.log && typeof parsed.log === "object") {
      const log: Record<string, DailyItem[]> = {};
      for (const [day, items] of Object.entries(parsed.log as Record<string, unknown>)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Array.isArray(items)) continue;
        const valid = items.filter((item): item is DailyItem => ITEMS.includes(item as DailyItem));
        if (valid.length) log[day] = [...new Set(valid)];
      }
      const total = Number.isFinite(parsed.total) ? Math.max(Number(parsed.total), Object.keys(log).length) : Object.keys(log).length;
      return { log, total, storageError: false };
    }
    return { log: {}, total: 0, storageError: false };
  } catch {
    return { log: {}, total: 0, storageError: true };
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
    window.localStorage.setItem(KEY, JSON.stringify({ log, total }));
  } catch {
    storageError = true;
  }
  return { log, total, storageError };
}

export type Routine = "breviary" | "mass" | "rosary" | "saints";

const inRoutine = (routine: Routine, item: DailyItem) => routine === "mass"
  ? item === "mass"
  : routine === "rosary"
    ? item === "rosary"
    : routine === "saints"
      ? item === "saints"
      : item === "lauds" || item === "vespers" || item === "compline";

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
