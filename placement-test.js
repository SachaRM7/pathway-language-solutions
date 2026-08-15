(() => {
  const SKILLS = [
    'Compréhension écrite',
    'Compréhension orale',
    'Expression écrite',
    'Expression orale'
  ];
  const SKILL_LABELS = {
    'Compréhension écrite': { es: 'Comprensión escrita', en: 'Reading' },
    'Compréhension orale': { es: 'Comprensión oral', en: 'Listening' },
    'Expression écrite': { es: 'Expresión escrita', en: 'Writing' },
    'Expression orale': { es: 'Expresión oral', en: 'Speaking' }
  };

  const questions = [
    { level: 'A1', skill: 'Compréhension écrite', title: 'Où habite Lucas ?', context: 'Bonjour ! Je m’appelle Lucas. J’ai 20 ans et j’habite à Montréal. Je parle français et anglais. Le week-end, je sors avec mes amis.', options: ['À Paris', 'À Lima', 'À Montréal', 'À Québec'], answer: 2 },
    { level: 'A1', skill: 'Compréhension écrite', title: 'À quelle heure ferme la bibliothèque ?', context: 'Bibliothèque municipale — ouverte du lundi au vendredi de 9 h à 18 h. Fermée le samedi.', options: ['À 9 h', 'À 12 h', 'À 18 h', 'À 20 h'], answer: 2 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Où travaille Camille ?', audio: 'assets/audio/placement-a1.wav', options: ['Dans une école', 'Dans une librairie', 'Dans un restaurant', 'Dans un hôpital'], answer: 1 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Que fait Camille le samedi ?', audio: 'assets/audio/placement-a1.wav', options: ['Elle travaille à la librairie', 'Elle étudie le français', 'Elle fait du vélo avec ses amis', 'Elle va au restaurant'], answer: 2 },
    { level: 'A1', skill: 'Expression écrite', title: 'Choisis la présentation correctement écrite.', options: ['Je m’appelle Ana et je suis péruvienne.', 'Je appelle Ana et je est péruvienne.', 'Moi s’appelle Ana, péruvienne.', 'Je m’appelles Ana et suis péruvien.'], answer: 0 },
    { level: 'A1', skill: 'Expression écrite', title: 'Complète le message : « Bonjour, je ___ réserver une table pour deux personnes. »', options: ['voudrais', 'voudrait', 'voulez', 'voulons'], answer: 0 },
    { level: 'A1', skill: 'Expression orale', title: 'Quel échange est naturel pour saluer quelqu’un ?', options: ['— Bonjour ! — Bonjour, comment ça va ?', '— Bonjour ! — J’ai vingt ans.', '— Bonjour ! — À la boulangerie.', '— Bonjour ! — Parce que oui.'], answer: 0 },
    { level: 'A1', skill: 'Expression orale', title: 'Au café, quelle demande est la plus appropriée ?', options: ['Un café.', 'Je veux café maintenant.', 'Bonjour, un café s’il vous plaît.', 'Tu donnes le café.'], answer: 2 },

    { level: 'A2', skill: 'Compréhension écrite', title: 'Pourquoi Sophie a-t-elle acheté des fleurs ?', context: 'Samedi, Sophie est allée au marché avec sa sœur. Elle a acheté des légumes, du fromage et de belles fleurs pour sa mère, qui fêtait son anniversaire ce jour-là.', options: ['Pour décorer le restaurant', 'Pour remercier sa sœur', 'Pour l’anniversaire de sa mère', 'Pour les vendre au marché'], answer: 2 },
    { level: 'A2', skill: 'Compréhension écrite', title: 'Que doit faire le locataire avant vendredi ?', context: 'Bonjour, une coupure d’eau est prévue vendredi entre 8 h et 11 h. Merci de fermer vos robinets avant 8 h et de ne pas utiliser le lave-linge pendant l’intervention.', options: ['Quitter son logement', 'Fermer les robinets', 'Réparer le lave-linge', 'Téléphoner au propriétaire'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Quand aura lieu le nouveau rendez-vous ?', audio: 'assets/audio/placement-a2.wav', options: ['Mercredi à midi', 'Jeudi 15 à 10 h 30', 'Jeudi à 15 h', 'Vendredi à 10 h 30'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Que faut-il faire si la nouvelle heure ne convient pas ?', audio: 'assets/audio/placement-a2.wav', options: ['Venir mercredi midi', 'Envoyer un courrier jeudi', 'Rappeler avant mercredi midi', 'Annuler le rendez-vous en ligne'], answer: 2 },
    { level: 'A2', skill: 'Expression écrite', title: 'Choisis la phrase correcte au passé composé.', options: ['Sophie est allé au marché.', 'Sophie a allée au marché.', 'Sophie est allée au marché.', 'Sophie va au marché hier.'], answer: 2 },
    { level: 'A2', skill: 'Expression écrite', title: 'Quelle phrase convient à un courriel pour reporter un rendez-vous ?', options: ['Je peux pas. Change.', 'Serait-il possible de déplacer notre rendez-vous à jeudi ?', 'Rendez-vous non, jeudi oui.', 'Tu dois changer notre heure.'], answer: 1 },
    { level: 'A2', skill: 'Expression orale', title: 'Tu n’as pas compris une consigne. Que dis-tu ?', options: ['Quoi ?', 'Répétez.', 'Excusez-moi, pourriez-vous répéter plus lentement ?', 'Je ne veux pas écouter.'], answer: 2 },
    { level: 'A2', skill: 'Expression orale', title: 'Quelle réponse explique simplement un retard ?', options: ['Parce que le bus a eu du retard, je suis arrivé dix minutes après.', 'Le bus retard moi dix minutes.', 'Hier demain le bus.', 'Je retard, c’est bus.'], answer: 0 },

    { level: 'B1', skill: 'Compréhension écrite', title: 'Qu’est-ce qu’un modèle de travail hybride ?', context: 'Le télétravail évite certains déplacements mais peut isoler les salariés. Plusieurs entreprises proposent donc un modèle hybride afin de garder les avantages des deux façons de travailler.', options: ['Travailler uniquement la nuit', 'Changer de métier chaque semaine', 'Alterner télétravail et présence au bureau', 'Partager un poste entre deux entreprises'], answer: 2 },
    { level: 'B1', skill: 'Compréhension écrite', title: 'Quelle réserve l’auteur exprime-t-il ?', context: 'Les cours en ligne offrent une grande souplesse. Cependant, sans calendrier précis ni échanges réguliers, certains apprenants perdent rapidement leur motivation.', options: ['Les cours coûtent toujours trop cher', 'La flexibilité suffit à garantir les progrès', 'L’absence de cadre peut réduire la motivation', 'Les échanges empêchent de travailler seul'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Pourquoi certains employés préfèrent-ils venir au bureau ?', audio: 'assets/audio/placement-b1.wav', options: ['Ils gagnent plus d’argent', 'Ils n’ont pas Internet', 'Ils se concentrent mieux avec leurs collègues', 'Ils veulent travailler le week-end'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Combien de jours de télétravail sont autorisés par semaine ?', audio: 'assets/audio/placement-b1.wav', options: ['Un jour', 'Deux jours', 'Trois jours', 'Toute la semaine'], answer: 1 },
    { level: 'B1', skill: 'Expression écrite', title: 'Quelle phrase articule clairement une opposition ?', options: ['Le télétravail est pratique, pourtant il peut aussi isoler.', 'Le télétravail pratique et isoler pourtant.', 'Pourtant pratique télétravail isolement.', 'Le télétravail est pratique parce qu’il isole toujours.'], answer: 0 },
    { level: 'B1', skill: 'Expression écrite', title: 'Choisis la formulation la plus claire pour donner un conseil.', options: ['À ta place, je définirais des horaires fixes afin de mieux progresser.', 'À ta place, horaires fixes progrès.', 'Tu définis hier des horaires pour progresserais.', 'Il faut que tu définis des horaires.'], answer: 0 },
    { level: 'B1', skill: 'Expression orale', title: 'Comment exprimer un désaccord de façon nuancée ?', options: ['C’est faux.', 'Je ne suis pas tout à fait d’accord, car cette solution ne convient pas à tous.', 'Non, jamais.', 'Tu as tort et c’est tout.'], answer: 1 },
    { level: 'B1', skill: 'Expression orale', title: 'Quelle réponse développe une opinion personnelle ?', options: ['Oui.', 'Peut-être.', 'À mon avis, cette mesure est utile parce qu’elle réduit les déplacements sans supprimer les échanges.', 'La mesure, voilà.'], answer: 2 },

    { level: 'B2', skill: 'Compréhension écrite', title: 'Pourquoi les compétences humaines restent-elles importantes ?', context: 'Les entreprises forment leurs employés pour travailler avec les nouvelles technologies. La créativité, la communication, l’esprit critique et l’adaptation deviennent recherchés, alors que certaines compétences techniques risquent de devenir obsolètes.', options: ['Parce que les technologies sont interdites', 'Parce qu’elles permettent de travailler avec les évolutions technologiques', 'Parce que les entreprises refusent toute automatisation', 'Parce qu’elles remplacent les compétences techniques'], answer: 1 },
    { level: 'B2', skill: 'Compréhension écrite', title: 'Quelle conclusion implicite se dégage du texte ?', context: 'L’accès immédiat à l’information donne l’impression que toute réponse est à portée de main. Pourtant, distinguer une source fiable d’une affirmation séduisante exige du temps, des méthodes et une vigilance que la vitesse de consultation ne garantit pas.', options: ['La rapidité assure la fiabilité', 'Toute information en ligne est trompeuse', 'L’accès à l’information ne remplace pas l’esprit critique', 'Les méthodes de vérification sont inutiles'], answer: 2 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quelle est l’idée principale de l’extrait ?', audio: 'assets/audio/placement-b2.wav', options: ['Les outils numériques suppriment toujours le travail répétitif', 'Il faut abandonner les outils numériques', 'La maîtrise technique suffit à améliorer la concentration', 'Les outils numériques peuvent aider, mais leur usage doit aussi être limité'], answer: 3 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quel effet négatif des outils numériques est mentionné ?', audio: 'assets/audio/placement-b2.wav', options: ['Ils ralentissent toutes les tâches', 'Ils multiplient les sollicitations', 'Ils empêchent toute créativité', 'Ils rendent la technologie inaccessible'], answer: 1 },
    { level: 'B2', skill: 'Expression écrite', title: 'Quelle phrase présente l’argumentation la plus précise ?', options: ['Bien que ces outils améliorent la productivité, leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Ces outils améliorent mais ça dépend.', 'Malgré que les outils sont efficaces, ils dépendent.', 'Les outils, étant productifs, donc réflexion.'], answer: 0 },
    { level: 'B2', skill: 'Expression écrite', title: 'Choisis la reformulation qui conserve la nuance.', context: 'La mesure pourrait être utile, à condition qu’elle soit accompagnée d’un suivi régulier.', options: ['La mesure sera forcément utile.', 'Sans suivi régulier, l’utilité de la mesure reste incertaine.', 'Le suivi rend toute mesure inutile.', 'La mesure est utile même sans accompagnement.'], answer: 1 },
    { level: 'B2', skill: 'Expression orale', title: 'Quelle intervention structure le mieux une prise de position ?', options: ['Je dirais d’abord que cette solution répond à un besoin réel ; néanmoins, deux limites doivent être examinées.', 'Moi, je pense ça, mais bon.', 'Il y a une solution et deux choses.', 'Premièrement oui, deuxièmement peut-être.'], answer: 0 },
    { level: 'B2', skill: 'Expression orale', title: 'Comment reformuler poliment une objection complexe ?', options: ['Je comprends cet argument ; toutefois, il suppose que tous les publics disposent des mêmes ressources, ce qui reste à démontrer.', 'Non, cet argument ne marche pas.', 'C’est impossible et faux.', 'Je comprends, mais voilà, non.'], answer: 0 }
  ];

  const intro = document.querySelector('[data-test-intro]');
  const stage = document.querySelector('[data-test-stage]');
  const calculation = document.querySelector('[data-calculation]');
  const calculationRing = document.querySelector('[data-calculation-ring]');
  const calculationValue = document.querySelector('[data-calculation-value]');
  const calculationSteps = [...document.querySelectorAll('[data-calculation-step]')];
  const result = document.querySelector('[data-result]');
  const form = document.querySelector('[data-test-form]');
  const title = document.querySelector('[data-question-title]');
  const level = document.querySelector('[data-question-level]');
  const skill = document.querySelector('[data-question-skill]');
  const context = document.querySelector('[data-question-context]');
  const audioBox = document.querySelector('[data-audio-box]');
  const audio = document.querySelector('[data-question-audio]');
  const answers = document.querySelector('[data-answers]');
  const previous = document.querySelector('[data-previous]');
  const next = document.querySelector('[data-next]');
  const progressCopy = document.querySelector('[data-progress-copy]');
  const progressBar = document.querySelector('[data-progress-bar]');
  const responses = Array(questions.length).fill(null);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const levelWeights = { A1: 1, A2: 1.2, B1: 1.5, B2: 1.9 };
  let current = 0;

  const renderQuestion = () => {
    const question = questions[current];
    level.textContent = `${question.level} · pregunta ${current + 1}`;
    skill.textContent = `${SKILL_LABELS[question.skill].es} · ${SKILL_LABELS[question.skill].en}`;
    title.textContent = question.title;
    context.hidden = !question.context;
    context.textContent = question.context || '';
    audio.pause();
    audio.currentTime = 0;
    audioBox.hidden = !question.audio;
    if (question.audio) audio.src = question.audio;
    else audio.removeAttribute('src');
    answers.innerHTML = question.options.map((option, index) => `
      <label class="answer-option">
        <input type="radio" name="answer" value="${index}" ${responses[current] === index ? 'checked' : ''}>
        <span>${option}</span>
      </label>
    `).join('');
    answers.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        responses[current] = Number(input.value);
        next.disabled = false;
      });
    });
    previous.disabled = current === 0;
    next.disabled = responses[current] === null;
    next.textContent = current === questions.length - 1 ? 'Ver mi resultado' : 'Siguiente';
    progressCopy.textContent = `${current + 1} / ${questions.length}`;
    progressBar.style.width = `${((current + 1) / questions.length) * 100}%`;
    document.querySelectorAll('[data-level-rail]').forEach(item => {
      const levelIndex = ['A1', 'A2', 'B1', 'B2'].indexOf(item.dataset.levelRail);
      const currentIndex = ['A1', 'A2', 'B1', 'B2'].indexOf(question.level);
      item.classList.toggle('is-current', levelIndex === currentIndex);
      item.classList.toggle('is-complete', levelIndex < currentIndex);
    });
  };

  const revealResult = () => {
    calculation.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const runCalculationAnimation = () => {
    stage.hidden = true;
    calculation.hidden = false;
    calculationRing.style.setProperty('--calculation-progress', '0deg');
    calculationValue.textContent = '0 %';
    calculationSteps.forEach(step => step.classList.remove('is-active', 'is-complete'));
    calculation.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });

    if (reducedMotion) {
      calculationRing.style.setProperty('--calculation-progress', '360deg');
      calculationValue.textContent = '100 %';
      calculationSteps.forEach(step => step.classList.add('is-complete'));
      revealResult();
      return;
    }

    const duration = 1400;
    const startedAt = performance.now();
    const animate = now => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const percentage = Math.round(easedProgress * 100);
      calculationRing.style.setProperty('--calculation-progress', `${easedProgress * 360}deg`);
      calculationValue.textContent = `${percentage} %`;
      calculationSteps.forEach((step, index) => {
        const threshold = index / calculationSteps.length;
        const nextThreshold = (index + 1) / calculationSteps.length;
        step.classList.toggle('is-active', progress >= threshold && progress < nextThreshold);
        step.classList.toggle('is-complete', progress >= nextThreshold);
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
        return;
      }
      calculationSteps.forEach(step => {
        step.classList.remove('is-active');
        step.classList.add('is-complete');
      });
      window.setTimeout(revealResult, 180);
    };
    requestAnimationFrame(animate);
  };

  const correctedScore = selectedQuestions => {
    const totals = selectedQuestions.reduce((accumulator, item) => {
      const weight = levelWeights[item.question.level];
      accumulator.maximum += weight;
      accumulator.earned += item.correct ? weight : -(weight / 3);
      return accumulator;
    }, { earned: 0, maximum: 0 });
    if (!totals.maximum) return 0;
    return Math.round(Math.max(0, totals.earned) / totals.maximum * 100);
  };

  const correctBySkillAtLevel = (skillName, levelName) => questions.reduce((total, question, index) => {
    if (question.skill !== skillName || question.level !== levelName) return total;
    return total + Number(responses[index] === question.answer);
  }, 0);

  const hasCompetencyFloor = levels => SKILLS.every(skillName => levels.every(levelName => correctBySkillAtLevel(skillName, levelName) >= 1));

  const calculateResult = () => {
    const evaluated = questions.map((question, index) => ({ question, correct: responses[index] === question.answer }));
    const levelScores = Object.fromEntries(['A1', 'A2', 'B1', 'B2'].map(levelName => [
      levelName,
      correctedScore(evaluated.filter(item => item.question.level === levelName))
    ]));
    const skillScores = Object.fromEntries(SKILLS.map(skillName => [
      skillName,
      correctedScore(evaluated.filter(item => item.question.skill === skillName))
    ]));

    let estimatedLevel = 'A1';
    let status = 'en construcción';
    if (levelScores.A1 >= 62 && hasCompetencyFloor(['A1'])) {
      estimatedLevel = 'A2';
      status = 'funcional';
    }
    if (levelScores.A1 >= 70 && levelScores.A2 >= 62 && hasCompetencyFloor(['A1', 'A2'])) {
      estimatedLevel = 'B1';
      status = 'independiente';
    }
    if (levelScores.A1 >= 75 && levelScores.A2 >= 68 && levelScores.B1 >= 62 && hasCompetencyFloor(['A1', 'A2', 'B1'])) {
      estimatedLevel = 'B2';
      status = levelScores.B2 >= 62 && hasCompetencyFloor(['A1', 'A2', 'B1', 'B2']) ? 'sólido' : 'en consolidación';
    }

    const overall = Math.round(SKILLS.reduce((sum, skillName) => sum + skillScores[skillName], 0) / SKILLS.length);
    const weakestSkill = SKILLS.reduce((weakest, skillName) => skillScores[skillName] < skillScores[weakest] ? skillName : weakest, SKILLS[0]);
    const totalCorrect = evaluated.filter(item => item.correct).length;
    const resultData = {
      level: estimatedLevel,
      status,
      overall,
      totalCorrect,
      totalQuestions: questions.length,
      levelScores,
      skillScores,
      weakestSkill,
      completedAt: new Date().toISOString()
    };
    sessionStorage.setItem('pathwayPlacementResult', JSON.stringify(resultData));

    document.querySelector('[data-result-level]').textContent = estimatedLevel;
    document.querySelector('[data-result-title]').textContent = `Tu francés se sitúa alrededor de ${estimatedLevel}.`;
    document.querySelector('[data-result-copy]').textContent = `Índice global: ${overall}/100 (${totalCorrect} respuestas correctas de ${questions.length}). El nivel aparece ${status}. La competencia que más limita el avance es ${SKILL_LABELS[weakestSkill].es.toLowerCase()}; Pathway la confirmará durante la primera clase.`;
    document.querySelector('[data-skill-scores]').innerHTML = SKILLS.map(skillName => {
      const score = skillScores[skillName];
      const diagnostic = score >= 75 ? 'fortaleza' : score >= 55 ? 'operativa' : score >= 35 ? 'por consolidar' : 'prioridad';
      return `
        <div class="skill-score" style="--skill-score:${score}%">
          <span>${SKILL_LABELS[skillName].es} · ${SKILL_LABELS[skillName].en}</span>
          <strong>${score}<small>/100</small></strong>
          <div class="skill-meter" aria-hidden="true"><i></i></div>
          <em>${diagnostic}</em>
        </div>
      `;
    }).join('');
    runCalculationAnimation();
  };

  document.querySelector('[data-start-test]').addEventListener('click', () => {
    intro.hidden = true;
    stage.hidden = false;
    renderQuestion();
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (responses[current] === null) return;
    if (current < questions.length - 1) {
      current += 1;
      renderQuestion();
      return;
    }
    calculateResult();
  });

  previous.addEventListener('click', () => {
    if (current === 0) return;
    current -= 1;
    renderQuestion();
  });
})();
