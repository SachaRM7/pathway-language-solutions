// Second half of the V4 home (stories → footer: stories, pricing, FAQ, closing), one template for the four
// languages so every version has exactly the same sections, classes and
// behaviour. Each language source (v4/index.html, v4/<lang>/index.html) holds
// the marker <!-- home-tail --> where build.mjs inserts this markup.
//
// Translated by hand, never by a machine: Pathway, NCLC, TEF, TCF, CRS, IRCC,
// Express Entry, Canadian Experience Class, Superprof and people's names stay
// as they are.

import { VIDEO_TESTIMONIALS, WRITTEN_TESTIMONIALS, EXAM_RESULTS, TCF_CANADA_NCLC7, LINKS } from '../v4/content.js';
import { REVIEW_QUOTES, pages, t as runtime } from '../v4/i18n.js';
import { renderPricing, escapeHtml as esc } from '../v4/render.js';

export const HOME_TAIL_MARKER = '<!-- home-tail -->';

const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
const out = '<span aria-hidden="true">↗</span>';
const WHATSAPP = 'https://wa.me/51989887516';
const NBSP = ' ';
const NNBSP = ' ';

// French typography in text (never inside tags): narrow no-break space before
// ; ! ? and inside « », no-break space before : and %.
export const frenchTypography = html => html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => tag || text
  .replace(/[   ]+([;!?»])/g, `${NNBSP}$1`)
  .replace(/«[   ]+/g, `«${NNBSP}`)
  .replace(/[   ]+([:%])/g, `${NBSP}$1`));

