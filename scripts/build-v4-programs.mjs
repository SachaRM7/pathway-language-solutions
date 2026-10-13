#!/usr/bin/env node
// Generates the V4 program pages (/v4/programas/<level>/ and the fr, en, de
// trees): the page-turning manual reader plus the manual walkthrough, in the
// V4 header, footer and type scale.
//
// Facts about each manual come from v4/data/manuals/<level>.json (written by
// scripts/build-manual-level.py, A2 kept by hand) and the page images from
// /assets/manual-<level>/reader/pages.js. Only the interface around them is
// translated; manual excerpts stay in French.
//
// Integration: build.mjs calls buildV4Programs({ outDir, rootDir }) after the
// v4 tree is copied, replacing the placeholder program pages.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEVELS = ['a1', 'a2', 'b1', 'b2'];
export const LANGS = ['es', 'fr', 'en', 'de'];
const READER_VERSION = 'reader-8';
const SITE_ORIGIN = 'https://pathway-languages.com';

const prefix = lang => (lang === 'es' ? '/v4/' : `/v4/${lang}/`);
export const programPath = (lang, level) => `${prefix(lang)}programas/${level}/`;

const UI = {
  es: {
    htmlLang: 'es', home: 'Inicio', programs: 'Programas', program: 'Programa',
    title: level => `Programa ${level} · El manual Pathway`,
    eyebrow: level => `Programa de francés · nivel ${level}`,
    openManual: 'Abrir el manual', evaluate: 'Evaluar mi nivel', levelsLabel: 'Otros niveles',
    facts: ['unidades', 'segmentos', 'balances internos', 'exámenes de práctica'],
    library: 'La biblioteca Pathway', yourManual: 'Tu manual de francés', download: 'Descargar los extractos',
    goTo: 'Ir a', zoom: 'Ampliar página', zoomLabel: 'Ampliar la página actual', fullscreen: 'Pantalla completa', exit: 'Salir',
    openFullscreen: 'Abrir el manual en pantalla completa', closeFullscreen: 'Salir de la pantalla completa',
    bookLabel: level => `Manual ${level}. Usa las flechas del teclado para pasar las páginas.`,
    prev: 'Página anterior', next: 'Página siguiente', openBook: level => `Abrir el manual ${level}`, openCta: 'Abrir el manual →',
    opening: 'Abriendo el manual…', hint: 'Desliza o toca el borde para pasar la página', backCover: 'Volver a la portada',
    readAll: 'Recorrer el contenido', original: 'Contenido original del manual', zoomed: 'Página ampliada', close: 'Cerrar ✕', closeZoom: 'Cerrar la página ampliada',
    chapters: { 'table-matieres': 'Tabla de contenidos', sommaire: 'Índice detallado', 'unite-1': 'Unidad 1', 'examen-a': 'Balance del segmento A', autoevaluation: 'Autoevaluación' },
    examA2: 'Examen del segmento A',
    page: 'página', pages: 'páginas', manualWord: 'manual', source: 'Fuente: manual, p.', consult: 'Consultar', downloadPdf: 'Descargar', enlarge: 'Ampliar',
    s1: ['01 · El recorrido', 'Cuatro segmentos.<br>Una progresión clara.', 'Cada segmento reúne 16 unidades con la misma progresión y termina con una evaluación interna.'],
    s2: ['02 · El contenido', 'Las 64 unidades, en detalle.', 'Consulta el índice detallado completo: todos los títulos, en su orden de aprendizaje.'],
    s3: ['03 · Una unidad de principio a fin', 'Unidad 1', pages => `Las ${pages} páginas reproducen la unidad completa, tal como aparece en el manual.`],
    stages: ['Situación y observación', 'Explicación y ejercicios guiados', 'Consolidación y aplicación', 'Producción y comprensión', 'Vocabulario clave'],
    s4: ['04 · Comprobar lo aprendido', 'La evaluación completa<br>del segmento A.', (time, title) => `Unidad 16 · ${time} · 100 puntos. ${title}: las cuatro pruebas movilizan las nociones de las unidades 1–15.`],
    parts: ['Comprensión oral', 'Comprensión escrita', 'Producción escrita', 'Producción e interacción orales'], points: '25 puntos',
    rule: 'Criterio indicado en el manual:', teacherReads: 'El profesor lee los documentos de comprensión oral.',
    script: 'Texto para la comprensión oral', scriptNote: page => `El profesor lee el texto dos veces. Fuente: anexo del manual, p. ${page}.`,
    s5: ['05 · Hacer balance', 'Reconoce tus avances.'], s5Units: 'Las quince unidades del segmento A, tal como aparecen en el índice. Marca una respuesta por línea para preparar el balance con tu profesor.',
    s5A2: 'La grille d’auto-évaluation del segmento A, con sus seis criterios originales. Marca una respuesta por línea para preparar el balance con tu profesor.',
    s5Note: 'Tus respuestas no se envían ni se guardan al cerrar la página. Esta reflexión personal complementa la evaluación del profesor.',
    sectionsNav: 'En esta página', ctaTitle: 'Encuentra tu punto de partida.', ctaEyebrow: '¿Listo para empezar?', ctaText: 'Un profesor confirma tu nivel y las prioridades del recorrido durante la evaluación inicial.',
    allExtracts: 'Todos los extractos · PDF'
  },
  fr: {
    htmlLang: 'fr', home: 'Accueil', programs: 'Programmes', program: 'Programme',
    title: level => `Programme ${level} · Le manuel Pathway`,
    eyebrow: level => `Programme de français · niveau ${level}`,
    openManual: 'Ouvrir le manuel', evaluate: 'Évaluer mon niveau', levelsLabel: 'Autres niveaux',
    facts: ['unités', 'segments', 'bilans internes', 'examens d’entraînement'],
    library: 'La bibliothèque Pathway', yourManual: 'Votre manuel de français', download: 'Télécharger les extraits',
    goTo: 'Aller à', zoom: 'Agrandir la page', zoomLabel: 'Agrandir la page actuelle', fullscreen: 'Plein écran', exit: 'Quitter',
    openFullscreen: 'Ouvrir le manuel en plein écran', closeFullscreen: 'Quitter le plein écran',
    bookLabel: level => `Manuel ${level}. Utilisez les flèches du clavier pour tourner les pages.`,
    prev: 'Page précédente', next: 'Page suivante', openBook: level => `Ouvrir le manuel ${level}`, openCta: 'Ouvrir le manuel →',
    opening: 'Ouverture du manuel…', hint: 'Faites glisser ou touchez le bord pour tourner la page', backCover: 'Revenir à la couverture',
    readAll: 'Parcourir le contenu', original: 'Contenu original du manuel', zoomed: 'Page agrandie', close: 'Fermer ✕', closeZoom: 'Fermer la page agrandie',
    chapters: { 'table-matieres': 'Table des matières', sommaire: 'Sommaire détaillé', 'unite-1': 'Unité 1', 'examen-a': 'Bilan du segment A', autoevaluation: 'Auto-évaluation' },
    examA2: 'Examen du segment A',
    page: 'page', pages: 'pages', manualWord: 'manuel', source: 'Source : manuel, p.', consult: 'Consulter', downloadPdf: 'Télécharger', enlarge: 'Agrandir',
    s1: ['01 · Le parcours', 'Quatre segments.<br>Une progression claire.', 'Chaque segment réunit 16 unités qui suivent la même progression et se termine par une évaluation interne.'],
    s2: ['02 · Le contenu', 'Les 64 unités, en détail.', 'Consultez le sommaire détaillé complet : tous les titres, dans leur ordre d’apprentissage.'],
    s3: ['03 · Une unité du début à la fin', 'Unité 1', pages => `Les ${pages} pages reproduisent l’unité complète, telle qu’elle figure dans le manuel.`],
    stages: ['Mise en situation et observation', 'Explication et exercices guidés', 'Consolidation et réinvestissement', 'Production et compréhension', 'Vocabulaire clé'],
    s4: ['04 · Vérifier ses acquis', 'L’évaluation complète<br>du segment A.', (time, title) => `Unité 16 · ${time} · 100 points. ${title} : les quatre épreuves mobilisent les notions des unités 1 à 15.`],
    parts: ['Compréhension orale', 'Compréhension écrite', 'Production écrite', 'Production et interaction orales'], points: '25 points',
    rule: 'Critère indiqué dans le manuel :', teacherReads: 'L’enseignant lit les documents de compréhension orale.',
    script: 'Texte de compréhension orale', scriptNote: page => `L’enseignant lit le texte deux fois. Source : annexe du manuel, p. ${page}.`,
    s5: ['05 · Faire le point', 'Mesurez vos progrès.'], s5Units: 'Les quinze unités du segment A, telles qu’elles figurent au sommaire. Cochez une réponse par ligne pour préparer le bilan avec votre enseignant.',
    s5A2: 'La grille d’auto-évaluation du segment A, avec ses six critères d’origine. Cochez une réponse par ligne pour préparer le bilan avec votre enseignant.',
    s5Note: 'Vos réponses ne sont ni envoyées ni conservées à la fermeture de la page. Cette réflexion personnelle complète l’évaluation de l’enseignant.',
    sectionsNav: 'Sur cette page', ctaTitle: 'Trouvez votre point de départ.', ctaEyebrow: 'Prêt à commencer ?', ctaText: 'Un enseignant confirme votre niveau et les priorités du parcours lors de l’évaluation initiale.',
    allExtracts: 'Tous les extraits · PDF'
  },
  en: {
    htmlLang: 'en', home: 'Home', programs: 'Programs', program: 'Program',
    title: level => `${level} program · The Pathway textbook`,
    eyebrow: level => `French program · level ${level}`,
    openManual: 'Open the textbook', evaluate: 'Assess my level', levelsLabel: 'Other levels',
    facts: ['units', 'segments', 'internal assessments', 'practice exams'],
    library: 'The Pathway library', yourManual: 'Your French textbook', download: 'Download the excerpts',
    goTo: 'Go to', zoom: 'Enlarge page', zoomLabel: 'Enlarge the current page', fullscreen: 'Full screen', exit: 'Exit',
    openFullscreen: 'Open the textbook in full screen', closeFullscreen: 'Exit full screen',
    bookLabel: level => `${level} textbook. Use the arrow keys to turn the pages.`,
    prev: 'Previous page', next: 'Next page', openBook: level => `Open the ${level} textbook`, openCta: 'Open the textbook →',
    opening: 'Opening the textbook…', hint: 'Swipe or tap the edge to turn the page', backCover: 'Back to the cover',
    readAll: 'Browse the contents', original: 'Original textbook content', zoomed: 'Enlarged page', close: 'Close ✕', closeZoom: 'Close the enlarged page',
    chapters: { 'table-matieres': 'Table of contents', sommaire: 'Detailed index', 'unite-1': 'Unit 1', 'examen-a': 'Segment A assessment', autoevaluation: 'Self-assessment' },
    examA2: 'Segment A exam',
    page: 'page', pages: 'pages', manualWord: 'textbook', source: 'Source: textbook, p.', consult: 'View', downloadPdf: 'Download', enlarge: 'Enlarge',
    s1: ['01 · The path', 'Four segments.<br>A clear progression.', 'Each segment brings together 16 units that follow the same progression and ends with an internal assessment.'],
    s2: ['02 · The contents', 'All 64 units, in detail.', 'Browse the complete detailed index: every title, in learning order.'],
    s3: ['03 · One unit from start to finish', 'Unit 1', pages => `These ${pages} pages reproduce the complete unit, exactly as it appears in the textbook.`],
    stages: ['Situation and observation', 'Explanation and guided exercises', 'Consolidation and application', 'Production and comprehension', 'Key vocabulary'],
    s4: ['04 · Check what you have learned', 'The complete assessment<br>for segment A.', (time, title) => `Unit 16 · ${time} · 100 points. ${title}: the four tests draw on units 1–15.`],
    parts: ['Listening', 'Reading', 'Writing', 'Speaking and interaction'], points: '25 points',
    rule: 'Pass rule stated in the textbook:', teacherReads: 'The teacher reads the listening documents aloud.',
    script: 'Listening text', scriptNote: page => `The teacher reads the text twice. Source: textbook appendix, p. ${page}.`,
    s5: ['05 · Take stock', 'Recognize your progress.'], s5Units: 'The fifteen units of segment A, as listed in the index. Choose one answer per line to prepare your review with your teacher.',
    s5A2: 'The segment A self-assessment grid, with its six original criteria. Choose one answer per line to prepare your review with your teacher.',
    s5Note: 'Your answers are not sent and are not kept when you close the page. This personal reflection complements your teacher’s assessment.',
    sectionsNav: 'On this page', ctaTitle: 'Find your starting point.', ctaEyebrow: 'Ready to start?', ctaText: 'A teacher confirms your level and the priorities of your path during the initial assessment.',
    allExtracts: 'All excerpts · PDF'
  },
  de: {
    htmlLang: 'de', home: 'Startseite', programs: 'Programme', program: 'Programm',
    title: level => `${level}-Programm · Das Pathway-Lehrbuch`,
    eyebrow: level => `Französischprogramm · Niveau ${level}`,
    openManual: 'Lehrbuch öffnen', evaluate: 'Mein Niveau einstufen', levelsLabel: 'Weitere Niveaus',
    facts: ['Einheiten', 'Segmente', 'interne Bilanzen', 'Übungsprüfungen'],
    library: 'Die Pathway-Bibliothek', yourManual: 'Ihr Französischlehrbuch', download: 'Auszüge herunterladen',
    goTo: 'Gehe zu', zoom: 'Seite vergrößern', zoomLabel: 'Aktuelle Seite vergrößern', fullscreen: 'Vollbild', exit: 'Beenden',
    openFullscreen: 'Lehrbuch im Vollbild öffnen', closeFullscreen: 'Vollbild beenden',
    bookLabel: level => `Lehrbuch ${level}. Mit den Pfeiltasten blättern Sie die Seiten um.`,
    prev: 'Vorherige Seite', next: 'Nächste Seite', openBook: level => `Lehrbuch ${level} öffnen`, openCta: 'Lehrbuch öffnen →',
    opening: 'Lehrbuch wird geöffnet…', hint: 'Wischen oder den Rand antippen, um umzublättern', backCover: 'Zurück zum Umschlag',
    readAll: 'Inhalt durchsehen', original: 'Originalinhalt des Lehrbuchs', zoomed: 'Vergrößerte Seite', close: 'Schließen ✕', closeZoom: 'Vergrößerte Seite schließen',
    chapters: { 'table-matieres': 'Inhaltsverzeichnis', sommaire: 'Ausführliche Übersicht', 'unite-1': 'Einheit 1', 'examen-a': 'Bilanz von Segment A', autoevaluation: 'Selbsteinschätzung' },
    examA2: 'Prüfung von Segment A',
    page: 'Seite', pages: 'Seiten', manualWord: 'Lehrbuch', source: 'Quelle: Lehrbuch, S.', consult: 'Ansehen:', downloadPdf: 'Herunterladen:', enlarge: 'Vergrößern:',
    s1: ['01 · Der Weg', 'Vier Segmente.<br>Ein klarer Aufbau.', 'Jedes Segment umfasst 16 Einheiten mit demselben Aufbau und endet mit einer internen Bewertung.'],
    s2: ['02 · Der Inhalt', 'Alle 64 Einheiten im Detail.', 'Sehen Sie die vollständige Übersicht an: alle Titel in der Reihenfolge des Lernens.'],
    s3: ['03 · Eine Einheit von Anfang bis Ende', 'Einheit 1', pages => `Die ${pages} Seiten geben die vollständige Einheit so wieder, wie sie im Lehrbuch steht.`],
    stages: ['Situation und Beobachtung', 'Erklärung und angeleitete Übungen', 'Festigung und Anwendung', 'Produktion und Verstehen', 'Schlüsselwortschatz'],
    s4: ['04 · Das Gelernte überprüfen', 'Die vollständige Bewertung<br>von Segment A.', (time, title) => `Einheit 16 · ${time} · 100 Punkte. ${title}: Die vier Prüfungsteile greifen die Inhalte der Einheiten 1–15 auf.`],
    parts: ['Hörverstehen', 'Leseverstehen', 'Schriftlicher Ausdruck', 'Mündlicher Ausdruck und Interaktion'], points: '25 Punkte',
    rule: 'Im Lehrbuch angegebenes Kriterium:', teacherReads: 'Die Lehrkraft liest die Hörtexte vor.',
    script: 'Hörtext', scriptNote: page => `Die Lehrkraft liest den Text zweimal vor. Quelle: Anhang des Lehrbuchs, S. ${page}.`,
    s5: ['05 · Bilanz ziehen', 'Erkennen Sie Ihre Fortschritte.'], s5Units: 'Die fünfzehn Einheiten von Segment A, wie sie in der Übersicht stehen. Wählen Sie pro Zeile eine Antwort, um die Bilanz mit Ihrer Lehrkraft vorzubereiten.',
    s5A2: 'Das Selbsteinschätzungsraster von Segment A mit seinen sechs ursprünglichen Kriterien. Wählen Sie pro Zeile eine Antwort, um die Bilanz mit Ihrer Lehrkraft vorzubereiten.',
    s5Note: 'Ihre Antworten werden weder gesendet noch beim Schließen der Seite gespeichert. Diese persönliche Reflexion ergänzt die Bewertung durch die Lehrkraft.',
    sectionsNav: 'Auf dieser Seite', ctaTitle: 'Finden Sie Ihren Ausgangspunkt.', ctaEyebrow: 'Bereit loszulegen?', ctaText: 'Eine Lehrkraft bestätigt bei der Ersteinstufung Ihr Niveau und die Schwerpunkte Ihres Weges.',
    allExtracts: 'Alle Auszüge · PDF'
  }
};

