import { PRICING, WRITTEN_TESTIMONIALS, LINKS } from './content.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const money = amount => new Intl.NumberFormat('es-ES', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(amount);
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

export function renderPricing(mode = 'monthly') {
  const cycle = mode === 'cycle';
  return PRICING.plans.map(plan => {
    const value = cycle ? plan.cycle : plan.monthly;
    const query = new URLSearchParams({ plan: plan.enrollmentRhythmId, billing: cycle ? 'Ciclo' : 'Mensual', source: 'home-v4' });
    return `<article class="price-card${plan.featured ? ' is-featured' : ''}" data-plan="${plan.id}">
      <header class="price-card-head"><span class="price-tag">${escapeHtml(plan.tag)}</span><h3>${escapeHtml(plan.name)}</h3></header>
      <div class="price-block">
        <p class="price-amount"><strong>${money(value.amount)}</strong><span>CAD${cycle ? ' · ciclo completo' : ' / mes'}</span></p>
        <p class="price-hours">${cycle ? `<strong>${value.months} meses</strong> · ${value.hoursPerWeek} h*/semana` : `${value.hoursPerMonth} horas al mes · ${value.hoursPerWeek} h*/semana`}</p>
        ${cycle ? `<div class="price-saving"><p><s>${money(value.originalAmount)} CAD</s><strong>Ahorras ${money(value.saving)} CAD</strong></p><p>Equivale a ${money(value.equivalentPerMonth)} CAD al mes.</p><p>Precio de referencia: ${value.hoursPerWeek} h/semana.</p></div>` : '<p class="price-context">Mes a mes, sin permanencia.</p>'}
      </div>
      <ul class="price-includes">${plan.includes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <a class="button button-terra" href="/v4/inscription.html?${escapeHtml(query)}" data-chosen-plan="${escapeHtml(plan.enrollmentRhythmId)}" data-chosen-billing="${cycle ? 'Ciclo' : 'Mensual'}" data-cta="v4-plan-${plan.id}">Evaluar este ritmo ${arrow}</a>
    </article>`;
  }).join('\n');
}

export function renderReviews(start = 0) {
  const reviews = [0, 1].map(offset => WRITTEN_TESTIMONIALS[(start + offset) % WRITTEN_TESTIMONIALS.length]);
  return reviews.map(review => `<article class="review-card"><blockquote>“${escapeHtml(review.quote)}”</blockquote><footer><div><strong>${escapeHtml(review.name)}</strong><small>Opinión condensada</small></div><a class="source-link" href="${escapeHtml(review.url || LINKS.reviewsSource)}" target="_blank" rel="noopener noreferrer">Ver la fuente <span aria-hidden="true">↗</span></a></footer></article>`).join('\n');
}
