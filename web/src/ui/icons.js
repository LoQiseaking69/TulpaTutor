// Inline SVG icons (stroke-based, 24px grid).
const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 20 4M16.5 4H20v3.5"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.2 7l2.2 1.3M17.6 15.7l2.2 1.3M4.2 17l2.2-1.3M17.6 8.3 19.8 7M2.8 12h2.6M18.6 12h2.6"/><circle cx="12" cy="12" r="7"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  function: '<path d="M14.5 4.5c-2-1-4 0-4.5 2.5L8 18c-.5 2.5-2.5 3-4.5 2"/><path d="M6 10h8M14 13l5 6M19 13l-5 6"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  robot: '<path d="M4 20h9M8.5 20v-4l4-6 5 2.5"/><circle cx="12.5" cy="10" r="1.6"/><circle cx="17.5" cy="12.5" r="1.4"/><path d="m18.6 13.4 2.4 3.1M5.5 16h6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  flame: '<path d="M12 21.5c-4 0-6.5-2.7-6.5-6.3 0-3.7 3-5.6 3.4-9.2 2.3 1.4 3.7 3.5 3.8 5.7 1-1 1.6-2.3 1.7-3.7 2.6 2 4.1 4.6 4.1 7.3 0 3.6-2.5 6.2-6.5 6.2z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  book: '<path d="M3 5.5c3-1.3 6-1.3 9 .5 3-1.8 6-1.8 9-.5V19c-3-1.3-6-1.3-9 .5-3-1.8-6-1.8-9-.5z"/><path d="M12 6v13.5"/>',
  bulb: '<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1v.5h5V16c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5"/>',
  hint: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.1"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  brain: '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 .5V6a2.5 2.5 0 0 0-3-1.5zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 .5"/>',
  medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5 6 3h4l2 5M15.5 10.5 18 3h-4l-2 5"/><path d="m12 12.3.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
  graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.2 8.2l3.6 7.5M16.8 8.2l-3.6 7.5"/>',
  wave: '<path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3.5-4 5-2"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 20V9M7 13.5l5-5 5 5M4 4h16"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  note: '<path d="M5 3.5h10l4 4v13H5z"/><path d="M15 3.5v4h4M8 12h8M8 15.5h8M8 8.5h4"/>',
};

export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`;
}

/** Original crystalline "T" mark for TulpaTutor. */
export function logo(size = 64, id = "lg") {
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="TulpaTutor">
  <defs>
    <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>
    <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g filter="url(#${id}g)">
    <path d="M6 10 L58 10 L52 22 L38 22 L32 30 L26 22 L12 22 Z" fill="url(#${id}a)"/>
    <path d="M26 22 L32 30 L38 22 L36 50 L32 58 L28 50 Z" fill="url(#${id}b)"/>
    <path d="M6 10 L32 16 L58 10 L52 22 L32 16 L12 22 Z" fill="#fff" opacity=".18"/>
    <path d="M32 30 L32 58 L36 50 L38 22 Z" fill="#1e1b4b" opacity=".35"/>
  </g>
</svg>`;
}
