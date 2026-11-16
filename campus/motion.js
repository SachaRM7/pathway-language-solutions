// Vanilla adaptations of Bencho's MIT blocks (Lorenzo Cabra, 2026).
// Source revisions and licence: vendor/BENCHO-LICENSE.txt. No React/runtime dependency.
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const numberFormat = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });

// Same frame-normalised integrator as Seek/Checklist. Stops at rest, follows changes
// to reduced motion, and is explicitly disposed when the Campus replaces a view.
export function spring(initial, paint, tune = 50) {
  let at = initial, target = initial, velocity = 0, frame = 0, previous = 0;
  const k = .08 + tune / 100 * .16, decay = .62 + tune / 100 * .2;
  function snap() {
    cancelAnimationFrame(frame); frame = 0;
    at = target; velocity = 0; paint(at);
  }
  function tick(time) {
    const dt = previous ? clamp((time - previous) / 16.67, 0, 2.5) : 1;
    previous = time;
    velocity += (target - at) * k * dt;
    velocity *= Math.pow(decay, dt);
    at += velocity * dt;
    if (Math.abs(target - at) < .02 && Math.abs(velocity) < .02) return snap();
    paint(at); frame = requestAnimationFrame(tick);
  }
  const preference = () => { if (reducedMotion.matches) snap(); };
  reducedMotion.addEventListener('change', preference);
  paint(at);
  return {
    to(value) {
      target = value;
      cancelAnimationFrame(frame); previous = 0;
      if (reducedMotion.matches) snap();
      else frame = requestAnimationFrame(tick);
    },
    dispose() { cancelAnimationFrame(frame); reducedMotion.removeEventListener('change', preference); }
  };
}

