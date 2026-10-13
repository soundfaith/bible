import data from "../data/breviary.json";
import { getChapter } from "./bible";
import { narrationAudioUrlsFor } from "./narrationAudio";
import type { NarrationGender } from "./narrationVoice";

export type BreviaryHour = "lauds" | "vespers" | "compline";
export const breviaryHours: BreviaryHour[] = ["lauds", "vespers", "compline"];

export type BreviarySegment = {
  id: string;
  heading: string;
  reference?: string;
  paragraphs: string[];
  text: string;
  audioUrls: string[];
};

export type BreviaryDay = {
  date: Date;
  season: { id: string; name: string };
  saint: { name: string; rank: string; shortBiography: string } | null;
  segments: BreviarySegment[];
};

type Season = { name: string; antiphon: string; shortPrayer: string; intercessions: string; concludingPrayer: string };
type Saint = { id: string; name: string; date: string; rank: string; shortBiography: string; antiphon: string; intercession: string; concludingPrayer: string };

const seasons = data.seasons as Record<string, Season>;
const saints = data.saints as Saint[];
const canticles = data.canticles as Record<string, { reference: string; text: string }>;
const readings = data.readings as Array<{ theme: string; reference: string; text: string }>;
const byPsalm = data.reflections.byPsalm as Record<string, string>;

const CYCLE_DAYS = 182;
const repeatedPsalms = [1, 8, 16, 19, 22, 23, 27, 32, 34, 40, 42, 46, 51, 63, 67, 84, 90, 91, 95, 100, 103, 104, 119, 121, 126, 127, 130, 136, 138, 143, 146, 147];
const ntCanticleIds = ["ephesians_1", "philippians_2", "colossians_1", "first_peter_2", "revelation_4_5", "revelation_11_12", "revelation_15"];
const complinePsalms = ["4", "91", "134"];

export const breviaryHourInfo: Record<BreviaryHour, { name: string; time: string; blurb: string; teaser: string }> = {
  lauds: { name: "Lauds", time: "Morning Prayer", blurb: "Greet the dawn with praise, the psalm of the day, and a word of Scripture.", teaser: "Praise at daybreak" },
  vespers: { name: "Vespers", time: "Evening Prayer", blurb: "Give thanks as the day closes with a canticle and the Magnificat.", teaser: "Thanksgiving at sunset" },
  compline: { name: "Compline", time: "Night Prayer", blurb: "Entrust the night to God with a psalm, the Nunc Dimittis, and a blessing.", teaser: "Rest in God's keeping" },
};

export function isBreviaryHour(value: string | null | undefined): value is BreviaryHour {
  return value === "lauds" || value === "vespers" || value === "compline";
}

export function currentBreviaryHour(now = new Date()): BreviaryHour {
  const hour = now.getHours();
  if (hour >= 4 && hour < 12) return "lauds";
  if (hour >= 12 && hour < 20) return "vespers";
  return "compline";
}

export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function resolveSeasonId(date: Date) {
  const year = date.getFullYear();
  const day = dayNumber(date);
  const month = date.getMonth();
  const dom = date.getDate();
  if ((month === 0 && dom <= 12) || (month === 11 && dom >= 25)) return "christmas";
  const dec3 = new Date(year, 11, 3);
  const adventStart = new Date(year, 11, 3 - dec3.getDay());
  if (day >= dayNumber(adventStart)) return "advent";
  const easter = dayNumber(easterSunday(year));
  if (day >= easter - 46 && day < easter) return "lent";
  if (day >= easter && day <= easter + 49) return "easter";
  return "ordinary_time";
}

