// Official IRCC Express Entry round results for the v4 homepage.
//
// Only canada.ca / cic.gc.ca endpoints are ever used. The live fetch is the
// primary source; the same-origin file under ./data is a dated, verified
// snapshot used only when the live request fails. There is no external
// storage and no historic value is ever presented as the current round.

const ROUNDS_DATA_URL = 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json';
const ROUNDS_PAGE_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html';
const PER_ROUND_PAGE_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html';
const CRITERIA_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html';
const CALCULATOR_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html';
const SNAPSHOT_URL = new URL('./data/ircc-rounds.json', import.meta.url);
const LIVE_TIMEOUT_MS = 8000;

const CATEGORIES = [
  {
    key: 'french',
    label: 'Francés (French-Language proficiency)',
    matches: name => /french[- ]language proficiency/i.test(name)
  },
  {
    key: 'cec',
    label: 'Canadian Experience Class',
    matches: name => /^canadian experience class\b/i.test(name)
  }
];

const OFFICIAL_HOSTS = ['canada.ca', 'www.canada.ca', 'cic.gc.ca', 'www.cic.gc.ca'];

function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && OFFICIAL_HOSTS.includes(url.hostname.toLowerCase());
  } catch (_) {
    return false;
  }
}

function officialUrlOrNull(value) {
  if (!value) return null;
  const candidate = isOfficialUrl(value) ? value : `https://www.canada.ca${String(value).startsWith('/') ? '' : '/'}${value}`;
  return isOfficialUrl(candidate) ? new URL(candidate).href : null;
}

