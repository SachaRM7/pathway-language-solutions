// Copy of the V4 content pages. Spanish reproduces the current pages word for
// word; French, English and German are faithful translations. Legal pages
// (conditions, privacy) are not here: their text is read from the current
// pages at build time so it can never drift from the published terms.

export const ROUTES = {
  nclc: { es: 'nclc-7.html', fr: 'nclc-7.html', en: 'nclc-7.html', de: 'nclc-7.html' },
  tef: { es: 'preparacion-tef-canada.html', fr: 'preparacion-tef-canada.html', en: 'preparacion-tef-canada.html', de: 'preparacion-tef-canada.html' },
  conditions: { es: 'condiciones.html', fr: 'conditions-nclc7.html', en: 'conditions-nclc7.html', de: 'conditions-nclc7.html' },
  privacy: { es: 'privacidad.html', fr: 'politique-confidentialite.html', en: 'politique-confidentialite.html', de: 'politique-confidentialite.html' },
  cookies: { es: 'cookies.html', fr: 'cookies.html', en: 'cookies.html', de: 'cookies.html' },
  legal: { es: 'aviso-legal.html', fr: 'mentions-legales.html', en: 'legal-notice.html', de: 'rechtliche-hinweise.html' },
  test: { es: 'test-placement.html', fr: 'test.html', en: 'test.html', de: 'test.html' },
  calculator: { es: 'calculador.html', fr: 'calculateur-crs.html', en: 'calculateur-crs.html', de: 'calculateur-crs.html' },
  inscription: { es: 'inscription.html', fr: 'inscription.html', en: 'inscription.html', de: 'inscription.html' }
};

export const UI = {
  es: {
    home: 'Inicio', guides: 'Guías', legal: 'Información legal', onThisPage: 'En esta página', keepGoing: 'Para seguir',
    evaluate: 'Evaluar mi nivel', evaluateStart: 'Medir mi punto de partida', whatsapp: 'Prefiero hablar por WhatsApp', open: 'Abrir',
    ctaEyebrow: 'Tu primer paso · sin compromiso', officialSource: 'Fuente oficial IRCC', summary: 'En resumen', skip: 'Saltar al contenido',
    updated: 'Última revisión: octubre de 2026'
  },
  fr: {
    home: 'Accueil', guides: 'Guides', legal: 'Informations légales', onThisPage: 'Sur cette page', keepGoing: 'Pour continuer',
    evaluate: 'Évaluer mon niveau', evaluateStart: 'Mesurer mon point de départ', whatsapp: 'Je préfère écrire sur WhatsApp', open: 'Ouvrir',
    ctaEyebrow: 'Votre première étape · sans engagement', officialSource: 'Source officielle IRCC', summary: 'En bref', skip: 'Aller au contenu',
    updated: 'Dernière révision : octobre 2026'
  },
  en: {
    home: 'Home', guides: 'Guides', legal: 'Legal information', onThisPage: 'On this page', keepGoing: 'Keep going',
    evaluate: 'Assess my level', evaluateStart: 'Measure my starting point', whatsapp: 'I’d rather talk on WhatsApp', open: 'Open',
    ctaEyebrow: 'Your first step · no commitment', officialSource: 'Official IRCC source', summary: 'In short', skip: 'Skip to content',
    updated: 'Last reviewed: October 2026'
  },
  de: {
    home: 'Startseite', guides: 'Ratgeber', legal: 'Rechtliches', onThisPage: 'Auf dieser Seite', keepGoing: 'Weiterlesen',
    evaluate: 'Mein Niveau einstufen', evaluateStart: 'Meinen Ausgangspunkt messen', whatsapp: 'Lieber per WhatsApp schreiben', open: 'Öffnen',
    ctaEyebrow: 'Ihr erster Schritt · unverbindlich', officialSource: 'Offizielle IRCC-Quelle', summary: 'Kurz gesagt', skip: 'Zum Inhalt springen',
    updated: 'Zuletzt geprüft: Oktober 2026'
  }
};

const IRCC_LANGUAGE = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements.html';

