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
const READER_VERSION = 'reader-10';
const SITE_ORIGIN = 'https://pathway-languages.com';

export const prefix = lang => (lang === 'es' ? '/v4/' : `/v4/${lang}/`);
// Program folder per language: /programas/<level>/ in Spanish and French,
// /en/programs/<level>/ and /de/programme/<level>/ (the former
// /en/programas/… and /de/programas/… addresses redirect).
export const PROGRAM_DIRS = { es: 'programas', fr: 'programas', en: 'programs', de: 'programme' };
export const programPath = (lang, level) => `${prefix(lang)}${PROGRAM_DIRS[lang]}/${level}/`;

const UI = {
  es: {
    htmlLang: 'es', home: 'Inicio', programs: 'Programas', program: 'Programa',
    title: level => `Programa ${level} · El manual Pathway`,
    eyebrow: level => `Programa de francés · nivel ${level}`,
    openManual: 'Abrir el manual', evaluate: 'Evaluar mi nivel', levelsLabel: 'Otros niveles',
    facts: ['unidades', 'segmentos', 'evaluaciones de segmento', 'exámenes de práctica'],
    yourManual: 'Tu manual de francés', download: 'Descargar los extractos',
    goTo: 'Ir a', zoom: 'Ampliar página', zoomLabel: 'Ampliar la página actual', fullscreen: 'Pantalla completa', exit: 'Salir',
    openFullscreen: 'Abrir el manual en pantalla completa', closeFullscreen: 'Salir de la pantalla completa',
    bookLabel: level => `Manual ${level}. Usa las flechas del teclado para pasar las páginas.`,
    prev: 'Página anterior', next: 'Página siguiente', openBook: level => `Abrir el manual ${level}`, openCta: 'Abrir el manual →',
    opening: 'Abriendo el manual…', hint: 'Desliza o toca el borde para pasar la página', hintPointer: 'Usa las flechas o haz clic en el borde de la página', backCover: 'Volver a la portada',
    readAll: 'Ver lo que incluye', zoomed: 'Página ampliada', close: 'Cerrar ✕', closeZoom: 'Cerrar la página ampliada',
    chapters: { 'table-matieres': 'Tabla de contenidos', sommaire: 'Índice detallado', 'unite-1': 'Unidad 1', 'examen-a': 'Evaluación del segmento A', autoevaluation: 'Autoevaluación' },
    page: 'página', pages: 'páginas', manualWord: 'manual',
    manualTitle: L => ['Manual de francés,', `nivel ${L}`],
    cover: L => ({ kicker: `Manual de francés · ${L}`, excerpt: 'Extractos del manual original.', units: '64 unidades · 4 segmentos' }),
    inc: {
      eyebrow: 'Incluido en este programa', lead: 'Todo lo que recibes al empezar el nivel. Aquí puedes ver una página de ejemplo de cada documento.', original: 'Título original:',
      sample: 'Ver un ejemplo', next: 'Hojea el extracto del manual a continuación', close: 'Cerrar ✕',
      items: {
        manual: ['Manual del alumno', '64 unidades en 4 segmentos, con la misma progresión.'],
        exercises: ['Ejercicios de práctica', 'Cinco ejercicios por unidad para fijar la gramática.'],
        comprehension: ['Comprensión escrita y oral', 'Un texto y una escucha con preguntas en cada unidad.'],
        vocabulary: ['Vocabulario clave', 'Unas diez palabras clave al final de cada unidad.'],
        diagnostic: ['Diagnóstico de entrada', '15 minutos para comprobar tus bases al empezar.'],
        assessments: ['4 evaluaciones de segmento', 'Una por segmento, sobre 100 puntos, en las 4 competencias.'],
        complementary: ['2 exámenes de lengua y vocabulario', 'Gramática y vocabulario, unidades 1\u2060–\u206032 y 33\u2060–\u206064.'],
        tcf: ['Simulacro TEF Canada o TCF Canada', 'Las 4 pruebas en el formato de tu examen.'],
        campus: ['Campus Pathway', 'Ejercicios por unidad, tu manual en línea que se abre clase a clase, simulacros TEF y TCF Canada, y las grabaciones de tus clases.']
      }
    },
    ctaTitle: 'Encuentra tu punto de partida.', ctaEyebrow: '¿Listo para empezar?', ctaText: 'Un profesor confirma tu nivel y las prioridades del recorrido durante la evaluación inicial.'
  },
  fr: {
    htmlLang: 'fr', home: 'Accueil', programs: 'Programmes', program: 'Programme',
    title: level => `Programme ${level} · Le manuel Pathway`,
    eyebrow: level => `Programme de français · niveau ${level}`,
    openManual: 'Ouvrir le manuel', evaluate: 'Évaluer mon niveau', levelsLabel: 'Autres niveaux',
    facts: ['unités', 'segments', 'évaluations de segment', 'examens d’entraînement'],
    yourManual: 'Votre manuel de français', download: 'Télécharger les extraits',
    goTo: 'Aller à', zoom: 'Agrandir la page', zoomLabel: 'Agrandir la page actuelle', fullscreen: 'Plein écran', exit: 'Quitter',
    openFullscreen: 'Ouvrir le manuel en plein écran', closeFullscreen: 'Quitter le plein écran',
    bookLabel: level => `Manuel ${level}. Utilisez les flèches du clavier pour tourner les pages.`,
    prev: 'Page précédente', next: 'Page suivante', openBook: level => `Ouvrir le manuel ${level}`, openCta: 'Ouvrir le manuel →',
    opening: 'Ouverture du manuel…', hint: 'Faites glisser ou touchez le bord pour tourner la page', hintPointer: 'Utilisez les flèches ou cliquez sur le bord de la page', backCover: 'Revenir à la couverture',
    readAll: 'Voir ce qui est inclus', zoomed: 'Page agrandie', close: 'Fermer ✕', closeZoom: 'Fermer la page agrandie',
    chapters: { 'table-matieres': 'Table des matières', sommaire: 'Sommaire détaillé', 'unite-1': 'Unité 1', 'examen-a': 'Évaluation du segment A', autoevaluation: 'Auto-évaluation' },
    page: 'page', pages: 'pages', manualWord: 'manuel',
    manualTitle: L => ['Manuel de français,', `niveau ${L}`],
    cover: L => ({ kicker: `Manuel de français · ${L}`, excerpt: 'Extraits du manuel original.', units: '64 unités · 4 segments' }),
    inc: {
      eyebrow: 'Inclus dans ce programme', lead: 'Tout ce que vous recevez en commençant le niveau. Voici une page d’exemple de chaque document.', original: 'Titre original :',
      sample: 'Voir un exemple', next: 'Feuilletez l’extrait du manuel ci-dessous', close: 'Fermer ✕',
      items: {
        manual: ['Manuel de l’élève', '64 unités en 4 segments, avec la même progression.'],
        exercises: ['Exercices d’entraînement', 'Cinq exercices par unité pour fixer la grammaire.'],
        comprehension: ['Compréhension écrite et orale', 'Un texte et une écoute avec questions dans chaque unité.'],
        vocabulary: ['Vocabulaire clé', 'Une dizaine de mots clés à la fin de chaque unité.'],
        diagnostic: ['Diagnostic d’entrée', '15 minutes pour vérifier vos bases au départ.'],
        assessments: ['4 évaluations de segment', 'Une par segment, sur 100 points, dans les 4 compétences.'],
        complementary: ['2 examens de langue et de vocabulaire', 'Grammaire et vocabulaire, unités 1\u2060–\u206032 et 33\u2060–\u206064.'],
        tcf: ['Examen blanc TEF Canada ou TCF Canada', 'Les 4 épreuves au format de votre examen.'],
        campus: ['Campus Pathway', 'Des exercices par unité, votre manuel en ligne qui s’ouvre cours après cours, des examens blancs TEF et TCF Canada, et les enregistrements de vos cours.']
      }
    },
    ctaTitle: 'Trouvez votre point de départ.', ctaEyebrow: 'Prêt à commencer ?', ctaText: 'Un enseignant confirme votre niveau et les priorités du parcours lors de l’évaluation initiale.'
  },
  en: {
    htmlLang: 'en', home: 'Home', programs: 'Programs', program: 'Program',
    title: level => `${level} program · The Pathway textbook`,
    eyebrow: level => `French program · level ${level}`,
    openManual: 'Open the textbook', evaluate: 'Assess my level', levelsLabel: 'Other levels',
    facts: ['units', 'segments', 'segment assessments', 'practice exams'],
    yourManual: 'Your French textbook', download: 'Download the excerpts',
    goTo: 'Go to', zoom: 'Enlarge page', zoomLabel: 'Enlarge the current page', fullscreen: 'Full screen', exit: 'Exit',
    openFullscreen: 'Open the textbook in full screen', closeFullscreen: 'Exit full screen',
    bookLabel: level => `${level} textbook. Use the arrow keys to turn the pages.`,
    prev: 'Previous page', next: 'Next page', openBook: level => `Open the ${level} textbook`, openCta: 'Open the textbook →',
    opening: 'Opening the textbook…', hint: 'Swipe or tap the edge to turn the page', hintPointer: 'Use the arrow keys or click the edge of the page', backCover: 'Back to the cover',
    readAll: 'See what is included', zoomed: 'Enlarged page', close: 'Close ✕', closeZoom: 'Close the enlarged page',
    chapters: { 'table-matieres': 'Table of contents', sommaire: 'Detailed contents', 'unite-1': 'Unit 1', 'examen-a': 'Segment A assessment', autoevaluation: 'Self-assessment' },
    page: 'page', pages: 'pages', manualWord: 'textbook',
    manualTitle: L => ['French textbook,', `level ${L}`],
    cover: L => ({ kicker: `French textbook · ${L}`, excerpt: 'Excerpts from the original textbook.', units: '64 units · 4 segments' }),
    inc: {
      eyebrow: 'Included in this program', lead: 'Everything you receive when you start the level. Here is a sample page of each document.', original: 'Original title:',
      sample: 'See a sample', next: 'Browse the textbook excerpt below', close: 'Close ✕',
      items: {
        manual: ['Student textbook', '64 units in 4 segments, all with the same progression.'],
        exercises: ['Practice exercises', 'Five exercises per unit to lock in the grammar.'],
        comprehension: ['Reading and listening', 'A text and a listening task with questions in every unit.'],
        vocabulary: ['Key vocabulary', 'About ten key words at the end of each unit.'],
        diagnostic: ['Entry diagnostic', '15 minutes to check your foundations at the start.'],
        assessments: ['4 segment assessments', 'One per segment, out of 100, across all 4 skills.'],
        complementary: ['2 language and vocabulary exams', 'Grammar and vocabulary, units 1\u2060–\u206032 and 33\u2060–\u206064.'],
        tcf: ['TEF Canada or TCF Canada mock exam', 'All 4 tests in the format of your exam.'],
        campus: ['Pathway Campus', 'Exercises for every unit, your online textbook that opens class by class, TEF and TCF Canada mock exams, and the recordings of your classes.']
      }
    },
    ctaTitle: 'Find your starting point.', ctaEyebrow: 'Ready to start?', ctaText: 'A teacher confirms your level and the priorities of your path during the initial assessment.'
  },
  de: {
    htmlLang: 'de', home: 'Startseite', programs: 'Programme', program: 'Programm',
    title: level => `${level}-Programm · Das Pathway-Lehrbuch`,
    eyebrow: level => `Französischprogramm · Niveau ${level}`,
    openManual: 'Lehrbuch öffnen', evaluate: 'Mein Niveau bestimmen', levelsLabel: 'Weitere Niveaus',
    facts: ['Einheiten', 'Segmente', 'Lernstandskontrollen', 'Übungsprüfungen'],
    yourManual: 'Ihr Französischlehrbuch', download: 'Auszüge herunterladen',
    goTo: 'Gehe zu', zoom: 'Seite vergrößern', zoomLabel: 'Aktuelle Seite vergrößern', fullscreen: 'Vollbild', exit: 'Beenden',
    openFullscreen: 'Lehrbuch im Vollbild öffnen', closeFullscreen: 'Vollbild beenden',
    bookLabel: level => `Lehrbuch ${level}. Mit den Pfeiltasten blättern Sie die Seiten um.`,
    prev: 'Vorherige Seite', next: 'Nächste Seite', openBook: level => `Lehrbuch ${level} öffnen`, openCta: 'Lehrbuch öffnen →',
    opening: 'Lehrbuch wird geöffnet…', hint: 'Wischen oder den Rand antippen, um umzublättern', hintPointer: 'Mit den Pfeiltasten oder per Klick auf den Seitenrand blättern', backCover: 'Zurück zum Umschlag',
    readAll: 'Was enthalten ist', zoomed: 'Vergrößerte Seite', close: 'Schließen ✕', closeZoom: 'Vergrößerte Seite schließen',
    chapters: { 'table-matieres': 'Inhaltsverzeichnis', sommaire: 'Ausführliche Übersicht', 'unite-1': 'Einheit 1', 'examen-a': 'Lernstandskontrolle Segment A', autoevaluation: 'Selbsteinschätzung' },
    page: 'Seite', pages: 'Seiten', manualWord: 'Lehrbuch',
    manualTitle: L => ['Französischlehrbuch,', `Niveau ${L}`],
    cover: L => ({ kicker: `Französischlehrbuch · ${L}`, excerpt: 'Auszüge aus dem Originallehrbuch.', units: '64 Einheiten · 4 Segmente' }),
    inc: {
      eyebrow: 'In diesem Programm enthalten', lead: 'Alles, was Sie zu Beginn des Niveaus erhalten. Hier sehen Sie von jedem Dokument eine Beispielseite.', original: 'Originaltitel:',
      sample: 'Beispiel ansehen', next: 'Blättern Sie unten im Auszug aus dem Lehrbuch', close: 'Schließen ✕',
      items: {
        manual: ['Lehrbuch für Lernende', '64 Einheiten in 4 Segmenten, alle mit demselben Aufbau.'],
        exercises: ['Übungen', 'Fünf Übungen pro Einheit, um die Grammatik zu festigen.'],
        comprehension: ['Lese- und Hörverstehen', 'Ein Text und ein Hörtext mit Fragen in jeder Einheit.'],
        vocabulary: ['Schlüsselwortschatz', 'Rund zehn Schlüsselwörter am Ende jeder Einheit.'],
        diagnostic: ['Eingangsdiagnose', '15 Minuten, um Ihre Grundlagen zu Beginn zu prüfen.'],
        assessments: ['4 Lernstandskontrollen', 'Eine pro Segment, auf 100 Punkte, in allen 4 Kompetenzen.'],
        complementary: ['2 Sprach- und Wortschatzprüfungen', 'Grammatik und Wortschatz, Einheiten 1\u2060–\u206032 und 33\u2060–\u206064.'],
        tcf: ['Probeprüfung TEF Canada oder TCF Canada', 'Alle 4 Prüfungsteile im Format Ihrer Prüfung.'],
        campus: ['Pathway-Campus', 'Übungen zu jeder Einheit, Ihr Online-Lehrbuch, das sich Stunde für Stunde öffnet, Probeprüfungen für TEF und TCF Canada und die Aufzeichnungen Ihrer Stunden.']
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
    es: ['Exprésate con independencia', 'en francés.', 'De dar tu opinión a argumentar con matices, con preparación al TEF Canada y al TCF Canada: explora el manual B1 y todo lo que incluye el programa.', 'Reactiva los cuatro tiempos básicos del A2 y sitúa una acción en el presente, el pasado o el futuro. La unidad empieza con un diagnóstico de entrada de 15 minutos.'],
    fr: ['Exprimez-vous en autonomie', 'en français.', 'De l’opinion à l’argumentation nuancée, avec préparation au TEF Canada et au TCF Canada : explorez le manuel B1 et tout ce que comprend le programme.', 'Réactiver les quatre temps de base de l’A2 et situer une action dans le présent, le passé ou l’avenir. L’unité s’ouvre sur un diagnostic d’entrée de 15 minutes.'],
    en: ['Express yourself independently', 'in French.', 'From giving your opinion to nuanced argument, with TEF Canada and TCF Canada preparation: explore the B1 textbook and everything the program includes.', 'Reactivate the four core A2 tenses and place an action in the present, past or future. The unit opens with a 15-minute entry diagnostic.'],
    de: ['Drücken Sie sich selbstständig aus', 'auf Französisch.', 'Von der Meinung zur differenzierten Argumentation, mit Vorbereitung auf TEF und TCF Canada: Entdecken Sie das B1-Lehrbuch und das ganze Programm.', 'Die vier Grundzeiten des A2 reaktivieren und eine Handlung in Gegenwart, Vergangenheit oder Zukunft verorten. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose.']
  },
  b2: {
    es: ['Argumenta con matices', 'en francés.', 'Del matiz al discurso complejo, con preparación al TEF Canada y al TCF Canada: explora el manual B2 y todo lo que incluye el programa.', 'Consolida el sistema de tiempos del B1 y encadena tus ideas con conectores complejos. La unidad empieza con un diagnóstico de entrada al B2 de 15 minutos.'],
    fr: ['Argumentez avec nuance', 'en français.', 'De la nuance au discours complexe, avec préparation au TEF Canada et au TCF Canada : explorez le manuel B2 et tout ce que comprend le programme.', 'Consolider le système des temps du B1 et enchaîner ses idées avec des connecteurs complexes. L’unité s’ouvre sur un diagnostic d’entrée en B2 de 15 minutes.'],
    en: ['Argue with nuance', 'in French.', 'From nuance to complex discourse, with TEF Canada and TCF Canada preparation: explore the B2 textbook and everything the program includes.', 'Consolidate the B1 tense system and link your ideas with complex connectors. The unit opens with a 15-minute B2 entry diagnostic.'],
    de: ['Argumentieren Sie differenziert', 'auf Französisch.', 'Von der Nuance zum komplexen Diskurs, mit Vorbereitung auf TEF Canada und TCF Canada: Entdecken Sie das B2-Lehrbuch und alles, was das Programm umfasst.', 'Das Zeitensystem des B1 festigen und Gedanken mit komplexen Konnektoren verknüpfen. Die Einheit beginnt mit einer 15-minütigen Eingangsdiagnose für B2.']
  }
};

// French typography: narrow no-break space (U+202F) before ; ! ? and inside
// « », no-break space (U+00A0) before : and %. Applied to French text only,
// never inside tags, scripts or styles.
const NNBSP = '\u202F', NBSP = '\u00A0';
export const typoText = (lang, text) => (lang !== 'fr' ? text : String(text)
  .replace(/[ \u00A0\u202F]+([;!?])/g, `${NNBSP}$1`)
  .replace(/[ \u202F]+:/g, `${NBSP}:`)
  .replace(/«[ \u00A0\u202F]*/g, `«${NNBSP}`)
  .replace(/[ \u00A0\u202F]*»/g, `${NNBSP}»`)
  .replace(/(\d)[ \u202F]%/g, `$1${NBSP}%`));
// In every language, "NCLC 7" never breaks between its two parts.
export const typo = (lang, html) => html
  .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/)
  .map((part, index) => (index % 2 ? part : typoText(lang, part).replace(/NCLC (\d)/g, `NCLC${NBSP}$1`)))
  .join('');
const typoDeep = (lang, value) => (typeof value === 'string' ? typoText(lang, value)
  : Array.isArray(value) ? value.map(item => typoDeep(lang, item))
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typoDeep(lang, item)])) : value);

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
  a2: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-6', vocabulary: 'reader/unite-1-7', diagnostic: 'reader/unite-1-1', assessments: 'reader/examen-a-1', complementary: 'samples/complementaire', campus: 'campus' },
  b1: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-6', vocabulary: 'reader/unite-1-7', diagnostic: 'reader/unite-1-1', assessments: 'reader/examen-a-1', complementary: 'samples/complementaire', tcf: 'samples/tcf', campus: 'campus' },
  b2: { manual: 'reader/table-matieres-1', exercises: 'reader/unite-1-3', comprehension: 'reader/unite-1-7', vocabulary: 'reader/unite-1-8', diagnostic: 'reader/unite-1-1', assessments: 'reader/examen-a-1', complementary: 'samples/complementaire', tcf: 'samples/tcf', campus: 'campus' }
};
const INCLUDED_ICONS = { manual: 'i-book', exercises: 'i-pen', comprehension: 'i-headphones', vocabulary: 'i-cards', diagnostic: 'i-target', assessments: 'i-clipboard', complementary: 'i-check', tcf: 'i-maple', campus: 'i-laptop' };
export const CAMPUS_SAMPLE = '/v4/assets/campus-apercu.webp';

