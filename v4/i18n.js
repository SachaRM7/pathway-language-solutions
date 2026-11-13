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

// Public address of a page in each language (same names as
// scripts/v4-pages-content.mjs). The V4 pages are served at the root, so the
// links never go through the /v4/ working copies (which only redirect).
const PAGES = {
  es: { home: '/', test: '/test-placement.html', inscription: '/inscription.html', conditions: '/condiciones.html', nclc: '/nclc-7.html', crs: '/calculador.html' },
  fr: { home: '/fr/', test: '/fr/test.html', inscription: '/fr/inscription.html', conditions: '/fr/conditions-nclc7.html', nclc: '/fr/nclc-7.html', crs: '/fr/calculateur-crs.html' },
  en: { home: '/en/', test: '/en/test.html', inscription: '/en/inscription.html', conditions: '/en/terms.html', nclc: '/en/nclc-7.html', crs: '/en/crs-calculator.html' },
  de: { home: '/de/', test: '/de/test.html', inscription: '/de/inscription.html', conditions: '/de/bedingungen.html', nclc: '/de/nclc-7.html', crs: '/de/crs-rechner.html' }
};
export const pages = lang => PAGES[lang] || PAGES.es;

// French elision before a vowel or a mute h: « d’Elena », « de Devon ».
const frDe = name => (/^[aeiouyàâéèêëîïôûüh]/i.test(name) ? `d’${name}` : `de ${name}`);