const T = {
  es: {
    stories: {
      tag: 'Historias reales', title: 'Lo cuentan quienes<br> ya aprendieron con Pathway.', lead: 'Distintas realidades, un mismo acompañamiento.',
      reel: 'Testimonios en video', reelNote: 'Grabados por nuestros alumnos, en español.', previous: 'Testimonios anteriores', next: 'Testimonios siguientes',
      resultsTitle: 'Resultados oficiales, no promesas.',
      resultsText: 'Capturas del portal del TCF, compartidas por nuestros alumnos.',
      resultsNote: 'El examen oficial se realiza con el organismo examinador, no con Pathway.',
      and: ' y ', session: 'Sesión del', levelScale: 'Nivel CECRL',
      skills: { co: 'Comprensión oral', ce: 'Comprensión escrita', eo: 'Expresión oral', ee: 'Expresión escrita' },
      reviewsTitle: 'Lo que escriben en Superprof', reviewsText: n => `${n} recomendaciones públicas, resumidas.`, reviewsLink: 'Ver las recomendaciones en Superprof'
    },
    pricing: {
      tag: 'Precios', title: 'Un precio por hora.<br> Igual en todos los niveles.',
      lead: 'Eliges cuántas horas de clase quieres por semana. Pagas mes a mes, sin contrato mínimo, o un ciclo completo con descuento.',
      switchLabel: 'Forma de pago', monthly: 'Mes a mes', cycle: 'Ciclo completo <span>−15 %</span>',
      hintMonthly: 'Sin contrato mínimo: continúas mes a mes.',
      hintCycle: 'Un ciclo = un nivel completo (A1, A2, B1 o B2), pagado de una vez.',
      included: { title: 'Incluido en todos los ritmos', text: '¿No sabes cuántas horas necesitas? La evaluación inicial es gratis y te recomienda el ritmo según tu nivel y tu fecha de examen.', cta: 'Evaluar mi nivel',
        items: ['Clases individuales en vivo por Zoom', 'Un profesor que sigue todo tu recorrido', 'Campus Pathway: ejercicios, manual y grabaciones', 'Seguimiento de tu progreso', '2 simulacros TEF / TCF Canada', 'Recuperas la clase si avisas 48 h antes'] },
      foot: 'Precios en CAD · 92,50 CAD al mes por hora semanal · Cuota de inscripción única de 15 CAD', conditions: 'Condiciones de inscripción'
    },
    rounds: {
      tag: 'Rondas IRCC',
      title: 'Los cortes cambian<br> de una ronda a otra.',
      lead: 'El puntaje CRS mínimo de las últimas invitaciones de IRCC, en la categoría de francés y en Canadian Experience Class.',
      french: 'Competencia lingüística en francés',
      cec: 'Canadian Experience Class',
      date: 'Fecha de la ronda',
      score: 'CRS mínimo',
      loading: 'Consultando…',
      official: 'Rondas oficiales',
      status: 'Consultando las publicaciones oficiales de IRCC…',
      note: 'Datos históricos, no una previsión para tu perfil.',
      source: 'Fuente oficial: IRCC',
      crs: 'Calcula tu puntaje CRS',
      noscript: 'Las cifras en vivo requieren JavaScript. Consulta las rondas en la fuente oficial.'
    },
    faq: {
      tag: 'Preguntas frecuentes', title: 'Lo que necesitas saber<br> antes de empezar.', lead: 'Respuestas cortas a las dudas más comunes.',
      items: [
        ['¿Qué ritmo me conviene?', '<p>Depende de tu nivel, tu disponibilidad y tu fecha de examen. La evaluación inicial te recomienda un ritmo.</p>'],
        ['¿Las clases son realmente individuales?', '<p>Sí. Cada clase es individual, en vivo por Zoom, con un profesor que conoce tu recorrido.</p><p>Entre clases, el Campus te da ejercicios, tu manual en línea, simulacros y las grabaciones de tus clases.</p>'],
        ['¿Cómo funciona la evaluación inicial?', '<p>Un test en línea mide tu comprensión oral y escrita, tu gramática y tu vocabulario. Toma entre 12 y 30 minutos.</p><p>La expresión oral se confirma con tu profesor en la primera clase.</p><a class="source-link" href="{test}">Hacer la evaluación inicial →</a>'],
        ['¿Preparan para el TEF Canada y el TCF Canada?', '<p>Sí. Trabajamos las cuatro competencias del examen e incluimos dos simulacros completos.</p><p>El examen oficial se realiza con el organismo examinador, no con Pathway.</p>'],
        ['¿Por qué apuntar al NCLC 7?', '<p>Para la categoría de francés de Express Entry necesitas NCLC 7 o más en las cuatro competencias.</p><p>Alcanzarlo no garantiza una invitación: tu perfil y tu puntaje CRS también cuentan.</p><a class="source-link" href="{nclc}">Entender el objetivo NCLC 7 →</a>'],
        ['¿Cómo calculo mi puntaje CRS?', '<p>Nuestra calculadora aplica la tabla oficial de IRCC y compara tu puntaje con las últimas rondas publicadas.</p><p>Es una estimación, no una decisión de inmigración.</p><a class="source-link" href="{crs}">Calcular mi puntaje CRS →</a>'],
        ['¿Cómo me inscribo?', '<p>Evalúa tu nivel y solicita un horario con el ritmo que prefieres. Confirmamos horario y precio antes de cualquier pago.</p><a class="source-link" href="{inscription}">Solicitar un horario →</a>']
      ]
    },
    final: {
      tag: 'Tu primer paso · Sin compromiso', title: 'Tu objetivo merece<br> <span>una ruta clara.</span>',
      text: 'Un test de 12 a 30 minutos y te proponemos un ritmo que sí cabe en tu vida.', cta: 'Evaluar mi nivel', whatsapp: 'Prefiero hablar por WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, inicio', motto: 'Un acompañamiento real<br> para llegar más lejos en francés.',
      nav: 'Navegación del pie', navTitle: 'Navegación', links: [['#recorrido', 'Cómo funciona'], ['#tu-semana', 'Tu semana'], ['#profesores', 'Profesores'], ['#historias', 'Testimonios'], ['#planes', 'Precios'], ['#preguntas', 'Preguntas frecuentes']],
      contact: 'Contacto', rights: 'Todos los derechos reservados.', legalNav: 'Información legal',
      legal: [['legal', 'Aviso legal'], ['privacy', 'Política de privacidad'], ['conditions', 'Condiciones generales'], ['cookies', 'Cookies']]
    }
  },

  fr: {
    stories: {
      tag: 'Histoires vraies', title: 'Ils ont appris avec Pathway.<br> Ils le racontent.', lead: 'Des réalités différentes, un même accompagnement.',
      reel: 'Témoignages vidéo', reelNote: 'Enregistrés par nos élèves, en espagnol.', previous: 'Témoignages précédents', next: 'Témoignages suivants',
      resultsTitle: 'Des résultats réels,<br> pas des promesses.',
      resultsText: 'Captures du portail officiel du TCF, partagées par nos élèves à la réception de leurs résultats.',
      resultsNote: 'L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.',
      and: ' et ', session: 'Session du', levelScale: 'Niveau CECRL',
      skills: { co: 'Compréhension orale', ce: 'Compréhension écrite', eo: 'Expression orale', ee: 'Expression écrite' },
      reviewsTitle: 'Ce qu’ils écrivent sur Superprof', reviewsText: n => `${n} recommandations publiques, résumées et traduites de l’espagnol.`, reviewsLink: 'Voir les recommandations sur Superprof'
    },
    pricing: {
      tag: 'Tarifs', title: 'Un prix par heure.<br> Le même à tous les niveaux.',
      lead: 'Vous choisissez combien d’heures de cours par semaine. Vous payez au mois, sans engagement, ou un cycle complet avec remise.',
      switchLabel: 'Formule de paiement', monthly: 'Au mois', cycle: 'Cycle complet <span>−15 %</span>',
      hintMonthly: 'Sans engagement : vous continuez mois par mois.',
      hintCycle: 'Un cycle = un niveau complet (A1, A2, B1 ou B2), payé en une fois.',
      included: { title: 'Inclus dans tous les rythmes', text: 'Vous ne savez pas combien d’heures il vous faut ? L’évaluation initiale est gratuite et vous recommande un rythme selon votre niveau et votre date d’examen.', cta: 'Évaluer mon niveau',
        items: ['Cours particuliers en direct sur Zoom', 'Un professeur qui suit tout votre parcours', 'Campus Pathway : exercices, manuel et enregistrements', 'Suivi de vos progrès', '2 examens blancs TEF / TCF Canada', 'Cours rattrapé si vous prévenez 48 h avant'] },
      foot: 'Prix en CAD · 92,50 CAD par mois et par heure hebdomadaire · Frais d’inscription uniques de 15 CAD', conditions: 'Conditions d’inscription'
    },
    rounds: {
      tag: 'Rondes IRCC',
      title: 'Les seuils changent<br> d’une ronde à l’autre.',
      lead: 'Le score CRS minimum des dernières invitations d’IRCC, dans la catégorie francophone et dans la catégorie de l’expérience canadienne.',
      french: 'Compétence linguistique en français',
      cec: 'Catégorie de l’expérience canadienne',
      date: 'Date de la ronde',
      score: 'CRS minimum',
      loading: 'Consultation…',
      official: 'Rondes officielles',
      status: 'Consultation des publications officielles d’IRCC…',
      note: 'Données historiques, pas une prévision pour votre profil.',
      source: 'Source officielle : IRCC',
      crs: 'Calculer mon score CRS',
      noscript: 'Les chiffres en direct nécessitent JavaScript. Consultez les rondes sur la source officielle.'
    },
    faq: {
      tag: 'Questions fréquentes', title: 'Ce qu’il faut savoir<br> avant de commencer.', lead: 'Des réponses courtes aux questions les plus fréquentes.',
      items: [
        ['Quel rythme me convient ?', '<p>Cela dépend de votre niveau, de vos disponibilités et de votre date d’examen. L’évaluation initiale vous recommande un rythme.</p>'],
        ['Les cours sont-ils vraiment particuliers ?', '<p>Oui. Chaque cours est individuel, en direct sur Zoom, avec un professeur qui connaît votre parcours.</p><p>Entre les cours, le Campus vous donne des exercices, votre manuel en ligne, des examens blancs et les enregistrements de vos cours.</p>'],
        ['Comment fonctionne l’évaluation initiale ?', '<p>Un test en ligne mesure votre compréhension orale et écrite, votre grammaire et votre vocabulaire. Il dure de 12 à 30 minutes.</p><p>L’expression orale est confirmée avec votre professeur au premier cours.</p><a class="source-link" href="{test}">Faire l’évaluation initiale →</a>'],
        ['Préparez-vous au TEF Canada et au TCF Canada ?', '<p>Oui. Nous travaillons les quatre compétences de l’examen et incluons deux examens blancs complets.</p><p>L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.</p>'],
        ['Pourquoi viser le NCLC 7 ?', '<p>Pour la catégorie francophone d’Entrée express, il faut un NCLC 7 ou plus dans les quatre compétences.</p><p>L’atteindre ne garantit pas une invitation : votre profil et votre score CRS comptent aussi.</p><a class="source-link" href="{nclc}">Comprendre l’objectif NCLC 7 →</a>'],
        ['Comment calculer mon score CRS ?', '<p>Notre calculateur applique la grille officielle d’IRCC et compare votre score aux dernières rondes publiées.</p><p>C’est une estimation, pas une décision d’immigration.</p><a class="source-link" href="{crs}">Calculer mon score CRS →</a>'],
        ['Comment m’inscrire ?', '<p>Évaluez votre niveau, puis demandez un horaire avec le rythme de votre choix. Nous confirmons l’horaire et le prix avant tout paiement.</p><a class="source-link" href="{inscription}">Demander un horaire →</a>']
      ]
    },
    final: {
      tag: 'Votre première étape · Sans engagement', title: 'Votre objectif<br> mérite<br> <span>un parcours<br> clair.</span>',
      text: 'Un test de 12 à 30 minutes situe votre point de départ ; nous définissons ensuite avec vous votre échéance et le rythme qui s’intègre vraiment à votre vie.', cta: 'Évaluer mon niveau', whatsapp: 'Je préfère écrire sur WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, accueil', motto: 'Un vrai accompagnement<br> pour aller plus loin en français.',
      nav: 'Navigation du pied de page', navTitle: 'Navigation', links: [['#recorrido', 'Comment ça marche'], ['#tu-semana', 'Votre semaine'], ['#profesores', 'Professeurs'], ['#historias', 'Témoignages'], ['#planes', 'Tarifs'], ['#preguntas', 'Questions fréquentes']],
      contact: 'Contact', rights: 'Tous droits réservés.', legalNav: 'Informations légales',
      legal: [['legal', 'Mentions légales'], ['privacy', 'Politique de confidentialité'], ['conditions', 'Conditions générales'], ['cookies', 'Cookies']]
    }
  },

  en: {
    stories: {
      tag: 'Real stories', title: 'Told by the people<br> who learned with Pathway.', lead: 'Different lives, the same support.',
      reel: 'Video testimonials', reelNote: 'Recorded by our students, in Spanish.', previous: 'Previous testimonials', next: 'Next testimonials',
      resultsTitle: 'Real results,<br> not promises.',
      resultsText: 'Screenshots from the official TCF portal, shared by our students when they received their results.',
      resultsNote: 'The official exam is taken with the exam provider, not with Pathway.',
      and: ' and ', session: 'Session of', levelScale: 'CEFR level',
      skills: { co: 'Listening', ce: 'Reading', eo: 'Speaking', ee: 'Writing' },
      reviewsTitle: 'What they write on Superprof', reviewsText: n => `${n} public recommendations, summarized and translated from Spanish.`, reviewsLink: 'See the recommendations on Superprof'
    },
    pricing: {
      tag: 'Pricing', title: 'One price per hour.<br> The same at every level.',
      lead: 'You choose how many hours of class you want each week. Pay month by month with no minimum term, or a full cycle at a discount.',
      switchLabel: 'Payment option', monthly: 'Monthly', cycle: 'Full cycle <span>−15%</span>',
      hintMonthly: 'No minimum term: you continue month by month.',
      hintCycle: 'One cycle = one full level (A1, A2, B1 or B2), paid at once.',
      included: { title: 'Included in every pace', text: 'Not sure how many hours you need? The initial assessment is free and recommends a pace based on your level and your exam date.', cta: 'Assess my level',
        items: ['Live one-to-one lessons on Zoom', 'One teacher who follows your whole path', 'Pathway Campus: exercises, textbook and recordings', 'Progress tracking', '2 TEF / TCF Canada mock exams', 'Lesson made up if you tell us 48 h ahead'] },
      foot: 'Prices in CAD · 92.50 CAD a month per weekly hour · One-time enrolment fee of 15 CAD', conditions: 'Enrolment terms'
    },
    rounds: {
      tag: 'IRCC rounds',
      title: 'Cut-offs change<br> from round to round.',
      lead: 'The minimum CRS score of IRCC’s latest invitations, in the French category and in the Canadian Experience Class.',
      french: 'French-language proficiency',
      cec: 'Canadian Experience Class',
      date: 'Round date',
      score: 'Minimum CRS',
      loading: 'Checking…',
      official: 'Official rounds',
      status: 'Checking IRCC’s official publications…',
      note: 'Historical figures, not a forecast for your profile.',
      source: 'Official source: IRCC',
      crs: 'Calculate my CRS score',
      noscript: 'Live figures need JavaScript. See the rounds at the official source.'
    },
    faq: {
      tag: 'FAQ', title: 'What to know<br> before you start.', lead: 'Short answers to the most common questions.',
      items: [
        ['Which pace is right for me?', '<p>It depends on your level, your availability and your exam date. The initial assessment recommends a pace.</p>'],
        ['Are the lessons really one-to-one?', '<p>Yes. Every lesson is one-to-one and live on Zoom, with a teacher who knows your path.</p><p>Between lessons, the Campus gives you exercises, your online textbook, mock exams and the recordings of your lessons.</p>'],
        ['How does the initial assessment work?', '<p>An online test measures your listening, reading, grammar and vocabulary. It takes 12 to 30 minutes.</p><p>Speaking is confirmed with your teacher in the first lesson.</p><a class="source-link" href="{test}">Take the initial assessment →</a>'],
        ['Do you prepare for the TEF Canada and TCF Canada?', '<p>Yes. We work on all four exam skills and include two full mock exams.</p><p>The official exam is taken with the exam provider, not with Pathway.</p>'],
        ['Why aim for NCLC 7?', '<p>For the Express Entry French-language category, you need NCLC 7 or higher in all four skills.</p><p>Reaching it doesn’t guarantee an invitation: your profile and your CRS score also count.</p><a class="source-link" href="{nclc}">Understand the NCLC 7 goal →</a>'],
        ['How do I work out my CRS score?', '<p>Our calculator applies IRCC’s official grid and compares your score with the latest published rounds.</p><p>It is an estimate, not an immigration decision.</p><a class="source-link" href="{crs}">Calculate my CRS score →</a>'],
        ['How do I enrol?', '<p>Assess your level, then request a schedule with the pace you prefer. We confirm the schedule and the price before any payment.</p><a class="source-link" href="{inscription}">Request a schedule →</a>']
      ]
    },
    final: {
      tag: 'Your first step · No commitment', title: 'Your goal<br> deserves<br> <span>a clear<br> path.</span>',
      text: 'A 12- to 30-minute test pins down your starting point; then we set your deadline with you and the pace that truly fits your life.', cta: 'Assess my level', whatsapp: 'I’d rather talk on WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, home', motto: 'Real support<br> to go further in French.',
      nav: 'Footer navigation', navTitle: 'Navigation', links: [['#recorrido', 'How it works'], ['#tu-semana', 'Your week'], ['#profesores', 'Teachers'], ['#historias', 'Testimonials'], ['#planes', 'Prices'], ['#preguntas', 'FAQ']],
      contact: 'Contact', rights: 'All rights reserved.', legalNav: 'Legal information',
      legal: [['legal', 'Legal notice'], ['privacy', 'Privacy policy'], ['conditions', 'Terms and conditions'], ['cookies', 'Cookies']]
    }
  },

  de: {
    stories: {
      tag: 'Echte Geschichten', title: 'Erzählt von denen,<br> die mit Pathway gelernt haben.', lead: 'Unterschiedliche Lebenswege, dieselbe Begleitung.',
      reel: 'Video-Erfahrungsberichte', reelNote: 'Von unseren Lernenden aufgenommen, auf Spanisch.', previous: 'Vorherige Berichte', next: 'Nächste Berichte',
      resultsTitle: 'Echte Ergebnisse,<br> keine Versprechen.',
      resultsText: 'Screenshots aus dem offiziellen TCF-Portal, geteilt von unseren Lernenden, als sie ihre Ergebnisse erhielten.',
      resultsNote: 'Die offizielle Prüfung wird bei der Prüfungsstelle abgelegt, nicht bei Pathway.',
      and: ' und ', session: 'Prüfung vom', levelScale: 'GER-Niveau',
      skills: { co: 'Hörverstehen', ce: 'Leseverstehen', eo: 'Mündlicher Ausdruck', ee: 'Schriftlicher Ausdruck' },
      reviewsTitle: 'Was sie auf Superprof schreiben', reviewsText: n => `${n} öffentliche Empfehlungen, zusammengefasst und aus dem Spanischen übersetzt.`, reviewsLink: 'Empfehlungen auf Superprof ansehen'
    },
    pricing: {
      tag: 'Preise', title: 'Ein Preis pro Stunde.<br> Gleich auf jedem Niveau.',
      lead: 'Sie wählen, wie viele Unterrichtsstunden pro Woche Sie möchten. Sie zahlen monatlich ohne Mindestlaufzeit oder einen ganzen Zyklus mit Rabatt.',
      switchLabel: 'Zahlungsart', monthly: 'Monatlich', cycle: 'Ganzer Zyklus <span>−15 %</span>',
      hintMonthly: 'Ohne Mindestlaufzeit: Sie verlängern Monat für Monat.',
      hintCycle: 'Ein Zyklus = ein ganzes Niveau (A1, A2, B1 oder B2), auf einmal bezahlt.',
      included: { title: 'In jedem Tempo enthalten', text: 'Sie wissen nicht, wie viele Stunden Sie brauchen? Die Ersteinstufung ist kostenlos und empfiehlt ein Tempo nach Ihrem Niveau und Ihrem Prüfungstermin.', cta: 'Mein Niveau bestimmen',
        items: ['Live-Einzelunterricht über Zoom', 'Eine Lehrkraft, die Ihren ganzen Weg begleitet', 'Pathway Campus: Übungen, Lehrbuch und Aufzeichnungen', 'Verfolgung Ihrer Fortschritte', '2 Probeprüfungen TEF / TCF Canada', 'Stunde wird nachgeholt, wenn Sie 48 Std. vorher absagen'] },
      foot: 'Preise in CAD · 92,50 CAD pro Monat und Wochenstunde · Einmalige Anmeldegebühr von 15 CAD', conditions: 'Anmeldebedingungen'
    },
    rounds: {
      tag: 'IRCC-Runden',
      title: 'Die Grenzwerte ändern sich<br> von Runde zu Runde.',
      lead: 'Der Mindest-CRS-Wert der letzten Einladungen von IRCC, in der französischen Kategorie und in der Canadian Experience Class.',
      french: 'Französische Sprachkompetenz',
      cec: 'Canadian Experience Class',
      date: 'Datum der Runde',
      score: 'Mindest-CRS',
      loading: 'Wird abgerufen…',
      official: 'Offizielle Runden',
      status: 'Offizielle Veröffentlichungen von IRCC werden abgerufen…',
      note: 'Historische Daten, keine Prognose für Ihr Profil.',
      source: 'Offizielle Quelle: IRCC',
      crs: 'Meinen CRS-Punktwert berechnen',
      noscript: 'Die Live-Zahlen benötigen JavaScript. Sehen Sie die Runden in der offiziellen Quelle.'
    },
    faq: {
      tag: 'Häufige Fragen', title: 'Was Sie vor dem<br> Start wissen sollten.', lead: 'Kurze Antworten auf die häufigsten Fragen.',
      items: [
        ['Welches Tempo passt zu mir?', '<p>Das hängt von Ihrem Niveau, Ihrer Verfügbarkeit und Ihrem Prüfungstermin ab. Die Ersteinstufung empfiehlt Ihnen ein Tempo.</p>'],
        ['Ist der Unterricht wirklich Einzelunterricht?', '<p>Ja. Jede Stunde ist Einzelunterricht, live über Zoom, mit einer Lehrkraft, die Ihren Weg kennt.</p><p>Zwischen den Stunden bietet Ihnen der Campus Übungen, Ihr Online-Lehrbuch, Probeprüfungen und die Aufzeichnungen Ihrer Stunden.</p>'],
        ['Wie funktioniert die Ersteinstufung?', '<p>Ein Online-Test misst Ihr Hör- und Leseverstehen, Ihre Grammatik und Ihren Wortschatz. Er dauert 12 bis 30 Minuten.</p><p>Der mündliche Ausdruck wird in der ersten Stunde mit Ihrer Lehrkraft bestätigt.</p><a class="source-link" href="{test}">Ersteinstufung machen →</a>'],
        ['Bereiten Sie auf den TEF Canada und den TCF Canada vor?', '<p>Ja. Wir trainieren alle vier Prüfungskompetenzen und bieten zwei vollständige Probeprüfungen.</p><p>Die offizielle Prüfung wird bei der Prüfungsstelle abgelegt, nicht bei Pathway.</p>'],
        ['Warum NCLC 7 anstreben?', '<p>Für die französische Kategorie von Express Entry brauchen Sie NCLC 7 oder mehr in allen vier Kompetenzen.</p><p>Das garantiert keine Einladung: Ihr Profil und Ihr CRS-Punktwert zählen ebenfalls.</p><a class="source-link" href="{nclc}">Das Ziel NCLC 7 verstehen →</a>'],
        ['Wie berechne ich meinen CRS-Punktwert?', '<p>Unser Rechner wendet die offizielle Tabelle von IRCC an und vergleicht Ihren Punktwert mit den letzten veröffentlichten Runden.</p><p>Das ist eine Schätzung, keine Einwanderungsentscheidung.</p><a class="source-link" href="{crs}">Meinen CRS-Punktwert berechnen →</a>'],
        ['Wie melde ich mich an?', '<p>Bestimmen Sie Ihr Niveau und fragen Sie einen Stundenplan mit Ihrem Wunschtempo an. Wir bestätigen Stundenplan und Preis vor jeder Zahlung.</p><a class="source-link" href="{inscription}">Stundenplan anfragen →</a>']
      ]
    },
    final: {
      tag: 'Ihr erster Schritt · Unverbindlich', title: 'Ihr Ziel<br> verdient<br> <span>einen klaren<br> Weg.</span>',
      text: 'Ein Test von 12 bis 30 Minuten bestimmt Ihren Ausgangspunkt; danach legen wir mit Ihnen Ihren Termin und das Tempo fest, das wirklich in Ihr Leben passt.', cta: 'Mein Niveau bestimmen', whatsapp: 'Lieber per WhatsApp schreiben'
    },
    footer: {
      home: 'Pathway Language Solutions, Startseite', motto: 'Echte Begleitung,<br> um im Französischen weiterzukommen.',
      nav: 'Fußzeilennavigation', navTitle: 'Navigation', links: [['#recorrido', 'So funktioniert es'], ['#tu-semana', 'Ihre Woche'], ['#profesores', 'Lehrkräfte'], ['#historias', 'Erfahrungsberichte'], ['#planes', 'Preise'], ['#preguntas', 'Häufige Fragen']],
      contact: 'Kontakt', rights: 'Alle Rechte vorbehalten.', legalNav: 'Rechtliches',
      legal: [['legal', 'Rechtliche Hinweise'], ['privacy', 'Datenschutzerklärung'], ['conditions', 'Allgemeine Bedingungen'], ['cookies', 'Cookies']]
    }
  }
};