// Per-level headline, lead and unit-1 summary. Facts stay in the JSON data.
const COPY = {
  a1: {
    es: ['Tus primeros pasos', 'en francés.', 'Del primer bonjour a presentarte con soltura: explora el manual A1, trabaja una unidad completa y descubre cómo se evalúa tu progreso.', 'Aprende a saludar y a despedirte en registro formal e informal, y a adaptar el saludo al momento del día. La unidad termina con un arranque sobre el alfabeto y el deletreo.'],
    fr: ['Vos premiers pas', 'en français.', 'Du premier bonjour à une présentation fluide : explorez le manuel A1, travaillez une unité complète et découvrez comment vos progrès sont évalués.', 'Saluer et prendre congé en registre formel et informel, et adapter la salutation au moment de la journée. L’unité se termine par un démarrage sur l’alphabet et l’épellation.'],
    en: ['Your first steps', 'in French.', 'From your first bonjour to introducing yourself with ease: explore the A1 textbook, work through a full unit and see how your progress is assessed.', 'Learn to greet people and say goodbye in formal and informal registers, adapting the greeting to the time of day. The unit ends with a warm-up on the alphabet and spelling.'],
    de: ['Ihre ersten Schritte', 'auf Französisch.', 'Vom ersten bonjour bis zur sicheren Vorstellung: Entdecken Sie das A1-Lehrbuch, arbeiten Sie eine ganze Einheit durch und sehen Sie, wie Ihr Fortschritt bewertet wird.', 'Begrüßen und sich verabschieden, förmlich und informell, passend zur Tageszeit. Die Einheit endet mit einem Einstieg in Alphabet und Buchstabieren.']
  },
  a2: {
    es: ['Tu próximo paso', 'en francés.', 'De la rutina a tus propias ideas: explora el manual A2, trabaja una unidad completa y descubre cómo se evalúa tu progreso.', 'Aprende a conjugar los verbos en -er, hablar de tu rutina y utilizar los pronombres sujeto.'],
    fr: ['Votre prochaine étape', 'en français.', 'Du quotidien à vos propres idées : explorez le manuel A2, travaillez une unité complète et découvrez comment vos progrès sont évalués.', 'Conjuguer les verbes en -er, parler de sa routine et utiliser les pronoms sujets.'],
    en: ['Your next step', 'in French.', 'From daily routine to your own ideas: explore the A2 textbook, work through a full unit and see how your progress is assessed.', 'Learn to conjugate -er verbs, talk about your routine and use subject pronouns.'],
    de: ['Ihr nächster Schritt', 'auf Französisch.', 'Vom Alltag zu Ihren eigenen Ideen: Entdecken Sie das A2-Lehrbuch, arbeiten Sie eine ganze Einheit durch und sehen Sie, wie Ihr Fortschritt bewertet wird.', 'Verben auf -er konjugieren, über den eigenen Alltag sprechen und Subjektpronomen verwenden.']
  },
  b1: {
    es: ['Exprésate con independencia', 'en francés.', 'De dar tu opinión a argumentar con matices, con preparación al TCF Canadá: explora el manual B1, trabaja una unidad completa y descubre cómo se evalúa tu progreso.', 'Reactiva los cuatro tiempos básicos del A2 y sitúa una acción en el presente, el pasado o el futuro. La unidad empieza con un diagnóstico de entrada de 15 minutos.'],
    fr: ['Exprimez-vous en autonomie', 'en français.', 'De l’opinion à l’argumentation nuancée, avec préparation au TCF Canada : explorez le manuel B1, travaillez une unité complète et découvrez comment vos progrès sont évalués.', 'Réactiver les quatre temps de base de l’A2 et situer une action dans le présent, le passé ou l’avenir. L’unité s’ouvre sur un diagnostic d’entrée de 15 minutes.'],
    en: ['Express yourself independently', 'in French.', 'From giving your opinion to nuanced argument, with TCF Canada preparation: explore the B1 textbook, work through a full unit and see how your progress is assessed.', 'Reactivate the four core A2 tenses and place an action in the present, past or future. The unit opens with a 15-minute entry diagnostic.'],
    de: ['Drücken Sie sich selbstständig aus', 'auf Französisch.', 'Von der eigenen Meinung zur differenzierten Argumentation, mit Vorbereitung auf den TCF Canada: Entdecken Sie das B1-Lehrbuch, arbeiten Sie eine ganze Einheit durch und sehen Sie, wie Ihr Fortschritt bewertet wird.', 'Die vier Grundzeiten des A2 reaktivieren und eine Handlung in Gegenwart, Vergangenheit oder Zukunft verorten. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose.']
  },
  b2: {
    es: ['Argumenta con matices', 'en francés.', 'Del matiz al discurso complejo, con preparación al TCF Canadá: explora el manual B2, trabaja una unidad completa y descubre cómo se evalúa tu progreso.', 'Consolida el sistema de tiempos del B1 y encadena tus ideas con conectores complejos. La unidad empieza con un diagnóstico de entrada al B2 de 15 minutos.'],
    fr: ['Argumentez avec nuance', 'en français.', 'De la nuance au discours complexe, avec préparation au TCF Canada : explorez le manuel B2, travaillez une unité complète et découvrez comment vos progrès sont évalués.', 'Consolider le système des temps du B1 et enchaîner ses idées avec des connecteurs complexes. L’unité s’ouvre sur un diagnostic d’entrée en B2 de 15 minutes.'],
    en: ['Argue with nuance', 'in French.', 'From nuance to complex discourse, with TCF Canada preparation: explore the B2 textbook, work through a full unit and see how your progress is assessed.', 'Consolidate the B1 tense system and link your ideas with complex connectors. The unit opens with a 15-minute B2 entry diagnostic.'],
    de: ['Argumentieren Sie differenziert', 'auf Französisch.', 'Von der Nuance zum komplexen Diskurs, mit Vorbereitung auf den TCF Canada: Entdecken Sie das B2-Lehrbuch, arbeiten Sie eine ganze Einheit durch und sehen Sie, wie Ihr Fortschritt bewertet wird.', 'Das Zeitensystem des B1 festigen und Gedanken mit komplexen Konnektoren verknüpfen. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose für B2.']
  }
};

