import { ArrowRight, Check, Flame } from "lucide-react";
import { LandingBibleArtwork, LandingBreviaryArtwork, LandingChurchArtwork } from "./LandingArtwork";
import { RosaryArtwork } from "./RosaryArtwork";

export type CardArtKey = "bible" | "journey" | "prayer" | "readings" | "rosary";

function JourneyArtwork() {
  return (
    <svg className="landing-card-artwork" viewBox="0 0 400 200">
      <ellipse className="landing-journey-sun" cx="200" cy="100" rx="60" ry="22" />
      <path className="landing-journey-mountains-distant" d="M0 138l48-18 68-30 64 24 20-6 20 6 64-24 68 30 48 18v62H0z" />
      <path className="landing-journey-mountains-mid-left" d="M0 156q88-30 178-14v58H0z" />
      <path className="landing-journey-mountains-mid-right" d="M400 150q-92-32-184-10v60h184z" />
      <path className="landing-journey-ground" d="M0 176q100-14 200-2t200 4v22H0z" />
      <path className="landing-journey-path" d="M197 108C206 118 223 125 223 136C223 148 174 152 174 165C174 178 164 188 164 200H236C236 188 200 178 200 165C200 152 239 148 239 136C239 125 203 118 203 108Z" />
      <path className="landing-journey-path-line" d="M200 110C209 119 231 126 231 136C231 148 187 152 187 165C187 178 200 188 200 200" />
      <ellipse className="landing-journey-cairn" cx="140" cy="182" rx="10" ry="4.5" />
      <ellipse className="landing-journey-cairn" cx="141" cy="175" rx="7.5" ry="3.5" />
      <ellipse className="landing-journey-cairn" cx="142" cy="169" rx="5" ry="2.5" />
      <circle className="landing-journey-star-glow" cx="200" cy="42" r="16" />
      <path className="landing-journey-star" d="M200 22q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
      <circle className="landing-journey-star-center" cx="200" cy="42" r="2.5" />
      <path className="landing-journey-star-rays" d="M200 14v6m0 44v6m-28-28h6m44 0h6" />
    </svg>
  );
}

export function CardArt({ art }: { art: CardArtKey }) {
  return <div className={`landing-card-art landing-card-art--${art}`} aria-hidden="true">
    {art === "bible" ? <LandingBibleArtwork /> : art === "journey" ? <JourneyArtwork /> : art === "prayer" ? <LandingBreviaryArtwork /> : art === "rosary" ? <RosaryArtwork home /> : <LandingChurchArtwork />}
  </div>;
}

export type SmallCardProps = {
  art: CardArtKey;
  title: string;
  stat?: string;
  description?: string;
  action: string;
  done?: boolean;
  onClick: () => void;
};

export function SmallCard({ art, title, stat, description, action, done, onClick }: SmallCardProps) {
  return <button className={`landing-card landing-card--small${done ? " is-done" : ""}`} type="button" aria-label={`${title}: ${action}`} onClick={onClick}>
    <CardArt art={art} />
    <div className="landing-card-copy">
      <h3>{title}</h3>
      {stat && <p className="landing-card-stat"><Flame size={12} aria-hidden="true" /> {stat}</p>}
      {description && <p>{description}</p>}
      <span className="text-link">{done && <Check size={13} aria-hidden="true" />}{action} {!done && <ArrowRight size={14} />}</span>
    </div>
  </button>;
}
