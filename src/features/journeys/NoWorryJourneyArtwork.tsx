import { useId } from "react";

type Part = 1 | 2 | 3 | 4;
type Props = { part: Part };

const stars = [
  [80, 62, 1.7], [162, 47, 1.3], [269, 88, 1.6], [371, 52, 1.4], [598, 58, 1.5],
  [704, 79, 1.8], [754, 127, 1.2], [122, 147, 1.1], [663, 151, 1.2],
];

/** A still lake at first light for the No-Worry collection. */
export function NoWorryHeroArtwork({ card = false, mini = false }: { card?: boolean; mini?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`no-worry-hero-artwork-frame${card ? " is-card" : ""}`}>
      <svg className="no-worry-hero-artwork" viewBox={mini ? "0 90 840 580" : card ? "0 155 840 420" : "0 0 840 760"} role="img" aria-label="A quiet lake at dawn, with the last clouds giving way to warm light" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2=".18" y2="1">
            <stop stopColor="#192e43" />
            <stop offset=".48" stopColor="#536a78" />
            <stop offset="1" stopColor="#d2a176" />
          </linearGradient>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#fff2c9" stopOpacity=".94" />
            <stop offset=".2" stopColor="#f4d99f" stopOpacity=".48" />
            <stop offset="1" stopColor="#f4d99f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#84918a" />
            <stop offset="1" stopColor="#29434b" />
          </linearGradient>
          <linearGradient id={`${id}-reflection`} x1=".5" y1="0" x2=".5" y2="1">
            <stop stopColor="#fff0bf" stopOpacity=".72" />
            <stop offset="1" stopColor="#f4d99f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="840" height="760" fill={`url(#${id}-sky)`} />
        <circle cx="512" cy="255" r="244" fill={`url(#${id}-light)`} />
        {stars.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff4d5" opacity={index % 3 === 0 ? ".72" : ".4"} />)}

        <path d="M0 405q83-69 169-43t158 9q87-83 185-39t151 19q74-54 177-20v152H0z" fill="#52616a" opacity=".88" />
        <path d="M0 473q104-46 213-19t196-5q108-57 214-15t217 4v116H0z" fill="#344b55" />
        <path d="M0 543q126-40 250-17t223-8q144-36 367-2v244H0z" fill={`url(#${id}-water)`} />
        <path d="M478 543q34 54 14 96t30 121h53q-38-82-15-132t-25-85z" fill={`url(#${id}-reflection)`} opacity=".7" />
        <g fill="none" stroke="#f4ddb0" strokeWidth="2" strokeLinecap="round" opacity=".45">
          <path d="M431 584h69m-93 22h113m-74 23h92m-108 25h126m-88 28h98m-120 32h146m-164 34h177" />
        </g>
        <path d="M0 617q129-47 263-18t238-11q134-33 339 2v170H0z" fill="#253e43" opacity=".84" />
        <path d="M0 682q116-44 241-15t250-9q160-28 349 4v98H0z" fill="#1d363c" />

        <g fill="none" stroke="#1b353c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".9">
          <path d="M109 687q18-77 11-146m0 89q-37-26-54-69m55 43q31-31 41-68m-41 23q-3-39-24-62" />
          <path d="M732 703q-22-66-16-129m-1 68q34-27 48-65m-49 34q-31-27-37-61m38 21q4-37 27-56" />
        </g>
        <g fill="#6d7c6c" opacity=".96">
          <ellipse cx="64" cy="556" rx="26" ry="11" transform="rotate(37 64 556)" />
          <ellipse cx="160" cy="557" rx="27" ry="11" transform="rotate(-41 160 557)" />
          <ellipse cx="740" cy="575" rx="27" ry="11" transform="rotate(-35 740 575)" />
          <ellipse cx="664" cy="575" rx="28" ry="12" transform="rotate(38 664 575)" />
        </g>
        <g fill="none" stroke="#fff2d2" strokeWidth="2.5" strokeLinecap="round" opacity=".8">
          <path d="M624 229q11-11 22 0-11-4-22 0zm22 0q11-11 22 0-11-4-22 0z" />
          <path d="M683 281q9-9 18 0-9-4-18 0zm18 0q9-9 18 0-9-4-18 0z" />
        </g>
      </svg>
      {!card && !mini && <p className="no-worry-hero-artwork-caption"><span>15 DAYS · SCRIPTURE · PRAYER</span><strong>One day at a time.</strong></p>}
      {!card && !mini && <span className="no-worry-hero-artwork-index" aria-hidden="true">15</span>}
    </div>
  );
}

