// Strings the home needs at run time (pricing cards, testimonials, IRCC
// rounds), in the four languages of the site. Translated by hand: brand and
// exam names (Pathway, NCLC, TEF, TCF, CRS, IRCC, Express Entry, Canadian
// Experience Class, Superprof) and people's names are never translated.
// The page language is the lang attribute of <html>.

export const LANGS = ['es', 'fr', 'en', 'de'];
export const pageLang = () => {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang || 'es').slice(0, 2);
  return LANGS.includes(lang) ? lang : 'es';
};

// Address of a page in each language (same names as scripts/v4-pages-content.mjs).
const PAGES = {
  es: { home: '/v4/', test: '/v4/test-placement.html', inscription: '/v4/inscription.html', conditions: '/v4/condiciones.html', nclc: '/v4/nclc-7.html' },
  fr: { home: '/v4/fr/', test: '/v4/fr/test.html', inscription: '/v4/fr/inscription.html', conditions: '/v4/fr/conditions-nclc7.html', nclc: '/v4/fr/nclc-7.html' },
  en: { home: '/v4/en/', test: '/v4/en/test.html', inscription: '/v4/en/inscription.html', conditions: '/v4/en/conditions-nclc7.html', nclc: '/v4/en/nclc-7.html' },
  de: { home: '/v4/de/', test: '/v4/de/test.html', inscription: '/v4/de/inscription.html', conditions: '/v4/de/conditions-nclc7.html', nclc: '/v4/de/nclc-7.html' }
};
export const pages = lang => PAGES[lang] || PAGES.es;

