import { bibleJourney } from "../data/bibleJourney";
import type { JourneyArtworkOption } from "../data/journeyArtwork";

type JourneyArtworkProps = {
  periodId: string;
  optionId?: string;
  index?: number;
  hero?: boolean;
};

type KingdomBuilding = {
  x: number;
  y: number;
  width: number;
  height: number;
  lit: boolean;
};

type KingdomRidgePoint = [number, number];

function createKingdomTown(
  seed: number,
  center: number,
  span: number,
  ridge: KingdomRidgePoint[],
): KingdomBuilding[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const ridgeHeightAt = (x: number) => {
    const rightIndex = ridge.findIndex(([pointX]) => pointX >= x);
    if (rightIndex <= 0) return ridge[Math.max(0, rightIndex)][1];
    const [leftX, leftY] = ridge[rightIndex - 1];
    const [rightX, rightY] = ridge[rightIndex];
    return leftY + ((x - leftX) / (rightX - leftX)) * (rightY - leftY);
  };

  return Array.from({ length: 168 }, () => {
    const isOutlier = random() > 0.84;
    const spread = isOutlier
      ? (random() - 0.5) * span * 1.2
      : (random() + random() + random() - 1.5) * span * 0.32;
    const x = Math.max(0, Math.min(1000, center + spread));
    const width = 2.8 + random() * 4.5;
    const height = 4 + random() * 8;
    const slopeSetback = 15 + random() * 19;
    return {
      x,
      y: ridgeHeightAt(x) + slopeSetback,
      width,
      height,
      lit: random() > 0.9,
    };
  });
}

const distantKingdom = createKingdomTown(701, 112, 170, [
  [-40, 266], [89.6, 208.8], [219.2, 244], [381.2, 156], [532.4, 241.8],
  [660.8, 193.4], [802.4, 259.4], [932, 175.8], [1040, 217.6],
]);
const nearKingdom = createKingdomTown(1707, 785, 190, [
  [510.8, 282.6], [651.2, 324.4], [813.2, 265], [932, 315.6], [1040, 289.2],
]);

export function JourneyArtForeground({
  option,
  className = "",
}: {
  option: JourneyArtworkOption;
  className?: string;
}) {
  const [Primary, Secondary, Accent] = option.icons;
  return (
    <span className={`journey-art-foreground ${className}`} aria-hidden="true">
      <span className="journey-art-radiance" />
      <span className="journey-art-icon journey-art-icon-primary"><Primary strokeWidth={1.35} /></span>
      <span className="journey-art-icon journey-art-icon-secondary"><Secondary strokeWidth={1.45} /></span>
      <span className="journey-art-icon journey-art-icon-accent"><Accent strokeWidth={1.5} /></span>
      <span className="journey-art-ground" />
    </span>
  );
}

