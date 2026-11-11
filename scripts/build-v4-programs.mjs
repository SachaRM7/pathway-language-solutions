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
const READER_VERSION = 'reader-9';
const SITE_ORIGIN = 'https://pathway-languages.com';

export const prefix = lang => (lang === 'es' ? '/v4/' : `/v4/${lang}/`);
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
    readAll: 'Ver lo que incluye', original: 'Contenido original del manual', zoomed: 'Página ampliada', close: 'Cerrar ✕', closeZoom: 'Cerrar la página ampliada',
    chapters: { 'table-matieres': 'Tabla de contenidos', sommaire: 'Índice detallado', 'unite-1': 'Unidad 1', 'examen-a': 'Balance del segmento A', autoevaluation: 'Autoevaluación' },
    examA2: 'Examen del segmento A',
    page: 'página', pages: 'páginas', manualWord: 'manual',
    inc: {
      eyebrow: 'Incluido en este programa', lead: 'Todo lo que recibes al empezar el nivel. Aquí puedes ver una página de ejemplo de cada documento.', soon: 'Próximamente',
      sample: 'Ver un ejemplo', next: 'Hojea el extracto del manual a continuación', close: 'Cerrar ✕',
      items: {
        manual: ['Manual del alumno', '64 unidades en 4 segmentos. Cada unidad sigue la misma progresión: situación, explicación, práctica, producción y comprensión.'],
        exercises: ['Ejercicios guiados y de consolidación', 'Cinco ejercicios por unidad para practicar la gramática y reutilizarla en tus propias frases.'],
        comprehension: ['Comprensión escrita y oral', 'Un texto y una escucha con preguntas en cada unidad.'],
        vocabulary: ['Vocabulario clave', 'Unas diez palabras para retener al final de cada unidad.'],
        diagnostic: ['Diagnóstico de entrada', '15 minutos al empezar la unidad 1 para comprobar tus bases del nivel anterior.'],
        assessments: ['4 evaluaciones de segmento', 'Una al final de cada segmento, sobre 100 puntos: comprensión oral y escrita, producción escrita y oral. Si hace falta, una versión B para un segundo intento.'],
        complementary: ['2 exámenes de lengua y vocabulario', 'Gramática y vocabulario de las unidades 1 a 32, y luego de las unidades 33 a 64.'],
        tcf: ['Simulacro de examen TCF Canadá', 'Las cuatro pruebas en el formato del examen: 39 preguntas de comprensión oral, 39 de comprensión escrita, 3 tareas escritas y 3 orales.'],
        campus: ['Acceso al Campus Pathway', 'Tus documentos en línea, ejercicios interactivos para cada unidad, repaso de tus errores y seguimiento de tu profesor.']
      }
    },
    ctaTitle: 'Encuentra tu punto de partida.', ctaEyebrow: '¿Listo para empezar?', ctaText: 'Un profesor confirma tu nivel y las prioridades del recorrido durante la evaluación inicial.'
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
    readAll: 'Voir ce qui est inclus', original: 'Contenu original du manuel', zoomed: 'Page agrandie', close: 'Fermer ✕', closeZoom: 'Fermer la page agrandie',
    chapters: { 'table-matieres': 'Table des matières', sommaire: 'Sommaire détaillé', 'unite-1': 'Unité 1', 'examen-a': 'Bilan du segment A', autoevaluation: 'Auto-évaluation' },
    examA2: 'Examen du segment A',
    page: 'page', pages: 'pages', manualWord: 'manuel',
    inc: {
      eyebrow: 'Inclus dans ce programme', lead: 'Tout ce que vous recevez en commençant le niveau. Voici une page d’exemple de chaque document.', soon: 'Bientôt',
      sample: 'Voir un exemple', next: 'Feuilletez l’extrait du manuel ci-dessous', close: 'Fermer ✕',
      items: {
        manual: ['Manuel de l’élève', '64 unités en 4 segments. Chaque unité suit la même progression : mise en situation, explication, pratique, production et compréhension.'],
        exercises: ['Exercices guidés et de consolidation', 'Cinq exercices par unité pour pratiquer la grammaire et la réemployer dans vos propres phrases.'],
        comprehension: ['Compréhension écrite et orale', 'Un texte et une écoute avec questions dans chaque unité.'],
        vocabulary: ['Vocabulaire clé', 'Une dizaine de mots à retenir à la fin de chaque unité.'],
        diagnostic: ['Diagnostic d’entrée', '15 minutes au début de l’unité 1 pour vérifier vos bases du niveau précédent.'],
        assessments: ['4 évaluations de segment', 'Une à la fin de chaque segment, sur 100 points : compréhension orale et écrite, production écrite et orale. Si besoin, une version B pour une seconde tentative.'],
        complementary: ['2 examens de langue et de vocabulaire', 'Grammaire et vocabulaire des unités 1 à 32, puis des unités 33 à 64.'],
        tcf: ['Examen blanc TCF Canada', 'Les quatre épreuves au format de l’examen : 39 questions de compréhension orale, 39 de compréhension écrite, 3 tâches écrites et 3 orales.'],
        campus: ['Accès au Campus Pathway', 'Vos documents en ligne, des exercices interactifs pour chaque unité, la révision de vos erreurs et le suivi de votre enseignant.']
      }
    },
    ctaTitle: 'Trouvez votre point de départ.', ctaEyebrow: 'Prêt à commencer ?', ctaText: 'Un enseignant confirme votre niveau et les priorités du parcours lors de l’évaluation initiale.'
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
    readAll: 'See what is included', original: 'Original textbook content', zoomed: 'Enlarged page', close: 'Close ✕', closeZoom: 'Close the enlarged page',
    chapters: { 'table-matieres': 'Table of contents', sommaire: 'Detailed index', 'unite-1': 'Unit 1', 'examen-a': 'Segment A assessment', autoevaluation: 'Self-assessment' },
    examA2: 'Segment A exam',
    page: 'page', pages: 'pages', manualWord: 'textbook',
    inc: {
      eyebrow: 'Included in this program', lead: 'Everything you receive when you start the level. Here is a sample page of each document.', soon: 'Coming soon',
      sample: 'See a sample', next: 'Browse the textbook excerpt below', close: 'Close ✕',
      items: {
        manual: ['Student textbook', '64 units in 4 segments. Every unit follows the same progression: situation, explanation, practice, production and comprehension.'],
        exercises: ['Guided and consolidation exercises', 'Five exercises per unit to practise the grammar and reuse it in your own sentences.'],
        comprehension: ['Reading and listening', 'A text and a listening task with questions in every unit.'],
        vocabulary: ['Key vocabulary', 'About ten words to remember at the end of each unit.'],
        diagnostic: ['Entry diagnostic', '15 minutes at the start of unit 1 to check your foundations from the previous level.'],
        assessments: ['4 segment assessments', 'One at the end of each segment, out of 100: listening, reading, writing and speaking. If needed, a version B for a second attempt.'],
        complementary: ['2 language and vocabulary exams', 'Grammar and vocabulary from units 1 to 32, then from units 33 to 64.'],
        tcf: ['TCF Canada mock exam', 'All four tests in the exam format: 39 listening questions, 39 reading questions, 3 writing tasks and 3 speaking tasks.'],
        campus: ['Pathway Campus access', 'Your documents online, interactive exercises for every unit, review of your mistakes and follow-up from your teacher.']
      }
    },
    ctaTitle: 'Find your starting point.', ctaEyebrow: 'Ready to start?', ctaText: 'A teacher confirms your level and the priorities of your path during the initial assessment.'
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
    readAll: 'Was enthalten ist', original: 'Originalinhalt des Lehrbuchs', zoomed: 'Vergrößerte Seite', close: 'Schließen ✕', closeZoom: 'Vergrößerte Seite schließen',
    chapters: { 'table-matieres': 'Inhaltsverzeichnis', sommaire: 'Ausführliche Übersicht', 'unite-1': 'Einheit 1', 'examen-a': 'Bilanz von Segment A', autoevaluation: 'Selbsteinschätzung' },
    examA2: 'Prüfung von Segment A',
    page: 'Seite', pages: 'Seiten', manualWord: 'Lehrbuch',
    inc: {
      eyebrow: 'In diesem Programm enthalten', lead: 'Alles, was Sie zu Beginn des Niveaus erhalten. Hier sehen Sie von jedem Dokument eine Beispielseite.', soon: 'Demnächst',
      sample: 'Beispiel ansehen', next: 'Blättern Sie unten im Auszug aus dem Lehrbuch', close: 'Schließen ✕',
      items: {
        manual: ['Lehrbuch für Lernende', '64 Einheiten in 4 Segmenten. Jede Einheit folgt demselben Aufbau: Situation, Erklärung, Übung, Produktion und Verstehen.'],
        exercises: ['Angeleitete Übungen und Festigung', 'Fünf Übungen pro Einheit, um die Grammatik zu üben und in eigenen Sätzen anzuwenden.'],
        comprehension: ['Lese- und Hörverstehen', 'Ein Text und ein Hörtext mit Fragen in jeder Einheit.'],
        vocabulary: ['Schlüsselwortschatz', 'Rund zehn Wörter zum Merken am Ende jeder Einheit.'],
        diagnostic: ['Eingangsdiagnose', '15 Minuten zu Beginn von Einheit 1, um Ihre Grundlagen aus dem vorherigen Niveau zu prüfen.'],
        assessments: ['4 Segmentbewertungen', 'Eine am Ende jedes Segments, mit 100 Punkten: Hör- und Leseverstehen, schriftlicher und mündlicher Ausdruck. Bei Bedarf eine Version B für einen zweiten Versuch.'],
        complementary: ['2 Sprach- und Wortschatzprüfungen', 'Grammatik und Wortschatz der Einheiten 1 bis 32, dann der Einheiten 33 bis 64.'],
        tcf: ['TCF-Canada-Probeprüfung', 'Alle vier Prüfungsteile im Prüfungsformat: 39 Fragen zum Hörverstehen, 39 zum Leseverstehen, 3 schriftliche und 3 mündliche Aufgaben.'],
        campus: ['Zugang zum Pathway-Campus', 'Ihre Unterlagen online, interaktive Übungen zu jeder Einheit, Wiederholung Ihrer Fehler und Begleitung durch Ihre Lehrkraft.']
      }
    },
    ctaTitle: 'Finden Sie Ihren Ausgangspunkt.', ctaEyebrow: 'Bereit loszulegen?', ctaText: 'Eine Lehrkraft bestätigt bei der Ersteinstufung Ihr Niveau und die Schwerpunkte Ihres Weges.'
  }
};

