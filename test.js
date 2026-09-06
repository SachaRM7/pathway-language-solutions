(() => {
  const SKILLS = ['reading', 'listening', 'grammarVocabulary'];
  const SKILL_LABELS = {
    reading: { es: 'Comprensión escrita', en: 'Reading' },
    listening: { es: 'Comprensión oral', en: 'Listening' },
    grammarVocabulary: { es: 'Gramática y vocabulario', en: 'Grammar & vocabulary' },
    speaking: { es: 'Expresión oral', en: 'Speaking' }
  };

  const locale = (document.documentElement.lang || 'es').slice(0, 2);
  const UI = {
    es: {
      skills: { reading: 'Comprensión escrita', listening: 'Comprensión oral', grammarVocabulary: 'Gramática y vocabulario', speaking: 'Expresión oral' },
      question: 'pregunta',
      durationExpress: '12–15 min',
      durationIntensive: '25–30 min',
      audioWarning: 'Atención: solo tienes derecho a una escucha por pregunta.',
      audioPlaying: 'Escucha en curso · es tu única escucha para esta pregunta',
      audioSpent: 'Escucha utilizada (1/1) para esta pregunta',
      audioLabel: 'Una sola escucha por pregunta; pausar y reanudar no consume otra escucha',
      previous: 'Anterior',
      next: 'Siguiente',
      showResult: 'Ver mi resultado',
      resultTitle: level => `Tu francés se sitúa alrededor de ${level}.`,
      status: { construction: 'en construcción', functional: 'funcional', independent: 'independiente', solid: 'sólido' },
      confidence: { express: 'Orientativo: confirma tu nivel en una clase en vivo.', intensive: 'Más preciso: combina cuatro niveles y pondera la dificultad.' },
      diagnostic: { priority: 'prioridad', consolidating: 'por consolidar', operational: 'operativa', strength: 'fortaleza' },
      speakingScore: 'No autoevaluada', speakingCopy: 'Se confirma en una clase en vivo.', speakingDiagnostic: 'por confirmar',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Índice global autoevaluado: ${overall}/100 (${totalCorrect} respuestas correctas de ${totalQuestions}). El nivel aparece ${status}. La competencia que más limita el avance es ${weakest.toLowerCase()}. ${confidence}`
    },
    fr: {
      skills: { reading: 'Compréhension écrite', listening: 'Compréhension orale', grammarVocabulary: 'Grammaire et vocabulaire', speaking: 'Expression orale' },
      question: 'question',
      durationExpress: '12–15 min',
      durationIntensive: '25–30 min',
      audioWarning: 'Attention : tu n’as droit qu’à une seule écoute par question.',
      audioPlaying: 'Écoute en cours · c’est ta seule écoute pour cette question',
      audioSpent: 'Écoute utilisée (1/1) pour cette question',
      audioLabel: 'Une seule écoute par question ; mettre en pause et reprendre ne consomme pas une écoute supplémentaire',
      previous: 'Précédente',
      next: 'Suivante',
      showResult: 'Voir mon résultat',
      resultTitle: level => `Votre français se situe autour de ${level}.`,
      status: { construction: 'en construction', functional: 'fonctionnel', independent: 'autonome', solid: 'solide' },
      confidence: { express: 'Indication prudente : confirmez votre niveau en cours individuel.', intensive: 'Estimation plus précise : quatre niveaux et la difficulté sont pondérés.' },
      diagnostic: { priority: 'priorité', consolidating: 'à consolider', operational: 'opérationnel', strength: 'point fort' },
      speakingScore: 'Non évaluée automatiquement', speakingCopy: 'À confirmer pendant un cours en direct.', speakingDiagnostic: 'à confirmer',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Indice global automatique : ${overall}/100 (${totalCorrect} bonnes réponses sur ${totalQuestions}). Le niveau semble ${status}. La compétence qui limite le plus la progression est ${weakest.toLowerCase()}. ${confidence}`
    },
    en: {
      skills: { reading: 'Reading comprehension', listening: 'Listening comprehension', grammarVocabulary: 'Grammar & vocabulary', speaking: 'Speaking' },
      question: 'question',
      durationExpress: '12–15 min',
      durationIntensive: '25–30 min',
      audioWarning: 'Careful: you only get one listen per question.',
      audioPlaying: 'Playing · this is your only listen for this question',
      audioSpent: 'Listen used (1/1) for this question',
      audioLabel: 'One listen per question; pausing and resuming does not use another listen',
      previous: 'Previous',
      next: 'Next',
      showResult: 'See my result',
      resultTitle: level => `Your French is estimated around ${level}.`,
      status: { construction: 'still developing', functional: 'functional', independent: 'independent', solid: 'solid' },
      confidence: { express: 'Guidance only: confirm your level in a live class.', intensive: 'More precise: four levels and difficulty weighting are included.' },
      diagnostic: { priority: 'priority', consolidating: 'to consolidate', operational: 'operational', strength: 'strength' },
      speakingScore: 'Not auto-evaluated', speakingCopy: 'To be confirmed in a live class.', speakingDiagnostic: 'to confirm',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Automatic overall index: ${overall}/100 (${totalCorrect} correct answers out of ${totalQuestions}). The level appears ${status}. The skill limiting progress most is ${weakest.toLowerCase()}. ${confidence}`
    },
    de: {
      skills: { reading: 'Leseverstehen', listening: 'Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz', speaking: 'Sprechen' },
      question: 'Frage',
      durationExpress: '12–15 Min.',
      durationIntensive: '25–30 Min.',
      audioWarning: 'Achtung: Sie haben nur einen Hörversuch pro Frage.',
      audioPlaying: 'Wiedergabe läuft · Ihr einziger Hörversuch für diese Frage',
      audioSpent: 'Hörversuch verbraucht (1/1) für diese Frage',
      audioLabel: 'Ein Hörversuch pro Frage; Pausieren und Fortsetzen verbrauchen keinen weiteren Versuch',
      previous: 'Zurück',
      next: 'Weiter',
      showResult: 'Ergebnis anzeigen',
      resultTitle: level => `Ihr Französisch liegt ungefähr auf ${level}.`,
      status: { construction: 'im Aufbau', functional: 'funktional', independent: 'selbstständig', solid: 'sicher' },
      confidence: { express: 'Orientierung: Bestätigen Sie Ihr Niveau in einem Live-Unterricht.', intensive: 'Präzisere Einschätzung: vier Niveaus und die Schwierigkeit werden gewichtet.' },
      diagnostic: { priority: 'Priorität', consolidating: 'zu festigen', operational: 'funktional', strength: 'Stärke' },
      speakingScore: 'Nicht automatisch bewertet', speakingCopy: 'Wird im Live-Unterricht bestätigt.', speakingDiagnostic: 'zu bestätigen',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Automatischer Gesamtindex: ${overall}/100 (${totalCorrect} richtige Antworten von ${totalQuestions}). Das Niveau wirkt ${status}. Die Kompetenz, die den Fortschritt am stärksten begrenzt, ist ${weakest.toLowerCase()}. ${confidence}`
    }
  };
  const T = UI[locale] || UI.es;
  const levelIndexForStatus = levelIndex => levelIndex >= 3 ? 'solid' : levelIndex >= 2 ? 'independent' : levelIndex >= 1 ? 'functional' : 'construction';

  const questions = [
    { level: 'A1', skill: 'Compréhension écrite', title: 'Où habite Lucas ?', context: 'Bonjour ! Je m’appelle Lucas. J’ai 20 ans et j’habite à Montréal. Je parle français et anglais. Le week-end, je sors avec mes amis.', options: ['À Paris', 'À Lima', 'À Montréal', 'À Québec'], answer: 2 },
    { level: 'A1', skill: 'Compréhension écrite', title: 'À quelle heure ferme la bibliothèque ?', context: 'Bibliothèque municipale — ouverte du lundi au vendredi de 9 h à 18 h. Fermée le samedi.', options: ['À 9 h', 'À 12 h', 'À 18 h', 'À 20 h'], answer: 2 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Où travaille Camille ?', audio: 'assets/audio/placement-a1.ogg', options: ['Dans une école', 'Dans une librairie', 'Dans un restaurant', 'Dans un hôpital'], answer: 1 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Que fait Camille le samedi ?', audio: 'assets/audio/placement-a1.ogg', options: ['Elle travaille à la librairie', 'Elle étudie le français', 'Elle fait du vélo avec ses amis', 'Elle va au restaurant'], answer: 2 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Choisis la présentation correctement écrite.', options: ['Je m’appelle Ana et je suis péruvienne.', 'Je appelle Ana et je est péruvienne.', 'Moi s’appelle Ana, péruvienne.', 'Je m’appelles Ana et suis péruvien.'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Complète le message : « Bonjour, je ___ réserver une table pour deux personnes. »', options: ['voudrais', 'voudrait', 'voulez', 'voulons'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Quel échange est naturel pour saluer quelqu’un ?', options: ['— Bonjour ! — Bonjour, comment ça va ?', '— Bonjour ! — J’ai vingt ans.', '— Bonjour ! — À la boulangerie.', '— Bonjour ! — Parce que oui.'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Au café, quelle demande est la plus appropriée ?', options: ['Un café.', 'Je veux café maintenant.', 'Bonjour, un café s’il vous plaît.', 'Tu donnes le café.'], answer: 2 },

    { level: 'A2', skill: 'Compréhension écrite', title: 'Pourquoi Sophie a-t-elle acheté des fleurs ?', context: 'Samedi, Sophie est allée au marché avec sa sœur. Elle a acheté des légumes, du fromage et de belles fleurs pour sa mère, qui fêtait son anniversaire ce jour-là.', options: ['Pour décorer le restaurant', 'Pour remercier sa sœur', 'Pour l’anniversaire de sa mère', 'Pour les vendre au marché'], answer: 2 },
    { level: 'A2', skill: 'Compréhension écrite', title: 'Que doit faire le locataire avant vendredi ?', context: 'Bonjour, une coupure d’eau est prévue vendredi entre 8 h et 11 h. Merci de fermer vos robinets avant 8 h et de ne pas utiliser le lave-linge pendant l’intervention.', options: ['Quitter son logement', 'Fermer les robinets', 'Réparer le lave-linge', 'Téléphoner au propriétaire'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Quand aura lieu le nouveau rendez-vous ?', audio: 'assets/audio/placement-a2.ogg', options: ['Mercredi à midi', 'Jeudi 15 à 10 h 30', 'Jeudi à 15 h', 'Vendredi à 10 h 30'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Que faut-il faire si la nouvelle heure ne convient pas ?', audio: 'assets/audio/placement-a2.ogg', options: ['Venir mercredi midi', 'Envoyer un courrier jeudi', 'Rappeler avant mercredi midi', 'Annuler le rendez-vous en ligne'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Choisis la phrase correcte au passé composé.', options: ['Sophie est allé au marché.', 'Sophie a allée au marché.', 'Sophie est allée au marché.', 'Sophie va au marché hier.'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase convient à un courriel pour reporter un rendez-vous ?', options: ['Je peux pas. Change.', 'Serait-il possible de déplacer notre rendez-vous à jeudi ?', 'Rendez-vous non, jeudi oui.', 'Tu dois changer notre heure.'], answer: 1 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Tu n’as pas compris une consigne. Que dis-tu ?', options: ['Quoi ?', 'Répétez.', 'Excusez-moi, pourriez-vous répéter plus lentement ?', 'Je ne veux pas écouter.'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Quelle réponse explique simplement un retard ?', options: ['Parce que le bus a eu du retard, je suis arrivé dix minutes après.', 'Le bus retard moi dix minutes.', 'Hier demain le bus.', 'Je retard, c’est bus.'], answer: 0 },

    { level: 'B1', skill: 'Compréhension écrite', title: 'Qu’est-ce qu’un modèle de travail hybride ?', context: 'Le télétravail évite certains déplacements mais peut isoler les salariés. Plusieurs entreprises proposent donc un modèle hybride afin de garder les avantages des deux façons de travailler.', options: ['Confier l’ensemble des tâches collectives à des équipes entièrement à distance', 'Remplacer toutes les réunions du bureau par des échanges écrits permanents', 'Alterner des journées de télétravail et des journées de présence au bureau', 'Laisser chaque salarié partager son poste entre deux entreprises différentes'], answer: 2 },
    { level: 'B1', skill: 'Compréhension écrite', title: 'Quelle réserve l’auteur exprime-t-il ?', context: 'Les cours en ligne offrent une grande souplesse. Cependant, sans calendrier précis ni échanges réguliers, certains apprenants perdent rapidement leur motivation.', options: ['Le coût des formations en ligne décourage la majorité des apprenants inscrits', 'La souplesse des horaires garantit à elle seule la régularité des progrès', 'Sans cadre précis ni échanges réguliers, la motivation des apprenants s’érode', 'Les échanges entre apprenants empêchent de travailler à son propre rythme'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Pourquoi certains employés préfèrent-ils venir au bureau ?', audio: 'assets/audio/placement-b1.wav', options: ['Parce que leurs déplacements quotidiens leur sont remboursés par l’entreprise', 'Parce que leur connexion Internet à domicile est devenue trop instable', 'Parce qu’ils se concentrent mieux en travaillant auprès de leurs collègues', 'Parce qu’ils souhaitent pouvoir travailler aussi pendant le week-end'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Combien de jours de télétravail sont autorisés par semaine ?', audio: 'assets/audio/placement-b1.wav', options: ['Un jour par semaine', 'Deux jours par semaine', 'Trois jours par semaine', 'Quatre jours par semaine'], answer: 1 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase articule clairement une opposition ?', options: ['Le télétravail est pratique, pourtant il peut aussi isoler les équipes.', 'Le télétravail est pratique, donc il peut aussi isoler les équipes.', 'Le télétravail est pratique, parce qu’il peut aussi isoler les équipes.', 'Le télétravail est pratique, en effet il peut aussi isoler les équipes.'], answer: 0 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Choisis la formulation la plus claire pour donner un conseil.', options: ['À ta place, je définirais des horaires fixes afin de mieux progresser.', 'Si tu définirais des horaires fixes, tu progresserais bien plus vite.', 'Il faudrait que tu définis des horaires fixes pour progresser plus vite.', 'Je te conseille que tu définisses des horaires fixes pour mieux progresser.'], answer: 0 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Comment exprimer un désaccord de façon nuancée ?', options: ['Je suis absolument contre cette solution, elle ne convient vraiment à personne.', 'Je ne suis pas tout à fait d’accord, car cette solution ne convient pas à tous.', 'Cette solution est totalement inadaptée et personne ne peut sérieusement la défendre.', 'Je suis entièrement d’accord, même si cette solution ne convient pas à tous.'], answer: 1 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Quelle réponse développe une opinion personnelle ?', options: ['Cette mesure a été adoptée l’an dernier par la majorité des entreprises.', 'Il paraît que cette mesure réduit les déplacements dans plusieurs grandes entreprises.', 'À mon avis, cette mesure est utile parce qu’elle réduit les déplacements sans supprimer les échanges.', 'La mesure réduit les déplacements et maintient les échanges entre les collègues.'], answer: 2 },

    { level: 'B2', skill: 'Compréhension écrite', title: 'Pourquoi les compétences humaines restent-elles importantes ?', context: 'Les entreprises forment leurs employés pour travailler avec les nouvelles technologies. La créativité, la communication, l’esprit critique et l’adaptation deviennent recherchés, alors que certaines compétences techniques risquent de devenir obsolètes.', options: ['Parce qu’elles compensent le retard technologique accumulé par certaines entreprises', 'Parce qu’elles permettent de suivre les évolutions technologiques plutôt que de les subir', 'Parce qu’elles ralentissent une automatisation que les entreprises jugent excessive', 'Parce qu’elles rendent inutile toute mise à jour des compétences techniques'], answer: 1 },
    { level: 'B2', skill: 'Compréhension écrite', title: 'Quelle conclusion implicite se dégage du texte ?', context: 'L’accès immédiat à l’information donne l’impression que toute réponse est à portée de main. Pourtant, distinguer une source fiable d’une affirmation séduisante exige du temps, des méthodes et une vigilance que la vitesse de consultation ne garantit pas.', options: ['La rapidité d’accès garantit désormais la fiabilité des informations consultées', 'Toute information disponible en ligne doit être considérée comme trompeuse', 'Disposer de l’information ne dispense pas du travail de vérification', 'Les méthodes de vérification deviennent inutiles quand les sources sont nombreuses'], answer: 2 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quelle est l’idée principale de l’extrait ?', audio: 'assets/audio/placement-b2.wav', options: ['Les outils numériques suppriment l’essentiel des tâches répétitives sans contrepartie', 'Les outils numériques devraient être abandonnés au profit de méthodes traditionnelles', 'La maîtrise technique des outils suffit à protéger durablement la concentration', 'Les outils numériques peuvent aider, à condition d’en limiter aussi l’usage'], answer: 3 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quel effet négatif des outils numériques est mentionné ?', audio: 'assets/audio/placement-b2.wav', options: ['Ils ralentissent l’ensemble des tâches quotidiennes des équipes', 'Ils multiplient les sollicitations pendant le temps de travail', 'Ils rendent toute forme de créativité impossible à long terme', 'Ils réservent la technologie aux personnes déjà expertes'], answer: 1 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase présente l’argumentation la plus précise ?', options: ['Bien que ces outils améliorent la productivité, leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Malgré que ces outils améliorent la productivité, leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Ces outils améliorent la productivité, donc leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Bien que ces outils améliorent la productivité, leur efficacité en dépend de l’usage réfléchi que l’on en fait.'], answer: 0 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Choisis la reformulation qui conserve la nuance.', context: 'La mesure pourrait être utile, à condition qu’elle soit accompagnée d’un suivi régulier.', options: ['La mesure sera forcément utile, même si le suivi qui l’accompagne reste irrégulier.', 'Sans un suivi régulier, l’utilité de la mesure demeure incertaine.', 'Le suivi régulier rend la mesure inutile dans la plupart des situations.', 'La mesure conserve son utilité indépendamment du suivi qui l’accompagne.'], answer: 1 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Quelle intervention structure le mieux une prise de position ?', options: ['Je dirais d’abord que cette solution répond à un besoin réel ; néanmoins, deux limites doivent être examinées.', 'Je pense que cette solution répond à un besoin réel et qu’il y a aussi deux ou trois limites.', 'Cette solution répond à un besoin réel, par conséquent deux limites doivent être examinées.', 'D’un côté cette solution répond à un besoin réel, d’un côté deux limites doivent être examinées.'], answer: 0 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Comment reformuler poliment une objection complexe ?', options: ['Je comprends cet argument ; toutefois, il suppose que tous les publics disposent des mêmes ressources, ce qui reste à démontrer.', 'Je comprends cet argument, mais il est évident que tous les publics ne disposent pas des mêmes ressources.', 'Cet argument suppose que tous les publics disposent des mêmes ressources, ce qui est manifestement faux.', 'Je comprends parfaitement cet argument et je partage l’idée que tous les publics disposent des mêmes ressources.'], answer: 0 }
  ];

  questions.forEach((question, index) => {
    question.index = index;
    // Express keeps one representative from each level/competence block: 16 items.
    question.express = index % 8 % 2 === 0;
    question.autoSkill = question.skill === 'Compréhension écrite'
      ? 'reading'
      : question.skill === 'Compréhension orale'
        ? 'listening'
        : 'grammarVocabulary';
  });

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
  const modeButtons = [...document.querySelectorAll('[data-test-mode]')];
  const questionCount = document.querySelector('[data-test-question-count]');
  const duration = document.querySelector('[data-test-duration]');
  const audioStatus = document.querySelector('[data-audio-listen-status]');
  let mode = 'express';
  let activeQuestions = questions.filter(question => question.express);
  let current = 0;
  const audioStarts = new Map();
  let audioQuestionKey = '';
  const assetPath = path => document.documentElement.dataset.basePath ? `${document.documentElement.dataset.basePath}/${path}` : path;

  const selectMode = nextMode => {
    mode = nextMode;
    activeQuestions = mode === 'express' ? questions.filter(question => question.express) : questions;
    current = 0;
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.testMode === mode)));
    if (questionCount) questionCount.textContent = activeQuestions.length;
    if (duration) duration.textContent = mode === 'express' ? T.durationExpress : T.durationIntensive;
    if (stage && !stage.hidden) renderQuestion();
  };
  modeButtons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.testMode)));

  // One listen per question: two questions can share the same audio file and each
  // one still opens a fresh playback.
  audio.addEventListener('play', () => {
    if (!audioQuestionKey) return;
    const spent = audioStarts.get(audioQuestionKey) === true;
    const freshStart = audio.dataset.started !== 'true' || audio.dataset.finished === 'true';
    if (spent && freshStart) {
      audio.pause();
      audio.controls = false;
      audio.setAttribute('aria-disabled', 'true');
      if (audioStatus) audioStatus.textContent = T.audioSpent;
      return;
    }
    if (!freshStart) return;
    audioStarts.set(audioQuestionKey, true);
    audio.dataset.started = 'true';
    audio.setAttribute('aria-label', T.audioLabel);
    if (audioStatus) audioStatus.textContent = T.audioPlaying;
  });
  audio.addEventListener('ended', () => {
    audio.dataset.finished = 'true';
    if (audioStarts.get(audioQuestionKey) !== true) return;
    audio.controls = false;
    audio.setAttribute('aria-disabled', 'true');
    if (audioStatus) audioStatus.textContent = T.audioSpent;
  });

  const renderQuestion = () => {
    const question = activeQuestions[current];
    level.textContent = `${question.level} · ${T.question} ${current + 1}`;
    skill.textContent = T.skills[question.autoSkill];
    title.textContent = question.title;
    context.hidden = !question.context;
    context.textContent = question.context || '';
    audio.pause();
    audio.currentTime = 0;
    audioBox.hidden = !question.audio;
    audioQuestionKey = question.audio ? `${question.index}` : '';
    audio.dataset.started = 'false';
    audio.dataset.finished = 'false';
    if (question.audio) {
      audio.src = assetPath(question.audio);
      const spent = audioStarts.get(audioQuestionKey) === true;
      audio.controls = !spent;
      audio.setAttribute('aria-disabled', String(spent));
      audio.setAttribute('aria-label', T.audioLabel);
      if (audioStatus) audioStatus.textContent = spent ? T.audioSpent : T.audioWarning;
    } else {
      audio.removeAttribute('src');
      audio.removeAttribute('aria-disabled');
      audio.controls = true;
    }
    answers.innerHTML = question.options.map((option, index) => `
      <label class="answer-option">
        <input type="radio" name="answer" value="${index}" ${responses[question.index] === index ? 'checked' : ''}>
        <span>${option}</span>
      </label>
    `).join('');
    answers.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        responses[question.index] = Number(input.value);
        next.disabled = false;
      });
    });
    previous.disabled = current === 0;
    next.disabled = responses[question.index] === null;
    previous.textContent = T.previous;
    next.textContent = current === activeQuestions.length - 1 ? T.showResult : T.next;
    progressCopy.textContent = `${current + 1} / ${activeQuestions.length}`;
    progressBar.style.width = `${((current + 1) / activeQuestions.length) * 100}%`;
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

  const calculateResult = () => {
    const resultData = window.PathwayPlacementScoring.score({ questions, responses, mode });
    const { level: estimatedLevel, overall, totalCorrect, totalQuestions, status, skillScores, weakestSkill } = resultData;
    sessionStorage.setItem('pathwayPlacementResult', JSON.stringify(resultData));

    document.querySelector('[data-result-level]').textContent = estimatedLevel;
    const statusKey = levelIndexForStatus(resultData.levelIndex);
    const statusLabel = T.status[statusKey];
    document.querySelector('[data-result-title]').textContent = T.resultTitle(estimatedLevel);
    document.querySelector('[data-result-copy]').textContent = T.resultCopy({
      overall,
      totalCorrect,
      totalQuestions,
      status: statusLabel,
      weakest: T.skills[weakestSkill],
      confidence: T.confidence[mode]
    });
    document.querySelector('[data-skill-scores]').innerHTML = [...SKILLS.map(skillName => {
      const score = skillScores[skillName];
      const diagnostic = score >= 75 ? T.diagnostic.strength : score >= 55 ? T.diagnostic.operational : score >= 35 ? T.diagnostic.consolidating : T.diagnostic.priority;
      return `
        <div class="skill-score" style="--skill-score:${score}%">
          <span>${T.skills[skillName]}</span>
          <strong>${score}<small>/100</small></strong>
          <div class="skill-meter" aria-hidden="true"><i></i></div>
          <em>${diagnostic}</em>
        </div>
      `;
    }), `
      <div class="skill-score skill-score-not-evaluated">
        <span>${T.skills.speaking}</span>
        <strong>—<small>${T.speakingScore}</small></strong>
        <p>${T.speakingCopy}</p>
        <em>${T.speakingDiagnostic}</em>
      </div>
    `].join('');
    const enrollLink = document.querySelector('[data-enroll-link]');
    if (enrollLink) enrollLink.href = `inscription.html?mode=${encodeURIComponent(mode)}`;
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
    const question = activeQuestions[current];
    if (responses[question.index] === null) return;
    if (current < activeQuestions.length - 1) {
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
