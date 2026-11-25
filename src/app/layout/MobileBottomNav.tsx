import type { ComponentProps } from "react";
import { CalendarDays, Compass, Home, Library } from "lucide-react";
import { NavPlayer } from "@/platform/audio/AudioPlayer";
import type { Route } from "../routing";

type NavPlayerProps = ComponentProps<typeof NavPlayer>;

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
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
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
