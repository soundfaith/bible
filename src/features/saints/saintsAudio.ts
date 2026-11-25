export const SAINT_NARRATION_TOGGLE_EVENT = "soundfaith:saint-narration-toggle";

export function requestSaintNarrationToggle() {
  window.dispatchEvent(new Event(SAINT_NARRATION_TOGGLE_EVENT));
}
