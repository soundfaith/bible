import rosaryData from "./rosary.json";

export type RosaryMystery = {
  title: string;
  weekday: string;
  scenes: { title: string; reference: string; gospel: string }[];
};

export const rosaryMysteries = rosaryData.mysteries as RosaryMystery[];

export type RosaryMode = "traditional" | "gospel";

export type RosaryPrayers = {
  signOfCross: string;
  apostlesCreed: string;
  ourFather: string;
  hailMary: string;
  gloryBe: string;
  fatima: string;
  hailHolyQueen: string;
  memorare: string;
};

export const rosaryPrayers = rosaryData.prayers as RosaryPrayers;

export type RosaryPrayerGroup = {
  id: string;
  title: string;
  text: string;
  repeat: number;
};

export type RosaryAudioSegment = {
  id: string;
  title: string;
  firstClipIndex: number;
  endClipIndex: number;
};

export type RosaryAudioClip = {
  id: string;
  segmentIndex: number;
  groupId: string | null;
  beadIndex: number | null;
  title: string;
  spokenText: string;
  audioAsset: string;
};

export type RosarySequence = {
  opening: RosaryPrayerGroup[];
  decades: { scene: RosaryMystery["scenes"][number]; groups: RosaryPrayerGroup[] }[];
  closing: RosaryPrayerGroup[];
  segments: RosaryAudioSegment[];
  clips: RosaryAudioClip[];
};

const ordinalNames = ["First", "Second", "Third", "Fourth", "Fifth"];

export function buildRosarySequence(mode: RosaryMode, mysteryIndex: number): RosarySequence {
  const mysterySet = rosaryMysteries[mysteryIndex] ?? rosaryMysteries[0];
  const segments: RosaryAudioSegment[] = [];
  const clips: RosaryAudioClip[] = [];

  function addSegment(id: string, title: string, buildGroups: (segmentIndex: number) => RosaryPrayerGroup[]) {
    const segmentIndex = segments.length;
    const firstClipIndex = clips.length;
    const groups = buildGroups(segmentIndex);
    segments.push({ id, title, firstClipIndex, endClipIndex: clips.length });
    return groups;
  }

  function addPrayer(
    segmentIndex: number,
    id: string,
    title: string,
    text: string,
    audioAsset: string,
    repeat = 1,
    spokenText = text,
    beadStartIndex: number | null = null,
    beadStep = 1,
  ): RosaryPrayerGroup {
    for (let occurrence = 0; occurrence < repeat; occurrence += 1) {
      clips.push({
        id: repeat === 1 ? id : `${id}-${occurrence + 1}`,
        segmentIndex,
        groupId: id,
        beadIndex: beadStartIndex === null ? null : beadStartIndex + occurrence * beadStep,
        title,
        spokenText,
        audioAsset,
      });
    }
    return { id, title, text, repeat };
  }

  const opening = addSegment("opening", "Opening", (segmentIndex) => [
    addPrayer(segmentIndex, "opening-sign-of-cross", "Sign of the Cross", rosaryPrayers.signOfCross, "sign-of-cross"),
    addPrayer(segmentIndex, "opening-apostles-creed", "Apostles' Creed", rosaryPrayers.apostlesCreed, "apostles-creed"),
    addPrayer(segmentIndex, "opening-our-father", "Our Father", rosaryPrayers.ourFather, "our-father", 1, rosaryPrayers.ourFather, 59),
    addPrayer(segmentIndex, "opening-hail-mary", "Hail Mary", rosaryPrayers.hailMary, "hail-mary", 3, rosaryPrayers.hailMary, 58, -1),
    addPrayer(segmentIndex, "opening-glory-be", "Glory Be", rosaryPrayers.gloryBe, "glory-be", 1, rosaryPrayers.gloryBe, 55),
  ]);

  const decades = mysterySet.scenes.map((scene, decadeIndex) => {
    const name = ordinalNames[decadeIndex] ?? `Mystery ${decadeIndex + 1}`;
    const segmentTitle = `${name} ${mysterySet.title.replace(/ Mysteries$/, " Mystery")} — ${scene.title}`;
    const groups = addSegment(`mystery-${decadeIndex + 1}`, segmentTitle, (segmentIndex) => {
      const mysteryNumber = String(mysteryIndex + 1).padStart(2, "0");
      const decadeNumber = String(decadeIndex + 1).padStart(2, "0");
      const sceneName = scene.title.replace(/^The /, "").toLowerCase();
      const introText = `The ${name.toLowerCase()} ${mysterySet.title.replace(/ Mysteries$/, " mystery").toLowerCase()} is the ${sceneName}.`;
      clips.push({
        id: `decade-${decadeIndex}-mystery-intro`,
        segmentIndex,
        groupId: null,
        beadIndex: null,
        title: "Mystery Announcement",
        spokenText: introText,
        audioAsset: `mystery-${mysteryNumber}-${decadeNumber}`,
      });
      const mysteryPrayers: RosaryPrayerGroup[] = [];
      if (mode === "gospel") {
        mysteryPrayers.push(addPrayer(
          segmentIndex,
          `decade-${decadeIndex}-gospel`,
          "Gospel Reading",
          scene.gospel,
          `gospel-${mysteryNumber}-${decadeNumber}`,
          1,
          `${scene.reference}. ${scene.gospel}`,
        ));
      }
      mysteryPrayers.push(
        addPrayer(segmentIndex, `decade-${decadeIndex}-our-father`, "Our Father", rosaryPrayers.ourFather, "our-father", 1, rosaryPrayers.ourFather, decadeIndex * 11),
        addPrayer(segmentIndex, `decade-${decadeIndex}-hail-mary`, "Hail Mary", rosaryPrayers.hailMary, "hail-mary", 10, rosaryPrayers.hailMary, decadeIndex * 11 + 1),
        addPrayer(segmentIndex, `decade-${decadeIndex}-glory-be`, "Glory Be", rosaryPrayers.gloryBe, "glory-be"),
        addPrayer(segmentIndex, `decade-${decadeIndex}-fatima`, "Fatima Prayer", rosaryPrayers.fatima, "fatima-prayer"),
      );
      return mysteryPrayers;
    });
    return { scene, groups };
  });

  const closing = addSegment("closing", "Closing", (segmentIndex) => [
    addPrayer(segmentIndex, "closing-hail-holy-queen", "Hail, Holy Queen", rosaryPrayers.hailHolyQueen, "hail-holy-queen"),
    addPrayer(segmentIndex, "closing-memorare", "Memorare", rosaryPrayers.memorare, "memorare"),
    addPrayer(segmentIndex, "closing-sign-of-cross", "Sign of the Cross", rosaryPrayers.signOfCross, "sign-of-cross"),
  ]);

  return { opening, decades, closing, segments, clips };
}

export const rosaryModeNames: Record<RosaryMode, string> = {
  traditional: "Traditional",
  gospel: "Gospel",
};

export const rosaryModeDescriptions: Record<RosaryMode, string> = {
  traditional: "Pray the complete Rosary with the traditional prayers.",
  gospel: "Pray the complete Rosary with a Gospel reading before every decade.",
};
