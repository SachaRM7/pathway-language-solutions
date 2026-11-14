// Copy of the V4 content pages. Spanish reproduces the current pages word for
// word; French, English and German are faithful translations. Legal pages
// (conditions, privacy) are not here: their text is read from the current
// pages at build time so it can never drift from the published terms.

// File name of each page per language: Spanish at the root, French under
// /fr/, English and German pages under /en/ and /de/ with English and German
// names (their former French or Spanish names redirect: RENAMED in
// scripts/build-seo.mjs). The program folders are in build-v4-programs.mjs.
export const ROUTES = {
  nclc: { es: 'nclc-7.html', fr: 'nclc-7.html', en: 'nclc-7.html', de: 'nclc-7.html' },
  tef: { es: 'preparacion-tef-canada.html', fr: 'preparacion-tef-canada.html', en: 'tef-canada-preparation.html', de: 'tef-canada-vorbereitung.html' },
  conditions: { es: 'condiciones.html', fr: 'conditions-nclc7.html', en: 'terms.html', de: 'bedingungen.html' },
  privacy: { es: 'privacidad.html', fr: 'politique-confidentialite.html', en: 'privacy-policy.html', de: 'datenschutz.html' },
  cookies: { es: 'cookies.html', fr: 'cookies.html', en: 'cookies.html', de: 'cookies.html' },
  legal: { es: 'aviso-legal.html', fr: 'mentions-legales.html', en: 'legal-notice.html', de: 'rechtliche-hinweise.html' },
  test: { es: 'test-placement.html', fr: 'test.html', en: 'test.html', de: 'test.html' },
  calculator: { es: 'calculador.html', fr: 'calculateur-crs.html', en: 'crs-calculator.html', de: 'crs-rechner.html' },
  inscription: { es: 'inscription.html', fr: 'inscription.html', en: 'inscription.html', de: 'inscription.html' },
  resources: { es: 'recursos.html', fr: 'ressources.html', en: 'resources.html', de: 'ressourcen.html' },
  tefaq: { es: 'tefaq-quebec.html', fr: 'tefaq-quebec.html', en: 'tefaq-quebec.html', de: 'tefaq-quebec.html' }
};

export const UI = {
  es: {
    home: 'Inicio', guides: 'Guías', legal: 'Información legal', onThisPage: 'En esta página', keepGoing: 'Para seguir',
    evaluate: 'Evaluar mi nivel', evaluateStart: 'Medir mi punto de partida', whatsapp: 'Prefiero hablar por WhatsApp', open: 'Abrir',
    ctaEyebrow: 'Tu primer paso · sin compromiso', officialSource: 'Fuente oficial IRCC', summary: 'En resumen', skip: 'Saltar al contenido',
    updated: 'Última revisión: noviembre de 2026'
  },
  fr: {
    home: 'Accueil', guides: 'Guides', legal: 'Informations légales', onThisPage: 'Sur cette page', keepGoing: 'Pour continuer',
    evaluate: 'Évaluer mon niveau', evaluateStart: 'Mesurer mon point de départ', whatsapp: 'Je préfère écrire sur WhatsApp', open: 'Ouvrir',
    ctaEyebrow: 'Votre première étape · sans engagement', officialSource: 'Source officielle IRCC', summary: 'En bref', skip: 'Aller au contenu',
    updated: 'Dernière révision : novembre 2026'
  },
  en: {
    home: 'Home', guides: 'Guides', legal: 'Legal information', onThisPage: 'On this page', keepGoing: 'Keep going',
    evaluate: 'Assess my level', evaluateStart: 'Measure my starting point', whatsapp: 'I’d rather talk on WhatsApp', open: 'Open',
    ctaEyebrow: 'Your first step · no commitment', officialSource: 'Official IRCC source', summary: 'In short', skip: 'Skip to content',
    updated: 'Last reviewed: November 2026'
  },
  de: {
    home: 'Startseite', guides: 'Ratgeber', legal: 'Rechtliches', onThisPage: 'Auf dieser Seite', keepGoing: 'Weiterlesen',
    evaluate: 'Mein Niveau bestimmen', evaluateStart: 'Meinen Ausgangspunkt messen', whatsapp: 'Lieber per WhatsApp schreiben', open: 'Öffnen',
    ctaEyebrow: 'Ihr erster Schritt · unverbindlich', officialSource: 'Offizielle IRCC-Quelle', summary: 'Kurz gesagt', skip: 'Zum Inhalt springen',
    updated: 'Zuletzt geprüft: November 2026'
  }
};

const IRCC_EN = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/';
const IRCC_FR = 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/';
export const IRCC = {
  language: lang => (lang === 'fr' ? `${IRCC_FR}documents/examen-linguistique.html` : `${IRCC_EN}documents/language-test.html`),
  rounds: lang => (lang === 'fr' ? `${IRCC_FR}rondes-invitations.html` : `${IRCC_EN}rounds-invitations.html`),
  score: lang => (lang === 'fr' ? `${IRCC_FR}verifier-note.html` : `${IRCC_EN}check-score.html`)
};

