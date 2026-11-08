export type SummaArtworkVariant =
  | "prima-pars"
  | "prima-secundae"
  | "secunda-secundae"
  | "tertia-pars"
  | "supplementum";

type Palette = {
  sky: [string, string, string];
  glow: string;
  robe: string;
  face: string;
  hood: string;
};

const palettes: Record<SummaArtworkVariant, Palette> = {
  "prima-pars": { sky: ["#182d39", "#47616a", "#c49b6a"], glow: "#f7d99f", robe: "#27353b", face: "#c89d76", hood: "#e1c28a" },
  "prima-secundae": { sky: ["#302631", "#76544e", "#c99568"], glow: "#f6d29a", robe: "#3d3034", face: "#c68e6d", hood: "#e5bf83" },
  "secunda-secundae": { sky: ["#1b3332", "#4e6b60", "#c3a06b"], glow: "#f5dfa8", robe: "#273a35", face: "#c79c76", hood: "#dfc58e" },
  "tertia-pars": { sky: ["#1c2a3d", "#596875", "#c18e68"], glow: "#f4d9a2", robe: "#2c3440", face: "#c58d6e", hood: "#dfc18b" },
  supplementum: { sky: ["#30293a", "#756276", "#c8a077"], glow: "#f4dba7", robe: "#39333e", face: "#c69b78", hood: "#dfc58e" },
};

export function SummaArtwork({ variant, hero = false }: { variant: SummaArtworkVariant; hero?: boolean }) {
  const colors = palettes[variant];
  const id = `summa-art-${variant}`;

  return (
    <div className={`summa-artwork summa-artwork--${variant}${hero ? " summa-artwork--hero" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor={colors.sky[0]} />
            <stop offset=".62" stopColor={colors.sky[1]} />
            <stop offset="1" stopColor={colors.sky[2]} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx=".72" cy=".45" r=".55">
            <stop stopColor={colors.glow} stopOpacity=".35" />
            <stop offset="1" stopColor={colors.glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-robe`} x1="0" y1="0" x2="1" y2=".4">
            <stop stopColor={colors.robe} />
            <stop offset=".56" stopColor={colors.robe} />
            <stop offset="1" stopColor="#17252c" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill={`url(#${id}-sky)`} />
        <rect width="400" height="200" fill={`url(#${id}-glow)`} />
        <path d="M0 168q105-21 207-4t193-5v41H0z" fill="#19272b" opacity=".8" />

        <path d="M99 200q15-39 49-54l39-17h65l39 17q34 15 50 54z" fill={`url(#${id}-robe)`} />
        <path d="M161 92q-1-45 25-70 18-17 43-16 29 1 46 23 14 18 13 43l-1 27q-2 20-17 33l-20-4-25-10-25 12q-23-10-34-26-5-6-5-12z" fill={colors.robe} />
        <path d="M204 30q17-13 35-5 17 7 20 23 2 12 4 22l13 11-11 6 5 7-10 5q-2 12-13 17l-15 2q-15-7-25-20-6-18-8-38-2-19 5-30z" fill={colors.face} />
        <path d="M258 53q6 8 5 19l13 11-11 6 5 7-10 5q-2 12-13 17l-12 2q11 13 27 16 22-4 32-19 7-11 5-35-2-38-27-56-20-15-46-9-28 6-42 31 17-11 34-7 19 4 36 12z" fill={colors.robe} />
        <path d="M184 55q6-28 30-37 23-9 45 4" fill="none" stroke={colors.hood} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
        <path d="M249 67q5-2 9 0m3 13-6 2m0 9-6 1" fill="none" stroke="#674b3e" strokeOpacity=".72" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M179 145q29 8 51 0m18-3q17-4 30 1" fill="none" stroke={colors.hood} strokeOpacity=".42" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
