(function (global) {
  'use strict';

  const DEFAULT_RULES = {
    age: {
      spouse: { 18: 90, 19: 95, 20: 100, 21: 100, 22: 100, 23: 100, 24: 100, 25: 100, 26: 100, 27: 100, 28: 100, 29: 100, 30: 95, 31: 90, 32: 85, 33: 80, 34: 75, 35: 70, 36: 65, 37: 60, 38: 55, 39: 50, 40: 45, 41: 35, 42: 25, 43: 15, 44: 5 },
      single: { 18: 99, 19: 105, 20: 110, 21: 110, 22: 110, 23: 110, 24: 110, 25: 110, 26: 110, 27: 110, 28: 110, 29: 110, 30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55, 40: 50, 41: 39, 42: 28, 43: 17, 44: 6 }
    },
    education: {
      less_secondary: [0, 0], secondary: [28, 30], one_year: [84, 90],
      two_year: [91, 98], bachelor: [112, 120], two_or_more: [119, 128],
      master: [126, 135], phd: [140, 150]
    },
    firstLanguage: {
      spouse: [0, 0, 0, 0, 6, 6, 8, 16, 22, 29, 32],
      single: [0, 0, 0, 0, 6, 6, 9, 17, 23, 31, 34]
    },
    secondLanguage: {
      points: [0, 0, 0, 0, 0, 1, 1, 3, 3, 6, 6],
      caps: { spouse: 22, single: 24 }
    },
    canadianWork: {
      spouse: [0, 35, 46, 56, 63, 70],
      single: [0, 40, 53, 64, 72, 80]
    },
    spouse: {
      education: { less_secondary: 0, secondary: 2, one_year: 6, two_year: 7, bachelor: 8, two_or_more: 9, master: 10, phd: 10 },
      language: [0, 0, 0, 0, 0, 1, 1, 3, 3, 5, 5],
      work: [0, 5, 7, 8, 9, 10]
    },
    transferability: {
      educationLanguage: { tier1: [13, 25], tier2: [25, 50] },
      educationCanada: { tier1: [13, 25], tier2: [25, 50] },
      foreignLanguage: { tier1: [13, 25], tier2: [25, 50] },
      foreignCanada: { tier1: [13, 25], tier2: [25, 50] },
      certificate: [25, 50],
      educationCap: 50,
      foreignCap: 50,
      totalCap: 100
    },
    additional: {
      sibling: 15,
      frenchLow: 25,
      frenchHigh: 50,
      canadianStudyShort: 15,
      canadianStudyLong: 30,
      nomination: 600,
      cap: 600
    },
    caps: { coreSpouse: 460, coreSingle: 500, total: 1200 }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  let activeRules = clone(DEFAULT_RULES);

  function validNumber(value, maximum) {
    return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= maximum;
  }

  function validateRules(rules) {
    try {
      const requiredEducation = ['less_secondary', 'secondary', 'one_year', 'two_year', 'bachelor', 'two_or_more', 'master', 'phd'];
      const arrays = [
        rules.firstLanguage.spouse, rules.firstLanguage.single, rules.secondLanguage.points,
        rules.canadianWork.spouse, rules.canadianWork.single, rules.spouse.language, rules.spouse.work
      ];
      if (arrays.some(values => !Array.isArray(values) || values.some(value => !validNumber(value, 1200)))) return false;
      if (rules.firstLanguage.spouse.length !== 11 || rules.firstLanguage.single.length !== 11 || rules.secondLanguage.points.length !== 11) return false;
      if (rules.canadianWork.spouse.length !== 6 || rules.canadianWork.single.length !== 6 || rules.spouse.work.length !== 6) return false;
      if (!requiredEducation.every(key => Array.isArray(rules.education[key]) && rules.education[key].length === 2)) return false;
      if (!requiredEducation.every(key => validNumber(rules.spouse.education[key], 100))) return false;
      if (!validNumber(rules.secondLanguage.caps.spouse, 100) || !validNumber(rules.secondLanguage.caps.single, 100)) return false;
      if (!validNumber(rules.transferability.totalCap, 300) || !validNumber(rules.additional.cap, 1000)) return false;
      if (!validNumber(rules.caps.coreSpouse, 1000) || !validNumber(rules.caps.coreSingle, 1000) || !validNumber(rules.caps.total, 2000)) return false;
      return rules.caps.total === rules.caps.coreSingle + rules.transferability.totalCap + rules.additional.cap;
    } catch (_) {
      return false;
    }
  }

  function setRules(rules) {
    if (!validateRules(rules)) throw new Error('Invalid CRS rules');
    activeRules = clone(rules);
    return clone(activeRules);
  }

  function getRules() {
    return clone(activeRules);
  }

  function clampLevel(value) {
    const level = Number(value);
    return Number.isFinite(level) ? Math.max(0, Math.min(10, Math.trunc(level))) : 0;
  }

  function levels(value) {
    const input = Array.isArray(value) ? value : [];
    return [0, 1, 2, 3].map(index => clampLevel(input[index]));
  }

  function agePoints(age, hasSpouse) {
    const value = Math.trunc(Number(age));
    if (!Number.isFinite(value)) return 0;
    return Number(activeRules.age[hasSpouse ? 'spouse' : 'single'][value] || 0);
  }

  function educationTransferTier(education) {
    if (education === 'two_or_more' || education === 'master' || education === 'phd') return 2;
    if (education === 'one_year' || education === 'two_year' || education === 'bachelor') return 1;
    return 0;
  }

  function languageBand(first) {
    const minimum = Math.min(...first);
    if (minimum >= 9) return 2;
    if (minimum >= 7) return 1;
    return 0;
  }

  function tierPoints(table, tier, upperBand) {
    if (!tier) return 0;
    return table[tier === 1 ? 'tier1' : 'tier2'][upperBand ? 1 : 0];
  }

  function calculate(profile) {
    const hasSpouse = profile.maritalStatus === 'accompanying';
    const education = activeRules.education[profile.education] ? profile.education : 'less_secondary';
    const first = levels(profile.firstLanguage);
    const second = profile.secondLanguagePresent ? levels(profile.secondLanguage) : [0, 0, 0, 0];
    const canadianYears = Math.max(0, Math.min(5, Number(profile.canadianWork) || 0));
    const foreignYears = Math.max(0, Math.min(3, Number(profile.foreignWork) || 0));

    const age = agePoints(profile.age, hasSpouse);
    const educationCore = activeRules.education[education][hasSpouse ? 0 : 1];
    const firstLanguage = first.reduce((sum, level) => sum + activeRules.firstLanguage[hasSpouse ? 'spouse' : 'single'][level], 0);
    const secondLanguage = Math.min(
      activeRules.secondLanguage.caps[hasSpouse ? 'spouse' : 'single'],
      second.reduce((sum, level) => sum + activeRules.secondLanguage.points[level], 0)
    );
    const canadianWork = activeRules.canadianWork[hasSpouse ? 'spouse' : 'single'][canadianYears];
    const core = age + educationCore + firstLanguage + secondLanguage + canadianWork;

    let spouse = 0;
    if (hasSpouse) {
      const spouseEducation = activeRules.spouse.education[profile.spouseEducation] || 0;
      const spouseLanguage = levels(profile.spouseLanguage)
        .reduce((sum, level) => sum + activeRules.spouse.language[level], 0);
      const spouseCanadianWork = activeRules.spouse.work[Math.max(0, Math.min(5, Number(profile.spouseCanadianWork) || 0))];
      spouse = spouseEducation + spouseLanguage + spouseCanadianWork;
    }

    const langBand = languageBand(first);
    const educationTier = educationTransferTier(education);
    const educationLanguage = langBand === 0 ? 0 : tierPoints(activeRules.transferability.educationLanguage, educationTier, langBand === 2);
    const educationCanada = canadianYears === 0 ? 0 : tierPoints(activeRules.transferability.educationCanada, educationTier, canadianYears >= 2);
    const educationTransfer = Math.min(activeRules.transferability.educationCap, educationLanguage + educationCanada);

    const foreignTier = foreignYears >= 3 ? 2 : foreignYears >= 1 ? 1 : 0;
    const foreignLanguage = langBand === 0 ? 0 : tierPoints(activeRules.transferability.foreignLanguage, foreignTier, langBand === 2);
    const foreignCanada = canadianYears === 0 ? 0 : tierPoints(activeRules.transferability.foreignCanada, foreignTier, canadianYears >= 2);
    const foreignTransfer = Math.min(activeRules.transferability.foreignCap, foreignLanguage + foreignCanada);

    let certificate = 0;
    if (profile.certificate && Math.min(...first) >= 5) {
      certificate = activeRules.transferability.certificate[Math.min(...first) >= 7 ? 1 : 0];
    }
    const transferability = Math.min(activeRules.transferability.totalCap, educationTransfer + foreignTransfer + certificate);

    const french = profile.firstLanguageName === 'fr'
      ? first
      : (profile.secondLanguagePresent ? second : [0, 0, 0, 0]);
    const english = profile.firstLanguageName === 'en'
      ? first
      : (profile.secondLanguagePresent ? second : [0, 0, 0, 0]);
    const frenchEligible = Math.min(...french) >= 7;
    const frenchBonus = frenchEligible
      ? (Math.min(...english) >= 5 ? activeRules.additional.frenchHigh : activeRules.additional.frenchLow)
      : 0;
    const canadianStudy = Number(profile.canadianStudy) === activeRules.additional.canadianStudyShort
      ? activeRules.additional.canadianStudyShort
      : Number(profile.canadianStudy) === activeRules.additional.canadianStudyLong
        ? activeRules.additional.canadianStudyLong : 0;
    const additionalRaw = (profile.nomination ? activeRules.additional.nomination : 0) +
      (profile.sibling ? activeRules.additional.sibling : 0) + canadianStudy + frenchBonus;
    const additional = Math.min(activeRules.additional.cap, additionalRaw);
    const total = Math.min(activeRules.caps.total, core + spouse + transferability + additional);

    return {
      total,
      core,
      spouse,
      transferability,
      additional,
      frenchBonus,
      frenchEligible,
      details: {
        age, education: educationCore, firstLanguage, secondLanguage, canadianWork,
        educationTransfer, foreignTransfer, certificate
      }
    };
  }

  function displayRules() {
    return {
      exampleBaseScore: 445,
      minFrenchBonus: activeRules.additional.frenchLow,
      maxFrenchBonus: activeRules.additional.frenchHigh,
      maxSecondLanguagePoints: activeRules.secondLanguage.caps.single,
      maxSecondLanguagePointsWithSpouse: activeRules.secondLanguage.caps.spouse
    };
  }

  const api = { calculate, setRules, getRules, validateRules, DEFAULT_RULES: clone(DEFAULT_RULES) };
  Object.defineProperty(api, 'displayRules', { enumerable: true, get: displayRules });
  Object.defineProperty(api, 'tables', {
    enumerable: true,
    get: () => ({ age: clone(activeRules.age), education: clone(activeRules.education), canadianWork: clone(activeRules.canadianWork) })
  });
  global.PathwayCRS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
