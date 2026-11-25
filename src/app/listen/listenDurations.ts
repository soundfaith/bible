import { getChapter } from "@/features/bible";
import type { PlayKind } from "@/features/listen";
import { getTodaysMassReading } from "@/features/mass-readings";
import { buildRosarySequence, todaysRosaryMysteryIndex, type RosaryMode } from "@/features/rosary/rosary";
import { assembleBreviary, currentBreviaryHour } from "@/features/breviary/breviary";
import { bibleJourney } from "@/features/journeys/bibleJourney";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { catechismEditions } from "@/features/catechism/catechism";
import { catechismItem, guidedItem } from "@/platform/audio/audioPlaylists";
import { estimatedNarrationDuration } from "@/platform/audio/NarratorButton";
import type { useVoicePreference } from "../preferences";
import { breviaryIntroText, journeyIntroText } from "../audio";

type ListenDurationOptions = {
  journeyOverview: ReturnType<typeof getJourneyOverview>;
  rosaryMode: RosaryMode;
  voicePreference: ReturnType<typeof useVoicePreference>["voicePreference"];
};

// Evaluated only while the Listen page renders because it assembles several narration texts.
export function getListenDurations({ journeyOverview, rosaryMode, voicePreference }: ListenDurationOptions): Partial<Record<PlayKind, string>> {
  return {
    "old-testament": estimatedNarrationDuration(getChapter("genesis", 1).map((verse) => verse.text).join(" ")),
    "new-testament": estimatedNarrationDuration(getChapter("matthew", 1).map((verse) => verse.text).join(" ")),
    "gospels": estimatedNarrationDuration(getChapter("matthew", 1).map((verse) => verse.text).join(" ")),
    "bible-journey": estimatedNarrationDuration(journeyIntroText(bibleJourney[0].id)),
    "freedom": estimatedNarrationDuration(guidedItem("freedom", journeyOverview.freedom.nextDay)?.text ?? ""),
    "no-worry": estimatedNarrationDuration(guidedItem("no-worry", journeyOverview.noWorry.nextDay)?.text ?? ""),
    "catechism": estimatedNarrationDuration(catechismItem(catechismEditions[0], catechismEditions[0].groups.find((item) => item.questions.length > 0)!).text),
    "mass": estimatedNarrationDuration(Object.values(getTodaysMassReading().readings).map((reading) => reading.text).join("\n\n")),
    "rosary": estimatedNarrationDuration(buildRosarySequence(rosaryMode, todaysRosaryMysteryIndex()).clips.map((clip) => clip.spokenText).join(" ")),
    "breviary": estimatedNarrationDuration([breviaryIntroText(currentBreviaryHour()), ...assembleBreviary(new Date(), currentBreviaryHour(), voicePreference).segments.map((segment) => segment.text)].join(" ")),
  };
}
