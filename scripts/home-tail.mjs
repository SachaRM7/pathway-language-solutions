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
const IRCC_ROUNDS = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html';
const IRCC_CATEGORY = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/category-based-selection.html';
const IRCC_CALCULATOR = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html';
const IRCC_CRITERIA = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html';
const WHATSAPP = 'https://wa.me/51989887516';

const T = {
  es: {
    stories: {
      tag: 'Historias reales', title: 'Lo cuentan quienes<br> ya aprendieron con Pathway.', lead: 'Distintas realidades, un mismo acompañamiento.',
      stats: n => [[n.videos, 'testimonios en vídeo'], [n.reviews, 'recomendaciones públicas en Superprof'], [n.results, 'resultados oficiales TCF compartidos']],
      reel: 'Testimonios en vídeo', reelNote: 'Grabados por nuestros alumnos, en español.', previous: 'Testimonios anteriores', next: 'Testimonios siguientes',
      resultsTag: 'Resultados oficiales', resultsTitle: 'Resultados reales,<br> no promesas.',
      resultsText: 'Capturas del portal oficial del TCF, compartidas por nuestros alumnos al recibir sus resultados.',
      resultsNote: 'El examen oficial se realiza con el organismo examinador, no con Pathway.',
      session: 'Sesión del', levelScale: 'Nivel CECRL',
      skills: { co: 'Comprensión oral', ce: 'Comprensión escrita', eo: 'Expresión oral', ee: 'Expresión escrita' },
      reviewsTitle: 'Lo que escriben en Superprof', reviewsText: n => `${n} recomendaciones públicas, resumidas aquí.`, reviewsLink: 'Ver las recomendaciones en Superprof'
    },
    pricing: {
      tag: 'Vista del programa', title: 'Tres ritmos.<br> El mismo acompañamiento.',
      lead: 'La evaluación inicial indica el ritmo coherente con tu nivel y tu fecha, incluso si la respuesta es que el tiempo no alcanza.',
      billingTitle: 'Dos formas de inscribirte',
      billing: '<strong>Mes a mes sin permanencia, o un ciclo completo** con 15 % de descuento.</strong><p>Si empiezas con un mes y continúas después con un ciclo completo, el descuento aplicado al ciclo es del 10 %.</p><p>* Volúmenes horarios y precios de referencia: el ritmo exacto se confirma después de la evaluación inicial y según tus necesidades.</p><p>** El ciclo completo es una tarifa reducida a cambio de tu compromiso de asistir a clase durante todo el ciclo: no es reembolsable. Las horas perdidas por ausencias sin justificar no se recuperan, y no hay reembolso si al final del ciclo no alcanzas el nivel.</p>',
      switchLabel: 'Forma de inscripción', monthly: 'Inscripción mensual', cycle: 'Ciclo* <span>AHORRA 15 %</span>',
      notes: ['Todos los precios están en CAD. Cuota de inscripción única de <strong>15 CAD</strong>, añadida al primer pago tras confirmar el horario.', 'Un ciclo corresponde a un nivel del CECRL. Las duraciones son referencias desde A1 y se confirman tras la evaluación inicial.', 'El descuento del 15 % se aplica a la inscripción directa por el ciclo completo. Si empiezas con un mes y después eliges el ciclo, el descuento es del 10 %.'],
      conditions: 'Consultar las condiciones de inscripción'
    },
    outcome: {
      tag: 'Tu resultado', title: 'El recorrido termina<br> con un nivel demostrado.<span class="title-soft">No con un calendario<br> agotado.</span>',
      text: 'Un acompañamiento flexible, centrado en tu progreso real, para que llegues a tu meta con confianza y una prueba concreta de tu nivel.',
      benefits: ['Un método que te hace avanzar, sin presión innecesaria.', 'Un ritmo que se adapta a tu vida.', 'Preparación para demostrar tu nivel en un examen oficial TEF o TCF.'],
      cta: 'Evaluar mi nivel', example: 'Ejemplo', sheet: 'Resultado de nivel', name: 'Nombre', person: 'Alex <span>(ejemplo)</span>', date: 'Fecha', dateValue: '12 jun 2026',
      language: 'Idioma', french: 'Francés', global: 'Nivel global', balance: 'Balance de competencias', motto: 'Un camino real. Un nivel alcanzado.',
      caption: 'Ejemplo de balance pedagógico Pathway.<br> No es un certificado oficial TEF o TCF.'
    },
    faq: {
      tag: '¿Dudas?', title: 'Todo lo que necesitas<br> saber para empezar<br> con tranquilidad.', lead: 'Resolvemos las preguntas más frecuentes para que puedas dar el primer paso con confianza.',
      items: [
        ['¿Qué ritmo me conviene?', '<p>Depende de tu nivel, tu disponibilidad y tus objetivos. La evaluación inicial te ayuda a elegir el ritmo más adecuado.</p>'],
        ['¿Las clases son realmente privadas?', '<p>Sí. Las clases son individuales, en vivo, con un profesor que conoce tu recorrido. Los talleres ofrecen otras oportunidades de practicar, sin sustituir tus clases privadas.</p>'],
        ['¿Cómo funciona la evaluación inicial?', '<p>Un test progresivo evalúa tu comprensión escrita, tu comprensión oral y tu gramática y vocabulario. La expresión oral se confirma con un profesor. Con estos resultados y tu disponibilidad, definimos el punto de partida.</p><a class="source-link" href="{test}">Hacer la evaluación inicial →</a>'],
        ['¿Preparan para el TEF y el TCF?', '<p>Sí, el recorrido se centra en el TEF y el TCF Canadá. Trabajamos las cuatro competencias e incluimos dos simulacros completos. El examen oficial se realiza con el organismo examinador, no con Pathway.</p>'],
        ['¿Cómo me inscribo?', '<p>Evalúa tu nivel y solicita un horario indicando el ritmo y tus disponibilidades. Confirmamos el horario y el precio final antes de cualquier pago.</p><a class="source-link" href="{inscription}">Solicitar un horario →</a>']
      ],
      inviteTitle: '¿Listo para avanzar<br> hacia tu objetivo?', inviteText: 'Evalúa tu nivel y recibe una recomendación<br> adaptada a tu punto de partida.', inviteSmall: 'Sin compromiso · Toma solo unos minutos.'
    },
    nclc: {
      tag: 'Objetivo NCLC 7', title: '¿Por qué apuntar<br> <span class="title-muted">al NCLC 7?</span>',
      text: ['Para la categoría de competencia lingüística en francés de Express Entry, necesitas NCLC 7 o más en las cuatro competencias y cumplir los requisitos de uno de los programas de Express Entry.', 'Alcanzar este umbral no garantiza una invitación. El perfil, la puntuación CRS y las rondas publicadas por IRCC también cuentan.'],
      link: 'Entender el objetivo NCLC 7', panel: 'NCLC 7: el umbral francófono', intro: 'Categoría de competencia lingüística en francés',
      skills: ['Comprensión oral', 'Comprensión escrita', 'Expresión oral', 'Expresión escrita'], note: 'NCLC 7 o más en cada competencia.<br> No garantiza una invitación.', source: 'Fuente oficial: IRCC'
    },
    crs: {
      tag: 'Tu proyecto en Express Entry', title: 'Entiende tu<br> puntuación CRS.',
      text: ['El CRS clasifica los perfiles de Express Entry según varios factores: edad, estudios, idiomas y experiencia, entre otros.', 'La calculadora oficial te permite obtener una estimación a partir de tu situación. No es una invitación ni una decisión de inmigración.'],
      cta: 'Calcular mi puntuación CRS', panel: '¿Qué influye en tu puntuación?',
      factors: [['Edad', 'Tu rango de edad.'], ['Estudios', 'Tus credenciales académicas.'], ['Idiomas oficiales', 'Tus resultados en francés e inglés.'], ['Experiencia laboral en Canadá', 'Tu experiencia de trabajo canadiense.']],
      note: 'Otros criterios también pueden influir según tu perfil.', source: 'Fuente oficial: criterios CRS de IRCC'
    },
    rounds: {
      tag: 'Leer las rondas de Express Entry', title: 'Los cortes cambian<br> de una ronda a otra.',
      text: ['IRCC publica los resultados de cada ronda de invitaciones. Aquí puedes consultar las últimas rondas disponibles para la categoría de francés y Canadian Experience Class.', 'Son datos históricos, no una previsión ni una garantía para tu perfil.'],
      cta: 'Consultar las rondas oficiales', panel: 'Rondas publicadas por IRCC', intro: 'Última ronda disponible en cada categoría.',
      french: 'Competencia lingüística en francés', date: 'Fecha de la ronda', score: 'CRS mínimo', loading: 'Consultando…', official: 'Rondas oficiales',
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
      text: 'En veinte minutos situamos tu punto de partida, tu fecha y el ritmo que realmente cabe en tu vida.', cta: 'Evaluar mi nivel', whatsapp: 'Prefiero hablar por WhatsApp'
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
      tag: 'Histoires vraies', title: 'Ils et elles ont appris<br> avec Pathway, et le racontent.', lead: 'Des réalités différentes, un même accompagnement.',
      stats: n => [[n.videos, 'témoignages vidéo'], [n.reviews, 'recommandations publiques sur Superprof'], [n.results, 'résultats officiels TCF partagés']],
      reel: 'Témoignages vidéo', reelNote: 'Enregistrés par nos élèves, en espagnol.', previous: 'Témoignages précédents', next: 'Témoignages suivants',
      resultsTag: 'Résultats officiels', resultsTitle: 'Des résultats réels,<br> pas des promesses.',
      resultsText: 'Captures du portail officiel du TCF, partagées par nos élèves à la réception de leurs résultats.',
      resultsNote: 'L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.',
      session: 'Session du', levelScale: 'Niveau CECRL',
      skills: { co: 'Compréhension orale', ce: 'Compréhension écrite', eo: 'Expression orale', ee: 'Expression écrite' },
      reviewsTitle: 'Ce qu’ils écrivent sur Superprof', reviewsText: n => `${n} recommandations publiques, résumées et traduites de l’espagnol.`, reviewsLink: 'Voir les recommandations sur Superprof'
    },
    pricing: {
      tag: 'Aperçu du programme', title: 'Trois rythmes.<br> Le même accompagnement.',
      lead: 'L’évaluation initiale indique le rythme cohérent avec votre niveau et votre échéance, même si la réponse est que le temps ne suffit pas.',
      billingTitle: 'Deux façons de vous inscrire',
      billing: '<strong>Mois par mois sans engagement, ou un cycle complet** avec 15 % de remise.</strong><p>Si vous commencez par un mois et poursuivez ensuite avec un cycle complet, la remise appliquée au cycle est de 10 %.</p><p>* Volumes horaires et prix de référence : le rythme exact est confirmé après l’évaluation initiale, selon vos besoins.</p><p>** Le cycle complet est un tarif réduit en échange de votre engagement à assister aux cours pendant tout le cycle : il n’est pas remboursable. Les heures perdues par absence non justifiée ne sont pas rattrapées, et aucun remboursement n’est possible si vous n’atteignez pas le niveau à la fin du cycle.</p>',
      switchLabel: 'Mode d’inscription', monthly: 'Inscription mensuelle', cycle: 'Cycle* <span>−15 %</span>',
      notes: ['Tous les prix sont en CAD. Frais d’inscription uniques de <strong>15 CAD</strong>, ajoutés au premier paiement après confirmation de l’horaire.', 'Un cycle correspond à un niveau du CECRL. Les durées sont des références depuis A1 et sont confirmées après l’évaluation initiale.', 'La remise de 15 % s’applique à l’inscription directe pour le cycle complet. Si vous commencez par un mois puis choisissez le cycle, la remise est de 10 %.'],
      conditions: 'Consulter les conditions d’inscription'
    },
    outcome: {
      tag: 'Votre résultat', title: 'Le parcours se termine<br> par un niveau démontré.<span class="title-soft">Pas par un calendrier<br> épuisé.</span>',
      text: 'Un accompagnement flexible, centré sur vos progrès réels, pour atteindre votre objectif avec confiance et une preuve concrète de votre niveau.',
      benefits: ['Une méthode qui vous fait avancer, sans pression inutile.', 'Un rythme qui s’adapte à votre vie.', 'Une préparation pour démontrer votre niveau à un examen officiel TEF ou TCF.'],
      cta: 'Évaluer mon niveau', example: 'Exemple', sheet: 'Bilan de niveau', name: 'Nom', person: 'Alex <span>(exemple)</span>', date: 'Date', dateValue: '12 juin 2026',
      language: 'Langue', french: 'Français', global: 'Niveau global', balance: 'Bilan des compétences', motto: 'Un vrai parcours. Un niveau atteint.',
      caption: 'Exemple de bilan pédagogique Pathway.<br> Ce n’est pas une attestation officielle TEF ou TCF.'
    },
    faq: {
      tag: 'Des questions ?', title: 'Tout ce qu’il faut<br> savoir pour commencer<br> sereinement.', lead: 'Nous répondons aux questions les plus fréquentes pour que vous fassiez le premier pas en confiance.',
      items: [
        ['Quel rythme me convient ?', '<p>Cela dépend de votre niveau, de vos disponibilités et de vos objectifs. L’évaluation initiale vous aide à choisir le rythme le plus adapté.</p>'],
        ['Les cours sont-ils vraiment privés ?', '<p>Oui. Les cours sont individuels, en direct, avec un professeur qui connaît votre parcours. Les ateliers offrent d’autres occasions de pratiquer, sans remplacer vos cours privés.</p>'],
        ['Comment fonctionne l’évaluation initiale ?', '<p>Un test progressif évalue votre compréhension écrite, votre compréhension orale, ainsi que votre grammaire et votre vocabulaire. L’expression orale est confirmée avec un professeur. À partir de ces résultats et de vos disponibilités, nous définissons votre point de départ.</p><a class="source-link" href="{test}">Faire l’évaluation initiale →</a>'],
        ['Préparez-vous au TEF et au TCF ?', '<p>Oui, le parcours est centré sur le TEF et le TCF Canada. Nous travaillons les quatre compétences et incluons deux examens blancs complets. L’examen officiel se passe auprès de l’organisme certificateur, pas chez Pathway.</p>'],
        ['Comment m’inscrire ?', '<p>Évaluez votre niveau, puis demandez un horaire en indiquant le rythme et vos disponibilités. Nous confirmons l’horaire et le prix final avant tout paiement.</p><a class="source-link" href="{inscription}">Demander un horaire →</a>']
      ],
      inviteTitle: 'Prêt à avancer<br> vers votre objectif ?', inviteText: 'Évaluez votre niveau et recevez une recommandation<br> adaptée à votre point de départ.', inviteSmall: 'Sans engagement · Quelques minutes suffisent.'
    },
    nclc: {
      tag: 'Objectif NCLC 7', title: 'Pourquoi viser<br> <span class="title-muted">le NCLC 7 ?</span>',
      text: ['Pour la catégorie de compétence linguistique en français d’Express Entry, il faut un NCLC 7 ou plus dans les quatre compétences et remplir les conditions de l’un des programmes d’Express Entry.', 'Atteindre ce seuil ne garantit pas une invitation. Le profil, le score CRS et les rondes publiées par IRCC comptent aussi.'],
      link: 'Comprendre l’objectif NCLC 7', panel: 'NCLC 7 : le seuil francophone', intro: 'Catégorie de compétence linguistique en français',
      skills: ['Compréhension orale', 'Compréhension écrite', 'Expression orale', 'Expression écrite'], note: 'NCLC 7 ou plus dans chaque compétence.<br> Ne garantit pas une invitation.', source: 'Source officielle : IRCC'
    },
    crs: {
      tag: 'Votre projet Express Entry', title: 'Comprendre votre<br> score CRS.',
      text: ['Le CRS classe les profils Express Entry selon plusieurs facteurs : âge, études, langues et expérience, entre autres.', 'Le calculateur officiel vous donne une estimation à partir de votre situation. Ce n’est ni une invitation ni une décision d’immigration.'],
      cta: 'Calculer mon score CRS', panel: 'Qu’est-ce qui influence votre score ?',
      factors: [['Âge', 'Votre tranche d’âge.'], ['Études', 'Vos diplômes.'], ['Langues officielles', 'Vos résultats en français et en anglais.'], ['Expérience de travail au Canada', 'Votre expérience professionnelle canadienne.']],
      note: 'D’autres critères peuvent aussi compter selon votre profil.', source: 'Source officielle : critères CRS d’IRCC'
    },
    rounds: {
      tag: 'Lire les rondes d’Express Entry', title: 'Les seuils changent<br> d’une ronde à l’autre.',
      text: ['IRCC publie les résultats de chaque ronde d’invitations. Vous pouvez consulter ici les dernières rondes disponibles pour la catégorie francophone et la Canadian Experience Class.', 'Ce sont des données historiques, pas une prévision ni une garantie pour votre profil.'],
      cta: 'Consulter les rondes officielles', panel: 'Rondes publiées par IRCC', intro: 'Dernière ronde disponible dans chaque catégorie.',
      french: 'Compétence linguistique en français', date: 'Date de la ronde', score: 'CRS minimum', loading: 'Consultation…', official: 'Rondes officielles',
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
      text: 'En vingt minutes, nous situons votre point de départ, votre échéance et le rythme qui s’intègre vraiment à votre vie.', cta: 'Évaluer mon niveau', whatsapp: 'Je préfère écrire sur WhatsApp'
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
      session: 'Session of', levelScale: 'CEFR level',
      skills: { co: 'Listening', ce: 'Reading', eo: 'Speaking', ee: 'Writing' },
      reviewsTitle: 'What they write on Superprof', reviewsText: n => `${n} public recommendations, summarized and translated from Spanish.`, reviewsLink: 'See the recommendations on Superprof'
    },
    pricing: {
      tag: 'Program overview', title: 'Three paces.<br> The same support.',
      lead: 'The initial assessment shows the pace that fits your level and your deadline, even when the answer is that there isn’t enough time.',
      billingTitle: 'Two ways to enrol',
      billing: '<strong>Month to month with no commitment, or a full cycle** with a 15% discount.</strong><p>If you start with one month and then continue with a full cycle, the discount on the cycle is 10%.</p><p>* Reference hours and prices: the exact pace is confirmed after the initial assessment, according to your needs.</p><p>** The full cycle is a reduced rate in exchange for your commitment to attend class for the whole cycle: it is non-refundable. Hours lost to unjustified absences are not made up, and there is no refund if you do not reach the level by the end of the cycle.</p>',
      switchLabel: 'Enrolment option', monthly: 'Monthly enrolment', cycle: 'Cycle* <span>SAVE 15%</span>',
      notes: ['All prices are in CAD. One-time registration fee of <strong>15 CAD</strong>, added to the first payment once your schedule is confirmed.', 'A cycle covers one CEFR level. Durations are references from A1 and are confirmed after the initial assessment.', 'The 15% discount applies when you enrol directly for the full cycle. If you start with one month and then choose the cycle, the discount is 10%.'],
      conditions: 'Read the enrolment conditions'
    },
    outcome: {
      tag: 'Your result', title: 'The path ends<br> with a proven level.<span class="title-soft">Not with a used-up<br> calendar.</span>',
      text: 'Flexible support, focused on your real progress, so you reach your goal with confidence and concrete proof of your level.',
      benefits: ['A method that moves you forward, without needless pressure.', 'A pace that fits your life.', 'Preparation to prove your level in an official TEF or TCF exam.'],
      cta: 'Assess my level', example: 'Example', sheet: 'Level report', name: 'Name', person: 'Alex <span>(example)</span>', date: 'Date', dateValue: 'Jun 12, 2026',
      language: 'Language', french: 'French', global: 'Overall level', balance: 'Skills breakdown', motto: 'A real path. A level reached.',
      caption: 'Example of a Pathway progress report.<br> Not an official TEF or TCF certificate.'
    },
    faq: {
      tag: 'Questions?', title: 'Everything you need<br> to know to start<br> with peace of mind.', lead: 'We answer the most common questions so you can take the first step with confidence.',
      items: [
        ['Which pace is right for me?', '<p>It depends on your level, your availability and your goals. The initial assessment helps you choose the most suitable pace.</p>'],
        ['Are the lessons really private?', '<p>Yes. Lessons are one-to-one and live, with a teacher who knows your path. Workshops give you other chances to practise, without replacing your private lessons.</p>'],
        ['How does the initial assessment work?', '<p>A progressive test assesses your reading, your listening, and your grammar and vocabulary. Speaking is confirmed with a teacher. With these results and your availability, we set your starting point.</p><a class="source-link" href="{test}">Take the initial assessment →</a>'],
        ['Do you prepare for the TEF and TCF?', '<p>Yes, the path focuses on the TEF and TCF Canada. We work on all four skills and include two full mock exams. The official exam is taken with the exam provider, not with Pathway.</p>'],
        ['How do I enrol?', '<p>Assess your level, then request a schedule with your preferred pace and availability. We confirm the schedule and the final price before any payment.</p><a class="source-link" href="{inscription}">Request a schedule →</a>']
      ],
      inviteTitle: 'Ready to move<br> towards your goal?', inviteText: 'Assess your level and get a recommendation<br> suited to your starting point.', inviteSmall: 'No commitment · It only takes a few minutes.'
    },
    nclc: {
      tag: 'NCLC 7 goal', title: 'Why aim<br> <span class="title-muted">for NCLC 7?</span>',
      text: ['For the Express Entry French-language proficiency category, you need NCLC 7 or higher in all four skills and must meet the requirements of one of the Express Entry programs.', 'Reaching this threshold doesn’t guarantee an invitation. Your profile, your CRS score and the rounds published by IRCC also count.'],
      link: 'Understand the NCLC 7 goal', panel: 'NCLC 7: the French-language threshold', intro: 'French-language proficiency category',
      skills: ['Listening', 'Reading', 'Speaking', 'Writing'], note: 'NCLC 7 or higher in every skill.<br> Doesn’t guarantee an invitation.', source: 'Official source: IRCC'
    },
    crs: {
      tag: 'Your Express Entry plan', title: 'Understand your<br> CRS score.',
      text: ['The CRS ranks Express Entry profiles on several factors: age, education, languages and experience, among others.', 'The official calculator gives you an estimate based on your situation. It is neither an invitation nor an immigration decision.'],
      cta: 'Calculate my CRS score', panel: 'What affects your score?',
      factors: [['Age', 'Your age range.'], ['Education', 'Your academic credentials.'], ['Official languages', 'Your results in French and English.'], ['Canadian work experience', 'Your work experience in Canada.']],
      note: 'Other criteria may also count depending on your profile.', source: 'Official source: IRCC CRS criteria'
    },
    rounds: {
      tag: 'Reading Express Entry rounds', title: 'Cut-offs change<br> from round to round.',
      text: ['IRCC publishes the results of every round of invitations. Here you can see the latest rounds available for the French category and the Canadian Experience Class.', 'These are historical figures, not a forecast or a guarantee for your profile.'],
      cta: 'See the official rounds', panel: 'Rounds published by IRCC', intro: 'Latest round available in each category.',
      french: 'French-language proficiency', date: 'Round date', score: 'Minimum CRS', loading: 'Checking…', official: 'Official rounds',
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
      text: 'In twenty minutes, we pin down your starting point, your deadline and the pace that truly fits your life.', cta: 'Assess my level', whatsapp: 'I’d rather talk on WhatsApp'
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
      session: 'Prüfung vom', levelScale: 'GER-Niveau',
      skills: { co: 'Hörverstehen', ce: 'Leseverstehen', eo: 'Mündlicher Ausdruck', ee: 'Schriftlicher Ausdruck' },
      reviewsTitle: 'Was sie auf Superprof schreiben', reviewsText: n => `${n} öffentliche Empfehlungen, zusammengefasst und aus dem Spanischen übersetzt.`, reviewsLink: 'Empfehlungen auf Superprof ansehen'
    },
    pricing: {
      tag: 'Programmübersicht', title: 'Drei Lerntempos.<br> Dieselbe Begleitung.',
      lead: 'Die Ersteinstufung zeigt das Tempo, das zu Ihrem Niveau und Ihrem Termin passt, auch wenn die Antwort lautet, dass die Zeit nicht reicht.',
      billingTitle: 'Zwei Wege zur Anmeldung',
      billing: '<strong>Monatlich ohne Mindestlaufzeit oder ein ganzer Zyklus** mit 15 % Rabatt.</strong><p>Wenn Sie mit einem Monat beginnen und danach einen ganzen Zyklus buchen, beträgt der Rabatt auf den Zyklus 10 %.</p><p>* Stundenumfang und Preise sind Richtwerte: Das genaue Tempo wird nach der Ersteinstufung und nach Ihrem Bedarf bestätigt.</p><p>** Der ganze Zyklus ist ein reduzierter Tarif im Gegenzug für Ihre Verpflichtung, während des gesamten Zyklus am Unterricht teilzunehmen: Er wird nicht erstattet. Durch unentschuldigte Abwesenheiten verlorene Stunden werden nicht nachgeholt, und es gibt keine Erstattung, wenn Sie das Niveau am Ende des Zyklus nicht erreichen.</p>',
      switchLabel: 'Anmeldeform', monthly: 'Monatliche Anmeldung', cycle: 'Zyklus* <span>15 % SPAREN</span>',
      notes: ['Alle Preise in CAD. Einmalige Anmeldegebühr von <strong>15 CAD</strong>, die nach Bestätigung des Stundenplans zur ersten Zahlung hinzukommt.', 'Ein Zyklus entspricht einem GER-Niveau. Die Dauern sind Richtwerte ab A1 und werden nach der Ersteinstufung bestätigt.', 'Der Rabatt von 15 % gilt bei direkter Anmeldung für den ganzen Zyklus. Wenn Sie mit einem Monat beginnen und danach den Zyklus wählen, beträgt der Rabatt 10 %.'],
      conditions: 'Anmeldebedingungen lesen'
    },
    outcome: {
      tag: 'Ihr Ergebnis', title: 'Der Weg endet<br> mit einem nachgewiesenen Niveau.<span class="title-soft">Nicht mit einem<br> abgelaufenen Kalender.</span>',
      text: 'Eine flexible Begleitung, ausgerichtet auf Ihre echten Fortschritte, damit Sie Ihr Ziel mit Zuversicht und einem konkreten Nachweis Ihres Niveaus erreichen.',
      benefits: ['Eine Methode, die Sie voranbringt, ohne unnötigen Druck.', 'Ein Tempo, das sich Ihrem Leben anpasst.', 'Vorbereitung, um Ihr Niveau in einer offiziellen TEF- oder TCF-Prüfung nachzuweisen.'],
      cta: 'Mein Niveau einstufen', example: 'Beispiel', sheet: 'Niveaubericht', name: 'Name', person: 'Alex <span>(Beispiel)</span>', date: 'Datum', dateValue: '12. Juni 2026',
      language: 'Sprache', french: 'Französisch', global: 'Gesamtniveau', balance: 'Kompetenzbilanz', motto: 'Ein echter Weg. Ein erreichtes Niveau.',
      caption: 'Beispiel eines pädagogischen Berichts von Pathway.<br> Kein offizielles TEF- oder TCF-Zertifikat.'
    },
    faq: {
      tag: 'Fragen?', title: 'Alles, was Sie wissen<br> müssen, um entspannt<br> zu beginnen.', lead: 'Wir beantworten die häufigsten Fragen, damit Sie den ersten Schritt mit Zuversicht gehen.',
      items: [
        ['Welches Tempo passt zu mir?', '<p>Das hängt von Ihrem Niveau, Ihrer Verfügbarkeit und Ihren Zielen ab. Die Ersteinstufung hilft Ihnen, das passende Tempo zu wählen.</p>'],
        ['Ist der Unterricht wirklich privat?', '<p>Ja. Der Unterricht ist einzeln und live, mit einer Lehrkraft, die Ihren Weg kennt. Die Workshops bieten zusätzliche Übungsmöglichkeiten, ersetzen aber Ihren Einzelunterricht nicht.</p>'],
        ['Wie funktioniert die Ersteinstufung?', '<p>Ein progressiver Test prüft Ihr Leseverstehen, Ihr Hörverstehen sowie Grammatik und Wortschatz. Der mündliche Ausdruck wird mit einer Lehrkraft bestätigt. Anhand dieser Ergebnisse und Ihrer Verfügbarkeit legen wir Ihren Ausgangspunkt fest.</p><a class="source-link" href="{test}">Ersteinstufung machen →</a>'],
        ['Bereiten Sie auf TEF und TCF vor?', '<p>Ja, der Weg ist auf TEF und TCF Canada ausgerichtet. Wir trainieren alle vier Kompetenzen und bieten zwei vollständige Probeprüfungen. Die offizielle Prüfung wird bei der Prüfungsstelle abgelegt, nicht bei Pathway.</p>'],
        ['Wie melde ich mich an?', '<p>Stufen Sie Ihr Niveau ein und fragen Sie einen Stundenplan an, mit Tempo und Verfügbarkeit. Wir bestätigen Stundenplan und Endpreis vor jeder Zahlung.</p><a class="source-link" href="{inscription}">Stundenplan anfragen →</a>']
      ],
      inviteTitle: 'Bereit, Ihrem Ziel<br> näherzukommen?', inviteText: 'Stufen Sie Ihr Niveau ein und erhalten Sie eine Empfehlung<br> passend zu Ihrem Ausgangspunkt.', inviteSmall: 'Unverbindlich · Dauert nur wenige Minuten.'
    },
    nclc: {
      tag: 'Ziel NCLC 7', title: 'Warum<br> <span class="title-muted">NCLC 7 anstreben?</span>',
      text: ['Für die Kategorie französische Sprachkompetenz von Express Entry brauchen Sie NCLC 7 oder mehr in allen vier Kompetenzen und müssen die Voraussetzungen eines der Express-Entry-Programme erfüllen.', 'Diese Schwelle zu erreichen, garantiert keine Einladung. Das Profil, der CRS-Punktwert und die von IRCC veröffentlichten Runden zählen ebenfalls.'],
      link: 'Das Ziel NCLC 7 verstehen', panel: 'NCLC 7: die frankophone Schwelle', intro: 'Kategorie französische Sprachkompetenz',
      skills: ['Hörverstehen', 'Leseverstehen', 'Mündlicher Ausdruck', 'Schriftlicher Ausdruck'], note: 'NCLC 7 oder mehr in jeder Kompetenz.<br> Garantiert keine Einladung.', source: 'Offizielle Quelle: IRCC'
    },
    crs: {
      tag: 'Ihr Express-Entry-Vorhaben', title: 'Ihren CRS-Punktwert<br> verstehen.',
      text: ['Das CRS ordnet Express-Entry-Profile nach mehreren Faktoren: unter anderem Alter, Ausbildung, Sprachen und Berufserfahrung.', 'Der offizielle Rechner liefert eine Schätzung anhand Ihrer Situation. Er ist weder eine Einladung noch eine Einwanderungsentscheidung.'],
      cta: 'Meinen CRS-Punktwert berechnen', panel: 'Was beeinflusst Ihren Punktwert?',
      factors: [['Alter', 'Ihre Altersgruppe.'], ['Ausbildung', 'Ihre Abschlüsse.'], ['Amtssprachen', 'Ihre Ergebnisse in Französisch und Englisch.'], ['Berufserfahrung in Kanada', 'Ihre kanadische Arbeitserfahrung.']],
      note: 'Je nach Profil können weitere Kriterien zählen.', source: 'Offizielle Quelle: CRS-Kriterien von IRCC'
    },
    rounds: {
      tag: 'Express-Entry-Runden lesen', title: 'Die Grenzwerte ändern sich<br> von Runde zu Runde.',
      text: ['IRCC veröffentlicht die Ergebnisse jeder Einladungsrunde. Hier sehen Sie die neuesten verfügbaren Runden für die französische Kategorie und die Canadian Experience Class.', 'Das sind historische Daten, keine Prognose und keine Garantie für Ihr Profil.'],
      cta: 'Offizielle Runden ansehen', panel: 'Von IRCC veröffentlichte Runden', intro: 'Neueste verfügbare Runde je Kategorie.',
      french: 'Französische Sprachkompetenz', date: 'Datum der Runde', score: 'Mindest-CRS', loading: 'Wird abgerufen…', official: 'Offizielle Runden',
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
      text: 'In zwanzig Minuten bestimmen wir Ihren Ausgangspunkt, Ihren Termin und das Tempo, das wirklich in Ihr Leben passt.', cta: 'Mein Niveau einstufen', whatsapp: 'Lieber per WhatsApp schreiben'
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
  en: { legal: '/v4/en/legal-notice.html', privacy: '/v4/en/politique-confidentialite.html', conditions: '/v4/en/conditions-nclc7.html', cookies: '/v4/en/cookies.html' },
  de: { legal: '/v4/de/rechtliche-hinweise.html', privacy: '/v4/de/politique-confidentialite.html', conditions: '/v4/de/conditions-nclc7.html', cookies: '/v4/de/cookies.html' }
};

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const formatDate = (iso, locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)).replace(/\.(?= \d)|(?<=[a-zé])\.(?= )/g, '');
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
  // Always the four tests in the same order, so the cards line up; a test the
  // screenshot does not show stays as an empty row.
  const rows = SKILL_ORDER.map(key => {
    const skill = result.skills.find(item => item.skill === key);
    if (!skill) return `<li class="is-missing" title="${esc(r.missing)}"><span class="rs-skill">${esc(s.skills[key])}<span class="sr-only"> · ${esc(r.missing)}</span></span><span class="rs-score">—</span><b class="rs-level">—</b></li>`;
    return `<li><span class="rs-skill">${esc(s.skills[key])}</span><span class="rs-score">${skill.score}<small>/${skill.max}</small></span><b class="rs-level level-${skill.level.toLowerCase()}">${esc(skill.level)}</b></li>`;
  }).join('');
  const meta = result.session ? formatDate(result.session, locale) : r.noDate;
  const links = [
    videoIndex >= 0 ? `<button class="text-link" type="button" data-story-open="${videoIndex}"><svg class="icon" aria-hidden="true"><use href="#i-play"/></svg>${esc(r.watch(result.name))}</button>` : '',
    result.image ? `<a class="source-link" href="${esc(result.image)}" data-result-image data-result-alt="${esc(r.documentAlt(result.name))}">${esc(r.document)}</a>` : ''
  ].join('');
  return `<article class="result-card">
            <header><span class="rs-avatar" aria-hidden="true">${esc(initials(result.name))}</span><div><h4>${esc(result.name)}</h4><p>${esc(meta)}</p></div><span class="rs-exam">${esc(result.exam)}</span></header>
            <ul class="rs-skills" aria-label="${esc(s.levelScale)}">${rows}</ul>
            ${reachesNclc7(result) ? `<p class="rs-goal"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${esc(r.nclc7)}</p>` : ''}
            <footer>${links}</footer>
          </article>`;
}

