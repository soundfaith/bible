const svgProps = {
  className: "landing-card-artwork",
  viewBox: "0 0 400 200",
  preserveAspectRatio: "xMidYMid slice",
  focusable: false,
} as const;

export function LandingBibleArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="lb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a4058" />
          <stop offset=".55" stopColor="#c59a7d" />
          <stop offset="1" stopColor="#f2d4a0" />
        </linearGradient>
        <radialGradient id="lb-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lb-ray" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#lb-sky)" />
      <circle cx="200" cy="118" r="110" fill="url(#lb-glow)" />
      <g fill="url(#lb-ray)">
        <path d="M200 118 150 0h34z" />
        <path d="M200 118 192 0h32z" />
        <path d="M200 118 232 0h34z" />
        <path d="M200 118 100 20v26z" opacity=".7" />
        <path d="M200 118 300 20v26z" opacity=".7" />
      </g>
      <path d="M0 140q70-30 140-8t120-10 140 14v64H0z" fill="#7d8c82" opacity=".75" />
      <path d="M0 162q100-22 200-6t200-6v50H0z" fill="#41594f" />
      <path d="M0 182q120-14 220-2t180-4v24H0z" fill="#2c4139" />
      <path d="M176 152h48l6 30h-60z" fill="#8c7761" />
      <path d="M170 148h60v7h-60z" fill="#a89073" />
      <path d="M200 126q-24-14-52-6v26q28-8 52 6z" fill="#f4e3c0" />
      <path d="M200 126q24-14 52-6v26q-28-8-52 6z" fill="#fbefd2" />
      <path d="M200 126v26" stroke="#a98f6b" strokeWidth="2" />
      <path d="M200 146q-24-14-54-6v6q30-8 54 6 24-14 54-6v-6q-30-8-54 6z" fill="#d6bc8f" />
      <path
        d="M158 129q18-4 34 4m-34 7q18-4 34 4m16-11q16-8 34-4m-34 11q16-8 34-4"
        fill="none"
        stroke="#9a8465"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".6"
      />
      <g fill="#fff6dc">
        <circle cx="120" cy="86" r="1.6" opacity=".7" />
        <circle cx="282" cy="76" r="1.4" opacity=".7" />
        <circle cx="244" cy="52" r="1.2" opacity=".6" />
        <circle cx="158" cy="58" r="1.2" opacity=".6" />
        <circle cx="312" cy="108" r="1.6" opacity=".5" />
      </g>
    </svg>
  );
}

export function LandingChurchArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="lc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#415b73" />
          <stop offset=".6" stopColor="#d9b88f" />
          <stop offset="1" stopColor="#f3dcae" />
        </linearGradient>
        <radialGradient id="lc-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffe9b0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lc-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2a0" />
          <stop offset="1" stopColor="#f0a85d" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#lc-sky)" />
      <circle cx="318" cy="64" r="70" fill="url(#lc-glow)" opacity=".7" />
      <circle cx="318" cy="64" r="20" fill="#fff0c4" />
      <g fill="#fff" opacity=".35">
        <rect x="40" y="42" width="90" height="6" rx="3" />
        <rect x="64" y="56" width="64" height="5" rx="2.5" />
        <rect x="248" y="96" width="80" height="5" rx="2.5" />
      </g>
      <path d="M0 150q80-26 160-8t140-6 100 10v54H0z" fill="#8da08d" opacity=".8" />
      <path d="M0 172q100-18 200-4t200-6v38H0z" fill="#5a7566" />
      <path d="M96 168V96l44-22 60-36 60 36 44 22v72z" fill="#efe3c9" />
      <path d="M96 96l44-22v94H96z" fill="#d9c9a8" />
      <path d="M260 74l44 22v72h-44z" fill="#d9c9a8" />
      <path d="M170 76h60V44l-30-24-30 24z" fill="#f4ead2" />
      <path d="M200 20l-34 28h68z" fill="#5f7068" />
      <path d="M197 4h6v14h-6zm-6 5h18v4h-18z" fill="#f4ead2" />
      <circle cx="200" cy="82" r="11" fill="#7894a3" />
      <circle cx="200" cy="82" r="11" fill="none" stroke="#f4ead2" strokeWidth="2.5" />
      <path d="M200 71v22M189 82h22" stroke="#f4ead2" strokeWidth="1.5" />
      <path d="M180 168v-30q0-26 20-26t20 26v30z" fill="url(#lc-door)" />
      <path d="M200 112v56M180 140h40" stroke="#8d6d4a" strokeWidth="1.6" opacity=".5" />
      <path d="M112 132q0-16 10-16t10 16v20h-20zm156 0q0-16 10-16t10 16v20h-20z" fill="#f1b866" />
      <path d="M170 168h60v6h-60z" fill="#c9b894" />
      <path d="M160 174h80v8h-80z" fill="#b6a583" />
      <path d="M52 176l12-46 12 46z" fill="#3f5a4c" />
      <path d="M334 176l12-52 12 52z" fill="#3f5a4c" />
    </svg>
  );
}

export function LandingBreviaryArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="lp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2340" />
          <stop offset=".7" stopColor="#4a4467" />
          <stop offset="1" stopColor="#7d5f66" />
        </linearGradient>
        <linearGradient id="lp-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1530" />
          <stop offset="1" stopColor="#35497a" />
        </linearGradient>
        <radialGradient id="lp-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd58a" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffd58a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#lp-wall)" />
      <g transform="translate(215 158) scale(.7) translate(-215 -158)">
        <path d="M92 150V70q0-40 40-40t40 40v80z" fill="url(#lp-window)" stroke="#8d86a8" strokeWidth="5" />
        <path d="M132 30v120M92 90h80" stroke="#8d86a8" strokeWidth="3" />
        <circle cx="152" cy="62" r="11" fill="#f4efd6" />
        <circle cx="158" cy="58" r="10" fill="#1a2547" />
        <g fill="#f5f1de">
          <circle cx="108" cy="58" r="1.4" />
          <circle cx="122" cy="108" r="1.2" />
          <circle cx="150" cy="116" r="1.4" />
          <circle cx="112" cy="132" r="1.1" />
          <circle cx="140" cy="44" r="1" />
        </g>
        <circle cx="270" cy="104" r="92" fill="url(#lp-glow)" />
      </g>
      <path d="M0 158h400v42H0z" fill="#3a2f45" />
      <path d="M0 158h400v6H0z" fill="#5a4a58" />
      <g transform="translate(215 158) scale(.7) translate(-215 -158)">
        <path d="M186 160q42-16 84 0 42-16 84 0v18q-42-12-84 0-42-12-84 0z" fill="#efe0c2" stroke="#b99f7d" strokeWidth="1.6" />
        <path d="M270 160v16" stroke="#a98f6b" strokeWidth="2" />
        <path
          d="M196 164q30-8 64 0m-64 6q30-8 64 0m22-6q30-8 62 0m-62 6q30-8 62 0"
          fill="none"
          stroke="#9a8465"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".6"
        />
        <path d="M296 120h22l-3 38h-16z" fill="#f1e4c8" />
        <path d="M296 120q11-5 22 0-11 5-22 0" fill="#fff4d8" />
        <path d="M307 116q-12-10 0-30 12 20 0 30" fill="#ffc766" />
        <path d="M307 112q-5-6 0-15 5 9 0 15" fill="#fff4cf" />
        <path d="M307 118v4" stroke="#4a3f4c" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