export const GUIDES = {
  nclc: {
    es: {
      title: 'NCLC 7, explicado sin promesas migratorias', description: 'Qué significa NCLC 7, cómo se demuestra con el TEF Canada o el TCF Canada y qué puede cambiar en un perfil de Express Entry.',
      eyebrow: 'Niveles canadienses de competencia lingüística', h1: ['NCLC 7, explicado', 'sin promesas migratorias.'],
      lead: 'Es un nivel canadiense de referencia para el francés. En Express Entry, importa tanto por los puntos como por la categoría francófona.',
      card: { pill: 'El objetivo', title: 'NCLC 7: el umbral francófono', text: 'Se mide por separado en cada competencia.', rows: [['Comprensión oral', 'NCLC 7+'], ['Comprensión escrita', 'NCLC 7+'], ['Expresión oral', 'NCLC 7+'], ['Expresión escrita', 'NCLC 7+']], note: 'NCLC 7 o más en cada competencia. No garantiza una invitación.' },
      sections: [
        ['definicion', 'Qué significa NCLC 7', ['Los NCLC son la escala canadiense utilizada para describir la competencia en francés. El número no es una nota escolar ni el nombre de un examen: es un nivel de referencia.', 'Para un resultado completo, se observan por separado la comprensión oral, la comprensión escrita, la expresión oral y la expresión escrita. Alcanzar el umbral en una competencia no compensa automáticamente otra que quede por debajo.']],
        ['demostrarlo', 'Cómo se demuestra', ['En los programas federales, el francés puede demostrarse con un examen aprobado como el TEF Canada o el TCF Canada. IRCC convierte los resultados de cada competencia a la escala NCLC.', 'No sería riguroso presentar A2, B1 o B2 como equivalencias automáticas. El CECRL ayuda a situar el nivel general; la tabla oficial de equivalencias del examen determina el resultado canadiense. Consulta también nuestra guía de <a href="{tef}">preparación al TEF Canada</a>.']],
        ['cambia', 'Qué puede cambiar en tu perfil', ['Según la combinación de idiomas y el resto del expediente, el francés puede aportar puntos como segunda lengua oficial, activar puntos adicionales o contribuir a la elegibilidad de una categoría francófona.', 'El impacto real depende de todo el perfil. La cifra visible en una ronda anterior sirve para comprender un escenario, no para predecir una invitación futura.']],
        ['limites', 'Lo que NCLC 7 no garantiza', ['Un nivel lingüístico no reemplaza los demás criterios de un programa. Pathway acompaña la preparación lingüística; no decide la vía migratoria ni representa expedientes.', '<p class="pg-note"><strong>Para una decisión migratoria:</strong> valida tu situación con las fuentes oficiales o con un profesional regulado. Para una decisión de aprendizaje, comienza por medir el punto de partida.</p>']]
      ],
      related: { eyebrow: 'Para seguir', title: 'Del nivel al próximo paso.', links: [['tef', 'Guía', 'Preparar el TEF Canada'], ['tefaq', 'Quebec', 'Proyecto Quebec: TEFAQ y TCF Québec'], ['calculator', 'Herramienta', 'Calcular mi puntaje CRS']] },
      cta: { title: '¿Tu objetivo lingüístico es viable?', text: 'El test progresivo sitúa tu nivel actual y ayuda a elegir un ritmo de trabajo coherente, que se confirmará durante la primera clase.' }
    },
    fr: {
      title: 'Le NCLC 7 expliqué, sans promesses migratoires', description: 'Ce que signifie le NCLC 7, comment le démontrer avec le TEF Canada ou le TCF Canada et ce qu’il peut changer dans un profil Entrée express.',
      eyebrow: 'Niveaux de compétence linguistique canadiens', h1: ['Le NCLC 7 expliqué,', 'sans promesses migratoires.'],
      lead: 'C’est un niveau canadien de référence pour le français. Dans Entrée express, il compte autant pour les points que pour la catégorie francophone.',
      card: { pill: 'L’objectif', title: 'NCLC 7 : le seuil francophone', text: 'Il se mesure séparément dans chaque compétence.', rows: [['Compréhension orale', 'NCLC 7+'], ['Compréhension écrite', 'NCLC 7+'], ['Expression orale', 'NCLC 7+'], ['Expression écrite', 'NCLC 7+']], note: 'NCLC 7 ou plus dans chaque compétence. Ne garantit pas une invitation.' },
      sections: [
        ['definition', 'Ce que signifie le NCLC 7', ['Les NCLC sont l’échelle canadienne utilisée pour décrire la compétence en français. Le chiffre n’est ni une note scolaire ni le nom d’un examen : c’est un niveau de référence.', 'Pour un résultat complet, on observe séparément la compréhension orale, la compréhension écrite, l’expression orale et l’expression écrite. Atteindre le seuil dans une compétence ne compense pas automatiquement une autre restée en dessous.']],
        ['demontrer', 'Comment le démontrer', ['Dans les programmes fédéraux, le français peut être démontré par un examen reconnu comme le TEF Canada ou le TCF Canada. IRCC convertit les résultats de chaque compétence sur l’échelle NCLC.', 'Il serait imprudent de présenter A2, B1 ou B2 comme des équivalences automatiques. Le CECRL aide à situer le niveau général ; le tableau officiel de correspondance de l’examen détermine le résultat canadien. Consultez aussi notre guide de <a href="{tef}">préparation au TEF Canada</a>.']],
        ['changer', 'Ce qui peut changer dans votre profil', ['Selon la combinaison des langues et le reste du dossier, le français peut rapporter des points comme seconde langue officielle, déclencher des points supplémentaires ou contribuer à l’admissibilité à une catégorie francophone.', 'L’impact réel dépend de l’ensemble du profil. Le chiffre affiché lors d’une ronde passée aide à comprendre un scénario, pas à prédire une invitation future.']],
        ['limites', 'Ce que le NCLC 7 ne garantit pas', ['Un niveau de langue ne remplace pas les autres critères d’un programme. Pathway accompagne la préparation linguistique ; il ne décide pas de la voie migratoire et ne représente pas de dossiers.', '<p class="pg-note"><strong>Pour une décision migratoire :</strong> vérifiez votre situation auprès des sources officielles ou d’un professionnel réglementé. Pour une décision d’apprentissage, commencez par mesurer votre point de départ.</p>']]
      ],
      related: { eyebrow: 'Pour continuer', title: 'Du niveau à la prochaine étape.', links: [['tef', 'Guide', 'Préparer le TEF Canada'], ['tefaq', 'Québec', 'Projet au Québec : TEFAQ et TCF Québec'], ['calculator', 'Outil', 'Calculer mon score CRS']] },
      cta: { title: 'Votre objectif linguistique est-il réaliste ?', text: 'Le test progressif situe votre niveau actuel et aide à choisir un rythme de travail cohérent, confirmé lors du premier cours.' }
    },
    en: {
      title: 'NCLC 7 explained, without immigration promises', description: 'What NCLC 7 means, how to prove it with the TEF Canada or TCF Canada, and what it can change in an Express Entry profile.',
      eyebrow: 'Canadian language benchmarks', h1: ['NCLC 7 explained,', 'without immigration promises.'],
      lead: 'It is a Canadian reference level for French. In Express Entry, it matters both for points and for the French-language category.',
      card: { pill: 'The target', title: 'NCLC 7: the French-language threshold', text: 'It is measured separately in each skill.', rows: [['Listening', 'NCLC 7+'], ['Reading', 'NCLC 7+'], ['Speaking', 'NCLC 7+'], ['Writing', 'NCLC 7+']], note: 'NCLC 7 or higher in every skill. It does not guarantee an invitation.' },
      sections: [
        ['meaning', 'What NCLC 7 means', ['The NCLC is the Canadian scale used to describe proficiency in French. The number is neither a school grade nor the name of an exam: it is a reference level.', 'For a complete result, listening, reading, speaking and writing are assessed separately. Reaching the threshold in one skill does not automatically make up for another one that falls short.']],
        ['proof', 'How it is proven', ['For federal programs, French can be proven with an approved exam such as the TEF Canada or the TCF Canada. IRCC converts the result of each skill to the NCLC scale.', 'It would not be rigorous to present A2, B1 or B2 as automatic equivalences. The CEFR helps place your overall level; the exam’s official conversion table determines the Canadian result. See also our <a href="{tef}">TEF Canada preparation guide</a>.']],
        ['impact', 'What it can change in your profile', ['Depending on your language combination and the rest of your file, French can add points as a second official language, unlock additional points or contribute to eligibility for a French-language category.', 'The real impact depends on the whole profile. The figure shown in a past round helps you understand a scenario, not predict a future invitation.']],
        ['limits', 'What NCLC 7 does not guarantee', ['A language level does not replace a program’s other criteria. Pathway supports your language preparation; it does not choose your immigration route or represent applications.', '<p class="pg-note"><strong>For an immigration decision:</strong> check your situation against official sources or with a regulated professional. For a learning decision, start by measuring your starting point.</p>']]
      ],
      related: { eyebrow: 'Keep going', title: 'From your level to the next step.', links: [['tef', 'Guide', 'Preparing for the TEF Canada'], ['tefaq', 'Quebec', 'A Quebec project: TEFAQ and TCF Québec'], ['calculator', 'Tool', 'Calculate my CRS score']] },
      cta: { title: 'Is your language goal realistic?', text: 'The progressive test places your current level and helps you choose a coherent pace, confirmed during your first class.' }
    },
    de: {
      title: 'NCLC 7 erklärt, ohne Einwanderungsversprechen', description: 'Was NCLC 7 bedeutet, wie man es mit dem TEF Canada oder TCF Canada nachweist und was es in einem Express-Entry-Profil ändern kann.',
      eyebrow: 'Kanadische Sprachniveaus', h1: ['NCLC 7 erklärt,', 'ohne Einwanderungsversprechen.'],
      lead: 'Es ist ein kanadisches Referenzniveau für Französisch. In Express Entry zählt es sowohl für die Punkte als auch für die frankophone Kategorie.',
      card: { pill: 'Das Ziel', title: 'NCLC 7: die frankophone Schwelle', text: 'Es wird in jeder Kompetenz einzeln gemessen.', rows: [['Hörverstehen', 'NCLC 7+'], ['Leseverstehen', 'NCLC 7+'], ['Mündlicher Ausdruck', 'NCLC 7+'], ['Schriftlicher Ausdruck', 'NCLC 7+']], note: 'NCLC 7 oder höher in jeder Kompetenz. Das garantiert keine Einladung.' },
      sections: [
        ['bedeutung', 'Was NCLC 7 bedeutet', ['Die NCLC sind die kanadische Skala zur Beschreibung der Französischkompetenz. Die Zahl ist weder eine Schulnote noch der Name einer Prüfung, sondern ein Referenzniveau.', 'Für ein vollständiges Ergebnis werden Hörverstehen, Leseverstehen, mündlicher und schriftlicher Ausdruck getrennt betrachtet. Wer die Schwelle in einer Kompetenz erreicht, gleicht damit nicht automatisch eine andere aus, die darunter bleibt.']],
        ['nachweis', 'Wie man es nachweist', ['In den Bundesprogrammen lässt sich Französisch mit einer anerkannten Prüfung wie dem TEF Canada oder dem TCF Canada nachweisen. IRCC rechnet die Ergebnisse jeder Kompetenz in die NCLC-Skala um.', 'Es wäre nicht seriös, A2, B1 oder B2 als automatische Entsprechungen darzustellen. Der GER hilft, das allgemeine Niveau einzuordnen; die offizielle Umrechnungstabelle der Prüfung bestimmt das kanadische Ergebnis. Lesen Sie auch unseren Ratgeber zur <a href="{tef}">Vorbereitung auf den TEF Canada</a>.']],
        ['wirkung', 'Was sich in Ihrem Profil ändern kann', ['Je nach Sprachkombination und übrigem Profil kann Französisch Punkte als zweite Amtssprache bringen, Zusatzpunkte auslösen oder zur Berechtigung für eine frankophone Kategorie beitragen.', 'Die tatsächliche Wirkung hängt vom gesamten Profil ab. Die Zahl einer früheren Runde hilft, ein Szenario zu verstehen, nicht eine künftige Einladung vorherzusagen.']],
        ['grenzen', 'Was NCLC 7 nicht garantiert', ['Ein Sprachniveau ersetzt nicht die übrigen Kriterien eines Programms. Pathway begleitet die sprachliche Vorbereitung; es entscheidet nicht über den Einwanderungsweg und vertritt keine Anträge.', '<p class="pg-note"><strong>Für eine Einwanderungsentscheidung:</strong> Prüfen Sie Ihre Situation anhand offizieller Quellen oder mit einer zugelassenen Fachperson. Für eine Lernentscheidung beginnen Sie damit, Ihren Ausgangspunkt zu messen.</p>']]
      ],
      related: { eyebrow: 'Weiterlesen', title: 'Vom Niveau zum nächsten Schritt.', links: [['tef', 'Ratgeber', 'Auf den TEF Canada vorbereiten'], ['tefaq', 'Québec', 'Projekt Québec: TEFAQ und TCF Québec'], ['calculator', 'Werkzeug', 'Meinen CRS-Wert berechnen']] },
      cta: { title: 'Ist Ihr Sprachziel realistisch?', text: 'Der progressive Test bestimmt Ihr aktuelles Niveau und hilft, ein stimmiges Arbeitstempo zu wählen, das in der ersten Stunde bestätigt wird.' }
    }
  },
  tef: {
    es: {
      title: 'Preparación TEF Canada', description: 'Prepara el TEF Canada hacia NCLC 7: qué evalúa el examen, por qué importa NCLC 7, cómo prepara Pathway y cuánto tiempo necesitas.',
      eyebrow: 'TEF Canada · Preparación en español', h1: ['Preparar el examen', 'no es memorizar francés.'],
      lead: 'Es entrenar cuatro competencias, entender el formato y convertir tu nivel actual en una estrategia medible hacia NCLC 7.',
      card: { pill: 'El examen', title: 'Cuatro competencias evaluadas', text: 'IRCC convierte cada resultado en un nivel NCLC.', rows: [['Comprensión oral', 'NCLC'], ['Comprensión escrita', 'NCLC'], ['Expresión oral', 'NCLC'], ['Expresión escrita', 'NCLC']], note: 'Las cuatro cuentan: te preparamos para el formato y para lo que limita realmente tu resultado.' },
      sections: [
        ['examen', 'Qué evalúa el TEF Canada', ['El TEF Canada mide comprensión oral, comprensión escrita, expresión oral y expresión escrita. IRCC convierte cada resultado en un nivel canadiense de competencia lingüística.', 'Las cuatro competencias cuentan. Una preparación eficaz no consiste en acumular reglas: consiste en conocer el formato, practicar en condiciones de examen y reforzar lo que limita realmente el resultado.']],
        ['nclc', 'Por qué se habla tanto de NCLC 7', ['NCLC 7 es un umbral importante en varios escenarios de Express Entry. Puede influir en el cálculo de puntos y en la elegibilidad para determinadas categorías, pero no garantiza por sí solo una invitación.', 'El objetivo lingüístico debe leerse dentro de un perfil completo: experiencia, estudios, edad y demás factores migratorios. Puedes consultar nuestra guía para <a href="{nclc}">comprender NCLC 7</a> sin promesas ni atajos.']],
        ['metodo', 'Cómo prepara Pathway', ['El plan se construye desde el nivel actual, el objetivo y el tiempo disponible. La intensidad cambia; la exigencia y el seguimiento no.', '<ul><li>Clases individuales en vivo por Zoom, con un profesor nativo.</li><li>Diagnóstico de las cuatro competencias y plan por prioridades.</li><li>Práctica oral activa, correcciones y seguimiento.</li><li>El Campus Pathway: ejercicios por unidad, tu manual en línea que se abre clase a clase y las grabaciones de tus clases.</li><li>Dos simulacros TEF Canada o TCF Canada, en el formato de tu examen, para medir el progreso.</li></ul>', 'Pathway también acompaña otros objetivos y exámenes de francés. Para Express Entry, el foco de esta ruta es el TEF Canada o el TCF Canada.']],
        ['plazo', 'Cuánto tiempo necesitas', ['Depende del punto de partida, de las horas semanales y, sobre todo, de la regularidad. Los ritmos de 2 a 6 horas por semana sirven para construir escenarios, no promesas automáticas.', '<p class="pg-note"><strong>El buen primer paso:</strong> medir el nivel de partida. Sin un diagnóstico, no damos un plazo preciso ni inventamos equivalencias entre CECRL y NCLC.</p>']]
      ],
      related: { eyebrow: 'Para seguir', title: 'Tu próximo punto de referencia, sin volver al inicio.', links: [['nclc', 'Guía', 'Comprender NCLC 7'], ['tefaq', 'Quebec', 'Proyecto Quebec: TEFAQ y TCF Québec'], ['home#planes', 'Planes', 'Comparar los planes']] },
      cta: { title: 'Convierte la meta en un plan.', text: 'Completa el test progresivo. El resultado orienta la intensidad y se confirma durante la primera clase.' }
    },
    fr: {
      title: 'Préparation au TEF Canada', description: 'Préparez le TEF Canada vers le NCLC 7 : ce que l’examen évalue, pourquoi le NCLC 7 compte, comment Pathway prépare et combien de temps prévoir.',
      eyebrow: 'TEF Canada · Préparation avec appui en espagnol', h1: ['Préparer l’examen,', 'ce n’est pas mémoriser le français.'],
      lead: 'C’est entraîner quatre compétences, comprendre le format et transformer votre niveau actuel en une stratégie mesurable vers le NCLC 7.',
      card: { pill: 'L’examen', title: 'Quatre compétences évaluées', text: 'IRCC convertit chaque résultat en niveau NCLC.', rows: [['Compréhension orale', 'NCLC'], ['Compréhension écrite', 'NCLC'], ['Expression orale', 'NCLC'], ['Expression écrite', 'NCLC']], note: 'Les quatre comptent : nous vous préparons au format de l’examen et à ce qui limite réellement votre résultat.' },
      sections: [
        ['examen', 'Ce qu’évalue le TEF Canada', ['Le TEF Canada mesure la compréhension orale, la compréhension écrite, l’expression orale et l’expression écrite. IRCC convertit chaque résultat en niveau de compétence linguistique canadien.', 'Les quatre compétences comptent. Une préparation efficace ne consiste pas à accumuler des règles : elle consiste à connaître le format, s’entraîner en conditions d’examen et renforcer ce qui limite réellement le résultat.']],
        ['nclc', 'Pourquoi on parle autant du NCLC 7', ['Le NCLC 7 est un seuil important dans plusieurs scénarios d’Entrée express. Il peut influer sur le calcul des points et sur l’admissibilité à certaines catégories, mais ne garantit pas à lui seul une invitation.', 'L’objectif linguistique se lit dans un profil complet : expérience, études, âge et autres facteurs migratoires. Consultez notre guide pour <a href="{nclc}">comprendre le NCLC 7</a> sans promesses ni raccourcis.']],
        ['methode', 'Comment Pathway prépare', ['Le plan se construit à partir du niveau actuel, de l’objectif et du temps disponible. L’intensité change ; l’exigence et le suivi, non.', '<ul><li>Cours particuliers en direct sur Zoom, avec un professeur natif.</li><li>Diagnostic des quatre compétences et plan par priorités.</li><li>Pratique orale active, corrections et suivi.</li><li>Le Campus Pathway : exercices par unité, votre manuel en ligne qui s’ouvre cours après cours et les enregistrements de vos cours.</li><li>Deux examens blancs TEF Canada ou TCF Canada, au format de votre examen, pour mesurer vos progrès.</li></ul>', 'Pathway accompagne aussi d’autres objectifs et examens de français. Pour Entrée express, cette voie se concentre sur le TEF Canada ou le TCF Canada.']],
        ['delai', 'Combien de temps prévoir', ['Cela dépend du point de départ, des heures hebdomadaires et surtout de la régularité. Les rythmes de 2 à 6 heures par semaine servent à construire des scénarios, pas des promesses automatiques.', '<p class="pg-note"><strong>La bonne première étape :</strong> mesurer le niveau de départ. Sans diagnostic, nous ne donnons pas de délai précis et n’inventons pas d’équivalences entre CECRL et NCLC.</p>']]
      ],
      related: { eyebrow: 'Pour continuer', title: 'Votre prochain repère, sans repartir de zéro.', links: [['nclc', 'Guide', 'Comprendre le NCLC 7'], ['tefaq', 'Québec', 'Projet au Québec : TEFAQ et TCF Québec'], ['home#planes', 'Formules', 'Comparer les formules']] },
      cta: { title: 'Transformez l’objectif en plan.', text: 'Faites le test progressif. Le résultat oriente l’intensité et se confirme lors du premier cours.' }
    },
    en: {
      title: 'TEF Canada preparation', description: 'Prepare for the TEF Canada towards NCLC 7: what the exam assesses, why NCLC 7 matters, how Pathway prepares you and how much time you need.',
      eyebrow: 'TEF Canada · Preparation with Spanish support', h1: ['Preparing for the exam', 'is not memorizing French.'],
      lead: 'It means training four skills, understanding the format and turning your current level into a measurable strategy towards NCLC 7.',
      card: { pill: 'The exam', title: 'Four skills assessed', text: 'IRCC converts each result into an NCLC level.', rows: [['Listening', 'NCLC'], ['Reading', 'NCLC'], ['Speaking', 'NCLC'], ['Writing', 'NCLC']], note: 'All four count: we prepare you for the format and for whatever really limits your result.' },
      sections: [
        ['exam', 'What the TEF Canada assesses', ['The TEF Canada measures listening, reading, speaking and writing. IRCC converts each result into a Canadian language benchmark level.', 'All four skills count. Effective preparation is not about piling up rules: it is about knowing the format, practicing under exam conditions and strengthening what really limits the result.']],
        ['nclc', 'Why NCLC 7 gets so much attention', ['NCLC 7 is an important threshold in several Express Entry scenarios. It can affect the points calculation and eligibility for certain categories, but on its own it does not guarantee an invitation.', 'A language goal has to be read within a full profile: experience, education, age and other immigration factors. See our guide to <a href="{nclc}">understanding NCLC 7</a> without promises or shortcuts.']],
        ['method', 'How Pathway prepares you', ['The plan is built from your current level, your goal and the time you have. The intensity changes; the standards and follow-up do not.', '<ul><li>Live one-to-one classes on Zoom, with a native teacher.</li><li>Diagnosis of all four skills and a plan by priorities.</li><li>Active speaking practice, corrections and follow-up.</li><li>The Pathway Campus: exercises for every unit, your online textbook that opens class by class, and the recordings of your classes.</li><li>Two TEF Canada or TCF Canada mock exams, in your exam’s format, to measure progress.</li></ul>', 'Pathway also supports other French goals and exams. For Express Entry, this path focuses on the TEF Canada or the TCF Canada.']],
        ['timing', 'How much time you need', ['It depends on your starting point, your weekly hours and, above all, your consistency. Paces of 2 to 6 hours a week are for building scenarios, not automatic promises.', '<p class="pg-note"><strong>The right first step:</strong> measure your starting level. Without a diagnosis, we do not give a precise timeline or invent equivalences between the CEFR and NCLC.</p>']]
      ],
      related: { eyebrow: 'Keep going', title: 'Your next reference point, without starting over.', links: [['nclc', 'Guide', 'Understanding NCLC 7'], ['tefaq', 'Quebec', 'A Quebec project: TEFAQ and TCF Québec'], ['home#planes', 'Plans', 'Compare the plans']] },
      cta: { title: 'Turn the goal into a plan.', text: 'Take the progressive test. The result guides the intensity and is confirmed during your first class.' }
    },
    de: {
      title: 'Vorbereitung auf den TEF Canada', description: 'TEF Canada mit Ziel NCLC 7: was die Prüfung bewertet, warum NCLC 7 zählt, wie Pathway vorbereitet und wie viel Zeit Sie brauchen.',
      eyebrow: 'TEF Canada · Vorbereitung mit Unterstützung auf Spanisch', h1: ['Sich auf die Prüfung vorbereiten', 'heißt nicht, Französisch auswendig zu lernen.'],
      lead: 'Es heißt, vier Kompetenzen zu trainieren, das Format zu verstehen und Ihr aktuelles Niveau in eine messbare Strategie Richtung NCLC 7 zu verwandeln.',
      card: { pill: 'Die Prüfung', title: 'Vier bewertete Kompetenzen', text: 'IRCC rechnet jedes Ergebnis in ein NCLC-Niveau um.', rows: [['Hörverstehen', 'NCLC'], ['Leseverstehen', 'NCLC'], ['Mündlicher Ausdruck', 'NCLC'], ['Schriftlicher Ausdruck', 'NCLC']], note: 'Alle vier zählen: Wir bereiten Sie auf das Format vor und auf das, was Ihr Ergebnis tatsächlich begrenzt.' },
      sections: [
        ['pruefung', 'Was der TEF Canada bewertet', ['Der TEF Canada misst Hörverstehen, Leseverstehen, mündlichen und schriftlichen Ausdruck. IRCC rechnet jedes Ergebnis in ein kanadisches Sprachniveau um.', 'Alle vier Kompetenzen zählen. Eine wirksame Vorbereitung bedeutet nicht, Regeln anzuhäufen, sondern das Format zu kennen, unter Prüfungsbedingungen zu üben und das zu stärken, was das Ergebnis tatsächlich begrenzt.']],
        ['nclc', 'Warum so viel über NCLC 7 gesprochen wird', ['NCLC 7 ist in mehreren Express-Entry-Szenarien eine wichtige Schwelle. Es kann die Punkteberechnung und die Berechtigung für bestimmte Kategorien beeinflussen, garantiert aber allein keine Einladung.', 'Das Sprachziel ist im Gesamtprofil zu sehen: Erfahrung, Ausbildung, Alter und weitere Einwanderungsfaktoren. Lesen Sie unseren Ratgeber, um <a href="{nclc}">NCLC 7 zu verstehen</a>, ohne Versprechen und Abkürzungen.']],
        ['methode', 'Wie Pathway vorbereitet', ['Der Plan entsteht aus dem aktuellen Niveau, dem Ziel und der verfügbaren Zeit. Die Intensität ändert sich, der Anspruch und die Begleitung nicht.', '<ul><li>Live-Einzelunterricht über Zoom mit einer muttersprachlichen Lehrkraft.</li><li>Diagnose der vier Kompetenzen und Plan nach Prioritäten.</li><li>Aktive Sprechpraxis, Korrekturen und Begleitung.</li><li>Der Pathway-Campus: Übungen zu jeder Einheit, Ihr Online-Lehrbuch, das sich Stunde für Stunde öffnet, und die Aufzeichnungen Ihrer Stunden.</li><li>Zwei Probeprüfungen für TEF Canada oder TCF Canada im Format Ihrer Prüfung, um den Fortschritt zu messen.</li></ul>', 'Pathway begleitet auch andere Französischziele und -prüfungen. Für Express Entry konzentriert sich dieser Weg auf den TEF Canada oder den TCF Canada.']],
        ['zeit', 'Wie viel Zeit Sie brauchen', ['Das hängt vom Ausgangspunkt, von den Wochenstunden und vor allem von der Regelmäßigkeit ab. Rhythmen von 2 bis 6 Stunden pro Woche dienen dazu, Szenarien zu entwickeln, nicht automatische Versprechen.', '<p class="pg-note"><strong>Der richtige erste Schritt:</strong> das Ausgangsniveau messen. Ohne Diagnose nennen wir keine genaue Dauer und erfinden keine Entsprechungen zwischen GER und NCLC.</p>']]
      ],
      related: { eyebrow: 'Weiterlesen', title: 'Ihr nächster Orientierungspunkt, ohne von vorn zu beginnen.', links: [['nclc', 'Ratgeber', 'NCLC 7 verstehen'], ['tefaq', 'Québec', 'Projekt Québec: TEFAQ und TCF Québec'], ['home#planes', 'Pakete', 'Pakete vergleichen']] },
      cta: { title: 'Machen Sie aus dem Ziel einen Plan.', text: 'Machen Sie den progressiven Test. Das Ergebnis bestimmt die Intensität und wird in der ersten Stunde bestätigt.' }
    }
  }
};

