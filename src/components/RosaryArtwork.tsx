import { rosaryMysteries } from "../data/rosary";

type RosaryArtworkProps = { index?: number; hero?: boolean; home?: boolean };

const representativeScenes = [2, 0, 4, 0];
const scenes = [
  { sky: ["#34475a", "#c79072", "#f0d1a1"], glow: "#ffe8b0", distant: "#777c78", land: "#465a55", sign: "nativity" },
  { sky: ["#50677b", "#cfb391", "#f1e1bb"], glow: "#fff0c3", distant: "#8d9b91", land: "#55716d", sign: "baptism" },
  { sky: ["#443e50", "#a9655d", "#e7ad78"], glow: "#f7d3a0", distant: "#766765", land: "#42464d", sign: "calvary" },
  { sky: ["#314758", "#d49468", "#f2d5a1"], glow: "#fff0bf", distant: "#929889", land: "#53664f", sign: "tomb" },
] as const;

function Nativity({ color }: { color: string }) {
  return <>
    <path d="M266 298 400 162l134 136v42H266z" fill="#4b4c4c" opacity=".72" />
    <path d="M246 267 400 117l154 150" fill="none" stroke="#d0bda0" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M294 307v-48l106-104 106 104v48" fill="#3a4650" />
    <path d="M400 159v106" stroke="#d0bda0" strokeWidth="8" opacity=".65" />
    <circle cx="400" cy="280" r="39" fill={color} opacity=".2" />
    <circle cx="400" cy="279" r="20" fill="none" stroke={color} strokeWidth="2" opacity=".72" />
    <circle cx="400" cy="301" r="9" fill="#edd6a9" />
    <path d="M374 321h52l-6 17h-40z" fill="#a5815f" />
    <path d="M374 321 400 304l26 17" fill="none" stroke="#e6d1ad" strokeWidth="5" strokeLinejoin="round" />
    <circle cx="340" cy="268" r="15" fill="#bd8e70" />
    <path d="M321 286q19-13 38 0l9 44h-57z" fill="#b9a18a" />
    <path d="M318 329h29m-15-4v14" stroke="#d8c7a8" strokeWidth="4" strokeLinecap="round" />
    <circle cx="462" cy="244" r="16" fill="#bd8e70" />
    <path d="M443 263q19-15 38 0l11 68h-59z" fill="#827e72" />
    <path d="M448 234q14-19 29 0" fill="none" stroke="#463f3c" strokeWidth="6" strokeLinecap="round" />
    <path d="M400 32v38m-19-19h38m-32-13 26 26m0-26-26 26" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </>;
}

function Baptism({ color }: { color: string }) {
  return <>
    <path d="M0 273q154-25 294 1t506-3v129H0z" fill="#64858a" />
    <path d="M0 300q166-24 342 2t458-4m-800 37q190-25 377 2t423-3" fill="none" stroke="#d8e1d4" strokeWidth="3" opacity=".48" />
    <path d="M400 73v76m-50-54 50 54m50-54-50 54" stroke={color} strokeWidth="3" opacity=".42" />
    <path d="M394 147q6-14 12 0l-2 18h-8z" fill="#f3e9d6" />
    <path d="M400 130q-37-39-75-8 28 34 75 9 36 26 73-9-37-31-73 8z" fill="#f3e9d6" />
    <circle cx="400" cy="139" r="5" fill="#e7c987" />
    <circle cx="435" cy="180" r="16" fill="#bd8e70" />
    <path d="M409 203q26-19 52 0l17 106h-87z" fill="#e7dfcd" />
    <path d="M412 223q-21 23-33 43" fill="none" stroke="#e7dfcd" strokeWidth="14" strokeLinecap="round" />
    <circle cx="304" cy="189" r="15" fill="#bd8e70" />
    <path d="M282 209q22-17 44 0l16 101h-76z" fill="#756b62" />
    <path d="M315 222q20-24 45-38" fill="none" stroke="#756b62" strokeWidth="13" strokeLinecap="round" />
    <path d="M363 180q-10 9-3 18" fill="none" stroke="#bd8e70" strokeWidth="7" strokeLinecap="round" />
  </>;
}

function Calvary({ color }: { color: string }) {
  return <>
    <circle cx="400" cy="167" r="108" fill={color} opacity=".16" />
    <path d="M0 266q124-38 254-2t246-1 300 2v135H0z" fill="#76605e" />
    <path d="M0 309q174-36 362-4t438-3v98H0z" fill="#454950" />
    <path d="M393 112h14v196h-14zm-49 52h112v14H344z" fill="#373a41" />
  </>;
}

