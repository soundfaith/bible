export type JourneyTheme = "dawn" | "twilight" | "olive";
export type JourneyVariant = "vista" | "sacred";

export type PeriodArtworkProps = {
  periodId: string;
  theme?: JourneyTheme;
  variant?: JourneyVariant;
  className?: string;
  index?: number;
  hero?: boolean;
};

export const JOURNEY_THEME_STORAGE_KEY = "soundfaith-journey-artwork-theme-v1";
export const JOURNEY_VARIANT_STORAGE_KEY = "soundfaith-journey-artwork-variant-v1";

export function getSavedJourneyTheme(): JourneyTheme {
  try {
    const saved = window.localStorage.getItem(JOURNEY_THEME_STORAGE_KEY);
    return saved === "twilight" || saved === "olive" || saved === "dawn" ? saved : "dawn";
  } catch {
    return "dawn";
  }
}

export function saveJourneyTheme(theme: JourneyTheme): void {
  try {
    window.localStorage.setItem(JOURNEY_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

export function getSavedJourneyVariant(): JourneyVariant {
  try {
    const saved = window.localStorage.getItem(JOURNEY_VARIANT_STORAGE_KEY);
    return saved === "sacred" || saved === "vista" ? saved : "vista";
  } catch {
    return "vista";
  }
}

export function saveJourneyVariant(variant: JourneyVariant): void {
  try {
    window.localStorage.setItem(JOURNEY_VARIANT_STORAGE_KEY, variant);
  } catch {
    // Ignore storage errors
  }
}

export function JourneyPeriodArtwork({
  periodId,
  theme = "dawn",
  variant = "vista",
  className = "",
  index,
  hero = false,
}: PeriodArtworkProps) {
  const containerClass = `journey-period-art journey-period-art--${theme} journey-period-art--${periodId} ${className}`.trim();

  return (
    <div className={containerClass} data-theme={theme} data-variant={variant}>
      {renderPeriodSvg(periodId, variant)}
      {typeof index === "number" && (
        <span className="journey-art-badge" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

function renderPeriodSvg(periodId: string, variant: JourneyVariant) {
  switch (periodId) {
    case "a-world-awakened":
      return variant === "vista" ? <BeginningsVista /> : <BeginningsSacred />;
    case "a-promise-takes-root":
      return variant === "vista" ? <PromiseVista /> : <PromiseSacred />;
    case "freedom-and-belonging":
      return variant === "vista" ? <FreedomVista /> : <FreedomSacred />;
    case "a-kingdom-under-question":
      return variant === "vista" ? <DesertVista /> : <DesertSacred />;
    case "voices-for-the-road-home":
      return variant === "vista" ? <LandVista /> : <LandSacred />;
    case "good-news-in-a-small-town":
      return variant === "vista" ? <DavidVista /> : <DavidSacred />;
    case "love-given-to-the-end":
      return variant === "vista" ? <KingdomsVista /> : <KingdomsSacred />;
    case "morning-beyond-the-stone":
      return variant === "vista" ? <ExileVista /> : <ExileSacred />;
    case "a-welcome-without-borders":
      return variant === "vista" ? <ReturnVista /> : <ReturnSacred />;
    case "the-maccabean-resistance":
      return variant === "vista" ? <MaccabeesVista /> : <MaccabeesSacred />;
    case "learning-to-be-one-body":
    case "a-future-worth-living-toward":
      return variant === "vista" ? <JesusVista /> : <JesusSacred />;
    case "the-story-in-our-hands":
      return variant === "vista" ? <MissionVista /> : <MissionSacred />;
    default:
      return <BeginningsVista />;
  }
}

/* =========================================================================
   1. BEGINNINGS (Creation, Eden Tree, First Light)
   ========================================================================= */

function BeginningsVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="beg-sun" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--art-sun-core)" stopOpacity="0.9" />
          <stop offset="35%" stopColor="var(--art-sun-mid)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--art-sun-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Sun glow */}
      <circle cx="200" cy="90" r="75" fill="url(#beg-sun)" />
      {/* Sun rays */}
      <path className="art-ray" d="M200 40v-16m35 15l12-12m18 33h16m-15 35l12 12m-33 18v16m-35-15l-12 12m-18-33h-16m15-35l-12-12" />
      {/* Distant primeval hills */}
      <path className="art-mountain-far" d="M0 135l55-18 65-20 80 18 80-24 65 22 55 12v65H0z" />
      {/* Midground land */}
      <path className="art-mountain-mid" d="M0 152q90-28 190-10t210 8v50H0z" />
      {/* Waters of creation */}
      <path className="art-water" d="M0 162q100-14 200-2t200 6v34H0z" />
      <path className="art-water-lines" d="M60 174q40-4 90 2m90-4q50 4 100-2m-220 12q60-3 120 1m50-2q60 3 110-1" />
      {/* Foreground Eden Hill */}
      <path className="art-ground" d="M0 178q70-22 140-12t110 34H0z" />
      {/* The Tree of Life */}
      <g className="art-focal" transform="translate(62, 94)">
        {/* Trunk & branches */}
        <path className="art-tree-trunk" d="M24 74c0-16 2-30 6-38c-8-6-14-16-16-24c10 2 18 8 22 16c6-10 16-16 26-18c-2 8-8 16-16 22c4 6 7 14 8 22c2 6 3 12 4 20z" />
        {/* Canopy foliage */}
        <circle className="art-foliage-back" cx="30" cy="24" r="22" />
        <circle className="art-foliage-back" cx="50" cy="20" r="18" />
        <circle className="art-foliage-mid" cx="16" cy="30" r="14" />
        <circle className="art-foliage-mid" cx="44" cy="28" r="16" />
        <circle className="art-foliage-front" cx="32" cy="18" r="14" />
        {/* Blossom fruits */}
        <circle className="art-blossom" cx="22" cy="20" r="2.2" />
        <circle className="art-blossom" cx="34" cy="14" r="2" />
        <circle className="art-blossom" cx="46" cy="24" r="2.2" />
        <circle className="art-blossom" cx="32" cy="28" r="2" />
      </g>
      {/* Radiance star in the dawn */}
      <circle className="art-star-glow" cx="300" cy="56" r="12" />
      <path className="art-star" d="M300 44q0 12 12 12q-12 0-12 12q0-12-12-12q12 0 12-12z" />
    </svg>
  );
}

function BeginningsSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Ark on Mount Ararat waters */}
      <path className="art-mountain-far" d="M0 130l90-25 110-35 100 32 100 24v74H0z" />
      {/* Rainbow arc */}
      <path className="art-rainbow" d="M80 150A130 130 0 0 1 320 150" />
      <path className="art-water" d="M0 150q100-12 200 2t200 0v48H0z" />
      <path className="art-water-lines" d="M40 168q80-6 160 2m40-2q70 4 120-3" />
      {/* Ark */}
      <g className="art-focal" transform="translate(165, 122)">
        <path className="art-ark-hull" d="M8 26l8 12h42l8-12z" />
        <rect className="art-ark-cabin" x="22" y="14" width="28" height="12" rx="1" />
        <path className="art-ark-roof" d="M19 14l17-8 17 8z" />
        <circle className="art-ark-window" cx="36" cy="20" r="2" />
        {/* Olive dove in sky */}
        <path className="art-dove" d="M60-8q-6 6-12 6q6 4 12 4q-3 6-3 10q6-4 12-6q-6-4-9-14z" />
      </g>
    </svg>
  );
}

/* =========================================================================
   2. FAMILY OF THE PROMISE (Abraham, Starlit Tent, Caravan)
   ========================================================================= */

function PromiseVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Starfield */}
      <g className="art-stars">
        <circle cx="50" cy="35" r="1.5" />
        <circle cx="85" cy="20" r="1.2" />
        <circle cx="120" cy="45" r="1.5" />
        <circle cx="160" cy="25" r="1.8" />
        <circle cx="230" cy="30" r="1.5" />
        <circle cx="280" cy="45" r="1.8" />
        <circle cx="330" cy="25" r="1.2" />
        <circle cx="360" cy="50" r="1.6" />
      </g>
      {/* Promise Star with rays */}
      <circle className="art-star-glow" cx="190" cy="38" r="18" />
      <path className="art-star" d="M190 18q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
      <path className="art-star-rays" d="M190 12v6m0 40v6m-26-26h6m40 0h6" />
      {/* Distant dunes */}
      <path className="art-mountain-far" d="M0 136q80-26 180-8t220 4v68H0z" />
      {/* Midground dunes */}
      <path className="art-mountain-mid" d="M0 156q110-32 230-10t170 12v42H0z" />
      {/* Foreground dune and path */}
      <path className="art-ground" d="M0 174q90-16 190 2t210-4v28H0z" />
      <path className="art-path" d="M160 200C160 185 220 175 220 162C220 150 180 144 180 132" />
      {/* Nomadic Tent */}
      <g className="art-focal" transform="translate(85, 134)">
        <path className="art-tent" d="M0 38L32 10L68 38z" />
        <path className="art-tent-door" d="M26 38L34 22L42 38z" />
        <line className="art-tent-pole" x1="32" y1="8" x2="32" y2="38" />
        <line className="art-tent-rope" x1="0" y1="38" x2="-8" y2="44" />
        <line className="art-tent-rope" x1="68" y1="38" x2="76" y2="44" />
      </g>
      {/* Small camel caravan silhouette */}
      <g className="art-caravan" transform="translate(265, 142)">
        <ellipse cx="14" cy="12" rx="7" ry="5" />
        <path d="M18 10q4-6 8-4t-2 8" />
        <circle cx="26" cy="6" r="2" />
        <line x1="10" y1="16" x2="9" y2="24" />
        <line x1="17" y1="16" x2="18" y2="24" />
        {/* Second smaller camel */}
        <ellipse cx="38" cy="13" rx="5" ry="4" />
        <path d="M41 11q3-4 6-3t-2 6" />
        <line x1="35" y1="16" x2="35" y2="22" />
        <line x1="40" y1="16" x2="41" y2="22" />
      </g>
    </svg>
  );
}

function PromiseSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Bethel / Moriah Altars */}
      <g className="art-stars">
        <circle cx="70" cy="30" r="1.5" />
        <circle cx="140" cy="20" r="1.2" />
        <circle cx="260" cy="25" r="1.5" />
        <circle cx="330" cy="40" r="1.5" />
      </g>
      <circle className="art-star-glow" cx="200" cy="40" r="20" />
      <path className="art-star" d="M200 20q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
      <path className="art-mountain-far" d="M0 135l110-30 90-15 100 25 100 20v70H0z" />
      <path className="art-mountain-mid" d="M0 154q120-24 220 2t180 8v36H0z" />
      <path className="art-ground" d="M0 176q90-12 200 2t200 0v22H0z" />
      {/* Stone Altar & Ram */}
      <g className="art-focal" transform="translate(165, 142)">
        <rect className="art-altar-stone" x="15" y="18" width="40" height="18" rx="2" />
        <rect className="art-altar-stone" x="18" y="10" width="34" height="10" rx="1" />
        <path className="art-flame" d="M35 10q-6-10 0-16q6 6 0 16z" />
      </g>
    </svg>
  );
}

/* =========================================================================
   3. FREEDOM AND COVENANT (Red Sea Crossing, Mt. Sinai)
   ========================================================================= */

function FreedomVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Sinai cloud glow */}
      <circle className="art-sun-glow" cx="200" cy="65" r="55" />
      {/* Towering Mount Sinai in distance */}
      <path className="art-mountain-far" d="M80 145L160 75L200 60L240 75L320 145v55H80z" />
      {/* Cloud envelope atop Sinai */}
      <ellipse className="art-cloud" cx="200" cy="60" rx="42" ry="12" />
      <ellipse className="art-cloud" cx="185" cy="54" rx="26" ry="10" />
      <ellipse className="art-cloud" cx="215" cy="54" rx="28" ry="10" />
      {/* Towering Left Water Wall */}
      <path className="art-sea-wall-left" d="M0 200V120q40 10 70-15t35-30q10 30-20 60t-20 65z" />
      {/* Towering Right Water Wall */}
      <path className="art-sea-wall-right" d="M400 200V120q-40 10-70-15t-35-30q-10 30 20 60t20 65z" />
      {/* Dry pathway opening down the center */}
      <path className="art-dry-path" d="M185 130L140 200H260L215 130z" />
      <path className="art-path-line" d="M200 132L200 200" />
      {/* Moses staff on ridge */}
      <g className="art-focal" transform="translate(110, 140)">
        <line className="art-staff" x1="12" y1="0" x2="8" y2="42" />
        <path className="art-staff-curve" d="M12 0Q16-6 12-10Q8-8 10-2" />
      </g>
    </svg>
  );
}

function FreedomSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Sinai Summit & Covenant Tablets */}
      <circle className="art-sun-glow" cx="200" cy="80" r="60" />
      <path className="art-mountain-far" d="M0 145l100-45 100-35 100 35 100 45v55H0z" />
      <path className="art-ground" d="M0 168q100-14 200 2t200-2v32H0z" />
      {/* Two Tablets of the Law */}
      <g className="art-focal" transform="translate(172, 85)">
        <rect className="art-tablet" x="4" y="10" width="22" height="34" rx="10" />
        <rect className="art-tablet" x="30" y="10" width="22" height="34" rx="10" />
        <line className="art-tablet-text" x1="9" y1="22" x2="21" y2="22" />
        <line className="art-tablet-text" x1="9" y1="28" x2="21" y2="28" />
        <line className="art-tablet-text" x1="9" y1="34" x2="21" y2="34" />
        <line className="art-tablet-text" x1="35" y1="22" x2="47" y2="22" />
        <line className="art-tablet-text" x1="35" y1="28" x2="47" y2="28" />
        <line className="art-tablet-text" x1="35" y1="34" x2="47" y2="34" />
      </g>
    </svg>
  );
}

/* =========================================================================
   4. DESERT FORMATION (Wilderness, Tabernacle Pillar, Manna)
   ========================================================================= */

function DesertVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Morning sun */}
      <circle className="art-sun-glow" cx="290" cy="85" r="45" />
      <circle className="art-sun" cx="290" cy="85" r="16" />
      {/* Wilderness jagged mountain range */}
      <path className="art-mountain-far" d="M0 134l60-24 75 16 65-30 60 22 75-18 65 34v66H0z" />
      {/* Desert plateau */}
      <path className="art-mountain-mid" d="M0 152q100-20 200 4t200-8v52H0z" />
      {/* Foreground desert plain */}
      <path className="art-ground" d="M0 172q110-14 220 2t180-2v28H0z" />
      {/* Pillar of Cloud / Fire rising from sanctuary */}
      <path className="art-pillar" d="M192 145C192 100 186 70 196 35C200 20 208 20 208 35C216 70 210 100 210 145Z" />
      {/* Tabernacle Tent */}
      <g className="art-focal" transform="translate(176, 142)">
        <rect className="art-tabernacle-court" x="-25" y="14" width="84" height="18" rx="1" />
        <path className="art-tent" d="M4 22L17 12L30 22z" />
      </g>
      {/* Manna scattered at dawn */}
      <g className="art-manna">
        <circle cx="65" cy="182" r="1.5" />
        <circle cx="85" cy="178" r="1.8" />
        <circle cx="105" cy="185" r="1.5" />
        <circle cx="130" cy="180" r="1.8" />
        <circle cx="270" cy="184" r="1.6" />
        <circle cx="295" cy="179" r="1.8" />
        <circle cx="325" cy="183" r="1.5" />
      </g>
    </svg>
  );
}

function DesertSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Bronze Serpent on Pole in Wilderness */}
      <circle className="art-sun-glow" cx="200" cy="75" r="40" />
      <path className="art-mountain-far" d="M0 138l95-26 105-18 105 24 95 20v62H0z" />
      <path className="art-ground" d="M0 170q100-12 200 4t200-4v30H0z" />
      {/* Bronze Serpent Standard */}
      <g className="art-focal" transform="translate(195, 65)">
        <line className="art-pole" x1="5" y1="0" x2="5" y2="105" />
        <line className="art-pole" x1="-12" y1="20" x2="22" y2="20" />
        {/* Serpent winding */}
        <path className="art-serpent" d="M5 90C-10 82-10 68 5 62S20 48 5 40S-8 28 5 22C16 16 16 6 5 2" />
      </g>
    </svg>
  );
}

/* =========================================================================
   5. LIFE IN THE LAND (Jordan Crossing, 12 Stones, Harvest)
   ========================================================================= */

function LandVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Warm sun over Canaan */}
      <circle className="art-sun-glow" cx="200" cy="75" r="50" />
      <circle className="art-sun" cx="200" cy="75" r="18" />
      {/* Terraced hills of Canaan */}
      <path className="art-mountain-far" d="M0 128q100-24 200 4t200-14v82H0z" />
      <path className="art-mountain-mid" d="M0 148q120-22 230 6t170 4v42H0z" />
      {/* River Jordan winding */}
      <path className="art-water" d="M175 140C185 152 230 160 230 172C230 186 160 190 160 200H240C240 188 280 180 280 168C280 155 210 148 210 140Z" />
      {/* Foreground Wheat field terraces */}
      <path className="art-ground" d="M0 166q80-14 160 2t100 32H0z" />
      {/* 12 Stones of Remembrance Cairn */}
      <g className="art-focal" transform="translate(110, 162)">
        <ellipse className="art-cairn-stone" cx="20" cy="24" rx="14" ry="5.5" />
        <ellipse className="art-cairn-stone" cx="20" cy="16" rx="11" ry="4.5" />
        <ellipse className="art-cairn-stone" cx="21" cy="9" rx="8" ry="3.5" />
        <ellipse className="art-cairn-stone" cx="21" cy="3" rx="5" ry="2.5" />
      </g>
      {/* Sheaves of wheat */}
      <g className="art-wheat-sheaf" transform="translate(60, 160)">
        <path d="M10 28q6-16 12-24m-12 24q-2-16-6-24m6 24v-26" />
        <circle cx="22" cy="4" r="1.5" />
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="10" cy="2" r="1.5" />
      </g>
    </svg>
  );
}

function LandSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Ruth in the Harvest Field */}
      <circle className="art-sun-glow" cx="260" cy="70" r="45" />
      <path className="art-mountain-far" d="M0 135q110-25 210 5t190-10v70H0z" />
      <path className="art-ground" d="M0 162q90-12 190 4t210 2v32H0z" />
      {/* Golden wheat stalks across foreground */}
      <g className="art-wheat-field">
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={i}
            className="art-wheat-stalk"
            d={`M${40 + i * 24} 200q${(i % 2 === 0 ? 4 : -4)} -22 ${(i % 3 === 0 ? 8 : -6)} -38`}
          />
        ))}
      </g>
    </svg>
  );
}

/* =========================================================================
   6. THE HOUSE OF DAVID (Mount Zion, Solomon's Temple)
   ========================================================================= */

function DavidVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Golden hour glow on Jerusalem */}
      <circle className="art-sun-glow" cx="200" cy="80" r="65" />
      {/* Mount Moriah ridge */}
      <path className="art-mountain-far" d="M0 142q90-25 200-15t200 10v63H0z" />
      {/* City of David ramparts */}
      <path className="art-city-walls" d="M60 145h280v15H60z" />
      <path className="art-city-battlement" d="M60 145v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6m14 0v-6h12v6" />
      {/* Solomon's Temple Facade */}
      <g className="art-focal" transform="translate(155, 82)">
        {/* Temple base and main body */}
        <rect className="art-temple-wall" x="10" y="24" width="70" height="38" />
        <rect className="art-temple-roof" x="6" y="20" width="78" height="5" />
        {/* Upper porch */}
        <rect className="art-temple-porch" x="25" y="6" width="40" height="15" />
        <polygon className="art-temple-roof" points="22,6 45,-2 68,6" />
        {/* Two bronze pillars: Jachin & Boaz */}
        <rect className="art-pillar-bronze" x="18" y="24" width="6" height="38" />
        <rect className="art-pillar-bronze" x="66" y="24" width="6" height="38" />
        <ellipse className="art-pillar-capital" cx="21" cy="24" rx="5" ry="3" />
        <ellipse className="art-pillar-capital" cx="69" cy="24" rx="5" ry="3" />
        {/* Golden entrance door */}
        <rect className="art-temple-door" x="38" y="36" width="14" height="26" rx="3" />
      </g>
      {/* Foreground terraces with olive trees */}
      <path className="art-ground" d="M0 170q110-18 210 2t190 2v26H0z" />
      <g className="art-olive-tree" transform="translate(68, 142)">
        <path d="M12 28q-2-12 2-18q-4-4-6-10" />
        <circle cx="12" cy="8" r="10" />
        <circle cx="6" cy="12" r="7" />
      </g>
      <g className="art-olive-tree" transform="translate(320, 145)">
        <path d="M10 26q2-10-2-16" />
        <circle cx="8" cy="8" r="9" />
      </g>
    </svg>
  );
}

function DavidSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* David's Harp & Royal Crown */}
      <circle className="art-sun-glow" cx="200" cy="75" r="50" />
      <path className="art-mountain-far" d="M0 138l100-24 100-10 100 20 100 14v62H0z" />
      <path className="art-ground" d="M0 172q100-12 200 4t200-4v28H0z" />
      {/* Lyre / Harp of David */}
      <g className="art-focal" transform="translate(176, 85)">
        <path className="art-harp-frame" d="M8 72C8 40 18 20 28 8C34 22 42 36 44 72" />
        <line className="art-harp-base" x1="4" y1="72" x2="48" y2="72" />
        <line className="art-harp-string" x1="16" y1="58" x2="16" y2="72" />
        <line className="art-harp-string" x1="22" y1="44" x2="22" y2="72" />
        <line className="art-harp-string" x1="28" y1="32" x2="28" y2="72" />
        <line className="art-harp-string" x1="34" y1="42" x2="34" y2="72" />
        <line className="art-harp-string" x1="40" y1="56" x2="40" y2="72" />
        {/* Royal Crown atop */}
        <polygon className="art-crown" points="16,-6 20,-16 26,-8 32,-16 36,-6" />
      </g>
    </svg>
  );
}

/* =========================================================================
   7. TWO KINGDOMS (Divided Hills, Elijah's Fire on Carmel)
   ========================================================================= */

function KingdomsVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Stormy vs amber sky divider */}
      <circle className="art-sun-glow" cx="120" cy="65" r="45" />
      {/* Two divided mountain crests separated by a gorge */}
      <path className="art-mountain-far" d="M0 140l80-35 80 40v55H0z" />
      <path className="art-mountain-far" d="M240 145l80-38 80 32v61H240z" />
      {/* Deep rift valley in center */}
      <path className="art-mountain-mid" d="M0 162q90-20 170 0v38H0z" />
      <path className="art-mountain-mid" d="M230 162q80-18 170 0v38H230z" />
      {/* Divine fire descending from heaven on altar */}
      <path className="art-divine-ray" d="M100 0L92 105L108 105Z" />
      {/* Mount Carmel Altar */}
      <g className="art-focal" transform="translate(84, 100)">
        <rect className="art-altar-stone" x="0" y="8" width="28" height="14" rx="2" />
        <path className="art-flame" d="M14 8C8-4 8-14 14-22C20-14 20-4 14 8Z" />
      </g>
      {/* Ancient Watchtower on border */}
      <g className="art-focal" transform="translate(305, 96)">
        <rect className="art-tower" x="0" y="8" width="22" height="34" />
        <rect className="art-tower-top" x="-3" y="4" width="28" height="5" />
        <line className="art-tower-slit" x1="11" y1="16" x2="11" y2="24" />
      </g>
      {/* Foreground ravine */}
      <path className="art-ground" d="M0 182q100-14 200 4t200-4v18H0z" />
    </svg>
  );
}

function KingdomsSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Elijah's Chariot & Mantle */}
      <path className="art-divine-ray" d="M200 0L170 120h60Z" />
      <path className="art-mountain-far" d="M0 135q100-24 200 0t200-12v77H0z" />
      <path className="art-ground" d="M0 170q100-12 200 2t200-2v30H0z" />
      <g className="art-focal" transform="translate(182, 100)">
        <ellipse className="art-chariot-wheel" cx="18" cy="28" rx="14" ry="14" />
        <path className="art-flame" d="M18 14C10 0 10-12 18-20C26-12 26 0 18 14Z" />
      </g>
    </svg>
  );
}

