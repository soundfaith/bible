import { useId } from "react";

type Part = 1 | 2 | 3 | 4;
type Props = { part: Part };

const smallLights = [
  [84, 69, 2], [166, 45, 1.5], [269, 91, 1.4], [368, 53, 1.8], [584, 59, 1.4],
  [711, 84, 1.8], [753, 138, 1.2], [122, 154, 1.1], [659, 165, 1.2],
];

/** A quiet dawn landscape for the Freedom from Attachment collection. */
export function FreedomHeroArtwork({ card = false, mini = false }: { card?: boolean; mini?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`freedom-hero-artwork-frame${card ? " is-card" : ""}`}>
      <svg className="freedom-hero-artwork" viewBox={mini ? "0 90 840 580" : card ? "0 155 840 420" : "0 0 840 760"} role="img" aria-label="A winding path through olive hills toward an open arch filled with morning light" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2=".2" y2="1">
            <stop stopColor="#172d32" />
            <stop offset=".52" stopColor="#49645b" />
            <stop offset="1" stopColor="#d2a276" />
          </linearGradient>
          <radialGradient id={`${id}-dawn`}>
            <stop stopColor="#fff0c4" stopOpacity=".96" />
            <stop offset=".2" stopColor="#f5dca5" stopOpacity=".5" />
            <stop offset="1" stopColor="#f5dca5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-path`} x1=".5" y1="0" x2=".5" y2="1">
            <stop stopColor="#f7dda9" stopOpacity=".84" />
            <stop offset="1" stopColor="#f7dda9" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#344f47" />
            <stop offset="1" stopColor="#172f31" />
          </linearGradient>
        </defs>
        <rect width="840" height="760" fill={`url(#${id}-sky)`} />
        <circle cx="482" cy="253" r="229" fill={`url(#${id}-dawn)`} />
        {smallLights.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff3d2" opacity={index % 3 === 0 ? ".7" : ".42"} />)}

        <path d="M0 427q112-70 223-38t206-19q113-48 218-2t193 12v164H0z" fill="#607269" opacity=".8" />
        <path d="M0 494q116-52 227-25t212-13q123-45 235-5t166 16v147H0z" fill="#3d5950" />
        <path d="M0 580q129-49 270-23t257-12q145-41 313-5v220H0z" fill={`url(#${id}-ground)`} />

        <path d="M376 539V352a106 106 0 0 1 212 0v187z" fill="#243b38" opacity=".9" />
        <path d="M414 539V354a68 68 0 0 1 136 0v185z" fill={`url(#${id}-dawn)`} opacity=".82" />
        <path d="M376 539V352a106 106 0 0 1 212 0v187" fill="none" stroke="#c8a773" strokeWidth="5" opacity=".66" />
        <path d="M479 538q-43-76-7-143t5-87q43 68 10 128t25 102z" fill={`url(#${id}-path)`} opacity=".62" />
        <path d="M416 760q61-103 48-170t22-91q-18 54 15 94t-5 167z" fill={`url(#${id}-path)`} opacity=".56" />

        <g fill="none" stroke="#183432" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity=".92">
          <path d="M102 690q32-77 21-138m1 80q-43-28-64-75m65 43q35-32 49-75m-50 33q-7-45-32-69" />
          <path d="M734 700q-29-68-23-126m0 67q40-24 56-62m-57 33q-36-28-43-65m44 23q5-42 30-62" />
        </g>
        <g fill="#63775e" opacity=".96">
          <ellipse cx="58" cy="554" rx="30" ry="12" transform="rotate(38 58 554)" />
          <ellipse cx="177" cy="550" rx="31" ry="13" transform="rotate(-43 177 550)" />
          <ellipse cx="86" cy="610" rx="33" ry="13" transform="rotate(28 86 610)" />
          <ellipse cx="760" cy="564" rx="31" ry="13" transform="rotate(-36 760 564)" />
          <ellipse cx="664" cy="567" rx="31" ry="13" transform="rotate(37 664 567)" />
          <ellipse cx="741" cy="624" rx="34" ry="13" transform="rotate(-23 741 624)" />
        </g>
        <g fill="none" stroke="#fff0c8" strokeWidth="2.5" strokeLinecap="round" opacity=".83">
          <path d="M622 229q12-12 24 0-12-5-24 0zm24 0q12-12 24 0-12-5-24 0z" />
          <path d="M680 278q10-10 20 0-10-4-20 0zm20 0q10-10 20 0-10-4-20 0z" />
        </g>
        <path d="M482 171c-18-26-58-11-58 20 0 31 58 66 58 66s58-35 58-66c0-31-40-46-58-20z" fill="#f1cf98" opacity=".18" stroke="#f1cf98" strokeWidth="2" />
      </svg>
      {!card && !mini && <p className="freedom-hero-artwork-caption"><span>15 DAYS · SCRIPTURE · PRAYER</span><strong>A heart made free to love.</strong></p>}
      {!card && !mini && <span className="freedom-hero-artwork-index" aria-hidden="true">15</span>}
    </div>
  );
}

