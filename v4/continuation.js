import { VIDEO_TESTIMONIALS, LINKS } from './content.js';
import { renderPricing } from './render.js';
import { pageLang, t } from './i18n.js';
import './ircc-rounds.js';

const lang = pageLang();
const copy = t(lang);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupPricing() {
  const cards = document.querySelector('[data-pricing-cards]');
  const options = [...document.querySelectorAll('[data-billing]')];
  const status = document.querySelector('[data-pricing-status]');
  if (!cards) return;
  function select(mode, announce = true) {
    cards.innerHTML = renderPricing(mode, lang);
    cards.dataset.billing = mode;
    options.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === mode)));
    if (announce) status.textContent = mode === 'cycle' ? copy.pricing.statusCycle : copy.pricing.statusMonthly;
  }
  options.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => select(button.dataset.billing));
  });
  cards.addEventListener('click', event => {
    const link = event.target.closest('[data-chosen-plan]');
    if (!link) return;
    try { sessionStorage.setItem('pathwayV4Selection', JSON.stringify({ plan: link.dataset.chosenPlan, billing: link.dataset.chosenBilling })); } catch { /* URL parameters preserve the choice without storage. */ }
  });
  select('monthly', false);
}

// Video reel: a row of portrait cards; a card opens the story viewer, which
// plays the testimonies one after the other (swipe or arrows to change).
function setupReel() {
  const track = document.querySelector('[data-reel-track]');
  if (!track) return;
  const step = direction => {
    const card = track.querySelector('.reel-item');
    const width = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 240;
    track.scrollBy({ left: direction * width * Math.max(1, Math.floor(track.clientWidth / width) - 1), behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  const previous = document.querySelector('[data-reel-previous]');
  const next = document.querySelector('[data-reel-next]');
  const sync = () => {
    previous.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
  };
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();

  const viewer = document.querySelector('[data-story-viewer]');
  const video = viewer.querySelector('[data-sv-video]');
  const name = viewer.querySelector('[data-sv-name]');
  const count = viewer.querySelector('[data-sv-count]');
  const error = viewer.querySelector('[data-sv-error]');
  const bars = [...viewer.querySelectorAll('.sv-progress i')];
  let index = 0;
  let request = 0;
  function show(target) {
    index = (target + VIDEO_TESTIMONIALS.length) % VIDEO_TESTIMONIALS.length;
    const story = VIDEO_TESTIMONIALS[index];
    const ticket = ++request;
    video.pause();
    video.poster = story.poster;
    video.src = story.src;
    video.setAttribute('aria-label', copy.stories.videoOf(story.name));
    name.textContent = story.name;
    count.textContent = copy.stories.counter(index + 1, VIDEO_TESTIMONIALS.length);
    viewer.querySelector('[data-sv-direct]').href = story.src;
    error.hidden = true;
    bars.forEach((bar, i) => { bar.className = i < index ? 'is-done' : i === index ? 'is-now' : ''; bar.style.setProperty('--p', i < index ? 1 : 0); });
    video.play().catch(failure => { if (ticket === request && failure.name !== 'AbortError' && failure.name !== 'NotAllowedError') error.hidden = false; });
  }
  function open(target, opener) {
    viewer.returnFocus = opener;
    document.documentElement.classList.add('has-story-open');
    viewer.showModal();
    show(target);
  }
  function close() {
    request++;
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (viewer.open) viewer.close();
  }
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('has-story-open');
    viewer.returnFocus?.focus?.({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-story-open]');
    if (opener) open(Number(opener.dataset.storyOpen), opener);
  });
  viewer.querySelector('[data-sv-close]').addEventListener('click', close);
  viewer.querySelector('[data-sv-previous]').addEventListener('click', () => show(index - 1));
  viewer.querySelector('[data-sv-next]').addEventListener('click', () => show(index + 1));
  viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
  viewer.addEventListener('cancel', event => { event.preventDefault(); close(); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') show(index + 1);
    if (event.key === 'ArrowLeft') show(index - 1);
  });
  video.addEventListener('timeupdate', () => { if (video.duration) bars[index]?.style.setProperty('--p', video.currentTime / video.duration); });
  video.addEventListener('ended', () => (index < VIDEO_TESTIMONIALS.length - 1 ? show(index + 1) : close()));
  video.addEventListener('error', () => { if (video.getAttribute('src')) error.hidden = false; });
  let startX = null;
  viewer.addEventListener('touchstart', event => { startX = event.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', event => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) > 60) show(index + (delta < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
}

// Screenshot of an official result, enlarged in a dialog.
function setupResults() {
  const viewer = document.querySelector('[data-result-viewer]');
  if (!viewer) return;
  const image = viewer.querySelector('[data-rv-image]');
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-result-image]');
    if (!link) return;
    event.preventDefault();
    image.src = link.href;
    image.alt = link.dataset.resultAlt || '';
    viewer.showModal();
  });
  viewer.querySelector('[data-rv-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
}

// Two lanes of written reviews scroll slowly, the first to the right and the
// second to the left; they stop
// on hover or focus, with the pause button, and for reduced motion.
function setupQuotes() {
  const quotes = document.querySelector('[data-quotes]');
  if (!quotes) return;
  const toggle = quotes.querySelector('[data-quotes-toggle]');
  const setPaused = paused => {
    quotes.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? copy.stories.resume : copy.stories.pause);
    toggle.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
  };
  toggle.addEventListener('click', () => setPaused(!quotes.classList.contains('is-paused')));
  if (reducedMotion()) setPaused(true);
}

function setupFaq() {
  const rows = [...document.querySelectorAll('[data-faq] details')];
  rows.forEach(row => {
    row.addEventListener('toggle', () => {
      if (row.open) rows.forEach(other => { if (other !== row) other.open = false; });
    });
  });
}

function setupSocials() {
  const container = document.querySelector('[data-social-links]');
  if (!container) return;
  const icons = {
    instagram: '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-instagram"/></svg>',
    tiktok: '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-tiktok"/></svg>'
  };
  for (const [network, url] of Object.entries(LINKS.social)) {
    if (!url) continue;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', copy.social[network]);
    link.innerHTML = icons[network];
    container.append(link);
  }
}

setupPricing();
setupReel();
setupResults();
setupQuotes();
setupFaq();
setupSocials();
