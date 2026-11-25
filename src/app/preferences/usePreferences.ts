import { useEffect, useRef, useState } from "react";
import { syncSystemBars } from "@/platform/device/platform";
import { getNarrationGender, saveNarrationGender, type NarrationGender } from "@/platform/audio/narrationVoice";
import { changeNarrationVoice } from "@/platform/audio/NarratorButton";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.localStorage.getItem("template-theme") === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("template-theme", theme);
    syncSystemBars(theme);
  }, [theme]);
  return { theme, setTheme };
}

export function useReaderFontSize() {
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(window.localStorage.getItem("reader-font-size"));
    return Number.isFinite(saved) && saved >= 16 && saved <= 30 ? saved : 22;
  });
  useEffect(() => {
    document.documentElement.style.setProperty("--reader-font-size", `${fontSize}px`);
    window.localStorage.setItem("reader-font-size", String(fontSize));
  }, [fontSize]);
  return { fontSize, setFontSize };
}

export function useVoicePreference() {
  const [voicePreference, setVoicePreference] = useState<NarrationGender>(getNarrationGender);
  const [voicePreferenceError, setVoicePreferenceError] = useState(false);
  const voicePreferenceRef = useRef(voicePreference);
  voicePreferenceRef.current = voicePreference;
  const changeVoicePreference = (gender: NarrationGender) => {
    voicePreferenceRef.current = gender;
    setVoicePreference(gender);
    changeNarrationVoice(gender);
    try {
      saveNarrationGender(gender);
      setVoicePreferenceError(false);
    } catch {
      setVoicePreferenceError(true);
    }
  };
  return { voicePreference, voicePreferenceError, voicePreferenceRef, changeVoicePreference };
}