export const I18N = {
  es: {
    locale: 'es-ES',
    pricing: {
      plans: {
        essential: { name: 'Esencial', tag: 'Más de 18 meses', includes: ['Clases privadas en vivo', 'Cuaderno y seguimiento', 'Talleres prácticos', '2 simulacros TEF / TCF'] },
        accelerated: { name: 'Acelerado', tag: 'El más elegido', includes: ['Compatible con trabajo a tiempo completo', 'Clases privadas en vivo', 'Cuaderno, seguimiento y talleres', '2 simulacros TEF / TCF'] },
        intensive: { name: 'Intensivo', tag: 'Menos de 12 meses', includes: ['Ritmo de avance prioritario', 'Clases privadas en vivo', 'Cuaderno, seguimiento y talleres', '2 simulacros TEF / TCF'] }
      },
      perCycle: ' · ciclo completo', perMonth: ' / mes',
      monthlyHours: (h, w) => `${h} horas al mes · ${w} h*/semana`,
      cycleHours: (m, w) => `<strong>${m} meses</strong> · ${w} h*/semana`,
      saving: amount => `Ahorras ${amount} CAD`,
      equivalent: amount => `Equivale a ${amount} CAD al mes.`,
      reference: w => `Precio de referencia: ${w} h/semana.`,
      monthToMonth: 'Mes a mes, sin permanencia.',
      cta: 'Evaluar este ritmo',
      statusMonthly: 'Tarifas mensuales en dólares canadienses.',
      statusCycle: 'Tarifas por ciclo completo en dólares canadienses. Descuento directo del 15 %.'
    },
    stories: {
      play: name => `Ver el testimonio de ${name}`,
      videoOf: name => `Testimonio de ${name}`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Cerrar', previous: 'Testimonio anterior', next: 'Testimonio siguiente',
      error: 'No se pudo cargar el vídeo.', openFile: 'Abrir el archivo',
      watch: name => `Ver el vídeo de ${name}`,
      document: 'Ver la captura',
      documentAlt: name => `Captura de los resultados oficiales de ${name}`,
      attestation: 'Ver la constancia de Pathway',
      attestationAlt: name => `Constancia de participación de ${name} en Pathway`,
      nclc7: 'NCLC 7 o más en las cuatro competencias',
      prep: (hours, span) => `Preparación con Pathway: ${hours} h, ${span}`,
      span: (from, to) => `de ${from} a ${to}`,
      reviewSource: 'Opinión resumida · Superprof',
      pause: 'Pausar el desfile de opiniones', resume: 'Reanudar el desfile de opiniones'
    },
    rounds: {
      official: n => (n ? `Ronda oficial #${n}` : 'Ronda oficial'),
      live: 'Rondas oficiales de IRCC para francés y Canadian Experience Class.',
      checked: when => `Consultado el ${when}.`,
      snapshot: 'Datos en vivo no disponibles. Se muestra una copia fechada de la fuente oficial, que puede no incluir las rondas más recientes.',
      verified: when => `Copia verificada el ${when}.`,
      unavailable: 'Rondas oficiales de IRCC no disponibles en este momento.',
      noDate: 'Sin fecha de actualización disponible.'
    },
    social: { instagram: 'Instagram de Pathway', tiktok: 'TikTok de Pathway' }
  },
  fr: {
    locale: 'fr-FR',
    pricing: {
      plans: {
        essential: { name: 'Essentiel', tag: 'Plus de 18 mois', includes: ['Cours privés en direct', 'Cahier et suivi', 'Ateliers pratiques', '2 examens blancs TEF / TCF'] },
        accelerated: { name: 'Accéléré', tag: 'Le plus choisi', includes: ['Compatible avec un emploi à temps plein', 'Cours privés en direct', 'Cahier, suivi et ateliers', '2 examens blancs TEF / TCF'] },
        intensive: { name: 'Intensif', tag: 'Moins de 12 mois', includes: ['Rythme de progression prioritaire', 'Cours privés en direct', 'Cahier, suivi et ateliers', '2 examens blancs TEF / TCF'] }
      },
      perCycle: ' · cycle complet', perMonth: ' / mois',
      monthlyHours: (h, w) => `${h} heures par mois · ${w} h*/semaine`,
      cycleHours: (m, w) => `<strong>${m} mois</strong> · ${w} h*/semaine`,
      saving: amount => `Vous économisez ${amount} CAD`,
      equivalent: amount => `Soit ${amount} CAD par mois.`,
      reference: w => `Prix de référence : ${w} h/semaine.`,
      monthToMonth: 'Mois par mois, sans engagement.',
      cta: 'Évaluer ce rythme',
      statusMonthly: 'Tarifs mensuels en dollars canadiens.',
      statusCycle: 'Tarifs par cycle complet en dollars canadiens. Remise directe de 15 %.'
    },
    stories: {
      play: name => `Voir le témoignage de ${name}`,
      videoOf: name => `Témoignage de ${name}`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Fermer', previous: 'Témoignage précédent', next: 'Témoignage suivant',
      error: 'La vidéo n’a pas pu être chargée.', openFile: 'Ouvrir le fichier',
      watch: name => `Voir la vidéo de ${name}`,
      document: 'Voir la capture',
      documentAlt: name => `Capture des résultats officiels de ${name}`,
      attestation: 'Voir l’attestation Pathway',
      attestationAlt: name => `Attestation de participation de ${name} chez Pathway`,
      nclc7: 'NCLC 7 ou plus dans les quatre compétences',
      prep: (hours, span) => `Préparation avec Pathway : ${hours} h, ${span}`,
      span: (from, to) => `de ${from} à ${to}`,
      reviewSource: 'Avis résumé et traduit de l’espagnol · Superprof',
      pause: 'Mettre en pause le défilement des avis', resume: 'Reprendre le défilement des avis'
    },
    rounds: {
      official: n => (n ? `Ronde officielle n° ${n}` : 'Ronde officielle'),
      live: 'Rondes officielles d’IRCC pour le français et la Canadian Experience Class.',
      checked: when => `Consulté le ${when}.`,
      snapshot: 'Données en direct indisponibles. Voici une copie datée de la source officielle, qui peut ne pas inclure les rondes les plus récentes.',
      verified: when => `Copie vérifiée le ${when}.`,
      unavailable: 'Rondes officielles d’IRCC indisponibles pour le moment.',
      noDate: 'Aucune date de mise à jour disponible.'
    },
    social: { instagram: 'Instagram de Pathway', tiktok: 'TikTok de Pathway' }
  },
  en: {
    locale: 'en-CA',
    pricing: {
      plans: {
        essential: { name: 'Essential', tag: 'Over 18 months', includes: ['Live private lessons', 'Workbook and follow-up', 'Hands-on workshops', '2 TEF / TCF mock exams'] },
        accelerated: { name: 'Accelerated', tag: 'Most chosen', includes: ['Fits around a full-time job', 'Live private lessons', 'Workbook, follow-up and workshops', '2 TEF / TCF mock exams'] },
        intensive: { name: 'Intensive', tag: 'Under 12 months', includes: ['Priority pace of progress', 'Live private lessons', 'Workbook, follow-up and workshops', '2 TEF / TCF mock exams'] }
      },
      perCycle: ' · full cycle', perMonth: ' / month',
      monthlyHours: (h, w) => `${h} hours a month · ${w} h*/week`,
      cycleHours: (m, w) => `<strong>${m} months</strong> · ${w} h*/week`,
      saving: amount => `You save ${amount} CAD`,
      equivalent: amount => `That is ${amount} CAD a month.`,
      reference: w => `Reference price: ${w} h/week.`,
      monthToMonth: 'Month to month, no commitment.',
      cta: 'Consider this pace',
      statusMonthly: 'Monthly prices in Canadian dollars.',
      statusCycle: 'Full-cycle prices in Canadian dollars. 15% direct discount.'
    },
    stories: {
      play: name => `Watch ${name}’s testimonial`,
      videoOf: name => `${name}’s testimonial`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Close', previous: 'Previous testimonial', next: 'Next testimonial',
      error: 'The video could not be loaded.', openFile: 'Open the file',
      watch: name => `Watch ${name}’s video`,
      document: 'See the screenshot',
      documentAlt: name => `Screenshot of ${name}’s official results`,
      attestation: 'See the Pathway certificate',
      attestationAlt: name => `${name}’s Pathway certificate of participation`,
      nclc7: 'NCLC 7 or higher in all four skills',
      prep: (hours, span) => `Preparation with Pathway: ${hours} h, ${span}`,
      span: (from, to) => `from ${from} to ${to}`,
      reviewSource: 'Review summarized and translated from Spanish · Superprof',
      pause: 'Pause the scrolling reviews', resume: 'Resume the scrolling reviews'
    },
    rounds: {
      official: n => (n ? `Official round #${n}` : 'Official round'),
      live: 'Official IRCC rounds for French and the Canadian Experience Class.',
      checked: when => `Checked on ${when}.`,
      snapshot: 'Live data unavailable. This is a dated copy of the official source and may not include the latest rounds.',
      verified: when => `Copy verified on ${when}.`,
      unavailable: 'Official IRCC rounds are unavailable right now.',
      noDate: 'No update date available.'
    },
    social: { instagram: 'Pathway on Instagram', tiktok: 'Pathway on TikTok' }
  },
  de: {
    locale: 'de-DE',
    pricing: {
      plans: {
        essential: { name: 'Basis', tag: 'Über 18 Monate', includes: ['Live-Einzelunterricht', 'Arbeitsheft und Begleitung', 'Praxis-Workshops', '2 Probeprüfungen TEF / TCF'] },
        accelerated: { name: 'Beschleunigt', tag: 'Am häufigsten gewählt', includes: ['Mit einem Vollzeitjob vereinbar', 'Live-Einzelunterricht', 'Arbeitsheft, Begleitung und Workshops', '2 Probeprüfungen TEF / TCF'] },
        intensive: { name: 'Intensiv', tag: 'Unter 12 Monaten', includes: ['Vorrangiges Lerntempo', 'Live-Einzelunterricht', 'Arbeitsheft, Begleitung und Workshops', '2 Probeprüfungen TEF / TCF'] }
      },
      perCycle: ' · ganzer Zyklus', perMonth: ' / Monat',
      monthlyHours: (h, w) => `${h} Stunden im Monat · ${w} Std.*/Woche`,
      cycleHours: (m, w) => `<strong>${m} Monate</strong> · ${w} Std.*/Woche`,
      saving: amount => `Sie sparen ${amount} CAD`,
      equivalent: amount => `Das entspricht ${amount} CAD im Monat.`,
      reference: w => `Referenzpreis: ${w} Std./Woche.`,
      monthToMonth: 'Monatlich, ohne Mindestlaufzeit.',
      cta: 'Dieses Tempo prüfen',
      statusMonthly: 'Monatspreise in kanadischen Dollar.',
      statusCycle: 'Preise für den ganzen Zyklus in kanadischen Dollar. 15 % Direktrabatt.'
    },
    stories: {
      play: name => `Erfahrungsbericht von ${name} ansehen`,
      videoOf: name => `Erfahrungsbericht von ${name}`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Schließen', previous: 'Vorheriger Bericht', next: 'Nächster Bericht',
      error: 'Das Video konnte nicht geladen werden.', openFile: 'Datei öffnen',
      watch: name => `Video von ${name} ansehen`,
      document: 'Screenshot ansehen',
      documentAlt: name => `Screenshot der offiziellen Ergebnisse von ${name}`,
      attestation: 'Pathway-Bescheinigung ansehen',
      attestationAlt: name => `Teilnahmebescheinigung von ${name} bei Pathway`,
      nclc7: 'NCLC 7 oder mehr in allen vier Kompetenzen',
      prep: (hours, span) => `Vorbereitung mit Pathway: ${hours} Std., ${span}`,
      span: (from, to) => `von ${from} bis ${to}`,
      reviewSource: 'Bewertung zusammengefasst und aus dem Spanischen übersetzt · Superprof',
      pause: 'Laufende Bewertungen anhalten', resume: 'Laufende Bewertungen fortsetzen'
    },
    rounds: {
      official: n => (n ? `Offizielle Runde Nr. ${n}` : 'Offizielle Runde'),
      live: 'Offizielle IRCC-Runden für Französisch und die Canadian Experience Class.',
      checked: when => `Abgerufen am ${when}.`,
      snapshot: 'Live-Daten nicht verfügbar. Angezeigt wird eine datierte Kopie der offiziellen Quelle, die die neuesten Runden eventuell nicht enthält.',
      verified: when => `Kopie geprüft am ${when}.`,
      unavailable: 'Die offiziellen IRCC-Runden sind derzeit nicht verfügbar.',
      noDate: 'Kein Aktualisierungsdatum verfügbar.'
    },
    social: { instagram: 'Pathway auf Instagram', tiktok: 'Pathway auf TikTok' }
  }
};
export const t = lang => I18N[lang] || I18N.es;