// Card shown beside the legal pages, read from their own sections.
export const LEGAL_CARD = {
  privacy: { es: ['Transparencia', 'Lo esencial'], fr: ['Transparence', 'L’essentiel'], en: ['Transparency', 'The essentials'], de: ['Transparenz', 'Das Wichtigste'] }
};

// Summary card beside the conditions: the prices, the fee and the payment rule.
export const CONDITIONS_CARD = {
  es: { pill: 'En resumen', title: 'Lo esencial', rows: [['Esencial · 2 h/sem.', '185 CAD/mes'], ['Acelerado · 3–4 h/sem.', '277,50–370 CAD/mes'], ['Intensivo · 5–6 h/sem.', '462,50–555 CAD/mes'], ['Cuota de inscripción', '15 CAD, una vez']], note: 'Ningún pago antes de confirmar tu horario. Clases individuales, en vivo por Zoom.', link: ['#asistencia', 'Reglas de asistencia'] },
  fr: { pill: 'En bref', title: 'L’essentiel', rows: [['Essentiel · 2 h/sem.', '185 CAD/mois'], ['Accéléré · 3–4 h/sem.', '277,50–370 CAD/mois'], ['Intensif · 5–6 h/sem.', '462,50–555 CAD/mois'], ['Frais d’inscription', '15 CAD, une fois']], note: 'Aucun paiement avant la confirmation de votre horaire. Cours particuliers, en direct sur Zoom.', link: ['#asistencia', 'Règles d’assiduité'] },
  en: { pill: 'In short', title: 'The essentials', rows: [['Essential · 2 h/wk', '185 CAD/month'], ['Accelerated · 3–4 h/wk', '277.50–370 CAD/month'], ['Intensive · 5–6 h/wk', '462.50–555 CAD/month'], ['Registration fee', '15 CAD, once']], note: 'No payment before your schedule is confirmed. One-to-one classes, live on Zoom.', link: ['#asistencia', 'Attendance rules'] },
  de: { pill: 'Kurz gesagt', title: 'Das Wichtigste', rows: [['Basis · 2 Std./Wo.', '185 CAD/Monat'], ['Beschleunigt · 3–4 Std./Wo.', '277,50–370 CAD/Monat'], ['Intensiv · 5–6 Std./Wo.', '462,50–555 CAD/Monat'], ['Anmeldegebühr', '15 CAD, einmalig']], note: 'Keine Zahlung, bevor Ihr Stundenplan bestätigt ist. Einzelunterricht, live über Zoom.', link: ['#asistencia', 'Anwesenheitsregeln'] }
};

