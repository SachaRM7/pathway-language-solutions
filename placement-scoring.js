/* Deterministic placement scoring shared by the browser test and locale routes. */
(() => {
  const AUTO_SKILLS = ['reading', 'listening', 'grammarVocabulary'];
  const DIFFICULTY = { A1: 1, A2: 1.2, B1: 1.5, B2: 1.9 };
  const LEVELS = ['A1', 'A2', 'B1', 'B2'];
  const labels = {
    reading: { es: 'Comprensión escrita', en: 'Reading' },
    listening: { es: 'Comprensión oral', en: 'Listening' },
    grammarVocabulary: { es: 'Gramática y vocabulario', en: 'Grammar & vocabulary' },
    speaking: { es: 'Expresión oral', en: 'Speaking' }
  };

  const skillFor = question => question.autoSkill || ({
    'Compréhension écrite': 'reading',
    'Compréhension orale': 'listening',
    'Expression écrite': 'grammarVocabulary',
    'Expression orale': 'grammarVocabulary',
    'Grammaire et vocabulaire': 'grammarVocabulary'
  }[question.skill] || 'grammarVocabulary');

  // A wrong answer removes a third of its weight, but the penalty never erases the
  // credit of a correct answer: any correct answer keeps the score above zero.
  const correctedScore = entries => {
    const totals = entries.reduce((result, entry) => {
      const weight = DIFFICULTY[entry.question.level] || 1;
      result.maximum += weight;
      result.earned += entry.correct ? weight : -(weight / 3);
      if (entry.correct) result.credited += weight;
      return result;
    }, { earned: 0, credited: 0, maximum: 0 });
    if (!totals.maximum) return 0;
    if (!totals.credited) return 0;
    const corrected = Math.round((totals.earned / totals.maximum) * 100);
    const floor = Math.max(1, Math.round((totals.credited / totals.maximum) * 100 / 3));
    return Math.max(floor, Math.min(100, corrected));
  };

  const score = ({ questions, responses, mode = 'intensive' }) => {
    const selected = questions.filter(question => mode === 'intensive' || question.express !== false);
    const evaluated = selected.map(question => ({
      question,
      correct: responses[question.index] === question.answer
    }));
    const skillScores = Object.fromEntries(AUTO_SKILLS.map(skill => [skill, correctedScore(evaluated.filter(entry => skillFor(entry.question) === skill))]));
    const levelScores = Object.fromEntries(LEVELS.map(level => [level, correctedScore(evaluated.filter(entry => entry.question.level === level))]));
    const correctAt = (skill, level) => evaluated.filter(entry => skillFor(entry.question) === skill && entry.question.level === level && entry.correct).length;
    const floorAt = level => AUTO_SKILLS.every(skill => correctAt(skill, level) >= 1);
    const thresholds = mode === 'express'
      ? { A1: 72, A2: 72, B1: 70, B2: 70 }
      : { A1: 62, A2: 62, B1: 62, B2: 62 };
    const skillLimiter = Math.min(...AUTO_SKILLS.map(skill => {
      const value = skillScores[skill];
      return value < 45 ? 0 : value < 60 ? 1 : value < 72 ? 2 : 3;
    }));
    let levelIndex = 0;
    if (levelScores.A1 >= thresholds.A1 && floorAt('A1')) levelIndex = 1;
    if (levelIndex >= 1 && levelScores.A2 >= thresholds.A2 && floorAt('A2')) levelIndex = 2;
    if (levelIndex >= 2 && levelScores.B1 >= thresholds.B1 && floorAt('B1')) levelIndex = 3;
    if (levelIndex >= 3 && levelScores.B2 >= thresholds.B2 && floorAt('B2')) levelIndex = 3;
    levelIndex = Math.min(levelIndex, skillLimiter);
    if (mode === 'express' && levelIndex > 0 && selected.length < questions.length) levelIndex = Math.min(levelIndex, 2);

    const correctCount = evaluated.filter(entry => entry.correct).length;
    // The bank is not demanding enough to certify B2: it is only awarded on a flawless run.
    if (levelIndex >= 3 && correctCount < evaluated.length) levelIndex = 2;

    const weakestSkill = AUTO_SKILLS.reduce((weakest, skill) => skillScores[skill] < skillScores[weakest] ? skill : weakest, AUTO_SKILLS[0]);
    const speaking = { score: null, status: 'not-evaluated', label: labels.speaking };
    return {
      mode,
      level: LEVELS[levelIndex],
      levelIndex,
      confidence: mode === 'express' ? 'low' : 'standard',
      confidenceLabel: mode === 'express' ? 'Orientativo: confirma tu nivel en una clase en vivo.' : 'Más preciso: combina cuatro niveles y pondera la dificultad.',
      status: levelIndex >= 3 ? 'sólido' : levelIndex >= 2 ? 'independiente' : levelIndex >= 1 ? 'funcional' : 'en construcción',
      overall: Math.round(AUTO_SKILLS.reduce((sum, skill) => sum + skillScores[skill], 0) / AUTO_SKILLS.length),
      totalCorrect: correctCount,
      totalQuestions: selected.length,
      levelScores,
      skillScores: { ...skillScores, speaking: speaking.score },
      skillStatuses: { ...Object.fromEntries(AUTO_SKILLS.map(skill => [skill, labels[skill]])), speaking },
      weakestSkill,
      weakestSkillLabel: labels[weakestSkill],
      completedAt: new Date().toISOString()
    };
  };

  window.PathwayPlacementScoring = Object.freeze({ AUTO_SKILLS, LEVELS, labels, score });
})();