export function cycleDayForDate(date: Date) {
  return (((dayNumber(date) % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS) + 1;
}

function psalmForDay(day: number) {
  const index = day - 1;
  return index < 150 ? index + 1 : repeatedPsalms[index - 150];
}

export function breviaryDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const voiceOrder = (preference: NarrationGender) => (preference === "male" ? ["am_michael", "af_heart"] : ["af_heart", "am_michael"]);

export function breviaryClipUrls(clipId: string, preference: NarrationGender) {
  return voiceOrder(preference).map((voice) => `https://github.com/soundfaith/bible/releases/download/breviary-narration-${voice}/${clipId}.mp3`);
}

function plain(id: string, heading: string, text: string, clipId: string, preference: NarrationGender, reference?: string): BreviarySegment {
  return { id, heading, reference, paragraphs: [text], text, audioUrls: breviaryClipUrls(clipId, preference) };
}

function psalmSegment(number: string, preference: NarrationGender, heading = "Psalm"): BreviarySegment {
  const verses = getChapter("psalms", Number(number));
  const text = verses.map((verse) => verse.text.trim()).join(" ");
  const paragraphs: string[] = [];
  verses.forEach((verse, index) => {
    if (index === 0 || verse.paragraph !== verses[index - 1].paragraph) paragraphs.push(verse.text.trim());
    else paragraphs[paragraphs.length - 1] += ` ${verse.text.trim()}`;
  });
  return { id: `psalm-${number}`, heading, reference: `Psalm ${number}`, paragraphs, text, audioUrls: narrationAudioUrlsFor("psalms", Number(number), preference) };
}

function canticleSegment(id: string, heading: string, clipId: string, preference: NarrationGender): BreviarySegment {
  const canticle = canticles[id];
  return plain(`canticle-${id}`, heading, canticle.text, clipId, preference, canticle.reference);
}

export function breviaryDayInfo(date: Date) {
  const season = seasons[resolveSeasonId(date)];
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { seasonName: season.name, saintName: saints.find((item) => item.date === monthDay)?.name ?? null };
}

export function assembleBreviary(date: Date, hour: BreviaryHour, preference: NarrationGender): BreviaryDay {
  const seasonId = resolveSeasonId(date);
  const season = seasons[seasonId];
  const day = cycleDayForDate(date);
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const saint = saints.find((item) => item.date === monthDay) ?? null;
  const segments: BreviarySegment[] = [plain("opening", "Opening", data.opening, "opening", preference)];

  if (hour === "lauds") {
    segments.push(saint
      ? plain("antiphon", "Antiphon", saint.antiphon, `saint-${saint.id}-antiphon`, preference)
      : plain("antiphon", "Antiphon", season.antiphon, `antiphon-${seasonId}`, preference));
    const psalmNumber = psalmForDay(day);
    segments.push(psalmSegment(String(psalmNumber), preference, "Psalm of the Day"));
    const reading = readings[(day - 1) % readings.length];
    segments.push(plain("reading", "Reading", reading.text, `reading-${String((day - 1) % readings.length + 1).padStart(2, "0")}`, preference, reading.reference));
    segments.push(canticleSegment("song_of_zechariah", "Benedictus", "canticle-song_of_zechariah", preference));
    segments.push(saint
      ? plain("intercessions", "Intercessions", saint.intercession, `saint-${saint.id}-intercession`, preference)
      : plain("intercessions", "Intercessions", season.intercessions, `intercessions-${seasonId}`, preference));
    segments.push(saint
      ? plain("conclusion", "Concluding Prayer", saint.concludingPrayer, `saint-${saint.id}-conclusion`, preference)
      : plain("conclusion", "Concluding Prayer", season.concludingPrayer, `conclusion-${seasonId}`, preference));
    segments.push(plain("blessing", "Blessing", data.blessings.lauds, "blessing-lauds", preference));
    const reflection = byPsalm[String(psalmNumber)] ?? data.reflections.fallback;
    const reflectionClip = byPsalm[String(psalmNumber)] ? `reflection-${psalmNumber}` : "reflection-default";
    segments.push(plain("reflection", "Reflection", reflection, reflectionClip, preference));
  } else if (hour === "vespers") {
    const ntId = ntCanticleIds[(day - 1) % ntCanticleIds.length];
    segments.push(canticleSegment(ntId, "Evening Canticle", `canticle-${ntId}`, preference));
    segments.push(canticleSegment("song_of_mary", "Magnificat", "canticle-song_of_mary", preference));
    segments.push(plain("short-prayer", "Short Prayer", season.shortPrayer, `short-prayer-${seasonId}`, preference));
    segments.push(plain("blessing", "Blessing", data.blessings.vespers, "blessing-vespers", preference));
  } else {
    const psalm = complinePsalms[(day - 1) % complinePsalms.length];
    if (psalm === "91") {
      const part = data.complinePsalm91;
      segments.push(plain("psalm-91", "Psalm", part.text, "psalm-91-compline", preference, part.reference));
    } else {
      segments.push(psalmSegment(psalm, preference));
    }
    segments.push(canticleSegment("song_of_simeon", "Nunc Dimittis", "canticle-song_of_simeon", preference));
    segments.push(plain("night-prayer", "Night Prayer", data.nightPrayer, "night-prayer", preference));
    segments.push(plain("blessing", "Blessing", data.blessings.compline, "blessing-compline", preference));
  }

  return {
    date,
    season: { id: seasonId, name: season.name },
    saint: saint ? { name: saint.name, rank: saint.rank, shortBiography: saint.shortBiography } : null,
    segments,
  };
}