// One persistent selection pill follows the native hash links. The clipped icon
// rail keeps every icon readable while the pill passes under it, in both themes.
export function mountTabbar(nav) {
  const pill = document.createElement('span');
  pill.className = 'tabbar-indicator'; pill.hidden = true;
  pill.setAttribute('aria-hidden', 'true');
  const rail = document.createElement('span');
  rail.className = 'tabbar-indicator-icons'; pill.append(rail); nav.prepend(pill);
  let mover = null, selected = '', signature = '', pops = [], minX = 0, maxX = 0;
  const stopPop = () => { pops.forEach(a => a.cancel()); pops = []; };
  const paint = x => nav.style.setProperty('--tab-x', `${clamp(x, minX, maxX).toFixed(3)}px`);
  function align(animate = false) {
    const active = nav.querySelector('a[aria-current="page"]');
    if (!active || !nav.getClientRects().length) {
      mover?.dispose(); mover = null; pill.hidden = true;
      nav.removeAttribute('data-tab-motion'); stopPop(); return;
    }
    const box = nav.getBoundingClientRect(), target = active.getBoundingClientRect();
    const style = getComputedStyle(nav), left = parseFloat(style.paddingLeft), right = parseFloat(style.paddingRight);
    minX = left; maxX = box.width - right - target.width;
    nav.style.setProperty('--tab-width', `${target.width}px`);
    nav.style.setProperty('--tab-inset', `${left}px`);
    nav.style.setProperty('--tab-rail-width', `${nav.clientWidth - left - right}px`);
    const x = target.left - box.left;
    if (animate && mover) mover.to(x);
    else { mover?.dispose(); mover = spring(x, paint, 25); }
    pill.hidden = false; nav.dataset.tabMotion = 'ready';
  }
  const resize = new ResizeObserver(() => align());
  resize.observe(nav);
  const preference = () => { if (reducedMotion.matches) { stopPop(); align(); } };
  reducedMotion.addEventListener('change', preference);
  return {
    update(html, context) {
      const template = document.createElement('template'); template.innerHTML = html;
      const incoming = [...template.content.querySelectorAll('a')];
      const nextSignature = `${context}:${incoming.map(a => a.getAttribute('href')).join('|')}`;
      const nextSelected = incoming.find(a => a.hasAttribute('aria-current'))?.getAttribute('href') || '';
      const changed = nextSelected !== selected, rebuilt = nextSignature !== signature;
      const links = new Map([...nav.querySelectorAll('a')].map(a => [a.getAttribute('href'), a]));
      if (changed || rebuilt) stopPop();
      incoming.forEach((fresh, i) => {
        const href = fresh.getAttribute('href'), link = links.get(href) || fresh;
        links.delete(href);
        link.setAttribute('aria-label', fresh.getAttribute('aria-label'));
        if (fresh.hasAttribute('aria-current')) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
        if (link.innerHTML !== fresh.innerHTML) link.innerHTML = fresh.innerHTML;
        // Leave existing links in place: replacing the nav would lose keyboard focus.
        if (nav.children[i + 1] !== link) nav.insertBefore(link, nav.children[i + 1] || null);
      });
      links.forEach(link => link.remove());
      if (rebuilt) rail.replaceChildren(...incoming.map(a => {
        const cell = document.createElement('span');
        cell.append(a.querySelector('.icon').cloneNode(true)); return cell;
      }));
      const animate = changed && !rebuilt && !reducedMotion.matches && !!mover;
      if (changed || rebuilt || !mover) align(animate);
      if (animate && !pill.hidden && Element.prototype.animate) {
        const index = incoming.findIndex(a => a.hasAttribute('aria-current'));
        const icons = [nav.querySelector('a[aria-current="page"] .icon'), rail.children[index]?.firstElementChild];
        pops = icons.filter(Boolean).map(el => el.animate([
          { transform: 'scale(.88)' }, { transform: 'scale(1.08)', offset: .55 }, { transform: 'scale(1)' }
        ], { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' }));
      }
      selected = nextSelected; signature = nextSignature;
    },
    reset() {
      stopPop(); mover?.dispose(); mover = null; selected = ''; signature = '';
      pill.hidden = true; nav.removeAttribute('data-tab-motion');
    },
    dispose() { this.reset(); resize.disconnect(); reducedMotion.removeEventListener('change', preference); }
  };
}

export function searchMarkup(value = '') {
  const open = !!value;
  return `<div class="menu-wrap campus-search" role="search" aria-label="Buscar en el campus">
    <div class="seek" data-open="${open}">
      <div class="seek-skin">
        <svg class="seek-lens" viewBox="0 0 18 18" aria-hidden="true"><circle cx="7.6" cy="7.6" r="5.4"/><path d="M11.6 11.6 L15.4 15.4"/></svg>
        <input class="seek-field" id="campusSearch" type="search" autocomplete="off" placeholder="Buscar una unidad, un verbo…" aria-label="Buscar una unidad o un verbo" aria-controls="searchSlot" value="${escapeHTML(value)}" tabindex="${open ? 0 : -1}">
        <button class="seek-hit" type="button" aria-label="Abrir búsqueda" aria-controls="campusSearch" aria-expanded="${open}" ${open ? 'hidden' : ''}></button>
      </div>
    </div><div id="searchSlot" aria-label="Resultados de búsqueda"></div>
  </div>`;
}

export function mountSearch(root, onSearch) {
  const wrap = root.querySelector('.campus-search');
  if (!wrap) return () => {};
  const el = wrap.querySelector('.seek'), field = wrap.querySelector('input');
  const button = wrap.querySelector('.seek-hit'), results = wrap.querySelector('#searchSlot');
  const abort = new AbortController(), options = { signal: abort.signal };
  let open = !!field.value, beat = 0, rest = 0, pointerFrame = 0;
  const span = () => Math.min(240, el.clientWidth - 26);
  const width = spring(open ? span() : 48, w => {
    const p = clamp((w - 48) / Math.max(1, span() - 48), 0, 1);
    el.style.setProperty('--seek-w', `${w.toFixed(2)}px`);
    el.style.setProperty('--seek-say', clamp((p - .55) / .45, 0, 1).toFixed(3));
  }, 20);
  function close(clear = false, focus = false) {
    clearTimeout(beat);
    el.dataset.press = 'false';
    results.replaceChildren();
    if (clear) { field.value = ''; onSearch(''); }
    if (field.value.trim()) return;
    open = false; el.dataset.open = 'false';
    field.tabIndex = -1; button.hidden = false; button.setAttribute('aria-expanded', 'false');
    width.to(48);
    if (focus) button.focus({ preventScroll: true });
  }
  function start() {
    if (open) return;
    open = true;
    el.dataset.press = 'true';
    field.tabIndex = 0;
    // Focus in the actual gesture: iOS otherwise suppresses the software keyboard.
    // Move it before hiding the button, otherwise focusout can close the control.
    field.focus({ preventScroll: true });
    button.hidden = true; button.setAttribute('aria-expanded', 'true');
    clearTimeout(beat);
    beat = setTimeout(() => {
      el.dataset.press = 'false'; el.dataset.open = 'true';
      width.to(span());
    }, reducedMotion.matches ? 0 : 90);
  }
  button.addEventListener('click', start, options);
  field.addEventListener('focus', () => { if (field.value) onSearch(field.value); }, options);
  field.addEventListener('input', () => {
    el.dataset.busy = 'true'; clearTimeout(rest);
    rest = setTimeout(() => { el.dataset.busy = 'false'; }, 340);
    onSearch(field.value);
  }, options);
  // A tap on a result: on iOS the button does not take the focus, so the field loses it to
  // nothing and the results would close before the click. Keep them open during the tap.
  let pressing = false;
  results.addEventListener('pointerdown', () => { pressing = true; }, options);
  const release = () => setTimeout(() => { pressing = false; }, 400);
  results.addEventListener('pointerup', release, options);
  results.addEventListener('pointercancel', release, options);
  wrap.addEventListener('focusout', event => { if (!pressing && !wrap.contains(event.relatedTarget)) close(); }, options);
  wrap.addEventListener('keydown', event => {
    // Search results may contain buttons: their keys must not reach the review
    // player's Space / 1–4 shortcuts behind the search panel.
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true, true); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const buttons = [...results.querySelectorAll('button')];
      if (!buttons.length) return;
      event.preventDefault(); event.stopPropagation();
      const i = buttons.indexOf(document.activeElement);
      const next = i < 0 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (i + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }
    if (event.key === 'Enter' && event.target === field) {
      event.preventDefault(); event.stopPropagation(); results.querySelector('button')?.click();
    }
  }, options);
  document.addEventListener('pointerdown', event => { if (!wrap.contains(event.target)) close(); }, options);
  // Bencho's magnet uses the unmoving frame, never the moving skin.
  document.addEventListener('pointermove', event => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      let x = 0, y = 0;
      if (!open && !reducedMotion.matches && event.pointerType !== 'touch') {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2), dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < 110) {
          const pull = (1 - distance / 110) ** 1.4 * 4.5;
          x = dx / (distance || 1) * pull; y = dy / (distance || 1) * pull;
        }
      }
      el.style.setProperty('--seek-x', `${x.toFixed(2)}px`); el.style.setProperty('--seek-y', `${y.toFixed(2)}px`);
    });
  }, options);
  const resize = new ResizeObserver(() => { if (open) width.to(span()); });
  resize.observe(el);
  return () => { abort.abort(); resize.disconnect(); width.dispose(); clearTimeout(beat); clearTimeout(rest); cancelAnimationFrame(pointerFrame); };
}

