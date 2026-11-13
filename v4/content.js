// Sources: existing Spanish #planes/#historias, inscription.html and pathway-v3.js.
// Keep the full-cycle calculations together so the monthly and cycle views agree.
//
// Fuentes:
// - Tarifas y ritmos: decisión validada por Pathway (5 intensidades, 3 duraciones de ciclo).
// - Testimonios en video: pathway-v3.js (testimonialVideos).
// - Testimonios escritos: index.html sección #historias (opiniones condensadas).
// - Enlaces: rutas /v4/ reales del espejo; redes sociales aún no documentadas.
//
// Tres ritmos (Esencial, Acelerado, Intensivo) y cinco intensidades:
//   Esencial 2 h/semana (ciclo de 6 meses), Acelerado 3 o 4 h/semana (ciclo de
//   5 meses), Intensivo 5 o 6 h/semana (ciclo de 4 meses).
// Precio mensual = 92,50 CAD por hora semanal; nunca depende del nivel.
// Los importes de ciclo se derivan del mensual y no se codifican a mano:
//   original = mensual * meses ; amount = original * (1 - 0,15), redondeado a 0,50 CAD ;
//   saving = original - amount.

const CAD = 'CAD';
const CYCLE_DISCOUNT_RATE = 0.15;
const PRICE_PER_WEEKLY_HOUR = 92.5;

/** Redondeo a 2 decimales para los importes derivados. */
const round2 = value => Math.round(value * 100) / 100;
/** Redondeo a 0,50 CAD (1.179,375 → 1.179,50), como en la inscripción. */
const roundHalf = value => Math.round(value * 2) / 2;

/** Importe de ciclo derivado del precio mensual validado y del descuento del 15 %. */
const cycleFromMonthly = (monthly, months) => {
  const originalAmount = round2(monthly * months);
  const amount = roundHalf(originalAmount * (1 - CYCLE_DISCOUNT_RATE));
  return Object.freeze({
    amount,
    originalAmount,
    saving: round2(originalAmount - amount),
    currency: CAD,
    months,
    equivalentPerMonth: round2(amount / months)
  });
};

/** Una intensidad (horas por semana) de un ritmo, con su precio mensual y de ciclo. */
const option = (hoursPerWeek, cycleMonths) => {
  const monthly = round2(hoursPerWeek * PRICE_PER_WEEKLY_HOUR);
  return Object.freeze({
    hoursPerWeek,
    hoursPerMonth: hoursPerWeek * 4,
    monthly,
    cycle: cycleFromMonthly(monthly, cycleMonths)
  });
};

/**
 * Un ritmo de #planes. monthly.amount y cycle.amount son el precio « desde »
 * (la intensidad más baja del ritmo); defaultHours es la intensidad que el
 * botón de la tarjeta preselecciona en la inscripción (hours=…).
 */
const plan = ({ id, rhythm, tag, fullPathMonths, featured, cycleMonths, hours, defaultHours, includes }) => {
  const options = Object.freeze(hours.map(h => option(h, cycleMonths)));
  const [first] = options;
  return Object.freeze({
    id,
    enrollmentRhythmId: rhythm,
    name: rhythm,
    tag,
    fullPathMonths,
    featured,
    defaultHours,
    from: options.length > 1,
    options,
    monthly: Object.freeze({ amount: first.monthly, currency: CAD, hoursPerMonth: first.hoursPerMonth, hoursPerWeek: first.hoursPerWeek }),
    cycle: Object.freeze({ ...first.cycle, hoursPerWeek: first.hoursPerWeek }),
    includes: Object.freeze(includes)
  });
};

/**
 * Tres ritmos de referencia de #planes.
 * monthly.amount y cycle.amount son la interfaz estable que consume la home.
 */
