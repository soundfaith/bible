type CatechismArtworkProps = { edition: number; hero?: boolean };

const palettes: Record<number, { sky: string; ground: string; cover: string; coverLight: string; gold: string; ink: string }> = {
  1: { sky: "#e7dfcf", ground: "#b5a78c", cover: "#547565", coverLight: "#78917d", gold: "#efd8a8", ink: "#314b40" },
  2: { sky: "#d7d5cc", ground: "#999286", cover: "#8c5545", coverLight: "#aa715b", gold: "#f0d19c", ink: "#58392f" },
  3: { sky: "#d8d4c5", ground: "#8a887b", cover: "#34485c", coverLight: "#536a7a", gold: "#e7c47d", ink: "#233849" },
};

export function CatechismArtwork({ edition, hero = false }: CatechismArtworkProps) {
  const colors = palettes[edition] ?? palettes[2];
  const id = `catechism-edition-${edition}`;

  return <div className={`catechism-artwork catechism-artwork--${edition}${hero ? " catechism-artwork--hero" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={`${id}-backdrop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.sky} />
          <stop offset="1" stopColor={colors.ground} />
        </linearGradient>
        <linearGradient id={`${id}-cover`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.coverLight} />
          <stop offset="1" stopColor={colors.cover} />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx=".5" cy=".45" r=".6">
          <stop offset="0" stopColor="#fff4d7" stopOpacity=".74" />
          <stop offset="1" stopColor="#fff4d7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${id}-backdrop)`} />
      <circle cx="205" cy="92" r="125" fill={`url(#${id}-light)`} />
      <path d="M0 164q95-20 194-6t206-2v44H0z" fill={colors.ink} opacity=".23" />
      <path d="M117 156l18-9 153 17-18 12z" fill="#372f2a" opacity=".2" />

      <g transform="rotate(-5 202 102)">
        <path d="M132 43l133 9q8 1 8 9v99l-134-13q-8-1-8-9z" fill="#f5ecd9" />
        <path d="M272 61l17-8v98l-17 9z" fill="#d5c7ae" />
        <path d="M140 38q-7 0-7 8v91q0 8 8 9l131 12V64q0-8-8-9z" fill={`url(#${id}-cover)`} stroke={colors.ink} strokeOpacity=".26" strokeWidth="2" />
        <path d="M151 49l111 10v76l-111-10z" fill="none" stroke={colors.gold} strokeOpacity=".82" strokeWidth="1.5" />
        <path d="M145 42l10 1v103l-10-1z" fill={colors.ink} opacity=".28" />
        <path d="M161 69l85 8m-83 8 83 8m-81 8 81 8" fill="none" stroke={colors.gold} strokeOpacity=".48" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="207" cy="103" r="17" fill={colors.ink} fillOpacity=".34" stroke={colors.gold} strokeOpacity=".9" strokeWidth="1.5" />
        <text x="207" y="108" textAnchor="middle" fill={colors.gold} fontFamily="Georgia,serif" fontSize="14">{edition}</text>
        {edition === 1 && <path d="M194 73q13-13 26 0m-26 60q13-13 26 0" fill="none" stroke={colors.gold} strokeWidth="1.3" opacity=".8" />}
        {edition === 2 && <path d="M207 70v16m-7-8h14m-7 31v17m-7-8h14" fill="none" stroke={colors.gold} strokeWidth="1.6" strokeLinecap="round" opacity=".9" />}
        {edition === 3 && <><path d="M207 70v14m-6-7h12m-6 34v15m-6-7.5h12" fill="none" stroke={colors.gold} strokeWidth="1.5" strokeLinecap="round" /><circle cx="207" cy="103" r="23" fill="none" stroke={colors.gold} strokeOpacity=".5" /></>}
      </g>
      <path d="M126 157l146 14" stroke="#fff5df" strokeOpacity=".58" strokeWidth="2" />
      <circle cx="313" cy="50" r="2" fill={colors.gold} opacity=".75" />
      <circle cx="91" cy="76" r="1.6" fill="#fff6e5" opacity=".7" />
      <circle cx="332" cy="116" r="1.4" fill="#fff6e5" opacity=".68" />
    </svg>
  </div>;
}
