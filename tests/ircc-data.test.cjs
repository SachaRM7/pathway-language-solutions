const assert = require('node:assert/strict');
const PathwayCRS = require('../crs-engine.js');

const rounds = [
  { drawCRS: '399', drawDate: '2026-07-22', drawName: 'French-language proficiency', drawNumber: '429', drawSize: '5,000' },
  { drawCRS: '512', drawDate: '2026-07-01', drawName: 'Canadian Experience Class', drawNumber: '420', drawSize: '1,000' },
  { drawCRS: '390', drawDate: '2025-12-10', drawName: 'French-language proficiency', drawNumber: '400', drawSize: '3,000' },
  { drawCRS: '510', drawDate: '2026-08-11', drawName: 'Canadian Experience Class', drawNumber: '431', drawSize: '1,000' },
  { drawCRS: '401', drawDate: '2026-08-12', drawName: 'French-language proficiency', drawNumber: '432', drawSize: '5,000' },
  { drawCRS: '511', drawDate: '2026-08-01', drawName: 'Canadian Experience Class', drawNumber: '430', drawSize: '1,000' }
];

const table = rows => `<table>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</table>`;
const ageRows = [
  ['Age', 'With a spouse or common-law partner (Maximum 100 points)', 'Without a spouse or common-law partner (Maximum 110 points)'],
  ['18 years of age', 90, 99], ['19 years of age', 95, 105], ['20 to 29 years of age', 100, 110],
  ...Array.from({ length: 15 }, (_, index) => {
    const age = 30 + index;
    return [`${age} years of age`, PathwayCRS.DEFAULT_RULES.age.spouse[age], PathwayCRS.DEFAULT_RULES.age.single[age]];
  })
];
const educationRows = [
  ['Level of Education', 'With a spouse or common-law partner (Maximum 140 points)', 'Without a spouse or common-law partner (Maximum 150 points)'],
  ['Less than secondary school', 0, 0], ['Secondary diploma', 28, 30], ['One-year degree', 84, 90],
  ['Two-year program', 91, 98], ["Bachelor's degree", 112, 120], ['Two or more certificates', 119, 128],
  ["Master's degree", 126, 135], ['Doctoral level', 140, 150]
];
const criteriaHtml = `
  <meta name="dcterms.modified" content="2026-06-22">
  <p>With a spouse or common-law partner: Maximum 460 points total</p>
  <p>Without a spouse or common-law partner: Maximum 500 points total</p>
  <p>For skill transferability factors: Maximum of 100 points</p>
  ${table(ageRows)}
  ${table(educationRows)}
  ${table([
    ['Canadian Language Benchmark (CLB) level per ability', 'With spouse (Maximum 128 points)', 'Without spouse (Maximum 136 points)'],
    ['Less than CLB 4', 0, 0], ['CLB 4 or 5', 6, 6], ['CLB 6', 8, 9], ['CLB 7', 16, 17],
    ['CLB 8', 22, 23], ['CLB 9', 29, 31], ['CLB 10 or more', 32, 34]
  ])}
  ${table([
    ['Canadian Language Benchmark (CLB) level per ability', 'With spouse (Maximum 22 points)', 'Without spouse (Maximum 24 points)'],
    ['CLB 4 or less', 0, 0], ['CLB 5 or 6', 1, 1], ['CLB 7 or 8', 3, 3], ['CLB 9 or more', 6, 6]
  ])}
  ${table([
    ['Canadian work experience', 'With spouse (Maximum 70 points)', 'Without spouse (Maximum 80 points)'],
    ['None or less than a year', 0, 0], ['1 year', 35, 40], ['2 years', 46, 53], ['3 years', 56, 64], ['4 years', 63, 72], ['5 years or more', 70, 80]
  ])}
  ${table([
    ["Spouse's or common-law partner's level of education", 'With spouse', 'Does not apply'],
    ['Less than secondary school', 0, 'n/a'], ['Secondary school', 2, 'n/a'], ['One-year program', 6, 'n/a'],
    ['Two-year program', 7, 'n/a'], ["Bachelor's degree", 8, 'n/a'], ['Two or more certificates', 9, 'n/a'],
    ["Master's degree", 10, 'n/a'], ['Doctoral level', 10, 'n/a']
  ])}
  ${table([
    ['Canadian Language Benchmark (CLB) level per ability', 'Maximum 20 points for section', 'Does not apply'],
    ['CLB 4 or less', 0, 'n/a'], ['CLB 5 or 6', 1, 'n/a'], ['CLB 7 or 8', 3, 'n/a'], ['CLB 9 or more', 5, 'n/a']
  ])}
  ${table([
    ["Spouse's Canadian work experience", 'Maximum 10 points', 'Does not apply'],
    ['None or less than a year', 0, 'n/a'], ['1 year', 5, 'n/a'], ['2 years', 7, 'n/a'], ['3 years', 8, 'n/a'], ['4 years', 9, 'n/a'], ['5 years or more', 10, 'n/a']
  ])}
  ${table([
    ['With good official language proficiency and a post-secondary degree', 'CLB 7', 'CLB 9'],
    ['Secondary school', 0, 0], ['Post-secondary program credential', 13, 25], ['Two or more post-secondary', 25, 50]
  ])}
  ${table([
    ['With Canadian work experience and a post-secondary degree', '1 year', '2 years'],
    ['Secondary school', 0, 0], ['Post-secondary program credential', 13, 25], ['Two or more post-secondary', 25, 50]
  ])}
  ${table([
    ['Years of experience - foreign work experience + CLB 7', 'CLB 7', 'CLB 9'],
    ['No foreign work experience', 0, 0], ['1 or 2 years', 13, 25], ['3 years or more', 25, 50]
  ])}
  ${table([
    ['Years of experience - foreign work experience + 1 year of Canadian work', '1 year', '2 years'],
    ['No foreign work experience', 0, 0], ['1 or 2 years', 13, 25], ['3 years or more', 25, 50]
  ])}
  ${table([
    ['Certificate of qualification - CLB 5', 'CLB 5', 'CLB 7'], ['With a certificate', 25, 50]
  ])}
  ${table([
    ['Additional points', 'Maximum 600 points'],
    ['Brother or sister living in Canada', 15],
    ['Scored NCLC 7 and scored CLB 4 or lower', 25],
    ['Scored NCLC 7 and scored CLB 5 or higher', 50],
    ['Post-secondary education in Canada - credential of one or two years', 15],
    ['Post-secondary education in Canada - credential three years or longer', 30],
    ['Provincial or territorial nomination', 600]
  ])}
  ${table([['Unused validation table', 0]])}
`;