const esc = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function between(markup, start, end, label) {
  const from = markup.indexOf(start);
  const to = from < 0 ? -1 : markup.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`V4 ${label} not found`);
  return markup.slice(from, to + end.length);
}

// Reuse the V4 home header and footer of the language so navigation, legal
// links and the language switcher stay identical across V4 pages.
function chrome(homeMarkup, lang, level) {
  const home = prefix(lang);
  let header = between(homeMarkup, '<header class="site-header" data-header>', '</header>', 'header');
  // The Spanish home has the new footer; fr, en and de still use the first one.
  let footer = homeMarkup.includes('<footer class="footer-v4">')
    ? between(homeMarkup, '<footer class="footer-v4">', '</footer>', 'footer')
    : between(homeMarkup, '<footer class="site-footer">', '</footer>', 'footer');
  const icons = between(homeMarkup, '<svg class="icon-library"', '</svg>\n', 'icon library');
  header = header.replace(/href="#([^"]+)"/g, `href="${home}#$1"`);
  footer = footer.replace(/href="#([^"]+)"/g, `href="${home}#$1"`);
  header = header.replace(/<div class="language-switcher"[\s\S]*?<\/div>/, switcher => switcher
    .replace(/ aria-current="page"/g, '')
    .replace(/<a href="[^"]*" lang="(es|fr|en|de)"/g, (_, code) => `<a href="${programPath(code, level)}" lang="${code}"${code === lang ? ' aria-current="page"' : ''}`));
  return { header, footer, icons };
}

