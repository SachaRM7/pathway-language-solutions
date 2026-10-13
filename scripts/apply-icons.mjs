// Puts the Pathway icon library (v4/icons.js) on a page and replaces every
// stand-in for an icon with it: the per-page copies of the symbol sprite,
// hand-drawn inline SVGs, and text characters used as icons (→ ↗ ↓ ‹ ›…).
// Text set later by scripts is converted in the browser by
// /v4/icons-runtime.js, which this also adds to the page.

import { GLYPHS, GLYPH_PATTERN, icon, iconSprite } from '../v4/icons.js';

const RUNTIME = '<script src="/v4/icons-runtime.js" type="module"></script>';

// Hand-drawn inline icons found in the V4 markup, by a fragment of their path.
const INLINE = [
  ['M4 12h15m-6-6 6 6-6 6', 'i-arrow'],
  ['<rect x="2" y="4" width="20" height="16"', 'i-mail'],
  ['M20.5 12A8.5 8.5', 'i-whatsapp'],
  ['rx="5"/><circle cx="12" cy="12" r="4"', 'i-instagram'],
  ['M14 3v12.5', 'i-tiktok'],
  ['M2 6l2.5 2.5L10 3', 'i-check']
];

function replaceInline(html) {
  return html.replace(/<svg\b(?![^>]*icon-library)([^>]*)>((?:(?!<\/svg>)[\s\S])*?)<\/svg>/g, (match, attrs, body) => {
    if (body.includes('<use')) return match;
    const found = INLINE.find(([fragment]) => body.includes(fragment));
    if (!found) return match;
    const extra = (attrs.match(/class="icon\s*([^"]*)"/) || [])[1] || '';
    return icon(found[1], extra.trim());
  });
}

// Replace icon characters in text only: never inside tags, scripts, styles,
// form options or the title.
function replaceGlyphs(html) {
  let skip = 0;
  return html.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, text) => {
    if (tag) {
      const name = (tag.match(/^<\/?\s*([a-zA-Z0-9-]+)/) || [])[1]?.toLowerCase();
      if (['script', 'style', 'textarea', 'option', 'title'].includes(name)) skip += tag.startsWith('</') ? -1 : 1;
      return tag;
    }
    if (skip > 0) return text;
    return text.replace(GLYPH_PATTERN, glyph => icon(GLYPHS[glyph], 'icon-inline'));
  });
}

export function applyIcons(html) {
  let out = html.replace(/<svg class="icon-library"[\s\S]*?<\/svg>\s*/g, '');
  out = replaceInline(out);
  out = replaceGlyphs(out);
  out = out.replace(/<body([^>]*)>/, `<body$1>\n  ${iconSprite()}`);
  if (!out.includes('/v4/icons-runtime.js')) out = out.replace('</head>', `  ${RUNTIME}\n</head>`);
  return out;
}