export const I18N = {
  es: {
    locale: 'es-ES',
    pricing: {
      plans: {
        essential: { name: 'Esencial', tag: 'De A1 a B2: unos 24 meses', includes: ['Clases individuales en vivo por Zoom', 'Campus Pathway: ejercicios, manual en línea y grabaciones', 'Seguimiento de tu progreso', '2 simulacros TEF / TCF Canada'] },
        accelerated: { name: 'Acelerado', tag: 'De A1 a B2: unos 20 meses', includes: ['Compatible con trabajo a tiempo completo', 'Clases individuales en vivo por Zoom', 'Campus Pathway y seguimiento de tu progreso', '2 simulacros TEF / TCF Canada'] },
        intensive: { name: 'Intensivo', tag: 'De A1 a B2: unos 16 meses', includes: ['Ritmo de avance prioritario', 'Clases individuales en vivo por Zoom', 'Campus Pathway y seguimiento de tu progreso', '2 simulacros TEF / TCF Canada'] }
      },
      featured: 'El más elegido',
      for: { essential: 'Para avanzar a tu ritmo, sin presión.', accelerated: 'Si trabajas a tiempo completo.', intensive: 'Para llegar al examen lo antes posible.' },
      path: { essential: 'unos 24 meses', accelerated: 'unos 20 meses', intensive: 'unos 16 meses' },
      hoursUnit: 'h/semana', hoursGroup: name => `Horas por semana, ${name}`,
      monthlySub: 'al mes, pago mes a mes', cycleSub: (m, saving) => `por ${m} meses · ahorras <b>${saving} CAD</b>`,
      choose: name => `Elegir ${name}`,
      facts: { hoursMonth: 'Horas de clase al mes', level: 'Un nivel completo', path: 'De A1 a B2' }, months: m => `${m} meses`,
      perCycle: ' · ciclo completo', perMonth: ' / mes',
      monthlyHours: weeks => `${weeks.join(' o ')} h*/semana · ${weeks.map(w => w * 4).join(' a ')} horas al mes`,
      cycleHours: (m, weeks) => `<strong>Ciclo de ${m} meses</strong> · ${weeks.join(' o ')} h*/semana`,
      saving: amount => `Ahorras ${amount} CAD`,
      equivalent: amount => `Equivale a ${amount} CAD al mes.`,
      reference: w => `Precio de referencia: ${w} h/semana.`,
      monthToMonth: 'Mes a mes, sin contrato mínimo.',
      cycleTeaser: (m, amount, from) => `O un ciclo completo de ${m} meses: ${from ? 'desde ' : ''}${amount} CAD (−15 %).`,
      from: 'desde',
      option: (w, amount, cycle) => `Con ${w} h/semana: ${amount} CAD${cycle ? ' el ciclo' : '/mes'}.`,
      cta: 'Elegir este ritmo',
      statusMonthly: 'Tarifas mensuales en dólares canadienses.',
      statusCycle: 'Tarifas por ciclo completo en dólares canadienses. Descuento directo del 15 %.'
    },
    stories: {
      play: name => `Ver el testimonio de ${name}`,
      videoOf: name => `Testimonio de ${name}`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Cerrar', previous: 'Testimonio anterior', next: 'Testimonio siguiente',
      error: 'No se pudo cargar el video.', openFile: 'Abrir el archivo',
      watch: name => `Ver el video de ${name}`,
      document: 'Ver la captura',
      documentAlt: name => `Captura de los resultados oficiales de ${name}`,
      nclc7: 'NCLC 7 o más en las cuatro competencias',
      missing: 'No figura en la captura', noDate: 'Fecha no visible',
      partial: skills => `Captura parcial: ${skills}.`,
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
        essential: { name: 'Essentiel', tag: 'De A1 à B2 : environ 24 mois', includes: ['Cours particuliers en direct sur Zoom', 'Campus Pathway : exercices, manuel en ligne et enregistrements', 'Suivi de vos progrès', '2 examens blancs TEF / TCF Canada'] },
        accelerated: { name: 'Accéléré', tag: 'De A1 à B2 : environ 20 mois', includes: ['Compatible avec un emploi à temps plein', 'Cours particuliers en direct sur Zoom', 'Campus Pathway et suivi de vos progrès', '2 examens blancs TEF / TCF Canada'] },
        intensive: { name: 'Intensif', tag: 'De A1 à B2 : environ 16 mois', includes: ['Rythme de progression prioritaire', 'Cours particuliers en direct sur Zoom', 'Campus Pathway et suivi de vos progrès', '2 examens blancs TEF / TCF Canada'] }
      },
      featured: 'Le plus choisi',
      for: { essential: 'Pour avancer à votre rythme, sans pression.', accelerated: 'Si vous travaillez à temps plein.', intensive: 'Pour arriver à l’examen au plus vite.' },
      path: { essential: 'environ 24 mois', accelerated: 'environ 20 mois', intensive: 'environ 16 mois' },
      hoursUnit: 'h/semaine', hoursGroup: name => `Heures par semaine, ${name}`,
      monthlySub: 'par mois, sans engagement', cycleSub: (m, saving) => `pour ${m} mois · vous économisez <b>${saving} CAD</b>`,
      choose: name => `Choisir ${name}`,
      facts: { hoursMonth: 'Heures de cours par mois', level: 'Un niveau complet', path: 'De A1 à B2' }, months: m => `${m} mois`,
      perCycle: ' · cycle complet', perMonth: ' / mois',
      monthlyHours: weeks => `${weeks.join(' ou ')} h*/semaine · ${weeks.map(w => w * 4).join(' à ')} heures par mois`,
      cycleHours: (m, weeks) => `<strong>Cycle de ${m} mois</strong> · ${weeks.join(' ou ')} h*/semaine`,
      saving: amount => `Vous économisez ${amount} CAD`,
      equivalent: amount => `Soit ${amount} CAD par mois.`,
      reference: w => `Prix de référence : ${w} h/semaine.`,
      monthToMonth: 'Mois par mois, sans engagement minimum.',
      cycleTeaser: (m, amount, from) => `Ou un cycle complet de ${m} mois : ${from ? 'à partir de ' : ''}${amount} CAD (−15 %).`,
      from: 'à partir de',
      option: (w, amount, cycle) => `Avec ${w} h/semaine : ${amount} CAD${cycle ? ' le cycle' : ' par mois'}.`,
      cta: 'Choisir ce rythme',
      statusMonthly: 'Tarifs mensuels en dollars canadiens.',
      statusCycle: 'Tarifs par cycle complet en dollars canadiens. Remise directe de 15 %.'
    },
    stories: {
      play: name => `Voir le témoignage ${frDe(name)}`,
      videoOf: name => `Témoignage ${frDe(name)}`,
      counter: (i, n) => `${i} / ${n}`,
      close: 'Fermer', previous: 'Témoignage précédent', next: 'Témoignage suivant',
      error: 'La vidéo n’a pas pu être chargée.', openFile: 'Ouvrir le fichier',
      watch: name => `Voir la vidéo ${frDe(name)}`,
      document: 'Voir la capture',
      documentAlt: name => `Capture des résultats officiels ${frDe(name)}`,
      nclc7: 'NCLC 7 ou plus dans les quatre compétences',
      missing: 'Absent de la capture', noDate: 'Date non visible',
      partial: skills => `Capture partielle : ${skills}.`,
      reviewSource: 'Avis résumé et traduit de l’espagnol · Superprof',
      pause: 'Mettre en pause le défilement des avis', resume: 'Reprendre le défilement des avis'
    },
    rounds: {
      official: n => (n ? `Ronde officielle n° ${n}` : 'Ronde officielle'),
      live: 'Rondes officielles d’IRCC pour le français et la catégorie de l’expérience canadienne.',
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
        essential: { name: 'Essential', tag: 'A1 to B2: about 24 months', includes: ['Live one-to-one lessons on Zoom', 'Pathway Campus: exercises, online manual and recordings', 'Progress follow-up', '2 TEF / TCF Canada mock exams'] },
        accelerated: { name: 'Accelerated', tag: 'A1 to B2: about 20 months', includes: ['Fits around a full-time job', 'Live one-to-one lessons on Zoom', 'Pathway Campus and progress follow-up', '2 TEF / TCF Canada mock exams'] },
        intensive: { name: 'Intensive', tag: 'A1 to B2: about 16 months', includes: ['Priority pace of progress', 'Live one-to-one lessons on Zoom', 'Pathway Campus and progress follow-up', '2 TEF / TCF Canada mock exams'] }
      },
      featured: 'Most chosen',
      for: { essential: 'To progress at your own pace, without pressure.', accelerated: 'If you work full time.', intensive: 'To reach your exam as soon as possible.' },
      path: { essential: 'about 24 months', accelerated: 'about 20 months', intensive: 'about 16 months' },
      hoursUnit: 'h/week', hoursGroup: name => `Hours per week, ${name}`,
      monthlySub: 'per month, billed monthly', cycleSub: (m, saving) => `for ${m} months · you save <b>${saving} CAD</b>`,
      choose: name => `Choose ${name}`,
      facts: { hoursMonth: 'Class hours per month', level: 'One full level', path: 'From A1 to B2' }, months: m => `${m} months`,
      perCycle: ' · full cycle', perMonth: ' / month',
      monthlyHours: weeks => `${weeks.join(' or ')} h*/week · ${weeks.map(w => w * 4).join(' to ')} hours a month`,
      cycleHours: (m, weeks) => `<strong>${m}-month cycle</strong> · ${weeks.join(' or ')} h*/week`,
      saving: amount => `You save ${amount} CAD`,
      equivalent: amount => `That is ${amount} CAD a month.`,
      reference: w => `Reference price: ${w} h/week.`,
      monthToMonth: 'Month to month, no minimum term.',
      cycleTeaser: (m, amount, from) => `Or a full ${m}-month cycle: ${from ? 'from ' : ''}${amount} CAD (−15%).`,
      from: 'from',
      option: (w, amount, cycle) => `With ${w} h/week: ${amount} CAD${cycle ? ' per cycle' : ' a month'}.`,
      cta: 'Choose this pace',
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
      nclc7: 'NCLC 7 or higher in all four skills',
      missing: 'Not shown in the screenshot', noDate: 'Date not shown',
      partial: skills => `Partial screenshot: ${skills}.`,
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
        essential: { name: 'Basis', tag: 'Von A1 bis B2: etwa 24 Monate', includes: ['Live-Einzelunterricht über Zoom', 'Pathway Campus: Übungen, Online-Lehrbuch und Aufzeichnungen', 'Begleitung Ihres Fortschritts', '2 Probeprüfungen TEF / TCF Canada'] },
        accelerated: { name: 'Beschleunigt', tag: 'Von A1 bis B2: etwa 20 Monate', includes: ['Mit einem Vollzeitjob vereinbar', 'Live-Einzelunterricht über Zoom', 'Pathway Campus und Begleitung Ihres Fortschritts', '2 Probeprüfungen TEF / TCF Canada'] },
        intensive: { name: 'Intensiv', tag: 'Von A1 bis B2: etwa 16 Monate', includes: ['Vorrangiges Lerntempo', 'Live-Einzelunterricht über Zoom', 'Pathway Campus und Begleitung Ihres Fortschritts', '2 Probeprüfungen TEF / TCF Canada'] }
      },
      featured: 'Am häufigsten gewählt',
      for: { essential: 'Um in Ihrem Tempo voranzukommen, ohne Druck.', accelerated: 'Wenn Sie Vollzeit arbeiten.', intensive: 'Für den schnellsten Weg zur Prüfung.' },
      path: { essential: 'etwa 24 Monate', accelerated: 'etwa 20 Monate', intensive: 'etwa 16 Monate' },
      hoursUnit: 'Std./Woche', hoursGroup: name => `Stunden pro Woche, ${name}`,
      monthlySub: 'pro Monat, monatlich zahlbar', cycleSub: (m, saving) => `für ${m} Monate · Sie sparen <b>${saving} CAD</b>`,
      choose: name => `${name} wählen`,
      facts: { hoursMonth: 'Unterrichtsstunden pro Monat', level: 'Ein ganzes Niveau', path: 'Von A1 bis B2' }, months: m => `${m} Monate`,
      perCycle: ' · ganzer Zyklus', perMonth: ' / Monat',
      monthlyHours: weeks => `${weeks.join(' oder ')} Std.*/Woche · ${weeks.map(w => w * 4).join(' bis ')} Stunden im Monat`,
      cycleHours: (m, weeks) => `<strong>Zyklus von ${m} Monaten</strong> · ${weeks.join(' oder ')} Std.*/Woche`,
      saving: amount => `Sie sparen ${amount} CAD`,
      equivalent: amount => `Das entspricht ${amount} CAD im Monat.`,
      reference: w => `Referenzpreis: ${w} Std./Woche.`,
      monthToMonth: 'Monatlich, ohne Mindestlaufzeit.',
      cycleTeaser: (m, amount, from) => `Oder ein ganzer Zyklus von ${m} Monaten: ${from ? 'ab ' : ''}${amount} CAD (−15 %).`,
      from: 'ab',
      option: (w, amount, cycle) => `Mit ${w} Std./Woche: ${amount} CAD${cycle ? ' pro Zyklus' : ' im Monat'}.`,
      cta: 'Dieses Tempo wählen',
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
      nclc7: 'NCLC 7 oder mehr in allen vier Kompetenzen',
      missing: 'Nicht im Screenshot', noDate: 'Datum nicht sichtbar',
      partial: skills => `Teilweiser Screenshot: ${skills}.`,
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