/* =========================================================================
   8. EXILE AND FAITHFULNESS (Rivers of Babylon, Weeping Willow, Harp)
   ========================================================================= */

function ExileVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Twilight evening star over Euphrates */}
      <circle className="art-star-glow" cx="300" cy="45" r="16" />
      <path className="art-star" d="M300 33q0 12 12 12q-12 0-12 12q0-12-12-12q12 0 12-12z" />
      {/* Distant Babylonian Ziggurat & Walls */}
      <g className="art-babylon-distant" transform="translate(230, 95)">
        <rect x="20" y="24" width="70" height="24" />
        <rect x="32" y="14" width="46" height="11" />
        <rect x="44" y="6" width="22" height="9" />
        <rect x="50" y="0" width="10" height="6" />
      </g>
      {/* Rivers of Babylon */}
      <path className="art-water" d="M0 148q110-14 220 4t180-2v50H0z" />
      <path className="art-water-lines" d="M50 162q70-4 140 2m60-2q60 4 110-2" />
      {/* Riverbank with weeping willow */}
      <path className="art-ground" d="M0 168q90-14 170 0t80 32H0z" />
      {/* Weeping Willow tree */}
      <g className="art-focal" transform="translate(45, 90)">
        <path className="art-willow-trunk" d="M22 88C22 65 30 50 44 42" />
        {/* Cascading willow branches */}
        <path className="art-willow-leaves" d="M44 42C25 48 15 65 14 85m30-43C35 55 28 72 26 88m18-46C48 58 48 74 46 90m-2-48C60 52 70 68 74 86m-30-44C66 48 82 58 92 78" />
        {/* Harp hanging from branch */}
        <g transform="translate(54, 46) rotate(12)">
          <path className="art-harp-frame" d="M0 26C0 14 4 6 10 0C13 8 16 14 18 26" />
          <line className="art-harp-base" x1="-1" y1="26" x2="19" y2="26" />
          <line className="art-harp-string" x1="5" y1="12" x2="5" y2="26" />
          <line className="art-harp-string" x1="9" y1="6" x2="9" y2="26" />
          <line className="art-harp-string" x1="13" y1="12" x2="13" y2="26" />
        </g>
      </g>
    </svg>
  );
}

function ExileSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Valley of Dry Bones into Life */}
      <circle className="art-sun-glow" cx="200" cy="70" r="50" />
      <path className="art-mountain-far" d="M0 140l100-24 100-10 100 22 100 12v60H0z" />
      <path className="art-ground" d="M0 172q100-12 200 4t200-4v28H0z" />
      {/* Four winds of the Spirit */}
      <path className="art-spirit-wind" d="M60 80q50-20 110 0t110-10m-200 30q60-15 120 5t100-10" />
      <g className="art-focal" transform="translate(180, 130)">
        <rect className="art-scroll" x="0" y="10" width="40" height="24" rx="2" />
        <ellipse className="art-scroll-end" cx="0" cy="22" rx="3" ry="12" />
        <ellipse className="art-scroll-end" cx="40" cy="22" rx="3" ry="12" />
      </g>
    </svg>
  );
}

/* =========================================================================
   9. HOMECOMING AND RENEWAL (Rebuilding Walls, Ezra's Scroll)
   ========================================================================= */

function ReturnVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Fresh morning sun */}
      <circle className="art-sun-glow" cx="140" cy="65" r="48" />
      <circle className="art-sun" cx="140" cy="65" r="16" />
      {/* Mount Zion ridge */}
      <path className="art-mountain-far" d="M0 135l80-20 90-15 110 24 120 16v60H0z" />
      {/* Rebuilt Stone Wall of Jerusalem with Scaffolding */}
      <g className="art-rebuilding-wall" transform="translate(120, 105)">
        <rect className="art-wall-block" x="0" y="25" width="220" height="28" />
        <path className="art-wall-mortar" d="M0 38h220m-180-13v28m50-28v28m50-28v28m50-28v28" />
        {/* Scaffolding beams */}
        <line className="art-wood-beam" x1="45" y1="10" x2="45" y2="53" />
        <line className="art-wood-beam" x1="95" y1="10" x2="95" y2="53" />
        <line className="art-wood-beam" x1="35" y1="20" x2="105" y2="20" />
        {/* Restored City Gate */}
        <rect className="art-gate-arch" x="135" y="15" width="45" height="38" rx="8" />
        <path className="art-gate-door" d="M142 53v-26q0-8 15-8t15 8v26z" />
      </g>
      {/* Foreground road of return */}
      <path className="art-ground" d="M0 168q90-14 180 2t220 0v30H0z" />
      <path className="art-path" d="M120 200C150 185 240 178 270 162" />
      {/* Ezra's Open Scroll */}
      <g className="art-focal" transform="translate(65, 142)">
        <rect className="art-scroll" x="0" y="6" width="36" height="22" rx="2" />
        <line className="art-scroll-text" x1="6" y1="12" x2="30" y2="12" />
        <line className="art-scroll-text" x1="6" y1="17" x2="30" y2="17" />
        <line className="art-scroll-text" x1="6" y1="22" x2="22" y2="22" />
      </g>
    </svg>
  );
}

function ReturnSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Foundation Stone & Trowel */}
      <circle className="art-sun-glow" cx="200" cy="70" r="45" />
      <path className="art-mountain-far" d="M0 138l100-20 100-12 100 20 100 14v60H0z" />
      <path className="art-ground" d="M0 170q100-12 200 4t200-4v30H0z" />
      <g className="art-focal" transform="translate(170, 115)">
        <rect className="art-stone-block" x="0" y="24" width="60" height="28" rx="2" />
        <polygon className="art-trowel" points="30,8 46,18 26,20" />
        <line className="art-trowel-handle" x1="26" y1="20" x2="16" y2="26" />
      </g>
    </svg>
  );
}

/* =========================================================================
   10. RESISTANCE AND HOPE (Cleansed Sanctuary, Menorah)
   ========================================================================= */

function MaccabeesVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Luminous sanctuary radiance */}
      <circle className="art-sanctuary-glow" cx="200" cy="95" r="75" />
      {/* Stone Archway of the Temple Sanctuary */}
      <path className="art-temple-arch" d="M80 200V80q0-45 120-45t120 45v120h-35V95q0-30-85-30t-85 30v105z" />
      {/* Golden Menorah */}
      <g className="art-focal" transform="translate(158, 80)">
        {/* Base */}
        <polygon className="art-menorah-base" points="34,80 50,80 44,72 40,72" />
        <line className="art-menorah-stem" x1="42" y1="72" x2="42" y2="18" />
        {/* 3 Concentric curved arms */}
        <path className="art-menorah-arm" d="M12 24C12 55 42 55 42 55" />
        <path className="art-menorah-arm" d="M72 24C72 55 42 55 42 55" />
        <path className="art-menorah-arm" d="M22 24C22 45 42 45 42 45" />
        <path className="art-menorah-arm" d="M62 24C62 45 42 45 42 45" />
        <path className="art-menorah-arm" d="M32 24C32 35 42 35 42 35" />
        <path className="art-menorah-arm" d="M52 24C52 35 42 35 42 35" />
        {/* 7 Cups & Golden Flames */}
        {[12, 22, 32, 42, 52, 62, 72].map((x) => (
          <g key={x}>
            <ellipse className="art-menorah-cup" cx={x} cy="24" rx="3.5" ry="2" />
            <path className="art-flame" d={`M${x} 22q-3-7 0-14q3 7 0 14z`} />
            <circle className="art-flame-glow" cx={x} cy="15" r="5" />
          </g>
        ))}
      </g>
      {/* Pavement ground */}
      <path className="art-ground" d="M0 185h400v15H0z" />
    </svg>
  );
}

function MaccabeesSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Shield and Sword in Mountain Fortress */}
      <circle className="art-sun-glow" cx="200" cy="70" r="45" />
      <path className="art-mountain-far" d="M0 135l100-30 100-15 100 25 100 20v65H0z" />
      <path className="art-ground" d="M0 172q100-12 200 4t200-4v28H0z" />
      <g className="art-focal" transform="translate(182, 90)">
        <polygon className="art-shield" points="18,10 36,18 36,54 18,68 0,54 0,18" />
        <line className="art-sword" x1="18" y1="-5" x2="18" y2="75" />
        <line className="art-sword-hilt" x1="6" y1="8" x2="30" y2="8" />
      </g>
    </svg>
  );
}

/* =========================================================================
   11. JESUS: LIFE, DEATH, RESURRECTION (Empty Tomb, Galilee Dawn)
   ========================================================================= */

function JesusVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Glorious Resurrection Dawn Sunburst */}
      <circle className="art-sun-glow" cx="200" cy="85" r="75" />
      <circle className="art-sun" cx="200" cy="85" r="22" />
      {/* Gentle dawn sun rays */}
      <path className="art-ray" d="M200 45v-20m40 20l14-14m20 40h20m-20 40l14 14m-40 20v20m-40-20l-14 14m-20-40h-20m20-40l-14-14" />
      {/* Rolling hills of Jerusalem / Judea */}
      <path className="art-mountain-far" d="M0 136q100-25 200-5t200 12v57H0z" />
      {/* Calvary with 3 subtle crosses on distant right ridge */}
      <g className="art-distant-crosses" transform="translate(325, 122)">
        <line x1="15" y1="0" x2="15" y2="18" />
        <line x1="10" y1="5" x2="20" y2="5" />
        <line x1="5" y1="4" x2="5" y2="16" />
        <line x1="2" y1="8" x2="8" y2="8" />
        <line x1="25" y1="4" x2="25" y2="16" />
        <line x1="22" y1="8" x2="28" y2="8" />
      </g>
      {/* Garden Hill with Rock-Hewn Tomb on left */}
      <path className="art-ground" d="M0 162q90-20 180-6t220 20v24H0z" />
      {/* Open Empty Tomb with Rolled-Away Stone */}
      <g className="art-focal" transform="translate(90, 118)">
        {/* Rock cave entrance */}
        <path className="art-tomb-cave" d="M0 54V24Q0 4 28 4T56 24V54Z" />
        {/* Radiant interior of tomb */}
        <path className="art-tomb-interior" d="M8 54V28Q8 12 28 12T48 28V54Z" />
        {/* Great circular stone rolled back */}
        <circle className="art-tomb-stone" cx="64" cy="36" r="20" />
      </g>
      {/* Easter Lilies in the garden */}
      <g className="art-lilies" transform="translate(185, 162)">
        <path d="M6 18q2-10 6-14m-6 14q-2-8-6-12" />
        <circle cx="12" cy="4" r="2.5" />
        <circle cx="0" cy="6" r="2.5" />
      </g>
    </svg>
  );
}

function JesusSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Galilee Shore at Dawn with Fishing Boat */}
      <circle className="art-sun-glow" cx="200" cy="75" r="50" />
      <path className="art-mountain-far" d="M0 128q110-24 210 6t190-8v74H0z" />
      {/* Sea of Galilee */}
      <path className="art-water" d="M0 148q100-10 200 2t200 0v50H0z" />
      {/* Galilean Fishing Boat */}
      <g className="art-focal" transform="translate(160, 130)">
        <path className="art-boat-hull" d="M4 22C14 36 66 36 76 22H4Z" />
        <line className="art-boat-mast" x1="40" y1="4" x2="40" y2="28" />
        <path className="art-boat-sail" d="M40 6Q62 14 40 22Z" />
      </g>
      {/* Foreground shoreline */}
      <path className="art-ground" d="M0 178q80-14 170 0t230 4v18H0z" />
    </svg>
  );
}

/* =========================================================================
   12. THE CHURCH IN MISSION (Merchant Ship, Roman Road, Pentecost)
   ========================================================================= */

function MissionVista() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Radiant sky with guiding Pentecost Beacon */}
      <circle className="art-star-glow" cx="200" cy="45" r="22" />
      <path className="art-star" d="M200 25q0 20 20 20q-20 0-20 20q0-20-20-20q20 0 20-20z" />
      {/* Distant Mediterranean coast & ancient harbor */}
      <path className="art-mountain-far" d="M0 135l80-24 100 12 110-20 110 32v65H0z" />
      {/* Open sea waters */}
      <path className="art-water" d="M0 145q100-10 200 4t200-2v53H0z" />
      <path className="art-water-lines" d="M40 160q60-6 120 2m80-2q70 4 120-2m-270 18q70-4 140 2m60-2q70 4 120-2" />
      {/* Ancient Merchant Ship (Paul's voyage) sailing across */}
      <g className="art-focal" transform="translate(170, 95)">
        {/* Hull */}
        <path className="art-ship-hull" d="M6 46C18 60 52 60 64 46H6Z" />
        <line className="art-ship-mast" x1="35" y1="12" x2="35" y2="52" />
        {/* Billowing square sail */}
        <path className="art-ship-sail" d="M15 16Q35 24 55 16Q45 36 35 44Q25 36 15 16Z" />
      </g>
      {/* Coastal promontory in foreground with beacon light */}
      <path className="art-ground" d="M0 178q70-18 140 0t110 22H0z" />
      <g className="art-beacon" transform="translate(70, 142)">
        <rect className="art-beacon-base" x="4" y="16" width="16" height="24" rx="2" />
        <path className="art-flame" d="M12 16q-5-10 0-18q5 8 0 18z" />
        <circle className="art-flame-glow" cx="12" cy="7" r="8" />
      </g>
    </svg>
  );
}

function MissionSacred() {
  return (
    <svg className="journey-card-artwork" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* Roman Road stretching to all nations */}
      <circle className="art-sun-glow" cx="200" cy="70" r="50" />
      <path className="art-mountain-far" d="M0 136l100-24 100-12 100 22 100 14v64H0z" />
      <path className="art-ground" d="M0 168q100-14 200 4t200-4v28H0z" />
      {/* Perspective Roman Road */}
      <polygon className="art-roman-road" points="190,135 210,135 270,200 130,200" />
      <line className="art-road-center" x1="200" y1="135" x2="200" y2="200" strokeDasharray="6 6" />
      {/* Milestone on the road */}
      <g className="art-focal" transform="translate(145, 150)">
        <rect className="art-milestone" x="0" y="8" width="14" height="22" rx="4" />
      </g>
    </svg>
  );
}