global.localStorage = {
  getItem() { return null; },
  setItem() {}
};
global.fetch = async url => String(url).includes('ee_rounds')
  ? { ok: true, async json() { return { rounds }; } }
  : { ok: true, async text() { return criteriaHtml; } };

require('../ircc-data.js');

(async () => {
  const data = await global.PathwayIRCC.load();
  assert.equal(data.cec.score, 510);
  assert.equal(data.cec.date, '2026-08-11');
  assert.equal(data.french.score, 401);
  assert.equal(data.french.date, '2026-08-12');
  assert.deepEqual(data.history.cec.map(round => round.score), [510, 511, 512]);
  assert.deepEqual(data.metrics, { frenchYear: 2026, frenchInvitations: 10000, frenchRoundCount: 2 });

  const rulesState = await global.PathwayIRCC.loadRules();
  assert.equal(rulesState.source, 'live');
  assert.equal(rulesState.modified, '2026-06-22');
  assert.equal(PathwayCRS.validateRules(rulesState.rules), true);
  assert.deepEqual(rulesState.rules, PathwayCRS.DEFAULT_RULES);

  const changedCriteriaHtml = criteriaHtml.replace(
    'Scored NCLC 7 and scored CLB 5 or higher</td><td>50',
    'Scored NCLC 7 and scored CLB 5 or higher</td><td>55'
  );
  const changedRules = global.PathwayIRCC.parseCriteriaRules(changedCriteriaHtml);
  assert.equal(changedRules.additional.frenchHigh, 55);
  PathwayCRS.setRules(changedRules);
  assert.equal(PathwayCRS.displayRules.maxFrenchBonus, 55);

  PathwayCRS.setRules(rulesState.rules);
  assert.equal(PathwayCRS.displayRules.maxFrenchBonus, 50);
  assert.equal(PathwayCRS.displayRules.maxSecondLanguagePointsWithSpouse, 22);
  console.log('IRCC data and automatic CRS rules: all tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
