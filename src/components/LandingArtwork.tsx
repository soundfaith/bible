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
        <circle className="art-candle-glow" cx="270" cy="104" r="92" fill="url(#lp-glow)" />
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
        <path className="art-flame" d="M307 116q-12-10 0-30 12 20 0 30" fill="#ffc766" />
        <path className="art-flame" d="M307 112q-5-6 0-15 5 9 0 15" fill="#fff4cf" />
        <path d="M307 118v4" stroke="#4a3f4c" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function LandingOldTestamentArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="ot-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2f4d" />
          <stop offset=".55" stopColor="#7e6c7c" />
          <stop offset="1" stopColor="#f2c88e" />
        </linearGradient>
        <radialGradient id="ot-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ot-ray" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#ot-sky)" />
      <g fill="#fff6dc">
        <circle cx="48" cy="34" r="1.3" opacity=".7" />
        <circle cx="96" cy="16" r="1.1" opacity=".6" />
        <circle cx="150" cy="44" r="1.4" opacity=".7" />
        <circle cx="318" cy="22" r="1.2" opacity=".6" />
        <circle cx="366" cy="52" r="1.5" opacity=".7" />
        <circle cx="262" cy="10" r="1" opacity=".5" />
      </g>
      <circle className="art-glow" cx="200" cy="150" r="150" fill="url(#ot-glow)" />
      <g fill="url(#ot-ray)">
        <path d="M200 150 170 20h60z" />
        <path d="M200 150 60 60v22z" opacity=".6" />
        <path d="M200 150 340 60v22z" opacity=".6" />
      </g>
      <circle cx="200" cy="150" r="34" fill="#fff0c4" />
      <path d="M0 132q60-26 120-10t110-8 90 6 80-12v74H0z" fill="#a08a6a" opacity=".7" />
      <path d="M0 152q90-30 190-12t210-8v70H0z" fill="#7a5f48" />
      <path d="M0 174q110-18 220-4t180-2v30H0z" fill="#4c3a2f" />
      <path d="M68 176v-34" stroke="#2d2620" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="68" cy="138" rx="26" ry="15" fill="#2d3c2c" />
      <ellipse cx="50" cy="146" rx="14" ry="9" fill="#2d3c2c" />
      <ellipse cx="86" cy="146" rx="13" ry="8" fill="#2d3c2c" />
      <path d="M236 200q-12-20 8-34q14-10 0-24" fill="none" stroke="#dcc092" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <path d="M296 60q5-5 10 0q5-5 10 0M330 84q4-4 8 0q4-4 8 0" fill="none" stroke="#f4e6c8" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function LandingNewTestamentArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#263f5f" />
          <stop offset=".6" stopColor="#e4a88c" />
          <stop offset="1" stopColor="#f7d9a6" />
        </linearGradient>
        <linearGradient id="nt-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b7c8c" />
          <stop offset="1" stopColor="#21384a" />
        </linearGradient>
        <radialGradient id="nt-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff0c0" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff0c0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#nt-sky)" />
      <circle className="art-glow" cx="290" cy="116" r="90" fill="url(#nt-glow)" />
      <circle cx="290" cy="116" r="18" fill="#fff4d2" />
      <path d="M0 116q40-16 90-8t80-4 60 6 60-8 110 6v12H0z" fill="#4f6168" opacity=".85" />
      <path d="M0 124h400v76H0z" fill="url(#nt-water)" />
      <g className="art-shimmer" fill="#fff4d2" opacity=".55">
        <rect x="268" y="128" width="44" height="2.5" rx="1.25" />
        <rect x="256" y="138" width="68" height="2" rx="1" opacity=".7" />
        <rect x="276" y="148" width="28" height="2" rx="1" opacity=".5" />
      </g>
      <path d="M118 150h112l-14 12h-84z" fill="#3b2b23" />
      <path d="M172 150V102" stroke="#3b2b23" strokeWidth="3" strokeLinecap="round" />
      <path d="M176 104q28 22 0 42z" fill="#f6ead0" />
      <path d="M168 110q-18 16 0 34z" fill="#e9dcc0" />
      <circle cx="140" cy="146" r="3.5" fill="#ffd27a" />
      <path d="M0 162q100-8 200 0t200 0v38H0z" fill="#1e3645" opacity=".55" />
      <path d="M0 184q100-10 200-2t200-4v18H0z" fill="#16283a" />
      <path d="M52 66q6-6 12 0q6-6 12 0" fill="none" stroke="#f4e6c8" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <path d="M318 40q5-5 10 0q5-5 10 0" fill="none" stroke="#f4e6c8" strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function LandingGospelsArtwork() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3a3c" />
          <stop offset=".6" stopColor="#5f7a68" />
          <stop offset="1" stopColor="#e9d5a0" />
        </linearGradient>
        <radialGradient id="gs-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gs-ray" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff2c8" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#gs-sky)" />
      <circle className="art-glow" cx="200" cy="124" r="120" fill="url(#gs-glow)" />
      <g fill="url(#gs-ray)">
        <path d="M200 124 168 0h64z" />
        <path d="M200 124 110 30v22z" opacity=".7" />
        <path d="M200 124 290 30v22z" opacity=".7" />
      </g>
      <path d="M0 150q90-26 200-6t200-4v60H0z" fill="#3e5d4d" />
      <path d="M0 172q110-16 200-4t200-6v38H0z" fill="#27403a" />
      <path d="M200 30v40M188 42h24" stroke="#ffe2a0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="200" cy="42" r="26" fill="#fff2c8" opacity=".12" />
      <path d="M138 128q30-10 62 2v40q-32-12-62-2z" fill="#f7ecd2" />
      <path d="M200 130q32-12 62-2v40q-30-10-62 2z" fill="#fff6df" />
      <path d="M200 130v40" stroke="#b99f7d" strokeWidth="1.6" />
      <path d="M148 140q22-6 46 0m-46 8q22-6 46 0m-46 8q22-6 46 0m10-14q22-6 46 0m-46 8q22-6 46 0m-46 8q22-6 46 0" fill="none" stroke="#b8a27e" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M130 168h140v6H130z" fill="#8c5a3c" />
      <path d="M118 174q82 10 164 0v4q-82 10-164 0z" fill="#1b2a24" opacity=".5" />
      <g fill="#fff6dc">
        <circle cx="86" cy="60" r="1.4" opacity=".7" />
        <circle cx="318" cy="70" r="1.3" opacity=".6" />
        <circle cx="342" cy="30" r="1.1" opacity=".6" />
        <circle cx="64" cy="96" r="1.2" opacity=".5" />
      </g>
    </svg>
  );
}
