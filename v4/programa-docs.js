// Program pages, "Included in this program" section.
// 1. "See a sample" buttons open one page of the document in a dialog (no download).
// 2. On wide screens, the cards flow through a 2 × 2 window in a zigzag: one step
//    from the top right corner to the bottom left one, the next from the top left
//    corner to the bottom right one. The card in that corner slides across and
//    stays; the three cards that come in were not on screen just before, and the
//    least recently shown go first, so every document comes round in turn and no
//    card is ever shown twice at once.

const dialog = document.getElementById('doc-sample');
if (dialog) {
  const image = dialog.querySelector('img');
  const title = dialog.querySelector('#doc-sample-title');
  // Delegated: the flow below adds its own copies of the buttons.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-sample]');
    if (!button) return;
    image.src = button.dataset.sample;
    image.alt = button.dataset.title;
    title.textContent = button.dataset.title;
    dialog.showModal();
  });
  dialog.addEventListener('click', event => {
    // A click on the backdrop or on the close button closes the dialog.
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('contextmenu', event => { if (event.target === image) event.preventDefault(); });
}

const HOLD = 2000; // ms on each position
const MOVE = 800; // ms per step, matches the transition in programa.css
const section = document.querySelector('.pgm-included');
const flow = section && section.querySelector('.inc-flow');
const sources = section ? [...section.querySelectorAll('.inc-grid > .inc-item')] : [];
const wide = matchMedia('(min-width: 1001px) and (prefers-reduced-motion: no-preference)');

if (flow && sources.length >= 7) {
  const cards = sources.map(source => {
    const card = source.cloneNode(true);
    flow.append(card);
    return card;
  });
  const lastShown = cards.map(() => -1);
  let slots = new Map(); // "x,y" → card index, x and y in 0..1
  let step = 0, dx = -1, timer = 0, onScreen = true;

  const place = (index, x, y, snap = false) => {
    const card = cards[index];
    card.classList.toggle('is-snap', snap);
    card.style.setProperty('--x', x);
    card.style.setProperty('--y', y);
  };
  const show = (index, visible) => {
    cards[index].classList.toggle('is-out', !visible);
    cards[index].inert = !visible;
    if (visible) cards[index].removeAttribute('aria-hidden');
    else cards[index].setAttribute('aria-hidden', 'true');
  };

  const reset = () => {
    slots = new Map([['0,0', 0], ['1,0', 1], ['0,1', 2], ['1,1', 3]]);
    cards.forEach((_, i) => show(i, i < 4));
    slots.forEach((index, key) => { const [x, y] = key.split(',').map(Number); place(index, x, y, true); lastShown[index] = 0; });
    step = 0; dx = -1;
  };

  const advance = () => {
    step++;
    const before = new Set(slots.values());
    const next = new Map();
    slots.forEach((index, key) => {
      const [x, y] = key.split(',').map(Number);
      const nx = x + dx, ny = y + 1;
      place(index, nx, ny);
      if (nx >= 0 && nx <= 1 && ny <= 1) next.set(`${nx},${ny}`, index);
      else setTimeout(() => { if (![...slots.values()].includes(index)) show(index, false); }, MOVE);
    });
    // Least recently shown first, never a card that was just on screen.
    const pool = cards.map((_, i) => i).filter(i => !before.has(i)).sort((a, b) => lastShown[a] - lastShown[b] || a - b);
    for (const key of ['0,0', '1,0', '0,1', '1,1']) {
      if (next.has(key)) continue;
      const index = pool.shift();
      const [x, y] = key.split(',').map(Number);
      place(index, x - dx, y - 1, true); // start one step back, outside the window
      show(index, true);
      next.set(key, index);
    }
    slots = next;
    slots.forEach(index => { lastShown[index] = step; });
    // Let the start position render before moving in.
    requestAnimationFrame(() => requestAnimationFrame(() => slots.forEach((index, key) => {
      const [x, y] = key.split(',').map(Number);
      place(index, x, y);
    })));
    dx = -dx;
  };

  const paused = () => !onScreen || document.hidden || flow.querySelector('.inc-item:hover') || flow.contains(document.activeElement);
  const tick = () => {
    if (paused()) { timer = setTimeout(tick, 250); return; }
    advance();
    timer = setTimeout(tick, MOVE + HOLD);
  };
  const toggle = () => {
    clearTimeout(timer);
    section.classList.toggle('has-flow', wide.matches);
    if (!wide.matches) return;
    reset();
    timer = setTimeout(tick, HOLD);
  };

  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }).observe(flow);
  wide.addEventListener('change', toggle);
  toggle();
}
