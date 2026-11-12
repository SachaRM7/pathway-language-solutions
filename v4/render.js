import { PRICING } from './content.js';
import { pages, t } from './i18n.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const money = (amount, lang = 'es') => new Intl.NumberFormat(t(lang).locale, { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(amount);
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

export function renderPricing(mode = 'monthly', lang = 'es') {
  const cycle = mode === 'cycle';
  const copy = t(lang).pricing;
  const cash = amount => money(amount, lang);
  return PRICING.plans.map(plan => {
    const value = cycle ? plan.cycle : plan.monthly;
    const words = copy.plans[plan.id];
    const query = new URLSearchParams({ plan: plan.enrollmentRhythmId, billing: cycle ? 'Ciclo' : 'Mensual', source: 'home-v4' });
    return `<article class="price-card${plan.featured ? ' is-featured' : ''}" data-plan="${plan.id}">
      <header class="price-card-head"><span class="price-tag">${escapeHtml(words.tag)}</span><h3>${escapeHtml(words.name)}</h3></header>
      <div class="price-block">
        <p class="price-amount"><strong>${cash(value.amount)}</strong><span>CAD${cycle ? copy.perCycle : copy.perMonth}</span></p>
        <p class="price-hours">${cycle ? copy.cycleHours(value.months, value.hoursPerWeek) : copy.monthlyHours(value.hoursPerMonth, value.hoursPerWeek)}</p>
        ${cycle ? `<div class="price-saving"><p><s>${cash(value.originalAmount)} CAD</s><strong>${copy.saving(cash(value.saving))}</strong></p><p>${copy.equivalent(cash(value.equivalentPerMonth))}</p><p>${copy.reference(value.hoursPerWeek)}</p></div>` : `<p class="price-context">${copy.monthToMonth}</p>`}
      </div>
      <ul class="price-includes">${words.includes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <a class="button button-terra" href="${pages(lang).inscription}?${escapeHtml(query)}" data-chosen-plan="${escapeHtml(plan.enrollmentRhythmId)}" data-chosen-billing="${cycle ? 'Ciclo' : 'Mensual'}" data-cta="v4-plan-${plan.id}">${copy.cta} ${arrow}</a>
    </article>`;
  }).join('\n');
}
