const assert = require('node:assert/strict');
const { calculate, displayRules } = require('../crs-engine.js');

assert.equal(
  displayRules.exampleBaseScore + displayRules.maxFrenchBonus + displayRules.maxSecondLanguagePoints,
  519
);
assert.equal(displayRules.minFrenchBonus, 25);

const base = {
  maritalStatus: 'single',
  age: 30,
  education: 'less_secondary',
  canadianStudy: 0,
  firstLanguageName: 'en',
  firstLanguage: [0, 0, 0, 0],
  secondLanguagePresent: false,
  secondLanguage: [0, 0, 0, 0],
  canadianWork: 0,
  foreignWork: 0,
  certificate: false,
  nomination: false,
  sibling: false,
  spouseEducation: 'less_secondary',
  spouseCanadianWork: 0,
  spouseLanguage: [0, 0, 0, 0]
};

assert.equal(calculate({ ...base, age: 18 }).details.age, 99);
assert.equal(calculate({ ...base, age: 20 }).details.age, 110);
assert.equal(calculate({ ...base, age: 29 }).details.age, 110);
assert.equal(calculate({ ...base, age: 30 }).details.age, 105);
assert.equal(calculate({ ...base, age: 44 }).details.age, 6);
assert.equal(calculate({ ...base, age: 45 }).details.age, 0);

const basic = calculate({ ...base, education: 'bachelor' });
assert.deepEqual({ total: basic.total, core: basic.core }, { total: 225, core: 225 });

const bilingual = calculate({
  ...base,
  education: 'bachelor',
  canadianWork: 1,
  foreignWork: 3,
  firstLanguage: [9, 9, 9, 9],
  secondLanguagePresent: true,
  secondLanguage: [7, 7, 7, 7]
});
assert.deepEqual(
  {
    core: bilingual.core,
    transferability: bilingual.transferability,
    additional: bilingual.additional,
    frenchBonus: bilingual.frenchBonus,
    total: bilingual.total
  },
  { core: 401, transferability: 88, additional: 50, frenchBonus: 50, total: 539 }
);

const maxWithoutNomination = calculate({
  ...base,
  age: 25,
  education: 'phd',
  canadianStudy: 30,
  firstLanguageName: 'fr',
  firstLanguage: [10, 10, 10, 10],
  secondLanguagePresent: true,
  secondLanguage: [10, 10, 10, 10],
  canadianWork: 5,
  foreignWork: 3,
  certificate: true,
  sibling: true
});
assert.deepEqual(
  {
    core: maxWithoutNomination.core,
    transferability: maxWithoutNomination.transferability,
    additional: maxWithoutNomination.additional,
    total: maxWithoutNomination.total
  },
  { core: 500, transferability: 100, additional: 95, total: 695 }
);

const maxWithSpouseAndNomination = calculate({
  ...base,
  maritalStatus: 'accompanying',
  age: 25,
  education: 'phd',
  canadianStudy: 30,
  firstLanguageName: 'fr',
  firstLanguage: [10, 10, 10, 10],
  secondLanguagePresent: true,
  secondLanguage: [10, 10, 10, 10],
  canadianWork: 5,
  foreignWork: 3,
  certificate: true,
  nomination: true,
  sibling: true,
  spouseEducation: 'phd',
  spouseCanadianWork: 5,
  spouseLanguage: [10, 10, 10, 10]
});
assert.deepEqual(
  {
    core: maxWithSpouseAndNomination.core,
    spouse: maxWithSpouseAndNomination.spouse,
    transferability: maxWithSpouseAndNomination.transferability,
    additional: maxWithSpouseAndNomination.additional,
    total: maxWithSpouseAndNomination.total
  },
  { core: 460, spouse: 40, transferability: 100, additional: 600, total: 1200 }
);

console.log('CRS engine: all reference tests passed');
