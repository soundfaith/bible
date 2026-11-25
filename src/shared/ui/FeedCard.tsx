import { Play } from "lucide-react";
import { CardArt, type CardArtKey, useCardPlaying } from "./LandingSmallCard";

export function FeedCard({ art, title, meta, progress, disabled, playBadge, onClick }: { art: CardArtKey; title: string; meta: string; progress?: number; disabled?: boolean; playBadge?: boolean; onClick: () => void }) {
  const playing = useCardPlaying(art, true);
  const showBadge = playBadge && !playing;
  return <button className={showBadge ? "feed-card has-play-badge" : "feed-card"} type="button" disabled={disabled} onClick={onClick}>
    <CardArt art={art} showPlaying />
    {showBadge && <span className="feed-card-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>}
    <strong>{title}</strong>
    <small>{meta}</small>
    {progress !== undefined && <progress value={Math.round(progress * 100)} max={100} aria-label={`${Math.round(progress * 100)}% complete`} />}
  </button>;
}
