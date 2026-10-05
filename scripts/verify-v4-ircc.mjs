import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseOfficialRounds, parseSnapshot, validIsoDate, buildRoundSource } from '../v4/ircc-rounds.js';

const snapshot = JSON.parse(await readFile(new URL('../v4/data/ircc-rounds.json', import.meta.url), 'utf8'));
const options = { ceilingDate: '2026-10-05' };
const rounds = Object.values(snapshot.categories).map(round => ({ drawDate: round.date, drawCRS: String(round.score), drawName: round.name, drawNumber: round.drawNumber }));
let checks = 0;
function check(name, test) { test(); checks++; console.log(`PASS ${name}`); }
check('real date accepted', () => assert(validIsoDate('2026-08-19')));
for (const date of ['2026-02-30', '2026-8-9', '', 'invalid']) check(`invalid date rejected: ${date}`, () => assert(!validIsoDate(date)));
check('official round categories and scores', () => {
  const value = parseOfficialRounds({ rounds }, options);
  assert.equal(value.categories.french.score, 382);
  assert.equal(value.categories.cec.score, 518);
  assert.notEqual(value.categories.french.name, value.categories.cec.name);
});
for (const payload of [null, {}, { rounds: [] }, { rounds: [rounds[0]] }]) check('incomplete payload rejected', () => assert.throws(() => parseOfficialRounds(payload, options)));
for (const score of ['', '-1', '1.5', 'not 10', '0', '1201']) check(`invalid CRS rejected: ${score}`, () => assert.throws(() => parseOfficialRounds({ rounds: [{ ...rounds[0], drawCRS: score }, rounds[1]] }, options)));
check('future round excluded', () => assert.throws(() => parseOfficialRounds({ rounds: [{ ...rounds[0], drawDate: '2099-10-01' }, rounds[1]] }, options)));
check('same-day higher round number wins', () => {
  const value = parseOfficialRounds({ rounds: [...rounds, { ...rounds[0], drawNumber: '999', drawCRS: '400' }] }, options);
  assert.equal(value.categories.french.score, 400);
});
check('dated snapshot accepted', () => assert.equal(parseSnapshot(snapshot, options).verifiedAt, '2026-10-05'));
check('undated snapshot rejected', () => assert.throws(() => parseSnapshot({ ...snapshot, verifiedAt: null }, options)));
check('future verification rejected', () => assert.throws(() => parseSnapshot({ ...snapshot, verifiedAt: '2099-01-01' }, options)));
check('missing snapshot category rejected', () => assert.throws(() => parseSnapshot({ ...snapshot, categories: {} }, options)));
check('untrusted round link never followed', () => assert.equal(new URL(buildRoundSource({ drawNumberURL: '<a href="https://example.org/">unsafe</a>' }, '437')).hostname, 'www.canada.ca'));
console.log(`Completed ${checks} IRCC checks.`);
