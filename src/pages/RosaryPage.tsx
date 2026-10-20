import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CircleDot, Headphones, Pause, Play } from "lucide-react";
import { FloatingRosaryBeads, RosaryArtwork } from "../components/RosaryArtwork";
import { buildRosarySequence, rosaryModeDescriptions, rosaryModeNames, rosaryMysteries, type RosaryMode, type RosaryPrayerGroup } from "../data/rosary";

type RosaryAudioStatus = "idle" | "playing" | "paused";

function ordinal(index: number) { return ["First", "Second", "Third", "Fourth", "Fifth"][index] ?? `Mystery ${index + 1}`; }

const ROSARY_BEADS_VISIBILITY_KEY = "rosary-beads-visible";

function getRosaryBeadsVisibility() {
  try {
    return window.localStorage.getItem(ROSARY_BEADS_VISIBILITY_KEY) === "true";
  } catch {
    return false;
  }
}

function PrayerText({ text }: { text: string }) {
  return <p className="rosary-prayer-reading bible-reading-copy" lang="en">{text}</p>;
}

export function RosaryLibrary() {
  return <main className="journey-page section-wrap rosary-page">
    <header className="journey-heading">
      <div className="journey-heading-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> A prayer with Mary</p>
        <h1>Pray the <em>Rosary</em></h1>
        <p className="journey-intro">Walk through the life of Jesus with the four sets of mysteries.</p>
        <a className="button button-coral journey-resume-button" href="#/rosary/joyful">Begin praying <ArrowRight size={15} /></a>
      </div>
    </header>
    <section className="journey-library" aria-labelledby="rosary-mysteries-title">
      <div className="journey-library-heading">
        <div><p className="eyebrow">The four sets of mysteries</p><h2 id="rosary-mysteries-title">Choose a mystery.</h2></div>
      </div>
      <ol className="journey-library-list rosary-library-list">
        {rosaryMysteries.map((mystery, index) => <li className="journey-library-item" key={mystery.title}>
          <a className="journey-library-card" href={`#/rosary/${["joyful", "luminous", "sorrowful", "glorious"][index]}`} aria-label={`Pray the ${mystery.title}`}>
            <RosaryArtwork index={index} />
            <span className="journey-library-copy">
              <span className="journey-period-label"><span>{mystery.weekday}</span></span>
              <strong>{mystery.title}</strong>
              <span className="journey-library-teaser">{mystery.scenes.length} Gospel moments</span>
              <span className="journey-library-meta">Pray this set <ArrowRight size={14} aria-hidden="true" /></span>
            </span>
          </a>
        </li>)}
      </ol>
    </section>
  </main>;
}