// The sixteen public Superprof recommendations, condensed in Spanish and
// translated from that version. Same order as WRITTEN_TESTIMONIALS.
export const REVIEW_QUOTES = {
  fr: [
    'Avec Pathway, des explications claires et des cours dynamiques rendent le français facile à comprendre.',
    'Des dialogues en français, des devoirs entre les cours et un soutien constant pour améliorer la prononciation.',
    'De la patience, une excellente méthode et un véritable engagement envers les progrès de chaque élève.',
    'Je partais de zéro : Pathway m’a fait participer à chaque cours et s’est assuré que tout le monde avance.',
    'Des cours agréables et participatifs, qui enrichissent le vocabulaire en faisant entendre différentes façons de s’exprimer.',
    'En quelques cours, j’ai commencé à communiquer dans des situations du quotidien et à écouter du français authentique.',
    'J’ai beaucoup appris et je reste motivée grâce à des cours ludiques qui travaillent toutes les compétences.',
    'Chez Pathway, l’appui en espagnol éclaire les erreurs fréquentes des hispanophones et enrichit chaque cours.',
    'Des explications très claires et une vraie disponibilité pour aider les élèves.',
    'Beaucoup de patience pour la prononciation, et des cours participatifs, dynamiques et sans précipitation.',
    'De la patience, une prononciation juste et des explications sur les nuances propres au français.',
    'Une attention à chaque question, à l’écrit comme à l’oral, avec de la patience et une énergie qui rend les cours agréables.',
    'Des cours de conversation aux sujets excellents : l’une de mes meilleures expériences d’apprentissage du français.',
    'L’approche la plus pratique, intéressante et charismatique que j’aie trouvée en deux ans d’apprentissage du français.',
    'Le meilleur cours de français que j’aie suivi : toujours avec l’envie d’enseigner.',
    'Grâce à la patience dans les cours, j’ai pu progresser jusqu’au niveau A2.'
  ],
  en: [
    'With Pathway, clear explanations and lively lessons make French easy to understand.',
    'Dialogues in French, homework between lessons and constant support to improve pronunciation.',
    'Patience, an excellent method and a real commitment to every student’s progress.',
    'Starting from zero, Pathway supported me, got me taking part and made sure we all moved forward.',
    'Enjoyable, interactive lessons that build vocabulary by letting you hear different ways of expressing yourself.',
    'Within a few lessons I was communicating in everyday situations and listening to authentic French.',
    'I’ve learned a lot and I’m still motivated, thanks to playful lessons that work on every skill.',
    'At Pathway, support in Spanish clears up the mistakes Spanish speakers often make and enriches every lesson.',
    'Very clear explanations and a genuine willingness to help students.',
    'Lots of patience with pronunciation, and interactive, lively lessons that never feel rushed.',
    'Patience, accurate pronunciation and explanations of the nuances specific to French.',
    'Every question gets attention, written or spoken, with patience and an energy that makes lessons enjoyable.',
    'Conversation lessons with excellent topics: one of my best experiences learning French.',
    'The most practical, interesting and charismatic approach I’ve found in two years of studying French.',
    'The best French class I’ve ever had: always eager to teach.',
    'Thanks to the patience in class, I made it all the way to level A2.'
  ],
  de: [
    'Bei Pathway machen klare Erklärungen und lebendige Stunden Französisch leicht verständlich.',
    'Dialoge auf Französisch, Aufgaben zwischen den Stunden und ständige Unterstützung bei der Aussprache.',
    'Geduld, eine hervorragende Methode und echtes Engagement für den Fortschritt jedes Lernenden.',
    'Ich habe bei null angefangen: Pathway hat mich begleitet, zum Mitmachen gebracht und darauf geachtet, dass alle vorankommen.',
    'Angenehme, interaktive Stunden, die den Wortschatz erweitern, weil man verschiedene Ausdrucksweisen hört.',
    'Nach wenigen Stunden konnte ich mich in Alltagssituationen verständigen und authentisches Französisch hören.',
    'Ich habe viel gelernt und bleibe motiviert – dank spielerischer Stunden, die alle Kompetenzen trainieren.',
    'Bei Pathway klärt die Unterstützung auf Spanisch die typischen Fehler spanischsprachiger Lernender und bereichert jede Stunde.',
    'Sehr klare Erklärungen und echte Bereitschaft, den Lernenden zu helfen.',
    'Viel Geduld bei der Aussprache und interaktive, lebendige Stunden ohne Hektik.',
    'Geduld, korrekte Aussprache und Erklärungen zu den Feinheiten des Französischen.',
    'Jede Frage wird beachtet, ob schriftlich oder mündlich – mit Geduld und einer Energie, die die Stunden angenehm macht.',
    'Konversationsstunden mit hervorragenden Themen: eine meiner besten Erfahrungen beim Französischlernen.',
    'Der praktischste, interessanteste und charismatischste Ansatz, den ich in zwei Jahren Französischlernen gefunden habe.',
    'Der beste Französischunterricht, den ich je hatte: immer mit Freude am Unterrichten.',
    'Dank der Geduld im Unterricht habe ich es bis zum Niveau A2 geschafft.'
  ]
};
