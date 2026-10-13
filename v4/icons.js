// Pathway icon library: one drawing system for every icon of the site.
//
// Grid 24 × 24, live area 3–21, outline only (no fills), a single stroke
// width set in CSS (1.75), round caps and joins, corner radius 2.5 on
// rectangles. Ids keep the names already used in the V4 markup (i-arrow,
// i-map…), so pages switch to this set without changes.
//
// Used by the build (sprite injected in every page, text arrows replaced by
// icons) and in the browser by icons-runtime.js for text set by scripts.

export const ICONS = Object.freeze({
  // Direction
  'i-arrow': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'i-arrow-left': '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  'i-arrow-down': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  'i-external': '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
  'i-chevron': '<path d="m10 6 6 6-6 6"/>',
  'i-chevron-left': '<path d="m14 6-6 6 6 6"/>',
  'i-chevron-down': '<path d="m6 10 6 6 6-6"/>',
  // Actions
  'i-plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'i-close': '<path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/>',
  'i-check': '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'i-download': '<path d="M12 4v11"/><path d="m7 10.5 5 4.5 5-4.5"/><path d="M5 20h14"/>',
  'i-expand': '<path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9"/><path d="M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9"/><path d="M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15"/><path d="M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15"/>',
  'i-search': '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  'i-zoom': '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/><path d="M11 8.5v5"/><path d="M8.5 11h5"/>',
  'i-play': '<path d="M8 5.5v13a.75.75 0 0 0 1.1.66l10.4-6.5a.75.75 0 0 0 0-1.32L9.1 4.84A.75.75 0 0 0 8 5.5Z"/>',
  'i-pause': '<path d="M9 6v12"/><path d="M15 6v12"/>',
  // Method and product
  'i-map': '<path d="M3.5 7.2a1 1 0 0 1 .6-.9L9 4l6 2.5 4.4-2a.75.75 0 0 1 1.1.7v11.6a1 1 0 0 1-.6.9L15 20l-6-2.5-4.4 2a.75.75 0 0 1-1.1-.7Z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/>',
  'i-route': '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
  'i-laptop': '<rect x="4.5" y="4.5" width="15" height="11.5" rx="2.5"/><path d="M3 19h18"/>',
  'i-clipboard': '<rect x="5" y="5" width="14" height="16" rx="2.5"/><rect x="9" y="3" width="6" height="4" rx="1.5"/><path d="m9 13.5 2 2 4-4.5"/>',
  'i-calendar': '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/><path d="M4 10h16"/>',
  'i-people': '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.3a4.5 4.5 0 0 1 5 4.2"/>',
  'i-bars': '<rect x="4" y="12" width="4" height="8" rx="1.5"/><rect x="10" y="8" width="4" height="12" rx="1.5"/><rect x="16" y="4" width="4" height="16" rx="1.5"/>',
  'i-book': '<path d="M12 6.5C10.4 5 8 4.5 4 4.5v14c4 0 6.4.5 8 2 1.6-1.5 4-2 8-2v-14c-4 0-6.4.5-8 2Z"/><path d="M12 6.5v14"/>',
  'i-clock': '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  'i-target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
  'i-alert': '<path d="M10.3 4.9a2 2 0 0 1 3.4 0l7 12.1a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3Z"/><path d="M12 10v3.5"/><path d="M12 16.5h.01"/>',
  'i-maple': '<path d="M12 3.5 14 8l3-1.5-.8 4.8 3.8-2.3-1 4.2 1.8 1.3L15 18l.6 1.8L12 19l-3.6.8L9 18l-5.8-3.5L5 13.2l-1-4.2 3.8 2.3L7 6.5 10 8Z"/><path d="M12 19v2.5"/>',
  // Contact
  'i-mail': '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 6 7.5-6"/>',
  'i-whatsapp': '<path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 19.8l1.2-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9.2 8.6c-.4 2.9 2.6 6 5.6 5.6l.7-1.5-1.8-.9-.9.8a4.6 4.6 0 0 1-2-2l.8-.9-.9-1.8Z"/>',
  'i-instagram': '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.75"/><path d="M16.75 7.25h.01"/>',
  'i-tiktok': '<path d="M14 4v10.5a4 4 0 1 1-4-4"/><path d="M14 4c.4 2.9 2.4 4.7 5 5"/>'
});

// Text characters that used to stand in for icons, and their icon.
export const GLYPHS = Object.freeze({
  '→': 'i-arrow', '←': 'i-arrow-left', '↓': 'i-arrow-down', '↗': 'i-external',
  '›': 'i-chevron', '‹': 'i-chevron-left', '＋': 'i-plus', '✕': 'i-close', '✓': 'i-check'
});
export const GLYPH_PATTERN = /[→←↓↗›‹＋✕✓]/g;

export const iconSprite = () => `<svg class="icon-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>${
  Object.entries(ICONS).map(([id, body]) => `<symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`).join('')
}</defs></svg>`;

export const icon = (id, className = '') => `<svg class="icon${className ? ` ${className}` : ''}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