export const PRICING = Object.freeze({
  currency: CAD,
  pricePerWeeklyHour: PRICE_PER_WEEKLY_HOUR,
  registrationFee: Object.freeze({
    amount: 15,
    currency: CAD,
    note: 'Cuota de inscripción única; se añade al primer pago tras confirmar el horario.'
  }),
  discount: Object.freeze({
    cycleRate: CYCLE_DISCOUNT_RATE,
    afterFirstMonthRate: 0.10,
    note: 'Ciclo completo: 15 % de descuento. Si se pasa al ciclo tras un primer mes, el descuento es del 10 %.'
  }),
  cycles: Object.freeze({
    note: 'Un ciclo completo corresponde a un nivel del CECRL (A1, A2, B1, B2), con una duración de referencia fija según el ritmo: 6 meses en Esencial, 5 en Acelerado y 4 en Intensivo.',
    perLevels: Object.freeze(['A1', 'A2', 'B1', 'B2'])
  }),
  plans: Object.freeze([
    plan({
      id: 'essential', rhythm: 'Esencial', tag: 'De A1 a B2: unos 24 meses', fullPathMonths: 24, featured: false,
      cycleMonths: 6, hours: [2], defaultHours: 2,
      includes: ['Clases individuales en vivo por Zoom', 'Campus Pathway: ejercicios, manual en línea y grabaciones', 'Seguimiento de tu progreso', '2 simulacros TEF / TCF Canada']
    }),
    plan({
      id: 'accelerated', rhythm: 'Acelerado', tag: 'De A1 a B2: unos 20 meses', fullPathMonths: 20, featured: true,
      cycleMonths: 5, hours: [3, 4], defaultHours: 4,
      includes: ['Compatible con trabajo a tiempo completo', 'Clases individuales en vivo por Zoom', 'Campus Pathway y seguimiento de tu progreso', '2 simulacros TEF / TCF Canada']
    }),
    plan({
      id: 'intensive', rhythm: 'Intensivo', tag: 'De A1 a B2: unos 16 meses', fullPathMonths: 16, featured: false,
      cycleMonths: 4, hours: [5, 6], defaultHours: 6,
      includes: ['Ritmo de avance prioritario', 'Clases individuales en vivo por Zoom', 'Campus Pathway y seguimiento de tu progreso', '2 simulacros TEF / TCF Canada']
    })
  ]),
  billingOptions: Object.freeze([
    Object.freeze({ id: 'Mensual', label: 'Mensual', note: 'Mes a mes, sin contrato mínimo' }),
    Object.freeze({ id: 'Ciclo', label: 'Ciclo', discountRate: 0.15, note: 'Inscripción directa por el ciclo completo' })
  ])
});


/** Diez testimonios en video reales (Drive « Témoignages »). */
export const VIDEO_TESTIMONIALS = Object.freeze([
  Object.freeze({
    name: 'Yazmin',
    duration: '1:56',
    src: '/assets/videos/testimonio-25-web.mp4',
    poster: '/assets/videos/testimonio-25-poster.jpg?v=20260821-testimonial-first'
  }),
  Object.freeze({
    name: 'Devon',
    duration: '2:15',
    src: '/assets/videos/testimonio-devon-web.mp4',
    poster: '/assets/videos/testimonio-devon-poster.jpg?v=20261112'
  }),
  Object.freeze({
    name: 'Majo',
    duration: '0:46',
    src: '/assets/videos/testimonio-majo-web.mp4',
    poster: '/assets/videos/testimonio-majo-poster.jpg?v=20260814'
  }),
  Object.freeze({
    name: 'Elena',
    duration: '1:06',
    src: '/assets/videos/testimonio-elena-web.mp4',
    poster: '/assets/videos/testimonio-elena-poster.jpg?v=20261112'
  }),
  Object.freeze({
    name: 'Pia',
    duration: '0:27',
    src: '/assets/videos/testimonio-22-web.mp4',
    poster: '/assets/videos/testimonio-22-poster.jpg?v=20260814-2'
  }),
  Object.freeze({
    name: 'Diego',
    duration: '0:44',
    src: '/assets/videos/testimonio-24-web.mp4',
    poster: '/assets/videos/testimonio-24-poster.jpg?v=20260821-video-carousel'
  }),
  Object.freeze({
    name: 'Jennifer',
    duration: '0:33',
    src: '/assets/videos/testimonio-21-web.mp4',
    poster: '/assets/videos/testimonio-21-poster.jpg?v=20260814-2'
  }),
  Object.freeze({
    name: 'Fabián',
    duration: '0:19',
    src: '/assets/videos/testimonio-23-web.mp4',
    poster: '/assets/videos/testimonio-23-poster.jpg?v=20260814-2'
  }),
  Object.freeze({
    name: 'Melissa',
    duration: '0:24',
    src: '/assets/videos/testimonio-meli-web.mp4',
    poster: '/assets/videos/testimonio-meli-poster.jpg?v=20260814'
  }),
  Object.freeze({
    name: 'Elisa',
    duration: '0:37',
    src: '/assets/videos/testimonio-20-web.mp4',
    poster: '/assets/videos/testimonio-20-poster.jpg?v=20260814-2'
  })
]);