// The public Superprof recommendations shown on the home (fifteen), condensed
// in Spanish and translated from that version. Same order as
// WRITTEN_TESTIMONIALS.
export const REVIEW_QUOTES = {
  fr: [
    'Avec Pathway, des explications claires et des cours dynamiques rendent le français facile à comprendre.',
    'Des dialogues en français, des devoirs entre les cours et un soutien constant pour améliorer la prononciation.',
    'De la patience, une excellente méthode et un véritable engagement envers les progrès de chaque élève.',
    'Je partais de zéro : Pathway m’a accompagné, m’a fait participer et s’est assuré que je progresse.',
    'En quelques cours, j’ai commencé à communiquer dans des situations du quotidien et à écouter du français authentique.',
    'J’ai beaucoup appris et je reste motivée grâce à des cours ludiques qui travaillent toutes les compétences.',
    'Chez Pathway, l’appui en espagnol éclaire les erreurs fréquentes des hispanophones et enrichit chaque cours.',
    'Des explications très claires et une vraie disponibilité pour aider les élèves.',
    'Beaucoup de patience pour la prononciation, et des cours participatifs, dynamiques et sans précipitation.',
    'De la patience, une prononciation juste et des explications sur les nuances propres au français.',
    'Une attention à chaque question, à l’écrit comme à l’oral, avec de la patience et une énergie qui rend les cours agréables.',
    'Des cours de conversation aux sujets excellents : l’une de mes meilleures expériences d’apprentissage du français.',
    'L’approche la plus pratique, intéressante et charismatique que j’aie trouvée en deux ans d’apprentissage du français.',
    'Le meilleur cours de français que j’aie suivi : toujours avec l’envie d’enseigner.',
    'Grâce à la patience dans les cours, j’ai pu progresser jusqu’au niveau A2.'
  ],
  en: [
    'With Pathway, clear explanations and lively lessons make French easy to understand.',
    'Dialogues in French, homework between lessons and constant support to improve pronunciation.',
    'Patience, an excellent method and a real commitment to every student’s progress.',
    'Starting from zero, Pathway supported me, got me taking part and made sure I kept moving forward.',
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
    'Ich habe bei null angefangen: Pathway hat mich begleitet, zum Mitmachen gebracht und darauf geachtet, dass ich vorankomme.',
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