function readerManifest(source) {
  const match = source.match(/window\.PathwayManualPages\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) throw new Error('Unreadable manual pages manifest');
  return JSON.parse(match[1]);
}

function figures(t, level, pages, key) {
  const list = pages.filter(page => page.key === key);
  if (!list.length) return '';
  const name = key === 'examen-a' && level === 'a2' ? t.examA2 : t.chapters[key];
  const sheets = list.map(page => {
    const label = `${name}, ${t.page} ${page.n}`;
    return `<figure class="manual-sheet"><a href="${page.src}" target="_blank" rel="noopener" aria-label="${esc(`${t.enlarge} ${label}`)}"><img src="${page.src}" width="1191" height="1684" loading="lazy" decoding="async" alt="${esc(label)}"></a><figcaption>Pathway ${level.toUpperCase()} · p. ${page.n}<span>${t.source} ${esc(page.source)}</span></figcaption></figure>`;
  }).join('');
  const count = `${list.length} ${list.length === 1 ? t.page : t.pages}`;
  return `<details class="manual-reader"><summary><span>${t.consult} ${esc(name)}</span><span>${count} <b aria-hidden="true">＋</b></span></summary><div class="manual-pages" lang="fr">${sheets}</div></details>`
    + `<a class="manual-download" href="/assets/manual-${level}/reader/${key}.pdf" download>${t.downloadPdf} ${esc(name)} · PDF ↓</a>`;
}

