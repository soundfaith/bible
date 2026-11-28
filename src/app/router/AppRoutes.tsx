import { lazy, Suspense, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { DailyPage, type RecommendationPage } from "@/features/daily";
import { HomePage } from "@/features/home";
import { JourneysPage, NoWorryJourneyPage, GuidedJourneyLibraryPage, BibleJourneyLibrary, BibleJourneyPage, JourneyArtworkPage } from "@/features/journeys";
import { AboutPage } from "@/pages/AboutPage";
import { BibleBooksPage, ChapterPage, bibleBooks, hasOpenedBible, type ReadingPosition } from "@/features/bible";
import { MassReadingPage } from "@/features/mass-readings";
import { BreviaryLibrary, BreviaryPage } from "@/features/breviary";
import { RosaryLibrary, RosaryPrayerPage } from "@/features/rosary/RosaryPage";
import type { RosaryMode } from "@/features/rosary/rosary";
import { breviaryDayInfo, type assembleBreviary } from "@/features/breviary/breviary";
import { BookmarksPage, isVerseBookmark } from "@/features/bookmarks";
import { ReferencePage } from "@/pages/ReferencePage";
import { ListenPage, type PlayKind } from "@/features/listen";
import type { NarrationSnapshot, NarrationTrack } from "@/platform/audio/NarratorButton";
import type { getJourneyOverview } from "@/features/journeys/journeyOverview";
import type { GuidedJourneyId } from "@/features/journeys/guidedJourneys";
import type { DailyStreak } from "../daily";
import type { useJourneyAppState } from "../journeys";
import type { useAppBookmarks } from "../bookmarks";
import type { useAppNavigation } from "../navigation";
import type { useVoicePreference } from "../preferences";
import { shareApp } from "../preferences";
import type { BibleArt } from "../audio";
import type { Route } from "../routing";

const SaintPage = lazy(() => import("@/features/saints/SaintsPage").then((module) => ({ default: module.SaintPage })));
const SaintsLibrary = lazy(() => import("@/features/saints/SaintsPage").then((module) => ({ default: module.SaintsLibrary })));
const CatechismPage = lazy(() => import("@/features/catechism/CatechismPage").then((module) => ({ default: module.CatechismPage })));
const SummaPage = lazy(() => import("@/features/summa/SummaPage").then((module) => ({ default: module.SummaPage })));

type AudioStatus = "idle" | "playing" | "paused";
type JourneyState = ReturnType<typeof useJourneyAppState>;
type Bookmarks = ReturnType<typeof useAppBookmarks>;
type Navigation = ReturnType<typeof useAppNavigation>;

export type AppRoutesProps = {
  route: Route;
  recommendation: (page: RecommendationPage) => ReactNode;
  voicePreference: ReturnType<typeof useVoicePreference>["voicePreference"];
  narration: NarrationSnapshot;
  setPlayerOpen: (open: boolean) => void;
  dailyStreak: DailyStreak;
  journeyOverview: ReturnType<typeof getJourneyOverview>;
  // Bible
  readingPosition: ReadingPosition;
  setReadingPosition: Dispatch<SetStateAction<ReadingPosition>>;
  highlightVerse: number | null;
  bibleTrack: (position: ReadingPosition, art?: BibleArt) => NarrationTrack;
  advanceNarration: (position: ReadingPosition, art?: BibleArt) => void;
  // Bookmarks
  bookmarks: Bookmarks["bookmarks"];
  bookmarkCategories: Bookmarks["bookmarkCategories"];
  isBookmarked: Bookmarks["isBookmarked"];
  isChapterBookmarked: Bookmarks["isChapterBookmarked"];
  toggleBookmark: Bookmarks["toggleBookmark"];
  removeBookmark: Bookmarks["removeBookmark"];
  removeBookmarkCategory: Bookmarks["removeBookmarkCategory"];
  // Navigation
  openReader: Navigation["openReader"];
  openBibleBooks: Navigation["openBibleBooks"];
  openMassReference: Navigation["openMassReference"];
  openDailyItem: Navigation["openDailyItem"];
  resumeJourney: Navigation["resumeJourney"];
  // Mass
  massDate: string;
  setMassDate: Dispatch<SetStateAction<string>>;
  // Breviary
  breviaryHour: string | null;
  breviaryDate: Date;
  setBreviaryDate: Dispatch<SetStateAction<Date>>;
  breviaryDay: ReturnType<typeof assembleBreviary> | null;
  breviaryAudioForPage: { segmentIndex: number; status: AudioStatus; error: string | null };
  breviaryDesktopProgress: ReactNode;
  toggleBreviaryAudio: () => void;
  selectBreviarySegment: (index: number) => void;
  skipBreviaryIntro: () => void;
  // Rosary
  rosaryMysteryIndex: number;
  rosaryMode: RosaryMode;
  changeRosaryMode: (mode: RosaryMode) => void;
  rosaryAudioForPage: { segmentIndex: number; clipIndex: number; prayedBeadIndices: number[]; status: AudioStatus; error: string | null };
  activeRosaryPrayerGroupId: string | null;
  activeRosaryBeadIndex: number | null;
  rosaryDesktopProgress: ReactNode;
  toggleRosaryAudio: () => void;
  selectRosarySegment: (index: number) => void;
  // Saints
  saintSlug: string;
  // Journeys
  journeyPeriodId: string | null;
  activeGuidedId: GuidedJourneyId;
  activeGuidedDay: number | null;
  journeyProgress: JourneyState["journeyProgress"];
  guidedJourneyProgress: JourneyState["guidedJourneyProgress"];
  updateGuidedProgress: JourneyState["updateGuidedProgress"];
  journeyArtwork: JourneyState["journeyArtwork"];
  lastJourneyPeriodId: JourneyState["lastJourneyPeriodId"];
  selectJourneyArtwork: JourneyState["selectJourneyArtwork"];
  startGuidedJourney: (journeyId: GuidedJourneyId) => void;
  completeGuidedJourneyDay: (journeyId: GuidedJourneyId) => void;
  toggleJourneyPeriod: (periodId: string) => void;
  journeyAudioForPage: { storyIndex: number; status: AudioStatus; error: string | null };
  journeyDesktopProgress: ReactNode;
  toggleJourneyAudio: () => void;
  selectJourneyAudioStory: (index: number) => void;
  skipJourneyIntro: () => void;
  // Listen
  playHero: () => void;
  playListening: (kind: PlayKind, autoplay?: boolean) => Promise<void>;
};

// Chooses the page for the current route. All state and audio control stays with the caller.
export function AppRoutes(props: AppRoutesProps) {
  const {
    route, recommendation, voicePreference, narration, setPlayerOpen, dailyStreak, journeyOverview,
    readingPosition, setReadingPosition, highlightVerse, bibleTrack, advanceNarration,
    bookmarks, bookmarkCategories, isBookmarked, isChapterBookmarked, toggleBookmark, removeBookmark, removeBookmarkCategory,
    openReader, openBibleBooks, openMassReference, openDailyItem, resumeJourney,
    massDate, setMassDate,
    breviaryHour, breviaryDate, setBreviaryDate, breviaryDay, breviaryAudioForPage, breviaryDesktopProgress, toggleBreviaryAudio, selectBreviarySegment, skipBreviaryIntro,
    rosaryMysteryIndex, rosaryMode, changeRosaryMode, rosaryAudioForPage, activeRosaryPrayerGroupId, activeRosaryBeadIndex, rosaryDesktopProgress, toggleRosaryAudio, selectRosarySegment,
    saintSlug,
    journeyPeriodId, activeGuidedId, activeGuidedDay, journeyProgress, guidedJourneyProgress, journeyArtwork, lastJourneyPeriodId, selectJourneyArtwork, updateGuidedProgress, startGuidedJourney, completeGuidedJourneyDay, toggleJourneyPeriod,
    journeyAudioForPage, journeyDesktopProgress, toggleJourneyAudio, selectJourneyAudioStory, skipJourneyIntro,
    playHero, playListening,
  } = props;
  return route === "read" ? (
      <ChapterPage
        position={readingPosition}
        voicePreference={voicePreference}
        onPositionChange={setReadingPosition}
        onSelectChapter={openBibleBooks}
        highlightVerse={highlightVerse}
        isBookmarked={isBookmarked}
        isChapterBookmarked={isChapterBookmarked}
        onToggleBookmark={toggleBookmark}
        onNarrationEnded={() => advanceNarration(readingPosition)}
        narrationTrack={bibleTrack(readingPosition)}
        nextStep={recommendation("bible")}
      />
    ) : route === "bible" ? (
      <BibleBooksPage
        current={readingPosition}
        onResume={() => openReader(readingPosition)}
        onChoose={(position) => openReader(position)}
        nextStep={recommendation("bible")}
      />
    ) : route === "catechism" ? (
      <Suspense fallback={<main className="catechism-page section-wrap"><p className="eyebrow">Opening the Baltimore Catechism…</p></main>}><CatechismPage voicePreference={voicePreference} nextStep={recommendation("catechism")} /></Suspense>
    ) : route === "summa" ? (
      <Suspense fallback={<main className="catechism-page section-wrap"><p className="eyebrow">Opening the Summa Theologiae…</p></main>}><SummaPage voicePreference={voicePreference} nextStep={recommendation("summa")} /></Suspense>
    ) : route === "mass" ? (
      <MassReadingPage
        onOpenReference={openMassReference}
        selectedDate={massDate}
        onSelectedDateChange={setMassDate}
        voicePreference={voicePreference}
        nextStep={recommendation("mass")}
      />
    ) : route === "breviary" ? breviaryHour ? (
      <BreviaryPage
        hour={breviaryHour}
        day={breviaryDay}
        date={breviaryDate}
        onDateChange={setBreviaryDate}
        audioStatus={breviaryAudioForPage.status}
        activeSegmentIndex={breviaryAudioForPage.segmentIndex}
        audioError={breviaryAudioForPage.error}
        onToggleAudio={() => { const wasPlaying = breviaryAudioForPage.status === "playing"; toggleBreviaryAudio(); if (!wasPlaying) setPlayerOpen(true); }}
        onSelectSegment={(index) => { selectBreviarySegment(index); setPlayerOpen(true); }}
        onSkipIntro={skipBreviaryIntro}
        audioProgress={breviaryDesktopProgress}
        nextStep={recommendation("breviary")}
      />
    ) : (
      <BreviaryLibrary date={breviaryDate} onDateChange={setBreviaryDate} {...breviaryDayInfo(breviaryDate)} nextStep={recommendation("breviary")} />
    ) : route === "rosary-prayer" ? (
      <RosaryPrayerPage key={rosaryMysteryIndex} mysteryIndex={rosaryMysteryIndex} mode={rosaryMode} onModeChange={changeRosaryMode} audioStatus={rosaryAudioForPage.status} activeSegmentIndex={rosaryAudioForPage.segmentIndex} activePrayerGroupId={activeRosaryPrayerGroupId} prayedBeadIndices={rosaryAudioForPage.prayedBeadIndices} activeBeadIndex={activeRosaryBeadIndex} audioError={rosaryAudioForPage.error} onToggleAudio={() => { const wasPlaying = rosaryAudioForPage.status === "playing"; toggleRosaryAudio(); if (!wasPlaying) setPlayerOpen(true); }} onSelectSegment={(index) => { selectRosarySegment(index); setPlayerOpen(true); }} audioProgress={rosaryDesktopProgress} nextStep={recommendation("rosary")} />
    ) : route === "saints" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening the saints catalogue…</p></main>}><SaintsLibrary onOpenToday={() => { window.location.hash = "#/saints/today"; }} nextStep={recommendation("saints")} /></Suspense>
    ) : route === "saint-profile" ? (
      <Suspense fallback={<main className="journey-page section-wrap"><p className="eyebrow">Opening saint profile…</p></main>}><SaintPage slug={saintSlug} voicePreference={voicePreference} nextStep={recommendation("saints")} /></Suspense>
    ) : route === "rosary" ? (
      <RosaryLibrary nextStep={recommendation("rosary")} />
    ) : route === "bookmarks" ? (
      <BookmarksPage
        bookmarks={bookmarks}
        categories={bookmarkCategories}
        onOpen={(bookmark) => openReader(bookmark, isVerseBookmark(bookmark) ? bookmark.verseStart! : null)}
        onRemove={removeBookmark}
        onRemoveCategory={removeBookmarkCategory}
      />
    ) : route === "journey-artwork" ? (
      <JourneyArtworkPage
        selections={journeyArtwork.selections}
        storageError={journeyArtwork.storageError}
        onSelect={selectJourneyArtwork}
      />
    ) : route === "guided-journey" ? (
      activeGuidedDay === null ? <GuidedJourneyLibraryPage
        journeyId={activeGuidedId}
        progress={guidedJourneyProgress[activeGuidedId]}
        onSelectDay={(day) => { window.location.hash = `#/journeys/${activeGuidedId}/${day}`; }}
        onRestart={() => updateGuidedProgress(activeGuidedId, { started: false, completedDays: [], storageError: false })}
      /> :
      <NoWorryJourneyPage
        journeyId={activeGuidedId}
        progress={guidedJourneyProgress[activeGuidedId]}
        voicePreference={voicePreference}
        nextStep={recommendation("journey")}
        selectedDay={activeGuidedDay}
        onSelectDay={(day) => {
          window.location.hash = day === null ? `#/journeys/${activeGuidedId}` : `#/journeys/${activeGuidedId}/${day}`;
        }}
        onStart={() => startGuidedJourney(activeGuidedId)}
        onCompleteDay={() => {
          completeGuidedJourneyDay(activeGuidedId);
          window.location.hash = `#/journeys/${activeGuidedId}`;
        }}
      />
    ) : route === "journeys" ? (
      <JourneysPage
        guidedProgress={guidedJourneyProgress}
        bibleCompletedIds={journeyProgress.completedIds}
        lastVisitedPeriodId={lastJourneyPeriodId}
        onSelectJourney={(id) => {
          window.location.hash = id === "bible" ? "#/journey" : `#/journeys/${id}`;
        }}
        onContinueBibleJourney={resumeJourney}
        nextStep={recommendation("journey")}
      />
    ) : route === "listen" ? (
      <ListenPage narration={narration} onPlay={(kind) => { void playListening(kind); }} />
    ) : route === "daily" ? (
      <DailyPage streak={dailyStreak} onOpenDaily={openDailyItem} />
    ) : route === "journey" ? journeyPeriodId ? (
      <BibleJourneyPage
        periodId={journeyPeriodId}
        completedIds={journeyProgress.completedIds}
        storageError={journeyProgress.storageError}
        artworkSelections={journeyArtwork.selections}
        audioStatus={journeyAudioForPage.status}
        activeStoryIndex={journeyAudioForPage.storyIndex}
        audioError={journeyAudioForPage.error}
        onToggleComplete={toggleJourneyPeriod}
        onToggleAudio={() => { const wasPlaying = journeyAudioForPage.status === "playing"; toggleJourneyAudio(); if (!wasPlaying) setPlayerOpen(true); }}
        onSelectAudioStory={(index) => { selectJourneyAudioStory(index); setPlayerOpen(true); }}
        onSkipIntro={skipJourneyIntro}
        audioProgress={journeyDesktopProgress}
        nextStep={recommendation("journey")}
        onOpenPassage={(bookId, chapter, verse) => openReader({ bookId, chapter }, verse)}
      />
    ) : (
      <BibleJourneyLibrary
        completedIds={journeyProgress.completedIds}
        storageError={journeyProgress.storageError}
        artworkSelections={journeyArtwork.selections}
        lastVisitedPeriodId={lastJourneyPeriodId}
        onResume={resumeJourney}
        nextStep={recommendation("journey")}
      />
    ) : route === "library" ? (
      <ReferencePage eyebrow="Component library" title={<>A practical<br /><em>design library.</em></>} copy="A reference for the components and patterns used across the template." />
    ) : route === "about" ? (
      <AboutPage />
    ) : (
      <HomePage
        narration={narration}
        onPlayHero={playHero}
        onPlay={(kind, autoplay = false) => { void playListening(kind, autoplay); }}
        onResume={() => openReader()}
        onChoose={() => { window.location.hash = "#/bible"; }}
        onCatechism={() => { window.location.hash = "#/catechism"; }}
        onSumma={() => { window.location.hash = "#/summa"; }}
        onContinueBibleJourney={resumeJourney}
        onAllJourneys={() => { window.location.hash = "#/journeys"; }}
        onDaily={() => { window.location.hash = "#/daily"; }}
        streak={dailyStreak}
        guidedJourney={guidedJourneyProgress}
        bibleJourney={{
          completedIds: journeyProgress.completedIds,
          lastVisitedPeriodId: lastJourneyPeriodId,
        }}
        bible={{
          started: hasOpenedBible(),
          label: `${bibleBooks.find((book) => book.id === readingPosition.bookId)?.name ?? "Genesis"} ${readingPosition.chapter}`,
        }}
        onShare={shareApp}
        onOpenDaily={openDailyItem}
      />
    );
}
