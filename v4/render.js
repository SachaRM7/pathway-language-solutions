import { PRICING } from './content.js';
import { pages, t } from './i18n.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const money = (amount, lang = 'es') => new Intl.NumberFormat(t(lang).locale, { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2, useGrouping: 'always' }).format(amount);
const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';

// One card per pace (Esencial, Acelerado, Intensivo). A pace with two
// intensities (3 or 4 h, 5 or 6 h) lets the visitor pick the hours in the
// card; the price follows. The button opens the enrolment form of the page
// language with pace, billing and hours preselected
// (/inscription.html?plan=Acelerado&billing=Mensual&hours=4).
export function renderPricing(mode = 'monthly', lang = 'es', chosenHours = {}) {
  const cycle = mode === 'cycle';
  const copy = t(lang).pricing;
  const cash = amount => money(amount, lang);
  return PRICING.plans.map(plan => {
    const words = copy.plans[plan.id];
    const billing = cycle ? 'Ciclo' : 'Mensual';
    const hours = plan.options.some(item => item.hoursPerWeek === chosenHours[plan.id]) ? chosenHours[plan.id] : plan.defaultHours;
    const option = plan.options.find(item => item.hoursPerWeek === hours);
    const query = new URLSearchParams({ plan: plan.enrollmentRhythmId, billing, hours: String(hours) });
    const badge = plan.featured ? `<span class="plan-badge">${escapeHtml(copy.featured)}</span>` : '';
    const chips = plan.options.length > 1
      ? `<div class="plan-hours" role="group" aria-label="${escapeHtml(copy.hoursGroup(words.name))}">${plan.options.map(item => `<button type="button" data-plan-hours="${plan.id}" data-h="${item.hoursPerWeek}" aria-pressed="${item.hoursPerWeek === hours}">${item.hoursPerWeek} ${copy.hoursUnit}</button>`).join('')}</div>`
      : `<div class="plan-hours"><span>${hours} ${copy.hoursUnit}</span></div>`;
    const amount = cycle ? option.cycle.amount : option.monthly;
    const sub = cycle ? copy.cycleSub(option.cycle.months, cash(option.cycle.saving)) : copy.monthlySub;
    return `<article class="price-card${plan.featured ? ' is-featured' : ''}" data-plan="${plan.id}">
      <div class="plan-top"><h3>${escapeHtml(words.name)}</h3>${badge}</div>
      <p class="plan-for">${escapeHtml(copy.for[plan.id])}</p>
      ${chips}
      <p class="plan-price"><strong>${cash(amount)}</strong><span>CAD</span></p>
      <p class="plan-sub">${sub}</p>
      <a class="button plan-cta" href="${pages(lang).inscription}?${escapeHtml(query)}" data-chosen-plan="${escapeHtml(plan.enrollmentRhythmId)}" data-chosen-billing="${billing}" data-chosen-hours="${hours}" data-cta="v4-plan-${plan.id}">${escapeHtml(copy.choose(words.name))} ${arrow}</a>
      <dl class="plan-facts">
        <div><dt>${copy.facts.hoursMonth}</dt><dd>${option.hoursPerMonth} h</dd></div>
        <div><dt>${copy.facts.level}</dt><dd>${copy.months(plan.cycle.months)}</dd></div>
        <div><dt>${copy.facts.path}</dt><dd>${copy.path[plan.id]}</dd></div>
      </dl>
    </article>`;
  }).join('\n');
}