/**
 * Resultados oficiales compartidos por alumnos (Drive « Témoignages »).
 * Puntuaciones copiadas de la captura del portal oficial (France Éducation
 * international). image: captura publicada, recortada para no mostrar datos
 * personales (foto, fecha de nacimiento, código, nombre completo). video:
 * nombre en VIDEO_TESTIMONIALS cuando la misma persona grabó un testimonio.
 * CO y CE se puntúan sobre 699; EE y EO sobre 20. session: null si la
 * captura no muestra la fecha.
 */
export const EXAM_RESULTS = Object.freeze([
  Object.freeze({
    name: 'Devon',
    exam: 'TCF Canada',
    session: '2026-10-07',
    video: 'Devon',
    image: '/assets/resultados/resultado-tcf-devon.jpg',
    skills: Object.freeze([
      Object.freeze({ skill: 'co', score: 644, max: 699, level: 'C2' }),
      Object.freeze({ skill: 'ce', score: 690, max: 699, level: 'C2' }),
      Object.freeze({ skill: 'eo', score: 13, max: 20, level: 'B2' }),
      Object.freeze({ skill: 'ee', score: 13, max: 20, level: 'B2' })
    ])
  }),
  Object.freeze({
    name: 'Elena',
    exam: 'TCF Québec',
    session: '2026-09-03',
    video: 'Elena',
    image: '/assets/resultados/resultado-tcf-elena.jpg',
    skills: Object.freeze([
      Object.freeze({ skill: 'co', score: 444, max: 699, level: 'B2' }),
      Object.freeze({ skill: 'ce', score: 435, max: 699, level: 'B2' }),
      Object.freeze({ skill: 'eo', score: 12, max: 20, level: 'B2' }),
      Object.freeze({ skill: 'ee', score: 8, max: 20, level: 'B1' })
    ])
  }),
  Object.freeze({
    name: 'Luz',
    exam: 'TCF',
    session: null,
    video: null,
    image: '/assets/resultados/resultado-tcf-luz.jpg',
    skills: Object.freeze([
      Object.freeze({ skill: 'co', score: 541, max: 699, level: 'C1' }),
      Object.freeze({ skill: 'eo', score: 10, max: 20, level: 'B2' })
    ])
  })
]);

/**
 * Umbral NCLC 7 del TCF Canada (tabla de equivalencias de IRCC): CO 458,
 * CE 453, EE 10, EO 10. Solo se afirma con las cuatro pruebas del TCF Canada.
 */
export const TCF_CANADA_NCLC7 = Object.freeze({ co: 458, ce: 453, ee: 10, eo: 10 });

/**
 * Quince opiniones escritas condensadas (index.html #historias). La opinión
 * firmada « La » se retiró: el nombre completo no figura en el repositorio.
 * La de Cris se reformuló sin « todos avanzáramos », que sugería un grupo
 * (las clases son individuales).
 */