function Resurrection({ color }: { color: string }) {
  return <>
    <circle cx="400" cy="160" r="146" fill={color} opacity=".18" />
    <circle cx="400" cy="160" r="91" fill={color} opacity=".2" />
    <path d="M0 266q132-36 258-3t252-2 290 1v138H0z" fill="#697365" />
    <path d="M0 310q161-30 347-3t453-3v96H0z" fill="#48594d" />
    <path d="M248 310v-66q0-120 152-120t152 120v66z" fill="#b7a88e" />
    <path d="M322 310v-68q0-87 78-87t78 87v68z" fill="#283b4b" />
    <path d="M322 255q78-35 156 0v55H322z" fill="#314756" />
    <path d="M354 283q24-24 49 0-23 21-49 0zm51-2q20-19 41 0-20 18-41 0z" fill="#f0e7d2" />
    <circle cx="547" cy="285" r="27" fill="#c8b89b" />
    <circle cx="547" cy="285" r="19" fill="#e6d8bc" />
    <path d="M381 148h38m-19-19v39" stroke="#fff4d4" strokeWidth="4" strokeLinecap="round" />
  </>;
}

function RosaryScene({ sign, color }: { sign: string; color: string }) {
  if (sign === "nativity") return <Nativity color={color} />;
  if (sign === "baptism") return <Baptism color={color} />;
  if (sign === "calvary") return <Calvary color={color} />;
  return <Resurrection color={color} />;
}

type RosaryBeadState = { prayedBeadIndices?: number[]; activeBeadIndex?: number | null; vertical?: boolean };