export const GUIDES = {
  nclc: {
    es: {
      title: 'NCLC 7, explicado sin promesas migratorias', description: 'Qué significa NCLC 7, cómo se demuestra con el TEF Canada o el TCF Canada y qué puede cambiar en un perfil Express Entry, sin promesas migratorias.',
      eyebrow: 'Niveles canadienses de competencia lingüística', h1: ['NCLC 7, explicado', 'sin promesas migratorias.'],
      lead: 'Es un nivel canadiense de referencia para el francés. En Express Entry, importa tanto por los puntos como por la categoría francófona.',
      card: { pill: 'El objetivo', title: 'NCLC 7: el umbral francófono', text: 'Se mide por separado en cada competencia.', rows: [['Comprensión oral', 'NCLC 7+'], ['Comprensión escrita', 'NCLC 7+'], ['Expresión oral', 'NCLC 7+'], ['Expresión escrita', 'NCLC 7+']], note: 'NCLC 7 o más en cada competencia. No garantiza una invitación.' },
      sections: [
        ['definicion', 'Qué significa NCLC 7', ['Los NCLC son la escala canadiense utilizada para describir la competencia en francés. El número no es una nota escolar ni el nombre de un examen: es un nivel de referencia.', 'Para un resultado completo, se observan por separado la comprensión oral, la comprensión escrita, la expresión oral y la expresión escrita. Alcanzar el umbral en una competencia no compensa automáticamente otra que quede por debajo.']],
        ['demostrarlo', 'Cómo se demuestra', ['En los programas federales, el francés puede demostrarse con un examen aprobado como el TEF Canada o el TCF Canada. IRCC convierte los resultados de cada competencia a la escala NCLC.', 'No es responsable presentar A2, B1 o B2 como conversiones automáticas. El CECRL ayuda a situar el nivel general; la tabla oficial del examen determina el resultado canadiense. Consulta también nuestra guía de <a href="{tef}">preparación al TEF Canada</a>.']],
        ['cambia', 'Qué puede cambiar en tu perfil', ['Según la combinación de idiomas y el resto del expediente, el francés puede aportar puntos como segunda lengua oficial, activar puntos adicionales o contribuir a la elegibilidad de una categoría francófona.', 'El impacto real depende de todo el perfil. La cifra visible en una ronda anterior sirve para comprender un escenario, no para predecir una invitación futura.']],
        ['limites', 'Lo que NCLC 7 no garantiza', ['Un nivel lingüístico no reemplaza los demás criterios de un programa. Pathway acompaña la preparación lingüística; no decide la vía migratoria ni representa expedientes.', '<p class="pg-note"><strong>Para una decisión migratoria:</strong> valida tu situación con las fuentes oficiales o con un profesional regulado. Para una decisión de aprendizaje, comienza por medir el punto de partida.</p>']]
      ],
      related: { eyebrow: 'Para seguir', title: 'Del nivel al próximo paso.', links: [['tef', 'Guía', 'Preparar el TEF Canada'], ['calculator', 'Herramienta', 'Calcular mi puntaje CRS'], ['home#preguntas', 'Preguntas', 'Preguntas frecuentes']] },
      cta: { title: '¿Tu objetivo lingüístico es viable?', text: 'El test progresivo sitúa tu nivel actual y ayuda a elegir un ritmo de trabajo coherente, que se confirmará durante la primera clase.' }
    },
    fr: {
      title: 'Le NCLC 7 expliqué, sans promesses migratoires', description: 'Ce que signifie le NCLC 7, comment le démontrer avec le TEF Canada ou le TCF Canada et ce qu’il peut changer dans un profil Entrée express, sans promesses migratoires.',
      eyebrow: 'Niveaux de compétence linguistique canadiens', h1: ['Le NCLC 7 expliqué,', 'sans promesses migratoires.'],
      lead: 'C’est un niveau canadien de référence pour le français. Dans Entrée express, il compte autant pour les points que pour la catégorie francophone.',
      card: { pill: 'L’objectif', title: 'NCLC 7 : le seuil francophone', text: 'Il se mesure séparément dans chaque compétence.', rows: [['Compréhension orale', 'NCLC 7+'], ['Compréhension écrite', 'NCLC 7+'], ['Expression orale', 'NCLC 7+'], ['Expression écrite', 'NCLC 7+']], note: 'NCLC 7 ou plus dans chaque compétence. Ne garantit pas une invitation.' },
      sections: [
        ['definition', 'Ce que signifie le NCLC 7', ['Les NCLC sont l’échelle canadienne utilisée pour décrire la compétence en français. Le chiffre n’est ni une note scolaire ni le nom d’un examen : c’est un niveau de référence.', 'Pour un résultat complet, on observe séparément la compréhension orale, la compréhension écrite, l’expression orale et l’expression écrite. Atteindre le seuil dans une compétence ne compense pas automatiquement une autre restée en dessous.']],
        ['demontrer', 'Comment le démontrer', ['Dans les programmes fédéraux, le français peut être démontré par un examen reconnu comme le TEF Canada ou le TCF Canada. IRCC convertit les résultats de chaque compétence sur l’échelle NCLC.', 'Il n’est pas responsable de présenter A2, B1 ou B2 comme des conversions automatiques. Le CECRL aide à situer le niveau général ; la table officielle de l’examen détermine le résultat canadien. Consultez aussi notre guide de <a href="{tef}">préparation au TEF Canada</a>.']],
        ['changer', 'Ce qui peut changer dans votre profil', ['Selon la combinaison des langues et le reste du dossier, le français peut rapporter des points comme seconde langue officielle, déclencher des points supplémentaires ou contribuer à l’admissibilité à une catégorie francophone.', 'L’impact réel dépend de l’ensemble du profil. Le chiffre affiché lors d’une ronde passée aide à comprendre un scénario, pas à prédire une invitation future.']],
        ['limites', 'Ce que le NCLC 7 ne garantit pas', ['Un niveau de langue ne remplace pas les autres critères d’un programme. Pathway accompagne la préparation linguistique ; il ne décide pas de la voie migratoire et ne représente pas de dossiers.', '<p class="pg-note"><strong>Pour une décision migratoire :</strong> vérifiez votre situation auprès des sources officielles ou d’un professionnel réglementé. Pour une décision d’apprentissage, commencez par mesurer votre point de départ.</p>']]
      ],
      related: { eyebrow: 'Pour continuer', title: 'Du niveau à la prochaine étape.', links: [['tef', 'Guide', 'Préparer le TEF Canada'], ['calculator', 'Outil', 'Calculer mon score CRS'], ['home#preguntas', 'Questions', 'Questions fréquentes']] },
      cta: { title: 'Votre objectif linguistique est-il réaliste ?', text: 'Le test progressif situe votre niveau actuel et aide à choisir un rythme de travail cohérent, confirmé lors du premier cours.' }
    },
    en: {
      title: 'NCLC 7 explained, without immigration promises', description: 'What NCLC 7 means, how to prove it with the TEF Canada or TCF Canada, and what it can change in an Express Entry profile, without immigration promises.',
      eyebrow: 'Canadian language benchmarks', h1: ['NCLC 7 explained,', 'without immigration promises.'],
      lead: 'It is a Canadian reference level for French. In Express Entry, it matters both for points and for the French-language category.',
      card: { pill: 'The target', title: 'NCLC 7: the French-language threshold', text: 'It is measured separately in each skill.', rows: [['Listening', 'NCLC 7+'], ['Reading', 'NCLC 7+'], ['Speaking', 'NCLC 7+'], ['Writing', 'NCLC 7+']], note: 'NCLC 7 or higher in every skill. It does not guarantee an invitation.' },
      sections: [
        ['meaning', 'What NCLC 7 means', ['The NCLC is the Canadian scale used to describe proficiency in French. The number is neither a school grade nor the name of an exam: it is a reference level.', 'For a complete result, listening, reading, speaking and writing are assessed separately. Reaching the threshold in one skill does not automatically make up for another one that falls short.']],
        ['proof', 'How it is proven', ['For federal programs, French can be proven with an approved exam such as the TEF Canada or the TCF Canada. IRCC converts the result of each skill to the NCLC scale.', 'It would not be responsible to present A2, B1 or B2 as automatic conversions. The CEFR helps place your overall level; the exam’s official table determines the Canadian result. See also our <a href="{tef}">TEF Canada preparation guide</a>.']],
        ['impact', 'What it can change in your profile', ['Depending on your language combination and the rest of your file, French can add points as a second official language, unlock additional points or contribute to eligibility for a French-language category.', 'The real impact depends on the whole profile. The figure shown in a past round helps you understand a scenario, not predict a future invitation.']],
        ['limits', 'What NCLC 7 does not guarantee', ['A language level does not replace a program’s other criteria. Pathway supports your language preparation; it does not choose your immigration route or represent applications.', '<p class="pg-note"><strong>For an immigration decision:</strong> check your situation against official sources or with a regulated professional. For a learning decision, start by measuring your starting point.</p>']]
      ],
      related: { eyebrow: 'Keep going', title: 'From your level to the next step.', links: [['tef', 'Guide', 'Preparing for the TEF Canada'], ['calculator', 'Tool', 'Calculate my CRS score'], ['home#preguntas', 'Questions', 'Frequently asked questions']] },
      cta: { title: 'Is your language goal realistic?', text: 'The progressive test places your current level and helps you choose a coherent pace, confirmed during your first class.' }
    },
    de: {
      title: 'NCLC 7 erklärt, ohne Einwanderungsversprechen', description: 'Was NCLC 7 bedeutet, wie man es mit dem TEF Canada oder TCF Canada nachweist und was es in einem Express-Entry-Profil ändern kann, ohne Einwanderungsversprechen.',
      eyebrow: 'Kanadische Sprachniveaus', h1: ['NCLC 7 erklärt,', 'ohne Einwanderungsversprechen.'],
      lead: 'Es ist ein kanadisches Referenzniveau für Französisch. In Express Entry zählt es sowohl für die Punkte als auch für die frankophone Kategorie.',
      card: { pill: 'Das Ziel', title: 'NCLC 7: die frankophone Schwelle', text: 'Es wird in jeder Kompetenz einzeln gemessen.', rows: [['Hörverstehen', 'NCLC 7+'], ['Leseverstehen', 'NCLC 7+'], ['Mündlicher Ausdruck', 'NCLC 7+'], ['Schriftlicher Ausdruck', 'NCLC 7+']], note: 'NCLC 7 oder höher in jeder Kompetenz. Das garantiert keine Einladung.' },
      sections: [
        ['bedeutung', 'Was NCLC 7 bedeutet', ['Die NCLC sind die kanadische Skala zur Beschreibung der Französischkompetenz. Die Zahl ist weder eine Schulnote noch der Name einer Prüfung, sondern ein Referenzniveau.', 'Für ein vollständiges Ergebnis werden Hörverstehen, Leseverstehen, mündlicher und schriftlicher Ausdruck getrennt betrachtet. Wer die Schwelle in einer Kompetenz erreicht, gleicht damit nicht automatisch eine andere aus, die darunter bleibt.']],
        ['nachweis', 'Wie man es nachweist', ['In den Bundesprogrammen lässt sich Französisch mit einer anerkannten Prüfung wie dem TEF Canada oder dem TCF Canada nachweisen. IRCC rechnet die Ergebnisse jeder Kompetenz in die NCLC-Skala um.', 'Es wäre nicht verantwortungsvoll, A2, B1 oder B2 als automatische Umrechnungen darzustellen. Der GER hilft, das allgemeine Niveau einzuordnen; die offizielle Tabelle der Prüfung bestimmt das kanadische Ergebnis. Lesen Sie auch unseren Ratgeber zur <a href="{tef}">Vorbereitung auf den TEF Canada</a>.']],
        ['wirkung', 'Was sich in Ihrem Profil ändern kann', ['Je nach Sprachkombination und übrigem Profil kann Französisch Punkte als zweite Amtssprache bringen, Zusatzpunkte auslösen oder zur Berechtigung für eine frankophone Kategorie beitragen.', 'Die tatsächliche Wirkung hängt vom gesamten Profil ab. Die Zahl einer früheren Ziehung hilft, ein Szenario zu verstehen, nicht eine künftige Einladung vorherzusagen.']],
        ['grenzen', 'Was NCLC 7 nicht garantiert', ['Ein Sprachniveau ersetzt nicht die übrigen Kriterien eines Programms. Pathway begleitet die sprachliche Vorbereitung; es entscheidet nicht über den Einwanderungsweg und vertritt keine Anträge.', '<p class="pg-note"><strong>Für eine Einwanderungsentscheidung:</strong> Prüfen Sie Ihre Situation anhand offizieller Quellen oder mit einer zugelassenen Fachperson. Für eine Lernentscheidung beginnen Sie damit, Ihren Ausgangspunkt zu messen.</p>']]
      ],
      related: { eyebrow: 'Weiterlesen', title: 'Vom Niveau zum nächsten Schritt.', links: [['tef', 'Ratgeber', 'Auf den TEF Canada vorbereiten'], ['calculator', 'Werkzeug', 'Meinen CRS-Wert berechnen'], ['home#preguntas', 'Fragen', 'Häufige Fragen']] },
      cta: { title: 'Ist Ihr Sprachziel realistisch?', text: 'Der progressive Test bestimmt Ihr aktuelles Niveau und hilft, ein stimmiges Arbeitstempo zu wählen, das in der ersten Stunde bestätigt wird.' }
    }
  },
  tef: {
    es: {
      title: 'Preparación TEF Canada', description: 'Prepara el TEF Canada hacia NCLC 7: qué evalúa el examen, por qué importa NCLC 7, cómo prepara Pathway y cuánto tiempo necesitas.',
      eyebrow: 'TEF Canada · Preparación en español', h1: ['Preparar el examen', 'no es memorizar francés.'],
      lead: 'Es entrenar cuatro competencias, entender el formato y convertir tu nivel actual en una estrategia medible hacia NCLC 7.',
      card: { pill: 'El examen', title: 'Cuatro competencias evaluadas', text: 'IRCC convierte cada resultado en un nivel NCLC.', rows: [['Comprensión oral', 'NCLC'], ['Comprensión escrita', 'NCLC'], ['Expresión oral', 'NCLC'], ['Expresión escrita', 'NCLC']], note: 'Las cuatro cuentan: preparamos el formato y lo que limita realmente tu resultado.' },
      sections: [
        ['examen', 'Qué evalúa el TEF Canada', ['El TEF Canada mide comprensión oral, comprensión escrita, expresión oral y expresión escrita. IRCC convierte cada resultado en un nivel canadiense de competencia lingüística.', 'Las cuatro competencias cuentan. Una preparación eficaz no consiste en acumular reglas: consiste en conocer el formato, practicar en condiciones de examen y reforzar lo que limita realmente el resultado.']],
        ['nclc', 'Por qué se habla tanto de NCLC 7', ['NCLC 7 es un umbral importante en varios escenarios de Express Entry. Puede influir en el cálculo de puntos y en la elegibilidad para determinadas categorías, pero no garantiza por sí solo una invitación.', 'El objetivo lingüístico debe leerse dentro de un perfil completo: experiencia, estudios, edad y demás factores migratorios. Puedes consultar nuestra guía para <a href="{nclc}">comprender NCLC 7</a> sin promesas ni atajos.']],
        ['metodo', 'Cómo prepara Pathway', ['El plan se construye desde el nivel actual, el objetivo y el tiempo disponible. La intensidad cambia; la exigencia y el seguimiento no.', '<ul><li>Clases privadas en vivo con profesor nativo.</li><li>Diagnóstico de las cuatro competencias y plan por prioridades.</li><li>Práctica oral activa, correcciones y seguimiento.</li><li>Grabaciones, cuaderno virtual y talleres prácticos.</li><li>Dos simulacros TEF / TCF para medir el progreso.</li></ul>', 'Pathway también acompaña otros objetivos y exámenes de francés. Para Express Entry, el foco de esta ruta es el TEF Canada o el TCF Canada.']],
        ['plazo', 'Cuánto tiempo necesitas', ['Depende del punto de partida, de las horas semanales y, sobre todo, de la regularidad. Los ritmos de 2, 4 o 6 horas por semana sirven para construir escenarios, no promesas automáticas.', '<p class="pg-note"><strong>El buen primer paso:</strong> medir el nivel de partida. Sin un diagnóstico, no damos un plazo preciso ni inventamos equivalencias entre CECRL y NCLC.</p>']]
      ],
      related: { eyebrow: 'Para seguir', title: 'Tu próximo punto de referencia, sin volver al inicio.', links: [['nclc', 'Guía', 'Comprender NCLC 7'], ['home#planes', 'Planes', 'Comparar los planes'], ['calculator', 'Herramienta', 'Calcular mi puntaje CRS']] },
      cta: { title: 'Convierte la meta en un plan.', text: 'Completa el test progresivo. El resultado orienta la intensidad y se confirma durante la primera clase.' }
    },
    fr: {
      title: 'Préparation au TEF Canada', description: 'Préparez le TEF Canada vers le NCLC 7 : ce que l’examen évalue, pourquoi le NCLC 7 compte, comment Pathway prépare et combien de temps prévoir.',
      eyebrow: 'TEF Canada · Préparation', h1: ['Préparer l’examen,', 'ce n’est pas mémoriser le français.'],
      lead: 'C’est entraîner quatre compétences, comprendre le format et transformer votre niveau actuel en une stratégie mesurable vers le NCLC 7.',
      card: { pill: 'L’examen', title: 'Quatre compétences évaluées', text: 'IRCC convertit chaque résultat en niveau NCLC.', rows: [['Compréhension orale', 'NCLC'], ['Compréhension écrite', 'NCLC'], ['Expression orale', 'NCLC'], ['Expression écrite', 'NCLC']], note: 'Les quatre comptent : nous préparons le format et ce qui limite réellement votre résultat.' },
      sections: [
        ['examen', 'Ce qu’évalue le TEF Canada', ['Le TEF Canada mesure la compréhension orale, la compréhension écrite, l’expression orale et l’expression écrite. IRCC convertit chaque résultat en niveau de compétence linguistique canadien.', 'Les quatre compétences comptent. Une préparation efficace ne consiste pas à accumuler des règles : elle consiste à connaître le format, s’entraîner en conditions d’examen et renforcer ce qui limite réellement le résultat.']],
        ['nclc', 'Pourquoi on parle autant du NCLC 7', ['Le NCLC 7 est un seuil important dans plusieurs scénarios d’Entrée express. Il peut influer sur le calcul des points et sur l’admissibilité à certaines catégories, mais ne garantit pas à lui seul une invitation.', 'L’objectif linguistique se lit dans un profil complet : expérience, études, âge et autres facteurs migratoires. Consultez notre guide pour <a href="{nclc}">comprendre le NCLC 7</a> sans promesses ni raccourcis.']],
        ['methode', 'Comment Pathway prépare', ['Le plan se construit à partir du niveau actuel, de l’objectif et du temps disponible. L’intensité change ; l’exigence et le suivi, non.', '<ul><li>Cours particuliers en direct avec un enseignant natif.</li><li>Diagnostic des quatre compétences et plan par priorités.</li><li>Pratique orale active, corrections et suivi.</li><li>Enregistrements, cahier virtuel et ateliers pratiques.</li><li>Deux examens blancs TEF / TCF pour mesurer les progrès.</li></ul>', 'Pathway accompagne aussi d’autres objectifs et examens de français. Pour Entrée express, cette voie se concentre sur le TEF Canada ou le TCF Canada.']],
        ['delai', 'Combien de temps prévoir', ['Cela dépend du point de départ, des heures hebdomadaires et surtout de la régularité. Les rythmes de 2, 4 ou 6 heures par semaine servent à construire des scénarios, pas des promesses automatiques.', '<p class="pg-note"><strong>La bonne première étape :</strong> mesurer le niveau de départ. Sans diagnostic, nous ne donnons pas de délai précis et n’inventons pas d’équivalences entre CECRL et NCLC.</p>']]
      ],
      related: { eyebrow: 'Pour continuer', title: 'Votre prochain repère, sans repartir de zéro.', links: [['nclc', 'Guide', 'Comprendre le NCLC 7'], ['home#planes', 'Rythmes', 'Comparer les rythmes'], ['calculator', 'Outil', 'Calculer mon score CRS']] },
      cta: { title: 'Transformez l’objectif en plan.', text: 'Faites le test progressif. Le résultat oriente l’intensité et se confirme lors du premier cours.' }
    },
    en: {
      title: 'TEF Canada preparation', description: 'Prepare for the TEF Canada towards NCLC 7: what the exam assesses, why NCLC 7 matters, how Pathway prepares you and how much time you need.',
      eyebrow: 'TEF Canada · Preparation', h1: ['Preparing for the exam', 'is not memorizing French.'],
      lead: 'It means training four skills, understanding the format and turning your current level into a measurable strategy towards NCLC 7.',
      card: { pill: 'The exam', title: 'Four skills assessed', text: 'IRCC converts each result into an NCLC level.', rows: [['Listening', 'NCLC'], ['Reading', 'NCLC'], ['Speaking', 'NCLC'], ['Writing', 'NCLC']], note: 'All four count: we prepare the format and whatever really limits your result.' },
      sections: [
        ['exam', 'What the TEF Canada assesses', ['The TEF Canada measures listening, reading, speaking and writing. IRCC converts each result into a Canadian language benchmark level.', 'All four skills count. Effective preparation is not about piling up rules: it is about knowing the format, practicing under exam conditions and strengthening what really limits the result.']],
        ['nclc', 'Why NCLC 7 gets so much attention', ['NCLC 7 is an important threshold in several Express Entry scenarios. It can affect the points calculation and eligibility for certain categories, but on its own it does not guarantee an invitation.', 'A language goal has to be read within a full profile: experience, education, age and other immigration factors. See our guide to <a href="{nclc}">understanding NCLC 7</a> without promises or shortcuts.']],
        ['method', 'How Pathway prepares you', ['The plan is built from your current level, your goal and the time you have. The intensity changes; the standards and follow-up do not.', '<ul><li>Live private classes with a native teacher.</li><li>Diagnosis of all four skills and a plan by priorities.</li><li>Active speaking practice, corrections and follow-up.</li><li>Recordings, a virtual notebook and practical workshops.</li><li>Two TEF / TCF mock exams to measure progress.</li></ul>', 'Pathway also supports other French goals and exams. For Express Entry, this path focuses on the TEF Canada or the TCF Canada.']],
        ['timing', 'How much time you need', ['It depends on your starting point, your weekly hours and, above all, your consistency. Paces of 2, 4 or 6 hours a week are for building scenarios, not automatic promises.', '<p class="pg-note"><strong>The right first step:</strong> measure your starting level. Without a diagnosis, we do not give a precise timeline or invent equivalences between the CEFR and NCLC.</p>']]
      ],
      related: { eyebrow: 'Keep going', title: 'Your next reference point, without starting over.', links: [['nclc', 'Guide', 'Understanding NCLC 7'], ['home#planes', 'Plans', 'Compare the plans'], ['calculator', 'Tool', 'Calculate my CRS score']] },
      cta: { title: 'Turn the goal into a plan.', text: 'Take the progressive test. The result guides the intensity and is confirmed during your first class.' }
    },
    de: {
      title: 'Vorbereitung auf den TEF Canada', description: 'Bereiten Sie sich auf den TEF Canada mit Ziel NCLC 7 vor: was die Prüfung bewertet, warum NCLC 7 zählt, wie Pathway vorbereitet und wie viel Zeit Sie brauchen.',
      eyebrow: 'TEF Canada · Vorbereitung', h1: ['Sich auf die Prüfung vorbereiten', 'heißt nicht, Französisch auswendig zu lernen.'],
      lead: 'Es heißt, vier Kompetenzen zu trainieren, das Format zu verstehen und Ihr aktuelles Niveau in eine messbare Strategie Richtung NCLC 7 zu verwandeln.',
      card: { pill: 'Die Prüfung', title: 'Vier bewertete Kompetenzen', text: 'IRCC rechnet jedes Ergebnis in ein NCLC-Niveau um.', rows: [['Hörverstehen', 'NCLC'], ['Leseverstehen', 'NCLC'], ['Mündlicher Ausdruck', 'NCLC'], ['Schriftlicher Ausdruck', 'NCLC']], note: 'Alle vier zählen: Wir bereiten das Format vor und das, was Ihr Ergebnis tatsächlich begrenzt.' },
      sections: [
        ['pruefung', 'Was der TEF Canada bewertet', ['Der TEF Canada misst Hörverstehen, Leseverstehen, mündlichen und schriftlichen Ausdruck. IRCC rechnet jedes Ergebnis in ein kanadisches Sprachniveau um.', 'Alle vier Kompetenzen zählen. Eine wirksame Vorbereitung bedeutet nicht, Regeln anzuhäufen, sondern das Format zu kennen, unter Prüfungsbedingungen zu üben und das zu stärken, was das Ergebnis tatsächlich begrenzt.']],
        ['nclc', 'Warum so viel über NCLC 7 gesprochen wird', ['NCLC 7 ist in mehreren Express-Entry-Szenarien eine wichtige Schwelle. Es kann die Punkteberechnung und die Berechtigung für bestimmte Kategorien beeinflussen, garantiert aber allein keine Einladung.', 'Das Sprachziel ist im Gesamtprofil zu sehen: Erfahrung, Ausbildung, Alter und weitere Einwanderungsfaktoren. Lesen Sie unseren Ratgeber, um <a href="{nclc}">NCLC 7 zu verstehen</a>, ohne Versprechen und Abkürzungen.']],
        ['methode', 'Wie Pathway vorbereitet', ['Der Plan entsteht aus dem aktuellen Niveau, dem Ziel und der verfügbaren Zeit. Die Intensität ändert sich, der Anspruch und die Begleitung nicht.', '<ul><li>Live-Einzelunterricht mit einer muttersprachlichen Lehrkraft.</li><li>Diagnose der vier Kompetenzen und Plan nach Prioritäten.</li><li>Aktive Sprechpraxis, Korrekturen und Begleitung.</li><li>Aufzeichnungen, virtuelles Heft und praktische Workshops.</li><li>Zwei TEF-/TCF-Probeprüfungen, um den Fortschritt zu messen.</li></ul>', 'Pathway begleitet auch andere Französischziele und -prüfungen. Für Express Entry konzentriert sich dieser Weg auf den TEF Canada oder den TCF Canada.']],
        ['zeit', 'Wie viel Zeit Sie brauchen', ['Das hängt vom Ausgangspunkt, von den Wochenstunden und vor allem von der Regelmäßigkeit ab. Rhythmen von 2, 4 oder 6 Stunden pro Woche dienen dazu, Szenarien zu entwickeln, nicht automatische Versprechen.', '<p class="pg-note"><strong>Der richtige erste Schritt:</strong> das Ausgangsniveau messen. Ohne Diagnose nennen wir keine genaue Dauer und erfinden keine Entsprechungen zwischen GER und NCLC.</p>']]
      ],
      related: { eyebrow: 'Weiterlesen', title: 'Ihr nächster Orientierungspunkt, ohne von vorn zu beginnen.', links: [['nclc', 'Ratgeber', 'NCLC 7 verstehen'], ['home#planes', 'Rhythmen', 'Rhythmen vergleichen'], ['calculator', 'Werkzeug', 'Meinen CRS-Wert berechnen']] },
      cta: { title: 'Machen Sie aus dem Ziel einen Plan.', text: 'Machen Sie den progressiven Test. Das Ergebnis bestimmt die Intensität und wird in der ersten Stunde bestätigt.' }
    }
  }
};