// Per-level headline, lead and unit-1 summary. Facts stay in the JSON data.
const COPY = {
  a1: {
    es: ['Tus primeros pasos', 'en francés.', 'Del primer bonjour a presentarte con soltura: explora el manual A1 y todo lo que incluye el programa.', 'Aprende a saludar y a despedirte en registro formal e informal, y a adaptar el saludo al momento del día. La unidad termina con un arranque sobre el alfabeto y el deletreo.'],
    fr: ['Vos premiers pas', 'en français.', 'Du premier bonjour à une présentation fluide : explorez le manuel A1 et tout ce que comprend le programme.', 'Saluer et prendre congé en registre formel et informel, et adapter la salutation au moment de la journée. L’unité se termine par un démarrage sur l’alphabet et l’épellation.'],
    en: ['Your first steps', 'in French.', 'From your first bonjour to introducing yourself with ease: explore the A1 textbook and everything the program includes.', 'Learn to greet people and say goodbye in formal and informal registers, adapting the greeting to the time of day. The unit ends with a warm-up on the alphabet and spelling.'],
    de: ['Ihre ersten Schritte', 'auf Französisch.', 'Vom ersten bonjour bis zur sicheren Vorstellung: Entdecken Sie das A1-Lehrbuch und alles, was das Programm umfasst.', 'Begrüßen und sich verabschieden, förmlich und informell, passend zur Tageszeit. Die Einheit endet mit einem Einstieg in Alphabet und Buchstabieren.']
  },
  a2: {
    es: ['Tu próximo paso', 'en francés.', 'De la rutina a tus propias ideas: explora el manual A2 y todo lo que incluye el programa.', 'Aprende a conjugar los verbos en -er, hablar de tu rutina y utilizar los pronombres sujeto.'],
    fr: ['Votre prochaine étape', 'en français.', 'Du quotidien à vos propres idées : explorez le manuel A2 et tout ce que comprend le programme.', 'Conjuguer les verbes en -er, parler de sa routine et utiliser les pronoms sujets.'],
    en: ['Your next step', 'in French.', 'From daily routine to your own ideas: explore the A2 textbook and everything the program includes.', 'Learn to conjugate -er verbs, talk about your routine and use subject pronouns.'],
    de: ['Ihr nächster Schritt', 'auf Französisch.', 'Vom Alltag zu Ihren eigenen Ideen: Entdecken Sie das A2-Lehrbuch und alles, was das Programm umfasst.', 'Verben auf -er konjugieren, über den eigenen Alltag sprechen und Subjektpronomen verwenden.']
  },
  b1: {
    es: ['Exprésate con independencia', 'en francés.', 'De dar tu opinión a argumentar con matices, con preparación al TCF Canadá: explora el manual B1 y todo lo que incluye el programa.', 'Reactiva los cuatro tiempos básicos del A2 y sitúa una acción en el presente, el pasado o el futuro. La unidad empieza con un diagnóstico de entrada de 15 minutos.'],
    fr: ['Exprimez-vous en autonomie', 'en français.', 'De l’opinion à l’argumentation nuancée, avec préparation au TCF Canada : explorez le manuel B1 et tout ce que comprend le programme.', 'Réactiver les quatre temps de base de l’A2 et situer une action dans le présent, le passé ou l’avenir. L’unité s’ouvre sur un diagnostic d’entrée de 15 minutes.'],
    en: ['Express yourself independently', 'in French.', 'From giving your opinion to nuanced argument, with TCF Canada preparation: explore the B1 textbook and everything the program includes.', 'Reactivate the four core A2 tenses and place an action in the present, past or future. The unit opens with a 15-minute entry diagnostic.'],
    de: ['Drücken Sie sich selbstständig aus', 'auf Französisch.', 'Von der eigenen Meinung zur differenzierten Argumentation, mit Vorbereitung auf den TCF Canada: Entdecken Sie das B1-Lehrbuch und alles, was das Programm umfasst.', 'Die vier Grundzeiten des A2 reaktivieren und eine Handlung in Gegenwart, Vergangenheit oder Zukunft verorten. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose.']
  },
  b2: {
    es: ['Argumenta con matices', 'en francés.', 'Del matiz al discurso complejo, con preparación al TCF Canadá: explora el manual B2 y todo lo que incluye el programa.', 'Consolida el sistema de tiempos del B1 y encadena tus ideas con conectores complejos. La unidad empieza con un diagnóstico de entrada al B2 de 15 minutos.'],
    fr: ['Argumentez avec nuance', 'en français.', 'De la nuance au discours complexe, avec préparation au TCF Canada : explorez le manuel B2 et tout ce que comprend le programme.', 'Consolider le système des temps du B1 et enchaîner ses idées avec des connecteurs complexes. L’unité s’ouvre sur un diagnostic d’entrée en B2 de 15 minutes.'],
    en: ['Argue with nuance', 'in French.', 'From nuance to complex discourse, with TCF Canada preparation: explore the B2 textbook and everything the program includes.', 'Consolidate the B1 tense system and link your ideas with complex connectors. The unit opens with a 15-minute B2 entry diagnostic.'],
    de: ['Argumentieren Sie differenziert', 'auf Französisch.', 'Von der Nuance zum komplexen Diskurs, mit Vorbereitung auf den TCF Canada: Entdecken Sie das B2-Lehrbuch und alles, was das Programm umfasst.', 'Das Zeitensystem des B1 festigen und Gedanken mit komplexen Konnektoren verknüpfen. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose für B2.']
  }
};

