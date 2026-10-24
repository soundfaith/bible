export type SummaArtworkVariant =
  | "prima-pars"
  | "prima-secundae"
  | "secunda-secundae"
  | "tertia-pars"
  | "supplementum";

type Palette = {
  sky: string;
  ground: string;
  ink: string;
  gold: string;
  light: string;
  accent: string;
};

const palettes: Record<SummaArtworkVariant, Palette> = {
  "prima-pars": { sky: "#d8d2bf", ground: "#839084", ink: "#33483f", gold: "#e8c982", light: "#fff1c8", accent: "#a85f43" },
  "prima-secundae": { sky: "#d6c6ad", ground: "#967a68", ink: "#493b39", gold: "#eed19a", light: "#fff0cf", accent: "#7d4c43" },
  "secunda-secundae": { sky: "#c9d0bd", ground: "#63796c", ink: "#304a41", gold: "#e5c783", light: "#f7ebc7", accent: "#9a6b43" },
  "tertia-pars": { sky: "#aeb9c3", ground: "#626c7a", ink: "#303b51", gold: "#e8c77f", light: "#fff0c9", accent: "#a65f50" },
  supplementum: { sky: "#d1c9bb", ground: "#7d8179", ink: "#394750", gold: "#e8c987", light: "#fff0d3", accent: "#86546a" },
};