// Card shown beside the legal pages, read from their own sections.
export const LEGAL_CARD = {
  conditions: { es: ['El recorrido', 'Las etapas del compromiso'], fr: ['Le parcours', 'Les étapes de l’engagement'], en: ['The path', 'The stages of the commitment'], de: ['Der Weg', 'Die Etappen der Zusage'] },
  privacy: { es: ['Transparencia', 'Lo esencial'], fr: ['Transparence', 'L’essentiel'], en: ['Transparency', 'The essentials'], de: ['Transparenz', 'Das Wichtigste'] }
};

export const LEGAL_CTA = {
  conditions: {
    es: ['Documenta tu punto de partida.', 'El test de placement inicia el expediente que permitirá definir el número de ciclos, la intensidad y la duración aplicables.'],
    fr: ['Documentez votre point de départ.', 'Le test de placement ouvre le dossier qui permettra de définir le nombre de cycles, l’intensité et la durée applicables.'],
    en: ['Document your starting point.', 'The placement test opens the file used to define the number of cycles, the intensity and the duration that apply.'],
    de: ['Dokumentieren Sie Ihren Ausgangspunkt.', 'Der Einstufungstest eröffnet die Akte, mit der Anzahl der Zyklen, Intensität und Dauer festgelegt werden.']
  },
  privacy: {
    es: ['¿Tienes una pregunta?', 'Escríbenos sobre el uso de tus datos.', 'Contactar por email'],
    fr: ['Une question ?', 'Écrivez-nous au sujet de l’utilisation de vos données.', 'Nous écrire'],
    en: ['Have a question?', 'Write to us about how your data is used.', 'Email us'],
    de: ['Haben Sie eine Frage?', 'Schreiben Sie uns zur Verwendung Ihrer Daten.', 'E-Mail schreiben']
  }
};

