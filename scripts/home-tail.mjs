// Second half of the V4 home (stories → footer), one template for the four
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
// Official IRCC pages: the French home links to the French pages of
// canada.ca; the other languages use the English ones (no Spanish or German).
const IRCC_EN = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry';
const IRCC_FR = 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express';
const IRCC_LINKS = {
  en: { rounds: `${IRCC_EN}/rounds-invitations.html`, category: `${IRCC_EN}/rounds-invitations/category-based-selection.html`, calculator: `${IRCC_EN}/check-score.html`, criteria: `${IRCC_EN}/check-score/crs-criteria.html` },
  fr: { rounds: `${IRCC_FR}/rondes-invitations.html`, category: `${IRCC_FR}/rondes-invitations/selection-axee-ensembles.html`, calculator: `${IRCC_FR}/verifier-note.html`, criteria: `${IRCC_FR}/verifier-note/criteres-scg.html` }
};
const ircc = lang => (lang === 'fr' ? IRCC_LINKS.fr : IRCC_LINKS.en);
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
      stats: n => [[n.videos, 'testimonios en video'], [n.reviews, 'recomendaciones públicas en Superprof'], [n.results, 'resultados oficiales TCF compartidos']],
      reel: 'Testimonios en video', reelNote: 'Grabados por nuestros alumnos, en español.', previous: 'Testimonios anteriores', next: 'Testimonios siguientes',
      resultsTag: 'Resultados oficiales', resultsTitle: 'Resultados reales,<br> no promesas.',
      resultsText: 'Capturas del portal oficial del TCF, compartidas por nuestros alumnos al recibir sus resultados.',
      resultsNote: 'El examen oficial se realiza con el organismo examinador, no con Pathway.',
      and: ' y ', session: 'Sesión del', levelScale: 'Nivel CECRL',
      skills: { co: 'Comprensión oral', ce: 'Comprensión escrita', eo: 'Expresión oral', ee: 'Expresión escrita' },
      reviewsTitle: 'Lo que escriben en Superprof', reviewsText: n => `${n} recomendaciones públicas, resumidas aquí.`, reviewsLink: 'Ver las recomendaciones en Superprof'
    },
    pricing: {
      tag: 'Vista del programa', title: 'Tres ritmos.<br> El mismo acompañamiento.',
      lead: 'La evaluación inicial indica el ritmo coherente con tu nivel y tu fecha, incluso si la respuesta es que el tiempo no alcanza.',
      billingTitle: 'Dos formas de inscribirte',
      billing: '<strong>Mes a mes sin contrato mínimo, o un ciclo completo** con 15 % de descuento.</strong><p>Si empiezas con un mes y continúas después con un ciclo completo, el descuento aplicado al ciclo es del 10 %.</p><p>* Carga horaria y precios de referencia: el ritmo exacto se confirma después de la evaluación inicial y según tus necesidades.</p><p>** El ciclo completo es una tarifa reducida a cambio de tu compromiso de asistir a clase durante todo el ciclo: no es reembolsable. Las horas perdidas por ausencias sin justificar no se recuperan, y no hay reembolso si al final del ciclo no alcanzas el nivel.</p>',
      switchLabel: 'Forma de inscripción', monthly: 'Inscripción mensual', cycle: 'Ciclo completo <span>AHORRA 15 %</span>',
      notes: ['Todos los precios están en CAD: 92,50 CAD al mes por cada hora semanal (2 h: 185 · 3 h: 277,50 · 4 h: 370 · 5 h: 462,50 · 6 h: 555 CAD/mes), sin variación según tu nivel. Cuota de inscripción única de <strong>15 CAD</strong>, añadida al primer pago tras confirmar el horario.', 'Un ciclo completo corresponde a un nivel del CECRL, con una duración de referencia fija: ciclo de 6 meses en Esencial (2 h/semana), de 5 meses en Acelerado (3 o 4 h/semana) y de 4 meses en Intensivo (5 o 6 h/semana). El ritmo exacto se confirma después de la evaluación inicial.', 'El descuento del 15 % se aplica a la inscripción directa por el ciclo completo. Si empiezas con un mes y después eliges el ciclo, el descuento es del 10 %.'],
      attendance: {
        title: 'Asistencia',
        items: ['Si avisas con al menos 48 h de anticipación, o justificas tu ausencia dentro de las 72 h siguientes, recuperamos la clase. Sin aviso ni justificación válida, la hora se pierde y no se recupera.', '<strong>Inscripción mensual (4 semanas):</strong> 3 ausencias sin justificar en las mismas 4 semanas invalidan el mes: no se valida el paso al nivel siguiente y, para continuar, el mes debe pagarse de nuevo.', '<strong>Ciclo completo:</strong> sin esta sanción, pero las horas perdidas no se recuperan ni se reembolsan.'],
        link: 'Ver las reglas de asistencia en las condiciones'
      },
      conditions: 'Consultar las condiciones de inscripción'
    },
    outcome: {
      tag: 'Tu resultado', title: 'El recorrido termina<br> con un nivel demostrado.<span class="title-soft">No con un calendario<br> agotado.</span>',
      text: 'Un acompañamiento flexible, centrado en tu progreso real, para que llegues a tu meta con confianza y demuestres tu nivel en el examen oficial.',
      benefits: ['Un método que te hace avanzar, sin presión innecesaria.', 'Un ritmo que se adapta a tu vida.', 'Preparación para demostrar tu nivel en el examen oficial TEF Canada o TCF Canada.'],
      cta: 'Evaluar mi nivel',
      campus: {
        label: 'Vista del Campus Pathway, ejemplo', name: 'Campus Pathway', example: 'Ejemplo', progress: 'Avance del nivel B1', percent: '38 %',
        items: [['check', 'Ejercicios de la unidad 23', '10 de 10 · corregidos'], ['clipboard', 'Ejercicios de la unidad 24', '6 de 10 · en curso'], ['map', 'Manual en línea', 'La unidad 25 se abre después de tu próxima clase'], ['play', 'Grabación de tu clase del lunes', 'Disponible'], ['calendar', 'Simulacro TEF / TCF Canada', 'Al final del B2']]
      },
      caption: 'Ejemplo de seguimiento en el Campus Pathway.<br> Pathway no emite certificados: tu nivel se demuestra en el examen oficial.'
    },
    faq: {
      tag: '¿Dudas?', title: 'Todo lo que necesitas<br> saber para empezar<br> con tranquilidad.', lead: 'Resolvemos las preguntas más frecuentes para que puedas dar el primer paso con confianza.',
      items: [
        ['¿Qué ritmo me conviene?', '<p>Depende de tu nivel, tu disponibilidad y tus objetivos. La evaluación inicial te ayuda a elegir el ritmo más adecuado.</p>'],
        ['¿Las clases son realmente individuales?', '<p>Sí. Cada clase es individual, en vivo por Zoom, con un profesor que conoce tu recorrido. Entre clases, el Campus Pathway te da ejercicios por unidad, tu manual en línea que se abre clase a clase, simulacros TEF y TCF Canada, y las grabaciones de tus clases.</p>'],
        ['¿Cómo funciona la evaluación inicial?', '<p>Un test progresivo evalúa tu comprensión escrita, tu comprensión oral y tu gramática y vocabulario; toma entre 12 y 30 minutos, según la versión que elijas. La expresión oral se confirma con tu profesor en la primera clase. Con estos resultados y tu disponibilidad, definimos el punto de partida.</p><a class="source-link" href="{test}">Hacer la evaluación inicial →</a>'],
        ['¿Preparan para el TEF Canada y el TCF Canada?', '<p>Sí, el recorrido se centra en el TEF Canada y el TCF Canada. Trabajamos las cuatro competencias e incluimos dos simulacros completos. El examen oficial se realiza con el organismo examinador, no con Pathway.</p>'],
        ['¿Cómo me inscribo?', '<p>Evalúa tu nivel y solicita un horario indicando el ritmo y tu disponibilidad. Confirmamos el horario y el precio final antes de cualquier pago.</p><a class="source-link" href="{inscription}">Solicitar un horario →</a>']
      ],
      inviteTitle: '¿Listo para avanzar<br> hacia tu objetivo?', inviteText: 'Evalúa tu nivel y recibe una recomendación<br> adaptada a tu punto de partida.', inviteSmall: 'Sin compromiso · El test toma entre 12 y 30 minutos.'
    },
    nclc: {
      tag: 'Objetivo NCLC 7', title: '¿Por qué apuntar<br> <span class="title-muted">al NCLC 7?</span>',
      text: ['Para la categoría de competencia lingüística en francés de Express Entry, necesitas NCLC 7 o más en las cuatro competencias y cumplir los requisitos de uno de los programas de Express Entry.', 'Alcanzar este umbral no garantiza una invitación. El perfil, el puntaje CRS y las rondas publicadas por IRCC también cuentan.'],
      link: 'Entender el objetivo NCLC 7', panel: 'NCLC 7: el umbral francófono', intro: 'Categoría de competencia lingüística en francés',
      skills: ['Comprensión oral', 'Comprensión escrita', 'Expresión oral', 'Expresión escrita'], note: 'NCLC 7 o más en cada competencia.<br> No garantiza una invitación.', source: 'Fuente oficial: IRCC'
    },
    crs: {
      tag: 'Tu proyecto en Express Entry', title: 'Entiende tu<br> puntaje CRS.',
      text: ['El CRS clasifica los perfiles de Express Entry según varios factores: edad, estudios, idiomas y experiencia, entre otros.', 'La calculadora oficial de IRCC te permite obtener una estimación a partir de tu situación. No es una invitación ni una decisión de inmigración.'],
      cta: 'Calculadora oficial de IRCC', panel: '¿Qué influye en tu puntaje?',
      factors: [['Edad', 'Tu rango de edad.'], ['Estudios', 'Tus credenciales académicas.'], ['Idiomas oficiales', 'Tus resultados en francés e inglés.'], ['Experiencia laboral en Canadá', 'Tu experiencia de trabajo canadiense.']],
      note: 'Otros criterios también pueden influir según tu perfil.', source: 'Fuente oficial: criterios CRS de IRCC'
    },
    rounds: {
      tag: 'Leer las rondas de Express Entry', title: 'Los cortes cambian<br> de una ronda a otra.',
      text: ['IRCC publica los resultados de cada ronda de invitaciones. Aquí puedes consultar las últimas rondas disponibles para la categoría de francés y Canadian Experience Class.', 'Son datos históricos, no una previsión ni una garantía para tu perfil.'],
      cta: 'Consultar las rondas oficiales', panel: 'Rondas publicadas por IRCC', intro: 'Última ronda disponible en cada categoría.',
      french: 'Competencia lingüística en francés', date: 'Fecha de la ronda', score: 'CRS mínimo', cec: 'Canadian Experience Class', loading: 'Consultando…', official: 'Rondas oficiales',
      note: 'Son categorías distintas. Estos cortes no permiten calcular tu probabilidad individual de recibir una invitación.',
      status: 'Consultando las publicaciones oficiales de IRCC…', source: 'Fuente oficial: IRCC', noscript: 'Las cifras en vivo requieren JavaScript. Consulta las rondas en la fuente oficial.'
    },
    commitment: {
      tag: 'El compromiso Pathway', title: 'Nuestro compromiso,<br> por escrito.',
      text: ['El recorrido no se termina simplemente porque se acaba un calendario. El compromiso Pathway define cómo evaluamos tu progreso y qué ocurre si necesitas más preparación.', 'Con etapas claras, seguimiento y condiciones que puedes consultar antes de inscribirte.'],
      cta: 'Leer las condiciones del compromiso',
      steps: [['Balance al final del B2', 'Revisamos el nivel alcanzado y las competencias que necesitan consolidación.'], ['Consolidación durante cuatro meses', 'Este ciclo de verificación y consolidación se factura normalmente.'], ['Continuidad según las condiciones', 'Si al terminar este ciclo todavía no alcanzas NCLC 7, la preparación continúa conforme al compromiso documentado.']],
      note: 'El compromiso está sujeto a condiciones de asistencia, trabajo y participación en los simulacros. Consúltalas antes de inscribirte.'
    },
    final: {
      tag: 'Tu primer paso · Sin compromiso', title: 'Tu objetivo<br> merece<br> <span>una ruta<br> clara.</span>',
      text: 'Con un test de 12 a 30 minutos situamos tu punto de partida; después definimos contigo tu fecha y el ritmo que realmente cabe en tu vida.', cta: 'Evaluar mi nivel', whatsapp: 'Prefiero hablar por WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, inicio', motto: 'Un acompañamiento real<br> para llegar más lejos en francés.',
      nav: 'Navegación del pie', navTitle: 'Navegación', links: [['#recorrido', 'Cómo funciona'], ['#experiencia', 'La experiencia'], ['#programa', 'Vista del programa'], ['#planes', 'Precios'], ['#profesores', 'Profesores'], ['#historias', 'Testimonios'], ['#preguntas', 'Preguntas frecuentes']],
      contact: 'Contacto', rights: 'Todos los derechos reservados.', legalNav: 'Información legal',
      legal: [['legal', 'Aviso legal'], ['privacy', 'Política de privacidad'], ['conditions', 'Condiciones generales'], ['cookies', 'Cookies']]
    }
  },

  fr: {
    stories: {
      tag: 'Histoires vraies', title: 'Ils ont appris avec Pathway.<br> Ils le racontent.', lead: 'Des réalités différentes, un même accompagnement.',
      stats: n => [[n.videos, 'témoignages vidéo'], [n.reviews, 'recommandations publiques sur Superprof'], [n.results, 'résultats officiels TCF partagés']],
      reel: 'Témoignages vidéo', reelNote: 'Enregistrés par nos élèves, en espagnol.', previous: 'Témoignages précédents', next: 'Témoignages suivants',
      resultsTag: 'Résultats officiels', resultsTitle: 'Des résultats réels,<br> pas des promesses.',
      resultsText: 'Captures du portail officiel du TCF, partagées par nos élèves à la réception de leurs résultats.',
      resultsNote: 'L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.',
      and: ' et ', session: 'Session du', levelScale: 'Niveau CECRL',
      skills: { co: 'Compréhension orale', ce: 'Compréhension écrite', eo: 'Expression orale', ee: 'Expression écrite' },
      reviewsTitle: 'Ce qu’ils écrivent sur Superprof', reviewsText: n => `${n} recommandations publiques, résumées et traduites de l’espagnol.`, reviewsLink: 'Voir les recommandations sur Superprof'
    },
    pricing: {
      tag: 'Aperçu du programme', title: 'Trois rythmes.<br> Le même accompagnement.',
      lead: 'L’évaluation initiale indique le rythme cohérent avec votre niveau et votre échéance, même si la réponse est que le temps ne suffit pas.',
      billingTitle: 'Deux façons de vous inscrire',
      billing: '<strong>Mois par mois sans engagement minimum, ou un cycle complet** avec 15 % de remise.</strong><p>Si vous commencez par un mois et poursuivez ensuite avec un cycle complet, la remise appliquée au cycle est de 10 %.</p><p>* Volume horaire et prix de référence : le rythme exact est confirmé après l’évaluation initiale, selon vos besoins.</p><p>** Le cycle complet est un tarif réduit en échange de votre engagement à assister aux cours pendant tout le cycle : il n’est pas remboursable. Les heures perdues par absence non justifiée ne sont pas rattrapées, et aucun remboursement n’est possible si vous n’atteignez pas le niveau à la fin du cycle.</p>',
      switchLabel: 'Mode d’inscription', monthly: 'Inscription mensuelle', cycle: 'Cycle complet <span>−15 %</span>',
      notes: ['Tous les prix sont en CAD : 92,50 CAD par mois pour chaque heure hebdomadaire (2 h : 185 · 3 h : 277,50 · 4 h : 370 · 5 h : 462,50 · 6 h : 555 CAD/mois), quel que soit votre niveau. Frais d’inscription uniques de <strong>15 CAD</strong>, ajoutés au premier paiement après confirmation de l’horaire.', 'Un cycle complet correspond à un niveau du CECRL, avec une durée de référence fixe : cycle de 6 mois en Essentiel (2 h/semaine), de 5 mois en Accéléré (3 ou 4 h/semaine) et de 4 mois en Intensif (5 ou 6 h/semaine). Le rythme exact est confirmé après l’évaluation initiale.', 'La remise de 15 % s’applique à l’inscription directe pour le cycle complet. Si vous commencez par un mois puis choisissez le cycle, la remise est de 10 %.'],
      attendance: {
        title: 'Assiduité',
        items: ['Si vous prévenez au moins 48 h à l’avance, ou justifiez votre absence dans les 72 h qui suivent, nous rattrapons le cours. Sans préavis ni justification valable, l’heure est perdue et n’est pas rattrapée.', '<strong>Inscription mensuelle (4 semaines) :</strong> 3 absences non justifiées sur les mêmes 4 semaines invalident le mois : le passage au niveau suivant n’est pas validé et, pour continuer, le mois doit être payé de nouveau.', '<strong>Cycle complet :</strong> sans cette sanction, mais les heures perdues ne sont ni rattrapées ni remboursées.'],
        link: 'Voir les règles d’assiduité dans les conditions'
      },
      conditions: 'Consulter les conditions d’inscription'
    },
    outcome: {
      tag: 'Votre résultat', title: 'Le parcours se termine<br> par un niveau démontré.<span class="title-soft">Pas par un calendrier<br> épuisé.</span>',
      text: 'Un accompagnement flexible, centré sur vos progrès réels, pour atteindre votre objectif avec confiance et démontrer votre niveau à l’examen officiel.',
      benefits: ['Une méthode qui vous fait avancer, sans pression inutile.', 'Un rythme qui s’adapte à votre vie.', 'Une préparation pour démontrer votre niveau à l’examen officiel TEF Canada ou TCF Canada.'],
      cta: 'Évaluer mon niveau',
      campus: {
        label: 'Aperçu du Campus Pathway, exemple', name: 'Campus Pathway', example: 'Exemple', progress: 'Progression du niveau B1', percent: '38 %',
        items: [['check', 'Exercices de l’unité 23', '10 sur 10 · corrigés'], ['clipboard', 'Exercices de l’unité 24', '6 sur 10 · en cours'], ['map', 'Manuel en ligne', 'L’unité 25 s’ouvre après votre prochain cours'], ['play', 'Enregistrement de votre cours de lundi', 'Disponible'], ['calendar', 'Examen blanc TEF / TCF Canada', 'À la fin du B2']]
      },
      caption: 'Exemple de suivi dans le Campus Pathway.<br> Pathway ne délivre pas de certificat : votre niveau se démontre à l’examen officiel.'
    },
    faq: {
      tag: 'Des questions ?', title: 'Tout ce qu’il faut<br> savoir pour commencer<br> sereinement.', lead: 'Nous répondons aux questions les plus fréquentes pour que vous fassiez le premier pas en confiance.',
      items: [
        ['Quel rythme me convient ?', '<p>Cela dépend de votre niveau, de vos disponibilités et de vos objectifs. L’évaluation initiale vous aide à choisir le rythme le plus adapté.</p>'],
        ['Les cours sont-ils vraiment particuliers ?', '<p>Oui. Chaque cours est individuel, en direct sur Zoom, avec un professeur qui connaît votre parcours. Entre les cours, le Campus Pathway vous donne des exercices par unité, votre manuel en ligne qui s’ouvre au fil des cours, des examens blancs TEF et TCF Canada, et les enregistrements de vos cours.</p>'],
        ['Comment fonctionne l’évaluation initiale ?', '<p>Un test progressif évalue votre compréhension écrite, votre compréhension orale, ainsi que votre grammaire et votre vocabulaire ; il dure de 12 à 30 minutes selon la version choisie. L’expression orale est confirmée avec votre professeur au premier cours. À partir de ces résultats et de vos disponibilités, nous définissons votre point de départ.</p><a class="source-link" href="{test}">Faire l’évaluation initiale →</a>'],
        ['Proposez-vous une préparation au TEF Canada et au TCF Canada ?', '<p>Oui, le parcours est centré sur le TEF Canada et le TCF Canada. Nous travaillons les quatre compétences et incluons deux examens blancs complets. L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.</p>'],
        ['Comment m’inscrire ?', '<p>Évaluez votre niveau, puis demandez un horaire en indiquant le rythme et vos disponibilités. Nous confirmons l’horaire et le prix final avant tout paiement.</p><a class="source-link" href="{inscription}">Demander un horaire →</a>']
      ],
      inviteTitle: 'Prêt à avancer<br> vers votre objectif ?', inviteText: 'Évaluez votre niveau et recevez une recommandation<br> adaptée à votre point de départ.', inviteSmall: 'Sans engagement · Le test dure de 12 à 30 minutes.'
    },
    nclc: {
      tag: 'Objectif NCLC 7', title: 'Pourquoi viser<br> <span class="title-muted">le NCLC 7 ?</span>',
      text: ['Pour la catégorie de compétence linguistique en français d’Entrée express, il faut un NCLC 7 ou plus dans les quatre compétences et remplir les conditions de l’un des programmes d’Entrée express.', 'Atteindre ce seuil ne garantit pas une invitation. Le profil, le score CRS et les rondes publiées par IRCC comptent aussi.'],
      link: 'Comprendre l’objectif NCLC 7', panel: 'NCLC 7 : le seuil francophone', intro: 'Catégorie de compétence linguistique en français',
      skills: ['Compréhension orale', 'Compréhension écrite', 'Expression orale', 'Expression écrite'], note: 'NCLC 7 ou plus dans chaque compétence.<br> Ne garantit pas une invitation.', source: 'Source officielle : IRCC'
    },
    crs: {
      tag: 'Votre projet Entrée express', title: 'Comprendre votre<br> score CRS.',
      text: ['Le CRS classe les profils d’Entrée express selon plusieurs facteurs : âge, études, langues et expérience, entre autres.', 'Le calculateur officiel d’IRCC vous donne une estimation à partir de votre situation. Ce n’est ni une invitation ni une décision d’immigration.'],
      cta: 'Calculateur officiel d’IRCC', panel: 'Qu’est-ce qui influence votre score ?',
      factors: [['Âge', 'Votre tranche d’âge.'], ['Études', 'Vos diplômes.'], ['Langues officielles', 'Vos résultats en français et en anglais.'], ['Expérience de travail au Canada', 'Votre expérience professionnelle canadienne.']],
      note: 'D’autres critères peuvent aussi compter selon votre profil.', source: 'Source officielle : critères CRS d’IRCC'
    },
    rounds: {
      tag: 'Lire les rondes d’Entrée express', title: 'Les seuils changent<br> d’une ronde à l’autre.',
      text: ['IRCC publie les résultats de chaque ronde d’invitations. Vous pouvez consulter ici les dernières rondes disponibles pour la catégorie francophone et la catégorie de l’expérience canadienne.', 'Ce sont des données historiques, pas une prévision ni une garantie pour votre profil.'],
      cta: 'Consulter les rondes officielles', panel: 'Rondes publiées par IRCC', intro: 'Dernière ronde disponible dans chaque catégorie.',
      french: 'Compétence linguistique en français', date: 'Date de la ronde', score: 'CRS minimum', cec: 'Catégorie de l’expérience canadienne', loading: 'Consultation…', official: 'Rondes officielles',
      note: 'Ce sont des catégories distinctes. Ces seuils ne permettent pas de calculer votre probabilité individuelle de recevoir une invitation.',
      status: 'Consultation des publications officielles d’IRCC…', source: 'Source officielle : IRCC', noscript: 'Les chiffres en direct nécessitent JavaScript. Consultez les rondes sur la source officielle.'
    },
    commitment: {
      tag: 'L’engagement Pathway', title: 'Notre engagement,<br> par écrit.',
      text: ['Le parcours ne s’arrête pas simplement parce qu’un calendrier se termine. L’engagement Pathway définit comment nous évaluons vos progrès et ce qui se passe si vous avez besoin de plus de préparation.', 'Avec des étapes claires, un suivi et des conditions que vous pouvez consulter avant de vous inscrire.'],
      cta: 'Lire les conditions de l’engagement',
      steps: [['Bilan à la fin du B2', 'Nous faisons le point sur le niveau atteint et les compétences à consolider.'], ['Consolidation pendant quatre mois', 'Ce cycle de vérification et de consolidation est facturé normalement.'], ['Continuité selon les conditions', 'Si, à la fin de ce cycle, vous n’atteignez pas encore le NCLC 7, la préparation continue conformément à l’engagement écrit.']],
      note: 'L’engagement est soumis à des conditions d’assiduité, de travail et de participation aux examens blancs. Consultez-les avant de vous inscrire.'
    },
    final: {
      tag: 'Votre première étape · Sans engagement', title: 'Votre objectif<br> mérite<br> <span>un parcours<br> clair.</span>',
      text: 'Un test de 12 à 30 minutes situe votre point de départ ; nous définissons ensuite avec vous votre échéance et le rythme qui s’intègre vraiment à votre vie.', cta: 'Évaluer mon niveau', whatsapp: 'Je préfère écrire sur WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, accueil', motto: 'Un vrai accompagnement<br> pour aller plus loin en français.',
      nav: 'Navigation du pied de page', navTitle: 'Navigation', links: [['#recorrido', 'Comment ça marche'], ['#experiencia', 'L’expérience'], ['#programa', 'Aperçu du programme'], ['#planes', 'Tarifs'], ['#profesores', 'Professeurs'], ['#historias', 'Témoignages'], ['#preguntas', 'Questions fréquentes']],
      contact: 'Contact', rights: 'Tous droits réservés.', legalNav: 'Informations légales',
      legal: [['legal', 'Mentions légales'], ['privacy', 'Politique de confidentialité'], ['conditions', 'Conditions générales'], ['cookies', 'Cookies']]
    }
  },

  en: {
    stories: {
      tag: 'Real stories', title: 'Told by the people<br> who learned with Pathway.', lead: 'Different lives, the same support.',
      stats: n => [[n.videos, 'video testimonials'], [n.reviews, 'public recommendations on Superprof'], [n.results, 'official TCF results shared']],
      reel: 'Video testimonials', reelNote: 'Recorded by our students, in Spanish.', previous: 'Previous testimonials', next: 'Next testimonials',
      resultsTag: 'Official results', resultsTitle: 'Real results,<br> not promises.',
      resultsText: 'Screenshots from the official TCF portal, shared by our students when they received their results.',
      resultsNote: 'The official exam is taken with the exam provider, not with Pathway.',
      and: ' and ', session: 'Session of', levelScale: 'CEFR level',
      skills: { co: 'Listening', ce: 'Reading', eo: 'Speaking', ee: 'Writing' },
      reviewsTitle: 'What they write on Superprof', reviewsText: n => `${n} public recommendations, summarized and translated from Spanish.`, reviewsLink: 'See the recommendations on Superprof'
    },
    pricing: {
      tag: 'Program overview', title: 'Three paces.<br> The same support.',
      lead: 'The initial assessment shows the pace that fits your level and your deadline, even when the answer is that there isn’t enough time.',
      billingTitle: 'Two ways to enrol',
      billing: '<strong>Month to month with no minimum term, or a full cycle** with a 15% discount.</strong><p>If you start with one month and then continue with a full cycle, the discount on the cycle is 10%.</p><p>* Reference hours and prices: the exact pace is confirmed after the initial assessment, according to your needs.</p><p>** The full cycle is a reduced rate in exchange for your commitment to attend class for the whole cycle: it is non-refundable. Hours lost to unjustified absences are not made up, and there is no refund if you do not reach the level by the end of the cycle.</p>',
      switchLabel: 'Enrolment option', monthly: 'Monthly enrolment', cycle: 'Full cycle <span>SAVE 15%</span>',
      notes: ['All prices are in CAD: 92.50 CAD a month for each weekly hour (2 h: 185 · 3 h: 277.50 · 4 h: 370 · 5 h: 462.50 · 6 h: 555 CAD/month), whatever your level. One-time enrolment fee of <strong>15 CAD</strong>, added to the first payment once your schedule is confirmed.', 'A full cycle covers one CEFR level, with a fixed reference length: a 6-month cycle on Essential (2 h/week), 5 months on Accelerated (3 or 4 h/week) and 4 months on Intensive (5 or 6 h/week). The exact pace is confirmed after the initial assessment.', 'The 15% discount applies when you enrol directly for the full cycle. If you start with one month and then choose the cycle, the discount is 10%.'],
      attendance: {
        title: 'Attendance',
        items: ['If you give at least 48 hours’ notice, or justify your absence within the following 72 hours, we make up the lesson. Without notice or a valid reason, the hour is lost and cannot be made up.', '<strong>Monthly enrolment (4 weeks):</strong> 3 unjustified absences within the same 4 weeks void the month: progression to the next level is not validated and, to continue, the month must be paid again.', '<strong>Full cycle:</strong> no such penalty, but missed hours are neither made up nor refunded.'],
        link: 'See the attendance rules in the conditions'
      },
      conditions: 'Read the enrolment conditions'
    },
    outcome: {
      tag: 'Your result', title: 'The path ends<br> with a proven level.<span class="title-soft">Not with a used-up<br> calendar.</span>',
      text: 'Flexible support, focused on your real progress, so you reach your goal with confidence and prove your level in the official exam.',
      benefits: ['A method that moves you forward, without needless pressure.', 'A pace that fits your life.', 'Preparation to prove your level in the official TEF Canada or TCF Canada exam.'],
      cta: 'Assess my level',
      campus: {
        label: 'Pathway Campus preview, example', name: 'Pathway Campus', example: 'Example', progress: 'B1 level progress', percent: '38%',
        items: [['check', 'Unit 23 exercises', '10 of 10 · corrected'], ['clipboard', 'Unit 24 exercises', '6 of 10 · in progress'], ['map', 'Online manual', 'Unit 25 opens after your next lesson'], ['play', 'Recording of your Monday lesson', 'Available'], ['calendar', 'TEF / TCF Canada mock exam', 'At the end of B2']]
      },
      caption: 'Example of progress tracking in the Pathway Campus.<br> Pathway does not issue certificates: you prove your level in the official exam.'
    },
    faq: {
      tag: 'Questions?', title: 'Everything you need<br> to know to start<br> with peace of mind.', lead: 'We answer the most common questions so you can take the first step with confidence.',
      items: [
        ['Which pace is right for me?', '<p>It depends on your level, your availability and your goals. The initial assessment helps you choose the most suitable pace.</p>'],
        ['Are the lessons really one-to-one?', '<p>Yes. Every lesson is one-to-one and live on Zoom, with a teacher who knows your path. Between lessons, the Pathway Campus gives you exercises for each unit, your online manual that opens lesson by lesson, TEF and TCF Canada mock exams, and the recordings of your lessons.</p>'],
        ['How does the initial assessment work?', '<p>A progressive test assesses your reading, your listening, and your grammar and vocabulary; it takes 12 to 30 minutes, depending on the version you choose. Speaking is confirmed with your teacher in the first lesson. With these results and your availability, we set your starting point.</p><a class="source-link" href="{test}">Take the initial assessment →</a>'],
        ['Do you prepare students for the TEF Canada and TCF Canada?', '<p>Yes, the path focuses on the TEF Canada and the TCF Canada. We work on all four skills and include two full mock exams. The official exam is taken with the exam provider, not with Pathway.</p>'],
        ['How do I enrol?', '<p>Assess your level, then request a schedule with your preferred pace and availability. We confirm the schedule and the final price before any payment.</p><a class="source-link" href="{inscription}">Request a schedule →</a>']
      ],
      inviteTitle: 'Ready to move<br> towards your goal?', inviteText: 'Assess your level and get a recommendation<br> suited to your starting point.', inviteSmall: 'No commitment · The test takes 12 to 30 minutes.'
    },
    nclc: {
      tag: 'NCLC 7 goal', title: 'Why aim<br> <span class="title-muted">for NCLC 7?</span>',
      text: ['For the Express Entry French-language proficiency category, you need NCLC 7 or higher in all four skills and must meet the requirements of one of the Express Entry programs.', 'Reaching this threshold doesn’t guarantee an invitation. Your profile, your CRS score and the rounds published by IRCC also count.'],
      link: 'Understand the NCLC 7 goal', panel: 'NCLC 7: the French-language threshold', intro: 'French-language proficiency category',
      skills: ['Listening', 'Reading', 'Speaking', 'Writing'], note: 'NCLC 7 or higher in every skill.<br> Doesn’t guarantee an invitation.', source: 'Official source: IRCC'
    },
    crs: {
      tag: 'Your Express Entry plan', title: 'Understand your<br> CRS score.',
      text: ['The CRS ranks Express Entry profiles on several factors: age, education, languages and experience, among others.', 'IRCC’s official calculator gives you an estimate based on your situation. It is neither an invitation nor an immigration decision.'],
      cta: 'IRCC’s official calculator', panel: 'What affects your score?',
      factors: [['Age', 'Your age range.'], ['Education', 'Your academic credentials.'], ['Official languages', 'Your results in French and English.'], ['Canadian work experience', 'Your work experience in Canada.']],
      note: 'Other criteria may also count depending on your profile.', source: 'Official source: IRCC CRS criteria'
    },
    rounds: {
      tag: 'Reading Express Entry rounds', title: 'Cut-offs change<br> from round to round.',
      text: ['IRCC publishes the results of every round of invitations. Here you can see the latest rounds available for the French category and the Canadian Experience Class.', 'These are historical figures, not a forecast or a guarantee for your profile.'],
      cta: 'See the official rounds', panel: 'Rounds published by IRCC', intro: 'Latest round available in each category.',
      french: 'French-language proficiency', date: 'Round date', score: 'Minimum CRS', cec: 'Canadian Experience Class', loading: 'Checking…', official: 'Official rounds',
      note: 'These are separate categories. These cut-offs can’t be used to calculate your own chance of receiving an invitation.',
      status: 'Checking IRCC’s official publications…', source: 'Official source: IRCC', noscript: 'Live figures need JavaScript. See the rounds at the official source.'
    },
    commitment: {
      tag: 'The Pathway commitment', title: 'Our commitment,<br> in writing.',
      text: ['The path doesn’t simply end because a calendar runs out. The Pathway commitment sets out how we assess your progress and what happens if you need more preparation.', 'With clear stages, follow-up and conditions you can read before you enrol.'],
      cta: 'Read the commitment conditions',
      steps: [['Review at the end of B2', 'We review the level reached and the skills that need strengthening.'], ['Four months of consolidation', 'This review and consolidation cycle is billed as usual.'], ['Continuation under the conditions', 'If you still haven’t reached NCLC 7 at the end of this cycle, preparation continues under the written commitment.']],
      note: 'The commitment depends on conditions of attendance, work and taking part in the mock exams. Read them before you enrol.'
    },
    final: {
      tag: 'Your first step · No commitment', title: 'Your goal<br> deserves<br> <span>a clear<br> path.</span>',
      text: 'A 12- to 30-minute test pins down your starting point; then we set your deadline with you and the pace that truly fits your life.', cta: 'Assess my level', whatsapp: 'I’d rather talk on WhatsApp'
    },
    footer: {
      home: 'Pathway Language Solutions, home', motto: 'Real support<br> to go further in French.',
      nav: 'Footer navigation', navTitle: 'Navigation', links: [['#recorrido', 'How it works'], ['#experiencia', 'The experience'], ['#programa', 'Program overview'], ['#planes', 'Prices'], ['#profesores', 'Teachers'], ['#historias', 'Testimonials'], ['#preguntas', 'FAQ']],
      contact: 'Contact', rights: 'All rights reserved.', legalNav: 'Legal information',
      legal: [['legal', 'Legal notice'], ['privacy', 'Privacy policy'], ['conditions', 'Terms and conditions'], ['cookies', 'Cookies']]
    }
  },

  de: {
    stories: {
      tag: 'Echte Geschichten', title: 'Erzählt von denen,<br> die mit Pathway gelernt haben.', lead: 'Unterschiedliche Lebenswege, dieselbe Begleitung.',
      stats: n => [[n.videos, 'Video-Erfahrungsberichte'], [n.reviews, 'öffentliche Empfehlungen auf Superprof'], [n.results, 'geteilte offizielle TCF-Ergebnisse']],
      reel: 'Video-Erfahrungsberichte', reelNote: 'Von unseren Lernenden aufgenommen, auf Spanisch.', previous: 'Vorherige Berichte', next: 'Nächste Berichte',
      resultsTag: 'Offizielle Ergebnisse', resultsTitle: 'Echte Ergebnisse,<br> keine Versprechen.',
      resultsText: 'Screenshots aus dem offiziellen TCF-Portal, geteilt von unseren Lernenden, als sie ihre Ergebnisse erhielten.',
      resultsNote: 'Die offizielle Prüfung wird bei der Prüfungsstelle abgelegt, nicht bei Pathway.',
      and: ' und ', session: 'Prüfung vom', levelScale: 'GER-Niveau',
      skills: { co: 'Hörverstehen', ce: 'Leseverstehen', eo: 'Mündlicher Ausdruck', ee: 'Schriftlicher Ausdruck' },
      reviewsTitle: 'Was sie auf Superprof schreiben', reviewsText: n => `${n} öffentliche Empfehlungen, zusammengefasst und aus dem Spanischen übersetzt.`, reviewsLink: 'Empfehlungen auf Superprof ansehen'
    },
    pricing: {
      tag: 'Programmübersicht', title: 'Drei Lerntempos.<br> Dieselbe Begleitung.',
      lead: 'Die Ersteinstufung zeigt das Tempo, das zu Ihrem Niveau und Ihrem Termin passt, auch wenn die Antwort lautet, dass die Zeit nicht reicht.',
      billingTitle: 'Zwei Wege zur Anmeldung',
      billing: '<strong>Monatlich ohne Mindestlaufzeit oder ein ganzer Zyklus** mit 15 % Rabatt.</strong><p>Wenn Sie mit einem Monat beginnen und danach einen ganzen Zyklus buchen, beträgt der Rabatt auf den Zyklus 10 %.</p><p>* Stundenumfang und Preise sind Richtwerte: Das genaue Tempo wird nach der Ersteinstufung und nach Ihrem Bedarf bestätigt.</p><p>** Der ganze Zyklus ist ein reduzierter Tarif im Gegenzug für Ihre Verpflichtung, während des gesamten Zyklus am Unterricht teilzunehmen: Er wird nicht erstattet. Durch unentschuldigte Abwesenheiten verlorene Stunden werden nicht nachgeholt, und es gibt keine Erstattung, wenn Sie das Niveau am Ende des Zyklus nicht erreichen.</p>',
      switchLabel: 'Anmeldeform', monthly: 'Monatliche Anmeldung', cycle: 'Ganzer Zyklus <span>15 % SPAREN</span>',
      notes: ['Alle Preise in CAD: 92,50 CAD im Monat pro Wochenstunde (2 Std.: 185 · 3 Std.: 277,50 · 4 Std.: 370 · 5 Std.: 462,50 · 6 Std.: 555 CAD/Monat), unabhängig von Ihrem Niveau. Einmalige Anmeldegebühr von <strong>15 CAD</strong>, die nach Bestätigung des Stundenplans zur ersten Zahlung hinzukommt.', 'Ein ganzer Zyklus entspricht einem GER-Niveau und hat eine feste Richtdauer: 6 Monate im Tempo Basis (2 Std./Woche), 5 Monate in Beschleunigt (3 oder 4 Std./Woche) und 4 Monate in Intensiv (5 oder 6 Std./Woche). Das genaue Tempo wird nach der Ersteinstufung bestätigt.', 'Der Rabatt von 15 % gilt bei direkter Anmeldung für den ganzen Zyklus. Wenn Sie mit einem Monat beginnen und danach den Zyklus wählen, beträgt der Rabatt 10 %.'],
      attendance: {
        title: 'Anwesenheit',
        items: ['Wenn Sie mindestens 48 Stunden vorher absagen oder Ihr Fehlen innerhalb der folgenden 72 Stunden begründen, holen wir die Stunde nach. Ohne Absage oder triftigen Grund verfällt die Stunde und wird nicht nachgeholt.', '<strong>Monatliche Anmeldung (4 Wochen):</strong> 3 unentschuldigte Fehlzeiten innerhalb derselben 4 Wochen machen den Monat ungültig: Der Übergang zum nächsten Niveau wird nicht bestätigt, und um weiterzumachen, muss der Monat erneut bezahlt werden.', '<strong>Ganzer Zyklus:</strong> ohne diese Sanktion, aber versäumte Stunden werden weder nachgeholt noch erstattet.'],
        link: 'Anwesenheitsregeln in den Bedingungen lesen'
      },
      conditions: 'Anmeldebedingungen lesen'
    },
    outcome: {
      tag: 'Ihr Ergebnis', title: 'Der Weg endet<br> mit einem nachgewiesenen Niveau.<span class="title-soft">Nicht mit einem<br> abgelaufenen Kalender.</span>',
      text: 'Eine flexible Begleitung, ausgerichtet auf Ihre echten Fortschritte, damit Sie Ihr Ziel mit Zuversicht erreichen und Ihr Niveau in der offiziellen Prüfung nachweisen.',
      benefits: ['Eine Methode, die Sie voranbringt, ohne unnötigen Druck.', 'Ein Tempo, das sich Ihrem Leben anpasst.', 'Vorbereitung, um Ihr Niveau in der offiziellen Prüfung TEF Canada oder TCF Canada nachzuweisen.'],
      cta: 'Mein Niveau bestimmen',
      campus: {
        label: 'Einblick in den Pathway Campus, Beispiel', name: 'Pathway Campus', example: 'Beispiel', progress: 'Fortschritt im Niveau B1', percent: '38 %',
        items: [['check', 'Übungen zu Einheit 23', '10 von 10 · korrigiert'], ['clipboard', 'Übungen zu Einheit 24', '6 von 10 · in Bearbeitung'], ['map', 'Online-Lehrbuch', 'Einheit 25 wird nach Ihrer nächsten Stunde freigeschaltet'], ['play', 'Aufzeichnung Ihrer Stunde vom Montag', 'Verfügbar'], ['calendar', 'Probeprüfung TEF / TCF Canada', 'Am Ende von B2']]
      },
      caption: 'Beispiel für die Lernbegleitung im Pathway Campus.<br> Pathway stellt keine Zertifikate aus: Ihr Niveau weisen Sie in der offiziellen Prüfung nach.'
    },
    faq: {
      tag: 'Fragen?', title: 'Alles, was Sie wissen<br> müssen, um entspannt<br> zu beginnen.', lead: 'Wir beantworten die häufigsten Fragen, damit Sie den ersten Schritt mit Zuversicht gehen.',
      items: [
        ['Welches Tempo passt zu mir?', '<p>Das hängt von Ihrem Niveau, Ihrer Verfügbarkeit und Ihren Zielen ab. Die Ersteinstufung hilft Ihnen, das passende Tempo zu wählen.</p>'],
        ['Ist der Unterricht wirklich Einzelunterricht?', '<p>Ja. Jede Stunde ist Einzelunterricht, live über Zoom, mit einer Lehrkraft, die Ihren Weg kennt. Zwischen den Stunden bietet Ihnen der Pathway Campus Übungen zu jeder Einheit, Ihr Online-Lehrbuch, das sich Stunde für Stunde öffnet, Probeprüfungen für TEF und TCF Canada sowie die Aufzeichnungen Ihrer Stunden.</p>'],
        ['Wie funktioniert die Ersteinstufung?', '<p>Ein progressiver Test prüft Ihr Leseverstehen, Ihr Hörverstehen sowie Grammatik und Wortschatz; er dauert je nach Version 12 bis 30 Minuten. Der mündliche Ausdruck wird in der ersten Stunde mit Ihrer Lehrkraft bestätigt. Anhand dieser Ergebnisse und Ihrer Verfügbarkeit legen wir Ihren Ausgangspunkt fest.</p><a class="source-link" href="{test}">Ersteinstufung machen →</a>'],
        ['Bereitet Pathway auf den TEF Canada und den TCF Canada vor?', '<p>Ja, der Weg ist auf den TEF Canada und den TCF Canada ausgerichtet. Wir trainieren alle vier Kompetenzen und bieten zwei vollständige Probeprüfungen. Die offizielle Prüfung wird bei der Prüfungsstelle abgelegt, nicht bei Pathway.</p>'],
        ['Wie melde ich mich an?', '<p>Stufen Sie Ihr Niveau ein und fragen Sie einen Stundenplan an, mit Tempo und Verfügbarkeit. Wir bestätigen Stundenplan und Endpreis vor jeder Zahlung.</p><a class="source-link" href="{inscription}">Stundenplan anfragen →</a>']
      ],
      inviteTitle: 'Bereit, Ihrem Ziel<br> näherzukommen?', inviteText: 'Stufen Sie Ihr Niveau ein und erhalten Sie eine Empfehlung<br> passend zu Ihrem Ausgangspunkt.', inviteSmall: 'Unverbindlich · Der Test dauert 12 bis 30 Minuten.'
    },
    nclc: {
      tag: 'Ziel NCLC 7', title: 'Warum<br> <span class="title-muted">NCLC 7 anstreben?</span>',
      text: ['Für die Kategorie französische Sprachkompetenz von Express Entry brauchen Sie NCLC 7 oder mehr in allen vier Kompetenzen und müssen die Voraussetzungen eines der Express-Entry-Programme erfüllen.', 'Diese Schwelle zu erreichen, garantiert keine Einladung. Das Profil, der CRS-Punktwert und die von IRCC veröffentlichten Runden zählen ebenfalls.'],
      link: 'Das Ziel NCLC 7 verstehen', panel: 'NCLC 7: die frankophone Schwelle', intro: 'Kategorie französische Sprachkompetenz',
      skills: ['Hörverstehen', 'Leseverstehen', 'Mündlicher Ausdruck', 'Schriftlicher Ausdruck'], note: 'NCLC 7 oder mehr in jeder Kompetenz.<br> Garantiert keine Einladung.', source: 'Offizielle Quelle: IRCC'
    },
    crs: {
      tag: 'Ihr Express-Entry-Vorhaben', title: 'Ihren CRS-Punktwert<br> verstehen.',
      text: ['Das CRS ordnet Express-Entry-Profile nach mehreren Faktoren: unter anderem Alter, Ausbildung, Sprachen und Berufserfahrung.', 'Der offizielle Rechner von IRCC liefert eine Schätzung anhand Ihrer Situation. Er ist weder eine Einladung noch eine Einwanderungsentscheidung.'],
      cta: 'Offizieller Rechner von IRCC', panel: 'Was beeinflusst Ihren Punktwert?',
      factors: [['Alter', 'Ihre Altersgruppe.'], ['Ausbildung', 'Ihre Abschlüsse.'], ['Amtssprachen', 'Ihre Ergebnisse in Französisch und Englisch.'], ['Berufserfahrung in Kanada', 'Ihre kanadische Arbeitserfahrung.']],
      note: 'Je nach Profil können weitere Kriterien zählen.', source: 'Offizielle Quelle: CRS-Kriterien von IRCC'
    },
    rounds: {
      tag: 'Express-Entry-Runden lesen', title: 'Die Grenzwerte ändern sich<br> von Runde zu Runde.',
      text: ['IRCC veröffentlicht die Ergebnisse jeder Einladungsrunde. Hier sehen Sie die neuesten verfügbaren Runden für die französische Kategorie und die Canadian Experience Class.', 'Das sind historische Daten, keine Prognose und keine Garantie für Ihr Profil.'],
      cta: 'Offizielle Runden ansehen', panel: 'Von IRCC veröffentlichte Runden', intro: 'Neueste verfügbare Runde je Kategorie.',
      french: 'Französische Sprachkompetenz', date: 'Datum der Runde', score: 'Mindest-CRS', cec: 'Canadian Experience Class', loading: 'Wird abgerufen…', official: 'Offizielle Runden',
      note: 'Das sind getrennte Kategorien. Aus diesen Grenzwerten lässt sich Ihre persönliche Chance auf eine Einladung nicht berechnen.',
      status: 'Offizielle Veröffentlichungen von IRCC werden abgerufen…', source: 'Offizielle Quelle: IRCC', noscript: 'Die Live-Zahlen benötigen JavaScript. Sehen Sie die Runden in der offiziellen Quelle.'
    },
    commitment: {
      tag: 'Die Pathway-Zusage', title: 'Unsere Zusage,<br> schriftlich.',
      text: ['Der Weg endet nicht einfach, weil ein Kalender abläuft. Die Pathway-Zusage legt fest, wie wir Ihre Fortschritte bewerten und was geschieht, wenn Sie mehr Vorbereitung brauchen.', 'Mit klaren Etappen, Begleitung und Bedingungen, die Sie vor der Anmeldung lesen können.'],
      cta: 'Bedingungen der Zusage lesen',
      steps: [['Bilanz am Ende von B2', 'Wir prüfen das erreichte Niveau und die Kompetenzen, die gefestigt werden müssen.'], ['Vier Monate Festigung', 'Dieser Prüf- und Festigungszyklus wird normal berechnet.'], ['Fortsetzung gemäß den Bedingungen', 'Wenn Sie am Ende dieses Zyklus NCLC 7 noch nicht erreicht haben, geht die Vorbereitung gemäß der schriftlichen Zusage weiter.']],
      note: 'Die Zusage gilt unter Bedingungen zu Anwesenheit, Mitarbeit und Teilnahme an den Probeprüfungen. Lesen Sie sie vor der Anmeldung.'
    },
    final: {
      tag: 'Ihr erster Schritt · Unverbindlich', title: 'Ihr Ziel<br> verdient<br> <span>einen klaren<br> Weg.</span>',
      text: 'Ein Test von 12 bis 30 Minuten bestimmt Ihren Ausgangspunkt; danach legen wir mit Ihnen Ihren Termin und das Tempo fest, das wirklich in Ihr Leben passt.', cta: 'Mein Niveau bestimmen', whatsapp: 'Lieber per WhatsApp schreiben'
    },
    footer: {
      home: 'Pathway Language Solutions, Startseite', motto: 'Echte Begleitung,<br> um im Französischen weiterzukommen.',
      nav: 'Fußzeilennavigation', navTitle: 'Navigation', links: [['#recorrido', 'So funktioniert es'], ['#experiencia', 'Das Erlebnis'], ['#programa', 'Programmübersicht'], ['#planes', 'Preise'], ['#profesores', 'Lehrkräfte'], ['#historias', 'Erfahrungsberichte'], ['#preguntas', 'Häufige Fragen']],
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

function stories(lang) {
  const s = T[lang].stories;
  const r = runtime(lang).stories;
  const quotes = lang === 'es' ? WRITTEN_TESTIMONIALS.map(review => review.quote) : REVIEW_QUOTES[lang];
  if (quotes.length !== WRITTEN_TESTIMONIALS.length) throw new Error(`home-tail: ${lang} needs ${WRITTEN_TESTIMONIALS.length} review translations`);
  const half = Math.ceil(WRITTEN_TESTIMONIALS.length / 2);
  const row = (from, to) => WRITTEN_TESTIMONIALS.slice(from, to).map((review, i) => reviewCard(review, quotes[from + i], r, lang)).join('');
  const lane = (from, to, reverse) => `<div class="quote-lane${reverse ? ' is-reverse' : ''}"><ul class="quote-track">${row(from, to)}</ul><ul class="quote-track" aria-hidden="true">${row(from, to)}</ul></div>`;
  const stats = s.stats({ videos: VIDEO_TESTIMONIALS.length, reviews: WRITTEN_TESTIMONIALS.length, results: EXAM_RESULTS.length });
  return `<section class="v4-section stories-v4" id="historias" aria-labelledby="stories-title">
      <div class="container">
        <header class="stories-head">
          <div class="v4-heading"><p class="section-tag">${s.tag}</p><h2 id="stories-title">${s.title}</h2><p>${s.lead}</p></div>
          <ul class="stories-stats">${stats.map(([value, label]) => `<li><strong>${esc(value)}</strong><span>${esc(label)}</span></li>`).join('')}</ul>
        </header>
        <div class="reel" data-story-reel role="region" aria-label="${esc(s.reel)}">
          <div class="reel-top"><h3>${esc(s.reel)}</h3><p>${esc(s.reelNote)}</p><div class="reel-nav"><button class="v4-round" type="button" data-reel-previous aria-label="${esc(s.previous)}">‹</button><button class="v4-round" type="button" data-reel-next aria-label="${esc(s.next)}">›</button></div></div>
          <ol class="reel-track" data-reel-track>${VIDEO_TESTIMONIALS.map((video, index) => storyCard(video, index, s, lang)).join('')}</ol>
        </div>
        <div class="results-band">
          <div class="results-copy"><p class="section-tag">${s.resultsTag}</p><h3>${s.resultsTitle}</h3><p>${esc(s.resultsText)}</p><small>${esc(s.resultsNote)}</small></div>
          <div class="results-grid" data-count="${EXAM_RESULTS.length}">${EXAM_RESULTS.map(result => resultCard(result, s, lang)).join('')}</div>
        </div>
        <div class="quotes" data-quotes>
          <div class="quotes-head"><div><h3>${esc(s.reviewsTitle)}</h3><p>${esc(s.reviewsText(WRITTEN_TESTIMONIALS.length))}</p></div><a class="source-link" href="${esc(LINKS.reviewsSource)}" target="_blank" rel="noopener noreferrer">${esc(s.reviewsLink)} ${out}</a><button class="v4-round quotes-toggle" type="button" data-quotes-toggle aria-pressed="false" aria-label="${esc(r.pause)}"><svg class="icon" aria-hidden="true"><use href="#i-pause"/></svg></button></div>
          ${lane(0, half, true)}
          ${lane(half, WRITTEN_TESTIMONIALS.length, false)}
        </div>
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
  return `<section class="v4-section pricing-v4" id="planes" aria-labelledby="pricing-title">
      <div class="container">
        <header class="v4-split-heading">
          <div><p class="section-tag">${p.tag}</p><h2 id="pricing-title">${p.title}</h2></div>
          <p>${p.lead}</p>
        </header>
        <div class="billing-bar">
          <h3>${p.billingTitle}</h3>
          <div class="billing-copy">${p.billing}</div>
          <div class="billing-switch" role="group" aria-label="${esc(p.switchLabel)}"><button type="button" data-billing="monthly" aria-pressed="true">${p.monthly}</button><button type="button" data-billing="cycle" aria-pressed="false">${p.cycle}</button></div>
        </div>
        <p class="sr-only" data-pricing-status aria-live="polite">${esc(runtime(lang).pricing.statusMonthly)}</p>
        <div class="pricing-grid" data-pricing-cards>${renderPricing('monthly', lang)}</div>
        <div class="pricing-notes">
          ${p.notes.map(note => `<p>${note}</p>`).join('\n          ')}
        </div>
        <div class="attendance-note" id="asistencia-resumen">
          <h3>${p.attendance.title}</h3>
          <ul>${p.attendance.items.map(item => `<li>${item}</li>`).join('')}</ul>
          <p><a class="source-link" href="${pages(lang).conditions}#asistencia">${p.attendance.link} <span aria-hidden="true">→</span></a><a class="source-link" href="${pages(lang).conditions}">${p.conditions} <span aria-hidden="true">→</span></a></p>
        </div>
      </div>
    </section>`;
}

// A Campus screen in HTML and CSS: the follow-up of a level, never a
// certificate (no name, date, logo or overall level).
function campusPreview(c) {
  const state = ['is-done', 'is-now', '', '', ''];
  return `<div class="campus-screen" role="group" aria-label="${esc(c.label)}">
            <header class="campus-top"><span class="campus-brand"><svg class="icon" aria-hidden="true"><use href="#i-laptop"/></svg>${c.name}</span><span class="example-label">${c.example}</span></header>
            <div class="campus-progress"><p><span>${c.progress}</span><strong>${c.percent}</strong></p><span class="campus-bar" aria-hidden="true"><i></i></span></div>
            <ul class="campus-items">${c.items.map(([icon, title, meta], i) => `<li${state[i] ? ` class="${state[i]}"` : ''}><span class="campus-icon"><svg class="icon" aria-hidden="true"><use href="#i-${icon}"/></svg></span><span><strong>${title}</strong><small>${meta}</small></span></li>`).join('')}</ul>
          </div>`;
}

function outcome(lang) {
  const o = T[lang].outcome;
  return `<section class="v4-section outcome-v4" id="resultado" aria-labelledby="outcome-title">
      <div class="container outcome-grid">
        <div class="v4-copy">
          <p class="section-tag">${o.tag}</p>
          <h2 id="outcome-title">${o.title}</h2>
          <p>${o.text}</p>
          <ul class="result-benefits">${o.benefits.map(item => `<li>${item}</li>`).join('')}</ul>
          <a class="button button-terra" href="${pages(lang).test}" data-cta="v4-result-evaluation">${o.cta} ${arrow}</a>
        </div>
        <figure class="result-scene campus-preview">
          ${campusPreview(o.campus)}
          <figcaption>${o.caption}</figcaption>
        </figure>
      </div>
    </section>`;
}

function faq(lang) {
  const f = T[lang].faq;
  const fill = html => html.replace('{test}', pages(lang).test).replace('{inscription}', pages(lang).inscription);
  return `<section class="v4-section faq-v4" id="preguntas" aria-labelledby="faq-title">
      <div class="container">
        <div class="faq-layout">
          <div class="v4-copy"><p class="section-tag">${f.tag}</p><h2 id="faq-title">${f.title}</h2><p>${f.lead}</p></div>
          <div class="faq-list" data-faq>
            ${f.items.map(([question, answer], i) => `<details name="pathway-faq"${i === 0 ? ' open' : ''}><summary>${question}<span class="faq-chevron" aria-hidden="true"></span></summary><div>${fill(answer)}</div></details>`).join('\n            ')}
          </div>
        </div>
        <div class="faq-invitation"><h3>${f.inviteTitle}</h3><p>${f.inviteText}</p><div><a class="button button-terra" href="${pages(lang).test}" data-cta="v4-faq-evaluation">${T[lang].outcome.cta} ${arrow}</a><small>${f.inviteSmall}</small></div></div>
      </div>
    </section>`;
}

function information(lang) {
  const { nclc: n, crs: c, rounds: r, commitment: m } = T[lang];
  const links = ircc(lang);
  const category = (key, title) => `<article class="round-category" data-ircc-category="${key}"><h4>${title}</h4><dl><div><dt>${r.date}</dt><dd data-round-date>${r.loading}</dd></div><div><dt>${r.score}</dt><dd data-round-score></dd></div></dl><a class="source-link" data-round-source href="${links.rounds}" target="_blank" rel="noopener noreferrer">${r.official}</a></article>`;
  return `<section class="v4-section information-v4" id="objetivo-nclc7" aria-labelledby="nclc-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${n.tag}</p><h2 id="nclc-title">${n.title}</h2>${n.text.map(p => `<p>${p}</p>`).join('')}<a class="text-link" href="${pages(lang).nclc}">${n.link} ${arrow}</a></div>
        <div class="information-panel nclc-panel"><h3>${n.panel}</h3><p class="panel-intro">${n.intro}</p><dl class="nclc-skills">${n.skills.map(skill => `<div><dt>${skill}</dt><dd>NCLC 7+</dd></div>`).join('')}</dl><p class="panel-note terra-note">${n.note}</p><a class="source-link" href="${links.category}" target="_blank" rel="noopener noreferrer">${n.source} ${out}</a></div>
      </div>
    </section>

    <section class="v4-section information-v4" id="crs" aria-labelledby="crs-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${c.tag}</p><h2 id="crs-title">${c.title}</h2>${c.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-outline" data-ircc-calculator href="${links.calculator}" target="_blank" rel="noopener noreferrer">${c.cta} ${out}</a></div>
        <div class="information-panel crs-panel"><h3>${c.panel}</h3><ol class="factor-list">${c.factors.map(([title, text], i) => `<li><span>0${i + 1}</span><div><h4>${title}</h4><p>${text}</p></div></li>`).join('')}</ol><p class="panel-note">${c.note}</p><a class="source-link" data-ircc-criteria href="${links.criteria}" target="_blank" rel="noopener noreferrer">${c.source} ${out}</a></div>
      </div>
    </section>

    <section class="v4-section information-v4 rounds-v4" id="rondas-ircc" aria-labelledby="rounds-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${r.tag}</p><h2 id="rounds-title">${r.title}</h2>${r.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-outline" href="${links.rounds}" target="_blank" rel="noopener noreferrer">${r.cta} ${out}</a></div>
        <div class="information-panel rounds-panel" data-ircc-rounds aria-busy="true"><h3>${r.panel}</h3><p class="panel-intro">${r.intro}</p>
          ${category('french', r.french)}
          ${category('cec', r.cec)}
          <p class="panel-note">${r.note}</p><p class="rounds-status" data-ircc-status role="status">${r.status}</p><p class="rounds-updated" data-ircc-updated></p><a class="source-link" href="${links.rounds}" target="_blank" rel="noopener noreferrer">${r.source} ${out}</a>
          <noscript><p>${r.noscript}</p></noscript>
        </div>
      </div>
    </section>

    <section class="v4-section information-v4 commitment-v4" id="compromiso" aria-labelledby="commitment-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${m.tag}</p><h2 id="commitment-title">${m.title}</h2>${m.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-outline" href="${pages(lang).conditions}#compromiso-nclc7" data-cta="v4-commitment-conditions">${m.cta} ${arrow}</a></div>
        <div class="information-panel commitment-panel"><ol class="commitment-steps">${m.steps.map(([title, text], i) => `<li><span>0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol><p class="panel-note">${m.note}</p></div>
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
        <div class="final-copy"><p class="section-tag">${f.tag}</p><h2 id="final-title">${f.title}</h2><p>${f.text}</p><div class="final-actions"><a class="button button-sage" href="${pages(lang).test}" data-cta="v4-final-evaluation">${f.cta} ${arrow}</a><a class="text-link" href="${WHATSAPP}" target="_blank" rel="noopener" data-cta="v4-final-whatsapp">${f.whatsapp} ${out}</a></div></div>
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
  const markup = [stories(lang), pricing(lang), outcome(lang), faq(lang), information(lang), closing(lang)].join('\n\n    ');
  return lang === 'fr' ? frenchTypography(markup) : markup;
}

export const LEGAL_PATHS = LEGAL;
