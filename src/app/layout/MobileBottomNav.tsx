import { useEffect, useState, type ComponentProps } from "react";
import { CalendarDays, Compass, Home, Library } from "lucide-react";
import { NavPlayer } from "@/platform/audio/AudioPlayer";
import type { Route } from "../routing";

type NavPlayerProps = ComponentProps<typeof NavPlayer>;

const RETURN_HINT_MS = 6000;
const RETURN_HINT_FADE_MS = 250;

type MobileBottomNavProps = {
  route: Route;
  narration: NavPlayerProps["narration"];
  playerOpen: boolean;
  onToggle: NavPlayerProps["onToggle"];
  setPlayerOpen: (open: boolean) => void;
  onOpenActiveJourney: () => void;
  onOpenDailyRoutine: () => void;
};

export function MobileBottomNav({ route, narration, playerOpen, onToggle, setPlayerOpen, onOpenActiveJourney, onOpenDailyRoutine }: MobileBottomNavProps) {
  const audioActive = narration.status !== "idle" && !!narration.track;
  const trackPath = narration.track?.path;
  const [hint, setHint] = useState<"hidden" | "shown" | "leaving">("hidden");
  useEffect(() => {
    if (playerOpen || !audioActive) {
      setHint((current) => (current === "hidden" ? current : "leaving"));
      return;
    }
    setHint("shown");
    const timer = window.setTimeout(() => setHint("leaving"), RETURN_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [playerOpen, audioActive, route, trackPath]);
  useEffect(() => {
    if (hint !== "leaving") return;
    const timer = window.setTimeout(() => setHint("hidden"), RETURN_HINT_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [hint]);
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {hint !== "hidden" && <button type="button" className={hint === "leaving" ? "mobile-return-to-player is-leaving" : "mobile-return-to-player"} onClick={() => setPlayerOpen(true)}>Double tap to return to player</button>}
      <a href="#/" className={route === "home" ? "active" : ""} aria-current={route === "home" ? "page" : undefined} onClick={() => setPlayerOpen(false)}>
        <Home size={17} />
        <span>Home</span>
      </a>
      <a
        href="#/listen"
        className={route === "listen" ? "active" : ""}
        aria-current={route === "listen" ? "page" : undefined}
        onClick={() => setPlayerOpen(false)}
      >
        <Library size={17} />
        <span>Browse</span>
      </a>
      <NavPlayer
        narration={narration}
        playerOpen={playerOpen}
        onToggle={onToggle}
        onOpen={() => setPlayerOpen(true)}
        onListen={() => {
          setPlayerOpen(false);
          window.location.hash = "#/listen";
        }}
      />
      <a href="#/journeys" onClick={(event) => { event.preventDefault(); setPlayerOpen(false); onOpenActiveJourney(); }} className={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "mobile-listen active" : "mobile-listen"} aria-current={route === "journeys" || route === "journey" || route === "guided-journey" || route === "journey-artwork" ? "page" : undefined}>
        <Compass size={17} />
        <span>Journeys</span>
      </a>
      <a href="#/daily" onClick={(event) => { event.preventDefault(); setPlayerOpen(false); onOpenDailyRoutine(); }} className={route === "daily" || route === "breviary" || route === "mass" || route === "rosary" || route === "rosary-prayer" || route === "saints" || route === "saint-profile" ? "active" : ""} aria-current={route === "daily" ? "page" : undefined}>
        <CalendarDays size={17} />
        <span>Daily</span>
      </a>
    </nav>
  );
}
