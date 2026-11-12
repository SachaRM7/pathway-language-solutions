// Sources: existing Spanish #planes/#historias, inscription.html and pathway-v3.js.
// Keep the full-cycle calculations together so the monthly and cycle views agree.
//
// Fuentes:
// - Tarifas y ritmos: index.html sección #planes y inscription.html (radios "plan"/"billing").
// - Testimonios en video: pathway-v3.js (testimonialVideos).
// - Testimonios escritos: index.html sección #historias (16 opiniones condensadas).
// - Enlaces: rutas /v4/ reales del espejo; redes sociales aún no documentadas.
//
// Los importes de ciclo se derivan del mensual y no se codifican a mano:
//   original = mensual * meses ; amount = original * (1 - 0,15) ; saving = original - amount.

const CAD = 'CAD';
const CYCLE_DISCOUNT_RATE = 0.15;
const MONTHLY_AMOUNTS = Object.freeze({ essential: 185, accelerated: 370, intensive: 555 });

/** Redondeo a 2 decimales para los importes derivados. */
const round2 = value => Math.round(value * 100) / 100;

/** Importe de ciclo derivado del precio mensual validado y del descuento del 15 %. */
const cycleFromMonthly = (monthly, months) => {
  const originalAmount = round2(monthly * months);
  const amount = round2(originalAmount * (1 - CYCLE_DISCOUNT_RATE));
  return Object.freeze({
    amount,
    originalAmount,
    saving: round2(originalAmount - amount),
    currency: CAD,
    months,
    equivalentPerMonth: round2(amount / months)
  });
};

/**
 * Tres ritmos de referencia de #planes.
 * monthly.amount y cycle.amount son la interfaz estable que consume la home.
 */
export const PRICING = Object.freeze({
  currency: CAD,
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
    note: 'Un ciclo corresponde al trabajo previsto para dominar un nivel del CECRL (A1, A2, B1, B2…), según el nivel de partida acreditado y el ritmo elegido.',
    perLevels: Object.freeze(['A1', 'A2', 'B1', 'B2'])
  }),
  plans: Object.freeze([
    Object.freeze({
      id: 'essential',
      enrollmentRhythmId: 'Esencial',
      name: 'Esencial',
      tag: 'Más de 18 meses',
      featured: false,
      tone: 'outline',
      monthly: Object.freeze({
        amount: MONTHLY_AMOUNTS.essential,
        currency: CAD,
        hoursPerMonth: 8,
        hoursPerWeek: 2,
        hoursLabel: '8 horas al mes · 2 h/semana'
      }),
      cycle: Object.freeze({ ...cycleFromMonthly(MONTHLY_AMOUNTS.essential, 6), hoursPerWeek: 2, referenceHours: '2 h/semana' }),
      includes: Object.freeze([
        'Clases privadas en vivo',
        'Cuaderno y seguimiento',
        'Talleres prácticos',
        '2 simulacros TEF / TCF'
      ])
    }),
    Object.freeze({
      id: 'accelerated',
      enrollmentRhythmId: 'Acelerado',
      name: 'Acelerado',
      tag: 'El más elegido',
      featured: true,
      tone: 'coral',
      monthly: Object.freeze({
        amount: MONTHLY_AMOUNTS.accelerated,
        currency: CAD,
        hoursPerMonth: 16,
        hoursPerWeek: 4,
        hoursLabel: '16 horas al mes · 4 h/semana'
      }),
      cycle: Object.freeze({ ...cycleFromMonthly(MONTHLY_AMOUNTS.accelerated, 5), hoursPerWeek: 4, referenceHours: '4 h/semana' }),
      includes: Object.freeze([
        'Compatible con trabajo a tiempo completo',
        'Clases privadas en vivo',
        'Cuaderno, seguimiento y talleres',
        '2 simulacros TEF / TCF'
      ])
    }),
    Object.freeze({
      id: 'intensive',
      enrollmentRhythmId: 'Intensivo',
      name: 'Intensivo',
      tag: 'Menos de 12 meses',
      featured: false,
      tone: 'outline',
      monthly: Object.freeze({
        amount: MONTHLY_AMOUNTS.intensive,
        currency: CAD,
        hoursPerMonth: 24,
        hoursPerWeek: 6,
        hoursLabel: '24 horas al mes · 6 h/semana'
      }),
      cycle: Object.freeze({ ...cycleFromMonthly(MONTHLY_AMOUNTS.intensive, 4), hoursPerWeek: 6, referenceHours: '6 h/semana' }),
      includes: Object.freeze([
        'Ritmo de avance prioritario',
        'Clases privadas en vivo',
        'Cuaderno, seguimiento y talleres',
        '2 simulacros TEF / TCF'
      ])
    })
  ]),
  billingOptions: Object.freeze([
    Object.freeze({ id: 'Mensual', label: 'Mensual', note: 'Mes a mes, sin permanencia' }),
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

/** Dieciséis opiniones escritas condensadas (index.html #historias). */
export const WRITTEN_TESTIMONIALS = Object.freeze([
  Object.freeze({ name: 'Oscar', quote: 'Con Pathway, las explicaciones claras y las clases dinámicas hacen que el francés resulte fácil de entender.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Maximiliano', quote: 'Diálogos en francés, tareas entre clases y apoyo constante para mejorar la pronunciación.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Carol', quote: 'Paciencia, excelente metodología y un compromiso real con el progreso de cada alumno.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'Cris', quote: 'Al empezar desde cero, Pathway me acompañó, me hizo participar y se aseguró de que todos avanzáramos.', source: 'Opinión condensada' }),
  Object.freeze({ name: 'La', quote: 'Clases amenas y participativas que enriquecen el vocabulario al escuchar distintas formas de expresarse.', source: 'Opinión condensada' }),
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
      '/v4/assets/profesor-01.jpg',
      '/v4/assets/profesor-02.jpg'
    ]),
    videoAssetsBase: '/assets/videos/'
  }),
  contact: Object.freeze({
    email: 'contact@pathway-languages.com',
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