export function RosaryPrayerPage({
  mysteryIndex = 0,
  mode,
  onModeChange,
  audioStatus,
  activeSegmentIndex,
  activePrayerGroupId,
  prayedBeadIndices,
  activeBeadIndex,
  audioError,
  onToggleAudio,
  onSelectSegment,
  nextStep,
}: {
  mysteryIndex?: number;
  mode: RosaryMode;
  onModeChange: (mode: RosaryMode) => void;
  audioStatus: RosaryAudioStatus;
  activeSegmentIndex: number;
  activePrayerGroupId: string | null;
  prayedBeadIndices: number[];
  activeBeadIndex: number | null;
  audioError: string | null;
  onToggleAudio: () => void;
  onSelectSegment: (index: number) => void;
  nextStep?: ReactNode;
}) {
  const mystery = rosaryMysteries[mysteryIndex] ?? rosaryMysteries[0];
  const sequence = useMemo(() => buildRosarySequence(mode, mysteryIndex), [mode, mysteryIndex]);
  const [showRosaryBeads, setShowRosaryBeads] = useState(getRosaryBeadsVisibility);
  const activeSegment = sequence.segments[activeSegmentIndex];

  function toggleRosaryBeads() {
    const nextVisible = !showRosaryBeads;
    setShowRosaryBeads(nextVisible);
    try {
      window.localStorage.setItem(ROSARY_BEADS_VISIBILITY_KEY, String(nextVisible));
    } catch {
      // Keep the in-page toggle usable if local storage is unavailable.
    }
  }

  function isGroupActive(group: RosaryPrayerGroup) {
    return audioStatus !== "idle" && activePrayerGroupId === group.id;
  }

  function renderPrayerGroups(groups: RosaryPrayerGroup[]) {
    return groups.map((group) => {
      const active = isGroupActive(group);
      return <div className={`rosary-prayer-part${active ? " is-audio-active" : ""}`} id={`rosary-prayer-${group.id}`} key={group.id}>
        <div className="rosary-prayer-heading">
          <h4>{group.title}{group.repeat > 1 && <span className="rosary-prayer-count">× {group.repeat}</span>}</h4>
        </div>
        <PrayerText text={group.text} />
      </div>;
    });
  }

  return <main className={`journey-page journey-detail-page section-wrap rosary-page${nextStep ? " has-next-step" : ""}`}>
    <nav className="journey-detail-nav" aria-label="Rosary navigation">
      <a className="button button-outline" href="#/rosary"><ArrowLeft size={16} /> All mysteries</a>
      <div className="detail-nav-actions">
        <button className="icon-button rosary-beads-toggle" type="button" aria-expanded={showRosaryBeads} aria-pressed={showRosaryBeads} aria-controls={showRosaryBeads ? "floating-rosary-beads" : undefined} aria-label={showRosaryBeads ? "Hide Rosary beads" : "Show Rosary beads"} title={showRosaryBeads ? "Hide Rosary beads" : "Show Rosary beads"} onClick={toggleRosaryBeads}>
          <CircleDot size={17} aria-hidden="true" />
        </button>
      </div>
    </nav>
    <header className="journey-detail-heading rosary-detail-heading">
      <p className="eyebrow"><span className="eyebrow-dot" /> {mystery.weekday}</p>
      <h1>{mystery.title}</h1>
      <p className="journey-detail-overview">Pray through the life of Jesus, one mystery at a time.</p>
      <div className="rosary-mode-pills" role="group" aria-label="Rosary prayer mode">
        {(["traditional", "gospel"] as const).map((value) => <button key={value} type="button" className={mode === value ? "active" : ""} aria-pressed={mode === value} title={rosaryModeDescriptions[value]} onClick={() => onModeChange(value)}>{rosaryModeNames[value]}</button>)}
      </div>
      <div className="journey-audio-controls rosary-audio-controls">
        <button className="button button-coral" type="button" onClick={onToggleAudio} aria-pressed={audioStatus === "playing"}>
          {audioStatus === "playing" ? <Pause size={16} /> : audioStatus === "paused" ? <Play size={16} /> : <Headphones size={17} />}
          {audioStatus === "playing" ? "Pause Rosary" : audioStatus === "paused" ? "Resume Rosary" : "Listen to the Rosary"}
        </button>
        {audioError && <p className="journey-audio-error" role="status">{audioError}</p>}
        {activeSegment && audioStatus !== "idle" && <p className="journey-audio-status" aria-live="polite">{audioStatus === "paused" ? "Paused" : "Playing"}: {activeSegment.title}</p>}
      </div>
    </header>

    <RosaryArtwork index={mysteryIndex} hero />

    <div className="journey-story-list rosary-story-list">
      <article className={`journey-story breviary-segment rosary-opening${activeSegmentIndex === 0 && audioStatus !== "idle" ? " is-audio-active" : ""}`} id="rosary-opening" aria-labelledby="rosary-opening-title">
        <div className="journey-story-content"><section className="journey-scripture">
          <header className="journey-scripture-heading">
            <h3 id="rosary-opening-title">Opening Prayers</h3>
            <button className={activeSegmentIndex === 0 && audioStatus !== "idle" ? "journey-story-play active" : "journey-story-play"} type="button" onClick={() => onSelectSegment(0)} aria-label="Play opening prayers" aria-current={activeSegmentIndex === 0 && audioStatus !== "idle" ? "true" : undefined}><Play size={14} aria-hidden="true" /></button>
          </header>
          {renderPrayerGroups(sequence.opening)}
        </section></div>
      </article>

      {sequence.decades.map(({ scene, groups }, index) => {
        const heading = `${ordinal(index)} Mystery`;
        const isActive = activeSegmentIndex === index + 1 && audioStatus !== "idle";
        return <article className={`journey-story breviary-segment rosary-decade${isActive ? " is-audio-active" : ""}`} id={`rosary-decade-${index}`} key={scene.title} aria-labelledby={`rosary-heading-${index}`}>
          <div className="journey-story-content"><section className="journey-scripture">
            <header className="journey-scripture-heading">
              <h3 id={`rosary-heading-${index}`}>{heading}<span className="rosary-mystery-name"> · {scene.title}</span></h3>
              <button className={isActive ? "journey-story-play active" : "journey-story-play"} type="button" onClick={() => onSelectSegment(index + 1)} aria-label={`Play ${heading} and the following prayers`} aria-current={isActive ? "true" : undefined}><Play size={14} aria-hidden="true" /></button>
            </header>
            <p className="rosary-scripture-reference">{scene.reference}</p>
            <div className="rosary-prayer-parts">{renderPrayerGroups(groups)}</div>
          </section></div>
        </article>;
      })}

      <article className={`journey-story breviary-segment rosary-closing${activeSegmentIndex === 6 && audioStatus !== "idle" ? " is-audio-active" : ""}`} id="rosary-closing" aria-labelledby="rosary-closing-title">
        <div className="journey-story-content"><section className="journey-scripture">
          <header className="journey-scripture-heading">
            <h3 id="rosary-closing-title">Closing Prayer</h3>
            <button className={activeSegmentIndex === 6 && audioStatus !== "idle" ? "journey-story-play active" : "journey-story-play"} type="button" onClick={() => onSelectSegment(6)} aria-label="Play closing prayers" aria-current={activeSegmentIndex === 6 && audioStatus !== "idle" ? "true" : undefined}><Play size={14} aria-hidden="true" /></button>
          </header>
          {renderPrayerGroups(sequence.closing)}
        </section></div>
      </article>
    </div>

    {nextStep}
    {showRosaryBeads && <FloatingRosaryBeads prayedBeadIndices={prayedBeadIndices} activeBeadIndex={activeBeadIndex} />}
  </main>;
}
