import { bibleBooks } from "./bible";
import type { NarrationGender } from "./narrationVoice";

export function narrationAudioUrlsFor(bookId: string, chapter: number, preference: NarrationGender): string[] {
  const book = bibleBooks.find((item) => item.id === bookId);
  const bases = preference === "male"
    ? [book?.narrationAudioBaseUrl, book?.narrationAudioFemaleBaseUrl]
    : [book?.narrationAudioFemaleBaseUrl, book?.narrationAudioBaseUrl];
  return bases
    .filter((baseUrl): baseUrl is string => Boolean(baseUrl))
    .map((baseUrl) => `${baseUrl.replace(/\/$/, "")}/${chapter}.mp3`);
}

export function journeyIntroAudioUrls(periodIndex: number, preference: NarrationGender): string[] {
  const period = String(periodIndex + 1).padStart(2, "0");
  const voices = preference === "male" ? ["am_michael", "af_heart"] : ["af_heart", "am_michael"];
  return voices.map((voice) =>
    `https://github.com/soundfaith/bible/releases/download/journey-narration-${voice}/period-${period}-intro.mp3`,
  );
}

export function journeyStoryAudioUrls(periodIndex: number, storyIndex: number, preference: NarrationGender): string[] {
  const period = String(periodIndex + 1).padStart(2, "0");
  const story = String(storyIndex + 1).padStart(2, "0");
  const voices = preference === "male" ? ["am_michael", "af_heart"] : ["af_heart", "am_michael"];
  return voices.map((voice) =>
    `https://github.com/soundfaith/bible/releases/download/journey-narration-${voice}/period-${period}-story-${story}.mp3`,
  );
}

export function breviaryIntroAudioUrls(hour: string, preference: NarrationGender): string[] {
  const voices = preference === "male" ? ["am_michael", "af_heart"] : ["af_heart", "am_michael"];
  return voices.map((voice) =>
    `https://github.com/soundfaith/bible/releases/download/breviary-narration-${voice}/${hour}-intro.mp3`,
  );
}