export const WRITTEN_TESTIMONIALS = Object.freeze([
  Object.freeze({ name: 'Oscar', quote: 'Con Pathway, las explicaciones claras y las clases dinámicas hacen que el francés resulte fácil de entender.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Maximiliano', quote: 'Diálogos en francés, tareas entre clases y apoyo constante para mejorar la pronunciación.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Carol', quote: 'Paciencia, excelente metodología y un compromiso real con el progreso de cada alumno.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Cris', quote: 'Al empezar desde cero, Pathway me acompañó, me hizo participar y se aseguró de que avanzara.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Jesús', quote: 'En pocas clases empecé a comunicarme con situaciones del día a día y a escuchar francés auténtico.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Juanita', quote: 'He aprendido mucho y sigo motivada gracias a clases lúdicas que trabajan todas las competencias.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Dana', quote: 'En Pathway, el apoyo en español aclara los errores frecuentes de los hispanohablantes y enriquece cada clase.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'María José', quote: 'Explicaciones muy claras y una verdadera disposición para ayudar a los alumnos.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Elisa', quote: 'Mucha paciencia con la pronunciación y clases participativas, dinámicas y sin prisas.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Argentina', quote: 'Paciencia, pronunciación correcta y explicaciones sobre los matices propios del francés.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Gabrielle', quote: 'Atención a cada duda, escrita u oral, con paciencia y una energía que hace las clases amenas.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Mario', quote: 'Clases de conversación con temas excelentes; una de mis mejores experiencias aprendiendo francés.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Melissa', quote: 'El enfoque más práctico, interesante y carismático que he encontrado en dos años estudiando francés.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Pablo', quote: 'La mejor clase de francés que he tenido: siempre con ganas de enseñar.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Mayelly', quote: 'Gracias a la paciencia de las clases, logré avanzar hasta el nivel A2.', source: 'Opinión condensada' })
]);

/**
 * Enlaces reales. Todo destino interno usa el prefijo /v4/; los activos de
 * video siguen bajo /assets/ (medios existentes compartidos).
 * Las anclas sin prefijo apuntan a la propia home /v4/.
 */
export const LINKS = Object.freeze({
  home: '/v4/',
  anchors: Object.freeze({
    practice: '#en-la-practica',
    method: '#recorrido',
    experience: '#experiencia',
    program: '#programa',
    teachers: '#profesores'
  }),
  pages: Object.freeze({
    placementTest: '/v4/test-placement.html',
    inscription: '/v4/inscription.html',
    programs: Object.freeze({
      a1: '/v4/programas/a1/',
      a2: '/v4/programas/a2/',
      b1: '/v4/programas/b1/',
      b2: '/v4/programas/b2/'
    }),
    nclc7Prep: '/v4/preparacion-tef-canada.html',
    nclc7Guide: '/v4/nclc-7.html',
    crsCalculator: '/v4/calculador.html',
    conditions: '/v4/condiciones.html',
    privacy: '/v4/privacidad.html',
    homePlans: '/v4/#planes',
    homeStories: '/v4/#historias'
  }),
  languages: Object.freeze({
    es: '/v4/',
    fr: '/v4/fr/',
    en: '/v4/en/',
    de: '/v4/de/'
  }),
  media: Object.freeze({
    logo: '/v4/assets/pathway-logo.svg',
    favicon: '/v4/assets/favicon.svg',
    tourLandscape: '/v4/assets/parcours-canada.png',
    teacherPortraits: Object.freeze([
      '/v4/assets/profesor-01-800.webp',
      '/v4/assets/profesor-02-800.webp'
    ]),
    videoAssetsBase: '/assets/videos/'
  }),
  contact: Object.freeze({
    email: 'contacto@pathway-languages.com',
    whatsapp: 'https://wa.me/51989887516',
    whatsappNumber: '+51 989 887 516'
  }),
  reviewsSource: 'https://www.superprof.pe/con-instituto-ensenanza-idiomas-pleno-desarrollo-dedico-ensenar-idioma-natal-desde-hace-anos-diplomado.html',
  // No se hallaron URLs reales de Instagram ni TikTok en el repositorio
  // (solo wa.me, superprof.pe y canada.ca). Se dejan nulas para que la UI
  // las omita y no inventar cuentas.
  social: Object.freeze({
    instagram: null,
    tiktok: null
  })
});