function extractHref(html) {
  const match = String(html || '').match(/href=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function buildRoundSource(round, drawNumber) {
  let href = String(extractHref(round && round.drawNumberURL) || extractHref(round && round.mitext) || '').trim();
  if (/^https?:\/\//i.test(href)) {
    // A full URL is only trusted when it already points at an official host.
    if (!isOfficialUrl(href)) href = '';
  } else if (href) {
    href = href.replace(/^\/content\/canadasite/i, '');
  }
  const fromMarkup = officialUrlOrNull(href);
  if (fromMarkup) return fromMarkup;
  return drawNumber ? `${PER_ROUND_PAGE_URL}?q=${encodeURIComponent(drawNumber)}` : PER_ROUND_PAGE_URL;
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function toScore(value) {
  const raw = String(value ?? '').trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw)) return NaN;
  return Number(raw.replaceAll(',', ''));
}

function ceilingFrom(now) {
  return new Date(now).toISOString().slice(0, 10);
}

function parseRound(round, ceilingDate) {
  if (!round || typeof round !== 'object') return null;
  const date = String(round.drawDate || '').trim();
  const score = toScore(round.drawCRS);
  const name = String(round.drawName || '').trim();
  const drawNumber = String(round.drawNumber == null ? '' : round.drawNumber).trim();
  if (!validIsoDate(date)) return null;
  // Reject any round dated after the client's "today" so a bad endpoint clock
  // can never surface a not-yet-official future round as the latest one.
  if (date > ceilingDate) return null;
  if (!Number.isInteger(score) || score < 1 || score > 1200) return null;
  if (!name) return null;
  return { date, score, name, drawNumber, source: buildRoundSource(round, drawNumber) };
}

function sortRounds(rounds) {
  return rounds.sort((left, right) =>
    right.date.localeCompare(left.date) || Number(right.drawNumber || 0) - Number(left.drawNumber || 0));
}

/**
 * Parse the official IRCC rounds payload into the latest French and CEC round.
 * Throws when the payload is unusable so callers can fall back to the snapshot.
 */
function parseOfficialRounds(payload, options = {}) {
  const ceilingDate = options.ceilingDate || ceilingFrom(options.now || Date.now());
  if (!validIsoDate(ceilingDate)) throw new Error('Invalid ceiling date');
  if (!payload || !Array.isArray(payload.rounds) || !payload.rounds.length) {
    throw new Error('IRCC payload has no rounds');
  }
  const parsed = payload.rounds.map(round => parseRound(round, ceilingDate)).filter(Boolean);
  if (!parsed.length) throw new Error('No valid IRCC rounds');
  const categories = {};
  for (const category of CATEGORIES) {
    const matches = sortRounds(parsed.filter(round => category.matches(round.name)));
    if (matches.length) categories[category.key] = matches[0];
  }
  if (!categories.french || !categories.cec) throw new Error('Missing French or CEC round');
  return { categories, ceilingDate, totalRounds: parsed.length };
}

function snapshotCategory(value, ceilingDate) {
  if (!value || typeof value !== 'object') return null;
  const date = String(value.date || '').trim();
  const score = toScore(value.score);
  if (!validIsoDate(date) || date > ceilingDate) return null;
  if (!Number.isInteger(score) || score < 1 || score > 1200) return null;
  const drawNumber = String(value.drawNumber == null ? '' : value.drawNumber).trim();
  const source = officialUrlOrNull(value.source)
    || (drawNumber ? `${PER_ROUND_PAGE_URL}?q=${encodeURIComponent(drawNumber)}` : PER_ROUND_PAGE_URL);
  return {
    date,
    score,
    drawNumber,
    name: String(value.name || '').trim(),
    source
  };
}

/**
 * Validate the dated, verified same-origin snapshot. A snapshot without an
 * explicit verification date is rejected so freshness can never be implied.
 */
function parseSnapshot(payload, options = {}) {
  const ceilingDate = options.ceilingDate || ceilingFrom(options.now || Date.now());
  if (!payload || typeof payload !== 'object') throw new Error('Snapshot missing');
  const verifiedAt = String(payload.verifiedAt || '').slice(0, 10);
  const fetchedAt = String(payload.fetchedAt || '').trim();
  if (!validIsoDate(verifiedAt) || verifiedAt > ceilingDate) throw new Error('Snapshot has no valid verified date');
  const source = payload.categories || {};
  const categories = {};
  for (const category of CATEGORIES) {
    const parsed = snapshotCategory(source[category.key], ceilingDate);
    if (parsed) categories[category.key] = parsed;
  }
  if (!categories.french || !categories.cec) throw new Error('Snapshot is missing a category');
  return { categories, verifiedAt, fetchedAt, ceilingDate };
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

let cachedState = null;

async function resolveRounds(options = {}) {
  if (cachedState) return cachedState;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : LIVE_TIMEOUT_MS;
  let state;
  try {
    const payload = await fetchJson(ROUNDS_DATA_URL, timeoutMs);
    const parsed = parseOfficialRounds(payload, options);
    state = {
      status: 'live',
      fetchedAt: new Date().toISOString(),
      categories: parsed.categories,
      source: ROUNDS_DATA_URL
    };
  } catch (liveError) {
    try {
      const payload = await fetchJson(SNAPSHOT_URL.href, timeoutMs);
      const parsed = parseSnapshot(payload, options);
      state = {
        status: 'snapshot',
        fetchedAt: parsed.fetchedAt || null,
        verifiedAt: parsed.verifiedAt,
        categories: parsed.categories,
        source: SNAPSHOT_URL.href
      };
    } catch (snapshotError) {
      return {
        status: 'unavailable',
        categories: {},
        reason: `${liveError.message}; snapshot: ${snapshotError.message}`
      };
    }
  }
  cachedState = state;
  return state;
}

function formatRoundDate(iso) {
  const date = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .replace(/\./g, '');
}

function formatUpdated(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .replace(/\./g, '');
  const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    .format(date);
  return `${day}, ${time} UTC`;
}

function resolveSlot(panel, selector) {
  return panel.querySelector(selector) || (typeof document !== 'undefined' ? document.querySelector(selector) : null);
}

function setText(scope, selector, value) {
  const node = scope.querySelector(selector);
  if (node) node.textContent = value;
}

function setSourceLink(link, round) {
  if (!link) return;
  if (round && round.source && isOfficialUrl(round.source)) {
    link.setAttribute('href', round.source);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = round.drawNumber ? `Ronda oficial #${round.drawNumber}` : 'Ronda oficial';
  } else {
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('rel');
    link.textContent = '';
  }
}

function renderState(panel, state) {
  for (const category of CATEGORIES) {
    const row = panel.querySelector(`[data-ircc-category="${category.key}"]`);
    if (!row) continue;
    const round = state.categories[category.key];
    setText(row, '[data-round-date]', round ? formatRoundDate(round.date) : '');
    setText(row, '[data-round-score]', round ? String(round.score) : '');
    setSourceLink(row.querySelector('[data-round-source]'), round);
  }

  const status = resolveSlot(panel, '[data-ircc-status]');
  const updated = resolveSlot(panel, '[data-ircc-updated]');
  if (state.status === 'live') {
    if (status) status.textContent = 'Rondas oficiales de IRCC para francés y Canadian Experience Class.';
    if (updated) updated.textContent = `Consultado el ${formatUpdated(state.fetchedAt)}.`;
  } else if (state.status === 'snapshot') {
    if (status) status.textContent = 'Datos en vivo no disponibles. Se muestra una copia fechada de la fuente oficial, que puede no incluir las rondas más recientes.';
    if (updated) updated.textContent = `Copia verificada el ${formatRoundDate(state.verifiedAt)}.`;
  } else {
    if (status) status.textContent = 'Rondas oficiales de IRCC no disponibles en este momento.';
    if (updated) updated.textContent = 'Sin fecha de actualización disponible.';
  }

  for (const link of panel.querySelectorAll('[data-ircc-rounds-page]')) link.setAttribute('href', ROUNDS_PAGE_URL);
  for (const link of panel.querySelectorAll('[data-ircc-calculator]')) link.setAttribute('href', CALCULATOR_URL);
  for (const link of panel.querySelectorAll('[data-ircc-criteria]')) link.setAttribute('href', CRITERIA_URL);
}

/**
 * Populate a [data-ircc-rounds] panel with the latest official IRCC rounds.
 * Safe to call more than once: the first call owns the panel until it settles.
 */
export async function setupIrccRounds(panel) {
  const target = panel && panel.nodeType === 1
    ? panel
    : (typeof document !== 'undefined' ? document.querySelector('[data-ircc-rounds]') : null);
  if (!target) return null;
  if (target.__irccRoundsPromise) return target.__irccRoundsPromise;
  target.setAttribute('aria-busy', 'true');
  const promise = (async () => {
    let state;
    try {
      state = await resolveRounds();
    } catch (error) {
      state = { status: 'unavailable', categories: {}, reason: error && error.message };
    }
    try {
      renderState(target, state);
    } finally {
      target.setAttribute('aria-busy', 'false');
      target.dataset.irccReady = state.status;
    }
    return state;
  })();
  target.__irccRoundsPromise = promise;
  return promise;
}

export function resetIrccRoundsCache() {
  cachedState = null;
}

export const IRCC_SOURCES = {
  roundsDataUrl: ROUNDS_DATA_URL,
  roundsPageUrl: ROUNDS_PAGE_URL,
  perRoundPageUrl: PER_ROUND_PAGE_URL,
  calculatorUrl: CALCULATOR_URL,
  criteriaUrl: CRITERIA_URL,
  snapshotUrl: SNAPSHOT_URL.href,
  buildRoundSource
};

/**
 * IRCC renames categories from time to time. If a recent French or CEC round
 * no longer matches CATEGORIES, the site would silently keep an old round as
 * "latest". Returns the unrecognised recent draw names so callers can refuse
 * the payload and keep the last verified snapshot instead.
 */
function unrecognisedRecentCategories(payload, now = Date.now()) {
  const recentLimit = new Date(now - 120 * 86400000).toISOString().slice(0, 10);
  const names = (payload && Array.isArray(payload.rounds) ? payload.rounds : []).filter(round => {
    const name = String(round && round.drawName || '');
    if (String(round && round.drawDate || '') < recentLimit) return false;
    if (/fran(?:c|ç)ais|francophon|french/i.test(name)) return !/french[- ]language proficiency/i.test(name);
    if (/canadian experience/i.test(name)) return !/^canadian experience class\b/i.test(name);
    return false;
  }).map(round => round.drawName);
  return [...new Set(names)];
}

/** Snapshot document written by scripts/refresh-v4-ircc.mjs and served live by the Worker. */
function buildSnapshot(parsed, fetchedAt = new Date().toISOString()) {
  const snapshot = {
    verifiedAt: fetchedAt.slice(0, 10),
    fetchedAt,
    source: ROUNDS_DATA_URL,
    roundsPage: ROUNDS_PAGE_URL,
    categories: {}
  };
  for (const [key, round] of Object.entries(parsed.categories)) {
    snapshot.categories[key] = { drawNumber: round.drawNumber, date: round.date, score: round.score, name: round.name, source: round.source };
  }
  return snapshot;
}

export { parseOfficialRounds, parseSnapshot, validIsoDate, buildRoundSource, unrecognisedRecentCategories, buildSnapshot };

if (typeof window !== 'undefined') {
  window.PathwayIrccRounds = {
    setupIrccRounds,
    parseOfficialRounds,
    parseSnapshot,
    resetIrccRoundsCache,
    IRCC_SOURCES
  };
}

if (typeof document !== 'undefined') {
  const autoInit = () => {
    const panel = document.querySelector('[data-ircc-rounds]');
    if (panel && !panel.__irccRoundsPromise) setupIrccRounds(panel).catch(() => {});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  else autoInit();
}
