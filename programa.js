(() => {
  const page = document.querySelector('[data-program-page]');
  if (!page) return;

  const programs = {
    A1: {
      unitTitle: 'Se présenter et agir au quotidien',
      objective: 'Comprender presentaciones breves, localizar información concreta y formular solicitudes sencillas con cortesía.',
      skills: ['Comprensión de textos personales breves', 'Información práctica: lugares y horarios', 'Fórmulas de presentación y cortesía'],
      context: 'Bonjour ! Je m’appelle Lucas. J’ai 20 ans et j’habite à Montréal. Je parle français et anglais. Le week-end, je sors avec mes amis.',
      unitQuestion: 'Où habite Lucas ?',
      unitOptions: ['À Paris', 'À Lima', 'À Montréal', 'À Québec'],
      examTitle: 'Où travaille Camille ?',
      examAudio: '/assets/audio/placement-a1.wav',
      examOptions: ['Dans une école', 'Dans une librairie', 'Dans un restaurant', 'Dans un hôpital'],
      self: ['Me presento con mi nombre, origen e idiomas.', 'Identifico lugares y horarios en mensajes breves.', 'Formulo una petición sencilla con una expresión de cortesía.']
    },
    A2: {
      unitTitle: 'Organiser un rendez-vous',
      objective: 'Comprender avisos cotidianos, reorganizar un compromiso y explicar brevemente una situación pasada.',
      skills: ['Lectura de avisos y mensajes prácticos', 'Comprensión de fechas y horas', 'Peticiones corteses y pasado compuesto'],
      context: 'Bonjour, une coupure d’eau est prévue vendredi entre 8 h et 11 h. Merci de fermer vos robinets avant 8 h et de ne pas utiliser le lave-linge pendant l’intervention.',
      unitQuestion: 'Que doit faire le locataire avant vendredi ?',
      unitOptions: ['Quitter son logement', 'Fermer les robinets', 'Réparer le lave-linge', 'Téléphoner au propriétaire'],
      examTitle: 'Quand aura lieu le nouveau rendez-vous ?',
      examAudio: '/assets/audio/placement-a2.wav',
      examOptions: ['Mercredi à midi', 'Jeudi 15 à 10 h 30', 'Jeudi à 15 h', 'Vendredi à 10 h 30'],
      self: ['Comprendo la información principal de un aviso cotidiano.', 'Puedo pedir que se cambie una cita de forma cortés.', 'Explico una situación pasada con frases enlazadas.']
    },
    B1: {
      unitTitle: 'Exprimer une opinion nuancée',
      objective: 'Comprender argumentos sencillos, relacionar ventajas y límites y defender una opinión personal con claridad.',
      skills: ['Comprensión de textos argumentativos breves', 'Conectores de oposición y consecuencia', 'Opinión, consejo y desacuerdo matizado'],
      context: 'Le télétravail évite certains déplacements mais peut isoler les salariés. Plusieurs entreprises proposent donc un modèle hybride afin de garder les avantages des deux façons de travailler.',
      unitQuestion: 'Qu’est-ce qu’un modèle de travail hybride ?',
      unitOptions: ['Travailler toujours à distance', 'Remplacer les réunions par des messages', 'Alterner télétravail et présence au bureau', 'Partager son poste entre deux entreprises'],
      examTitle: 'Pourquoi certains employés préfèrent-ils venir au bureau ?',
      examAudio: '/assets/audio/placement-b1.wav',
      examOptions: ['Leurs déplacements sont remboursés', 'Leur connexion est trop instable', 'Ils se concentrent mieux auprès de leurs collègues', 'Ils travaillent aussi le week-end'],
      self: ['Comprendo la tesis y la reserva de un texto breve.', 'Relaciono dos ideas con un conector adecuado.', 'Doy mi opinión y matizo mi desacuerdo.']
    },
    B2: {
      unitTitle: 'Construire et vérifier un argument',
      objective: 'Identificar lo implícito, conservar los matices al reformular y estructurar una toma de posición compleja.',
      skills: ['Comprensión de conclusiones implícitas', 'Reformulación fiel y precisa', 'Argumentación estructurada y objeción cortés'],
      context: 'L’accès immédiat à l’information donne l’impression que toute réponse est à portée de main. Pourtant, distinguer une source fiable d’une affirmation séduisante exige du temps, des méthodes et une vigilance que la vitesse de consultation ne garantit pas.',
      unitQuestion: 'Quelle conclusion implicite se dégage du texte ?',
      unitOptions: ['La rapidité garantit la fiabilité', 'Toute information en ligne est trompeuse', 'Disposer de l’information ne dispense pas de la vérifier', 'La vérification devient inutile'],
      examTitle: 'Quelle est l’idée principale de l’extrait ?',
      examAudio: '/assets/audio/placement-b2.wav',
      examOptions: ['Le numérique supprime les tâches répétitives', 'Il faut abandonner les outils numériques', 'La technique suffit à protéger la concentration', 'Les outils aident si l’on en limite aussi l’usage'],
      self: ['Identifico una conclusión implícita y los presupuestos de un texto.', 'Reformulo una idea sin perder sus matices.', 'Estructuro una objeción compleja con precisión y cortesía.']
    }
  };

  const level = page.dataset.programPage;
  const data = programs[level];
  if (!data) return;
  const list = items => items.map(item => '<li>' + item + '</li>').join('');

  document.querySelector('[data-unit-content]').innerHTML =
    '<div><div class="program-objective"><span>Objetivo pedagógico</span><h3>' + data.unitTitle + '</h3><p>' + data.objective + '</p></div>' +
    '<ul class="program-skills" aria-label="Competencias trabajadas">' + list(data.skills) + '</ul>' +
    '<figure class="real-material"><img src="/assets/pathway-zoom-course-laptop-768.webp" width="768" height="512" loading="lazy" decoding="async" alt="Material de vocabulario Pathway compartido durante una clase privada en línea"><figcaption>Material real utilizado en una clase privada Pathway.</figcaption></figure></div>' +
    '<article class="sample-activity"><span class="sample-label">Actividad real · banco Pathway</span><p class="sample-context" lang="fr">' + data.context + '</p><h3 class="sample-question" lang="fr">' + data.unitQuestion + '</h3><ol class="sample-options" lang="fr">' + list(data.unitOptions) + '</ol><p class="sample-source-note">Extracto real del banco de actividades A1–B2 ya disponible en Pathway. No representa por sí solo una unidad completa.</p></article>';

  document.querySelector('[data-exam-content]').innerHTML =
    '<div><ul class="exam-facts"><li><strong>4 exámenes</strong><span>uno al final de cada segmento del nivel</span></li><li><strong>1 extracto aquí</strong><span>para entender el tipo de actividad</span></li><li><strong>Seguimiento humano</strong><span>la producción se confirma con el profesor</span></li></ul></div>' +
    '<article class="exam-preview"><span class="exam-label">Examen de muestra · extracto de 1 de los 4 segmentos</span><h3 lang="fr">' + data.examTitle + '</h3><audio controls preload="metadata" src="' + data.examAudio + '">Tu navegador no permite reproducir este audio.</audio><ol class="sample-options" lang="fr">' + list(data.examOptions) + '</ol><p class="sample-source-note">Audio y consigna reales del banco Pathway. Este extracto no reproduce el examen completo del segmento.</p></article>';

  document.querySelector('[data-self-content]').innerHTML =
    data.self.map((statement, index) =>
      '<fieldset class="self-row"><legend>' + statement + '</legend>' +
      ['Todavía no', 'Con ayuda', 'Con autonomía'].map((label, choice) =>
        '<label class="self-choice"><input type="radio" name="self-' + level + '-' + index + '" value="' + choice + '"><span>' + label + '</span></label>'
      ).join('') + '</fieldset>'
    ).join('');
})();
