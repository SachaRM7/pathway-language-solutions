(() => {
  const questions = [
    { level: 'A1', skill: 'Grammaire', title: 'Complète la phrase : « Je ___ français avec ma professeure. »', options: ['parle', 'parles', 'parlons', 'parlent'], answer: 0 },
    { level: 'A1', skill: 'Vocabulaire', title: 'Quel mot désigne un fruit ?', options: ['une école', 'une pomme', 'un médecin', 'une montre'], answer: 1 },
    { level: 'A1', skill: 'Compréhension écrite', title: 'Où habite Lucas ?', context: 'Bonjour ! Je m’appelle Lucas. J’ai 20 ans et j’habite à Montréal. Je parle français et anglais. Le week-end, je sors avec mes amis.', options: ['À Paris', 'À Lima', 'À Montréal', 'À Québec'], answer: 2 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Où travaille Camille ?', audio: 'assets/audio/placement-a1.wav', options: ['Dans une école', 'Dans une librairie', 'Dans un restaurant', 'Dans un hôpital'], answer: 1 },
    { level: 'A2', skill: 'Grammaire', title: 'Choisis la phrase correcte au passé composé.', options: ['Sophie est allé au marché.', 'Sophie a allée au marché.', 'Sophie est allée au marché.', 'Sophie va au marché hier.'], answer: 2 },
    { level: 'A2', skill: 'Vocabulaire', title: 'Complète : « Je vais à la ___ pour acheter du pain. »', options: ['boulangerie', 'pharmacie', 'gare', 'mairie'], answer: 0 },
    { level: 'A2', skill: 'Compréhension écrite', title: 'Pourquoi Sophie a-t-elle acheté des fleurs ?', context: 'Samedi, Sophie est allée au marché avec sa sœur. Elle a acheté des légumes, du fromage et de belles fleurs pour sa mère, qui fêtait son anniversaire ce jour-là.', options: ['Pour décorer le restaurant', 'Pour remercier sa sœur', 'Pour l’anniversaire de sa mère', 'Pour les vendre au marché'], answer: 2 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Quand aura lieu le nouveau rendez-vous ?', audio: 'assets/audio/placement-a2.wav', options: ['Mercredi à midi', 'Jeudi 15 à 10 h 30', 'Jeudi à 15 h', 'Vendredi à 10 h 30'], answer: 1 },
    { level: 'B1', skill: 'Grammaire', title: 'Complète : « Quand j’étais petit, je ___ souvent au parc. »', options: ['vais', 'allais', 'irai', 'suis allé demain'], answer: 1 },
    { level: 'B1', skill: 'Vocabulaire', title: 'Que signifie « donner un coup de main » ?', options: ['Critiquer quelqu’un', 'Aider quelqu’un', 'Se blesser', 'Prendre une décision'], answer: 1 },
    { level: 'B1', skill: 'Compréhension écrite', title: 'Qu’est-ce qu’un modèle de travail hybride ?', context: 'Le télétravail évite certains déplacements mais peut isoler les salariés. Plusieurs entreprises proposent donc un modèle hybride afin de garder les avantages des deux façons de travailler.', options: ['Travailler uniquement la nuit', 'Changer de métier chaque semaine', 'Alterner télétravail et présence au bureau', 'Partager un poste entre deux entreprises'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Pourquoi certains employés préfèrent-ils venir au bureau ?', audio: 'assets/audio/placement-b1.wav', options: ['Ils gagnent plus d’argent', 'Ils n’ont pas Internet', 'Ils se concentrent mieux avec leurs collègues', 'Ils veulent travailler le week-end'], answer: 2 },
    { level: 'B2', skill: 'Grammaire', title: 'Choisis la phrase grammaticalement correcte.', options: ['Il faut que tu viens demain.', 'Bien qu’il est fatigué, il continue.', 'Si j’aurais su, je serais venu.', 'Il faut que tu viennes demain.'], answer: 3 },
    { level: 'B2', skill: 'Vocabulaire', title: 'Quel verbe apporte la nuance la plus précise dans cette phrase : « Le chercheur ___ attentivement les résultats » ?', options: ['regarde', 'voit', 'observe', 'jette un œil à'], answer: 2 },
    { level: 'B2', skill: 'Compréhension écrite', title: 'Pourquoi les compétences humaines restent-elles importantes ?', context: 'Les entreprises forment leurs employés pour travailler avec les nouvelles technologies. La créativité, la communication, l’esprit critique et l’adaptation deviennent recherchés, alors que certaines compétences techniques risquent de devenir obsolètes.', options: ['Parce que les technologies sont interdites', 'Parce qu’elles permettent de travailler avec les évolutions technologiques', 'Parce que les entreprises refusent toute automatisation', 'Parce qu’elles remplacent les compétences techniques'], answer: 1 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quelle est l’idée principale de l’extrait ?', audio: 'assets/audio/placement-b2.wav', options: ['Les outils numériques suppriment toujours le travail répétitif', 'Il faut abandonner les outils numériques', 'La maîtrise technique suffit à améliorer la concentration', 'Les outils numériques peuvent aider, mais leur usage doit aussi être limité'], answer: 3 }
  ];

  const intro = document.querySelector('[data-test-intro]');
  const stage = document.querySelector('[data-test-stage]');
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
  let current = 0;

  const renderQuestion = () => {
    const question = questions[current];
    level.textContent = `${question.level} · pregunta ${current + 1}`;
    skill.textContent = question.skill;
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

  const calculateResult = () => {
    const levelScores = { A1: 0, A2: 0, B1: 0, B2: 0 };
    const skillScores = { 'Grammaire': 0, 'Vocabulaire': 0, 'Compréhension écrite': 0, 'Compréhension orale': 0 };
    questions.forEach((question, index) => {
      if (responses[index] !== question.answer) return;
      levelScores[question.level] += 1;
      skillScores[question.skill] += 1;
    });

    let estimatedLevel = 'A1';
    let status = 'en construcción';
    if (levelScores.A1 >= 3) { estimatedLevel = 'A2'; status = 'estimado'; }
    if (levelScores.A1 >= 3 && levelScores.A2 >= 3) { estimatedLevel = 'B1'; }
    if (levelScores.A1 >= 3 && levelScores.A2 >= 3 && levelScores.B1 >= 3) { estimatedLevel = 'B2'; status = levelScores.B2 >= 3 ? 'estimado' : 'en consolidación'; }

    const total = Object.values(levelScores).reduce((sum, value) => sum + value, 0);
    const resultData = { level: estimatedLevel, status, total, levelScores, skillScores, completedAt: new Date().toISOString() };
    sessionStorage.setItem('pathwayPlacementResult', JSON.stringify(resultData));

    document.querySelector('[data-result-level]').textContent = estimatedLevel;
    document.querySelector('[data-result-title]').textContent = `Tu francés se sitúa alrededor de ${estimatedLevel}.`;
    document.querySelector('[data-result-copy]').textContent = `Has obtenido ${total} respuestas correctas de 16. Tu nivel aparece ${status}; la evaluación con Pathway confirmará las competencias de producción y el ritmo adecuado para tu objetivo NCLC 7.`;
    document.querySelector('[data-skill-scores]').innerHTML = Object.entries(skillScores).map(([name, score]) => `
      <div class="skill-score"><span>${name}</span><strong>${score} / 4</strong></div>
    `).join('');
    stage.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  document.querySelector('[data-restart]').addEventListener('click', () => {
    responses.fill(null);
    current = 0;
    result.hidden = true;
    intro.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
