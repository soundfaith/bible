import { resolveJourneyPeriodId } from "@/features/journeys/journeyArtwork";
import { guidedJourneyDays, isGuidedJourneyId, type GuidedJourneyId } from "@/features/journeys/guidedJourneys";

export type Route = "home" | "listen" | "daily" | "read" | "bible" | "mass" | "bookmarks" | "library" | "about" | "journeys" | "journey" | "guided-journey" | "journey-artwork" | "breviary" | "rosary" | "rosary-prayer" | "saints" | "saint-profile" | "catechism" | "summa";

export function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  return path === "journey-artwork" ? "journey-artwork"
    : path === "listen" ? "listen"
    : path === "journeys" ? "journeys"
    : path === "daily" ? "daily"
    : path.startsWith("journeys/") ? "guided-journey"
    : path === "summa" || path.startsWith("summa/") ? "summa"
    : path === "catechism" || path.startsWith("catechism/") ? "catechism"
    : path.startsWith("rosary/") ? "rosary-prayer"
    : path === "rosary" ? "rosary"
    : path.startsWith("saints/") ? "saint-profile"
    : path === "saints" ? "saints"
    : path === "breviary" || path.startsWith("breviary/") ? "breviary"
    : path.startsWith("journey/") ? "journey"
    : path === "read" || path === "bible" || path === "mass" || path === "bookmarks" || path === "library" || path === "about" || path === "journey"
      ? path
    : "home";
}

export function readSaintSlug() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  if (!path.startsWith("saints/")) return "today";
  try { return decodeURIComponent(path.slice("saints/".length)); } catch { return path.slice("saints/".length); }
}

export function readJourneyPeriodId() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  if (!path.startsWith("journey/")) return null;
  try {
    return resolveJourneyPeriodId(decodeURIComponent(path.slice("journey/".length)));
  } catch {
    return resolveJourneyPeriodId(path.slice("journey/".length));
  }
}

export function readBreviaryHour() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0].replace(/\/+$/, "");
  return path.startsWith("breviary/") ? path.slice("breviary/".length) : null;
}

export function readRosaryMysteryIndex() {
  const segment = window.location.hash.split("?")[0].replace(/^#\/?/, "").split("/")[1];
  const ids = ["joyful", "luminous", "sorrowful", "glorious"];
  const index = ids.indexOf(segment ?? "");
  return index < 0 ? 0 : index;
}

export function readJourneyStoryAnchor() {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("story");
}

export function readGuidedJourney(): { journeyId: GuidedJourneyId; day: number | null } | null {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const match = path.match(/^journeys\/([^/]+)(?:\/(\d+))?$/);
  if (!match || !isGuidedJourneyId(match[1])) return null;
  const journeyId = match[1];
  const day = match[2] === undefined ? NaN : Number(match[2]);
  return { journeyId, day: Number.isInteger(day) && day >= 1 && day <= guidedJourneyDays[journeyId].length ? day : null };
}
