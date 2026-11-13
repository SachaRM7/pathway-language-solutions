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
      skillsInSentence: { reading: 'la comprensión escrita', listening: 'la comprensión oral', grammarVocabulary: 'la gramática y el vocabulario' },
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
      leadKicker: 'Tu resultado está listo',
      leadTitle: '¿Con qué correo guardamos tu resultado?',
      leadCopy: 'Guardamos tu nivel con tu correo: tu profesor lo tendrá listo para tu primera clase, y tu Campus empezará en el nivel correcto. No te enviamos ningún correo.',
      leadLabel: 'Tu correo electrónico',
      leadPlaceholder: 'tu.nombre@correo.com',
      leadInvalid: 'Escribe un correo electrónico válido.',
      leadConsent: 'Usamos tu correo solo para preparar tu curso. Más detalles en nuestra <a href="/privacidad.html">política de privacidad</a>.',
      leadButton: 'Ver mi resultado',
      resultTitle: level => `Tu francés se sitúa alrededor de ${level}.`,
      status: { construction: 'Tu nivel está en construcción.', functional: 'Tu nivel es funcional.', independent: 'Tu nivel es independiente.', solid: 'Tu nivel es sólido.' },
      confidence: { express: 'Orientativo: confirma tu nivel en una clase en vivo.', intensive: 'Más preciso: combina cuatro niveles y pondera la dificultad.' },
      diagnostic: { priority: 'prioridad', consolidating: 'por consolidar', operational: 'operativa', strength: 'fortaleza' },
      speakingScore: 'No evaluada en este test', speakingCopy: 'Se confirma en una clase en vivo.', speakingDiagnostic: 'por confirmar',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Índice global del test: ${overall}/100 (${totalCorrect} respuestas correctas de ${totalQuestions}). ${status} La competencia que más limita tu avance es ${weakest}. ${confidence}`
    },
    fr: {
      skills: { reading: 'Compréhension écrite', listening: 'Compréhension orale', grammarVocabulary: 'Grammaire et vocabulaire', speaking: 'Expression orale' },
      skillsInSentence: { reading: 'la compréhension écrite', listening: 'la compréhension orale', grammarVocabulary: 'la grammaire et le vocabulaire' },
      question: 'question',
      durationExpress: '12–15 min',
      durationIntensive: '25–30 min',
      audioWarning: 'Attention : vous n’avez droit qu’à une seule écoute par question.',
      audioPlaying: 'Écoute en cours · c’est votre seule écoute pour cette question',
      audioSpent: 'Écoute utilisée (1/1) pour cette question',
      audioLabel: 'Une seule écoute par question ; mettre en pause et reprendre ne consomme pas une écoute supplémentaire',
      previous: 'Précédente',
      next: 'Suivante',
      showResult: 'Voir mon résultat',
      leadKicker: 'Votre résultat est prêt',
      leadTitle: 'Avec quelle adresse e-mail enregistrons-nous votre résultat ?',
      leadCopy: 'Nous enregistrons votre niveau avec votre adresse e-mail : votre professeur l’aura sous les yeux dès votre premier cours, et votre Campus commencera au bon niveau. Nous ne vous envoyons aucun e-mail.',
      leadLabel: 'Votre adresse e-mail',
      leadPlaceholder: 'prenom.nom@exemple.com',
      leadInvalid: 'Saisissez une adresse e-mail valide.',
      leadConsent: 'Votre adresse ne sert qu’à préparer votre cours. Plus de détails dans notre <a href="/fr/politique-confidentialite.html">politique de confidentialité</a>.',
      leadButton: 'Voir mon résultat',
      resultTitle: level => `Votre français se situe autour de ${level}.`,
      status: { construction: 'Votre niveau est en construction.', functional: 'Votre niveau est fonctionnel.', independent: 'Votre niveau est autonome.', solid: 'Votre niveau est solide.' },
      confidence: { express: 'Indication prudente : confirmez votre niveau lors d’un cours en direct.', intensive: 'Estimation plus précise : quatre niveaux et la difficulté sont pondérés.' },
      diagnostic: { priority: 'priorité', consolidating: 'à consolider', operational: 'opérationnel', strength: 'point fort' },
      speakingScore: 'Non évaluée par ce test', speakingCopy: 'À confirmer pendant un cours en direct.', speakingDiagnostic: 'à confirmer',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Indice global du test : ${overall}/100 (${totalCorrect} bonnes réponses sur ${totalQuestions}). ${status} La compétence qui limite le plus votre progression est ${weakest}. ${confidence}`
    },
    en: {
      skills: { reading: 'Reading comprehension', listening: 'Listening comprehension', grammarVocabulary: 'Grammar & vocabulary', speaking: 'Speaking' },
      skillsInSentence: { reading: 'reading comprehension', listening: 'listening comprehension', grammarVocabulary: 'grammar and vocabulary' },
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
      leadKicker: 'Your result is ready',
      leadTitle: 'Which email address should we save your result with?',
      leadCopy: 'We save your level with your email address: your teacher will have it ready for your first class, and your Campus will start at the right level. We do not send you any email.',
      leadLabel: 'Your email address',
      leadPlaceholder: 'name@example.com',
      leadInvalid: 'Enter a valid email address.',
      leadConsent: 'We only use your email address to prepare your course. More in our <a href="/en/privacy-policy.html">privacy policy</a>.',
      leadButton: 'See my result',
      resultTitle: level => `Your French is estimated at around ${level}.`,
      status: { construction: 'Your level is still developing.', functional: 'Your level is functional.', independent: 'Your level is independent.', solid: 'Your level is solid.' },
      confidence: { express: 'Guidance only: confirm your level in a live class.', intensive: 'More precise: four levels and difficulty weighting are included.' },
      diagnostic: { priority: 'priority', consolidating: 'to consolidate', operational: 'operational', strength: 'strength' },
      speakingScore: 'Not assessed by this test', speakingCopy: 'To be confirmed in a live class.', speakingDiagnostic: 'to confirm',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Overall test index: ${overall}/100 (${totalCorrect} correct answers out of ${totalQuestions}). ${status} The skill holding back your progress most is ${weakest}. ${confidence}`
    },
    de: {
      skills: { reading: 'Leseverstehen', listening: 'Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz', speaking: 'Sprechen' },
      skillsInSentence: { reading: 'das Leseverstehen', listening: 'das Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz' },
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
      leadKicker: 'Ihr Ergebnis ist bereit',
      leadTitle: 'Unter welcher E-Mail-Adresse speichern wir Ihr Ergebnis?',
      leadCopy: 'Wir speichern Ihr Niveau mit Ihrer E-Mail-Adresse: Ihre Lehrkraft hat es zur ersten Stunde vorliegen, und Ihr Campus beginnt auf dem richtigen Niveau. Wir senden Ihnen keine E-Mail.',
      leadLabel: 'Ihre E-Mail-Adresse',
      leadPlaceholder: 'name@beispiel.de',
      leadInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
      leadConsent: 'Wir nutzen Ihre Adresse nur zur Vorbereitung Ihres Kurses. Mehr dazu in unserer <a href="/de/datenschutz.html">Datenschutzerklärung</a>.',
      leadButton: 'Ergebnis anzeigen',
      resultTitle: level => `Ihr Französisch liegt ungefähr auf Niveau ${level}.`,
      status: { construction: 'Ihr Niveau befindet sich im Aufbau.', functional: 'Ihr Niveau ist funktional.', independent: 'Ihr Niveau ist selbstständig.', solid: 'Ihr Niveau ist sicher.' },
      confidence: { express: 'Orientierung: Bestätigen Sie Ihr Niveau in einer Live-Stunde.', intensive: 'Präzisere Einschätzung: vier Niveaus und die Schwierigkeit werden gewichtet.' },
      diagnostic: { priority: 'Priorität', consolidating: 'zu festigen', operational: 'funktional', strength: 'Stärke' },
      speakingScore: 'Von diesem Test nicht bewertet', speakingCopy: 'Wird in einer Live-Stunde bestätigt.', speakingDiagnostic: 'zu bestätigen',
      resultCopy: ({ overall, totalCorrect, totalQuestions, status, weakest, confidence }) => `Gesamtindex des Tests: ${overall}/100 (${totalCorrect} richtige Antworten von ${totalQuestions}). ${status} Die Kompetenz, die Ihren Fortschritt am stärksten begrenzt, ist ${weakest}. ${confidence}`
    }
  };
  const T = UI[locale] || UI.es;

  // Styles of the e-mail step (built by this script) and of the level rail on phones, in the
  // V4 tokens: the V4 test page only loads the shared V4 sheets.
  if (!document.querySelector('style[data-placement-test]')) {
    const style = document.createElement('style');
    style.dataset.placementTest = '';
    style.textContent = `
      .lead-card { display: grid; gap: 16px; align-content: start; }
      .lead-card h2 { margin: 0; }
      .lead-card .lead-copy { margin: 0; color: var(--muted, #50625c); line-height: 1.55; }
      .lead-field { display: grid; gap: 8px; max-width: 520px; margin-top: 8px; font-size: 15px; font-weight: 700; }
      .lead-field input { min-height: 52px; padding: 0 16px; border: 1.5px solid var(--line, #d6d7cf); border-radius: 12px; background: var(--paper, #fffaf2); color: var(--ink, #122b26); font: inherit; font-weight: 500; font-size: 17px; }
      .lead-field input:focus { outline: none; border-color: var(--ink, #122b26); box-shadow: 0 0 0 3px var(--sage, #cad8c3); }
      .lead-field input[aria-invalid="true"] { border-color: var(--action, #a34e3b); }
      .lead-error { display: flex; align-items: center; gap: 8px; margin: -4px 0 0; color: var(--action, #a34e3b); font-size: 15px; font-weight: 700; }
      .lead-error::before { content: "!"; display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--action, #a34e3b); color: var(--paper, #fffaf2); font-size: 12px; }
      .lead-error[hidden] { display: none; }
      .lead-consent { max-width: 60ch; margin: 0; color: var(--muted, #50625c); font-size: 14px; line-height: 1.5; }
      .lead-consent a { color: inherit; }
      @media (max-width: 640px) {
        .level-rail li { font-size: 13px !important; }
        .level-rail li span { display: none; }
      }`;
    document.head.append(style);
  }
  const levelIndexForStatus = levelIndex => levelIndex >= 3 ? 'solid' : levelIndex >= 2 ? 'independent' : levelIndex >= 1 ? 'functional' : 'construction';

  const questions = [
    { level: 'A1', skill: 'Compréhension écrite', title: 'Où habite Lucas ?', context: 'Bonjour ! Je m’appelle Lucas. J’ai 20 ans et j’habite à Montréal. Je parle français et anglais. Le week-end, je sors avec mes amis.', options: ['À Paris', 'À Lima', 'À Montréal', 'À Québec'], answer: 2 },
    { level: 'A1', skill: 'Compréhension écrite', title: 'À quelle heure ferme la bibliothèque ?', context: 'Bibliothèque municipale — ouverte du lundi au vendredi de 9 h à 18 h. Fermée le samedi.', options: ['À 9 h', 'À 12 h', 'À 18 h', 'À 20 h'], answer: 2 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Où travaille Camille ?', audio: '/assets/audio/placement-a1.mp3', options: ['Dans une école', 'Dans une librairie', 'Dans un restaurant', 'Dans un hôpital'], answer: 1 },
    { level: 'A1', skill: 'Compréhension orale', title: 'Que fait Camille le samedi ?', audio: '/assets/audio/placement-a1.mp3', options: ['Elle travaille à la librairie', 'Elle étudie le français', 'Elle fait du vélo avec ses amis', 'Elle va au restaurant'], answer: 2 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Choisis la présentation correctement écrite.', options: ['Je m’appelle Ana et je suis péruvienne.', 'Je appelle Ana et je est péruvienne.', 'Moi s’appelle Ana, péruvienne.', 'Je m’appelles Ana et suis péruvien.'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Complète le message : « Bonjour, je ___ réserver une table pour deux personnes. »', options: ['voudrais', 'voudrait', 'voulez', 'voulons'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Quel échange est naturel pour saluer quelqu’un ?', options: ['— Bonjour ! — Bonjour, comment ça va ?', '— Bonjour ! — J’ai vingt ans.', '— Bonjour ! — À la boulangerie.', '— Bonjour ! — Parce que oui.'], answer: 0 },
    { level: 'A1', skill: 'Grammaire et vocabulaire', title: 'Au café, quelle demande est la plus appropriée ?', options: ['Un café.', 'Je veux café maintenant.', 'Bonjour, un café s’il vous plaît.', 'Tu donnes le café.'], answer: 2 },

    { level: 'A2', skill: 'Compréhension écrite', title: 'Pourquoi Sophie a-t-elle acheté des fleurs ?', context: 'Samedi, Sophie est allée au marché avec sa sœur. Elle a acheté des légumes, du fromage et de belles fleurs pour sa mère, qui fêtait son anniversaire ce jour-là.', options: ['Pour décorer le restaurant', 'Pour remercier sa sœur', 'Pour l’anniversaire de sa mère', 'Pour les vendre au marché'], answer: 2 },
    { level: 'A2', skill: 'Compréhension écrite', title: 'Que doit faire le locataire avant vendredi ?', context: 'Bonjour, une coupure d’eau est prévue vendredi entre 8 h et 11 h. Merci de fermer vos robinets avant 8 h et de ne pas utiliser le lave-linge pendant l’intervention.', options: ['Quitter son logement', 'Fermer les robinets', 'Réparer le lave-linge', 'Téléphoner au propriétaire'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Quand aura lieu le nouveau rendez-vous ?', audio: '/assets/audio/placement-a2.mp3', options: ['Mercredi à midi', 'Jeudi 15 à 10 h 30', 'Jeudi à 15 h', 'Vendredi à 10 h 30'], answer: 1 },
    { level: 'A2', skill: 'Compréhension orale', title: 'Que faut-il faire si la nouvelle heure ne convient pas ?', audio: '/assets/audio/placement-a2.mp3', options: ['Venir mercredi midi', 'Envoyer un courrier jeudi', 'Rappeler avant mercredi midi', 'Annuler le rendez-vous en ligne'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Choisis la phrase correcte au passé composé.', options: ['Sophie est allé au marché.', 'Sophie a allée au marché.', 'Sophie est allée au marché.', 'Sophie va au marché hier.'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase convient à un courriel pour reporter un rendez-vous ?', options: ['Je peux pas. Change.', 'Serait-il possible de déplacer notre rendez-vous à jeudi ?', 'Rendez-vous non, jeudi oui.', 'Tu dois changer notre heure.'], answer: 1 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Tu n’as pas compris une consigne. Que dis-tu ?', options: ['Quoi ?', 'Répétez.', 'Excusez-moi, pourriez-vous répéter plus lentement ?', 'Je ne veux pas écouter.'], answer: 2 },
    { level: 'A2', skill: 'Grammaire et vocabulaire', title: 'Quelle réponse explique simplement un retard ?', options: ['Parce que le bus a eu du retard, je suis arrivé dix minutes après.', 'Le bus retard moi dix minutes.', 'Hier demain le bus.', 'Je retard, c’est bus.'], answer: 0 },

    { level: 'B1', skill: 'Compréhension écrite', title: 'Qu’est-ce qu’un modèle de travail hybride ?', context: 'Le télétravail évite certains déplacements mais peut isoler les salariés. Plusieurs entreprises proposent donc un modèle hybride afin de garder les avantages des deux façons de travailler.', options: ['Confier l’ensemble des tâches collectives à des équipes entièrement à distance', 'Remplacer toutes les réunions du bureau par des échanges écrits permanents', 'Alterner des journées de télétravail et des journées de présence au bureau', 'Laisser chaque salarié partager son poste entre deux entreprises différentes'], answer: 2 },
    { level: 'B1', skill: 'Compréhension écrite', title: 'Quelle réserve l’auteur exprime-t-il ?', context: 'Les cours en ligne offrent une grande souplesse. Cependant, sans calendrier précis ni échanges réguliers, certains apprenants perdent rapidement leur motivation.', options: ['Le coût des formations en ligne décourage la majorité des apprenants inscrits', 'La souplesse des horaires garantit à elle seule la régularité des progrès', 'Sans cadre précis ni échanges réguliers, la motivation des apprenants s’érode', 'Les échanges entre apprenants empêchent de travailler à son propre rythme'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Pourquoi certains employés préfèrent-ils venir au bureau ?', audio: '/assets/audio/placement-b1.mp3', options: ['Parce que leurs déplacements quotidiens leur sont remboursés par l’entreprise', 'Parce que leur connexion Internet à domicile est devenue trop instable', 'Parce qu’ils se concentrent mieux en travaillant auprès de leurs collègues', 'Parce qu’ils souhaitent pouvoir travailler aussi pendant le week-end'], answer: 2 },
    { level: 'B1', skill: 'Compréhension orale', title: 'Combien de jours de télétravail sont autorisés par semaine ?', audio: '/assets/audio/placement-b1.mp3', options: ['Un jour par semaine', 'Deux jours par semaine', 'Trois jours par semaine', 'Quatre jours par semaine'], answer: 1 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase articule clairement une opposition ?', options: ['Le télétravail est pratique, pourtant il peut aussi isoler les équipes.', 'Le télétravail est pratique, donc il peut aussi isoler les équipes.', 'Le télétravail est pratique, parce qu’il peut aussi isoler les équipes.', 'Le télétravail est pratique, en effet il peut aussi isoler les équipes.'], answer: 0 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Choisis la formulation la plus claire pour donner un conseil.', options: ['À ta place, je définirais des horaires fixes afin de mieux progresser.', 'Si tu définirais des horaires fixes, tu progresserais bien plus vite.', 'Il faudrait que tu définis des horaires fixes pour progresser plus vite.', 'Je te conseille que tu définisses des horaires fixes pour mieux progresser.'], answer: 0 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Comment exprimer un désaccord de façon nuancée ?', options: ['Je suis absolument contre cette solution, elle ne convient vraiment à personne.', 'Je ne suis pas tout à fait d’accord, car cette solution ne convient pas à tous.', 'Cette solution est totalement inadaptée et personne ne peut sérieusement la défendre.', 'Je suis entièrement d’accord, même si cette solution ne convient pas à tous.'], answer: 1 },
    { level: 'B1', skill: 'Grammaire et vocabulaire', title: 'Quelle réponse développe une opinion personnelle ?', options: ['Cette mesure a été adoptée l’an dernier par la majorité des entreprises.', 'Il paraît que cette mesure réduit les déplacements dans plusieurs grandes entreprises.', 'À mon avis, cette mesure est utile parce qu’elle réduit les déplacements sans supprimer les échanges.', 'La mesure réduit les déplacements et maintient les échanges entre les collègues.'], answer: 2 },

    { level: 'B2', skill: 'Compréhension écrite', title: 'Pourquoi les compétences humaines restent-elles importantes ?', context: 'Les entreprises forment leurs employés pour travailler avec les nouvelles technologies. La créativité, la communication, l’esprit critique et l’adaptation deviennent recherchés, alors que certaines compétences techniques risquent de devenir obsolètes.', options: ['Parce qu’elles compensent le retard technologique accumulé par certaines entreprises', 'Parce qu’elles permettent de suivre les évolutions technologiques plutôt que de les subir', 'Parce qu’elles ralentissent une automatisation que les entreprises jugent excessive', 'Parce qu’elles rendent inutile toute mise à jour des compétences techniques'], answer: 1 },
    { level: 'B2', skill: 'Compréhension écrite', title: 'Quelle conclusion implicite se dégage du texte ?', context: 'L’accès immédiat à l’information donne l’impression que toute réponse est à portée de main. Pourtant, distinguer une source fiable d’une affirmation séduisante exige du temps, des méthodes et une vigilance que la vitesse de consultation ne garantit pas.', options: ['La rapidité d’accès garantit désormais la fiabilité des informations consultées', 'Toute information disponible en ligne doit être considérée comme trompeuse', 'Disposer de l’information ne dispense pas du travail de vérification', 'Les méthodes de vérification deviennent inutiles quand les sources sont nombreuses'], answer: 2 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quelle est l’idée principale de l’extrait ?', audio: '/assets/audio/placement-b2.mp3', options: ['Les outils numériques suppriment l’essentiel des tâches répétitives sans contrepartie', 'Les outils numériques devraient être abandonnés au profit de méthodes traditionnelles', 'La maîtrise technique des outils suffit à protéger durablement la concentration', 'Les outils numériques peuvent aider, à condition d’en limiter aussi l’usage'], answer: 3 },
    { level: 'B2', skill: 'Compréhension orale', title: 'Quel effet négatif des outils numériques est mentionné ?', audio: '/assets/audio/placement-b2.mp3', options: ['Ils ralentissent l’ensemble des tâches quotidiennes des équipes', 'Ils multiplient les sollicitations pendant le temps de travail', 'Ils rendent toute forme de créativité impossible à long terme', 'Ils réservent la technologie aux personnes déjà expertes'], answer: 1 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Quelle phrase présente l’argumentation la plus précise ?', options: ['Bien que ces outils améliorent la productivité, leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Malgré que ces outils améliorent la productivité, leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Ces outils améliorent la productivité, donc leur efficacité dépend de l’usage réfléchi que l’on en fait.', 'Bien que ces outils améliorent la productivité, leur efficacité en dépend de l’usage réfléchi que l’on en fait.'], answer: 0 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Choisis la reformulation qui conserve la nuance.', context: 'La mesure pourrait être utile, à condition qu’elle soit accompagnée d’un suivi régulier.', options: ['La mesure sera forcément utile, même si le suivi qui l’accompagne reste irrégulier.', 'Sans un suivi régulier, l’utilité de la mesure demeure incertaine.', 'Le suivi régulier rend la mesure inutile dans la plupart des situations.', 'La mesure conserve son utilité indépendamment du suivi qui l’accompagne.'], answer: 1 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Quelle intervention structure le mieux une prise de position ?', options: ['Je dirais d’abord que cette solution répond à un besoin réel ; néanmoins, deux limites doivent être examinées.', 'Je pense que cette solution répond à un besoin réel et qu’il y a aussi deux ou trois limites.', 'Cette solution répond à un besoin réel, par conséquent deux limites doivent être examinées.', 'D’un côté cette solution répond à un besoin réel, d’un côté deux limites doivent être examinées.'], answer: 0 },
    { level: 'B2', skill: 'Grammaire et vocabulaire', title: 'Comment reformuler poliment une objection complexe ?', options: ['Je comprends cet argument ; toutefois, il suppose que tous les publics disposent des mêmes ressources, ce qui reste à démontrer.', 'Je comprends cet argument, mais il est évident que tous les publics ne disposent pas des mêmes ressources.', 'Cet argument suppose que tous les publics disposent des mêmes ressources, ce qui est manifestement faux.', 'Je comprends parfaitement cet argument et je partage l’idée que tous les publics disposent des mêmes ressources.'], answer: 0 }
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

  // The result is saved with the email so the teacher finds the level when creating the account
  // (campus/db/019_test_nivel.sql). A network failure never blocks the result.
  const track = (name, data) => { try { window.PathwayAnalytics?.track(name, data); } catch (error) { /* never blocks */ } };
  const SUPABASE = { url: 'https://ynflykxalfynxoupkxmy.supabase.co', key: 'sb_publishable_e3Pa5ADDtYVU7BJilbkcxw_qaPPxtKB' };
  const saveResult = (email, data) => {
    try {
      const skills = Object.fromEntries(SKILLS.map(name => [name, data.skillScores[name]]));
      return fetch(`${SUPABASE.url}/rest/v1/rpc/submit_placement`, {
        method: 'POST',
        headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_email: email, p_level: data.level, p_overall: Math.round(data.overall), p_mode: mode, p_lang: ['es', 'fr', 'en', 'de'].includes(locale) ? locale : 'es', p_detail: { skills, correct: data.totalCorrect, questions: data.totalQuestions } }),
        keepalive: true
      }).then(response => {
        // A refused save (more than 5 tests per address and hour, network) is logged; the result still shows.
        if (!response.ok) track('placement_save_failed', { status: response.status });
        return response.ok;
      }, () => { track('placement_save_failed', { status: 0 }); return false; });
    } catch (error) { track('placement_save_failed', { status: -1 }); return Promise.resolve(false); }
  };
  let lead = null;
  const askEmail = () => {
    if (!lead) {
      lead = document.createElement('form');
      lead.className = 'test-card lead-card';
      lead.noValidate = true;
      lead.innerHTML = `<span class="eyebrow">${T.leadKicker}</span>
        <h2>${T.leadTitle}</h2>
        <p class="lead-copy">${T.leadCopy}</p>
        <label class="lead-field" for="leadEmail"><span>${T.leadLabel}</span><input id="leadEmail" type="email" inputmode="email" autocomplete="email" required placeholder="${T.leadPlaceholder}"></label>
        <p class="lead-error" role="alert" hidden>${T.leadInvalid}</p>
        <p class="lead-consent">${T.leadConsent}</p>
        <div class="test-actions"><button class="button button-coral" type="submit">${T.leadButton} <span aria-hidden="true">→</span></button></div>`;
      form.after(lead);
      lead.addEventListener('submit', event => {
        event.preventDefault();
        const input = lead.querySelector('#leadEmail');
        const email = input.value.trim().toLowerCase();
        const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
        lead.querySelector('.lead-error').hidden = ok;
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok) { input.focus(); return; }
        try { sessionStorage.setItem('pathwayPlacementEmail', email); } catch (error) { /* the result still shows */ }
        lead.querySelector('button').disabled = true;
        lead.hidden = true;
        form.hidden = false;
        calculateResult(email);
      });
    }
    form.hidden = true;
    lead.hidden = false;
    lead.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => lead.querySelector('#leadEmail').focus({ preventScroll: true }), 250);
  };

  const calculateResult = email => {
    const resultData = window.PathwayPlacementScoring.score({ questions, responses, mode });
    if (email) saveResult(email, resultData);
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
      weakest: T.skillsInSentence[weakestSkill],
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
    askEmail();
  });

  previous.addEventListener('click', () => {
    if (current === 0) return;
    current -= 1;
    renderQuestion();
  });
})();
