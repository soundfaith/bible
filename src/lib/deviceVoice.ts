import type { NarrationGender } from "./narrationVoice";

const MALE_NAMES = /\b(male|man|david|mark|alex|daniel|aaron|guy|ryan|brian|matthew|justin|joey|christopher|eric|roger|steffan|davis|jason|tony|andrew|thomas|oliver|arthur|reed|rishi|gordon|james|george|ravi|liam)\b/i;
const FEMALE_NAMES = /\b(female|woman|zira|samantha|victoria|karen|moira|tessa|susan|hazel|aria|jenny|sara|ava|emma|allison|joanna|kendra|kimberly|salli|ivy|michelle|ana|nicole|serena|shelley|sandy|flo|fiona|catherine|libby|sonia|amy|olivia|stephanie|zoe|kate|martha)\b/i;

// Neural and enhanced voices are far less robotic than the default compact ones.
const QUALITY_HINTS: Array<[RegExp, number]> = [
  [/natural/i, 100],
  [/neural/i, 90],
  [/premium/i, 80],
  [/enhanced/i, 70],
  [/google/i, 50],
  [/siri/i, 45],
  [/online/i, 40],
  [/samantha|daniel|karen|moira|tessa|serena|alex/i, 20],
];
const ROBOTIC_HINTS = /espeak|compact|fred|junior|ralph|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|whisper|zarvox|organ|princess/i;

const preferredLanguages = ["en-us", "en-gb", "en-au", "en-ca", "en-ie", "en-in"];

function voiceScore(voice: SpeechSynthesisVoice, gender: NarrationGender) {
  const name = voice.name;
  if (!voice.lang.toLowerCase().startsWith("en") || ROBOTIC_HINTS.test(name)) return -1;
  const wantsMale = gender === "male";
  const isMale = MALE_NAMES.test(name);
  const isFemale = FEMALE_NAMES.test(name);
  let score = QUALITY_HINTS.reduce((total, [pattern, points]) => total + (pattern.test(name) ? points : 0), 0);
  if (wantsMale ? isMale : isFemale) score += 60;
  if (wantsMale ? isFemale : isMale) score -= 200;
  if (!voice.localService) score += 10;
  const languageIndex = preferredLanguages.indexOf(voice.lang.replace("_", "-").toLowerCase());
  score += languageIndex === -1 ? 0 : preferredLanguages.length - languageIndex;
  return score;
}

export function pickDeviceVoice(gender: NarrationGender): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;
  for (const voice of window.speechSynthesis.getVoices()) {
    const score = voiceScore(voice, gender);
    if (score > bestScore) { best = voice; bestScore = score; }
  }
  return best;
}

// Browsers such as Chrome load voices asynchronously; asking early makes them available by the first play.
if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();
