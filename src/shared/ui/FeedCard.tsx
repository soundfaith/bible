import { Play } from "lucide-react";
import { CardArt, type CardArtKey, useCardPlaying } from "./LandingSmallCard";

export function FeedCard({ art, title, meta, progress, artProgress, disabled, comingSoon, playBadge, onClick }: { art: CardArtKey; title: string; meta: string; progress?: number; artProgress?: number; disabled?: boolean; comingSoon?: boolean; playBadge?: boolean; onClick: () => void }) {
  const playing = useCardPlaying(art, true);
  const showBadge = playBadge && !playing;
  return <button className={showBadge ? "feed-card has-play-badge" : "feed-card"} type="button" disabled={disabled || comingSoon} onClick={onClick}>
    <CardArt art={art} showPlaying className={comingSoon ? "is-blurred" : undefined} />
    {showBadge && <span className="feed-card-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>}
    {artProgress !== undefined && <span className="feed-card-art-progress" role="progressbar" aria-label="Listening progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(artProgress * 100)}><i style={{ width: `${Math.round(artProgress * 100)}%` }} /></span>}
    <strong>{title}</strong>
    <small>{meta}</small>
    {progress !== undefined && <progress value={Math.round(progress * 100)} max={100} aria-label={`${Math.round(progress * 100)}% complete`} />}
  </button>;
}
