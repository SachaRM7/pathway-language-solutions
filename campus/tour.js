// Campus tutorials, one per space (student, teacher, admin): the screen is blurred
// except the zone being explained, which is framed and pulses; a card explains it
// in Spanish. Each opens by itself the first time its screen is shown (the account
// remembers it, see window.CampusApp in app.js) and can be replayed with the "?"
// button of the top bar.
(() => {
  const $ = s => document.querySelector(s);
  const visible = el => el && el.getClientRects().length && el.getBoundingClientRect().width > 0;
  const pick = (...sels) => sels.map(s => [...document.querySelectorAll(s)]).flat().find(visible) || null;
  const tileWithTitle = text => [...document.querySelectorAll('#main .tile')].find(t => visible(t) && t.querySelector('h2')?.textContent.trim() === text) || null;
  const navLink = id => pick(`#sideNav a[href="#${id}"]`, `#tabbar a[href="#${id}"]`);
  const phone = () => innerWidth <= 720;

  // On a phone the conversation fills the screen: frame the writing box instead, so the card fits.
  const chatZone = () => phone() ? pick('#chatForm') : pick('#main .chat-tile');
  // Mensajes texts, shared by the full tours and the « Nuevo » tour below.
  const MSG_STUDENT = [
    'Tu conversación con tu profesor y el equipo Pathway. Entremos.',
    'Aquí hablas con tu profesor y el equipo Pathway. Si escribes una pregunta sobre tus clases, Zoom o tus ausencias, te respondemos aquí con los datos de tu curso; lo que decide tu profesor se lo pasamos a él.'
  ];
  const MSG_TEACHER = [
    'Las preguntas de tus alumnos, en un solo lugar en vez de WhatsApp. Entremos.',
    'El asistente prepara la respuesta a las preguntas prácticas, con los datos de cada alumno: según «Ajustes», sale sola o queda como borrador para que la envíes. Lo que no sabe o lo que decides tú (cambios de horario, justificativos, precios, nivel) queda arriba, en «Necesita respuesta», y te llega un correo. El alumno ve las respuestas firmadas «Equipo Pathway».'
  ];

  // view: screen to show first; target: zone to frame; pad: margin around it.
  const STUDENT = [
    { center: true, title: '¡Te damos la bienvenida a tu Campus!', text: 'En un minuto te mostramos dónde está cada cosa. Puedes volver a ver este recorrido cuando quieras con el botón «?» de la parte de arriba.', next: 'Empezar', skip: 'Ahora no' },
    { view: 'inicio', target: () => pick('#main .hero'), title: 'Tu lección del día', text: 'Aquí empieza tu práctica: la siguiente unidad de tu manual, con ejercicios de 20 a 30 minutos. Pulsa «Empezar la lección».' },
    { view: 'inicio', target: () => pick('#main .tile.butter'), title: 'Tu racha', text: 'Los días seguidos en los que cumples tu meta. Practica un poco cada día para mantenerla.' },
    { view: 'inicio', target: () => pick('#main .tile.lilac'), title: 'Tu meta de hoy', text: 'Los puntos (XP) que ganas hoy con tus lecciones y repasos.' },
    { view: 'inicio', target: () => tileWithTitle('Camino al NCLC 7'), title: 'Tu camino al NCLC 7', text: 'Tu avance en los niveles A1, A2, B1 y B2, hasta el NCLC 7 que necesitas para tu examen.' },
    { view: 'inicio', target: () => tileWithTitle('Tu semana'), title: 'Tu semana', text: 'Los puntos que ganaste cada día de esta semana. La barra de hoy está resaltada.' },
    { view: 'inicio', target: () => tileWithTitle('Próxima clase'), title: 'Tu próxima clase', text: 'El día y la hora de tu clase en vivo, con el botón para entrar. Siempre está aquí.' },
    { view: 'inicio', target: () => pick('#main .tile.mint'), title: 'El reto de la semana', text: 'Practica 5 días distintos esta semana y gana 50 XP extra.' },
    { view: 'inicio', target: () => navLink('ruta'), title: 'Mi ruta', text: 'Tu avance unidad por unidad. Entremos.', pad: 6 },
    { view: 'ruta', target: () => (!phone() && pick('#main .units')?.closest('.tile')) || pick('#main .units'), title: 'Tu avance', text: 'Todas las unidades de tu nivel: las superadas (✓), la que sigue y las que se abren después. ¿En qué voy? Aquí.' },
    { view: 'ruta', target: () => navLink('repasar'), title: 'Repasar', text: 'Tu zona de repaso. Entremos.', pad: 6 },
    { view: 'repasar', target: () => pick('#main .flash-wrap', '#main .face'), title: 'Tus repasos', text: 'Las palabras nuevas, los verbos y tus errores vuelven aquí, en tarjetas, hasta que los domines. Toca la tarjeta para ver la respuesta.' },
    { view: 'repasar', target: () => navLink('simulacros'), title: 'Simulacros', text: 'Exámenes de práctica como el TEF y el TCF. Entremos.', pad: 6 },
    { view: 'simulacros', target: () => pick('#main .exam-grid', '#main .view'), title: 'Tus simulacros', text: 'Cada prueba se hace como el día del examen, con el tiempo limitado. Al final ves tu nivel NCLC estimado.' },
    { view: 'simulacros', target: () => navLink('logros'), title: 'Logros', text: 'Tu nivel y tus insignias. Entremos.', pad: 6 },
    { view: 'logros', target: () => pick('#main .badges')?.closest('.tile') || pick('#main .badges', '#main .view'), title: 'Tus insignias', text: 'Cada insignia marca un paso real hacia tu examen: tu primera lección, tu racha, tus repasos…' },
    // Mensajes (db/025_mensajes.sql): skipped when the tab is not there.
    { view: 'logros', target: () => navLink('mensajes'), title: 'Mensajes', text: MSG_STUDENT[0], pad: 6 },
    { view: 'mensajes', target: chatZone, title: 'Tus mensajes', text: MSG_STUDENT[1] },
    { target: () => navLink('inicio'), title: 'Inicio', text: 'Para volver aquí desde cualquier pantalla.', pad: 6 },
    { view: 'inicio', target: () => pick('#main .search'), title: 'El buscador', text: 'Escribe una unidad o un verbo para encontrarlo al instante.', pad: 6, desktopOnly: true },
    { view: 'inicio', target: () => pick('[data-action="bell"]'), title: 'Tus avisos', text: 'Las tareas que te deja tu profesor, sus respuestas en «Mensajes» y tus recordatorios. ¿Dónde está la tarea? Aquí.', pad: 6 },
    { view: 'inicio', target: () => pick('[data-action="tour"]'), title: 'Vuelve a verlo cuando quieras', text: 'Este botón repite el recorrido. ¡Ahora te toca a ti!', next: 'Terminar', pad: 6, last: true }
  ];
  STUDENT.home = 'inicio';

  const TEACHER = [
    { center: true, title: 'Tu espacio de profesor', text: 'En un minuto te mostramos cómo seguir a tus alumnos entre clases. Puedes volver a ver este recorrido con el botón «?» de la parte de arriba.', next: 'Empezar', skip: 'Ahora no' },
    { view: 'panel', target: () => { const k = [...document.querySelectorAll('#main .tile.kpi')].filter(visible); return k.length ? k : null; }, title: 'Tu grupo de un vistazo', text: 'Alumnos activos esta semana, tareas pendientes y porcentaje de aciertos a la primera.' },
    { view: 'panel', target: () => tileWithTitle('Necesitan atención'), title: 'Necesitan atención', text: 'Los alumnos que no practican desde hace días o que fallan mucho. «Asignar tarea» te lleva directo a la pestaña Tareas.' },
    { view: 'panel', target: () => tileWithTitle('Por revisar'), title: 'Por revisar', text: 'Lo que espera algo de ti: mensajes por responder, informes de clase, justificativos, exámenes por validar… Cada línea te lleva a la pestaña donde se resuelve. Si eres administración, la última línea abre el espacio Admin.' },
    { view: 'panel', target: () => navLink('alumnos'), title: 'Alumnos', text: 'El avance de cada alumno. Entremos.', pad: 6 },
    { view: 'alumnos', target: () => tileWithTitle('Avance'), title: 'El avance de tus alumnos', text: 'Nivel, racha, última actividad, aciertos y tareas de cada alumno.' },
    { view: 'alumnos', target: () => tileWithTitle('Fin de nivel'), title: 'Fin de nivel', text: 'Valida aquí el examen que el alumno hizo contigo: con el examen final del campus, pasa solo al nivel siguiente.' },
    // Mensajes (db/025_mensajes.sql): skipped when the tab is not there.
    { view: 'alumnos', target: () => navLink('mensajes'), title: 'Mensajes', text: MSG_TEACHER[0], pad: 6 },
    { view: 'mensajes', target: () => pick('#main .msg-list-tile'), title: 'Mensajes de tus alumnos', text: MSG_TEACHER[1] },
    { view: 'mensajes', target: () => navLink('tareas'), title: 'Tareas', text: 'Lo que tus alumnos practican entre dos clases. Entremos.', pad: 6 },
    { view: 'tareas', target: () => tileWithTitle('Asignar una tarea'), title: 'Asignar una tarea', text: 'Elige una unidad y una fecha: el alumno la ve en su inicio y en sus avisos.' },
    { view: 'tareas', target: () => tileWithTitle('Anotar un error de la clase'), title: 'Anotar un error de la clase', text: 'Un error que oyes en clase se convierte en una tarjeta en la zona «Repasar» del alumno.' },
    { view: 'tareas', target: () => navLink('horarios'), title: 'Horarios', text: 'Tus grupos y sus clases fijas. Entremos.', pad: 6 },
    { view: 'horarios', target: () => tileWithTitle('Solicitar un cambio') || tileWithTitle('Mover o cancelar una clase'), title: 'Mover o cancelar una clase', text: 'El horario es fijo: si una clase no puede tener lugar, pide aquí el cambio. Si eres administración, se aplica al instante.' },
    // Contenido and Cuentas: in the Profesor space only for teachers who are not admins.
    { view: 'horarios', target: () => navLink('contenido'), title: 'Contenido', text: 'Las unidades y sus ejercicios, nivel por nivel. Entremos.', pad: 6, admin: false },
    { view: 'contenido', target: () => pick('#main .seg-tabs'), title: 'Un nivel a la vez', text: 'Elige el nivel: ves cuántas unidades están publicadas en cada uno.', pad: 6, admin: false },
    { view: 'contenido', target: () => pick('#main .unit-row'), title: 'Tus unidades', text: 'Cada unidad con su estado: «Probar» como un alumno (no se guarda nada).', admin: false },
    { view: 'contenido', target: () => navLink('cuentas'), title: 'Cuentas', text: 'Para invitar a tus alumnos al campus. Entremos.', pad: 6, admin: false },
    { view: 'cuentas', target: () => tileWithTitle('Invitar a un alumno'), title: 'Invitar a un alumno', text: 'Por correo: su nombre, su nivel y su profesor quedan configurados antes de que entre.', admin: false },
    { target: () => pick('#main .switch'), title: 'Tus espacios', text: 'Alumno: el Campus como lo ven tus alumnos. Profesor: tus clases y tus alumnos. Admin (solo administración): los interesados, las inscripciones, los grupos y los ajustes. El Campus recuerda el último que usaste.', pad: 6 },
    { target: () => pick('[data-action="bell"]'), title: 'Tus avisos', text: 'Los mensajes que necesitan respuesta, los alumnos inactivos y, si eres administración, lo que espera en el espacio Admin.', pad: 6 },
    { target: () => pick('[data-action="tour"]'), title: 'Vuelve a verlo cuando quieras', text: 'Este botón repite el recorrido.', next: 'Terminar', pad: 6, last: true }
  ];
  TEACHER.home = 'panel';

  // Admin space: what waits, where it is handled, who did what.
  const ADMIN = [
    { center: true, title: 'Tu espacio de administración', text: 'Aquí está todo lo que no es dar clase: los interesados, las inscripciones, los grupos y los horarios, el programa y los ajustes. En un minuto te mostramos cómo saber qué hacer cada día.', next: 'Empezar', skip: 'Ahora no' },
    { view: 'bandeja', target: () => { const k = [...document.querySelectorAll('#main .bq-kpi')].filter(visible); return k.length ? k : null; }, title: 'De un vistazo', text: 'Lo urgente, lo que queda por hacer y lo que el equipo ya hizo estos 7 días. Si «Urgente» está en cero, puedes respirar.' },
    { view: 'bandeja', target: () => pick('#main #bqUrgent', '#main #bqTodo', '#main .bq-clear'), title: 'Una línea, una tarea', text: 'Cada línea dice qué hacer y para quién. El botón de la derecha te lleva directo al lugar donde se hace. Cuando está hecho, la línea desaparece sola.' },
    { view: 'bandeja', target: () => pick('#main #bqDone'), title: 'Lo que ya se hizo', text: 'Quién hizo qué estos últimos días: así nadie responde dos veces a la misma persona.' },
    { view: 'bandeja', target: () => navLink('prospectos'), title: 'Captación', text: 'Las personas interesadas en Pathway. Entremos.', pad: 6 },
    { view: 'prospectos', target: () => pick('#main .crm-sub'), title: 'Tres secciones', text: 'Prospectos: las fichas, del primer contacto a la inscripción. WhatsApp: las conversaciones. Difusión: los blogs y medios que pueden hablar de Pathway.', pad: 6 },
    { view: 'prospectos', target: () => navLink('cuentas'), title: 'Inscripciones', text: 'Las solicitudes que llegan del sitio, las invitaciones al Campus y las cuentas. Entremos.', pad: 6 },
    { view: 'cuentas', target: () => tileWithTitle('Solicitudes de inscripción'), title: 'Solicitudes de inscripción', text: 'Cada persona que envió el formulario del sitio. «Invitar» prepara su invitación al Campus; «Marcar como atendida» la quita de la lista.' },
    { view: 'cuentas', target: () => tileWithTitle('Miembros'), title: 'Cuentas', text: 'Cambia el nombre, el nivel, el profesor o la fórmula de una cuenta.' },
    { view: 'cuentas', target: () => navLink('horarios'), title: 'Clases', text: 'Los grupos de todos los profesores, sus horarios y los cambios por validar. Entremos.', pad: 6 },
    { view: 'horarios', target: () => tileWithTitle('Cambios por validar') || tileWithTitle('Alumnos sin grupo') || tileWithTitle('Nuevo grupo'), title: 'Lo que se decide aquí', text: 'Cuando un profesor pide mover o cancelar una clase, aparece aquí con «Aprobar» y «Rechazar». Un alumno sin grupo no tiene horario: ponlo en un grupo.' },
    { view: 'horarios', target: () => tileWithTitle('Nuevo grupo'), title: 'Nuevo grupo', text: 'Un grupo por horario: su nivel, su profesor, sus días y horas, el enlace de Zoom y sus alumnos. Una clase privada es un grupo de un alumno.' },
    { view: 'horarios', target: () => navLink('contenido'), title: 'Programa', text: 'Las unidades del manual y los documentos del programa, nivel por nivel.', pad: 6 },
    { target: () => navLink('ajustes'), title: 'Ajustes', text: 'Las reglas del campus: asistencia, contrato, correos automáticos y accesos de los asistentes IA. Se tocan poco.', pad: 6 },
    { target: () => pick('#main .switch'), title: 'Cambiar de espacio', text: 'Profesor para tus clases y tus alumnos, Alumno para ver el Campus como ellos. Un punto rojo en «Admin» avisa cuando algo urgente espera aquí.', pad: 6 },
    { target: () => pick('[data-action="bell"]'), title: 'Tus avisos', text: 'Las mismas tareas que la bandeja, en corto, desde cualquier pantalla.', pad: 6 },
    { target: () => pick('[data-action="tour"]'), title: 'Vuelve a verlo cuando quieras', text: 'Este botón repite el recorrido.', next: 'Terminar', pad: 6, last: true }
  ];
  ADMIN.home = 'bandeja';

  // « Nuevo »: a short tour of a tab added after an account already saw its full tour.
  // Shown once (remembered like the tours), only when the tab is there.
  const NEWS = {
    'student-mensajes': [
      { center: true, title: 'Nuevo: Mensajes', text: 'Una nueva pestaña en tu Campus. Te la mostramos en unos segundos.', next: 'Ver', skip: 'Ahora no' },
      { target: () => navLink('mensajes'), title: 'Mensajes', text: MSG_STUDENT[0], pad: 6 },
      { view: 'mensajes', target: chatZone, title: 'Tus mensajes', text: MSG_STUDENT[1], next: 'Entendido', last: true }
    ],
    'teacher-mensajes': [
      { center: true, title: 'Nuevo: Mensajes', text: 'Una nueva pestaña en tu Campus. Te la mostramos en unos segundos.', next: 'Ver', skip: 'Ahora no' },
      { target: () => navLink('mensajes'), title: 'Mensajes', text: MSG_TEACHER[0], pad: 6 },
      { view: 'mensajes', target: () => pick('#main .msg-list-tile'), title: 'Mensajes de tus alumnos', text: MSG_TEACHER[1], next: 'Entendido', last: true }
    ]
  };

  const TOURS = { student: STUDENT, teacher: TEACHER, admin: ADMIN };
  let steps = STUDENT, tour = 'student', root, ring, card, shade, step = -1, target = null;
  const R = 18;
  // The blurred shade covers the screen except a rounded window on the zone
  // (even-odd path); the path keeps the same structure, so it animates between steps.
  const hole = (W, H, x, y, x2, y2) => `path(evenodd, 'M0 0H${W}V${H}H0Z M${x + R} ${y}H${x2 - R}A${R} ${R} 0 0 1 ${x2} ${y + R}V${y2 - R}A${R} ${R} 0 0 1 ${x2 - R} ${y2}H${x + R}A${R} ${R} 0 0 1 ${x} ${y2 - R}V${y + R}A${R} ${R} 0 0 1 ${x + R} ${y}Z')`;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function waitFor(fn, ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const el = fn(); if (el) return el; await wait(60); }
    return null;
  }

  function build() {
    root = document.createElement('div');
    root.className = 'tt-root';
    root.innerHTML = '<div class="tt-shade"></div><div class="tt-ring" aria-hidden="true"></div><div class="tt-card" role="dialog" aria-modal="true" aria-labelledby="ttTitle"></div>';
    document.body.append(root);
    shade = root.querySelector('.tt-shade');
    ring = root.querySelector('.tt-ring');
    card = root.querySelector('.tt-card');
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-tt]');
      if (!b) return;
      if (b.dataset.tt === 'next') steps[step].last ? finish() : show(step + 1);
      if (b.dataset.tt === 'prev') show(step - 1);
      if (b.dataset.tt === 'skip') finish();
    });
    addEventListener('resize', place);
    // Redraws of the screen under the tour (a list that finishes loading…).
    let queued = false;
    new MutationObserver(() => {
      if (queued || step < 0) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; place(); });
    }).observe(document.getElementById('main'), { childList: true, subtree: true });
    addEventListener('scroll', place, true);
    document.addEventListener('keydown', e => {
      if (!root.classList.contains('is-on')) return;
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') card.querySelector('[data-tt="next"]')?.click();
      if (e.key === 'ArrowLeft' && step > 1) show(step - 1);
    });
  }

  // A step can frame several elements (an array): their bounding box.
  const box = t => {
    const rs = (Array.isArray(t) ? t : [t]).map(el => el.getBoundingClientRect());
    return { left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)) };
  };
  const attached = t => t && (Array.isArray(t) ? t.every(el => el.isConnected) : t.isConnected);
  function place() {
    if (!root || step < 0) return;
    const s = steps[step], W = innerWidth, H = innerHeight;
    // The screen may have been redrawn (data loaded): frame the new element.
    if (!s.center && target && !attached(target)) target = s.target() || target;
    if (s.center || !target) {
      shade.style.clipPath = hole(W, H, W / 2 - R, H / 2 - R, W / 2 + R, H / 2 + R); // closed down behind the card
      ring.style.display = 'none';
      card.classList.add('is-center');
      card.classList.remove('is-top');
      card.style.cssText = '';
      return;
    }
    card.classList.remove('is-center');
    const pad = s.pad ?? 10;
    const r = box(target);
    const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad), x2 = Math.min(W, r.right + pad), y2 = Math.min(H, r.bottom + pad);
    shade.style.clipPath = hole(W, H, x, y, x2, y2);
    ring.style.cssText = `display:block;left:${x}px;top:${y}px;width:${x2 - x}px;height:${y2 - y}px`;
    if (phone()) {
      // Bottom sheet on phones; at the top when the zone is in the lower part (the tab bar).
      card.style.cssText = '';
      card.classList.toggle('is-top', y2 > H - card.offsetHeight - 40);
      return;
    }
    const cw = Math.min(360, W - 32), ch = card.offsetHeight;
    let cx, cy;
    if (W - x2 >= cw + 24) { cx = x2 + 16; cy = Math.min(Math.max(16, y), H - ch - 16); }
    else if (x >= cw + 24) { cx = x - cw - 16; cy = Math.min(Math.max(16, y), H - ch - 16); }
    else if (H - y2 >= ch + 24) { cx = Math.min(Math.max(16, x), W - cw - 16); cy = y2 + 16; }
    else { cx = Math.min(Math.max(16, x), W - cw - 16); cy = Math.max(16, y - ch - 16); }
    card.style.cssText = `left:${cx}px;top:${cy}px;width:${cw}px`;
  }

  async function show(k) {
    if (!root) build();
    const from = step;
    step = k;
    const s = steps[k];
    root.classList.add('is-on');
    if (s.view && location.hash.slice(1) !== s.view) { location.hash = s.view; await wait(250); }
    target = s.center ? null : await waitFor(s.target, 1500);
    // A zone that is not on screen: skip the step in the direction of travel.
    if (!s.center && !target && !s.last) return show(k + (k >= from ? 1 : -1));
    if (target) {
      const r = box(target), first = Array.isArray(target) ? target[0] : target;
      if (r.top < 70 || r.bottom > innerHeight - (phone() ? 230 : 20)) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); await wait(450); }
    }
    const total = steps.length - 1;
    card.innerHTML = `${s.center ? '<div class="tt-badge" aria-hidden="true">?</div>' : `<p class="tt-count">${k} / ${total}</p>`}
      <h2 id="ttTitle">${s.title}</h2><p class="tt-text">${s.text}</p>
      <div class="tt-actions">${s.skip ? `<button type="button" class="tt-link" data-tt="skip">${s.skip}</button>` : k > 1 ? '<button type="button" class="tt-btn light" data-tt="prev">Atrás</button>' : ''}
        <button type="button" class="tt-btn dark" data-tt="next">${s.next || 'Siguiente'}${s.last ? '' : ' →'}</button></div>
      ${!s.center && !s.last ? '<button type="button" class="tt-close" data-tt="skip" aria-label="Salir del recorrido">✕</button>' : ''}`;
    card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in');
    ring.classList.remove('is-in'); void ring.offsetWidth; ring.classList.add('is-in');
    place();
    card.querySelector('[data-tt="next"]').focus({ preventScroll: true });
  }

  function finish() {
    root.classList.remove('is-on');
    step = -1;
    window.CampusApp?.markSeen(tour);
    if (location.hash.slice(1) !== steps.home) location.hash = steps.home;
  }

  function start(news) {
    if (!$('#lesson')?.hidden) return; // never over a lesson
    const mode = window.CampusApp?.mode() || 'student';
    tour = news || mode;
    const all = news ? NEWS[news] : TOURS[mode] || STUDENT;
    if (news) all.home = (TOURS[mode] || STUDENT).home;
    const admin = !!window.CampusApp?.admin?.();
    steps = all.filter(s => !(phone() && s.desktopOnly) && (s.admin === undefined || s.admin === admin));
    steps.home = all.home;
    show(0);
  }

  window.CampusTour = { start };
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-action="tour"]')) return;
    e.preventDefault(); e.stopPropagation();
    start();
  }, true);
  // First time a mode's home screen is shown: open its tour once.
  let pending = 0;
  document.addEventListener('campus:render', e => {
    const app = window.CampusApp;
    if (!app || step >= 0 || pending) return;
    const mode = app.mode(), home = (TOURS[mode] || STUDENT).home;
    if (e.detail.view !== home) return;
    if (!app.seen(mode)) {
      pending = setTimeout(() => { pending = 0; if (step < 0 && app.mode() === mode && !app.seen(mode)) start(); }, 700);
      return;
    }
    // Full tour already seen: show what is new since, once.
    const news = Object.keys(NEWS).find(k => k.startsWith(mode + '-') && !app.seen(k));
    if (!news || !navLink(news.slice(mode.length + 1))) return;
    pending = setTimeout(() => { pending = 0; if (step < 0 && app.mode() === mode && !app.seen(news) && navLink(news.slice(mode.length + 1))) start(news); }, 700);
  });
})();
