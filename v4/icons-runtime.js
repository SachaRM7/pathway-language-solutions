// Converts icon characters that scripts write into the page (button labels
// such as "Suivant →", the reader's full-screen toggle…) into icons of the
// Pathway library, so dynamic text matches the static markup.

import { GLYPHS, GLYPH_PATTERN } from './icons.js';

const SVG = 'http://www.w3.org/2000/svg';
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION', 'TITLE', 'svg']);

function makeIcon(id) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'icon icon-inline');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

function convertText(node) {
  const text = node.nodeValue;
  GLYPH_PATTERN.lastIndex = 0;
  if (!GLYPH_PATTERN.test(text)) return;
  const parent = node.parentNode;
  if (!parent || SKIP.has(parent.nodeName) || parent.closest?.('svg, [data-no-icons]')) return;
  const fragment = document.createDocumentFragment();
  let last = 0;
  text.replace(GLYPH_PATTERN, (glyph, index) => {
    if (index > last) fragment.append(text.slice(last, index));
    fragment.append(makeIcon(GLYPHS[glyph]));
    last = index + glyph.length;
    return glyph;
  });
  if (last < text.length) fragment.append(text.slice(last));
  parent.replaceChild(fragment, node);
}

function convert(root) {
  if (root.nodeType === Node.TEXT_NODE) return convertText(root);
  if (root.nodeType !== Node.ELEMENT_NODE || SKIP.has(root.nodeName)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(convertText);
}

convert(document.body);
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'characterData') convert(record.target);
    else record.addedNodes.forEach(convert);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true });
