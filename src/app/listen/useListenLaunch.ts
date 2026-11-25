import { useRef, useState } from "react";
import { hasEverDone, localDateKey, routineDoneToday, type Routine } from "@/features/daily";
import { getChapter, type ReadingPosition } from "@/features/bible";
import type { PlayKind } from "@/features/listen";
import { getMassReadingForDate, getTodaysMassReading } from "@/features/mass-readings";
import { todaysRosaryMysteryIndex, todaysRosaryPath, type RosaryMode } from "@/features/rosary/rosary";
import { currentBreviaryHour, type BreviaryHour } from "@/features/breviary/breviary";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { bibleJourney } from "@/features/journeys/bibleJourney";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import { loadSummaData } from "@/features/summa/summa";
import { catechismEditions } from "@/features/catechism/catechism";
import { saintNarrationAudioUrlsFor, narrationAudioUrlsFor } from "@/platform/audio/narrationAudio";
import { catechismItem, guidedItem, summaQuestionItem } from "@/platform/audio/audioPlaylists";
import { getNarrationSnapshot, loadWithoutPlaying, showNarrationError, startSpeaking, toggleActiveNarration, type NarrationTrack } from "@/platform/audio/NarratorButton";
import type { useVoicePreference } from "../preferences";
import type { DailyStreak } from "../daily";
import type { BibleArt } from "../audio";

type ListenLaunchOptions = {
  voicePreferenceRef: ReturnType<typeof useVoicePreference>["voicePreferenceRef"];
  setPlayerOpen: (open: boolean) => void;
  journeyOverview: ReturnType<typeof getJourneyOverview>;
  rosaryMode: RosaryMode;
  dailyStreak: DailyStreak;
  advanceNarration: (position: ReadingPosition, art?: BibleArt) => void;
  bibleTrack: (position: ReadingPosition, art?: BibleArt) => NarrationTrack;
  playJourneyIntro: (periodId: string) => void;
  prepareRosaryPlayback: (mysteryIndex: number) => void;
  playRosaryClip: (clipIndex: number, resetSegmentElapsed: boolean, initial: { mysteryIndex: number; mode: RosaryMode; path: string }) => void;
  prepareBreviaryPlayback: (date: Date, hour: BreviaryHour) => void;
  playBreviaryIntro: (hour: BreviaryHour, date: Date) => void;
  markGuidedDayPlayed: (journeyId: GuidedJourneyId, day: number) => void;
};

