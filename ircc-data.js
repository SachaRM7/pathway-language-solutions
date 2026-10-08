(function (global) {
  'use strict';

  const DATA_URL = 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json';
  const CRITERIA_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html';
  const RULES_VERSION = '2026-06-22';
  const ROUNDS_CACHE_KEY = 'pathway-ircc-rounds-v3';
  const RULES_CACHE_KEY = 'pathway-ircc-rules-v1';
  // Same-origin copy of the official rounds, refreshed by the deploy workflow.
  // Used when the browser cannot read canada.ca directly (network, CORS).
  const SNAPSHOT_PATH = 'v4/data/ircc-rounds.json';
  const SCRIPT_URL = global.document && global.document.currentScript ? global.document.currentScript.src : '';
  const FALLBACK = {
    cec: { score: 518, date: '2026-09-29', name: 'Canadian Experience Class', draw: '446' },
    french: { score: 382, date: '2026-08-19', name: 'French-Language proficiency 2026-Version 2', draw: '437' },
    history: {
      cec: [
        { score: 518, date: '2026-09-29', name: 'Canadian Experience Class', draw: '446' },
        { score: 516, date: '2026-07-21', name: 'Canadian Experience Class', draw: '428' },
        { score: 517, date: '2026-07-07', name: 'Canadian Experience Class', draw: '424' },
      ]
    },
    metrics: { frenchYear: 2026, frenchInvitations: 40500, frenchRoundCount: 8 },
    fetchedAt: '2026-10-05T11:32:09.140Z',
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

  function sortedRounds(rounds, predicate) {
    return rounds.filter(round => predicate(round) && validRound(round))
      .sort((left, right) => right.drawDate.localeCompare(left.drawDate) || Number(right.drawNumber) - Number(left.drawNumber));
  }

  function invitationCount(round) {
    return Number(String(round && round.drawSize || '').replace(/[^\d]/g, '')) || 0;
  }

  function readCache(key, validator) {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      return validator(cached) ? cached : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // The site remains usable when storage is disabled.
    }
  }

  async function load() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('IRCC response unavailable');
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.rounds)) throw new Error('Unexpected IRCC data');

      const cecRounds = sortedRounds(payload.rounds, round => round.drawName === 'Canadian Experience Class');
      const frenchRounds = sortedRounds(payload.rounds, round => /French[- ]Language proficiency/i.test(round.drawName || ''));
      if (!cecRounds.length || !frenchRounds.length) throw new Error('Required IRCC rounds not found');

      const cec = cecRounds[0];
      const french = frenchRounds[0];
      const frenchYear = Number(french.drawDate.slice(0, 4));
      const currentFrenchRounds = frenchRounds.filter(round => round.drawDate.startsWith(`${frenchYear}-`));
      const result = {
        cec: normalize(cec),
        french: normalize(french),
        history: { cec: cecRounds.slice(0, 3).map(normalize) },
        metrics: {
          frenchYear,
          frenchInvitations: currentFrenchRounds.reduce((total, round) => total + invitationCount(round), 0),
          frenchRoundCount: currentFrenchRounds.length
        },
        fetchedAt: new Date().toISOString(),
        source: 'live'
      };
      writeCache(ROUNDS_CACHE_KEY, result);
      return result;
    } catch (_) {
      const cached = readCache(ROUNDS_CACHE_KEY, value => value && value.cec && value.french && value.history && value.metrics);
      const snapshot = await loadSnapshot();
      // Keep whichever copy carries the most recent official round.
      const best = [cached, snapshot].filter(Boolean)
        .sort((left, right) => newestDate(right).localeCompare(newestDate(left)))[0];
      return best ? { ...best, source: 'cache' } : FALLBACK;
    }
  }

  function newestDate(value) {
    return [value.cec.date, value.french.date].sort().pop();
  }

  function snapshotRound(value) {
    const round = { drawCRS: value && value.score, drawDate: value && value.date, drawName: value && value.name, drawNumber: value && value.drawNumber };
    return validRound(round) ? normalize(round) : null;
  }

  async function loadSnapshot() {
    try {
      const url = new URL(SNAPSHOT_PATH, SCRIPT_URL || global.location.href);
      const response = await fetch(url.href, { cache: 'no-store' });
      if (!response.ok) return null;
      const payload = await response.json();
      const categories = payload && payload.categories || {};
      const cec = snapshotRound(categories.cec);
      const french = snapshotRound(categories.french);
      if (!cec || !french) return null;
      return {
        cec,
        french,
        history: { cec: [cec] },
        metrics: {},
        fetchedAt: payload.fetchedAt || null,
        origin: 'snapshot'
      };
    } catch (_) {
      return null;
    }
  }

  function decodeHtml(value) {
    const named = { amp: '&', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—' };
    return String(value || '')
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] || match)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseTables(html) {
    return (String(html).match(/<table[^>]*>[\s\S]*?<\/table>/gi) || []).map(tableHtml =>
      (tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []).map(rowHtml =>
        (rowHtml.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || []).map(decodeHtml)
      ).filter(row => row.length)
    ).filter(table => table.length);
  }

  function numberFrom(value) {
    const match = String(value || '').replace(/,/g, '').match(/\d+/);
    return match ? Number(match[0]) : NaN;
  }

  function pair(row) {
    if (!row || row.length < 3) throw new Error('Incomplete CRS row');
    const values = [numberFrom(row[1]), numberFrom(row[2])];
    if (values.some(value => !Number.isFinite(value))) throw new Error('Invalid CRS points');
    return values;
  }

  function findTable(tables, predicate, label) {
    const table = tables.find(candidate => predicate(candidate[0].join(' ')));
    if (!table) throw new Error(`Missing CRS table: ${label}`);
    return table;
  }

  function expandAgeRows(rows) {
    const result = { spouse: {}, single: {} };
    rows.forEach(row => {
      const values = pair(row);
      const range = row[0].match(/(\d+)\s+to\s+(\d+)/i);
      const exact = row[0].match(/^(\d+)\s+years?/i);
      if (range) {
        for (let age = Number(range[1]); age <= Number(range[2]); age += 1) {
          result.spouse[age] = values[0]; result.single[age] = values[1];
        }
      } else if (exact && Number(exact[1]) >= 18 && Number(exact[1]) <= 44) {
        result.spouse[Number(exact[1])] = values[0]; result.single[Number(exact[1])] = values[1];
      }
    });
    if (Object.keys(result.single).length !== 27) throw new Error('Incomplete age table');
    return result;
  }

  function languageArrays(table, spouseColumn, singleColumn) {
    const spouse = Array(11).fill(0);
    const single = Array(11).fill(0);
    table.slice(1).forEach(row => {
      const label = row[0];
      const values = [numberFrom(row[spouseColumn]), numberFrom(row[singleColumn])];
      if (values.some(value => !Number.isFinite(value))) throw new Error('Invalid language table');
      let levels = [];
      if (/Less than CLB 4/i.test(label)) levels = [0, 1, 2, 3];
      else if (/CLB 4 or less/i.test(label)) levels = [0, 1, 2, 3, 4];
      else if (/CLB 4 or 5/i.test(label)) levels = [4, 5];
      else if (/CLB 5 or 6/i.test(label)) levels = [5, 6];
      else if (/CLB 7 or 8/i.test(label)) levels = [7, 8];
      else if (/CLB 9 or more/i.test(label)) levels = [9, 10];
      else {
        const exact = label.match(/CLB\s+(\d+)/i);
        if (exact) levels = [Math.min(10, Number(exact[1]))];
      }
      levels.forEach(level => { spouse[level] = values[0]; single[level] = values[1]; });
    });
    return { spouse, single };
  }

  function findRow(table, pattern) {
    const row = table.slice(1).find(candidate => pattern.test(candidate[0]));
    if (!row) throw new Error(`Missing CRS row: ${pattern}`);
    return row;
  }

  function extractPageNumber(text, pattern, label) {
    const match = text.match(pattern);
    if (!match) throw new Error(`Missing CRS maximum: ${label}`);
    return Number(match[1].replace(/,/g, ''));
  }

  function parseCriteriaRules(html) {
    const tables = parseTables(html);
    const pageText = decodeHtml(html);
    if (tables.length < 15) throw new Error('Incomplete IRCC criteria page');

    const ageTable = findTable(tables, header => /^Age\b/i.test(header), 'age');
    const educationTable = findTable(tables, header => /^Level of Education\b/i.test(header), 'education');
    const firstLanguageTable = findTable(tables, header => /Canadian Language Benchmark.*Maximum 128 points/i.test(header), 'first language');
    const secondLanguageTable = findTable(tables, header => /Canadian Language Benchmark.*Maximum 22 points/i.test(header), 'second language');
    const canadianWorkTable = findTable(tables, header => /^Canadian work experience\b.*Maximum 70 points/i.test(header), 'Canadian work');
    const spouseEducationTable = findTable(tables, header => /^Spouse.s.*level of education/i.test(header), 'spouse education');
    const spouseLanguageTable = findTable(tables, header => /Canadian Language Benchmark.*Maximum 20 points for section/i.test(header), 'spouse language');
    const spouseWorkTable = findTable(tables, header => /^Spouse.s Canadian work experience/i.test(header), 'spouse work');
    const educationLanguageTable = findTable(tables, header => /^With good official language proficiency.*post-secondary degree/i.test(header), 'education and language');
    const educationCanadaTable = findTable(tables, header => /^With Canadian work experience and a post-secondary degree/i.test(header), 'education and Canadian work');
    const foreignLanguageTable = findTable(tables, header => /^Years of experience.*foreign work experience.*CLB 7/i.test(header), 'foreign work and language');
    const foreignCanadaTable = findTable(tables, header => /^Years of experience.*foreign work experience.*1 year of Canadian work/i.test(header), 'foreign and Canadian work');
    const certificateTable = findTable(tables, header => /^Certificate of qualification.*CLB 5/i.test(header), 'trade certificate');
    const additionalTable = findTable(tables, header => /^Additional points\b/i.test(header), 'additional points');

    const educationRows = educationTable.slice(1);
    if (educationRows.length < 8) throw new Error('Incomplete education table');
    const firstLanguage = languageArrays(firstLanguageTable, 1, 2);
    const secondLanguage = languageArrays(secondLanguageTable, 1, 2);
    const spouseLanguage = languageArrays(spouseLanguageTable, 1, 1).spouse;
    const canadianWorkRows = canadianWorkTable.slice(1);
    const spouseEducationRows = spouseEducationTable.slice(1);
    const spouseWorkRows = spouseWorkTable.slice(1);

    const additionalRow = pattern => numberFrom(findRow(additionalTable, pattern)[1]);
    const educationLanguageTier1 = pair(findRow(educationLanguageTable, /^Post-secondary program credential/i));
    const educationLanguageTier2 = pair(findRow(educationLanguageTable, /^Two or more post-secondary/i));
    const educationCanadaTier1 = pair(findRow(educationCanadaTable, /^Post-secondary program credential/i));
    const educationCanadaTier2 = pair(findRow(educationCanadaTable, /^Two or more post-secondary/i));
    const foreignLanguageTier1 = pair(findRow(foreignLanguageTable, /^1 or 2 years/i));
    const foreignLanguageTier2 = pair(findRow(foreignLanguageTable, /^3 years or more/i));
    const foreignCanadaTier1 = pair(findRow(foreignCanadaTable, /^1 or 2 years/i));
    const foreignCanadaTier2 = pair(findRow(foreignCanadaTable, /^3 years or more/i));
    const certificate = pair(findRow(certificateTable, /^With a certificate/i));

    const coreSpouse = extractPageNumber(pageText, /With a spouse or common-law partner:\s*Maximum\s*([\d,]+)\s*points total/i, 'core spouse');
    const coreSingle = extractPageNumber(pageText, /Without a spouse or common-law partner:\s*Maximum\s*([\d,]+)\s*points total/i, 'core single');
    const transferabilityCap = extractPageNumber(pageText, /For skill transferability factors:\s*Maximum of\s*([\d,]+)\s*points/i, 'transferability');
    const additionalCap = numberFrom(additionalTable[0][1]);

    const rules = {
      age: expandAgeRows(ageTable.slice(1)),
      education: {
        less_secondary: pair(educationRows[0]), secondary: pair(educationRows[1]), one_year: pair(educationRows[2]),
        two_year: pair(educationRows[3]), bachelor: pair(educationRows[4]), two_or_more: pair(educationRows[5]),
        master: pair(educationRows[6]), phd: pair(educationRows[7])
      },
      firstLanguage,
      secondLanguage: {
        points: secondLanguage.single,
        caps: {
          spouse: extractPageNumber(secondLanguageTable[0].join(' '), /Maximum\s*([\d,]+)\s*points.*Maximum/i, 'second language spouse'),
          single: Number((secondLanguageTable[0].join(' ').match(/Maximum\s*([\d,]+)\s*points\)?\s*$/i) || [])[1])
        }
      },
      canadianWork: {
        spouse: canadianWorkRows.map(row => pair(row)[0]),
        single: canadianWorkRows.map(row => pair(row)[1])
      },
      spouse: {
        education: {
          less_secondary: numberFrom(spouseEducationRows[0][1]), secondary: numberFrom(spouseEducationRows[1][1]),
          one_year: numberFrom(spouseEducationRows[2][1]), two_year: numberFrom(spouseEducationRows[3][1]),
          bachelor: numberFrom(spouseEducationRows[4][1]), two_or_more: numberFrom(spouseEducationRows[5][1]),
          master: numberFrom(spouseEducationRows[6][1]), phd: numberFrom(spouseEducationRows[7][1])
        },
        language: spouseLanguage,
        work: spouseWorkRows.map(row => numberFrom(row[1]))
      },
      transferability: {
        educationLanguage: { tier1: educationLanguageTier1, tier2: educationLanguageTier2 },
        educationCanada: { tier1: educationCanadaTier1, tier2: educationCanadaTier2 },
        foreignLanguage: { tier1: foreignLanguageTier1, tier2: foreignLanguageTier2 },
        foreignCanada: { tier1: foreignCanadaTier1, tier2: foreignCanadaTier2 },
        certificate,
        educationCap: Math.max(...educationLanguageTier2),
        foreignCap: Math.max(...foreignLanguageTier2),
        totalCap: transferabilityCap
      },
      additional: {
        sibling: additionalRow(/^Brother or sister/i),
        frenchLow: additionalRow(/NCLC 7.*CLB 4 or lower/i),
        frenchHigh: additionalRow(/NCLC 7.*CLB 5 or higher/i),
        canadianStudyShort: additionalRow(/credential of one or two years/i),
        canadianStudyLong: additionalRow(/credential three years or longer/i),
        nomination: additionalRow(/^Provincial or territorial nomination/i),
        cap: additionalCap
      },
      caps: { coreSpouse, coreSingle, total: coreSingle + transferabilityCap + additionalCap }
    };

    if (!rules.secondLanguage.caps.single || !global.PathwayCRS || !global.PathwayCRS.validateRules(rules)) {
      throw new Error('Parsed CRS rules failed validation');
    }
    return rules;
  }

  async function loadRules() {
    try {
      const response = await fetch(CRITERIA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('IRCC criteria unavailable');
      const html = await response.text();
      const modified = (html.match(/name="dcterms\.modified"[^>]*content="(\d{4}-\d{2}-\d{2})"/i) || [])[1] || RULES_VERSION;
      const rules = parseCriteriaRules(html);
      const result = { rules, modified, fetchedAt: new Date().toISOString(), source: 'live' };
      writeCache(RULES_CACHE_KEY, result);
      return result;
    } catch (_) {
      const cached = readCache(RULES_CACHE_KEY, value => value && value.rules && global.PathwayCRS && global.PathwayCRS.validateRules(value.rules));
      if (cached) return { ...cached, source: 'cache' };
      return {
        rules: global.PathwayCRS ? global.PathwayCRS.DEFAULT_RULES : null,
        modified: RULES_VERSION,
        fetchedAt: null,
        source: 'fallback'
      };
    }
  }

  function formatDate(iso, locale) {
    const date = new Date(`${iso}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || 'es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(date).replace(/\./g, '').toUpperCase();
  }

  function formatLongDate(iso, locale) {
    const date = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || 'es-ES', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(date);
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  global.PathwayIRCC = {
    DATA_URL, CRITERIA_URL, RULES_VERSION, FALLBACK, load, loadRules, parseCriteriaRules,
    formatDate, formatLongDate, todayIso
  };
})(typeof window !== 'undefined' ? window : globalThis);