// New Spanish pages linked from the V4 footer. Only facts that can be checked
// in this repository are stated; nothing about company registration is
// invented.
export const NEW_LEGAL = {
  cookies: {
    title: 'Política de cookies', description: 'Qué guarda el sitio de Pathway en tu navegador: sin cookies de seguimiento, almacenamiento de sesión para el test y la inscripción.',
    eyebrow: 'Transparencia', h1: ['Política de cookies', 'y almacenamiento.'],
    lead: 'El sitio de Pathway no instala cookies publicitarias ni de seguimiento. Para que el test, el calculador y la inscripción funcionen, guarda temporalmente algunos datos en tu propio navegador.',
    card: { pill: 'En resumen', title: 'Lo que guarda tu navegador', rows: [['Cookies de seguimiento', 'Ninguna'], ['Publicidad', 'Ninguna'], ['Almacenamiento de sesión', 'Test e inscripción'], ['Almacenamiento local', 'Datos públicos de IRCC']] },
    sections: [
      ['cookies', 'Cookies', ['Pathway no utiliza cookies propias de seguimiento, de publicidad ni de perfilado. Hoy no hay ninguna herramienta de medición de audiencia activada en el sitio.', '<p class="pg-note"><strong>Si un día se activa una medición de audiencia,</strong> esta página se actualizará antes con el nombre del servicio, lo que mide y cómo oponerte.</p>']],
      ['sesion', 'Almacenamiento de sesión', ['Mientras navegas, algunas páginas guardan datos en el almacenamiento de sesión de tu navegador. Se borran al cerrar la pestaña y no se envían a Pathway por sí solos.', '<ul><li><strong>Test de placement:</strong> el resultado estimado, para preparar la inscripción.</li><li><strong>Inscripción:</strong> el ritmo, la modalidad de pago y las preferencias que eliges.</li><li><strong>Calculador CRS:</strong> las respuestas del formulario y el mensaje de WhatsApp preparado.</li></ul>']],
      ['local', 'Almacenamiento local', ['El calculador y las rondas de IRCC guardan en tu navegador una copia de los últimos datos públicos de IRCC (rondas de invitaciones y reglas CRS), para seguir funcionando si canada.ca no responde. No contienen ningún dato personal.']],
      ['terceros', 'Servicios externos', ['Algunas páginas cargan fuentes tipográficas de Google Fonts o datos públicos de canada.ca. Si eliges escribirnos por WhatsApp o por email, se aplican las políticas de esos servicios.']],
      ['control', 'Cómo borrar estos datos', ['Puedes borrar el almacenamiento de sesión cerrando la pestaña y el almacenamiento local desde la configuración de privacidad de tu navegador. El sitio sigue funcionando sin estos datos. Para cualquier pregunta, consulta nuestra <a href="{privacy}">política de privacidad</a>.']]
    ]
  },
  legal: {
    title: 'Aviso legal', description: 'Aviso legal de Pathway Language Solutions: actividad, contacto, propiedad intelectual y límites de la información publicada.',
    eyebrow: 'Información legal', h1: ['Aviso legal'],
    lead: 'Pathway Language Solutions es un instituto de idiomas que ofrece clases privadas de francés en línea y preparación a los exámenes TEF Canada y TCF Canada.',
    card: { pill: 'Contacto', title: 'Pathway Language Solutions', rows: [['Email', '<a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>'], ['WhatsApp', '<a href="https://wa.me/51989887516" target="_blank" rel="noopener">+51 989 887 516</a>'], ['Sitio', 'pathway-languages.com']] },
    sections: [
      ['actividad', 'Actividad', ['Pathway Language Solutions ofrece clases privadas de francés en vivo, material pedagógico propio y preparación a los exámenes de francés reconocidos por IRCC.', '<p class="pg-note"><strong>Pathway no ofrece consultoría migratoria</strong> ni representa a candidatos ante IRCC. Para una decisión migratoria, consulta las fuentes oficiales o a un profesional regulado.</p>']],
      ['contenido', 'Información publicada', ['Los datos de IRCC (rondas de invitaciones, reglas CRS) proceden de las fuentes oficiales de canada.ca y se muestran con fines informativos. Pueden cambiar en cualquier momento; ningún dato del sitio constituye una previsión ni una garantía de invitación.', 'Las estimaciones del test de placement y del calculador CRS son orientativas y se confirman con un profesor o con las herramientas oficiales.']],
      ['propiedad', 'Propiedad intelectual', ['Los manuales, su estructura pedagógica, los textos, las imágenes y el diseño del sitio son propiedad de Pathway Language Solutions. Los extractos publicados se ofrecen para consulta personal; cualquier reproducción o difusión requiere una autorización previa por escrito.']],
      ['enlaces', 'Enlaces externos', ['El sitio enlaza a servicios de terceros (canada.ca, WhatsApp, proveedores de examen). Pathway no controla su contenido ni sus políticas.']],
      ['condiciones', 'Condiciones y datos', ['Las condiciones del compromiso NCLC 7 se detallan en las <a href="{conditions}">condiciones generales</a>, y el uso de tus datos en la <a href="{privacy}">política de privacidad</a> y la <a href="{cookies}">política de cookies</a>.']]
    ]
  }
};
