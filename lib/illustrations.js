/* CupCoff — hand-inked café illustrations (original artwork).
 * Each piece: a painted baby-blue wash behind, black ink drawing on top, cross-hatched shading,
 * and a light displacement filter so lines wobble like a dip pen.
 * Classes inside a drawing:  o = outlined white shape, k = solid ink, h = hatched shading,
 *   t = thin line, w = white line on ink, s = baby-blue fill with ink outline, st = blue/white stripes.
 */
const ILL_DEFS = `
<filter id="ill-rough" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="ill-sketch" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="ill-wash" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/></filter>
<pattern id="ill-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(42)"><rect width="3.2" height="3.2" fill="#fff"/><line x1="0" y1="0" x2="0" y2="3.2" stroke="#000" stroke-width="0.9"/></pattern>
<pattern id="ill-cross" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(42)"><rect width="3.4" height="3.4" fill="#fff"/><path d="M0 0V3.4M0 0H3.4" stroke="#000" stroke-width="0.8"/></pattern>
<pattern id="ill-stripes" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="#BDE0FF"/><rect x="4" width="4" height="8" fill="#fff"/></pattern>`;

const ILL_STYLE = `.ill .o{fill:#fff;stroke:#000;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.ill .k{fill:#000;stroke:#000;stroke-width:1.2;stroke-linejoin:round}
.ill .h{fill:url(#ill-hatch);stroke:none}.ill .hx{fill:url(#ill-cross);stroke:none}
.ill .t{fill:none;stroke:#000;stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}
.ill .w{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round}.ill .wf{fill:#fff;stroke:none}
.ill .s{fill:#BDE0FF;stroke:#000;stroke-width:1.9;stroke-linejoin:round}
.ill .st{fill:url(#ill-stripes);stroke:#000;stroke-width:1.9;stroke-linejoin:round}
.ill .wash{fill:#BDE0FF}.ill .ghost{opacity:.28}`;

// Painted wash shapes (behind each drawing), hand-placed per piece.
const ILL_WASH = {
  machine: "M14 58c-2-22 16-40 44-42 26-2 50 10 52 34 2 22-6 46-30 54-24 8-62 4-66-18z",
  latte: "M10 70c-4-22 14-38 40-42 30-4 58 6 62 28 4 22-14 40-44 44-30 4-54-8-58-30z",
  milk: "M24 40c6-20 34-30 56-22 20 8 26 30 22 54-4 26-24 40-48 36-26-4-38-40-30-68z",
  pourover: "M18 46c8-22 40-34 66-24 24 10 28 40 20 62-8 20-40 26-62 18-22-8-32-32-24-56z",
  takeaway: "M26 30c14-14 46-16 62 0 16 16 14 50 6 70-8 18-40 22-58 10-18-12-26-62-10-80z",
  croissant: "M8 62c0-20 26-36 54-36s52 14 52 34-22 40-52 40S8 82 8 62z",
  moka: "M22 44c4-24 34-34 58-26 22 8 30 34 24 58-6 22-30 32-54 26-24-6-32-34-28-58z",
};

