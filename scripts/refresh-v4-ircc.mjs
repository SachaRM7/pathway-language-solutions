#!/usr/bin/env node
// Refresh the dated, verified IRCC rounds snapshot used by v4/ircc-rounds.js
// when the live canada.ca fetch is unavailable in the browser.
//
// Usage:
//   node scripts/refresh-v4-ircc.mjs            # fetch, validate, write snapshot
//   node scripts/refresh-v4-ircc.mjs --check    # fetch + validate only, no write
//   node scripts/refresh-v4-ircc.mjs --ceiling 2026-10-05
//
// The snapshot is only ever produced from the official IRCC JSON endpoint.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOfficialRounds, IRCC_SOURCES, unrecognisedRecentCategories, buildSnapshot } from '../v4/ircc-rounds.js';

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, '..', 'v4', 'data', 'ircc-rounds.json');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const ceilingIndex = args.indexOf('--ceiling');
const ceilingDate = ceilingIndex >= 0 ? args[ceilingIndex + 1] : undefined;
const timeoutMs = Number(process.env.IRCC_TIMEOUT_MS) || 15000;

function assertCeiling(value) {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid --ceiling date: ${value}`);
  return value;
}

async function fetchOfficialRounds() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(IRCC_SOURCES.roundsDataUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', 'User-Agent': 'PathwayIRCCSnapshot/1.0' }
    });
    if (!response.ok) throw new Error(`Official endpoint returned HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const payload = await fetchOfficialRounds();
const parsed = parseOfficialRounds(payload, { ceilingDate: assertCeiling(ceilingDate) });

// IRCC renames categories from time to time: fail loudly instead of keeping an old round as "latest".
const unmatched = unrecognisedRecentCategories(payload);
if (unmatched.length) {
  throw new Error(`Unrecognised IRCC category names: ${unmatched.join(', ')}. Update CATEGORIES in v4/ircc-rounds.js.`);
}
const snapshot = buildSnapshot(parsed);

const summary = Object.entries(snapshot.categories)
  .map(([key, round]) => `${key} #${round.drawNumber} ${round.date} CRS ${round.score}`)
  .join(' | ');
console.log(`Verified official rounds (ceiling ${parsed.ceilingDate}): ${summary}`);

if (checkOnly) {
  console.log('Check only: snapshot not written.');
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
}
