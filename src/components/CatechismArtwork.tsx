type CatechismArtworkProps = { edition: number; hero?: boolean };

type Palette = {
  sky: [string, string, string];
  glow: string;
  column: [string, string, string];
  stone: string;
};

const palettes: Record<number, Palette> = {
  1: { sky: ["#203b43", "#59756d", "#c5a475"], glow: "#f7d99f", column: ["#f3dfb8", "#cfb17d", "#94774f"], stone: "#34433e" },
  2: { sky: ["#342f3d", "#86675e", "#d0a276"], glow: "#f7d39a", column: ["#f2dfbd", "#d1b188", "#947356"], stone: "#493b3a" },
  3: { sky: ["#213142", "#637784", "#c6a579"], glow: "#f5d9a1", column: ["#f0e2c7", "#c7b38f", "#7c7a72"], stone: "#343d45" },
};

export function CatechismArtwork({ edition, hero = false }: CatechismArtworkProps) {
  const colors = palettes[edition] ?? palettes[2];
  const id = `catechism-edition-${edition}`;

  return <div className={`catechism-artwork catechism-artwork--${edition}${hero ? " catechism-artwork--hero" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor={colors.sky[0]} />
          <stop offset=".62" stopColor={colors.sky[1]} />
          <stop offset="1" stopColor={colors.sky[2]} />
        </linearGradient>
        <linearGradient id={`${id}-column`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={colors.column[2]} />
          <stop offset=".24" stopColor={colors.column[0]} />
          <stop offset=".68" stopColor={colors.column[1]} />
          <stop offset="1" stopColor={colors.column[2]} />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx=".5" cy=".55" r=".58">
          <stop stopColor={colors.glow} stopOpacity=".4" />
          <stop offset="1" stopColor={colors.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${id}-sky)`} />
      <ellipse cx="200" cy="111" rx="150" ry="104" fill={`url(#${id}-light)`} />
      <path d="M0 164q102-18 205-4t195-5v45H0z" fill={colors.stone} />
      <path d="M0 181q112-12 211 0t189-6v25H0z" fill="#172326" opacity=".34" />

      <path d="M125 165h150l-9 13H134z" fill={colors.column[2]} />
      <path d="M136 154h128v11H136z" fill={`url(#${id}-column)`} />
      <path d="M151 45h98l16 109H135z" fill={`url(#${id}-column)`} />
      <path d="M167 52 157 151m76-99 10 99" stroke="#fff4d8" strokeOpacity=".36" strokeWidth="2" />
      <path d="M183 53v96m34-96v96" stroke={colors.column[2]} strokeOpacity=".35" strokeWidth="2" />
      <path d="M126 39h148v13H126z" fill={colors.column[1]} />
      <path d="M119 28q0-5 5-5h152q5 0 5 5v10H119z" fill={`url(#${id}-column)`} />
      <path d="M127 20h146v5H127z" fill="#fff1d2" opacity=".54" />
      <path d="M133 176h134v5H133z" fill="#fff1d2" opacity=".34" />
    </svg>
  </div>;
}
