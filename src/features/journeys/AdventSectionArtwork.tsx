import { useId } from "react";

type Props = { week: 1 | 2 | 3 | 4 };

const stars = [
  [78, 64, 2], [153, 43, 1.5], [241, 83, 1.4], [342, 46, 1.8], [493, 59, 1.4],
  [588, 82, 1.8], [694, 48, 1.5], [748, 115, 1.2], [127, 135, 1.1], [660, 148, 1.2],
];

/** A wide, atmospheric cover illustration for the Advent collection. */
export function AdventHeroArtwork({ card = false, mini = false }: { card?: boolean; mini?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`advent-hero-artwork-frame${card ? " is-card" : ""}`}>
      <svg className="advent-hero-artwork" viewBox={mini ? "0 90 840 580" : card ? "0 155 840 420" : "0 0 840 760"} role="img" aria-label="A bright star over a quiet Bethlehem beneath a deep Advent sky" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-hero-sky`} x1="0" y1="0" x2=".18" y2="1">
            <stop stopColor="#142b3c" />
            <stop offset=".49" stopColor="#334654" />
            <stop offset="1" stopColor="#bc8d68" />
          </linearGradient>
          <radialGradient id={`${id}-hero-halo`}>
            <stop stopColor="#fff0bd" stopOpacity=".94" />
            <stop offset=".18" stopColor="#f6d695" stopOpacity=".48" />
            <stop offset="1" stopColor="#f6d695" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-hero-path`} x1=".5" y1="0" x2=".5" y2="1">
            <stop stopColor="#f4d9a5" stopOpacity=".78" />
            <stop offset="1" stopColor="#f4d9a5" stopOpacity=".06" />
          </linearGradient>
          <linearGradient id={`${id}-hero-hill`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#294448" />
            <stop offset="1" stopColor="#172f35" />
          </linearGradient>
        </defs>
        <rect width="840" height="760" fill={`url(#${id}-hero-sky)`} />
        <circle cx="478" cy="184" r="210" fill={`url(#${id}-hero-halo)`} />
        {stars.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff3d2" opacity={index % 3 === 0 ? ".8" : ".48"} />)}
        <path d="M0 409q102-74 218-42t204-21q110-61 220-3t198 16v171H0z" fill="#435960" opacity=".76" />
        <path d="M0 487q105-53 218-29t207-23q113-54 223-6t192 11v143H0z" fill="#2c4548" />
        <path d="M0 574q135-59 273-26t256-15q139-45 311-8v235H0z" fill={`url(#${id}-hero-hill)`} />

        <g fill="#263a3b">
          <path d="M397 510v-65l34-27 35 27v65z" /><path d="M464 503v-82l48-37 48 37v82z" />
          <path d="M554 496v-55l37-29 38 29v55z" /><path d="M617 504v-73l43-32 43 32v73z" />
          <path d="M694 500v-50l32-25 32 25v50z" />
        </g>
        <g fill="#edc98b" opacity=".82">
          <rect x="421" y="464" width="7" height="11" rx="3" /><rect x="485" y="444" width="8" height="12" rx="3" />
          <rect x="523" y="442" width="7" height="11" rx="3" /><rect x="580" y="454" width="7" height="10" rx="3" />
          <rect x="632" y="450" width="8" height="12" rx="3" /><rect x="675" y="454" width="7" height="10" rx="3" />
          <rect x="713" y="460" width="7" height="10" rx="3" />
        </g>

        <path d="M414 760q46-96 38-158t49-114q-48 63 3 113t-3 159z" fill={`url(#${id}-hero-path)`} opacity=".5" />
        <path d="M477 168l8 23 23 8-23 8-8 23-8-23-23-8 23-8z" fill="#fff1c8" />
        <path d="M477 130v-19m0 151v-19m-39-36h-20m118 0h-20m-67-27-14-14m84 84-14-14m0-56 14-14m-84 84-14-14" fill="none" stroke="#ffe8b5" strokeWidth="2" strokeLinecap="round" opacity=".67" />

        <g fill="none" stroke="#152d30" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity=".92">
          <path d="M116 665q30-67 25-125m-2 69q-45-28-62-70m64 42q38-34 49-74m-48 29q-6-47-33-69" />
          <path d="M707 682q-24-58-20-110m-1 60q37-24 55-58m-57 31q-35-31-40-66m41 22q4-39 27-57" />
        </g>
        <g fill="#52685a" opacity=".9">
          <ellipse cx="77" cy="532" rx="27" ry="12" transform="rotate(38 77 532)" />
          <ellipse cx="191" cy="534" rx="31" ry="13" transform="rotate(-43 191 534)" />
          <ellipse cx="92" cy="581" rx="31" ry="13" transform="rotate(28 92 581)" />
          <ellipse cx="730" cy="566" rx="29" ry="12" transform="rotate(-36 730 566)" />
          <ellipse cx="650" cy="563" rx="30" ry="12" transform="rotate(37 650 563)" />
          <ellipse cx="719" cy="615" rx="32" ry="13" transform="rotate(-23 719 615)" />
        </g>
      </svg>
      {!card && !mini && <p className="advent-hero-artwork-caption"><span>THE LIGHT IS DRAWING NEAR</span><strong>Make room for wonder.</strong></p>}
      {!card && !mini && <span className="advent-hero-artwork-index" aria-hidden="true">I</span>}
    </div>
  );
}