export const LEGAL_CTA = {
  conditions: {
    es: ['Documenta tu punto de partida.', 'El test de nivel abre el expediente con el que se definen el número de ciclos, la fórmula y la duración aplicables.'],
    fr: ['Documentez votre point de départ.', 'Le test de positionnement ouvre le dossier qui permet de définir le nombre de cycles, la formule et la durée applicables.'],
    en: ['Document your starting point.', 'The placement test opens the file used to set the number of cycles, the plan and the length that apply.'],
    de: ['Dokumentieren Sie Ihren Ausgangspunkt.', 'Der Einstufungstest eröffnet die Akte, mit der Anzahl der Zyklen, Paket und Dauer festgelegt werden.']
  },
  privacy: {
    es: ['¿Tienes una pregunta?', 'Escríbenos sobre el uso de tus datos o para pedir su eliminación.', 'Escribir a Pathway'],
    fr: ['Une question ?', 'Écrivez-nous au sujet de vos données ou pour demander leur suppression.', 'Nous écrire'],
    en: ['Have a question?', 'Write to us about your data or to ask for it to be deleted.', 'Email us'],
    de: ['Haben Sie eine Frage?', 'Schreiben Sie uns zu Ihren Daten oder um deren Löschung zu verlangen.', 'E-Mail schreiben']
  }
};