export const esc = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function between(markup, start, end, label) {
  const from = markup.indexOf(start);
  const to = from < 0 ? -1 : markup.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`V4 ${label} not found`);
  return markup.slice(from, to + end.length);
}

// Reuse the V4 home header and footer of the language so navigation, legal
// links and the language switcher stay identical across V4 pages.
// hrefFor(code) gives the same page in another language.
export function v4Chrome(homeMarkup, lang, hrefFor) {
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
    .replace(/<a href="[^"]*" lang="(es|fr|en|de)"/g, (_, code) => `<a href="${hrefFor(code)}" lang="${code}"${code === lang ? ' aria-current="page"' : ''}`));
  return { header, footer, icons };
}

const chrome = (homeMarkup, lang, level) => v4Chrome(homeMarkup, lang, code => programPath(code, level));

function readerManifest(source) {
  const match = source.match(/window\.PathwayManualPages\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) throw new Error('Unreadable manual pages manifest');
  return JSON.parse(match[1]);
}

// What a student receives with each level, in display order. The value is the
// page shown as a sample (assets/manual-<level>/<value>.webp: a reader page,
// or one page of an exam booklet in samples/), 'campus' for the Campus
// screenshot, or null when no sample page exists yet.
// Inventory checked against the Drive documents (manuals, exam booklets).
const INCLUDED = {
  a1: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-6', vocabulary: 'reader/unite-1-7', assessments: 'reader/examen-a-1', complementary: 'samples/complementaire', campus: 'campus' },
  a2: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-4', comprehension: 'reader/unite-1-5', vocabulary: 'reader/unite-1-6', diagnostic: 'samples/diagnostic', assessments: 'reader/examen-a-1', complementary: 'samples/complementaire', campus: 'campus' },
  b1: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-6', vocabulary: 'reader/unite-1-7', diagnostic: 'reader/unite-1-1', assessments: 'reader/examen-a-1', complementary: null, tcf: 'samples/tcf', campus: 'campus' },
  b2: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-7', vocabulary: 'reader/unite-1-8', diagnostic: 'reader/unite-1-1', assessments: 'reader/examen-a-1', complementary: null, tcf: 'samples/tcf', campus: 'campus' }
};
// Not available yet: the Campus opens to students once all levels are ready.
const COMING_SOON = new Set(['campus']);
const INCLUDED_ICONS = { manual: 'i-book', exercises: 'i-pen', comprehension: 'i-headphones', vocabulary: 'i-cards', diagnostic: 'i-target', assessments: 'i-clipboard', complementary: 'i-check', tcf: 'i-maple', campus: 'i-laptop' };
export const CAMPUS_SAMPLE = '/v4/assets/campus-apercu.webp';