/** A distinct landscape vignette for each of the four Advent weeks. */
export function AdventSectionArtwork({ week }: Props) {
  const id = useId().replace(/:/g, "");
  const palettes = [
    { sky: "#162a40", horizon: "#bb8e70", glow: "#f4daa0" },
    { sky: "#263b4b", horizon: "#a9a28a", glow: "#efd39a" },
    { sky: "#3b3a4b", horizon: "#d0a27f", glow: "#f4dbaa" },
    { sky: "#112c3b", horizon: "#bb8a68", glow: "#f5d48f" },
  ][week - 1];

  return (
    <svg className={`advent-section-art advent-section-art--${week}`} viewBox="0 0 800 340" role="img" aria-label={`Advent Week ${week} illustration`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-week-sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={palettes.sky} /><stop offset="1" stopColor={palettes.horizon} /></linearGradient>
        <radialGradient id={`${id}-week-glow`}><stop stopColor={palettes.glow} stopOpacity=".96" /><stop offset=".28" stopColor={palettes.glow} stopOpacity=".38" /><stop offset="1" stopColor={palettes.glow} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-week-beam`} x1=".5" y1="0" x2=".5" y2="1"><stop stopColor={palettes.glow} stopOpacity=".35" /><stop offset="1" stopColor={palettes.glow} stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="800" height="340" fill={`url(#${id}-week-sky)`} />
      <circle cx={week === 2 ? 284 : 532} cy={week === 4 ? 76 : 98} r="158" fill={`url(#${id}-week-glow)`} />
      {stars.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#fff1d0" opacity={index % 2 === 0 ? ".64" : ".38"} />)}

      {week === 1 && <>
        <path d="M0 225q100-56 210-26t204-3q92 31 186-17t200-4v165H0z" fill="#526765" />
        <path d="M0 266q113-38 233-12t220-3q147 23 347-20v109H0z" fill="#294648" />
        <path d="M532 56l8 21 21 8-21 8-8 21-8-21-21-8 21-8z" fill="#fff0c2" />
        <path d="M537 118q-6 59 29 108" fill="none" stroke="#f2d9a3" strokeWidth="1.5" opacity=".52" />
        <path d="M0 300q134-27 276-3t253-4q132 19 271-8v55H0z" fill="#203c3e" />
      </>}

      {week === 2 && <>
        <path d="M0 229q123-47 258-18t248-11q137-40 294 5v135H0z" fill="#677568" />
        <path d="M0 271q139-31 279-9t247-8q142-23 274 7v90H0z" fill="#3c594d" />
        <path d="M387 340q-46-58-12-105t-22-93q49 47 20 98t37 100z" fill="#d2b488" opacity=".9" />
        <path d="M145 260q20-71 13-128m0 67q-37-21-52-54m54 34q28-28 36-57m-37 23q-5-35-24-54" fill="none" stroke="#263f3e" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="104" cy="149" rx="24" ry="10" fill="#829176" transform="rotate(35 104 149)" />
        <ellipse cx="197" cy="143" rx="25" ry="10" fill="#829176" transform="rotate(-40 197 143)" />
        <circle cx="285" cy="104" r="10" fill="#fff0c2" /><circle cx="285" cy="104" r="30" fill={`url(#${id}-week-glow)`} />
      </>}

      {week === 3 && <>
        <path d="M0 267q119-35 251-14t248-10q153-34 301 4v93H0z" fill="#4f655d" />
        <path d="M0 299q113-28 261-8t246-11q157-16 293 10v60H0z" fill="#2c4644" />
        <path d="M418 340V93q0-108 133-108t133 108v247z" fill="#263b49" />
        <path d="M446 340V100q0-78 105-78t105 78v240z" fill="#71817b" opacity=".72" />
        <path d="M551 36l-85 304h170z" fill={`url(#${id}-week-beam)`} />
        <path d="M551 274v-79m0 41-29-25m29 11 28-30m-28 80-25-15m25 6 26-14" fill="none" stroke="#e8dcbd" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M549 195q-22-20-31 0 16 8 31 0m4 0q22-20 31 0-16 8-31 0m-4-8q-12-22 1-35 14 14-1 35" fill="#fbf1dc" />
      </>}

      {week === 4 && <>
        <path d="M0 253q123-42 247-12t249-13q145-38 304 6v106H0z" fill="#52675d" />
        <path d="M0 287q115-27 248-6t258-7q163-20 294 11v55H0z" fill="#294747" />
        <g fill="#223a40">
          <path d="M248 270v-70l49-37 49 37v70z" /><path d="M330 278v-94l61-47 61 47v94z" />
          <path d="M438 273v-73l48-37 48 37v73z" /><path d="M532 280v-91l59-45 59 45v91z" />
        </g>
        <g fill="#f1ce91" opacity=".85"><rect x="276" y="211" width="9" height="14" rx="4" /><rect x="361" y="205" width="9" height="14" rx="4" /><rect x="391" y="203" width="9" height="14" rx="4" /><rect x="470" y="215" width="9" height="13" rx="4" /><rect x="558" y="210" width="9" height="14" rx="4" /><rect x="590" y="208" width="9" height="14" rx="4" /></g>
        <path d="M466 41l7 19 19 7-19 7-7 19-7-19-19-7 19-7z" fill="#fff0c1" />
        <path d="M468 94q-3 72 9 116" fill="none" stroke="#f2d8a4" strokeWidth="1.5" opacity=".48" />
        <path d="M400 340q26-45 18-87t35-55q-31 37-5 69t-2 73z" fill="#d8bb8e" opacity=".7" />
      </>}
    </svg>
  );
}
