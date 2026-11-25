import type { NarrationTrack } from "@/platform/audio/NarratorButton";

export type BibleArt = Extract<NarrationTrack["art"], "bible" | "old-testament" | "new-testament" | "gospels">;

export const isBibleArt = (art: NarrationTrack["art"]): art is BibleArt =>
  art === "bible" || art === "old-testament" || art === "new-testament" || art === "gospels";
