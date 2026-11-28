import type { Dispatch, SetStateAction } from "react";
import { bibleBooks, type ReadingPosition } from "@/features/bible";
import { type DailyItem } from "@/features/daily";
import { bibleJourney } from "@/features/journeys/bibleJourney";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import { getTodaysMassReading, resolveReference } from "@/features/mass-readings";
import { currentBreviaryHour } from "@/features/breviary/breviary";
import { todaysRosaryPath } from "@/features/rosary/rosary";
import type { Modal } from "@/components/ModalLayer";

type AppNavigationOptions = {
  readingPosition: ReadingPosition;
  setReadingPosition: Dispatch<SetStateAction<ReadingPosition>>;
  setHighlightVerse: Dispatch<SetStateAction<number | null>>;
  setModal: Dispatch<SetStateAction<Modal | null>>;
  setMassDate: Dispatch<SetStateAction<string>>;
  setBreviaryDate: Dispatch<SetStateAction<Date>>;
  journeyOverview: ReturnType<typeof getJourneyOverview>;
};

export function useAppNavigation({
  readingPosition,
  setReadingPosition,
  setHighlightVerse,
  setModal,
  setMassDate,
  setBreviaryDate,
  journeyOverview,
}: AppNavigationOptions) {
  const openReader = (
    position = readingPosition,
    verse: number | null = null,
  ) => {
    setReadingPosition(position);
    setHighlightVerse(verse);
    window.location.hash = "#/read";
  };
  const resumeJourney = () => {
    const periodId = journeyOverview.bible.resumePeriod?.id ?? bibleJourney[0].id;
    window.location.hash = `#/journey/${periodId}`;
  };
  const openJourneyRecommendation = (journey: GuidedJourneyId | "bible") => {
    if (journey === "bible") {
      resumeJourney();
    } else {
      window.location.hash = `#/journeys/${journey}`;
    }
  };
  const openCurrentBreviary = () => {
    setBreviaryDate(new Date());
    window.location.hash = `#/breviary/${currentBreviaryHour()}`;
  };
  const openDailyItem = (item: DailyItem) => {
    if (item === "mass") {
      setMassDate(getTodaysMassReading().date);
      window.location.hash = "#/mass";
    } else if (item === "rosary") {
      window.location.hash = todaysRosaryPath();
    } else if (item === "saints") {
      window.location.hash = "#/saints/today";
    } else if (item === "bible") {
      window.location.hash = "#/bible";
    } else if (item === "catechism") {
      window.location.hash = "#/catechism";
    } else if (item === "summa") {
      window.location.hash = "#/summa";
    } else if (item === "journey-freedom") {
      window.location.hash = "#/journeys/freedom";
    } else if (item === "journey-no-worry") {
      window.location.hash = "#/journeys/no-worry";
    } else if (item === "journey-advent") {
      window.location.hash = "#/journeys/advent";
    } else if (item === "journey-bible") {
      resumeJourney();
    } else {
      setBreviaryDate(new Date());
      window.location.hash = `#/breviary/${item}`;
    }
  };
  const openPicker = () =>
    setModal({
      type: "chapter",
      current: readingPosition,
      onChoose: (position) => openReader(position),
    });
  const openBibleBooks = () => {
    window.location.hash = "#/bible";
  };
  const openMassReference = (reference: string) => {
    const verses = resolveReference(reference);
    const bookName = reference.split(/\s+\d+:/)[0].toLowerCase();
    const book = bibleBooks.find(
      (item) =>
        item.name.toLowerCase() === bookName ||
        (bookName === "psalm" && item.id === "psalms"),
    );
    if (book && verses[0])
      openReader(
        { bookId: book.id, chapter: verses[0].chapter },
        verses[0].verse,
      );
  };
  return {
    openReader,
    resumeJourney,
    openJourneyRecommendation,
    openCurrentBreviary,
    openDailyItem,
    openPicker,
    openBibleBooks,
    openMassReference,
  };
}