function HomeRosary({ prayedBeadIndices = [], activeBeadIndex = null, vertical = false }: RosaryBeadState = {}) {
  const centerY = vertical ? 255 : 151;
  const radiusX = vertical ? 28 : 136;
  const radiusY = vertical ? 210 : 94;
  const beads = Array.from({ length: 55 }, (_, index) => {
    const angle = Math.PI / 2 - (index / 55) * Math.PI * 2;
    const irregularity = vertical
      ? 1 + 0.13 * Math.sin(angle * 2 + 0.35) + 0.06 * Math.cos(angle * 3 - 0.9)
      : 1 + 0.045 * Math.sin(angle * 3 + 0.45) + 0.027 * Math.cos(angle * 5 - 0.7);
    const verticalIrregularity = vertical
      ? 1 + 0.035 * Math.sin(angle * 3 + 0.45) + 0.02 * Math.cos(angle * 5 - 0.7)
      : irregularity;
    return {
      index,
      x: 400 + Math.cos(angle) * radiusX * irregularity,
      y: centerY + Math.sin(angle) * radiusY * verticalIrregularity + 3 * Math.sin(angle * 2 + 0.25),
      anchor: index % 11 === 0,
    };
  });
  const ringPath = beads.map((point, index) => {
    const previous = beads[(index - 1 + beads.length) % beads.length];
    const next = beads[(index + 1) % beads.length];
    const afterNext = beads[(index + 2) % beads.length];
    const controlOne = { x: point.x + (next.x - previous.x) / 6, y: point.y + (next.y - previous.y) / 6 };
    const controlTwo = { x: next.x - (afterNext.x - point.x) / 6, y: next.y - (afterNext.y - point.y) / 6 };
    return `${index === 0 ? `M ${point.x} ${point.y}` : ""} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${next.x} ${next.y}`;
  }).join(" ") + " Z";

  const beadFill = (index: number, anchor: boolean) => activeBeadIndex === index
    ? "var(--rosary-active-base)"
    : prayedBeadIndices.includes(index)
      ? "var(--rosary-prayed-base)"
      : anchor ? "var(--rosary-anchor-base)" : "var(--rosary-bead-base)";
  const beadStroke = (index: number) => activeBeadIndex === index ? "var(--rosary-bead-active-stroke)" : "var(--rosary-bead-outline)";
  const pendant = vertical
    ? { gloryY: 466, hailMaryY: [480, 493, 506], ourFatherY: 520, crossTop: 529, crossBottom: 565, crossArm: 542, cordEnd: 528 }
    : { gloryY: 267, hailMaryY: [286, 300, 314], ourFatherY: 329, crossTop: 349, crossBottom: 379, crossArm: 368, cordEnd: 349 };
  const gloryRadius = vertical ? 4 : 8.3;
  return <>
    <path d={ringPath} fill="none" stroke="var(--rosary-cord)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {beads.map(({ index, x, y, anchor }) => <circle key={index} cx={x} cy={y} r={activeBeadIndex === index ? anchor ? 8.8 : 6.5 : anchor ? 7.4 : 5.15} fill={beadFill(index, anchor)} stroke={beadStroke(index)} strokeWidth={activeBeadIndex === index ? 2 : 1.35} />)}
    <path d={`M400 ${beads[0].y + 7}v${pendant.gloryY - beads[0].y - 15}`} stroke="var(--rosary-cord)" strokeWidth="2.1" strokeLinecap="round" />
    <circle cx="400" cy={pendant.gloryY} r={activeBeadIndex === 55 ? gloryRadius + 1.2 : gloryRadius} fill={beadFill(55, true)} stroke={beadStroke(55)} strokeWidth={activeBeadIndex === 55 ? 1.8 : 1.25} />
    <path d={`M400 ${pendant.gloryY + gloryRadius + 1}v${pendant.ourFatherY - pendant.gloryY - gloryRadius - (vertical ? 6 : 9)}`} fill="none" stroke="var(--rosary-cord)" strokeWidth={vertical ? 1.5 : 2.1} strokeLinecap="round" />
    {pendant.hailMaryY.map((y, offset) => {
      const index = 56 + offset;
      const radius = vertical ? 3.1 : 5.15;
      return <circle key={index} cx="400" cy={y} r={activeBeadIndex === index ? radius + 1.2 : radius} fill={beadFill(index, false)} stroke={beadStroke(index)} strokeWidth={activeBeadIndex === index ? 1.8 : 1.15} />;
    })}
    <circle cx="400" cy={pendant.ourFatherY} r={vertical ? activeBeadIndex === 59 ? 6.6 : 5.3 : activeBeadIndex === 59 ? 8.8 : 7.4} fill={beadFill(59, true)} stroke={beadStroke(59)} strokeWidth={activeBeadIndex === 59 ? 1.8 : 1.25} />
    <path d={`M400 ${pendant.ourFatherY + (vertical ? 6 : 9)}v${pendant.cordEnd - pendant.ourFatherY - (vertical ? 6 : 9)}`} fill="none" stroke="var(--rosary-cord)" strokeWidth={vertical ? 1.5 : 2.1} strokeLinecap="round" />
    <path d={`M400 ${pendant.crossTop}v${pendant.crossBottom - pendant.crossTop}m-${vertical ? 11 : 13}-${pendant.crossBottom - pendant.crossArm}h${vertical ? 22 : 26}`} fill="none" stroke="var(--rosary-cross)" strokeWidth={vertical ? 4.5 : 6} strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

export function FloatingRosaryBeads({ prayedBeadIndices = [], activeBeadIndex = null }: RosaryBeadState) {
  return <svg id="floating-rosary-beads" className="rosary-floating-beads" viewBox="250 40 300 465" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
    <HomeRosary prayedBeadIndices={prayedBeadIndices} activeBeadIndex={activeBeadIndex} vertical />
  </svg>;
}

export function RosaryArtwork({ index = 0, hero = false, home = false }: RosaryArtworkProps) {
  const mysteryIndex = home ? 0 : Math.max(0, Math.min(3, index));
  const mystery = rosaryMysteries[mysteryIndex] ?? rosaryMysteries[0];
  const scene = scenes[mysteryIndex];
  const caption = mystery.scenes[representativeScenes[mysteryIndex]] ?? mystery.scenes[0];
  const id = `rosary-art-${home ? "home" : mysteryIndex}`;

  return <figure className={`rosary-art${hero ? " rosary-art--hero" : ""}${home ? " rosary-art--home" : ""}`} role="img" aria-label={home ? "A complete five decade rosary with crucifix at dawn" : `${mystery.title}: ${caption.title}`}>
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={scene.sky[0]} /><stop offset=".64" stopColor={scene.sky[1]} /><stop offset="1" stopColor={scene.sky[2]} /></linearGradient>
        <radialGradient id={`${id}-light`}><stop stopColor={scene.glow} stopOpacity=".82" /><stop offset="1" stopColor={scene.glow} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="400" fill={`url(#${id}-sky)`} />
      <circle cx="400" cy="183" r="185" fill={`url(#${id}-light)`} />
      {home ? <>
        <path d="M0 253q130-43 253-7t235-1 312 3v151H0z" fill={scene.distant} />
        <path d="M0 301q172-47 353-8t447-3v110H0z" fill={scene.land} />
        <HomeRosary />
      </> : <>
        {mysteryIndex === 2 && <circle cx="650" cy="86" r="29" fill={scene.glow} opacity=".9" />}
        {mysteryIndex === 3 && <circle cx="400" cy="155" r="105" fill={`url(#${id}-light)`} />}
        <path d="M0 254q130-43 253-7t235-1 312 3v151H0z" fill={scene.distant} />
        <path d="M0 301q172-47 353-8t447-3v110H0z" fill={scene.land} />
        <RosaryScene sign={scene.sign} color={scene.glow} />
      </>}
    </svg>
  </figure>;
}
