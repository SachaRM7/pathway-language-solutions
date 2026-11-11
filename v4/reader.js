// V4 program pages: the page-turning textbook excerpt.
//
// On top of the reader of /manual-a2.js (still used by the legacy /programas
// pages), this one adds:
// - a guided tour: numbered spots on the pages, each opening a short note in the
//   visitor's language, that can be played step by step;
// - chapter tabs and a strip of thumbnails instead of the chapter menu;
// - after the excerpt, locked pages and a final call to action;
// - the "See a sample" buttons of the included documents open the book at
//   their page (samples that are not in the book keep their dialog).
//
// Data: window.PathwayManualPages (pages of the excerpt) and window.PathwayTour
// (spots and interface strings), both written by scripts/build-v4-programs.mjs.
(() => {
  const $ = s => document.querySelector(s);
  const book = $('#book');
  const pages = window.PathwayManualPages;
  const T = window.PathwayTour;
  if (!book || !Array.isArray(pages) || !pages.length || !T) return;
  const shell = $('#manual');
  const desk = $('.book-desk');
  const fullscreenButton = $('#fullscreen-open');
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const left = $('#left-page'), right = $('#right-page'), leaf = $('#leaf');
  const level = book.dataset.level || '';
  let t = {};
  try { t = JSON.parse(book.dataset.i18n || '{}'); } catch {}
  const chapter = p => (t.chapters && t.chapters[p.key]) || p.title;
  const baseName = src => src.split('/').pop().replace(/\.webp(\?.*)?$/, '');

  // Virtual pages after the excerpt: one or two locked pages, then the call to
  // action, which must land on the right-hand page of a spread (even index).
  const LEN = pages.length;
  const LOCKED = LEN;
  const LOCKED_PAGES = LEN % 2 === 0 ? 2 : 1;
  const CTA = LEN + LOCKED_PAGES;
  const end = () => CTA;
  const pageIndex = Object.fromEntries(pages.map((p, i) => [baseName(p.src), i]));
  const spots = T.spots.map((s, k) => ({ ...s, n: k + 1, index: pageIndex[s.page] })).filter(s => s.index !== undefined);
  spots.forEach((s, k) => { s.n = k + 1; });

  let current = 0, busy = false, opened = false, autoTimer, gesture;
  let tourStep = -1;

  const lock = '<span class="rd-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></span>';
  const intro = `<div class="book-inside"><img src="/pathway-mark.svg" alt="Pathway"><small>Manuel de français · ${level}</small><h2>Le français,<br>page après page.</h2><p>Extraits du manuel original.<br>64 unités · 4 segments</p><small>Pathway Language Solutions</small></div>`;
  const teaser = pages.filter(p => p.key === 'unite-1').slice(1, 4);
  const lockedPage = withCard => `<div class="rd-locked"><div class="rd-locked-pages">${teaser.map(p => `<img src="${p.src}" alt="" draggable="false">`).join('')}</div>${withCard ? `<div class="rd-locked-card">${lock}<b>${T.lockedTitle}</b><p>${T.lockedText}</p></div>` : `<div class="rd-locked-mark">${lock}</div>`}</div>`;
  const cta = `<div class="rd-cta"><small>${T.ctaKicker}</small><h2>${T.ctaTitle}</h2><p>${T.ctaText}</p><a href="${t.ctaHref || '/test-placement.html'}" data-cta="v4-program-${level.toLowerCase()}-book">${T.ctaButton}</a></div>`;
  function markup(i, live = false) {
    if (i < 0) return intro;
    if (i >= CTA) return cta;
    if (i >= LOCKED) return lockedPage(i === LOCKED);
    const p = pages[i];
    const dots = live ? spots.filter(s => s.index === i).map(s => `<button type="button" class="rd-spot" data-spot="${s.n - 1}" style="left:${s.x}%;top:${s.y}%" aria-label="${s.n}. ${s.title}"><span>${s.n}</span></button>`).join('') : '';
    return `<img class="page-art" src="${p.src}" alt="${chapter(p)} · ${t.page || 'p.'} ${p.n} · ${t.manual || ''} ${level}" draggable="false">${dots}`;
  }

  // ---------- Chapter tabs, tour button, thumbnails ----------
  const toolbar = $('.reader-toolbar');
  const chapterLabel = toolbar.querySelector('label');
  if (chapterLabel) chapterLabel.hidden = true;
  if ($('#zoom-open')) $('#zoom-open').hidden = true;
  const chapters = [];
  pages.forEach((p, i) => { const label = T.tabs[p.key] || chapter(p); if (!chapters.some(c => c.label === label)) chapters.push({ label, index: i }); });
  chapters.push({ label: T.tabs.after, index: LOCKED, locked: true });
  const tabs = document.createElement('nav');
  tabs.className = 'rd-tabs';
  tabs.setAttribute('aria-label', T.chaptersLabel);
  tabs.innerHTML = chapters.map((c, k) => `<button type="button" data-tab="${k}">${c.locked ? lock : ''}${c.label}</button>`).join('');
  toolbar.prepend(tabs);
  const tourButton = document.createElement('button');
  tourButton.type = 'button';
  tourButton.className = 'rd-tour';
  tourButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m10 8.8 5 3.2-5 3.2Z"/></svg>${T.label}`;
  toolbar.querySelector('.reader-toolbar-actions').prepend(tourButton);

  const strip = document.createElement('div');
  strip.className = 'rd-thumbs';
  strip.innerHTML = pages.map((p, i) => `<button type="button" data-thumb="${i}" aria-label="${chapter(p)} · ${t.page || 'p.'} ${p.n}"><img src="${p.src}" alt="" loading="lazy" decoding="async">${spots.some(s => s.index === i) ? '<i></i>' : ''}</button>`).join('')
    + `<button type="button" data-thumb="${LOCKED}" class="is-locked" aria-label="${T.lockedTitle}">${lock}<b>+63</b></button>`;
  const progress = $('.reader-progress');
  if (progress) progress.replaceWith(strip); else desk.after(strip);
  strip.addEventListener('click', e => { const b = e.target.closest('[data-thumb]'); if (b) go(Number(b.dataset.thumb)); });
  tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) go(chapters[Number(b.dataset.tab)].index); });

  // ---------- Tour note ----------
  const note = document.createElement('div');
  note.className = 'rd-note';
  note.hidden = true;
  note.setAttribute('role', 'dialog');
  desk.append(note);
  const onScreen = i => (mobile.matches ? current === i : current === i || current - 1 === i);
  function showSpot(k) {
    const s = spots[k];
    tourStep = k;
    book.querySelectorAll('.rd-spot').forEach(b => b.classList.toggle('is-active', Number(b.dataset.spot) === k));
    const dot = book.querySelector(`.book-page .rd-spot[data-spot="${k}"]`);
    if (!dot) return;
    note.setAttribute('aria-label', s.title);
    note.innerHTML = `<div class="rd-note-head"><span>${s.n}</span><b>${s.title}</b><button type="button" data-note="close" aria-label="${T.close}">✕</button></div><p>${s.text}</p>`
      + `<div class="rd-note-foot"><small>${s.n} / ${spots.length}</small>${k > 0 ? `<button type="button" data-note="prev">${T.prev}</button>` : ''}<button type="button" data-note="next" class="is-primary">${k < spots.length - 1 ? `${T.next} →` : T.done}</button></div>`;
    note.hidden = false;
    const box = desk.getBoundingClientRect(), d = dot.getBoundingClientRect();
    const w = Math.min(300, box.width - 24);
    note.style.width = `${w}px`;
    const x = Math.max(12, Math.min(d.left - box.left + d.width / 2 - w / 2, box.width - w - 12));
    const below = d.top - box.top + d.height + 10;
    note.style.left = `${x}px`;
    note.style.top = `${below}px`;
    if (below + note.offsetHeight > box.height - 8) note.style.top = `${Math.max(8, d.top - box.top - note.offsetHeight - 10)}px`;
    note.classList.remove('is-in'); void note.offsetWidth; note.classList.add('is-in');
  }
  function hideNote() {
    note.hidden = true;
    tourStep = -1;
    tourButton.classList.remove('is-on');
    book.querySelectorAll('.rd-spot.is-active').forEach(b => b.classList.remove('is-active'));
  }
  async function goSpot(k) {
    if (k < 0 || k >= spots.length) { hideNote(); return; }
    if (!opened) await open();
    if (!onScreen(spots[k].index)) await turn(spots[k].index);
    showSpot(k);
    note.querySelector('[data-note="next"]').focus({ preventScroll: true });
  }
  note.addEventListener('click', e => {
    const a = e.target.closest('[data-note]');
    if (!a) return;
    if (a.dataset.note === 'close') hideNote();
    else goSpot(tourStep + (a.dataset.note === 'next' ? 1 : -1));
  });
  note.addEventListener('keydown', e => { if (e.key === 'Escape') hideNote(); });
  book.addEventListener('click', e => {
    const b = e.target.closest('.rd-spot');
    if (!b) return;
    e.stopPropagation();
    showSpot(Number(b.dataset.spot));
  });
  tourButton.onclick = () => {
    tourButton.classList.add('is-on');
    shell.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    goSpot(0);
  };

  // ---------- Book ----------
  function sync() {
    $('#previous').disabled = $('#edge-prev').disabled = busy || !opened || current === 0;
    $('#next').disabled = $('#edge-next').disabled = busy || !opened || current >= end();
    // The real page the label and the tabs refer to: the right-hand one, or the
    // left-hand one when the right-hand page is already past the excerpt.
    const ref = mobile.matches || current < LEN ? current : current - 1;
    const p = pages[Math.min(Math.max(ref, 0), LEN - 1)];
    const prev = !mobile.matches && current > 0 && current < LEN ? pages[current - 1] : null;
    $('#page-label').textContent = !opened ? `Manuel de français · ${level}`
      : ref >= LOCKED ? T.tabs.after
        : `${chapter(p)} · ${prev && prev.n !== p.n ? `p. ${prev.n}–${p.n}` : `p. ${p.n}`}`;
    strip.querySelectorAll('[data-thumb]').forEach(b => {
      const i = Number(b.dataset.thumb);
      const on = opened && (i === LOCKED ? current >= LOCKED : onScreen(i));
      b.classList.toggle('is-current', on);
      if (on && !busy) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    const at = ref >= LOCKED ? chapters.length - 1 : chapters.reduce((k, c, j) => (!c.locked && c.index <= ref ? j : k), 0);
    tabs.querySelectorAll('[data-tab]').forEach((b, j) => { const on = opened && j === at; b.classList.toggle('is-current', on); b.setAttribute('aria-current', on ? 'true' : 'false'); });
  }
  function render() {
    left.innerHTML = markup(current - 1, true);
    right.innerHTML = markup(current, true);
    sync();
    if (tourStep >= 0 && onScreen(spots[tourStep].index)) showSpot(tourStep);
    else if (tourStep >= 0) { note.hidden = true; }
  }
  async function prepare(indices) {
    await Promise.all(indices.filter(i => pages[i]).map(async i => { const img = new Image(); img.src = pages[i].src; try { await img.decode(); } catch {} }));
  }
  async function open() {
    clearTimeout(autoTimer);
    if (opened || busy) return;
    busy = true; sync();
    await prepare([current - 1, current]);
    book.classList.remove('is-closed');
    requestAnimationFrame(() => book.classList.add('is-open'));
    opened = true;
    await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 1150));
    busy = false; sync();
    $('#cover').tabIndex = -1; $('#cover').hidden = true;
    prepare([current + 1, current + 2]);
  }
  async function turn(target) {
    clearTimeout(autoTimer);
    if (busy) return;
    if (!opened) await open();
    target = mobile.matches ? Math.max(0, Math.min(target, end())) : Math.max(0, Math.min(Math.ceil(target / 2) * 2, end()));
    if (target === current) return;
    busy = true; note.hidden = true; sync();
    await prepare([target - 1, target]);
    const forward = target > current;
    leaf.className = `turning-leaf ${forward ? 'forward' : 'backward'}`;
    leaf.querySelector('.leaf-front').innerHTML = markup(mobile.matches ? current : forward ? current : current - 1);
    leaf.querySelector('.leaf-back').innerHTML = markup(mobile.matches ? target : forward ? target - 1 : target);
    if (mobile.matches || forward) right.innerHTML = markup(target);
    else left.innerHTML = markup(target - 1);
    if (!reduced.matches) {
      // Filters flatten the 3D faces: keep shading on pseudo-elements, animate only the rotation.
      const animation = leaf.animate([
        { transform: 'rotateY(0deg)' },
        { transform: `rotateY(${forward ? -85 : 85}deg)`, offset: .5 },
        { transform: `rotateY(${forward ? -180 : 180}deg)` }
      ], { duration: 820, easing: 'cubic-bezier(.25,.65,.3,1)', fill: 'forwards' });
      try { await animation.finished; } catch {}
      animation.cancel();
    }
    current = target; leaf.className = 'turning-leaf'; busy = false; render();
    prepare([current + 1, current + 2]);
  }
  async function go(i) { if (!opened) await open(); await turn(i); }
  const step = direction => turn(current + direction * (mobile.matches ? 1 : 2));
  $('#previous').onclick = $('#edge-prev').onclick = () => step(-1);
  $('#next').onclick = $('#edge-next').onclick = () => step(1);
  $('#cover').onclick = open;
  $('#close-book').onclick = () => { if (busy) return; clearTimeout(autoTimer); hideNote(); opened = false; $('#cover').hidden = false; book.classList.remove('is-open'); book.classList.add('is-closed'); $('#cover').tabIndex = 0; sync(); };
  book.addEventListener('keydown', e => {
    if (e.target.closest('a,select,.rd-spot')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
  });
  book.addEventListener('pointerdown', e => { if (e.isPrimary) gesture = { x: e.clientX, y: e.clientY }; });
  book.addEventListener('pointerup', e => {
    if (!gesture) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y; gesture = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { e.preventDefault(); step(dx < 0 ? 1 : -1); }
  });
  book.addEventListener('pointercancel', () => { gesture = null; });

  // "See a sample" on a card: open the book at that page instead of the dialog.
  document.addEventListener('click', async e => {
    const button = e.target.closest('[data-sample]');
    if (!button) return;
    const i = pageIndex[baseName(button.dataset.sample)];
    if (i === undefined) return;
    e.preventDefault(); e.stopImmediatePropagation();
    shell.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 450));
    await go(i);
    const target = [left, right].find(el => el.querySelector(`img[src="${pages[i].src}"]`)) || right;
    target.classList.remove('rd-flash'); void target.offsetWidth; target.classList.add('rd-flash');
  }, true);

  // ---------- Full screen ----------
  const nativeFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const setReaderFullscreen = active => {
    shell.classList.toggle('is-reader-fullscreen', active);
    document.documentElement.classList.toggle('manual-fullscreen-active', active);
    document.body.classList.toggle('manual-fullscreen-active', active);
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.setAttribute('aria-label', active ? t.closeFullscreen : t.openFullscreen);
    $('#fullscreen-label').textContent = active ? t.exit : t.fullscreen;
    $('#fullscreen-icon').textContent = active ? '✕' : '↗';
    if (active) shell.scrollTop = 0;
    if (tourStep >= 0) requestAnimationFrame(() => showSpot(tourStep));
  };
  fullscreenButton.onclick = async () => {
    if (shell.classList.contains('is-reader-fullscreen')) {
      try {
        if (nativeFullscreenElement() && document.exitFullscreen) await document.exitFullscreen();
        else if (nativeFullscreenElement() && document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {}
      setReaderFullscreen(false);
      return;
    }
    setReaderFullscreen(true);
    try {
      if (shell.requestFullscreen) await shell.requestFullscreen();
      else if (shell.webkitRequestFullscreen) shell.webkitRequestFullscreen();
    } catch {
      // The fixed overlay stays when element full screen is unavailable (some iOS Safari versions).
    }
  };
  const syncNativeFullscreen = () => {
    if (nativeFullscreenElement() === shell) setReaderFullscreen(true);
    else if (!nativeFullscreenElement() && shell.classList.contains('is-reader-fullscreen')) setReaderFullscreen(false);
  };
  document.addEventListener('fullscreenchange', syncNativeFullscreen);
  document.addEventListener('webkitfullscreenchange', syncNativeFullscreen);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && shell.classList.contains('is-reader-fullscreen') && !nativeFullscreenElement()) setReaderFullscreen(false);
  });

  mobile.addEventListener('change', () => {
    const settle = () => { current = Math.min(mobile.matches ? current : Math.ceil(current / 2) * 2, end()); render(); };
    if (busy) setTimeout(settle, 1200); else settle();
  });
  addEventListener('resize', () => { if (tourStep >= 0 && !busy && !note.hidden) showSpot(tourStep); });
  render();
  // Open the book once the cover has been visible for a few seconds.
  $('#cover img').decode().catch(() => {}).then(() => { if (!opened && !busy) autoTimer = setTimeout(open, 4000); });
})();
