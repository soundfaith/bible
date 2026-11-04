import { useEffect, useState } from "react";
import { isNativeApp } from "../lib/platform";

const SEEN_KEY = "soundfaith-apk-seen";
type ApkManifest = { version: string };

export function AndroidDownload() {
  const [latest, setLatest] = useState<string | null>(null);
  const [seen, setSeen] = useState(() => window.localStorage.getItem(SEEN_KEY));

  useEffect(() => {
    if (isNativeApp()) return;
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}downloads/soundfaith-apk.json`, { cache: "no-cache" })
      .then((response) => (response.ok ? response.json() as Promise<ApkManifest> : null))
      .then((manifest) => { if (!cancelled && manifest?.version) setLatest(manifest.version); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  if (isNativeApp()) return null;

  // Only people who downloaded an earlier build are told to update.
  const hasUpdate = Boolean(latest && seen && seen !== latest);
  const markDownloaded = () => {
    if (!latest) return;
    window.localStorage.setItem(SEEN_KEY, latest);
    setSeen(latest);
  };

  return (
    <a
      className="android-download-badge"
      href={`${import.meta.env.BASE_URL}downloads/soundfaith.apk`}
      download
      onClick={markDownloaded}
      aria-label={hasUpdate ? "Download the updated SoundFaith app for Android" : "Download SoundFaith for Android"}
    >
      {hasUpdate && <span className="android-update-pill">Update</span>}
      <svg className="android-download-badge-icon" viewBox="0 0 48 48" aria-hidden="true">
        <g fill="currentColor">
          <path d="M12 20a12 12 0 0 1 24 0H12Z" />
          <path d="M12 22h24v13a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V22Z" />
          <path d="M5 22a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V22Zm32 0a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0V22ZM15 37h6v6a3 3 0 0 1-6 0v-6Zm12 0h6v6a3 3 0 0 1-6 0v-6Z" />
        </g>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5">
          <path d="m16 8-3-4m19 4 3-4" />
        </g>
        <g fill="#173b2b">
          <circle cx="19" cy="14" r="1.2" />
          <circle cx="29" cy="14" r="1.2" />
        </g>
      </svg>
      <span className="android-download-badge-copy">
        <small>{hasUpdate ? "NEW VERSION AVAILABLE" : "DOWNLOAD THE APP"}</small>
        <strong>{hasUpdate ? "Update for Android" : "For Android"}</strong>
      </span>
      <span className="android-download-badge-format">APK</span>
    </a>
  );
}
