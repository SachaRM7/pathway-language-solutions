// Campus tutorial for students: the screen is blurred except the zone being
// explained, which is framed and pulses; a card explains it in Spanish. It opens
// by itself on the first visit (once the home screen is shown) and can be
// replayed at any time with the "?" button of the top bar.
(() => {
  const KEY = 'campus-tour-v1';
  const $ = s => document.querySelector(s);
  const visible = el => el && el.getClientRects().length && el.getBoundingClientRect().width > 0;
  const pick = (...sels) => sels.map(s => [...document.querySelectorAll(s)]).flat().find(visible) || null;
  const tileWithTitle = text => [...document.querySelectorAll('#main .tile')].find(t => visible(t) && t.querySelector('h2')?.textContent.trim() === text) || null;
  const navLink = id => pick(`#sideNav a[href="#${id}"]`, `#tabbar a[href="#${id}"]`);
  const phone = () => innerWidth <= 720;

  // view: screen to show first; target: zone to frame; pad: margin around it.
  const ALL_STEPS = [
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
    { view: 'repasar', target: () => pick('#main .flash-wrap', '#main .view'), title: 'Tus repasos', text: 'Las palabras nuevas, los verbos y tus errores vuelven aquí, en tarjetas, hasta que los domines. Toca la tarjeta para ver la respuesta.' },
    { view: 'repasar', target: () => navLink('simulacros'), title: 'Simulacros', text: 'Exámenes de práctica como el TEF y el TCF. Entremos.', pad: 6 },
    { view: 'simulacros', target: () => pick('#main .exam-grid', '#main .view'), title: 'Tus simulacros', text: 'Cada prueba se hace como el día del examen, con el tiempo limitado. Al final ves tu nivel NCLC estimado.' },
    { view: 'simulacros', target: () => navLink('logros'), title: 'Logros', text: 'Tu nivel y tus insignias. Entremos.', pad: 6 },
    { view: 'logros', target: () => pick('#main .badges')?.closest('.tile') || pick('#main .badges', '#main .view'), title: 'Tus insignias', text: 'Cada insignia marca un paso real hacia tu examen: tu primera lección, tu racha, tus repasos…' },
    { view: 'logros', target: () => navLink('inicio'), title: 'Inicio', text: 'Para volver aquí desde cualquier pantalla.', pad: 6 },
    { view: 'inicio', target: () => pick('#main .search'), title: 'El buscador', text: 'Escribe una unidad o un verbo para encontrarlo al instante.', pad: 6, desktopOnly: true },
    { view: 'inicio', target: () => pick('[data-action="bell"]'), title: 'Tus avisos', text: 'Las tareas que te deja tu profesor y tus recordatorios. ¿Dónde está la tarea? Aquí.', pad: 6 },
    { view: 'inicio', target: () => pick('[data-action="tour"]'), title: 'Vuelve a verlo cuando quieras', text: 'Este botón repite el recorrido. ¡Ahora te toca a ti!', next: 'Terminar', pad: 6, last: true }
  ];

  let steps = ALL_STEPS, root, ring, card, shade, step = -1, target = null;
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
    addEventListener('scroll', place, true);
    document.addEventListener('keydown', e => {
      if (!root.classList.contains('is-on')) return;
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') card.querySelector('[data-tt="next"]')?.click();
      if (e.key === 'ArrowLeft' && step > 1) show(step - 1);
    });
  }

  function place() {
    if (!root || step < 0) return;
    const s = steps[step], W = innerWidth, H = innerHeight;
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
    const r = target.getBoundingClientRect();
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
      const r = target.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - (phone() ? 230 : 20)) { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); await wait(450); }
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
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* private mode: the tour may show again */ }
    if (location.hash.slice(1) !== 'inicio') location.hash = 'inicio';
  }

  function start() {
    if (!$('#lesson')?.hidden) return; // never over a lesson
    steps = phone() ? ALL_STEPS.filter(s => !s.desktopOnly) : ALL_STEPS;
    show(0);
  }

  window.CampusTour = { start };
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-action="tour"]')) return;
    e.preventDefault(); e.stopPropagation();
    start();
  }, true);
  // First visit: start once the student's home is on screen.
  let seen = false;
  try { seen = !!localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  if (!seen) waitFor(() => pick('#main .hero'), 60000).then(el => { if (el && step < 0) setTimeout(start, 700); });
})();
