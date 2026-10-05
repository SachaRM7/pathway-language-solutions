import { VIDEO_TESTIMONIALS, WRITTEN_TESTIMONIALS, LINKS } from './content.js';
import { renderPricing, renderReviews } from './render.js';
import './ircc-rounds.js';

function setupPricing() {
  const cards = document.querySelector('[data-pricing-cards]');
  const options = [...document.querySelectorAll('[data-billing]')];
  const status = document.querySelector('[data-pricing-status]');
  if (!cards) return;
  function select(mode, announce = true) {
    cards.innerHTML = renderPricing(mode);
    cards.dataset.billing = mode;
    options.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === mode)));
    if (announce) status.textContent = mode === 'cycle' ? 'Tarifas por ciclo completo en dólares canadienses. Descuento directo del 15 %.' : 'Tarifas mensuales en dólares canadienses.';
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

function setupTestimonials() {
  const video = document.querySelector('[data-testimony-video]');
  const play = document.querySelector('[data-testimony-play]');
  const error = document.querySelector('[data-video-error]');
  const previous = document.querySelector('[data-video-previous]');
  const next = document.querySelector('[data-video-next]');
  const caption = document.querySelector('[data-video-name]');
  const videoCount = document.querySelector('[data-video-count]');
  let videoIndex = 0;
  let playbackRequest = 0;
  function selectVideo(index) {
    playbackRequest++;
    video.pause();
    videoIndex = (index + VIDEO_TESTIMONIALS.length) % VIDEO_TESTIMONIALS.length;
    const testimony = VIDEO_TESTIMONIALS[videoIndex];
    video.src = testimony.src;
    video.poster = testimony.poster;
    video.setAttribute('aria-label', `Testimonio de ${testimony.name}`);
    video.load();
    caption.textContent = testimony.name;
    videoCount.textContent = `Vídeo ${videoIndex + 1} de ${VIDEO_TESTIMONIALS.length}`;
    play.setAttribute('aria-label', `Reproducir el testimonio de ${testimony.name}`);
    play.hidden = false;
    error.hidden = true;
    document.querySelector('[data-video-direct]').href = testimony.src;
  }
  if (video) {
    [previous, next].forEach(button => { button.disabled = false; });
    play.hidden = false;
    previous.addEventListener('click', () => selectVideo(videoIndex - 1));
    next.addEventListener('click', () => selectVideo(videoIndex + 1));
    play.addEventListener('click', async () => {
      const request = ++playbackRequest;
      try { await video.play(); } catch (failure) {
        if (request !== playbackRequest || failure.name === 'AbortError') return;
        error.hidden = false;
        play.hidden = false;
      }
    });
    video.addEventListener('play', () => { play.hidden = true; caption.hidden = true; error.hidden = true; });
    video.addEventListener('pause', () => { play.hidden = false; caption.hidden = false; });
    video.addEventListener('error', () => { error.hidden = false; play.hidden = true; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  }

  const pair = document.querySelector('[data-written-reviews]');
  if (!pair) return;
  const count = document.querySelector('[data-review-count]');
  let reviewIndex = 0;
  function selectReviews(delta = 0) {
    reviewIndex = (reviewIndex + delta + WRITTEN_TESTIMONIALS.length) % WRITTEN_TESTIMONIALS.length;
    pair.innerHTML = renderReviews(reviewIndex);
    count.textContent = `${reviewIndex + 1}–${Math.min(reviewIndex + 2, WRITTEN_TESTIMONIALS.length)} de ${WRITTEN_TESTIMONIALS.length}`;
  }
  for (const [selector, delta] of [['[data-review-previous]', -2], ['[data-review-next]', 2]]) {
    const button = document.querySelector(selector);
    button.disabled = false;
    button.addEventListener('click', () => selectReviews(delta));
  }
  document.querySelector('[data-written-total]').textContent = `${WRITTEN_TESTIMONIALS.length} recomendaciones públicas`;
  document.querySelector('[data-reviews-source]').href = LINKS.reviewsSource;
  selectReviews();
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
    instagram: '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M14 3v12.5a4.5 4.5 0 1 1-4.5-4.5M14 3c0 4 2 6 6 6"/></svg>'
  };
  for (const [network, url] of Object.entries(LINKS.social)) {
    if (!url) continue;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', network === 'instagram' ? 'Instagram de Pathway' : 'TikTok de Pathway');
    link.innerHTML = icons[network];
    container.append(link);
  }
}

setupPricing();
setupTestimonials();
setupFaq();
setupSocials();
