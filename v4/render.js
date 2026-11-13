import { PRICING } from './content.js';
import { pages, t } from './i18n.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const money = (amount, lang = 'es') => new Intl.NumberFormat(t(lang).locale, { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(amount);
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

// One card per pace (Esencial, Acelerado, Intensivo). A pace with two
// intensities (3 or 4 h, 5 or 6 h) shows its lowest price as « desde » and the
// other intensity below. The button opens the enrolment form of the page
// language directly (/inscription.html?plan=Acelerado&billing=Mensual&hours=4,
// /fr/inscription.html?…), which preselects pace, billing and hours.
export function renderPricing(mode = 'monthly', lang = 'es') {
  const cycle = mode === 'cycle';
  const copy = t(lang).pricing;
  const cash = amount => money(amount, lang);
  return PRICING.plans.map(plan => {
    const value = cycle ? plan.cycle : plan.monthly;
    const words = copy.plans[plan.id];
    const billing = cycle ? 'Ciclo' : 'Mensual';
    const weeks = plan.options.map(item => item.hoursPerWeek);
    const others = plan.options.slice(1);
    const query = new URLSearchParams({ plan: plan.enrollmentRhythmId, billing, hours: String(plan.defaultHours) });
    const tags = plan.featured ? `<span class="price-tag price-tag-featured">${escapeHtml(copy.featured)}</span>` : '';
    const from = plan.from ? `<span class="price-from">${escapeHtml(copy.from)}</span>` : '';
    const detail = cycle
      ? `<div class="price-saving"><p><s>${cash(value.originalAmount)} CAD</s><strong>${copy.saving(cash(value.saving))}</strong></p><p>${copy.equivalent(cash(value.equivalentPerMonth))}</p><p>${others.length ? others.map(item => copy.option(item.hoursPerWeek, cash(item.cycle.amount), true)).join(' ') : copy.reference(value.hoursPerWeek)}</p></div>`
      : `<div class="price-saving price-monthly"><p>${others.length ? others.map(item => copy.option(item.hoursPerWeek, cash(item.monthly), false)).join(' ') : copy.monthToMonth}</p><p>${copy.cycleTeaser(plan.cycle.months, cash(plan.cycle.amount), plan.from)}</p></div>`;
    return `<article class="price-card${plan.featured ? ' is-featured' : ''}" data-plan="${plan.id}">
      <header class="price-card-head"><div class="price-tags">${tags}</div><h3>${escapeHtml(words.name)}</h3><p class="price-duration">${escapeHtml(words.tag)}</p></header>
      <div class="price-block">
        <p class="price-amount">${from}<strong>${cash(value.amount)}</strong><span>CAD${cycle ? copy.perCycle : copy.perMonth}</span></p>
        <p class="price-hours">${cycle ? copy.cycleHours(value.months, weeks) : copy.monthlyHours(weeks)}</p>
        ${detail}
      </div>
      <ul class="price-includes">${words.includes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <a class="button button-terra" href="${pages(lang).inscription}?${escapeHtml(query)}" data-chosen-plan="${escapeHtml(plan.enrollmentRhythmId)}" data-chosen-billing="${billing}" data-chosen-hours="${plan.defaultHours}" data-cta="v4-plan-${plan.id}">${copy.cta} ${arrow}</a>
    </article>`;
  }).join('\n');
}