export function SummaArtwork({ variant, hero = false }: { variant: SummaArtworkVariant; hero?: boolean }) {
  const colors = palettes[variant];
  const id = `summa-art-${variant}`;

  return (
    <div className={`summa-artwork summa-artwork--${variant}${hero ? " summa-artwork--hero" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={`${id}-backdrop`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.sky} />
            <stop offset="1" stopColor={colors.ground} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="42%" r="58%">
            <stop offset="0" stopColor={colors.light} stopOpacity=".86" />
            <stop offset="1" stopColor={colors.light} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="200" fill={`url(#${id}-backdrop)`} />
        <circle cx="200" cy="82" r="126" fill={`url(#${id}-glow)`} />
        <path d="M0 169q91-18 179-6t221-4v41H0z" fill={colors.ink} opacity=".3" />
        <path d="M0 182q100-13 193-2t207-8v28H0z" fill={colors.ink} opacity=".34" />

        {variant === "prima-pars" && <>
          <path d="M44 151h312" stroke={colors.gold} strokeOpacity=".48" strokeWidth="1" />
          <path d="M73 149q53-13 107 0t107 0t40 0" fill="none" stroke={colors.light} strokeOpacity=".62" strokeWidth="1.5" />
          <g fill="none" stroke={colors.gold} strokeOpacity=".72">
            <circle cx="200" cy="91" r="58" strokeWidth="1" />
            <circle cx="200" cy="91" r="45" strokeWidth="1.3" />
          </g>
          <g stroke={colors.gold} strokeWidth="2" strokeLinecap="round" opacity=".85">
            {Array.from({ length: 12 }, (_, index) => {
              const angle = (Math.PI * 2 * index) / 12;
              return <line key={index} x1={200 + Math.cos(angle) * 38} y1={91 + Math.sin(angle) * 38} x2={200 + Math.cos(angle) * 49} y2={91 + Math.sin(angle) * 49} />;
            })}
          </g>
          <circle cx="200" cy="91" r="27" fill={colors.gold} />
          <circle cx="200" cy="91" r="21" fill={colors.light} opacity=".7" />
          <path d="M200 54l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill={colors.accent} opacity=".88" />
          <circle cx="103" cy="79" r="2" fill={colors.light} />
          <circle cx="294" cy="67" r="1.7" fill={colors.light} />
          <circle cx="325" cy="111" r="1.5" fill={colors.gold} />
          <circle cx="79" cy="117" r="1.4" fill={colors.gold} />
        </>}

        {variant === "prima-secundae" && <>
          <g fill="none" stroke={colors.gold} strokeOpacity=".42">
            <circle cx="200" cy="88" r="62" strokeWidth="1" />
            <circle cx="200" cy="88" r="46" strokeWidth="1" strokeDasharray="2 7" />
          </g>
          <path d="M190 200c3-21 2-37-8-49-9-11-10-23 1-34 9-9 7-22-2-34M210 200c-3-21-2-37 8-49 9-11 10-23-1-34-9-9-7-22 2-34" fill="none" stroke={colors.light} strokeWidth="13" strokeLinecap="round" opacity=".82" />
          <path d="M190 200c3-21 2-37-8-49-9-11-10-23 1-34 9-9 7-22-2-34M210 200c-3-21-2-37 8-49 9-11 10-23-1-34-9-9-7-22 2-34" fill="none" stroke={colors.gold} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M183 85l-24-15m58 15 24-15M181 112l-30 2m68-2 30 2" stroke={colors.gold} strokeOpacity=".72" strokeWidth="1.4" />
          <circle cx="200" cy="77" r="7" fill={colors.gold} />
          <path d="M200 63l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={colors.light} />
          <g stroke={colors.ink} strokeOpacity=".58" strokeWidth="1.2">
            <path d="M62 131h45m-39-6v12m33-12v12M293 131h45m-39-6v12m33-12v12" />
          </g>
          <path d="M76 55l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zM323 64l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill={colors.light} opacity=".72" />
        </>}

        {variant === "secunda-secundae" && <>
          <g fill="none" stroke={colors.gold} strokeWidth="1.4" strokeOpacity=".82">
            <path d="M117 137c-23-18-31-45-22-72 18 8 31 24 35 44m-11 30c-16-26-17-53-2-77 16 12 25 31 22 50m-8 29c-8-27-3-52 17-71 12 16 15 37 7 54" />
            <path d="M283 137c23-18 31-45 22-72-18 8-31 24-35 44m11 30c16-26 17-53 2-77-16 12-25 31-22 50m8 29c8-27 3-52-17-71-12 16-15 37-7 54" />
          </g>
          <g fill={colors.light} opacity=".64">
            <ellipse cx="105" cy="80" rx="4" ry="9" transform="rotate(-37 105 80)" />
            <ellipse cx="124" cy="104" rx="4" ry="9" transform="rotate(-12 124 104)" />
            <ellipse cx="295" cy="80" rx="4" ry="9" transform="rotate(37 295 80)" />
            <ellipse cx="276" cy="104" rx="4" ry="9" transform="rotate(12 276 104)" />
          </g>
          <path d="M200 45l44 16v33c0 27-17 46-44 61-27-15-44-34-44-61V61z" fill={colors.ink} fillOpacity=".34" stroke={colors.gold} strokeWidth="2" />
          <path d="M200 54l35 13v27c0 21-13 36-35 49-22-13-35-28-35-49V67z" fill={colors.accent} fillOpacity=".36" stroke={colors.light} strokeOpacity=".64" strokeWidth="1" />
          <path d="M200 69v54m-17-37h34m-17 8-12 14m12-14 12 14" fill="none" stroke={colors.gold} strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="200" cy="86" r="5" fill={colors.light} />
          <circle cx="177" cy="138" r="2" fill={colors.gold} />
          <circle cx="223" cy="138" r="2" fill={colors.gold} />
        </>}

        {variant === "tertia-pars" && <>
          <g stroke={colors.light} strokeWidth="1.5" strokeLinecap="round" opacity=".57">
            <path d="M200 27v20M153 37l12 18M247 37l-12 18M120 69l22 8M280 69l-22 8M96 111l28-1M304 111l-28-1" />
          </g>
          <circle cx="200" cy="105" r="51" fill="none" stroke={colors.gold} strokeOpacity=".75" strokeWidth="1.2" />
          <circle cx="200" cy="105" r="38" fill={colors.gold} opacity=".16" />
          <path d="M0 145q58-18 113-5t87-1q55-13 101 1t99-4v64H0z" fill={colors.ink} opacity=".56" />
          <path d="M0 161q63-14 121-3t79-3q58-14 111 0t89-4v49H0z" fill={colors.accent} opacity=".4" />
          <path d="M200 54v82m-30-52h60" stroke={colors.gold} strokeWidth="8" strokeLinecap="square" />
          <path d="M200 55v80m-29-51h58" stroke={colors.light} strokeWidth="2" strokeLinecap="square" opacity=".72" />
          <path d="M200 47v11m-38 25 9 4m58-4-9 4" stroke={colors.light} strokeWidth="1.3" opacity=".8" />
        </>}

        {variant === "supplementum" && <>
          <g fill="none" stroke={colors.gold} strokeOpacity=".7">
            <circle cx="200" cy="71" r="42" strokeWidth="1.2" />
            <circle cx="200" cy="71" r="34" strokeWidth="1" strokeDasharray="2 5" />
          </g>
          <path d="M200 37c6 11 8 19 0 25-8-6-6-14 0-25zm27 12c-2 12-6 19-16 18-2-9 4-15 16-18zm13 28c-10 7-18 10-25 2 4-9 12-10 25-2zm-13 28c-12-1-20-5-19-15 9-4 15 2 19 15zm-27 13c-6-11-8-19 0-25 8 6 6 14 0 25zm-27-13c2-12 6-19 16-18 2 9-4 15-16 18zm-13-28c10-7 18-10 25-2-4 9-12 10-25 2zm13-28c12 1 20 5 19 15-9 4-15-2-19-15z" fill={colors.accent} fillOpacity=".66" stroke={colors.light} strokeOpacity=".62" strokeWidth=".8" />
          <circle cx="200" cy="71" r="8" fill={colors.gold} />
          <circle cx="200" cy="71" r="3" fill={colors.light} />
          <path d="M111 139q42-31 84 0 42-31 84 0v30q-42-30-84 0-42-30-84 0z" fill={colors.ink} fillOpacity=".55" stroke={colors.gold} strokeWidth="1.6" />
          <path d="M200 139v30m-76-25q39-19 76 8m76-8q-39-19-76 8" fill="none" stroke={colors.light} strokeOpacity=".74" strokeWidth="1.2" />
          <path d="M119 144l-12 22m174-22 12 22" stroke={colors.gold} strokeOpacity=".65" strokeWidth="1" />
          <path d="M159 145q19-13 36 0m10 0q17-13 36 0" fill="none" stroke={colors.gold} strokeOpacity=".62" strokeWidth="1" />
        </>}

      </svg>
    </div>
  );
}