/** Four companion landscapes trace the journey from awareness to rest. */
export function FreedomSectionArtwork({ part }: Props) {
  const id = useId().replace(/:/g, "");
  const palettes = [
    { sky: "#35444b", horizon: "#c19270", glow: "#f1d29b" },
    { sky: "#243b43", horizon: "#a99274", glow: "#e9ca91" },
    { sky: "#344a4c", horizon: "#c79a76", glow: "#f1d8a7" },
    { sky: "#18363b", horizon: "#d1a16e", glow: "#f5d89f" },
  ][part - 1];
  const descriptions = [
    "A heart held gently in the light.",
    "A loosened thread opens into a way forward.",
    "Love that gives others room to grow.",
    "The open way into God's peace.",
  ];

  return (
    <svg className={`freedom-section-art freedom-section-art--${part}`} viewBox="0 0 800 340" role="img" aria-label={descriptions[part - 1]} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-part-sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={palettes.sky} /><stop offset="1" stopColor={palettes.horizon} /></linearGradient>
        <radialGradient id={`${id}-part-glow`}><stop stopColor={palettes.glow} stopOpacity=".94" /><stop offset=".3" stopColor={palettes.glow} stopOpacity=".34" /><stop offset="1" stopColor={palettes.glow} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="340" fill={`url(#${id}-part-sky)`} />
      <circle cx={part === 2 ? 298 : 514} cy={part === 4 ? 87 : 105} r="160" fill={`url(#${id}-part-glow)`} />
      {smallLights.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff0ce" opacity={index % 2 === 0 ? ".52" : ".3"} />)}
      <path d="M0 233q104-50 220-21t220-9q123-39 229 0t131 7v130H0z" fill="#62756a" opacity=".88" />
      <path d="M0 278q119-34 247-9t239-10q150-25 314 6v75H0z" fill="#345047" />

      {part === 1 && <>
        <circle cx="507" cy="137" r="75" fill="none" stroke="#f4d8a0" strokeWidth="1.5" opacity=".32" />
        <circle cx="507" cy="137" r="58" fill="none" stroke="#f4d8a0" strokeWidth="1" strokeDasharray="2 7" opacity=".62" />
        <path d="M507 124c-14-20-42-9-42 13 0 23 42 49 42 49s42-26 42-49c0-22-28-33-42-13z" fill="#edc78b" stroke="#fff0ce" strokeWidth="1.5" />
        <path d="M0 307q122-32 254-9t243-8q150 18 303-6v56H0z" fill="#263f3d" />
      </>}

      {part === 2 && <>
        <path d="M0 309q115-29 237-6t248-8q142 17 315-9v54H0z" fill="#263f3d" />
        <path d="M230 342q38-37 16-68t22-50q-22 28 8 49t5 69" fill="none" stroke="#f0d39d" strokeWidth="4" strokeLinecap="round" />
        <path d="M299 340q42-48 14-75t24-53q-21 32 10 52t-1 76" fill="none" stroke="#f0d39d" strokeWidth="2" strokeLinecap="round" opacity=".66" />
        <path d="M437 302q35-18 69-2t75-4" fill="none" stroke="#f2d69f" strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" opacity=".8" />
        <circle cx="583" cy="296" r="5" fill="#fff1cc" />
      </>}

      {part === 3 && <>
        <path d="M140 319q26-73 21-138m0 83q-40-25-57-67m59 38q35-27 45-65m-44 24q-3-41-25-63" fill="none" stroke="#263e3d" strokeWidth="7" strokeLinecap="round" />
        <g fill="#809078">
          <ellipse cx="105" cy="198" rx="26" ry="10" transform="rotate(38 105 198)" />
          <ellipse cx="207" cy="196" rx="26" ry="10" transform="rotate(-42 207 196)" />
          <ellipse cx="123" cy="234" rx="27" ry="10" transform="rotate(25 123 234)" />
        </g>
        <g fill="none" stroke="#fff1d2" strokeWidth="2.5" strokeLinecap="round">
          <path d="M499 137q13-13 26 0-13-5-26 0zm26 0q13-13 26 0-13-5-26 0z" />
          <path d="M580 178q10-10 20 0-10-4-20 0zm20 0q10-10 20 0-10-4-20 0z" />
          <path d="M645 119q9-9 18 0-9-4-18 0zm18 0q9-9 18 0-9-4-18 0z" />
        </g>
      </>}

      {part === 4 && <>
        <path d="M372 340V150a107 107 0 0 1 214 0v190z" fill="#263d3b" />
        <path d="M406 340V153a73 73 0 0 1 146 0v187z" fill={`url(#${id}-part-glow)`} />
        <path d="M479 340q-30-48-10-82t12-47q27 37 7 69t20 60z" fill="#f0d4a0" opacity=".62" />
        <path d="M0 307q119-31 246-8t247-11q149 17 307-5v57H0z" fill="#243e3d" />
        <circle cx="479" cy="79" r="4" fill="#fff0c9" />
      </>}
    </svg>
  );
}
