import { useId } from "react";
import type { Saint } from "../data/saints";

export function SaintArtwork({ saint, hero = false }: { saint?: Saint; hero?: boolean }) {
  const id = useId().replace(/:/g, "");
  const label = saint?.name ?? "Saints of the Church";
  return <svg className="saint-artwork" viewBox="0 0 600 290" role="img" aria-label={`${label}, devotional illustration`}>
    <defs>
      <linearGradient id={`${id}-saint-sky`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#25374a" />
        <stop offset="1" stopColor="#526b60" />
      </linearGradient>
      <linearGradient id={`${id}-saint-robe`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9c6a0" />
        <stop offset="1" stopColor="#a99370" />
      </linearGradient>
      <radialGradient id={`${id}-saint-light`}>
        <stop offset="0" stopColor="#f8e9bd" stopOpacity=".75" />
        <stop offset="1" stopColor="#f8e9bd" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="600" height="290" fill={`url(#${id}-saint-sky)`} />
    <circle cx="300" cy="119" r="174" fill={`url(#${id}-saint-light)`} />
    <path d="M0 226q116-28 232-8t196 0 172 2v70H0z" fill="#293c35" />
    <path d="M0 246q130-26 260-8t180 0 160 4v48H0z" fill="#1e302c" opacity=".72" />
    <path d="M110 250V96q0-42 42-42t42 42v154z" fill="#304253" opacity=".66" />
    <path d="M137 250V110q0-29 15-29t15 29v140z" fill="#d7c7a6" opacity=".72" />
    <path d="M425 250V110q0-30 23-30t23 30v140z" fill="#304253" opacity=".7" />
    <path d="M450 251V126q0-21 12-21t12 21v125z" fill="#d2bd94" opacity=".6" />
    <circle cx="300" cy="84" r="55" fill="none" stroke="#e4bd69" strokeWidth="6" />
    <circle cx="300" cy="84" r="44" fill="#d9c3a0" />
    <path d="M249 253q6-111 51-124 45 13 51 124z" fill={`url(#${id}-saint-robe)`} />
    <path d="M298 132h4l12 120h-28z" fill="#f0dfbd" opacity=".56" />
    <path d="M265 169q-28 16-37 46l35 11 26-30zm70 0q28 16 37 46l-35 11-26-30z" fill="#c7b18c" />
    <path d="M256 213q16-13 35-10v25q-20-7-35 3z" fill="#f5ecd7" stroke="#9c8460" strokeWidth="2" />
    <path d="M291 203q18-10 35 0v28q-18-7-35 0z" fill="#fff7e7" stroke="#9c8460" strokeWidth="2" />
    <path d="M291 205v27" stroke="#b59b70" strokeWidth="2" />
    <path d="M289 119q11 7 22 0" fill="none" stroke="#8a6f50" strokeWidth="2" strokeLinecap="round" />
    {hero && <g fill="#f2dca7" opacity=".88"><circle cx="91" cy="56" r="2" /><circle cx="504" cy="64" r="2" /><circle cx="476" cy="126" r="1.5" /><circle cx="89" cy="146" r="1.5" /></g>}
  </svg>;
}