// Guided tour of the textbook (v4/reader.js). Spot positions per level are in
// v4/data/tours/<level>.json, computed from the text of the excerpt PDFs: each
// spot sits right after a section title. Texts are the same for every level.
const TOUR = {
  es: {
    label: 'Visita guiada', next: 'Siguiente', prev: 'Anterior', done: 'Terminar', close: 'Cerrar', chaptersLabel: 'Capítulos del extracto',
    tabs: { contents: 'Contenido', unit: 'Unidad 1', exam: 'Evaluación', after: 'Después' },
    lockedTitle: 'Y 63 unidades más', lockedText: L => `Tu programa ${L} continúa hasta la unidad 64, con 3 segmentos más y su evaluación final.`,
    ctaKicker: 'Tu próximo paso', ctaTitle: 'Empieza con un profesor Pathway.', ctaText: 'Un profesor evalúa tu nivel y te dice por dónde empezar.',
    spots: {
      segments: ['4 segmentos, 64 unidades', 'El programa avanza en 4 etapas de 16 unidades. Cada una termina con una evaluación.'],
      objectives: ['Objetivos claros', 'Cada unidad empieza diciendo qué vas a aprender y qué necesitas saber antes.'],
      diagnostic: ['Diagnóstico de entrada', '15 minutos para comprobar tus bases del nivel anterior. Si algo falla, tu profesor te dice qué repasar.'],
      situation: ['A · Situación', 'Una ilustración y un texto presentan el tema de la unidad en una situación real.'],
      observation: ['B · Observación', 'Descubres la regla tú mismo a partir de ejemplos, antes de que te la expliquen.'],
      explanation: ['C · Explicación', 'La regla en tablas claras, con las trampas frecuentes señaladas.'],
      guided: ['D · Ejercicios guiados', 'Practicas la regla paso a paso, con frases de la vida diaria.'],
      illustrations: ['Ilustraciones originales', 'Imágenes creadas para Pathway, para practicar el vocabulario hablando.'],
      consolidation: ['E · Consolidación', 'Textos con huecos y preguntas para fijar lo aprendido.'],
      reuse: ['F · Reutilización', 'Escribes tus propias frases: el paso de saber la regla a usarla.'],
      speaking: ['G · Producción oral', 'Hablas con tu profesor en clase, sobre el tema de la unidad.'],
      reading: ['H · Comprensión escrita', 'Un texto con preguntas, como en el TEF y el TCF.'],
      listening: ['I · Comprensión oral', 'Tu profesor lee un documento y respondes: entrenas el oído desde el principio.'],
      vocabulary: ['J · Vocabulario clave', 'Unas diez palabras para retener al final de cada unidad.'],
      assessment: ['Evaluación del segmento', 'Al final de cada segmento: 100 puntos en las 4 competencias del TEF y del TCF.']
    }
  },
  fr: {
    label: 'Visite guidée', next: 'Suivant', prev: 'Précédent', done: 'Terminer', close: 'Fermer', chaptersLabel: 'Chapitres de l’extrait',
    tabs: { contents: 'Sommaire', unit: 'Unité 1', exam: 'Évaluation', after: 'Ensuite' },
    lockedTitle: 'Et 63 unités de plus', lockedText: L => `Votre programme ${L} continue jusqu’à l’unité 64 : 3 segments de plus et l’évaluation finale.`,
    ctaKicker: 'Votre prochaine étape', ctaTitle: 'Commencez avec un enseignant Pathway.', ctaText: 'Un enseignant évalue votre niveau et vous dit par où commencer.',
    spots: {
      segments: ['4 segments, 64 unités', 'Le programme avance en 4 étapes de 16 unités. Chacune se termine par une évaluation.'],
      objectives: ['Des objectifs clairs', 'Chaque unité commence par ce que vous allez apprendre et ce qu’il faut savoir avant.'],
      diagnostic: ['Diagnostic d’entrée', '15 minutes pour vérifier vos bases du niveau précédent. En cas de lacune, votre enseignant vous dit quoi revoir.'],
      situation: ['A · Mise en situation', 'Une illustration et un texte présentent le thème de l’unité dans une situation réelle.'],
      observation: ['B · Observation', 'Vous découvrez la règle vous-même à partir d’exemples, avant qu’on vous l’explique.'],
      explanation: ['C · Explication', 'La règle en tableaux clairs, avec les pièges fréquents signalés.'],
      guided: ['D · Exercices guidés', 'Vous pratiquez la règle pas à pas, avec des phrases du quotidien.'],
      illustrations: ['Des illustrations originales', 'Des images créées pour Pathway, pour pratiquer le vocabulaire à l’oral.'],
      consolidation: ['E · Consolidation', 'Textes à trous et questions pour ancrer ce que vous avez appris.'],
      reuse: ['F · Réinvestissement', 'Vous écrivez vos propres phrases : on passe de connaître la règle à l’utiliser.'],
      speaking: ['G · Production orale', 'Vous parlez avec votre enseignant en cours, sur le thème de l’unité.'],
      reading: ['H · Compréhension écrite', 'Un texte avec des questions, comme au TEF et au TCF.'],
      listening: ['I · Compréhension orale', 'Votre enseignant lit un document et vous répondez : l’oreille s’entraîne dès le début.'],
      vocabulary: ['J · Vocabulaire clé', 'Une dizaine de mots à retenir à la fin de chaque unité.'],
      assessment: ['Évaluation du segment', 'À la fin de chaque segment : 100 points dans les 4 compétences du TEF et du TCF.']
    }
  },
  en: {
    label: 'Guided tour', next: 'Next', prev: 'Back', done: 'Finish', close: 'Close', chaptersLabel: 'Excerpt chapters',
    tabs: { contents: 'Contents', unit: 'Unit 1', exam: 'Assessment', after: 'What’s next' },
    lockedTitle: 'And 63 more units', lockedText: L => `Your ${L} program continues up to unit 64: 3 more segments and the final assessment.`,
    ctaKicker: 'Your next step', ctaTitle: 'Start with a Pathway teacher.', ctaText: 'A teacher assesses your level and tells you where to start.',
    spots: {
      segments: ['4 segments, 64 units', 'The program moves forward in 4 stages of 16 units. Each one ends with an assessment.'],
      objectives: ['Clear objectives', 'Every unit starts with what you will learn and what you need to know beforehand.'],
      diagnostic: ['Entry diagnostic', '15 minutes to check your foundations from the previous level. If something is missing, your teacher tells you what to review.'],
      situation: ['A · Situation', 'An illustration and a text introduce the unit’s topic in a real-life situation.'],
      observation: ['B · Observation', 'You work out the rule yourself from examples, before it is explained.'],
      explanation: ['C · Explanation', 'The rule in clear tables, with common pitfalls flagged.'],
      guided: ['D · Guided exercises', 'You practise the rule step by step, with everyday sentences.'],
      illustrations: ['Original illustrations', 'Images created for Pathway, to practise vocabulary out loud.'],
      consolidation: ['E · Consolidation', 'Gap-fill texts and questions to lock in what you have learned.'],
      reuse: ['F · Application', 'You write your own sentences: from knowing the rule to using it.'],
      speaking: ['G · Speaking', 'You talk with your teacher in class about the unit’s topic.'],
      reading: ['H · Reading', 'A text with questions, just like in the TEF and TCF.'],
      listening: ['I · Listening', 'Your teacher reads a document and you answer: your ear trains from day one.'],
      vocabulary: ['J · Key vocabulary', 'About ten words to remember at the end of each unit.'],
      assessment: ['Segment assessment', 'At the end of each segment: 100 points across the 4 TEF and TCF skills.']
    }
  },
  de: {
    label: 'Geführte Tour', next: 'Weiter', prev: 'Zurück', done: 'Beenden', close: 'Schließen', chaptersLabel: 'Kapitel des Auszugs',
    tabs: { contents: 'Inhalt', unit: 'Einheit 1', exam: 'Kontrolle', after: 'Danach' },
    lockedTitle: 'Und 63 weitere Einheiten', lockedText: L => `Ihr ${L}-Programm geht bis Einheit 64 weiter: 3 weitere Segmente und die Abschlusskontrolle.`,
    ctaKicker: 'Ihr nächster Schritt', ctaTitle: 'Starten Sie mit einer Pathway-Lehrkraft.', ctaText: 'Eine Lehrkraft stuft Ihr Niveau ein und sagt Ihnen, wo Sie beginnen.',
    spots: {
      segments: ['4 Segmente, 64 Einheiten', 'Das Programm verläuft in 4 Etappen zu je 16 Einheiten. Jede endet mit einer Lernstandskontrolle.'],
      objectives: ['Klare Ziele', 'Jede Einheit beginnt damit, was Sie lernen und was Sie vorher wissen sollten.'],
      diagnostic: ['Eingangsdiagnose', '15 Minuten, um Ihre Grundlagen aus dem vorherigen Niveau zu prüfen. Bei Lücken sagt Ihnen Ihre Lehrkraft, was Sie wiederholen sollten.'],
      situation: ['A · Situation', 'Eine Illustration und ein Text führen das Thema der Einheit in einer echten Situation ein.'],
      observation: ['B · Beobachtung', 'Sie entdecken die Regel selbst anhand von Beispielen, bevor sie erklärt wird.'],
      explanation: ['C · Erklärung', 'Die Regel in klaren Tabellen, mit Hinweisen auf häufige Fallen.'],
      guided: ['D · Angeleitete Übungen', 'Sie üben die Regel Schritt für Schritt, mit Sätzen aus dem Alltag.'],
      illustrations: ['Eigene Illustrationen', 'Für Pathway gestaltete Bilder, um den Wortschatz mündlich zu üben.'],
      consolidation: ['E · Festigung', 'Lückentexte und Fragen, um das Gelernte zu verankern.'],
      reuse: ['F · Anwendung', 'Sie schreiben eigene Sätze: von der Regel zur Anwendung.'],
      speaking: ['G · Sprechen', 'Sie sprechen im Unterricht mit Ihrer Lehrkraft über das Thema der Einheit.'],
      reading: ['H · Leseverstehen', 'Ein Text mit Fragen, wie im TEF und TCF.'],
      listening: ['I · Hörverstehen', 'Ihre Lehrkraft liest einen Text vor und Sie antworten: Ihr Gehör trainiert von Anfang an.'],
      vocabulary: ['J · Schlüsselwortschatz', 'Rund zehn Wörter zum Merken am Ende jeder Einheit.'],
      assessment: ['Lernstandskontrolle', 'Am Ende jedes Segments: 100 Punkte in den 4 Kompetenzen von TEF und TCF.']
    }
  }
};

