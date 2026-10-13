import type { BreviaryHour } from "../lib/breviary";

const stars: Array<[number, number, number]> = [
  [34, 28, 1.4], [78, 62, 1], [120, 22, 1.2], [168, 48, 1], [214, 18, 1.5], [262, 58, 1],
  [304, 30, 1.3], [352, 54, 1], [376, 16, 1.1], [58, 96, 0.9], [330, 92, 0.9], [150, 86, 0.8],
];

export function BreviaryArtwork({ hour, hero = false }: { hour: BreviaryHour; hero?: boolean }) {
  const id = `breviary-art-${hour}`;
  return (
    <div className={`breviary-artwork breviary-artwork--${hour}${hero ? " breviary-artwork--hero" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            {hour === "lauds" && <><stop offset="0" stopColor="#f6c9a4" /><stop offset=".55" stopColor="#f9dfae" /><stop offset="1" stopColor="#fbefc9" /></>}
            {hour === "vespers" && <><stop offset="0" stopColor="#5a4a73" /><stop offset=".5" stopColor="#c96f5a" /><stop offset="1" stopColor="#f0b25f" /></>}
            {hour === "compline" && <><stop offset="0" stopColor="#10192e" /><stop offset=".6" stopColor="#1f2e4d" /><stop offset="1" stopColor="#38496b" /></>}
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor={hour === "compline" ? "#e9eefc" : "#fff4cf"} stopOpacity=".95" />
            <stop offset="1" stopColor={hour === "compline" ? "#e9eefc" : "#fff4cf"} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="200" fill={`url(#${id}-sky)`} />

        {hour === "lauds" && <>
          <circle cx="200" cy="138" r="86" fill={`url(#${id}-glow)`} />
          <g stroke="#fff4cf" strokeWidth="2" strokeLinecap="round" opacity=".7">
            {Array.from({ length: 9 }, (_, i) => {
              const angle = Math.PI + (Math.PI * (i + 1)) / 10;
              return <line key={i} x1={200 + Math.cos(angle) * 48} y1={138 + Math.sin(angle) * 48} x2={200 + Math.cos(angle) * 74} y2={138 + Math.sin(angle) * 74} />;
            })}
          </g>
          <circle cx="200" cy="138" r="34" fill="#fff0b8" />
          <path d="M70 52q8-8 16 0q8-8 16 0" fill="none" stroke="#7c6a58" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M300 38q6-6 12 0q6-6 12 0" fill="none" stroke="#7c6a58" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M0 150q70-34 140-10t140-6t120 20V200H0z" fill="#9db18b" />
          <path d="M0 172q90-26 180-6t220-12V200H0z" fill="#6d8a73" />
        </>}

        {hour === "vespers" && <>
          <circle cx="200" cy="146" r="96" fill={`url(#${id}-glow)`} />
          <circle cx="200" cy="146" r="40" fill="#ffd68a" />
          <rect x="60" y="92" width="110" height="5" rx="2.5" fill="#fff" opacity=".22" />
          <rect x="250" y="74" width="96" height="5" rx="2.5" fill="#fff" opacity=".2" />
          <rect x="226" y="108" width="140" height="4" rx="2" fill="#fff" opacity=".16" />
          <path d="M0 148q60-18 120 0t110-6t170 8V200H0z" fill="#6a4a5a" />
          <path d="M0 170q100-24 200-4t200-10V200H0z" fill="#3d3248" />
          <path d="M310 170v-26l10-9l10 9v26z" fill="#2c2438" />
          <path d="M318 135v-10h4v10" fill="none" stroke="#2c2438" strokeWidth="2" />
        </>}

        {hour === "compline" && <>
          {stars.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#f5f1de" opacity={0.55 + (i % 4) * 0.12} />)}
          <circle cx="278" cy="58" r="64" fill={`url(#${id}-glow)`} opacity=".5" />
          <circle cx="278" cy="58" r="26" fill="#f4efd6" />
          <circle cx="290" cy="52" r="24" fill="#1d2b49" />
          <path d="M0 152q80-26 160-8t150-10t90 12V200H0z" fill="#1a2640" />
          <path d="M0 176q110-24 210-4t190-8V200H0z" fill="#0f1830" />
          <path d="M92 176v-30l14-13l14 13v30z" fill="#0b1226" />
          <rect x="102" y="156" width="8" height="10" rx="1.5" fill="#ffcf74" />
          <circle cx="106" cy="161" r="14" fill="#ffcf74" opacity=".18" />
        </>}
      </svg>
    </div>
  );
}
