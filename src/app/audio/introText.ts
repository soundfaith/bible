import journeyIntros from "@/data/journeyIntros.json";
import breviaryIntros from "@/data/breviaryIntros.json";

export function journeyIntroText(periodId: string) {
  const intro = (journeyIntros as Record<string, string>)[periodId] ?? "";
  return intro.replace(/\s+/g, " ").trim();
}

export function breviaryIntroText(hour: string) {
  return ((breviaryIntros as Record<string, string>)[hour] ?? "").replace(/\s+/g, " ").trim();
}