function tourData(lang, level, tour) {
  const k = TOUR[lang], L = level.toUpperCase();
  return {
    label: k.label, next: k.next, prev: k.prev, done: k.done, close: k.close, chaptersLabel: k.chaptersLabel,
    tabs: { 'table-matieres': k.tabs.contents, sommaire: k.tabs.contents, 'unite-1': k.tabs.unit, 'examen-a': k.tabs.exam, after: k.tabs.after },
    lockedTitle: k.lockedTitle, lockedText: k.lockedText(L), ctaKicker: k.ctaKicker, ctaTitle: k.ctaTitle, ctaText: k.ctaText,
    ctaButton: `${UI[lang].evaluate} →`,
    spots: tour.spots.map(({ key, page, x, y }) => ({ page, x, y, title: k.spots[key][0], text: k.spots[key][1] }))
  };
}
// JSON inside a <script>: escape "<" so no text can close the element.
const inlineJson = value => JSON.stringify(value).replace(/</g, '\\u003c');

// Desktop: v4/programa-docs.js moves copies of these cards through a 2 × 2
// window in a zigzag (styles in v4/programa.css, "has-flow").
function included(t, level) {
  const L = level.toUpperCase();
  const entries = Object.entries(INCLUDED[level]);
  const card = ([key, sample]) => {
    const [name, text] = t.inc.items[key];
    const src = sample === 'campus' ? CAMPUS_SAMPLE : sample && `/assets/manual-${level}/${sample}.webp`;
    const button = src ? `<button type="button" class="inc-sample" data-sample="${src}" data-title="${esc(`${name} · Pathway ${L}`)}"><svg class="icon" aria-hidden="true"><use href="#i-zoom"/></svg>${t.inc.sample}</button>` : '';
    return `<li class="inc-item"><span class="inc-icon"><svg class="icon" aria-hidden="true"><use href="#${INCLUDED_ICONS[key]}"/></svg></span><div><h3>${esc(name)}</h3><p>${esc(text)}</p>${button}</div></li>`;
  };
  const cards = entries.map(entry => card(entry)).join('');
  return `<section id="incluido" class="pgm-included" aria-labelledby="included-title">
      <div class="container inc-layout">
        <div class="inc-head"><p class="eyebrow">${t.inc.eyebrow}</p><h2 id="included-title">${esc(t.manualTitle(L)[0])} <span>${esc(t.manualTitle(L)[1])}</span></h2><p class="inc-original">${esc(t.inc.original)} <span lang="fr">Manuel de français · niveau ${L}</span></p><p>${esc(t.inc.lead)}</p></div>
        <ul class="inc-grid">${cards}</ul>
        <div class="inc-flow"></div>
        <a class="inc-next" href="#manual">${t.inc.next} <span aria-hidden="true">↓</span></a>
      </div>
    </section>
    <dialog id="doc-sample" class="doc-sample" aria-labelledby="doc-sample-title"><header><span id="doc-sample-title"></span><button type="button" data-close>${t.inc.close}</button></header><img alt="" decoding="async"></dialog>`;
}

