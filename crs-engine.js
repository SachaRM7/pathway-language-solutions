(function (global) {
  'use strict';

  const AGE_30_TO_44 = {
    spouse: [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 35, 25, 15, 5],
    single: [105, 99, 94, 88, 83, 77, 72, 66, 61, 55, 50, 39, 28, 17, 6]
  };
  const EDUCATION = {
    less_secondary: [0, 0], secondary: [28, 30], one_year: [84, 90],
    two_year: [91, 98], bachelor: [112, 120], two_or_more: [119, 128],
    master: [126, 135], phd: [140, 150]
  };
  const SPOUSE_EDUCATION = {
    less_secondary: 0, secondary: 2, one_year: 6, two_year: 7,
    bachelor: 8, two_or_more: 9, master: 10, phd: 10
  };
  const CANADIAN_WORK = {
    spouse: [0, 35, 46, 56, 63, 70],
    single: [0, 40, 53, 64, 72, 80]
  };
  const SPOUSE_WORK = [0, 5, 7, 8, 9, 10];

  function clampLevel(value) {
    const level = Number(value);
    return Number.isFinite(level) ? Math.max(0, Math.min(10, Math.trunc(level))) : 0;
  }

  function levels(value) {
    const input = Array.isArray(value) ? value : [];
    return [0, 1, 2, 3].map(index => clampLevel(input[index]));
  }

  function agePoints(age, hasSpouse) {
    const value = Number(age);
    if (!Number.isFinite(value) || value <= 17 || value >= 45) return 0;
    if (value === 18) return hasSpouse ? 90 : 99;
    if (value === 19) return hasSpouse ? 95 : 105;
    if (value <= 29) return hasSpouse ? 100 : 110;
    return AGE_30_TO_44[hasSpouse ? 'spouse' : 'single'][value - 30] || 0;
  }

  function firstLanguageAbility(level, hasSpouse) {
    if (level < 4) return 0;
    if (level <= 5) return 6;
    if (level === 6) return hasSpouse ? 8 : 9;
    if (level === 7) return hasSpouse ? 16 : 17;
    if (level === 8) return hasSpouse ? 22 : 23;
    if (level === 9) return hasSpouse ? 29 : 31;
    return hasSpouse ? 32 : 34;
  }

  function secondLanguageAbility(level) {
    if (level <= 4) return 0;
    if (level <= 6) return 1;
    if (level <= 8) return 3;
    return 6;
  }

  function spouseLanguageAbility(level) {
    if (level <= 4) return 0;
    if (level <= 6) return 1;
    if (level <= 8) return 3;
    return 5;
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

  function calculate(profile) {
    const hasSpouse = profile.maritalStatus === 'accompanying';
    const education = EDUCATION[profile.education] ? profile.education : 'less_secondary';
    const first = levels(profile.firstLanguage);
    const second = profile.secondLanguagePresent ? levels(profile.secondLanguage) : [0, 0, 0, 0];
    const canadianYears = Math.max(0, Math.min(5, Number(profile.canadianWork) || 0));
    const foreignYears = Math.max(0, Math.min(3, Number(profile.foreignWork) || 0));

    const age = agePoints(profile.age, hasSpouse);
    const educationCore = EDUCATION[education][hasSpouse ? 0 : 1];
    const firstLanguage = first.reduce((sum, level) => sum + firstLanguageAbility(level, hasSpouse), 0);
    const secondLanguage = Math.min(hasSpouse ? 22 : 24,
      second.reduce((sum, level) => sum + secondLanguageAbility(level), 0));
    const canadianWork = CANADIAN_WORK[hasSpouse ? 'spouse' : 'single'][canadianYears];
    const core = age + educationCore + firstLanguage + secondLanguage + canadianWork;

    let spouse = 0;
    if (hasSpouse) {
      const spouseEducation = SPOUSE_EDUCATION[profile.spouseEducation] || 0;
      const spouseLanguage = levels(profile.spouseLanguage)
        .reduce((sum, level) => sum + spouseLanguageAbility(level), 0);
      const spouseCanadianWork = SPOUSE_WORK[Math.max(0, Math.min(5, Number(profile.spouseCanadianWork) || 0))];
      spouse = spouseEducation + spouseLanguage + spouseCanadianWork;
    }

    const langBand = languageBand(first);
    const educationTier = educationTransferTier(education);
    const educationLanguage = educationTier === 0 || langBand === 0 ? 0 :
      educationTier === 1 ? (langBand === 2 ? 25 : 13) : (langBand === 2 ? 50 : 25);
    const educationCanada = educationTier === 0 || canadianYears === 0 ? 0 :
      educationTier === 1 ? (canadianYears >= 2 ? 25 : 13) : (canadianYears >= 2 ? 50 : 25);
    const educationTransfer = Math.min(50, educationLanguage + educationCanada);

    const foreignTier = foreignYears >= 3 ? 2 : foreignYears >= 1 ? 1 : 0;
    const foreignLanguage = foreignTier === 0 || langBand === 0 ? 0 :
      foreignTier === 1 ? (langBand === 2 ? 25 : 13) : (langBand === 2 ? 50 : 25);
    const foreignCanada = foreignTier === 0 || canadianYears === 0 ? 0 :
      foreignTier === 1 ? (canadianYears >= 2 ? 25 : 13) : (canadianYears >= 2 ? 50 : 25);
    const foreignTransfer = Math.min(50, foreignLanguage + foreignCanada);

    let certificate = 0;
    if (profile.certificate && Math.min(...first) >= 5) {
      certificate = Math.min(...first) >= 7 ? 50 : 25;
    }
    const transferability = Math.min(100, educationTransfer + foreignTransfer + certificate);

    const french = profile.firstLanguageName === 'fr'
      ? first
      : (profile.secondLanguagePresent ? second : [0, 0, 0, 0]);
    const english = profile.firstLanguageName === 'en'
      ? first
      : (profile.secondLanguagePresent ? second : [0, 0, 0, 0]);
    const frenchEligible = Math.min(...french) >= 7;
    const frenchBonus = frenchEligible ? (Math.min(...english) >= 5 ? 50 : 25) : 0;
    const canadianStudy = [0, 15, 30].includes(Number(profile.canadianStudy))
      ? Number(profile.canadianStudy) : 0;
    const additionalRaw = (profile.nomination ? 600 : 0) + (profile.sibling ? 15 : 0) +
      canadianStudy + frenchBonus;
    const additional = Math.min(600, additionalRaw);
    const total = Math.min(1200, core + spouse + transferability + additional);

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

  const api = { calculate, tables: { AGE_30_TO_44, EDUCATION, SPOUSE_EDUCATION, CANADIAN_WORK } };
  global.PathwayCRS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