// Ink drawings, viewBox 0 0 120 120.
const ILL = {
  machine: `
    <path class="o" d="M31 18h11l-1.4 8h-8.2z"/><path class="t" d="M42 20c3 0 3 4 0 4"/><path class="o" d="M49 18h11l-1.4 8h-8.2z"/><path class="t" d="M60 20c3 0 3 4 0 4"/>
    <rect class="o" x="20" y="26" width="80" height="6" rx="2"/>
    <path class="o" d="M22 32h76v46c0 3-2 5-5 5H27c-3 0-5-2-5-5z"/>
    <path class="h" d="M86 34h10v44c0 2-1 3-3 3h-7z"/><path class="t" d="M86 33v48"/>
    <circle class="o" cx="38" cy="47" r="8.5"/><path class="t" d="M32 47h2M38 41v2M44 47h-2M34 42.5l1.3 1.3M42 42.5l-1.3 1.3"/><path class="k" d="M38 47l4.6-4.2-1-.9z"/><circle class="k" cx="38" cy="47" r="1.3"/>
    <rect class="k" x="54" y="41" width="26" height="9" rx="2"/><circle class="wf" cx="59" cy="45.5" r="1.4"/><circle class="wf" cx="64" cy="45.5" r="1.4"/><path class="w" d="M69 45.5h7"/>
    <circle class="o" cx="30" cy="64" r="2.6"/><circle class="o" cx="30" cy="72" r="2.6"/>
    <rect class="o" x="44" y="58" width="26" height="6" rx="1.5"/>
    <path class="o" d="M47 64h20l-2 5H49z"/><path class="k" d="M66 66l22 6c2 .6 2.4 3.6.4 4.2l-1.4.4-22-6z"/><path class="w" d="M71 69.5l12 3.2"/>
    <path class="t" d="M53 69v4M61 69v4"/><path class="t" d="M53 73c.6 3-.6 6 0 9M61 73c-.6 3 .6 6 0 9"/>
    <path class="o" d="M47 83h20l-1.8 9c-.4 2-2 3-4 3h-8.4c-2 0-3.6-1-4-3z"/><path class="h" d="M60 84h6l-1.6 8c-.3 1.5-1.4 2.5-3 2.5H60z"/><path class="t" d="M67 85.5c4 0 4 6 0 6.4"/>
    <path class="o" d="M94 50c7 0 8 5 8 10v16c0 2-1.4 3-3 3"/><path class="t" d="M99 82c-2-3 2-5 0-8M104 80c-2-3 2-5 0-8"/>
    <rect class="o" x="16" y="95" width="88" height="9" rx="2.5"/><path class="t" d="M24 97.5v4M30 97.5v4M36 97.5v4M42 97.5v4M48 97.5v4M72 97.5v4M78 97.5v4M84 97.5v4M90 97.5v4M96 97.5v4"/>
    <path class="k" d="M20 104h7v4h-7zM93 104h7v4h-7z"/>
    <path class="t" d="M52 14c-2-3 2-5 0-8M57 15c-2-3 2-5 0-8"/>`,
  latte: `
    <path class="h" d="M22 96c10 8 66 8 76 0-6 6-70 6-76 0z"/>
    <ellipse class="o" cx="60" cy="88" rx="44" ry="11"/><ellipse class="t" cx="60" cy="87" rx="28" ry="5.5"/>
    <path class="o" d="M26 52h68c-2 28-14 36-34 36S28 80 26 52z"/>
    <path class="h" d="M82 56c-1 16-8 24-18 28 14-1 23-9 26-28z"/>
    <path class="o" d="M92 57c12-3 17 4 15 10-2 7-9 10-17 9" stroke-width="2.2"/><path class="t" d="M91 62c7-2 10 1 9 5-1 4-5 5-10 5"/>
    <ellipse class="o" cx="60" cy="52" rx="34" ry="9"/><ellipse class="k" cx="60" cy="52.5" rx="29.5" ry="6.8"/>
    <path class="wf" d="M60 57.6c-11-4.4-12.4-9.8-7.6-10.6 3.2-.5 5.8 1.2 7.6 3.6 1.8-2.4 4.4-4.1 7.6-3.6 4.8.8 3.4 6.2-7.6 10.6z"/><path class="t" d="M60 50.6v6" style="stroke:#000;stroke-width:.9"/><path class="w" d="M45 51.4c1.6-1.6 3.6-2.2 5.4-2M75 51.4c-1.6-1.6-3.6-2.2-5.4-2"/>
    <path class="o" d="M80 95l26-9" stroke-width="2.4"/><ellipse class="o" cx="108" cy="85" rx="5.5" ry="2.8" transform="rotate(-20 108 85)"/>
    <g transform="rotate(-12 24 88)"><rect class="o" x="12" y="84" width="22" height="8" rx="2.5"/><path class="k" d="M16 87.5h1.4v1.4H16zM21 86.5h1.4v1.4H21zM26 88h1.4v1.4H26zM30 86.6h1.4V88H30z"/></g>
    <path class="t" d="M48 40c-3-4 3-6 0-10s3-6 0-10M60 38c-3-4 3-6 0-10s3-6 0-10M72 40c-3-4 3-6 0-10s3-6 0-10"/>`,
  milk: `
    <path class="h" d="M30 108c14 4 54 4 68 0-10 3-58 3-68 0z"/>
    <path class="o" d="M16 80h20l-2.4 26c-.2 2-1.6 3-3.4 3h-8.4c-1.8 0-3.2-1-3.4-3z"/><path class="t" d="M17.4 88h17.2"/><path class="h" d="M29 89h5l-1.8 16c-.1 1-.8 1.6-1.8 1.6H29z"/><path class="t" d="M20 92v11"/>
    <rect class="s" x="48" y="10" width="24" height="9" rx="2.5"/><path class="t" d="M52 12.5v4M56 12.5v4M60 12.5v4M64 12.5v4M68 12.5v4"/>
    <path class="o" d="M50 19h20v9c0 5 4 9 8 13 6 6 8 12 8 19v42c0 4-3 6-6 6H40c-3 0-6-2-6-6V60c0-7 2-13 8-19 4-4 8-8 8-13z"/>
    <path class="h" d="M76 44c5 5 7 10 7 16v42c0 2-1 3-3 3h-3V48z"/>
    <path class="t" d="M41 62v34M44 50c2-3 4-5 6-6"/>
    <rect class="k" x="40" y="66" width="38" height="26" rx="5"/>
    <g transform="translate(59 79)"><ellipse class="wf" rx="2.6" ry="6" transform="rotate(0)"/><ellipse class="wf" rx="2.6" ry="6" transform="rotate(45)"/><ellipse class="wf" rx="2.6" ry="6" transform="rotate(90)"/><ellipse class="wf" rx="2.6" ry="6" transform="rotate(135)"/><circle r="2.8" fill="#BDE0FF" stroke="#000" stroke-width="1"/></g>
    <path class="t" d="M90 70c3 2 3 6 0 8M95 66c4 3 4 9 0 12"/>`,
  pourover: `
    <rect class="o" x="30" y="100" width="62" height="9" rx="2.5"/><rect class="k" x="36" y="103" width="12" height="3.4" rx="1"/><circle class="k" cx="84" cy="104.5" r="1.8"/>
    <path class="o" d="M42 98h38c5 0 6-3 5-7l-7-21H44l-7 21c-1 4 0 7 5 7z"/>
    <path class="k" d="M40.6 86h40.8l2 6c.6 2-.4 3.6-2.6 3.6H41.2c-2.2 0-3.2-1.6-2.6-3.6z"/>
    <path class="h" d="M71 71h7l5 15h-8z"/>
    <path class="o" d="M80 74c10 0 13 5 12 10-1 6-6 8-11 7" stroke-width="2.2"/>
    <rect class="o" x="44" y="65" width="34" height="6" rx="1.5"/><path class="h" d="M45 66h32v4H45z"/><path class="t" d="M44 65h34v6H44z"/>
    <path class="o" d="M34 40h54L71 64H51z"/><path class="h" d="M76 41h11L71 63h-5z"/>
    <path class="t" d="M44 44l9 17M61 43v19M78 44l-9 17"/><path class="o" d="M42 62h38v3H42z"/>
    <path class="o" d="M87 42c8 1 8 10-1 11"/>
    <path class="o" d="M35 40l3.6-5 3.6 5 3.6-5 3.6 5 3.6-5 3.6 5 3.6-5 3.6 5 3.6-5 3.6 5 3.6-5 3.6 5 3.6-5 3.6 5"/>
    <path class="o" d="M6 34c0-11 7-14 14-14h6c9 0 13 4 13 14v8c0 3-2 5-5 5H11c-3 0-5-2-5-5z"/><path class="h" d="M29 22c6 1 10 5 10 12v8c0 3-2 5-5 5h-4z"/>
    <path class="k" d="M18 16h10v4H18z"/><circle class="k" cx="23" cy="14" r="2.4"/>
    <path class="o" d="M7 30c-6 0-7 10 0 12" stroke-width="2.2"/>
    <path class="t" d="M36 40c6 0 9-4 11-10 1.6-4.6 5-6.4 8-4.4" style="stroke-width:4.4"/><path class="t" d="M36 40c6 0 9-4 11-10 1.6-4.6 5-6.4 8-4.4" style="stroke:#fff;stroke-width:1.6"/>
    <path class="t" d="M55 27.4c1.4 3-.4 5.4.6 8.4s-.2 4.4.4 6.2" style="stroke-dasharray:2 1.6"/>`,
  takeaway: `
    <path class="h" d="M32 110c12 3 44 3 56 0-8 2-48 2-56 0z"/>
    <path class="o" d="M36 18l3-7h42l3 7"/><rect class="o" x="30" y="18" width="60" height="10" rx="4"/><path class="k" d="M66 13h8v3h-8z"/>
    <path class="st" d="M33 28h54l-8 80H41z"/>
    <path class="k" d="M36 50h48l-2.4 26H38.4z"/><path class="w" d="M41 55h38M41 71h38"/>
    <path class="wf" d="M60 68.5c-6-3.6-5.6-7.6-2.6-7.6 1.4 0 2.2.9 2.6 2 .4-1.1 1.2-2 2.6-2 3 0 3.4 4-2.6 7.6z"/>
    <path class="h" d="M76 29h11l-8 79h-6z"/>
    <g transform="translate(18 104) rotate(-30)"><ellipse class="k" rx="5" ry="3.4"/><path class="w" d="M-4 0c3 -1 5 1 8 0"/></g>
    <g transform="translate(100 102) rotate(25)"><ellipse class="k" rx="5" ry="3.4"/><path class="w" d="M-4 0c3 -1 5 1 8 0"/></g>
    <g transform="translate(108 92) rotate(-50)"><ellipse class="k" rx="4" ry="2.8"/><path class="w" d="M-3 0c2 -1 4 1 6 0"/></g>
    <path class="t" d="M54 8c-2-3 2-5 0-7M64 8c-2-3 2-5 0-7"/>`,
  croissant: `
    <ellipse class="o" cx="60" cy="96" rx="50" ry="10"/><ellipse class="t" cx="60" cy="95" rx="36" ry="6"/>
    <g transform="rotate(58 22 84)"><ellipse class="o" cx="22" cy="84" rx="7" ry="11"/><path class="h" d="M15 84a7 11 0 0 0 14 0z"/><path class="t" d="M17 79c3 2 7 2 10 0"/></g>
    <g transform="rotate(-58 98 84)"><ellipse class="o" cx="98" cy="84" rx="7" ry="11"/><path class="h" d="M91 84a7 11 0 0 0 14 0z"/><path class="t" d="M93 79c3 2 7 2 10 0"/></g>
    <g transform="rotate(38 38 72)"><ellipse class="o" cx="38" cy="72" rx="11" ry="16"/><path class="h" d="M27 74a11 14 0 0 0 22 0z"/><path class="t" d="M30 66c5 3 11 3 16 0M29 73c6 3 12 3 18 0"/></g>
    <g transform="rotate(-38 82 72)"><ellipse class="o" cx="82" cy="72" rx="11" ry="16"/><path class="h" d="M71 74a11 14 0 0 0 22 0z"/><path class="t" d="M74 66c5 3 11 3 16 0M73 73c6 3 12 3 18 0"/></g>
    <ellipse class="o" cx="60" cy="64" rx="15" ry="21"/><path class="h" d="M45 68a15 17 0 0 0 30 0c-6 6-24 6-30 0z"/>
    <path class="t" d="M48 52c7 4 17 4 24 0M46 62c8 4 20 4 28 0M48 72c7 3 17 3 24 0"/>
    <path class="k" d="M30 103h1.6v1.6H30zM44 104h1.4v1.4H44zM78 103h1.6v1.6H78zM90 101h1.2v1.2H90zM66 105h1.2v1.2H66z"/>
    <path class="t" d="M50 34c-2-3 2-5 0-8M60 32c-2-3 2-5 0-8M70 34c-2-3 2-5 0-8"/>`,
  moka: `
    <ellipse class="h" cx="58" cy="102" rx="32" ry="4"/>
    <rect class="k" x="54" y="14" width="10" height="7" rx="2.5"/>
    <path class="o" d="M42 30l5-9h24l5 9z"/>
    <path class="o" d="M40 30h38l-4 26H44z"/><path class="h" d="M66 30h12l-4 26h-8z"/><path class="t" d="M53 30l.6 26M66 30v26"/>
    <path class="o" d="M40 31l-9-4 2 7z"/>
    <path class="k" d="M78 33c12 1 14 10 13 15-1 7-6 11-10 12l-3-3c4-2 7-5 7-9 0-5-3-8-7-9z"/>
    <rect class="k" x="44" y="56" width="30" height="5" rx="1"/>
    <path class="o" d="M43 61h32l6 38H37z"/><path class="h" d="M67 61h8l6 38h-11z"/><path class="t" d="M52 61l-2 38M67 61l3 38"/>
    <circle class="o" cx="58" cy="78" r="3.4"/><circle class="k" cx="58" cy="78" r="1.2"/>
    <path class="t" d="M28 24c-3-3 1-6-2-9M23 26c-3-3 1-6-2-9"/>
    <path class="o" d="M90 88h14l-1.6 10c-.3 1.6-1.6 2.6-3.2 2.6h-4.4c-1.6 0-2.9-1-3.2-2.6z"/><path class="t" d="M104 90c3 0 3 5 0 5"/><ellipse class="k" cx="97" cy="88.4" rx="6" ry="1.4"/>`,
};

// One drawing as a standalone <svg>. extraClass sets size via CSS.
function illusSvg(name, extraClass = "", standalone = false) {
  const art = ILL[name] || "";
  return `<svg class="ill ${extraClass}" viewBox="0 0 120 120" aria-hidden="true"${standalone ? ' xmlns="http://www.w3.org/2000/svg"' : ""}>${standalone ? `<defs>${ILL_DEFS}</defs><style>${ILL_STYLE}</style>` : ""}
    <path class="wash" d="${ILL_WASH[name] || ""}" filter="url(#ill-wash)" transform="translate(3 4)"/>
    <g class="ghost" filter="url(#ill-sketch)" transform="translate(.7 .5)">${art}</g>
    <g filter="url(#ill-rough)">${art}</g></svg>`;
}

export { ILL, ILL_DEFS, ILL_STYLE, ILL_WASH, illusSvg };