function script(t, data, key) {
  const text = data.scripts && data.scripts[key];
  if (!text) return '';
  return `<details class="teacher-script"><summary>${t.script} · ${esc(t.chapters[key])}</summary><p>${t.scriptNote(data.scripts_source)}</p><blockquote lang="fr">${esc(text)}</blockquote></details>`;
}

export function renderProgramPage({ lang, level, data, pages, homeMarkup }) {
  const t = UI[lang];
  const L = level.toUpperCase();
  const [h1a, h1b, lead, unitText] = COPY[level][lang];
  const { header, footer, icons } = chrome(homeMarkup, lang, level);
  const home = prefix(lang);
  const test = (homeMarkup.match(/class="button button-primary nav-cta" href="([^"]+)"/) || [])[1] || `${home}test-placement.html`;
  const starts = {};
  pages.forEach((page, index) => { if (!(page.key in starts)) starts[page.key] = index; });
  const chapterNames = { ...t.chapters, ...(level === 'a2' ? { 'examen-a': t.examA2 } : {}) };
  const options = Object.keys(starts).map(key => `<option value="${starts[key]}">${esc(chapterNames[key] || key)}</option>`).join('');
  const i18n = {
    page: t.page, manual: t.manualWord, cta: `${t.evaluate} →`, ctaHref: test, fullscreen: t.fullscreen, exit: t.exit,
    openFullscreen: t.openFullscreen, closeFullscreen: t.closeFullscreen, chapters: chapterNames
  };
  const unitPages = pages.filter(page => page.key === 'unite-1').length;
  const levels = LEVELS.map(code => `<a href="${programPath(lang, code)}"${code === level ? ' aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('');
  const segments = data.segments.map(segment => `<article class="segment"><span class="segment-letter">${segment.letter}</span><div><small>Unités ${segment.units}</small><h3>${esc(segment.name)}</h3><p>${esc(segment.desc)}</p></div></article>`).join('');
  const criteria = data.self_assessment || data.segment_a.map((name, index) => `U${index + 1} · ${name}`);
  const rows = criteria.map((name, index) => `<fieldset class="assessment-row"><legend>${esc(name)}</legend><div>${['Acquis', 'En cours', 'À revoir'].map((choice, value) => `<label><input type="radio" name="skill-${index}" value="${value}"><span>${choice}</span></label>`).join('')}</div></fieldset>`).join('');
  const examTitle = level === 'a2' ? t.examA2 : `<span lang="fr">${esc(data.exam_title)}</span>`;
  const unitTitle = data.unit_title.replace('1er', '1<sup>er</sup>');
  const sections = [['tabla', t.s1[0]], ['indice', t.s2[0]], ['unidad', t.s3[0]], ['evaluacion', t.s4[0]], ['autoevaluacion', t.s5[0]]];
  const canonical = `${SITE_ORIGIN}${programPath(lang, level)}`;
  const alternates = LANGS.map(code => `<link rel="alternate" hreflang="${code}" href="${SITE_ORIGIN}${programPath(code, level)}">`).join('');

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#F5EFE4">
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="${esc(lead)}">
  <title>${esc(t.title(L))} | Pathway</title>
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="icon" type="image/svg+xml" href="/v4/assets/favicon.svg">
  <link rel="preload" href="/v4/assets/fonts/Outfit-variable.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/v4/assets/fonts/DM-Sans-variable.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/v4/home.css">
  <link rel="stylesheet" href="/v4/continuation.css">
  <link rel="stylesheet" href="/manual-a2.css?v=${READER_VERSION}">
  <link rel="stylesheet" href="/v4/programa.css?v=${READER_VERSION}">
  <script src="/site-config.js" defer></script>
  <script src="/analytics.js" defer></script>
  <script src="/v4/placeholder.js" type="module"></script>
</head>
<body class="v4-program">
  <!-- Generated by scripts/build-v4-programs.mjs. -->
  ${icons}
  <a class="skip-link" href="#contenido">${lang === 'es' ? 'Saltar al contenido' : lang === 'fr' ? 'Aller au contenu' : lang === 'en' ? 'Skip to content' : 'Zum Inhalt springen'}</a>
  ${header}
  <main id="contenido" tabindex="-1">
    <section class="pgm-intro" aria-labelledby="program-title">
      <div class="container pgm-intro-grid">
        <div>
          <nav class="pgm-trail" aria-label="${esc(t.programs)}"><a href="${home}">${t.home}</a><span aria-hidden="true">/</span><a href="${home}#programa">${t.programs}</a><span aria-hidden="true">/</span><span aria-current="page">${L}</span></nav>
          <p class="eyebrow">${esc(t.eyebrow(L))}</p>
          <h1 id="program-title">${esc(h1a)}<br> <span>${esc(h1b)}</span></h1>
          <p class="pgm-lead">${esc(lead)}</p>
          <div class="pgm-actions"><a class="button button-primary" href="#manual">${t.openManual} <span aria-hidden="true">↓</span></a><a class="text-link" href="${test}" data-cta="v4-program-${level}-evaluation">${t.evaluate} <span aria-hidden="true">→</span></a></div>
        </div>
        <aside class="pgm-card" aria-label="${esc(`${t.program} ${L}`)}">
          <span class="pgm-card-level">${L}</span>
          <dl><div><dt>${t.facts[0]}</dt><dd>64</dd></div><div><dt>${t.facts[1]}</dt><dd>4</dd></div><div><dt>${level === 'a2' ? t.facts[3] : t.facts[2]}</dt><dd>4</dd></div></dl>
          <nav class="pgm-levels" aria-label="${esc(t.levelsLabel)}">${levels}</nav>
        </aside>
      </div>
    </section>

    <section id="manual" class="reader-shell" aria-label="${esc(t.yourManual)} ${L}">
      <div class="reader-heading"><div><span>${esc(t.library)}</span><h2>${esc(t.yourManual)} <b>${L}</b></h2></div><a href="/assets/manual-${level}/reader/manuel-${level}-extraits.pdf" download>${t.download} <span aria-hidden="true">↓</span></a></div>
      <div class="reader-toolbar"><label for="chapter">${t.goTo} <select id="chapter">${options}</select></label><div class="reader-toolbar-actions"><button type="button" id="zoom-open" aria-label="${esc(t.zoomLabel)}">${t.zoom}</button><button type="button" id="fullscreen-open" class="reader-fullscreen-trigger" aria-pressed="false" aria-label="${esc(t.openFullscreen)}"><span id="fullscreen-label">${t.fullscreen}</span><span id="fullscreen-icon" aria-hidden="true">↗</span></button></div></div>
      <div class="book-desk"><div class="book is-closed" id="book" data-level="${L}" data-i18n="${esc(JSON.stringify(i18n))}" tabindex="0" role="region" aria-label="${esc(t.bookLabel(L))}"><div class="book-page left-page" id="left-page"></div><div class="book-page right-page" id="right-page"></div><div class="book-spine" aria-hidden="true"></div><div class="turning-leaf" id="leaf" aria-hidden="true"><div class="leaf-front"></div><div class="leaf-back"></div></div><button type="button" class="page-edge edge-left" id="edge-prev" aria-label="${t.prev}"><span>‹</span></button><button type="button" class="page-edge edge-right" id="edge-next" aria-label="${t.next}"><span>›</span></button><button type="button" class="book-cover" id="cover" aria-label="${esc(t.openBook(L))}"><img src="/assets/manual-${level}/cover.webp" alt="Manuel de français — niveau ${L}" fetchpriority="high"><span>${t.openCta}</span></button></div></div>
      <div class="reader-controls"><button id="previous" type="button" aria-label="${t.prev}">←</button><div><p id="page-label" aria-live="polite" aria-atomic="true">${t.opening}</p><span id="reader-hint">${t.hint}</span></div><button id="next" type="button" aria-label="${t.next}">→</button></div><div class="reader-progress" aria-hidden="true"><span id="progress"></span></div>
      <div class="reader-bottom"><button type="button" id="close-book">${t.backCover}</button><a href="#contenido-manual">${t.readAll}</a><span>${t.original}</span></div>
    </section>
    <dialog id="page-zoom" aria-label="${esc(t.zoomed)}"><header><span id="zoom-label">Manuel ${L}</span><button id="zoom-close" type="button" aria-label="${esc(t.closeZoom)}">${t.close}</button></header><div id="zoom-content"></div></dialog>

    <div id="contenido-manual" class="container manual-layout">
      <nav class="manual-nav" aria-label="${esc(t.sectionsNav)}"><span>${esc(t.sectionsNav)}</span>${sections.map(([id, label]) => { const [n, ...rest] = label.split(' · '); return `<a href="#${id}"><b>${n}</b> ${esc(rest.join(' · '))}</a>`; }).join('')}<a class="manual-download" href="/assets/manual-${level}/reader/manuel-${level}-extraits.pdf" download>${t.allExtracts} ↓</a></nav>
      <div class="manual-content">
        <section id="tabla" class="manual-section"><p class="eyebrow">${t.s1[0]}</p><h2>${t.s1[1]}</h2><p>${t.s1[2]}</p><div class="segment-list" lang="fr">${segments}</div>${figures(t, level, pages, 'table-matieres')}</section>
        <section id="indice" class="manual-section"><p class="eyebrow">${t.s2[0]}</p><h2>${t.s2[1]}</h2><p>${t.s2[2]}</p>${figures(t, level, pages, 'sommaire')}</section>
        <section id="unidad" class="manual-section"><p class="eyebrow">${t.s3[0]}</p><h2 lang="fr">${unitTitle}</h2><p>${t.s3[1]} · <span lang="fr">${esc(data.unit_time)}</span>. ${esc(unitText)}</p><ol class="unit-stages">${t.stages.map(stage => `<li>${stage}</li>`).join('')}</ol><p>${t.s3[2](unitPages)}</p>${figures(t, level, pages, 'unite-1')}${script(t, data, 'unite-1')}</section>
        <section id="evaluacion" class="manual-section"><p class="eyebrow">${t.s4[0]}</p><h2>${t.s4[1]}</h2><p>${t.s4[2](`<span lang="fr">${esc(data.exam_time)}</span>`, examTitle)}</p><div class="exam-parts">${t.parts.map(part => `<span>${part} <b>${t.points}</b></span>`).join('')}</div>${figures(t, level, pages, 'examen-a')}${script(t, data, 'examen-a')}<p class="manual-note">${level === 'a2' ? '' : `${t.teacherReads} `}${t.rule} <span lang="fr">${esc(data.rule)}</span></p></section>
        <section id="autoevaluacion" class="manual-section"><p class="eyebrow">${t.s5[0]}</p><h2>${t.s5[1]}</h2><p>${level === 'a2' ? t.s5A2 : t.s5Units}</p><form class="manual-assessment" lang="fr"><h3>${level === 'a2' ? 'Je sais…' : 'Unités 1–15'}</h3>${rows}<button class="manual-reset" type="reset">Effacer mes réponses</button></form><p class="manual-note">${t.s5Note}</p>${figures(t, level, pages, 'autoevaluation')}</section>
      </div>
    </div>

    <section class="pgm-cta" aria-labelledby="pgm-cta-title">
      <div class="container pgm-cta-inner"><div><p class="eyebrow">${t.ctaEyebrow}</p><h2 id="pgm-cta-title">${t.ctaTitle}</h2><p>${t.ctaText}</p></div><a class="button button-primary" href="${test}" data-cta="v4-program-${level}-closing">${t.evaluate} <span aria-hidden="true">→</span></a></div>
    </section>
  </main>
  ${footer}
  <script src="/assets/manual-${level}/reader/pages.js?v=${READER_VERSION}"></script>
  <script src="/manual-a2.js?v=${READER_VERSION}"></script>
</body>
</html>
`;
}

export async function buildV4Programs({ outDir, rootDir }) {
  const written = [];
  for (const lang of LANGS) {
    const homeMarkup = await readFile(join(rootDir, 'v4', lang === 'es' ? '' : lang, 'index.html'), 'utf8');
    for (const level of LEVELS) {
      const data = JSON.parse(await readFile(join(rootDir, 'v4', 'data', 'manuals', `${level}.json`), 'utf8'));
      const pages = readerManifest(await readFile(join(rootDir, 'assets', `manual-${level}`, 'reader', 'pages.js'), 'utf8'));
      const target = join(outDir, programPath(lang, level), 'index.html');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, renderProgramPage({ lang, level, data, pages, homeMarkup }), 'utf8');
      written.push(target);
    }
  }
  return written;
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rootDir = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = resolvePath(process.argv[2] || join(rootDir, 'dist', 'client'));
  const files = await buildV4Programs({ outDir, rootDir });
  console.log(`Wrote ${files.length} V4 program pages under ${outDir}`);
}