// New Spanish pages linked from the V4 footer. Only facts that can be checked
// in this repository are stated; nothing about company registration is
// invented.
export const NEW_LEGAL = {
  cookies: {
    title: 'Política de cookies', description: 'Qué guarda el sitio de Pathway en tu navegador: ninguna cookie de seguimiento, almacenamiento de sesión para el test y la inscripción.',
    eyebrow: 'Transparencia', h1: ['Política de cookies', 'y almacenamiento.'],
    lead: 'El sitio de Pathway no instala cookies publicitarias ni de seguimiento. Para que el test, la calculadora y la inscripción funcionen, guarda algunos datos en tu propio navegador.',
    card: { pill: 'En resumen', title: 'Lo que guarda tu navegador', rows: [['Cookies de seguimiento', 'Ninguna'], ['Publicidad', 'Ninguna'], ['Almacenamiento de sesión', 'Test e inscripción'], ['Almacenamiento local', 'Datos de IRCC, preferencias']] },
    sections: [
      ['cookies', 'Cookies', ['Pathway no utiliza cookies propias de seguimiento, de publicidad ni de perfilado. Hoy no hay ninguna herramienta de medición de audiencia activada en el sitio.', '<p class="pg-note"><strong>Si un día se activa una medición de audiencia,</strong> esta página se actualizará antes con el nombre del servicio, lo que mide y cómo oponerte.</p>']],
      ['sesion', 'Almacenamiento de sesión', ['Mientras navegas, algunas páginas guardan datos en el almacenamiento de sesión de tu navegador. Se borran al cerrar la pestaña.', '<ul><li><strong>Test de nivel:</strong> tu resultado (<code>pathwayPlacementResult</code>) y tu correo (<code>pathwayPlacementEmail</code>), para preparar la inscripción. Al ver tu resultado, también se envían a la base de datos de Pathway, como explica la <a href="{privacy}">política de privacidad</a>.</li><li><strong>Página de inicio:</strong> la fórmula y la modalidad que eliges (<code>pathwayV4Selection</code>), para llevarlas a la inscripción.</li><li><strong>Inscripción:</strong> el resumen de tu solicitud (<code>pathwayEnrollmentRequest</code>), para mostrarlo en la página de confirmación. La solicitud también se envía a Pathway.</li></ul>']],
      ['local', 'Almacenamiento local', ['La calculadora y las rondas de IRCC guardan en tu navegador una copia de los últimos datos públicos de IRCC (rondas de invitaciones y reglas CRS), para seguir funcionando si canada.ca no responde. No contienen ningún dato personal.', 'Algunas páginas recuerdan también tus preferencias de visualización, como el tema claro u oscuro (<code>pathway-theme</code>), y el origen de tu primera visita (<code>pathwayFirstTouch</code>: la campaña o el sitio de donde vienes), que se borra a los 30 días.']],
      ['terceros', 'Servicios externos', ['El test y la inscripción envían datos a la base de datos de Pathway (Supabase), como explica la <a href="{privacy}">política de privacidad</a>. Las rondas de IRCC se consultan en canada.ca. Algunas páginas pueden cargar fuentes tipográficas de Google Fonts. Si eliges escribirnos por WhatsApp o por correo, se aplican las políticas de esos servicios.']],
      ['control', 'Cómo borrar estos datos', ['Puedes borrar el almacenamiento de sesión cerrando la pestaña y el almacenamiento local desde la configuración de privacidad de tu navegador. El sitio sigue funcionando sin estos datos. Para pedir que borremos lo que se envió a Pathway, escribe a <a href="mailto:contacto@pathway-languages.com">contacto@pathway-languages.com</a>.']]
    ]
  },
  legal: {
    title: 'Aviso legal', description: 'Aviso legal de Pathway Language Solutions: actividad, contacto, propiedad intelectual y límites de la información publicada.',
    eyebrow: 'Información legal', h1: ['Aviso legal'],
    lead: 'Pathway Language Solutions es un instituto de idiomas que ofrece clases individuales de francés en línea y preparación a los exámenes TEF Canada y TCF Canada.',
    card: { pill: 'Contacto', title: 'Pathway Language Solutions', rows: [['Email', '<a href="mailto:contacto@pathway-languages.com">contacto@pathway-languages.com</a>'], ['WhatsApp', '<a href="https://wa.me/51989887516" target="_blank" rel="noopener">+51 989 887 516</a>'], ['Sitio', 'pathway-languages.com']] },
    sections: [
      ['actividad', 'Actividad', ['Pathway Language Solutions ofrece clases individuales de francés en vivo por Zoom (un alumno, un profesor), material pedagógico propio y preparación a los exámenes de francés reconocidos por IRCC.', '<p class="pg-note"><strong>Pathway no ofrece consultoría migratoria</strong> ni representa a candidatos ante IRCC. Para una decisión migratoria, consulta las fuentes oficiales o a un profesional regulado.</p>']],
      ['informacion', 'Información publicada', ['Los datos de IRCC (rondas de invitaciones, reglas CRS) proceden de las fuentes oficiales de canada.ca y se muestran con fines informativos. Pueden cambiar en cualquier momento; ningún dato del sitio constituye una previsión ni una garantía de invitación.', 'Las estimaciones del test de nivel y de la calculadora CRS son orientativas y se confirman con un profesor o con las herramientas oficiales.']],
      ['propiedad', 'Propiedad intelectual', ['Los manuales, su estructura pedagógica, los textos, las imágenes y el diseño del sitio son propiedad de Pathway Language Solutions. Los extractos publicados se ofrecen para consulta personal; cualquier reproducción o difusión requiere una autorización previa por escrito.']],
      ['enlaces', 'Enlaces externos', ['El sitio enlaza a servicios de terceros (canada.ca, WhatsApp, proveedores de examen). Pathway no controla su contenido ni sus políticas.']],
      ['condiciones', 'Condiciones y datos', ['Las fórmulas, los precios, las reglas de asistencia y el compromiso NCLC 7 se detallan en las <a href="{conditions}">condiciones generales</a>, y el uso de tus datos en la <a href="{privacy}">política de privacidad</a> y la <a href="{cookies}">política de cookies</a>.']]
    ]
  }
};