// Legal page addresses per language (names from scripts/v4-pages-content.mjs).
const LEGAL = {
  es: { legal: '/v4/aviso-legal.html', privacy: '/v4/privacidad.html', conditions: '/v4/condiciones.html', cookies: '/v4/cookies.html' },
  fr: { legal: '/v4/fr/mentions-legales.html', privacy: '/v4/fr/politique-confidentialite.html', conditions: '/v4/fr/conditions-nclc7.html', cookies: '/v4/fr/cookies.html' },
  en: { legal: '/v4/en/legal-notice.html', privacy: '/v4/en/privacy-policy.html', conditions: '/v4/en/terms.html', cookies: '/v4/en/cookies.html' },
  de: { legal: '/v4/de/rechtliche-hinweise.html', privacy: '/v4/de/datenschutz.html', conditions: '/v4/de/bedingungen.html', cookies: '/v4/de/cookies.html' }
};

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
// Abbreviations keep their full stop (FR « 3 sept. 2026 », DE « 3. Sept. 2026 »).
const formatDate = (iso, locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
// Opening and closing quotation marks of the reviews in each language.
const QUOTES = { es: ['“', '”'], fr: [`«${NNBSP}`, `${NNBSP}»`], en: ['“', '”'], de: ['„', '“'] };
const SKILL_ORDER = ['co', 'ce', 'eo', 'ee'];
const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

function storyCard(video, index, s, lang) {
  const r = runtime(lang).stories;
  const result = EXAM_RESULTS.find(item => item.video === video.name);
  return `<li class="reel-item"><button class="reel-card" type="button" data-story-open="${index}" aria-label="${esc(r.play(video.name))}">
              <img src="${esc(video.poster)}" alt="" loading="lazy" decoding="async" width="270" height="480">
              <span class="reel-play" aria-hidden="true"><svg class="icon"><use href="#i-play"/></svg></span>
              ${result ? `<span class="reel-badge">${esc(result.exam)}</span>` : ''}
              <span class="reel-meta"><strong>${esc(video.name)}</strong><small>${esc(video.duration)}</small></span>
            </button></li>`;
}

// Claimed only for the TCF Canada with its four tests (IRCC equivalence table).
const reachesNclc7 = result => result.exam === 'TCF Canada' && result.skills.length === 4
  && result.skills.every(skill => skill.score >= TCF_CANADA_NCLC7[skill.skill]);

function resultCard(result, s, lang) {
  const r = runtime(lang).stories;
  const locale = runtime(lang).locale;
  const videoIndex = result.video ? VIDEO_TESTIMONIALS.findIndex(video => video.name === result.video) : -1;
  // The tests the screenshot shows, always in the same order; a partial
  // screenshot says which tests it shows instead of empty rows.
  const present = SKILL_ORDER.map(key => result.skills.find(item => item.skill === key)).filter(Boolean);
  const rows = present.map(skill => `<li><span class="rs-skill">${esc(s.skills[skill.skill])}</span><span class="rs-score">${skill.score}<small>/${skill.max}</small></span><b class="rs-level level-${skill.level.toLowerCase()}">${esc(skill.level)}</b></li>`).join('');
  const lower = text => (lang === 'de' ? text : text.charAt(0).toLowerCase() + text.slice(1));
  const partial = present.length < SKILL_ORDER.length
    ? `<p class="rs-partial">${esc(r.partial(present.map(skill => lower(s.skills[skill.skill])).join(s.and)))}</p>` : '';
  const meta = result.session ? formatDate(result.session, locale) : r.noDate;
  const links = [
    videoIndex >= 0 ? `<button class="text-link" type="button" data-story-open="${videoIndex}"><svg class="icon" aria-hidden="true"><use href="#i-play"/></svg>${esc(r.watch(result.name))}</button>` : '',
    result.image ? `<a class="source-link" href="${esc(result.image)}" data-result-image data-result-alt="${esc(r.documentAlt(result.name))}">${esc(r.document)}</a>` : ''
  ].join('');
  return `<article class="result-card">
            <header><span class="rs-avatar" aria-hidden="true">${esc(initials(result.name))}</span><div><h4>${esc(result.name)}</h4><p>${esc(meta)}</p></div><span class="rs-exam">${esc(result.exam)}</span></header>
            <ul class="rs-skills" aria-label="${esc(s.levelScale)}">${rows}</ul>
            ${reachesNclc7(result) ? `<p class="rs-goal"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${esc(r.nclc7)}</p>` : ''}${partial}
            <footer>${links}</footer>
          </article>`;
}

function reviewCard(review, quote, r, lang) {
  const [open, close] = QUOTES[lang];
  return `<li><figure class="quote-card"><blockquote>${open}${esc(quote)}${close}</blockquote><figcaption><span class="rs-avatar" aria-hidden="true">${esc(initials(review.name))}</span><span><strong>${esc(review.name)}</strong><small>${esc(r.reviewSource)}</small></span></figcaption></figure></li>`;
}

// Stories: one centred heading for the whole block, then three parts (video
// reel, official results, written reviews) that share one small header style.
function stories(lang) {
  const s = T[lang].stories;
  const r = runtime(lang).stories;
  const quotes = lang === 'es' ? WRITTEN_TESTIMONIALS.map(review => review.quote) : REVIEW_QUOTES[lang];
  if (quotes.length !== WRITTEN_TESTIMONIALS.length) throw new Error(`home-tail: ${lang} needs ${WRITTEN_TESTIMONIALS.length} review translations`);
  const half = Math.ceil(WRITTEN_TESTIMONIALS.length / 2);
  const row = (from, to) => WRITTEN_TESTIMONIALS.slice(from, to).map((review, i) => reviewCard(review, quotes[from + i], r, lang)).join('');
  const lane = (from, to, reverse) => `<div class="quote-lane${reverse ? ' is-reverse' : ''}"><ul class="quote-track">${row(from, to)}</ul><ul class="quote-track" aria-hidden="true">${row(from, to)}</ul></div>`;
  const plain = html => html.replace(/<br>\s*/g, '');
  return `<section class="v4-section stories-v4" id="historias" aria-labelledby="stories-title">
      <div class="container">
        <header class="home-head">
          <p class="home-pill">${s.tag}</p>
          <h2 id="stories-title">${s.title}</h2>
          <p>${s.lead}</p>
        </header>
        <div class="reel" data-story-reel role="region" aria-label="${esc(s.reel)}">
          <div class="stories-sub"><div><h3>${esc(s.reel)}</h3><p>${esc(s.reelNote)}</p></div><div class="reel-nav"><button class="v4-round" type="button" data-reel-previous aria-label="${esc(s.previous)}">‹</button><button class="v4-round" type="button" data-reel-next aria-label="${esc(s.next)}">›</button></div></div>
          <ol class="reel-track" data-reel-track>${VIDEO_TESTIMONIALS.map((video, index) => storyCard(video, index, s, lang)).join('')}</ol>
        </div>
        <div class="results-band">
          <div class="stories-sub"><div><h3>${plain(s.resultsTitle)}</h3><p>${esc(s.resultsText)}</p></div></div>
          <div class="results-grid" data-count="${EXAM_RESULTS.length}">${EXAM_RESULTS.map(result => resultCard(result, s, lang)).join('')}</div>
        </div>
        <div class="quotes" data-quotes>
          <div class="stories-sub"><div><h3>${esc(s.reviewsTitle)}</h3><p>${esc(s.reviewsText(WRITTEN_TESTIMONIALS.length))} <a class="source-link" href="${esc(LINKS.reviewsSource)}" target="_blank" rel="noopener noreferrer">${esc(s.reviewsLink)} ${out}</a></p></div><button class="v4-round quotes-toggle" type="button" data-quotes-toggle aria-pressed="false" aria-label="${esc(r.pause)}"><svg class="icon" aria-hidden="true"><use href="#i-pause"/></svg></button></div>
          ${lane(0, half, true)}
          ${lane(half, WRITTEN_TESTIMONIALS.length, false)}
        </div>
        <p class="home-foot">${esc(s.resultsNote)}</p>
      </div>
      <dialog class="story-viewer" data-story-viewer aria-label="${esc(s.reel)}">
        <div class="sv-frame">
          <div class="sv-progress" aria-hidden="true">${VIDEO_TESTIMONIALS.map(() => '<i></i>').join('')}</div>
          <header class="sv-head"><strong data-sv-name></strong><span data-sv-count aria-live="polite"></span><button class="sv-close" type="button" data-sv-close aria-label="${esc(r.close)}">×</button></header>
          <video data-sv-video playsinline controls preload="none"></video>
          <p class="sv-error" data-sv-error role="status" hidden>${esc(r.error)} <a data-sv-direct target="_blank" rel="noopener">${esc(r.openFile)}</a></p>
          <button class="sv-arrow sv-previous" type="button" data-sv-previous aria-label="${esc(r.previous)}">‹</button>
          <button class="sv-arrow sv-next" type="button" data-sv-next aria-label="${esc(r.next)}">›</button>
        </div>
      </dialog>
      <dialog class="result-viewer" data-result-viewer><button class="sv-close" type="button" data-rv-close aria-label="${esc(r.close)}">×</button><img data-rv-image alt=""></dialog>
    </section>`;
}

function pricing(lang) {
  const p = T[lang].pricing;
  const check = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
  return `<section class="v4-section pricing-v4" id="planes" aria-labelledby="pricing-title">
      <div class="container">
        <header class="plans-head">
          <p class="plans-pill">${p.tag}</p>
          <h2 id="pricing-title">${p.title}</h2>
          <p>${p.lead}</p>
        </header>
        <div class="plans-billing">
          <div class="plans-switch" role="group" aria-label="${esc(p.switchLabel)}"><button type="button" data-billing="monthly" aria-pressed="true">${p.monthly}</button><button type="button" data-billing="cycle" aria-pressed="false">${p.cycle}</button></div>
          <p class="plans-hint" data-billing-hint data-hint-monthly="${esc(p.hintMonthly)}" data-hint-cycle="${esc(p.hintCycle)}">${p.hintMonthly}</p>
        </div>
        <p class="sr-only" data-pricing-status aria-live="polite">${esc(runtime(lang).pricing.statusMonthly)}</p>
        <div class="pricing-grid" data-pricing-cards>${renderPricing('monthly', lang)}</div>
        <div class="plans-included">
          <div>
            <h3>${p.included.title}</h3>
            <p>${p.included.text}</p>
            <a class="button button-primary" href="${pages(lang).test}" data-cta="v4-pricing-test">${p.included.cta} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a>
          </div>
          <ul>${p.included.items.map(item => `<li>${check}<span>${item}</span></li>`).join('')}</ul>
        </div>
        <p class="plans-foot">${p.foot} · <a href="${pages(lang).conditions}">${p.conditions}</a></p>
      </div>
    </section>`;
}

// Official IRCC rounds page: French on the French home, English elsewhere
// (canada.ca has no Spanish or German version).
const IRCC_ROUNDS = {
  en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html',
  fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/rondes-invitations.html'
};

// Latest IRCC rounds (French category and CEC), filled live by v4/ircc-rounds.js.
function rounds(lang) {
  const r = T[lang].rounds;
  const official = lang === 'fr' ? IRCC_ROUNDS.fr : IRCC_ROUNDS.en;
  const card = (key, title) => `<article class="round-card" data-ircc-category="${key}"><h3>${title}</h3><dl><div><dt>${r.date}</dt><dd data-round-date>${r.loading}</dd></div><div><dt>${r.score}</dt><dd data-round-score></dd></div></dl><a class="round-source" data-round-source href="${official}" target="_blank" rel="noopener noreferrer">${r.official}</a></article>`;
  return `<section class="v4-section rounds-home" id="rondas-ircc" aria-labelledby="rounds-title">
      <div class="container">
        <header class="home-head">
          <p class="home-pill">${r.tag}</p>
          <h2 id="rounds-title">${r.title}</h2>
          <p>${r.lead}</p>
        </header>
        <div class="rounds-board" data-ircc-rounds aria-busy="true">
          <div class="rounds-cards">${card('french', r.french)}${card('cec', r.cec)}</div>
          <p class="rounds-status"><span data-ircc-status role="status">${r.status}</span> <span data-ircc-updated></span></p>
          <noscript><p>${r.noscript}</p></noscript>
        </div>
        <p class="home-foot">${r.note} · <a href="${official}" target="_blank" rel="noopener noreferrer">${r.source} <span aria-hidden="true">↗</span></a> · <a href="${pages(lang).crs}">${r.crs} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
      </div>
    </section>`;
}

function faq(lang) {
  const f = T[lang].faq;
  const fill = html => html.replace('{test}', pages(lang).test).replace('{inscription}', pages(lang).inscription).replace('{nclc}', pages(lang).nclc).replace('{crs}', pages(lang).crs);
  return `<section class="v4-section faq-v4" id="preguntas" aria-labelledby="faq-title">
      <div class="container">
        <header class="home-head">
          <p class="home-pill">${f.tag}</p>
          <h2 id="faq-title">${f.title}</h2>
          <p>${f.lead}</p>
        </header>
        <div class="faq-list" data-faq>
          ${f.items.map(([question, answer], i) => `<details name="pathway-faq"${i === 0 ? ' open' : ''}><summary>${question}<span class="faq-chevron" aria-hidden="true"></span></summary><div>${fill(answer)}</div></details>`).join('\n          ')}
        </div>
      </div>
    </section>`;
}

function closing(lang) {
  const f = T[lang].final;
  const o = T[lang].footer;
  const home = pages(lang).home;
  const mail = lang === 'es' ? 'contacto@pathway-languages.com' : 'contact@pathway-languages.com';
  return `<section class="final-cta-v4" aria-labelledby="final-title">
      <div class="container final-cta-inner">
        <div class="final-copy"><p class="home-pill">${f.tag}</p><h2 id="final-title">${f.title}</h2><p>${f.text}</p><div class="final-actions"><a class="button button-sage" href="${pages(lang).test}" data-cta="v4-final-evaluation">${f.cta} ${arrow}</a><a class="button button-ghost" href="${WHATSAPP}" target="_blank" rel="noopener" data-cta="v4-final-whatsapp">${f.whatsapp} ${out}</a></div></div>
        <img class="final-lighthouse" src="/v4/assets/phare-chemin.svg" width="780" height="690" loading="lazy" alt="">
      </div>
    </section>
  </main>
  <footer class="footer-v4">
    <div class="container">
      <div class="footer-v4-main">
        <div class="footer-v4-brand"><a href="${home}" aria-label="${esc(o.home)}"><img src="/v4/assets/pathway-logo-inverse.svg" width="280" height="88" loading="lazy" alt="Pathway Language Solutions"></a><p>${o.motto}</p></div>
        <nav class="footer-v4-navigation" aria-label="${esc(o.nav)}"><h2>${o.navTitle}</h2><div>${o.links.map(([hash, label]) => `<a href="${home}${hash}">${label}</a>`).join('')}</div></nav>
        <div class="footer-v4-contact"><h2>${o.contact}</h2><a href="mailto:${mail}"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="1"/><path d="m2 5 10 8L22 5"/></svg>${mail}</a><a href="${WHATSAPP}" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 12A8.5 8.5 0 0 1 8 19.5L3 21l1.5-5A8.5 8.5 0 1 1 20.5 12Z"/><path d="M8 7c-2 4 3 9 7 8l1-2-3-1-1 1-2-2 1-1-1-3Z"/></svg>+51 989 887 516</a><div class="footer-socials" data-social-links></div></div>
      </div>
      <div class="footer-v4-bottom"><p>© <span data-year>2026</span> Pathway Language Solutions.<br> ${o.rights}</p><nav aria-label="${esc(o.legalNav)}">${o.legal.map(([key, label]) => `<a href="${LEGAL[lang][key]}">${label}</a>`).join('')}</nav></div>
    </div>
  </footer>`;
}

/** Markup that replaces HOME_TAIL_MARKER (from the stories to the end of the footer). */
export function homeTail(lang) {
  if (!T[lang]) throw new Error(`home-tail: unknown language ${lang}`);
  const markup = [stories(lang), rounds(lang), pricing(lang), faq(lang), closing(lang)].join('\n\n    ');
  return lang === 'fr' ? frenchTypography(markup) : markup;
}

export const LEGAL_PATHS = LEGAL;