// Display only: the server still owns the XP. Digits use the same whole-column
// targets, modulo strip, 45 ms carry, spring and velocity blur as Counter.tsx.
export function rollNumber(el, value, { from = value, prefix = '' } = {}) {
  const to = Math.max(0, Math.round(Number(value) || 0));
  from = Math.max(0, Math.round(Number(from) || 0));
  const places = String(Math.max(from, to)).length;
  el.classList.add('rolling-number');
  el.innerHTML = `<span class="motion-sr">${escapeHTML(prefix + numberFormat.format(to))}</span><span class="roll-prefix" aria-hidden="true">${escapeHTML(prefix)}</span><span class="roll-digits" aria-hidden="true">${Array.from({ length: places }, (_, i) => {
    const p = places - 1 - i;
    return `<span class="roll-col" data-place="${p}"><span class="roll-strip">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<span>${d}</span>`).join('')}</span></span>${p && p % 3 === 0 ? '<span class="roll-sep">.</span>' : ''}`;
  }).join('')}</span>`;
  const now = performance.now();
  const cols = [...el.querySelectorAll('.roll-col')].map(node => {
    const p = +node.dataset.place, n = Math.floor(from / 10 ** p);
    return { node, strip: node.firstElementChild, p, pos: n, velocity: 0, target: n, to: Math.floor(to / 10 ** p), due: now + p * 45 };
  });
  let frame = 0, previous = 0;
  const paint = () => cols.forEach(c => {
    const m = ((c.pos % 10) + 10) % 10;
    c.strip.style.transform = `translateY(${-m / 11 * 100}%)`;
    const smear = Math.min(3, Math.abs(c.velocity) * 2.4);
    c.strip.style.filter = smear > .15 ? `blur(${smear.toFixed(2)}px)` : '';
    c.node.dataset.on = String(c.p < String(to).length);
    if (c.node.nextElementSibling?.classList.contains('roll-sep')) c.node.nextElementSibling.dataset.on = c.node.dataset.on;
  });
  const snap = () => { cancelAnimationFrame(frame); cols.forEach(c => { c.pos = c.to; c.velocity = 0; }); paint(); };
  function tick(time) {
    if (!el.isConnected) return;
    const dt = previous ? clamp((time - previous) / 16.67, 0, 2.5) : 1; previous = time;
    let busy = false;
    for (const c of cols) {
      if (time >= c.due) c.target = c.to; else busy = true;
      const gap = c.target - c.pos;
      if (Math.abs(gap) > 24) c.pos += Math.round((gap - Math.sign(gap) * 24) / 10) * 10;
      c.velocity += (c.target - c.pos) * .152 * dt;
      c.velocity *= Math.pow(.71, dt);
      c.pos += c.velocity * dt;
      if (Math.abs(c.target - c.pos) < .004 && Math.abs(c.velocity) < .004) { c.pos = c.target; c.velocity = 0; } else busy = true;
    }
    paint(); frame = busy ? requestAnimationFrame(tick) : 0;
  }
  const preference = () => { if (reducedMotion.matches) snap(); };
  reducedMotion.addEventListener('change', preference);
  if (reducedMotion.matches || from === to) snap();
  else { paint(); frame = requestAnimationFrame(tick); }
  return () => { cancelAnimationFrame(frame); reducedMotion.removeEventListener('change', preference); };
}

export function checkMarkup(label, done, key, enter = false) {
  return `<span class="motion-check" data-check="${escapeHTML(key)}" data-done="${!!done}" ${enter ? 'data-check-enter' : ''}>
    <span class="motion-sr">${done ? 'Completado: ' : 'Pendiente: '}</span>
    <span class="check-box" aria-hidden="true"><span class="check-fill"></span><svg class="check-tick" viewBox="0 0 24 24"><path d="M6 12.4 L10.3 16.7 L18 7.6" pathLength="1" stroke-dasharray="1"/></svg></span>
    <span class="check-say"><span class="check-word">${escapeHTML(label)}</span><span class="check-rule" aria-hidden="true"></span></span>
  </span>`;
}

export function animateCheck(el, from, done) {
  const fill = el.querySelector('.check-fill'), tick = el.querySelector('path');
  const rule = el.querySelector('.check-rule'), word = el.querySelector('.check-word');
  const s = spring(from ? 1 : 0, t => {
    const held = clamp(t, 0, 1), cut = clamp((held - .12) / .72, 0, 1);
    fill.style.transform = `scale(${t.toFixed(4)})`;
    tick.style.strokeDashoffset = 1 - held;
    rule.style.transform = `scaleX(${cut})`;
    word.style.opacity = 1 - .58 * held;
  }, 50);
  if (from !== done) s.to(done ? 1 : 0);
  return () => s.dispose();
}

// A deck: the card in front is straight; the next ones peek out underneath, a little smaller and
// slightly turned, like real cards.
export const cardSlot = k => `translate3d(0, ${k * 16}px, 0) scale(${1 - k * 0.05}) rotate(${k === 0 ? 0 : k % 2 ? -2.5 : 2}deg)`;

// Rating is committed before playing the swap: never advance a card on a failed
// save, and never infer a learning grade from a decorative swipe.
// dir: 1 = known (the card leaves to the right), -1 = not known (to the left). The cards behind
// move up one place.
export async function advanceDeck(deck, dir = 1) {
  if (!deck || reducedMotion.matches || !Element.prototype.animate) return;
  const cards = [...deck.querySelectorAll('.review-card')];
  if (!cards.length) return;
  const animations = cards.map((card, i) => i === 0
    ? card.animate([{ transform: cardSlot(0), opacity: 1 }, { transform: `translate3d(${dir * 115}%, -4%, 0) rotate(${dir * 12}deg)`, opacity: 0 }], {
      duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards'
    })
    : card.animate([{ transform: cardSlot(i) }, { transform: cardSlot(i - 1) }], {
      duration: 460, delay: 90, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards'
    }));
  const stop = () => animations.forEach(a => a.finish());
  reducedMotion.addEventListener('change', stop);
  await Promise.all(animations.map(a => a.finished.catch(() => {})));
  reducedMotion.removeEventListener('change', stop);
}

export function mountMotion(root, memory) {
  const cleanup = [];
  root.querySelectorAll('[data-roll]').forEach(el => {
    const key = el.dataset.roll, value = +el.dataset.value;
    cleanup.push(rollNumber(el, value, { from: memory.get(key) ?? value })); memory.set(key, value);
  });
  root.querySelectorAll('[data-check]').forEach(el => {
    const key = el.dataset.check, done = el.dataset.done === 'true';
    const from = el.hasAttribute('data-check-enter') ? false : memory.get(key) ?? done;
    cleanup.push(animateCheck(el, from, done)); memory.set(key, done);
  });
  return () => cleanup.forEach(dispose => dispose());
}