// Quebec guide (/tefaq-quebec.html in the four languages). Rendered like the
// other guides; its call to action opens WhatsApp with a Quebec message.
const quebecWhatsApp = text => `https://wa.me/51989887516?text=${encodeURIComponent(text)}`;

GUIDES.tefaq = {
  es: {
    title: 'Proyecto Quebec: TEFAQ y TCF Québec', description: 'Quebec tiene sus propios programas: confirma la vía antes de elegir entre TEFAQ, TCF Québec o TEF Canada. Qué puede preparar Pathway.',
    eyebrow: 'Proyecto Quebec', h1: ['Primero se elige la vía.', 'Después, el examen.'],
    lead: 'La ruta federal orientada a NCLC 7 no se traslada automáticamente a un proyecto en Quebec. El objetivo lingüístico debe partir del programa adecuado.',
    card: { pill: 'Quebec', title: 'Una vía propia', text: 'Antes de fijar un examen o una fecha:', rows: ['Confirmar el programa oficial', 'Identificar el examen aceptado', 'Construir la preparación'], numbered: true, note: 'Pathway prepara la lengua y el formato del examen; no elige la vía migratoria.' },
    sections: [
      ['diferencia', 'Federal y Quebec no son la misma ruta', ['Express Entry es un sistema federal. Quebec administra sus propios programas y criterios. Por eso, una estrategia construida solo alrededor de NCLC 7 y de la categoría francófona federal <strong>no debe copiarse sin verificar la vía que corresponde</strong>.', 'Antes de fijar un examen o una fecha, conviene identificar el programa, la versión del examen aceptada y las competencias requeridas.']],
      ['examen', 'TEFAQ, TCF Québec: ¿cuál elegir?', ['Cuando se habla de «TFQ», normalmente se hace referencia al <strong>TEFAQ</strong> o al <strong>TCF Québec</strong>. No son simples nombres alternativos del TEF Canada: la versión, las competencias y el uso administrativo pueden variar.', 'La opción aceptada debe verificarse para el programa y el momento de la solicitud. Pathway puede preparar la lengua y el formato del examen, pero no elegir la vía migratoria en lugar del candidato.', '<p class="pg-note"><strong>La secuencia adecuada:</strong> confirmar el proyecto oficial, identificar el examen aceptado y construir después la preparación lingüística.</p>']],
      ['pathway', 'Qué puede preparar Pathway', ['Pathway trabaja objetivos de francés general y exámenes como DELF, DALF, TCF y TEF. Una vez aclarado el proyecto, las clases pueden adaptarse al TEFAQ o al TCF Québec: formato, competencias, práctica oral, correcciones y simulacros.', 'Si tu objetivo es federal, consulta la guía para <a href="{tef}">preparar el TEF Canada</a>. Si es Quebec, una conversación breve evita que el plan de estudio empiece por el examen equivocado.']]
    ],
    related: { eyebrow: 'Para seguir', title: 'Elige el recurso que corresponde.', links: [['nclc', 'Guía', 'Comprender NCLC 7'], ['tef', 'Guía', 'Preparar el TEF Canada'], ['resources', 'Recursos', 'Todos los recursos']] },
    cta: { title: 'Aclaremos la vía antes del ritmo.', text: 'Cuéntanos qué proyecto preparas. Te orientamos sobre la preparación lingüística adecuada, sin convertir la conversación en asesoría migratoria.', primary: [quebecWhatsApp('Hola Pathway, mi proyecto es para Quebec y quiero identificar la preparación adecuada.'), 'Hablar con Pathway'], secondary: ['test', 'Evaluar mi nivel'] }
  },
  fr: {
    title: 'Projet au Québec : TEFAQ et TCF Québec', description: 'Le Québec a ses propres programmes : confirmez la voie avant de choisir entre TEFAQ, TCF Québec ou TEF Canada. Ce que Pathway peut préparer.',
    eyebrow: 'Projet au Québec', h1: ['D’abord la voie.', 'Ensuite, l’examen.'],
    lead: 'La voie fédérale orientée vers le NCLC 7 ne se transpose pas automatiquement à un projet au Québec. L’objectif linguistique doit partir du bon programme.',
    card: { pill: 'Québec', title: 'Une voie à part', text: 'Avant de fixer un examen ou une date :', rows: ['Confirmer le programme officiel', 'Identifier l’examen accepté', 'Construire la préparation'], numbered: true, note: 'Pathway prépare la langue et le format de l’examen ; il ne choisit pas la voie d’immigration.' },
    sections: [
      ['diferencia', 'Fédéral et Québec : deux voies différentes', ['Entrée express est un système fédéral. Le Québec gère ses propres programmes et critères. Une stratégie construite uniquement autour du NCLC 7 et de la catégorie francophone fédérale <strong>ne doit donc pas être reprise sans vérifier la voie qui s’applique</strong>.', 'Avant de fixer un examen ou une date, il faut identifier le programme, la version de l’examen acceptée et les compétences exigées.']],
      ['examen', 'TEFAQ, TCF Québec : lequel choisir ?', ['Quand on parle de « TFQ », il s’agit en général du <strong>TEFAQ</strong> ou du <strong>TCF Québec</strong>. Ce ne sont pas de simples autres noms du TEF Canada : la version, les compétences et l’usage administratif peuvent varier.', 'L’examen accepté doit être vérifié pour le programme et au moment de la demande. Pathway peut préparer la langue et le format de l’examen, mais ne choisit pas la voie d’immigration à la place du candidat.', '<p class="pg-note"><strong>Le bon ordre :</strong> confirmer le projet officiel, identifier l’examen accepté, puis construire la préparation linguistique.</p>']],
      ['pathway', 'Ce que Pathway peut préparer', ['Pathway travaille le français général et des examens comme le DELF, le DALF, le TCF et le TEF. Une fois le projet clarifié, les cours peuvent s’adapter au TEFAQ ou au TCF Québec : format, compétences, pratique orale, corrections et examens blancs.', 'Si votre objectif est fédéral, consultez le guide pour <a href="{tef}">préparer le TEF Canada</a>. Pour le Québec, un court échange évite que le plan d’études commence par le mauvais examen.']]
    ],
    related: { eyebrow: 'Pour continuer', title: 'Choisissez la ressource qui vous correspond.', links: [['nclc', 'Guide', 'Comprendre le NCLC 7'], ['tef', 'Guide', 'Préparer le TEF Canada'], ['resources', 'Ressources', 'Toutes les ressources']] },
    cta: { title: 'Clarifions la voie avant le rythme.', text: 'Dites-nous quel projet vous préparez. Nous vous orientons vers la bonne préparation linguistique, sans faire de cet échange un conseil en immigration.', primary: [quebecWhatsApp('Bonjour Pathway, mon projet concerne le Québec et je voudrais identifier la bonne préparation.'), 'Écrire à Pathway'], secondary: ['test', 'Évaluer mon niveau'] }
  },
  en: {
    title: 'A Quebec project: TEFAQ and TCF Québec', description: 'Quebec runs its own programs: confirm your path before choosing between TEFAQ, TCF Québec or TEF Canada. What Pathway can prepare.',
    eyebrow: 'A Quebec project', h1: ['First the path.', 'Then the exam.'],
    lead: 'The federal route aimed at NCLC 7 does not carry over automatically to a Quebec project. The language goal has to start from the right program.',
    card: { pill: 'Quebec', title: 'A path of its own', text: 'Before you set an exam or a date:', rows: ['Confirm the official program', 'Identify the accepted exam', 'Build the preparation'], numbered: true, note: 'Pathway prepares the language and the exam format; it does not choose your immigration path.' },
    sections: [
      ['diferencia', 'Federal and Quebec are different routes', ['Express Entry is a federal system. Quebec runs its own programs and criteria. A strategy built only around NCLC 7 and the federal French-language category <strong>should not be copied without checking which path applies</strong>.', 'Before setting an exam or a date, identify the program, the accepted version of the exam and the skills required.']],
      ['examen', 'TEFAQ or TCF Québec: which one?', ['When people say “TFQ”, they usually mean the <strong>TEFAQ</strong> or the <strong>TCF Québec</strong>. They are not just other names for the TEF Canada: the version, the skills and the administrative use can differ.', 'The accepted exam must be checked for the program and at the time of the application. Pathway can prepare the language and the exam format, but does not choose the immigration path for the candidate.', '<p class="pg-note"><strong>The right order:</strong> confirm the official project, identify the accepted exam, then build the language preparation.</p>']],
      ['pathway', 'What Pathway can prepare', ['Pathway works on general French and on exams such as the DELF, DALF, TCF and TEF. Once the project is clear, classes can be adapted to the TEFAQ or the TCF Québec: format, skills, speaking practice, corrections and mock exams.', 'If your goal is federal, see the guide to <a href="{tef}">preparing for the TEF Canada</a>. For Quebec, a short conversation keeps your study plan from starting with the wrong exam.']]
    ],
    related: { eyebrow: 'Keep going', title: 'Pick the resource that fits.', links: [['nclc', 'Guide', 'Understanding NCLC 7'], ['tef', 'Guide', 'Preparing for the TEF Canada'], ['resources', 'Resources', 'All resources']] },
    cta: { title: 'Let’s clarify the path before the pace.', text: 'Tell us which project you are preparing. We will point you to the right language preparation, without turning the conversation into immigration advice.', primary: [quebecWhatsApp('Hello Pathway, my project is for Quebec and I would like to find the right preparation.'), 'Talk to Pathway'], secondary: ['test', 'Assess my level'] }
  },
  de: {
    title: 'Projekt Québec: TEFAQ und TCF Québec', description: 'Québec hat eigene Programme: Klären Sie den Weg, bevor Sie zwischen TEFAQ, TCF Québec und TEF Canada wählen. Was Pathway vorbereiten kann.',
    eyebrow: 'Projekt Québec', h1: ['Zuerst der Weg.', 'Dann die Prüfung.'],
    lead: 'Der auf NCLC 7 ausgerichtete Bundesweg lässt sich nicht automatisch auf ein Projekt in Québec übertragen. Das Sprachziel muss vom passenden Programm ausgehen.',
    card: { pill: 'Québec', title: 'Ein eigener Weg', text: 'Bevor Sie eine Prüfung oder ein Datum festlegen:', rows: ['Das offizielle Programm bestätigen', 'Die anerkannte Prüfung bestimmen', 'Die Vorbereitung aufbauen'], numbered: true, note: 'Pathway bereitet Sprache und Prüfungsformat vor; den Einwanderungsweg wählt es nicht.' },
    sections: [
      ['diferencia', 'Bund und Québec: zwei verschiedene Wege', ['Express Entry ist ein Bundessystem. Québec verwaltet eigene Programme und Kriterien. Eine Strategie, die nur auf NCLC 7 und die frankophone Bundeskategorie ausgerichtet ist, <strong>sollte daher nicht übernommen werden, ohne den passenden Weg zu prüfen</strong>.', 'Bevor Sie eine Prüfung oder ein Datum festlegen, sollten Sie das Programm, die anerkannte Prüfungsversion und die geforderten Kompetenzen kennen.']],
      ['examen', 'TEFAQ oder TCF Québec: welche Prüfung?', ['Mit „TFQ“ ist meist der <strong>TEFAQ</strong> oder der <strong>TCF Québec</strong> gemeint. Das sind nicht einfach andere Namen für den TEF Canada: Version, Kompetenzen und behördliche Verwendung können sich unterscheiden.', 'Welche Prüfung anerkannt wird, muss für das Programm und zum Zeitpunkt des Antrags geprüft werden. Pathway kann Sprache und Prüfungsformat vorbereiten, wählt aber nicht anstelle der Bewerberin oder des Bewerbers den Einwanderungsweg.', '<p class="pg-note"><strong>Die richtige Reihenfolge:</strong> das offizielle Projekt bestätigen, die anerkannte Prüfung bestimmen und danach die Sprachvorbereitung aufbauen.</p>']],
      ['pathway', 'Was Pathway vorbereiten kann', ['Pathway arbeitet an allgemeinem Französisch und an Prüfungen wie DELF, DALF, TCF und TEF. Sobald das Projekt geklärt ist, lässt sich der Unterricht auf den TEFAQ oder den TCF Québec ausrichten: Format, Kompetenzen, Sprechpraxis, Korrekturen und Probeprüfungen.', 'Wenn Ihr Ziel ein Bundesprogramm ist, lesen Sie den Ratgeber zur <a href="{tef}">Vorbereitung auf den TEF Canada</a>. Für Québec verhindert ein kurzes Gespräch, dass Ihr Lernplan mit der falschen Prüfung beginnt.']]
    ],
    related: { eyebrow: 'Weiterlesen', title: 'Wählen Sie die passende Ressource.', links: [['nclc', 'Ratgeber', 'NCLC 7 verstehen'], ['tef', 'Ratgeber', 'Auf den TEF Canada vorbereiten'], ['resources', 'Ressourcen', 'Alle Ressourcen']] },
    cta: { title: 'Klären wir den Weg vor dem Tempo.', text: 'Erzählen Sie uns, welches Projekt Sie vorbereiten. Wir zeigen Ihnen die passende Sprachvorbereitung, ohne daraus eine Einwanderungsberatung zu machen.', primary: [quebecWhatsApp('Hallo Pathway, mein Projekt betrifft Québec und ich möchte die passende Vorbereitung finden.'), 'Mit Pathway sprechen'], secondary: ['test', 'Mein Niveau bestimmen'] }
  }
};