function included(t, level) {
  const L = level.toUpperCase();
  const cards = Object.entries(INCLUDED[level]).map(([key, sample]) => {
    const [name, text] = t.inc.items[key];
    const src = sample === 'campus' ? CAMPUS_SAMPLE : sample && `/assets/manual-${level}/${sample}.webp`;
    const soon = COMING_SOON.has(key) ? `<span class="inc-soon">${t.inc.soon}</span>` : '';
    const button = src ? `<button type="button" class="inc-sample" data-sample="${src}" data-title="${esc(`${name} · Pathway ${L}`)}"><svg class="icon" aria-hidden="true"><use href="#i-zoom"/></svg>${t.inc.sample}</button>` : '';
    return `<li class="inc-item"><span class="inc-icon"><svg class="icon" aria-hidden="true"><use href="#${INCLUDED_ICONS[key]}"/></svg></span><div>${soon}<h3>${esc(name)}</h3><p>${esc(text)}</p>${button}</div></li>`;
  }).join('');
  return `<section id="incluido" class="pgm-included" aria-labelledby="included-title">
      <div class="container">
        <div class="inc-head"><p class="eyebrow">${t.inc.eyebrow}</p><h2 id="included-title" lang="fr">Manuel de français, <span>niveau ${L}</span></h2><p>${esc(t.inc.lead)}</p></div>
        <ul class="inc-grid">${cards}</ul>
        <a class="inc-next" href="#manual">${t.inc.next} <span aria-hidden="true">↓</span></a>
      </div>
    </section>
    <dialog id="doc-sample" class="doc-sample" aria-labelledby="doc-sample-title"><header><span id="doc-sample-title"></span><button type="button" data-close>${t.inc.close}</button></header><img alt="" decoding="async"></dialog>`;
}