export function renderProgramPage({ lang, level, data, pages, tour, homeMarkup }) {
  const t = UI[lang];
  const L = level.toUpperCase();
  const [h1a, h1b, lead] = COPY[level][lang];
  const { header, footer, icons } = chrome(homeMarkup, lang, level);
  const home = prefix(lang);
  const test = (homeMarkup.match(/class="button button-primary nav-cta" href="([^"]+)"/) || [])[1] || `${home}test-placement.html`;
  const starts = {};
  pages.forEach((page, index) => { if (!(page.key in starts)) starts[page.key] = index; });
  const chapterNames = t.chapters;
  const options = Object.keys(starts).map(key => `<option value="${starts[key]}">${esc(chapterNames[key] || key)}</option>`).join('');
  const i18n = {
    page: t.page, manual: t.manualWord, cta: `${t.evaluate} →`, ctaHref: test, fullscreen: t.fullscreen, exit: t.exit,
    openFullscreen: t.openFullscreen, closeFullscreen: t.closeFullscreen, chapters: chapterNames,
    cover: t.cover(L), hintTouch: t.hint, hintPointer: t.hintPointer,
    // 120 px thumbnails for the strip under the book (programas/<level>/thumbs/).
    thumbs: `/programas/${level}/thumbs/`
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
  <link rel="preload" href="/v4/assets/fonts/Outfit-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/v4/assets/fonts/DM-Sans-variable.woff2" as="font" type="font/woff2" crossorigin>
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
          <dl><div><dt>${t.facts[0]}</dt><dd>64</dd></div><div><dt>${t.facts[1]}</dt><dd>4</dd></div><div><dt>${t.facts[2]}</dt><dd>4</dd></div></dl>
          <nav class="pgm-levels" aria-label="${esc(t.levelsLabel)}">${levels}</nav>
        </aside>
      </div>
    </section>

    ${included(t, level)}

    <section id="manual" class="reader-shell" aria-label="${esc(t.yourManual)} ${L}">
      <div class="reader-toolbar"><label for="chapter">${t.goTo} <select id="chapter">${options}</select></label><div class="reader-toolbar-actions"><button type="button" id="zoom-open" aria-label="${esc(t.zoomLabel)}">${t.zoom}</button><button type="button" id="fullscreen-open" class="reader-fullscreen-trigger" aria-pressed="false" aria-label="${esc(t.openFullscreen)}"><span id="fullscreen-label">${t.fullscreen}</span><span id="fullscreen-icon" aria-hidden="true">↗</span></button></div></div>
      <div class="book-desk"><div class="book is-closed" id="book" data-level="${L}" data-i18n="${esc(JSON.stringify(i18n))}" tabindex="0" role="region" aria-label="${esc(t.bookLabel(L))}"><div class="book-page left-page" id="left-page"></div><div class="book-page right-page" id="right-page"></div><div class="book-spine" aria-hidden="true"></div><div class="turning-leaf" id="leaf" aria-hidden="true"><div class="leaf-front"></div><div class="leaf-back"></div></div><button type="button" class="page-edge edge-left" id="edge-prev" aria-label="${t.prev}"><span>‹</span></button><button type="button" class="page-edge edge-right" id="edge-next" aria-label="${t.next}"><span>›</span></button><button type="button" class="book-cover" id="cover" aria-label="${esc(t.openBook(L))}"><img src="/assets/manual-${level}/cover.webp" alt="Manuel de français — niveau ${L}" width="1191" height="1684" fetchpriority="high"><span>${t.openCta}</span></button></div></div>
      <div class="reader-controls"><button id="previous" type="button" aria-label="${t.prev}">←</button><div><p id="page-label" aria-live="polite" aria-atomic="true">${esc(t.cover(L).kicker)}</p><span id="reader-hint">${t.hint}</span></div><button id="next" type="button" aria-label="${t.next}">→</button></div><div class="reader-progress" aria-hidden="true"><span id="progress"></span></div>
      <div class="reader-bottom"><button type="button" id="close-book">${t.backCover}</button><a href="#incluido">${t.readAll}</a><a href="/assets/manual-${level}/reader/manuel-${level}-extraits.pdf" download>${t.download} · PDF ↓</a></div>
    </section>
    <dialog id="page-zoom" aria-label="${esc(t.zoomed)}"><header><span id="zoom-label">Manuel ${L}</span><button id="zoom-close" type="button" aria-label="${esc(t.closeZoom)}">${t.close}</button></header><div id="zoom-content"></div></dialog>

    <section class="pgm-cta" aria-labelledby="pgm-cta-title">
      <div class="container pgm-cta-inner"><div><p class="eyebrow">${t.ctaEyebrow}</p><h2 id="pgm-cta-title">${t.ctaTitle}</h2><p>${t.ctaText}</p></div><a class="button button-primary" href="${test}" data-cta="v4-program-${level}-closing">${t.evaluate} <span aria-hidden="true">→</span></a></div>
    </section>
  </main>
  ${footer}
  <script src="/assets/manual-${level}/reader/pages.js?v=${READER_VERSION}"></script>
  <script>window.PathwayTour = ${inlineJson(typoDeep(lang, tourData(lang, level, tour)))};</script>
  <script src="/v4/reader.js?v=${READER_VERSION}"></script>
  <script src="/v4/programa-docs.js?v=${READER_VERSION}" defer></script>
</body>
</html>
`;
}

export async function buildV4Programs({ outDir, rootDir }) {
  const written = [];
  for (const lang of LANGS) {
    const homeMarkup = await readFile(join(outDir, 'v4', lang === 'es' ? '' : lang, 'index.html'), 'utf8'); // built home: shared tail included
    for (const level of LEVELS) {
      const data = JSON.parse(await readFile(join(rootDir, 'v4', 'data', 'manuals', `${level}.json`), 'utf8'));
      const tour = JSON.parse(await readFile(join(rootDir, 'v4', 'data', 'tours', `${level}.json`), 'utf8'));
      const pages = readerManifest(await readFile(join(rootDir, 'assets', `manual-${level}`, 'reader', 'pages.js'), 'utf8'));
      // Every page of the excerpt needs its small thumbnail (programas/<level>/thumbs/).
      for (const page of pages) {
        const name = page.src.split('/').pop().replace(/\?.*$/, '');
        await readFile(join(rootDir, 'programas', level, 'thumbs', name)).catch(() => { throw new Error(`Missing thumbnail programas/${level}/thumbs/${name}`); });
      }
      const target = join(outDir, programPath(lang, level), 'index.html');
      await mkdir(dirname(target), { recursive: true });
      const markup = renderProgramPage({ lang, level, data, pages, tour, homeMarkup });
      // French typography in the page body and the head's title and description.
      const body = markup.indexOf('<main'), bodyEnd = markup.indexOf('</main>');
      const head = markup.slice(0, body).replace(/(<title>|<meta name="description" content=")([^<"]*)/g, (m, open, text) => open + typoText(lang, text));
      await writeFile(target, head + typo(lang, markup.slice(body, bodyEnd)) + markup.slice(bodyEnd), 'utf8');
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