// Resources hub (/recursos.html, /fr/ressources.html, /en/resources.html,
// /de/ressourcen.html): guides, tools, programs and official sources in one
// place. It no longer repeats the TEF
// Canada guide. `href` is a page key of ROUTES, 'program:<level>', or an
// official IRCC page (IRCC.<name>).
export const RESOURCES = {
  es: {
    title: 'Recursos para aprender francés y preparar tu examen', description: 'Guías, herramientas, programas y fuentes oficiales de IRCC para preparar el TEF Canada o el TCF Canada, reunidos en un solo lugar.',
    eyebrow: 'Recursos Pathway', h1: ['Todo lo que necesitas', 'para preparar tu francés.'],
    lead: 'Guías, herramientas, programas por nivel y fuentes oficiales, reunidos en un solo lugar. Cada recurso te dice qué es y para qué sirve.',
    cardTitle: 'En esta página',
    groups: [
      { id: 'guias', title: 'Guías', text: 'Para entender el objetivo antes de elegir un ritmo.', links: [
        ['nclc', 'Guía', 'NCLC 7, explicado', 'Qué significa, cómo se demuestra y lo que no garantiza.'],
        ['tef', 'Guía', 'Preparar el TEF Canada', 'Las cuatro competencias, el formato y cómo prepara Pathway.'],
        ['tefaq', 'Quebec', 'Proyecto Quebec', 'TEFAQ y TCF Québec: primero la vía, después el examen.']] },
      { id: 'herramientas', title: 'Herramientas', text: 'Para saber dónde estás y qué te conviene.', links: [
        ['test', 'Herramienta', 'Test de nivel', 'Tu nivel estimado de A1 a B2, para empezar en el lugar correcto.'],
        ['calculator', 'Herramienta', 'Calculadora CRS', 'Estima tu puntaje CRS y lo que el francés puede cambiar.'],
        ['conditions', 'Información', 'Condiciones de inscripción', 'Fórmulas, precios, asistencia y compromiso NCLC 7.']] },
      { id: 'programas', title: 'Programas por nivel', text: 'El manual de cada nivel, con un extracto para hojear.', links: [
        ['program:a1', 'Programa', 'A1', 'Tus primeros pasos en francés.'],
        ['program:a2', 'Programa', 'A2', 'De la rutina a tus propias ideas.'],
        ['program:b1', 'Programa', 'B1', 'Exprésate con independencia.'],
        ['program:b2', 'Programa', 'B2', 'Argumenta con matices.']] },
      { id: 'oficiales', title: 'Fuentes oficiales de IRCC', text: 'Para verificar tu situación en la fuente. Páginas de canada.ca en inglés.', links: [
        ['IRCC.language', 'IRCC', 'Exámenes de idioma aceptados', 'Los exámenes aprobados para Express Entry, entre ellos TEF Canada y TCF Canada.'],
        ['IRCC.rounds', 'IRCC', 'Rondas de invitaciones', 'Los puntajes y las categorías de las rondas recientes.'],
        ['IRCC.score', 'IRCC', 'Herramienta oficial del puntaje CRS', 'El cálculo de IRCC, para confirmar una estimación.']] }
    ],
    cta: { title: 'Empieza por tu nivel.', text: 'El test de nivel sitúa tu punto de partida. Un profesor lo confirma en la primera clase y te propone el ritmo adecuado.' }
  },
  fr: {
    title: 'Ressources pour apprendre le français et préparer votre examen', description: 'Guides, outils, programmes et sources officielles d’IRCC pour préparer le TEF Canada ou le TCF Canada, réunis au même endroit.',
    eyebrow: 'Ressources Pathway', h1: ['Tout ce qu’il vous faut', 'pour préparer votre français.'],
    lead: 'Guides, outils, programmes par niveau et sources officielles, réunis au même endroit. Chaque ressource vous dit ce qu’elle est et à quoi elle sert.',
    cardTitle: 'Sur cette page',
    groups: [
      { id: 'guias', title: 'Guides', text: 'Pour comprendre l’objectif avant de choisir un rythme.', links: [
        ['nclc', 'Guide', 'Le NCLC 7 expliqué', 'Ce qu’il signifie, comment le démontrer et ce qu’il ne garantit pas.'],
        ['tef', 'Guide', 'Préparer le TEF Canada', 'Les quatre compétences, le format et la méthode Pathway.'],
        ['tefaq', 'Québec', 'Projet au Québec', 'TEFAQ et TCF Québec : d’abord la voie, ensuite l’examen.']] },
      { id: 'herramientas', title: 'Outils', text: 'Pour savoir où vous en êtes et ce qui vous convient.', links: [
        ['test', 'Outil', 'Test de positionnement', 'Votre niveau estimé, de l’A1 au B2, pour commencer au bon endroit.'],
        ['calculator', 'Outil', 'Calculateur CRS', 'Estimez votre score CRS et ce que le français peut changer.'],
        ['conditions', 'Information', 'Conditions d’inscription', 'Formules, prix, assiduité et engagement NCLC 7.']] },
      { id: 'programas', title: 'Programmes par niveau', text: 'Le manuel de chaque niveau, avec un extrait à feuilleter.', links: [
        ['program:a1', 'Programme', 'A1', 'Vos premiers pas en français.'],
        ['program:a2', 'Programme', 'A2', 'Du quotidien à vos propres idées.'],
        ['program:b1', 'Programme', 'B1', 'Exprimez-vous en autonomie.'],
        ['program:b2', 'Programme', 'B2', 'Argumentez avec nuance.']] },
      { id: 'oficiales', title: 'Sources officielles d’IRCC', text: 'Pour vérifier votre situation à la source, sur canada.ca.', links: [
        ['IRCC.language', 'IRCC', 'Examens linguistiques acceptés', 'Les examens approuvés pour Entrée express, dont le TEF Canada et le TCF Canada.'],
        ['IRCC.rounds', 'IRCC', 'Rondes d’invitations', 'Les scores et les catégories des rondes récentes.'],
        ['IRCC.score', 'IRCC', 'Outil officiel du score CRS', 'Le calcul d’IRCC, pour confirmer une estimation.']] }
    ],
    cta: { title: 'Commencez par votre niveau.', text: 'Le test de positionnement situe votre point de départ. Un professeur le confirme au premier cours et vous propose le bon rythme.' }
  },
  en: {
    title: 'Resources to learn French and prepare for your exam', description: 'Guides, tools, programs and official IRCC sources to prepare for the TEF Canada or the TCF Canada, all in one place.',
    eyebrow: 'Pathway resources', h1: ['Everything you need', 'to prepare your French.'],
    lead: 'Guides, tools, programs by level and official sources, all in one place. Each resource tells you what it is and what it is for.',
    cardTitle: 'On this page',
    groups: [
      { id: 'guias', title: 'Guides', text: 'To understand the goal before choosing a pace.', links: [
        ['nclc', 'Guide', 'NCLC 7 explained', 'What it means, how to prove it and what it does not guarantee.'],
        ['tef', 'Guide', 'Preparing for the TEF Canada', 'The four skills, the format and how Pathway prepares you.'],
        ['tefaq', 'Quebec', 'A Quebec project', 'TEFAQ and TCF Québec: first the path, then the exam.']] },
      { id: 'herramientas', title: 'Tools', text: 'To see where you stand and what suits you.', links: [
        ['test', 'Tool', 'Placement test', 'Your estimated level from A1 to B2, to start in the right place.'],
        ['calculator', 'Tool', 'CRS calculator', 'Estimate your CRS score and what French can change.'],
        ['conditions', 'Information', 'Enrolment terms', 'Plans, prices, attendance and the NCLC 7 commitment.']] },
      { id: 'programas', title: 'Programs by level', text: 'The textbook for each level, with an excerpt to browse.', links: [
        ['program:a1', 'Program', 'A1', 'Your first steps in French.'],
        ['program:a2', 'Program', 'A2', 'From daily routine to your own ideas.'],
        ['program:b1', 'Program', 'B1', 'Express yourself independently.'],
        ['program:b2', 'Program', 'B2', 'Argue with nuance.']] },
      { id: 'oficiales', title: 'Official IRCC sources', text: 'To check your situation at the source, on canada.ca.', links: [
        ['IRCC.language', 'IRCC', 'Approved language tests', 'The tests accepted for Express Entry, including the TEF Canada and the TCF Canada.'],
        ['IRCC.rounds', 'IRCC', 'Rounds of invitations', 'Scores and categories of recent rounds.'],
        ['IRCC.score', 'IRCC', 'Official CRS score tool', 'IRCC’s own calculation, to confirm an estimate.']] }
    ],
    cta: { title: 'Start with your level.', text: 'The placement test shows your starting point. A teacher confirms it in your first class and suggests the right pace.' }
  },
  de: {
    title: 'Ressourcen zum Französischlernen und zur Prüfungsvorbereitung', description: 'Ratgeber, Werkzeuge, Programme und offizielle IRCC-Quellen zur Vorbereitung auf TEF Canada oder TCF Canada, an einem Ort.',
    eyebrow: 'Pathway-Ressourcen', h1: ['Alles, was Sie brauchen,', 'um Ihr Französisch vorzubereiten.'],
    lead: 'Ratgeber, Werkzeuge, Programme nach Niveau und offizielle Quellen an einem Ort. Zu jeder Ressource steht, was sie ist und wofür sie dient.',
    cardTitle: 'Auf dieser Seite',
    groups: [
      { id: 'guias', title: 'Ratgeber', text: 'Um das Ziel zu verstehen, bevor Sie ein Tempo wählen.', links: [
        ['nclc', 'Ratgeber', 'NCLC 7 erklärt', 'Was es bedeutet, wie man es nachweist und was es nicht garantiert.'],
        ['tef', 'Ratgeber', 'Auf den TEF Canada vorbereiten', 'Die vier Kompetenzen, das Format und wie Pathway vorbereitet.'],
        ['tefaq', 'Québec', 'Projekt Québec', 'TEFAQ und TCF Québec: zuerst der Weg, dann die Prüfung.']] },
      { id: 'herramientas', title: 'Werkzeuge', text: 'Um zu sehen, wo Sie stehen und was zu Ihnen passt.', links: [
        ['test', 'Werkzeug', 'Einstufungstest', 'Ihr geschätztes Niveau von A1 bis B2, um am richtigen Punkt zu beginnen.'],
        ['calculator', 'Werkzeug', 'CRS-Rechner', 'Schätzen Sie Ihren CRS-Wert und was Französisch ändern kann.'],
        ['conditions', 'Information', 'Anmeldebedingungen', 'Pakete, Preise, Anwesenheit und NCLC-7-Zusage.']] },
      { id: 'programas', title: 'Programme nach Niveau', text: 'Das Lehrbuch jedes Niveaus, mit einem Auszug zum Durchblättern.', links: [
        ['program:a1', 'Programm', 'A1', 'Ihre ersten Schritte auf Französisch.'],
        ['program:a2', 'Programm', 'A2', 'Vom Alltag zu Ihren eigenen Ideen.'],
        ['program:b1', 'Programm', 'B1', 'Drücken Sie sich selbstständig aus.'],
        ['program:b2', 'Programm', 'B2', 'Argumentieren Sie differenziert.']] },
      { id: 'oficiales', title: 'Offizielle IRCC-Quellen', text: 'Um Ihre Situation an der Quelle zu prüfen. Seiten von canada.ca auf Englisch.', links: [
        ['IRCC.language', 'IRCC', 'Anerkannte Sprachtests', 'Die für Express Entry anerkannten Prüfungen, darunter TEF Canada und TCF Canada.'],
        ['IRCC.rounds', 'IRCC', 'Einladungsrunden', 'Punktzahlen und Kategorien der letzten Runden.'],
        ['IRCC.score', 'IRCC', 'Offizielles CRS-Werkzeug', 'Die Berechnung von IRCC, um eine Schätzung zu bestätigen.']] }
    ],
    cta: { title: 'Beginnen Sie mit Ihrem Niveau.', text: 'Der Einstufungstest zeigt Ihren Ausgangspunkt. Eine Lehrkraft bestätigt ihn in der ersten Stunde und schlägt das passende Tempo vor.' }
  }
};
