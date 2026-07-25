(function (global) {
  'use strict';

  const DATA_URL = 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json';
  const CRITERIA_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html';
  const RULES_VERSION = '2026-06-22';
  const CACHE_KEY = 'pathway-ircc-rounds-v2';
  const FALLBACK = {
    cec: { score: 516, date: '2026-07-21', name: 'Canadian Experience Class', draw: '428' },
    french: { score: 399, date: '2026-07-22', name: 'French-language proficiency', draw: '429' },
    metrics: { frenchYear: 2026, frenchInvitations: 40500, frenchRoundCount: 8 },
    fetchedAt: '2026-07-24T00:00:00.000Z',
    source: 'fallback'
  };

  function validRound(round) {
    const score = Number(round && round.drawCRS);
    return round && Number.isInteger(score) && score > 0 && score <= 1200 &&
      /^\d{4}-\d{2}-\d{2}$/.test(round.drawDate || '');
  }

  function normalize(round) {
    return {
      score: Number(round.drawCRS),
      date: round.drawDate,
      name: round.drawName,
      draw: String(round.drawNumber)
    };
  }

  function invitationCount(round) {
    return Number(String(round && round.drawSize || '').replace(/[^\d]/g, '')) || 0;
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      return cached && cached.cec && cached.french && cached.metrics ? cached : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(value) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    } catch (_) {
      // The calculator remains usable when storage is disabled.
    }
  }

  async function load() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('IRCC response unavailable');
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.rounds)) throw new Error('Unexpected IRCC data');

      const cec = payload.rounds.find(round =>
        round.drawName === 'Canadian Experience Class' && validRound(round));
      const french = payload.rounds.find(round =>
        /French[- ]Language proficiency/i.test(round.drawName || '') && validRound(round));

      if (!cec || !french) throw new Error('Required IRCC rounds not found');
      const frenchYear = Number(french.drawDate.slice(0, 4));
      const frenchRounds = payload.rounds.filter(round =>
        /French[- ]Language proficiency/i.test(round.drawName || '') &&
        validRound(round) &&
        round.drawDate.startsWith(`${frenchYear}-`));
      const result = {
        cec: normalize(cec),
        french: normalize(french),
        metrics: {
          frenchYear,
          frenchInvitations: frenchRounds.reduce((total, round) => total + invitationCount(round), 0),
          frenchRoundCount: frenchRounds.length
        },
        fetchedAt: new Date().toISOString(),
        source: 'live'
      };
      writeCache(result);
      return result;
    } catch (_) {
      const cached = readCache();
      return cached ? { ...cached, source: 'cache' } : FALLBACK;
    }
  }

  function formatDate(iso, locale) {
    const date = new Date(`${iso}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || 'es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(date).replace(/\./g, '').toUpperCase();
  }

  function formatLongDate(iso, locale) {
    const date = new Date(`${iso}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || 'es-ES', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(date);
  }

  async function verifyCriteria() {
    try {
      const response = await fetch(CRITERIA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('IRCC criteria unavailable');
      const html = await response.text();
      const normalized = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
      const modified = (html.match(/name="dcterms\.modified"[^>]*content="(\d{4}-\d{2}-\d{2})"/i) || [])[1] || null;
      const checks = [
        /Maximum 500 points total/i,
        /Maximum of 100 points/i,
        /French language skills.{0,120}50/i,
        /Provincial or territorial nomination.{0,80}600/i,
        /removing job offer points/i
      ];
      return {
        valid: checks.every(pattern => pattern.test(normalized)),
        verified: true,
        modified,
        checkedAt: new Date().toISOString()
      };
    } catch (_) {
      return {
        valid: true,
        verified: false,
        modified: RULES_VERSION,
        checkedAt: new Date().toISOString()
      };
    }
  }

  global.PathwayIRCC = {
    DATA_URL, CRITERIA_URL, RULES_VERSION, FALLBACK, load, verifyCriteria, formatDate, formatLongDate
  };
})(typeof window !== 'undefined' ? window : globalThis);
