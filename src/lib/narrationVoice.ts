export type NarrationGender = "male" | "female";

const NARRATION_GENDER_KEY = "soundfaith-narration-gender-v1";

export function getNarrationGender(): NarrationGender {
  try {
    const value = window.localStorage.getItem(NARRATION_GENDER_KEY);
    return value === "female" ? "female" : "male";
  } catch {
    return "male";
  }
}

export function saveNarrationGender(gender: NarrationGender) {
  window.localStorage.setItem(NARRATION_GENDER_KEY, gender);
}