export function renderProgramPage({ lang, level, data, pages, homeMarkup }) {
  const t = UI[lang];
  const L = level.toUpperCase();
  const [h1a, h1b, lead] = COPY[level][lang];
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
  const levels = LEVELS.map(code => `<a href="${programPath(lang, code)}"${code === level ? ' aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('');
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

    ${included(t, level)}

    <section id="manual" class="reader-shell" aria-label="${esc(t.yourManual)} ${L}">
      <div class="reader-heading"><div><span>${esc(t.library)}</span><h2>${esc(t.yourManual)} <b>${L}</b></h2></div><a href="/assets/manual-${level}/reader/manuel-${level}-extraits.pdf" download>${t.download} <span aria-hidden="true">↓</span></a></div>
      <div class="reader-toolbar"><label for="chapter">${t.goTo} <select id="chapter">${options}</select></label><div class="reader-toolbar-actions"><button type="button" id="zoom-open" aria-label="${esc(t.zoomLabel)}">${t.zoom}</button><button type="button" id="fullscreen-open" class="reader-fullscreen-trigger" aria-pressed="false" aria-label="${esc(t.openFullscreen)}"><span id="fullscreen-label">${t.fullscreen}</span><span id="fullscreen-icon" aria-hidden="true">↗</span></button></div></div>
      <div class="book-desk"><div class="book is-closed" id="book" data-level="${L}" data-i18n="${esc(JSON.stringify(i18n))}" tabindex="0" role="region" aria-label="${esc(t.bookLabel(L))}"><div class="book-page left-page" id="left-page"></div><div class="book-page right-page" id="right-page"></div><div class="book-spine" aria-hidden="true"></div><div class="turning-leaf" id="leaf" aria-hidden="true"><div class="leaf-front"></div><div class="leaf-back"></div></div><button type="button" class="page-edge edge-left" id="edge-prev" aria-label="${t.prev}"><span>‹</span></button><button type="button" class="page-edge edge-right" id="edge-next" aria-label="${t.next}"><span>›</span></button><button type="button" class="book-cover" id="cover" aria-label="${esc(t.openBook(L))}"><img src="/assets/manual-${level}/cover.webp" alt="Manuel de français — niveau ${L}" fetchpriority="high"><span>${t.openCta}</span></button></div></div>
      <div class="reader-controls"><button id="previous" type="button" aria-label="${t.prev}">←</button><div><p id="page-label" aria-live="polite" aria-atomic="true">${t.opening}</p><span id="reader-hint">${t.hint}</span></div><button id="next" type="button" aria-label="${t.next}">→</button></div><div class="reader-progress" aria-hidden="true"><span id="progress"></span></div>
      <div class="reader-bottom"><button type="button" id="close-book">${t.backCover}</button><a href="#incluido">${t.readAll}</a><span>${t.original}</span></div>
    </section>
    <dialog id="page-zoom" aria-label="${esc(t.zoomed)}"><header><span id="zoom-label">Manuel ${L}</span><button id="zoom-close" type="button" aria-label="${esc(t.closeZoom)}">${t.close}</button></header><div id="zoom-content"></div></dialog>

    <section class="pgm-cta" aria-labelledby="pgm-cta-title">
      <div class="container pgm-cta-inner"><div><p class="eyebrow">${t.ctaEyebrow}</p><h2 id="pgm-cta-title">${t.ctaTitle}</h2><p>${t.ctaText}</p></div><a class="button button-primary" href="${test}" data-cta="v4-program-${level}-closing">${t.evaluate} <span aria-hidden="true">→</span></a></div>
    </section>
  </main>
  ${footer}
  <script src="/assets/manual-${level}/reader/pages.js?v=${READER_VERSION}"></script>
  <script src="/manual-a2.js?v=${READER_VERSION}"></script>
  <script src="/v4/programa-docs.js?v=${READER_VERSION}" defer></script>
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