function reviewCard(review, quote, r) {
  return `<li><figure class="quote-card"><blockquote>“${esc(quote)}”</blockquote><figcaption><span class="rs-avatar" aria-hidden="true">${esc(initials(review.name))}</span><span><strong>${esc(review.name)}</strong><small>${esc(r.reviewSource)}</small></span></figcaption></figure></li>`;
}

function stories(lang) {
  const s = T[lang].stories;
  const r = runtime(lang).stories;
  const quotes = lang === 'es' ? WRITTEN_TESTIMONIALS.map(review => review.quote) : REVIEW_QUOTES[lang];
  if (quotes.length !== WRITTEN_TESTIMONIALS.length) throw new Error(`home-tail: ${lang} needs ${WRITTEN_TESTIMONIALS.length} review translations`);
  const half = Math.ceil(WRITTEN_TESTIMONIALS.length / 2);
  const row = (from, to) => WRITTEN_TESTIMONIALS.slice(from, to).map((review, i) => reviewCard(review, quotes[from + i], r)).join('');
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
          <a class="source-link" href="${pages(lang).conditions}">${p.conditions} <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>`;
}

function outcome(lang) {
  const o = T[lang].outcome;
  const skills = T[lang].nclc.skills;
  const levels = ['b2', 'b2', 'b1', 'b2'];
  return `<section class="v4-section outcome-v4" id="resultado" aria-labelledby="outcome-title">
      <div class="container outcome-grid">
        <div class="v4-copy">
          <p class="section-tag">${o.tag}</p>
          <h2 id="outcome-title">${o.title}</h2>
          <p>${o.text}</p>
          <ul class="result-benefits">${o.benefits.map(item => `<li>${item}</li>`).join('')}</ul>
          <a class="button button-terra" href="${pages(lang).test}" data-cta="v4-result-evaluation">${o.cta} ${arrow}</a>
        </div>
        <figure class="result-scene">
          <div class="result-folder" aria-hidden="true"></div>
          <div class="result-sheet">
            <header><img src="/v4/assets/pathway-logo.svg" width="180" height="42" alt="Pathway Language Solutions" loading="lazy"><span class="example-label">${o.example}</span></header>
            <h3>${o.sheet}</h3>
            <dl class="result-person"><div><dt>${o.name}</dt><dd>${o.person}</dd></div><div><dt>${o.date}</dt><dd>${o.dateValue}</dd></div><div><dt>${o.language}</dt><dd>${o.french}</dd></div></dl>
            <div class="result-global"><span>${o.global}</span><strong>B2</strong></div>
            <h4>${o.balance}</h4>
            <div class="result-skills">${skills.map((label, i) => `<div><span>${label}</span><b>${levels[i].toUpperCase()}</b><i class="level-${levels[i]}"></i></div>`).join('')}</div>
            <p class="result-motto">${o.motto}</p>
          </div>
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
  const category = (key, title) => `<article class="round-category" data-ircc-category="${key}"><h4>${title}</h4><dl><div><dt>${r.date}</dt><dd data-round-date>${r.loading}</dd></div><div><dt>${r.score}</dt><dd data-round-score></dd></div></dl><a class="source-link" data-round-source href="${IRCC_ROUNDS}" target="_blank" rel="noopener noreferrer">${r.official}</a></article>`;
  return `<section class="v4-section information-v4" id="objetivo-nclc7" aria-labelledby="nclc-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${n.tag}</p><h2 id="nclc-title">${n.title}</h2>${n.text.map(p => `<p>${p}</p>`).join('')}<a class="text-link" href="${pages(lang).nclc}">${n.link} ${arrow}</a></div>
        <div class="information-panel nclc-panel"><h3>${n.panel}</h3><p class="panel-intro">${n.intro}</p><dl class="nclc-skills">${n.skills.map(skill => `<div><dt>${skill}</dt><dd>NCLC 7+</dd></div>`).join('')}</dl><p class="panel-note terra-note">${n.note}</p><a class="source-link" href="${IRCC_CATEGORY}" target="_blank" rel="noopener noreferrer">${n.source} ${out}</a></div>
      </div>
    </section>

    <section class="v4-section information-v4" id="crs" aria-labelledby="crs-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${c.tag}</p><h2 id="crs-title">${c.title}</h2>${c.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-primary" data-ircc-calculator href="${IRCC_CALCULATOR}" target="_blank" rel="noopener noreferrer">${c.cta} ${out}</a></div>
        <div class="information-panel crs-panel"><h3>${c.panel}</h3><ol class="factor-list">${c.factors.map(([title, text], i) => `<li><span>0${i + 1}</span><div><h4>${title}</h4><p>${text}</p></div></li>`).join('')}</ol><p class="panel-note">${c.note}</p><a class="source-link" data-ircc-criteria href="${IRCC_CRITERIA}" target="_blank" rel="noopener noreferrer">${c.source} ${out}</a></div>
      </div>
    </section>

    <section class="v4-section information-v4 rounds-v4" id="rondas-ircc" aria-labelledby="rounds-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${r.tag}</p><h2 id="rounds-title">${r.title}</h2>${r.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-primary" href="${IRCC_ROUNDS}" target="_blank" rel="noopener noreferrer">${r.cta} ${out}</a></div>
        <div class="information-panel rounds-panel" data-ircc-rounds aria-busy="true"><h3>${r.panel}</h3><p class="panel-intro">${r.intro}</p>
          ${category('french', r.french)}
          ${category('cec', 'Canadian Experience Class')}
          <p class="panel-note">${r.note}</p><p class="rounds-status" data-ircc-status role="status">${r.status}</p><p class="rounds-updated" data-ircc-updated></p><a class="source-link" data-ircc-rounds-page href="${IRCC_ROUNDS}" target="_blank" rel="noopener noreferrer">${r.source} ${out}</a>
          <noscript><p>${r.noscript}</p></noscript>
        </div>
      </div>
    </section>

    <section class="v4-section information-v4 commitment-v4" id="compromiso" aria-labelledby="commitment-title">
      <div class="container information-grid">
        <div class="v4-copy"><p class="section-tag">${m.tag}</p><h2 id="commitment-title">${m.title}</h2>${m.text.map(p => `<p>${p}</p>`).join('')}<a class="button button-primary" href="${pages(lang).conditions}#compromiso-nclc7" data-cta="v4-commitment-conditions">${m.cta} ${arrow}</a></div>
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
  return [stories(lang), pricing(lang), outcome(lang), faq(lang), information(lang), closing(lang)].join('\n\n    ');
}

export const LEGAL_PATHS = LEGAL;