// Starts playback from the Listen, Home and mobile-nav entry points.
export function useListenLaunch({ voicePreferenceRef, setPlayerOpen, journeyOverview, rosaryMode, dailyStreak, advanceNarration, bibleTrack, playJourneyIntro, prepareRosaryPlayback, playRosaryClip, prepareBreviaryPlayback, playBreviaryIntro, markGuidedDayPlayed }: ListenLaunchOptions) {
  const [loadingListen, setLoadingListen] = useState<PlayKind | null>(null);
  const listenRequestRef = useRef(0);
  const playMassReading = (entry: ReturnType<typeof getTodaysMassReading>) => {
    const text = Object.values(entry.readings).map((reading) => reading.text).join("\n\n");
    const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    return startSpeaking(text, [], undefined, undefined, voicePreferenceRef.current, { title: `Mass Readings · ${date}`, path: `#/mass?date=${entry.date}`, art: "readings" });
  };
  const stepMassReading = (path: string, offset: number) => {
    const current = new Date(`${path.split("date=")[1] ?? ""}T00:00:00`);
    if (Number.isNaN(current.getTime())) return;
    current.setDate(current.getDate() + offset);
    const entry = getMassReadingForDate(localDateKey(current));
    if (entry) playMassReading(entry);
  };
  // Mobile opens items paused so tapping a card never plays sound; only the hero card and the play action start audio.
  const playListening = async (kind: PlayKind, autoplay = true) => {
    const request = ++listenRequestRef.current;
    const previousTrack = getNarrationSnapshot().track;
    const hold = !autoplay && window.innerWidth <= 760 && getNarrationSnapshot().status === "idle";
    const start = <T,>(load: () => T): T => (hold ? loadWithoutPlaying(load) : load());
    setLoadingListen(kind === "summa" || kind === "saint" ? kind : null);
    try {
      if (kind === "old-testament" || kind === "new-testament" || kind === "gospels") {
        const position = { bookId: kind === "old-testament" ? "genesis" : "matthew", chapter: 1 };
        const art: BibleArt = kind;
        const text = getChapter(position.bookId, position.chapter).map((verse) => verse.text).join(" ");
        if (start(() => startSpeaking(text, narrationAudioUrlsFor(position.bookId, position.chapter, voicePreferenceRef.current), () => advanceNarration(position, art), undefined, voicePreferenceRef.current, bibleTrack(position, art)))) setPlayerOpen(true);
      } else if (kind === "bible-journey") {
        start(() => playJourneyIntro(journeyOverview.bible.resumePeriod?.id ?? bibleJourney[0].id));
        setPlayerOpen(true);
      } else if (kind === "rosary") {
        const mysteryIndex = todaysRosaryMysteryIndex();
        prepareRosaryPlayback(mysteryIndex);
        start(() => playRosaryClip(0, true, { mysteryIndex, mode: rosaryMode, path: todaysRosaryPath() }));
        setPlayerOpen(true);
      } else if (kind === "breviary") {
        const date = new Date();
        const hour = currentBreviaryHour(date);
        prepareBreviaryPlayback(date, hour);
        start(() => playBreviaryIntro(hour, date));
        setPlayerOpen(true);
      } else if (kind === "mass") {
        if (start(() => playMassReading(getTodaysMassReading()))) setPlayerOpen(true);
      } else if (kind === "saint") {
        const { featuredSaintForDate: getSaint, saintNarrationText } = await import("@/features/saints/saints");
        if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
        const saint = getSaint();
        if (!saint) throw new Error("No saint is listed for today.");
        if (start(() => startSpeaking(saintNarrationText(saint), saintNarrationAudioUrlsFor(saint.slug, voicePreferenceRef.current), undefined, undefined, voicePreferenceRef.current, { title: saint.name, path: `#/saints/${saint.slug}`, art: "saints" }))) setPlayerOpen(true);
      } else if (kind === "summa") {
        const data = await loadSummaData();
        if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
        const part = data.parts[0];
        const question = part && data.questions.filter((item) => item.part_id === part.id && item.articles.length).sort((a, b) => a.number - b.number)[0];
        if (!part || !question) throw new Error("The first Summa question is unavailable.");
        const item = summaQuestionItem(part, question, data.questions.find((item) => item.part_id === part.id && item.number > question.number && item.articles.length));
        if (start(() => startSpeaking(item.text, [], undefined, undefined, voicePreferenceRef.current, item.track))) setPlayerOpen(true);
      } else if (kind === "freedom" || kind === "no-worry") {
        const item = guidedItem(kind, kind === "freedom" ? journeyOverview.freedom.nextDay : journeyOverview.noWorry.nextDay);
        if (!item) throw new Error("This listening item is unavailable.");
        if (start(() => startSpeaking(item.text, [], undefined, undefined, voicePreferenceRef.current, item.track))) {
          if (!hold && item.track.sequence?.kind === "guided") markGuidedDayPlayed(kind, item.track.sequence.day);
          setPlayerOpen(true);
        }
      } else {
        const edition = catechismEditions[0];
        const group = edition?.groups.find((item) => item.questions.length > 0);
        const item = edition && group ? catechismItem(edition, group) : null;
        if (!item) throw new Error("This listening item is unavailable.");
        if (start(() => startSpeaking(item.text, [], undefined, undefined, voicePreferenceRef.current, item.track))) setPlayerOpen(true);
      }
    } catch (error) {
      if (listenRequestRef.current !== request || getNarrationSnapshot().track !== previousTrack) return;
      console.error("Could not start listening.", error);
      showNarrationError(error instanceof Error ? error.message : "Could not load this listening item.");
    } finally {
      if (listenRequestRef.current === request) setLoadingListen(null);
    }
  };
  const playHero = () => {
    setPlayerOpen(true);
    if (getNarrationSnapshot().status !== "playing") toggleActiveNarration();
  };
  const openActiveJourney = () => {
    const kind: PlayKind = journeyOverview.freedom.active
      ? "freedom"
      : journeyOverview.noWorry.active
        ? "no-worry"
        : journeyOverview.bible.active
          ? "bible-journey"
          : "freedom";
    void playListening(kind, false);
  };
  const openDailyRoutine = () => {
    const routines: Routine[] = ["breviary", "mass", "rosary", "saints"];
    const owned = routines.filter((routine) => hasEverDone(dailyStreak, routine));
    const routine = owned.length === 0
      ? routines[Math.floor(Math.random() * routines.length)]
      : owned.find((item) => !routineDoneToday(dailyStreak, item)) ?? owned[0];
    const kinds: Record<Routine, PlayKind> = { breviary: "breviary", mass: "mass", rosary: "rosary", saints: "saint" };
    void playListening(kinds[routine], false);
  };
  return { loadingListen, playListening, playHero, playMassReading, stepMassReading, openActiveJourney, openDailyRoutine };
}