export function JourneyArtwork({
  periodId,
  index = 0,
  hero = false,
}: JourneyArtworkProps) {
  const period = bibleJourney.find((item) => item.id === periodId) ?? bibleJourney[0];
  return (
    <figure
      className={`journey-artwork journey-artwork--${period.scene}${hero ? " journey-artwork--hero" : ""}`}
      role="img"
      aria-label={`${period.title}: ${period.artPrompt}`}
    >
      <span className="journey-artwork-sky" aria-hidden="true" />
      <span className="journey-artwork-orbit" aria-hidden="true" />
      <span className="journey-artwork-land journey-artwork-land-back" aria-hidden="true" />
      <span className="journey-artwork-land journey-artwork-land-front" aria-hidden="true" />
      {period.scene === "kingdom" && (
        <svg className="journey-artwork-jerusalem" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <g className="journey-artwork-jerusalem-town" transform="translate(-18 12)">
            <path d="M704 315v-12h12v-7h15v19zm27-13v-15h10v-6h17v21zm37-14v-13h12v-8h15v21zm34-13v-16h12v-8h18v24zm39 3v-13h10v-8h16v21zm31 15v-16h14v-7h15v23zm32 12v-12h12v-6h14v18zm30 5v-10h12v-5h15v15z" />
            <path className="journey-artwork-jerusalem-temple" d="M808 292h82v5h-82zm5-24h72v24h-72zm-5-5h82v5h-82zm9-9h64v9h-64zm-5-5 37-17 38 17z" />
            <path className="journey-artwork-jerusalem-columns" d="M823 268v22m12-22v22m12-22v22m12-22v22m12-22v22m12-22v22" />
            <path d="M746 328v-11h11v-6h14v17zm29-10v-13h11v-6h15v19zm39-4v-11h10v-5h14v16zm72 8v-13h12v-5h13v18zm33 14v-10h11v-5h13v15z" />
            <path className="journey-artwork-jerusalem-base" d="M694 315Q756 306 809 296H892Q932 313 974 331" />
          </g>
        </svg>
      )}
      {period.scene === "land" && (
        <svg className="journey-artwork-ruth" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <g className="journey-artwork-ruth-figures">
            <circle cx="592" cy="277" r="6" />
            <path d="M588 285Q582 290 578 300L568 313Q566 317 571 319L586 309 597 299 602 315Q610 319 619 316L610 294 600 285Z" />
            <path className="journey-artwork-ruth-arm" d="M598 293Q609 299 620 309" />
            <circle cx="650" cy="273" r="6" />
            <path d="M645 281Q637 289 637 300L631 318Q648 324 666 318L660 297Q659 287 654 281Z" />
          </g>
          <g className="journey-artwork-ruth-grain">
            <path d="M553 319v-20m0 9-5-5m5 10 6-6m34 13v-25m0 11-6-6m6 12 7-7m50 24v-23m0 10-6-6m6 12 7-7m22 27v-20m0 8-5-5m5 11 6-6" />
          </g>
        </svg>
      )}
      {period.scene === "exile" && (
        <svg className="journey-artwork-period-scene journey-artwork-exile-scene" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-scene-water" d="M330 314C452 298 543 322 654 304S848 287 1000 298V316C868 304 758 317 658 329S453 315 330 331Z" />
          <g className="journey-artwork-scene-silhouette">
            <path d="M697 304V260Q725 253 751 266L760 308H751L744 275Q727 263 705 267L705 304Z" />
            <path className="journey-artwork-scene-lines" d="M708 270v31m9-33v33m9-32v32m9-29v28m9-24v22" />
            <path d="M773 319q0-8 8-8h20q8 0 8 8v3h-36z" />
          </g>
        </svg>
      )}
      {period.scene === "return" && (
        <svg className="journey-artwork-period-scene journey-artwork-return-scene" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-scene-silhouette" d="M636 330v-22h25v-17h30v17h40v-12h29v12h31v-27h30v27h41v-17h27v17h45v22z" />
          <path className="journey-artwork-scene-gate" d="M790 330v-19q0-17 16-17t16 17v19z" />
          <path className="journey-artwork-scene-lines" d="M637 322h300m-276-19h27m13 0h34m12 0h28m11 0h37m13 0h31m13 0h34m12 0h30m-300 10h31m16 0h37m15 0h28m14 0h32m16 0h34m14 0h30" />
          <path className="journey-artwork-scene-scroll" d="M758 289h17v3h-17q-4 0-4-4v-5h3v5q0 1 1 1zm20 0h18v3h-18z" />
        </svg>
      )}
      {period.scene === "maccabees" && (
        <svg className="journey-artwork-period-scene journey-artwork-maccabees-scene" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-scene-silhouette" d="M665 323q36-15 73 0v7h-73z" />
          <path className="journey-artwork-scene-lamp" d="M685 310q-10-2-11-10l8-5h23l9 5q-2 8-11 10v7h-18zM675 299l-10-5 1-3 13 3m33 0 10-5 2 3-12 6" />
          <path className="journey-artwork-scene-flame" d="M697 289q-10-8 0-19 8 9 0 19z" />
          <path className="journey-artwork-scene-scroll" d="M737 327h31q4 0 4 4t-4 4h-31q-4 0-4-4t4-4zm1 3v2h25v-2z" />
          <path className="journey-artwork-scene-lines" d="M678 304h31" />
        </svg>
      )}
      {period.scene === "galilee" && (
        <svg className="journey-artwork-period-scene journey-artwork-galilee-scene" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-scene-water" d="M706 309q81-12 160 0v10q-80-9-160 2z" />
          <g className="journey-artwork-scene-silhouette">
            <circle cx="588" cy="274" r="6" />
            <path d="M583 282q-8 7-8 20l-6 17q18 8 35 0l-7-18q-1-12-7-19z" />
            <circle cx="642" cy="287" r="5" />
            <path d="M638 293q-8 5-9 14l-8 8q11 8 26 2l-2-14q-1-7-7-10z" />
            <circle cx="672" cy="289" r="5" />
            <path d="M668 295q-6 7-5 14l-8 7q12 7 25 0l-4-13q-1-6-8-8z" />
          </g>
          <path className="journey-artwork-scene-lines" d="M558 326q55 9 111 0m-91-7q17 4 32 2" />
        </svg>
      )}
      {period.scene === "mission" && (
        <svg className="journey-artwork-period-scene journey-artwork-mission-scene" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-scene-water" d="M638 315q110-12 210 0t152-1v18q-99-8-180 0t-182-1z" />
          <path className="journey-artwork-scene-silhouette" d="M741 307q57 8 117 0l-11 9h-93z" />
          <path className="journey-artwork-scene-sail" d="M789 300v-44q-25 18-25 39zM795 296v-57q33 24 38 56z" />
          <path className="journey-artwork-scene-lines" d="M670 326q24-4 49 0m197-4q27-4 52 0" />
        </svg>
      )}
      {period.scene === "kingdoms" && (
        <svg className="journey-artwork-kingdoms" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
          <path className="journey-artwork-road journey-artwork-road--distant" d="M105 244C104 260 121 280 151 300L165 309C128 291 102 269 99 248Z" />
          <path className="journey-artwork-road journey-artwork-road--near" d="M808 316C795 328 790 341 800 354C811 368 825 379 821 400H886C867 380 847 365 837 351C828 338 833 326 820 316Z" />
          <g className="journey-artwork-roadside-homes journey-artwork-roadside-homes--distant">
            <rect x="72" y="247" width="6" height="8" />
            <rect x="154" y="279" width="7" height="9" />
          </g>
          <g className="journey-artwork-roadside-homes journey-artwork-roadside-homes--near">
            <rect x="749" y="319" width="8" height="10" />
            <rect x="841" y="331" width="7" height="9" />
          </g>
          {[{ houses: distantKingdom, className: "journey-artwork-town--distant" }, { houses: nearKingdom, className: "journey-artwork-town--near" }].map((town) => (
            <g className={`journey-artwork-town ${town.className}`} key={town.className}>
              {town.houses.map((house, houseIndex) => (
                <g key={`${house.x}-${houseIndex}`}>
                  <rect
                    className="journey-artwork-town-building"
                    x={house.x}
                    y={house.y - house.height}
                    width={house.width}
                    height={house.height}
                  />
                  {house.lit && (
                    <rect
                      className="journey-artwork-town-lights"
                      x={house.x + house.width * 0.45}
                      y={house.y - house.height * 0.62}
                      width="1.5"
                      height="1.8"
                    />
                  )}
                </g>
              ))}
            </g>
          ))}
        </svg>
      )}
      {period.scene === "wilderness" && (
        <svg className="journey-artwork-serpent" viewBox="0 0 100 160" aria-hidden="true">
          <path className="journey-artwork-serpent-pole" d="M50 158V13" />
          <path className="journey-artwork-serpent-body" d="M50 140C27 137 27 119 50 116S73 98 50 93 27 76 50 70 72 51 51 45 42 29 56 20" />
          <path className="journey-artwork-serpent-head" d="M53 22C53 16 58 12 66 11L73 14 66 20 57 24Z" />
        </svg>
      )}
      <span className="journey-artwork-motif" aria-hidden="true" />
      <span className="journey-artwork-object journey-artwork-object-one" aria-hidden="true" />
      <span className="journey-artwork-object journey-artwork-object-two" aria-hidden="true" />
      <span className="journey-artwork-object journey-artwork-object-three" aria-hidden="true" />
      <span className="journey-artwork-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      {hero && <figcaption className="journey-artwork-caption">{period.title}</figcaption>}
    </figure>
  );
}