/** Four peaceful scenes follow the journey from surrender to daily trust. */
export function NoWorrySectionArtwork({ part }: Props) {
  const id = useId().replace(/:/g, "");
  const palettes = [
    { sky: "#263b50", horizon: "#bd9274", light: "#f0d39b" },
    { sky: "#304655", horizon: "#afa18a", light: "#ecd39d" },
    { sky: "#243d4d", horizon: "#c09471", light: "#f1d8a6" },
    { sky: "#1b3948", horizon: "#d0a071", light: "#f5d99f" },
  ][part - 1];
  const descriptions = [
    "Small lights resting on quiet water.",
    "A calm lake beneath the first light of morning.",
    "A little chapel beside a peaceful shore.",
    "A path through the hills toward a new day.",
  ];

  return (
    <svg className={`no-worry-section-art no-worry-section-art--${part}`} viewBox="0 0 800 340" role="img" aria-label={descriptions[part - 1]} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-part-sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={palettes.sky} /><stop offset="1" stopColor={palettes.horizon} /></linearGradient>
        <radialGradient id={`${id}-part-light`}><stop stopColor={palettes.light} stopOpacity=".95" /><stop offset=".3" stopColor={palettes.light} stopOpacity=".35" /><stop offset="1" stopColor={palettes.light} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-part-water`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#758782" /><stop offset="1" stopColor="#2b454c" /></linearGradient>
      </defs>
      <rect width="800" height="340" fill={`url(#${id}-part-sky)`} />
      <circle cx={part === 2 ? 292 : 526} cy={part === 4 ? 82 : 104} r="163" fill={`url(#${id}-part-light)`} />
      {stars.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff0ce" opacity={index % 2 === 0 ? ".54" : ".3"} />)}
      <path d="M0 221q94-45 205-18t209-8q125-37 231 2t155 3v140H0z" fill="#536a6d" />
      <path d="M0 258q108-31 230-8t240-9q149-25 330 10v89H0z" fill="#34535a" />
      <path d="M0 283q135-27 264-7t244-9q149-20 292 12v61H0z" fill={`url(#${id}-part-water)`} />

      {part === 1 && <>
        <path d="M0 305q127-28 252-7t255-9q144 18 293-7v58H0z" fill="#263f46" />
        <path d="M310 209c-11-15-34-7-34 12 0 19 34 39 34 39s34-20 34-39c0-19-23-27-34-12z" fill="#efd09a" opacity=".91" />
        <circle cx="310" cy="225" r="61" fill="none" stroke="#f5dfb1" strokeWidth="1.4" opacity=".36" />
        <circle cx="310" cy="225" r="83" fill="none" stroke="#f5dfb1" strokeWidth="1" strokeDasharray="2 8" opacity=".52" />
        <g fill="none" stroke="#f2d8a2" strokeWidth="2" strokeLinecap="round" opacity=".6"><path d="M464 275h77m-105 18h112m-83 18h126" /></g>
      </>}

      {part === 2 && <>
        <path d="M0 304q124-26 250-6t245-9q161 18 305-5v56H0z" fill="#273f45" />
        <circle cx="292" cy="108" r="18" fill="#fff0c6" />
        <circle cx="292" cy="108" r="39" fill={`url(#${id}-part-light)`} />
        <g fill="none" stroke="#eddaaF" strokeWidth="1.6" opacity=".7"><ellipse cx="292" cy="273" rx="31" ry="5" /><ellipse cx="292" cy="273" rx="59" ry="10" /><ellipse cx="292" cy="273" rx="91" ry="16" /></g>
        <path d="M611 284q18-45 13-91m0 58q-25-20-36-47m37 27q23-22 29-45" fill="none" stroke="#263f43" strokeWidth="5" strokeLinecap="round" />
        <path d="M579 215q21-13 35 1-19-3-35-1zm78-8q19-14 33-1-18-2-33 1z" fill="#718371" />
      </>}

      {part === 3 && <>
        <path d="M0 298q122-26 251-7t254-10q146 17 295-8v67H0z" fill="#273f45" />
        <path d="M490 269v-84l55-44 55 44v84z" fill="#263d45" />
        <path d="M478 185l67-56 67 56" fill="none" stroke="#d8bd91" strokeWidth="4" strokeLinejoin="round" opacity=".8" />
        <path d="M528 269v-47a17 17 0 0 1 34 0v47z" fill="#f0d39d" opacity=".78" />
        <path d="M545 137V93m-17 17 17-17 17 17" fill="none" stroke="#f4dfb7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
        <path d="M0 286q105-24 217-4t222-8v66H0z" fill={`url(#${id}-part-water)`} opacity=".86" />
        <g fill="none" stroke="#f2d8a5" strokeWidth="2" strokeLinecap="round" opacity=".62"><path d="M143 296h74m-106 17h112m220-15h82" /></g>
      </>}

      {part === 4 && <>
        <path d="M0 229q89-38 184-18t193-10q94-54 187-17t236 2v154H0z" fill="#526764" />
        <path d="M0 270q120-29 240-8t238-7q156-23 322 8v77H0z" fill="#344f4d" />
        <path d="M0 318q130-29 256-8t246-8q151 20 298-5v43H0z" fill="#243e43" />
        <path d="M374 340q-39-54-10-94t-12-61q37 40 12 83t31 72z" fill="#f0d39b" opacity=".72" />
        <g fill="none" stroke="#fff1ce" strokeWidth="2.5" strokeLinecap="round"><path d="M520 135q11-11 22 0-11-4-22 0zm22 0q11-11 22 0-11-4-22 0z" /><path d="M635 175q9-9 18 0-9-4-18 0zm18 0q9-9 18 0-9-4-18 0z" /></g>
      </>}
    </svg>
  );
}
