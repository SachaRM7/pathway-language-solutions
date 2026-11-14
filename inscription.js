(() => {
  const form = document.querySelector('[data-enroll-form]');
  if (!form) return;

  /* =========================================================================
     Textos localizables. Español por defecto; las páginas FR/EN/DE inyectan
     window.PATHWAY_ENROLL antes de cargar este script. {x} = marcador.
     ========================================================================= */
  const L = Object.assign({
    lang: 'es', thanksPage: 'gracias.html',
    levelSuffix: '· estimado', byConfirm: 'Por confirmar',
    headLevel: 'Nivel {L} estimado', headLevelUnknown: 'Nivel por confirmar',
    urgentEyebrow: 'Tu fecha primero', urgentTitle: 'Dinos cuándo puedes estudiar y tu fecha objetivo.',
    urgentIntro: 'Compararemos tu fecha, tu nivel y tu disponibilidad para recomendarte un ritmo realista antes de cualquier pago.',
    noResults: 'Sin resultados',
    urgentPlan: 'A recomendar según tu fecha', urgentBilling: 'A elegir tras la recomendación', urgentPrice: 'Después de confirmar el ritmo',
    cycleReduction: '{c} · descuento directo 15 %', daysTbd: 'Días por definir', slotTbd: 'franja por definir', toComplete: 'Por completar',
    guidance: 'Para un ritmo de {h}, intenta proponer al menos {n} días posibles. No tienen que convertirse todos en días de clase.',
    required: 'Este campo es obligatorio.', badEmail: 'Escribe un correo electrónico válido.', badValue: 'Revisa este valor.',
    pickDay: 'Selecciona un día o «Cualquier día».', pickSlot: 'Selecciona al menos una franja.',
    next: 'Siguiente →', review: 'Revisar solicitud ✓', submitMobile: 'Solicitar horario', sending: 'Enviando…',
    detectedTz: 'Tu zona actual: {tz}',
    msgIntro: 'Hola Pathway, hice el test de nivel y quiero solicitar un horario.',
    msgIntroNoTest: 'Hola Pathway, quiero solicitar un horario (todavía no hice el test de nivel).',
    msgIntroUrgent: 'Hola Pathway, tengo poco tiempo antes de mi objetivo y quiero saber qué ritmo es viable.',
    msgClose: 'Entiendo que el horario y el precio final deben ser confirmados antes del pago.',
    msgRhythmUrgent: 'Por recomendar según mi fecha y nivel', msgEnrollUrgent: 'Por elegir después de la recomendación',
    toRecommend: 'Por recomendar', toChoose: 'Por elegir', fee: '15 CAD (una sola vez)', none: 'Ninguna', tbd: 'Por definir',
    colon: ':',
    lblName: 'Nombre completo', lblEmail: 'Correo', lblWa: 'WhatsApp', lblObj: 'Objetivo', lblLevel: 'Nivel estimado',
    lblRhythm: 'Ritmo de referencia', lblEnroll: 'Inscripción', lblPrice: 'Precio de referencia', lblFee: 'Cuota de inscripción: 15 CAD (una sola vez)',
    lblTz: 'Zona horaria', lblStart: 'Inicio ideal', lblDays: 'Días posibles', lblSlots: 'Franjas posibles', lblExam: 'Fecha prevista TEF / TCF Canada', lblNotes: 'Comentarios'
  }, window.PATHWAY_ENROLL || {});
  const fmt = (str, map) => String(str).replace(/\{(\w+)\}/g, (_, k) => (map && map[k] != null ? map[k] : ''));
  const line = (label, value) => `${label}${L.colon} ${value}`;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (name, data) => { try { window.PathwayAnalytics?.track(name, data); } catch (_) { /* never blocks */ } };

  /* =========================================================================
     Recepción de la solicitud (campus/db/021_solicitudes.sql): la solicitud
     queda guardada en la base de Pathway, que la ve en el Campus
     («Cuentas → Solicitudes de inscripción»). Un fallo de red nunca bloquea
     el envío por WhatsApp.
     ========================================================================= */
  const SUPABASE = { url: 'https://ynflykxalfynxoupkxmy.supabase.co', key: 'sb_publishable_e3Pa5ADDtYVU7BJilbkcxw_qaPPxtKB' };
  const firstTouch = () => { try { const t = window.PathwayCampaign?.get() || {}; return { p_campaign: t.campaign || null, p_source: t.source || null }; } catch (_) { return { p_campaign: null, p_source: null }; } };
  function saveRequest(payload) {
    try {
      const send = body => fetch(`${SUPABASE.url}/rest/v1/rpc/submit_enrollment`, {
        method: 'POST',
        headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      });
      // A database without campaign columns yet (before campus/db/023) answers 404: save without them.
      const { p_campaign, p_source, ...base } = payload;
      return send(payload).then(r => (r.status === 404 ? send(base) : r)).then(r => r.ok, () => false);
    } catch (_) { return Promise.resolve(false); }
  }

  /* ---------------- Contexto del test ---------------- */
  const scenario = new URLSearchParams(location.search).get('scenario');
  const isUrgent = scenario === 'urgent';
  let storedResult = null;
  try { storedResult = JSON.parse(sessionStorage.getItem('pathwayPlacementResult') || 'null'); } catch (_) { storedResult = null; }
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];
  const testLevel = levelOrder.includes(storedResult?.level) ? storedResult.level : '';
  const resultLevel = testLevel ? `${testLevel} ${L.levelSuffix}` : L.byConfirm;

  const q = sel => form.querySelector(sel);
  const qa = sel => [...form.querySelectorAll(sel)];
  const getSelected = name => form.querySelector(`[name="${name}"]:checked`);
  const getCheckedValues = name => qa(`[name="${name}"]:checked`).map(i => i.value);
  const tagOf = radio => radio ? (radio.dataset.tag || radio.value) : '';

  const headLevel = document.querySelector('[data-head-level]');
  if (headLevel) headLevel.textContent = testLevel ? fmt(L.headLevel, { L: testLevel }) : L.headLevelUnknown;
  const summaryLevel = document.querySelector('[data-summary-level]');
  if (summaryLevel) summaryLevel.textContent = resultLevel;

  const startDate = q('[name="startDate"]');
  if (startDate) startDate.min = new Date().toISOString().slice(0, 10);

  /* ---------------- Zona horaria: preselección según el navegador ---------------- */
  const TZ_GROUPS = {
    'America/Lima': ['America/Lima', 'America/Bogota', 'America/Guayaquil', 'America/Panama', 'America/Cancun', 'America/Jamaica'],
    'America/Mexico_City': ['America/Mexico_City', 'America/Monterrey', 'America/Merida', 'America/Chihuahua', 'America/Bahia_Banderas', 'America/Guatemala', 'America/Costa_Rica', 'America/El_Salvador', 'America/Tegucigalpa', 'America/Managua', 'America/Belize'],
    'America/Caracas': ['America/Caracas', 'America/La_Paz', 'America/Santo_Domingo', 'America/Puerto_Rico', 'America/Havana', 'America/Port_of_Spain'],
    'America/Santiago': ['America/Santiago', 'America/Asuncion'],
    'America/Argentina/Buenos_Aires': ['America/Argentina/Buenos_Aires', 'America/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza', 'America/Montevideo', 'America/Sao_Paulo'],
    'America/Toronto': ['America/Toronto', 'America/Montreal', 'America/Ottawa', 'America/New_York', 'America/Halifax', 'America/Moncton'],
    'America/Winnipeg': ['America/Winnipeg', 'America/Regina', 'America/Chicago'],
    'America/Edmonton': ['America/Edmonton', 'America/Denver'],
    'America/Vancouver': ['America/Vancouver', 'America/Los_Angeles']
  };
  const tzSelect = q('[data-tz-select]');
  if (tzSelect && !tzSelect.value) {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { tz = ''; }
    const match = Object.keys(TZ_GROUPS).find(key => TZ_GROUPS[key].includes(tz));
    if (match && tzSelect.querySelector(`option[value="${match}"]`)) tzSelect.value = match;
    else if (/^[A-Za-z_]+\/[A-Za-z_/]+$/.test(tz)) {
      const other = tzSelect.querySelector('option[value="other"]');
      const detected = new Option(fmt(L.detectedTz, { tz: tz.replace(/_/g, ' ') }), tz);
      tzSelect.insertBefore(detected, other);
      tzSelect.value = tz;
    }
  }
  const tzLabel = () => tzSelect?.selectedOptions[0]?.textContent.trim() || '';

  /* ---------------- Escenario urgente ---------------- */
  if (isUrgent) {
    document.querySelector('[data-enroll-eyebrow]')?.replaceChildren(document.createTextNode(L.urgentEyebrow));
    const t = document.querySelector('[data-enroll-title]'); if (t) t.textContent = L.urgentTitle;
    const intro = document.querySelector('[data-enroll-intro]'); if (intro) intro.textContent = L.urgentIntro;
  }

  /* ---------------- Selector de país (código en texto, sin emoji) ---------------- */
  let dn; try { dn = new Intl.DisplayNames([document.documentElement.lang || 'es'], { type: 'region' }); } catch (_) { dn = null; }
  const COUNTRIES = [
    ['PE', 'Perú', '51'], ['CO', 'Colombia', '57'], ['MX', 'México', '52'], ['AR', 'Argentina', '54'],
    ['CL', 'Chile', '56'], ['EC', 'Ecuador', '593'], ['VE', 'Venezuela', '58'], ['BO', 'Bolivia', '591'],
    ['PY', 'Paraguay', '595'], ['UY', 'Uruguay', '598'], ['CR', 'Costa Rica', '506'], ['PA', 'Panamá', '507'],
    ['GT', 'Guatemala', '502'], ['HN', 'Honduras', '504'], ['SV', 'El Salvador', '503'], ['NI', 'Nicaragua', '505'],
    ['DO', 'Rep. Dominicana', '1'], ['CU', 'Cuba', '53'], ['PR', 'Puerto Rico', '1'],
    ['CA', 'Canadá', '1'], ['US', 'Estados Unidos', '1'], ['ES', 'España', '34'], ['FR', 'Francia', '33'],
    ['BR', 'Brasil', '55'], ['PT', 'Portugal', '351'], ['IT', 'Italia', '39'], ['DE', 'Alemania', '49'],
    ['GB', 'Reino Unido', '44'], ['BE', 'Bélgica', '32'], ['CH', 'Suiza', '41'], ['NL', 'Países Bajos', '31'],
    ['IE', 'Irlanda', '353'], ['MA', 'Marruecos', '212'], ['DZ', 'Argelia', '213'], ['TN', 'Túnez', '216'],
    ['SN', 'Senegal', '221'], ['CI', 'Costa de Marfil', '225'], ['CM', 'Camerún', '237'], ['HT', 'Haití', '509'],
    ['CN', 'China', '86'], ['IN', 'India', '91'], ['PH', 'Filipinas', '63'], ['RU', 'Rusia', '7'],
    ['UA', 'Ucrania', '380'], ['RO', 'Rumanía', '40'], ['PL', 'Polonia', '48'], ['TR', 'Turquía', '90'],
    ['AU', 'Australia', '61'], ['JP', 'Japón', '81'], ['KR', 'Corea del Sur', '82']
  ];
  const cname = c => { try { return (dn && dn.of(c[0])) || c[1]; } catch (_) { return c[1]; } };
  const telRoot = document.querySelector('[data-tel-country]');
  const telToggle = document.querySelector('[data-tel-toggle]');
  const telMenu = document.querySelector('[data-tel-menu]');
  const telList = document.querySelector('[data-tel-list]');
  const telSearch = document.querySelector('[data-tel-search]');
  const telFlag = document.querySelector('[data-tel-flag]');
  const telDial = document.querySelector('[data-tel-dial]');
  const telNumber = document.querySelector('[data-tel-number]');
  const telDialInput = document.querySelector('[data-tel-dialinput]');
  const telIso = document.querySelector('[data-tel-iso]');
  let telCurrent = COUNTRIES[0];

  function applyCountry(c) {
    telCurrent = c;
    if (telFlag) telFlag.textContent = c[0];
    if (telDial) telDial.textContent = `+${c[2]}`;
    if (telDialInput) telDialInput.value = `+${c[2]}`;
    if (telIso) telIso.value = c[0];
    if (telToggle) telToggle.setAttribute('aria-label', `${telToggle.dataset.telLabel || 'WhatsApp'}: ${cname(c)} +${c[2]}`);
  }
  function renderList(filter = '') {
    const f = filter.trim().toLowerCase();
    const items = COUNTRIES.filter(c => !f || cname(c).toLowerCase().includes(f) || c[1].toLowerCase().includes(f) || c[2].includes(f) || c[0].toLowerCase() === f);
    telList.innerHTML = items.length
      ? items.map(c => `<button type="button" class="tel-opt" data-iso="${c[0]}" role="option" aria-selected="${c === telCurrent}"><span class="flag">${c[0]}</span><span class="nm">${cname(c)}</span><span class="dial">+${c[2]}</span></button>`).join('')
      : `<p class="tel-empty">${L.noResults}</p>`;
  }
  function openMenu() {
    if (!telMenu) return;
    renderList('');
    telMenu.classList.add('open');
    telToggle.setAttribute('aria-expanded', 'true');
    if (telSearch) { telSearch.value = ''; telSearch.focus(); }
  }
  function closeMenu() {
    telMenu?.classList.remove('open');
    telToggle?.setAttribute('aria-expanded', 'false');
  }
  if (telToggle) {
    applyCountry(telCurrent);
    telToggle.addEventListener('click', () => telMenu.classList.contains('open') ? closeMenu() : openMenu());
    telSearch?.addEventListener('input', () => renderList(telSearch.value));
    telList?.addEventListener('click', e => {
      const btn = e.target.closest('[data-iso]');
      if (!btn) return;
      const c = COUNTRIES.find(x => x[0] === btn.dataset.iso);
      if (c) applyCountry(c);
      closeMenu();
      telNumber?.focus();
    });
    document.addEventListener('click', e => { if (telRoot && !telRoot.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }
  const fullPhone = () => `+${telCurrent[2]} ${(telNumber?.value || '').trim()}`.trim();

  /* ---------------- Resumen en vivo ---------------- */
  const setText = (sel, val) => { const n = document.querySelector(sel); if (n) n.textContent = val; };
  const priceOf = (plan, billing) => isUrgent ? L.urgentPrice
    : (billing?.value === 'Ciclo' ? fmt(L.cycleReduction, { c: plan?.dataset.cycle }) : (plan?.dataset.monthly || L.byConfirm));
  function updateSummary() {
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    setText('[data-summary-plan]', isUrgent ? L.urgentPlan : `${tagOf(plan) || L.byConfirm} · ${plan?.dataset.hours || ''}`);
    setText('[data-summary-billing]', isUrgent ? L.urgentBilling : (tagOf(billing) || L.byConfirm));
    setText('[data-summary-price]', priceOf(plan, billing));
    setText('[data-mbar-price]', isUrgent ? L.byConfirm : (billing?.value === 'Ciclo' ? (plan?.dataset.cycle || '—').split(' · ')[0] : (plan?.dataset.monthly || '—')));
    setText('[data-summary-schedule]', (days.length || times.length) ? `${days.join(', ') || L.daysTbd} · ${times.join(', ') || L.slotTbd}` : L.toComplete);
    const guidance = document.querySelector('[data-schedule-guidance]');
    if (guidance && plan) guidance.textContent = fmt(L.guidance, { h: plan.dataset.hours, n: plan.dataset.suggestedDays });
  }

  /* ---------------- Errores de campo ---------------- */
  const clearFieldError = c => {
    if (!c) return;
    c.removeAttribute('aria-invalid');
    const id = c.dataset.errorId;
    if (id) document.getElementById(id)?.remove();
    delete c.dataset.errorId;
  };
  const markFieldError = (c, message, container) => {
    clearFieldError(c);
    const id = `err-${c.name || c.id || Math.random().toString(36).slice(2)}`;
    const node = document.createElement('span');
    node.id = id; node.className = 'field-error'; node.setAttribute('role', 'alert'); node.textContent = message;
    c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', id); c.dataset.errorId = id;
    if (container) container.after(node);
    else (c.closest('.f') || c.parentElement).append(node);
  };

  function validatePanel(idx) {
    const panel = form.querySelector(`[data-panel="${idx}"]`);
    if (!panel) return true;
    const invalid = [];
    panel.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=hidden]),select,textarea').forEach(c => {
      if (c.disabled) return;
      clearFieldError(c);
      if (!c.checkValidity()) {
        invalid.push(c);
        markFieldError(c, c.validity.valueMissing ? L.required : c.validity.typeMismatch ? L.badEmail : L.badValue, c.closest('.tel-row'));
      }
    });
    if (idx === 2) {
      if (!getCheckedValues('days').length) { const c = q('[name="days"]'); invalid.push(c); markFieldError(c, L.pickDay, panel.querySelector('[data-day-options]')); }
      if (!getCheckedValues('times').length) { const c = q('[name="times"]'); invalid.push(c); markFieldError(c, L.pickSlot, panel.querySelector('[data-time-options]')); }
    }
    if (invalid.length) {
      const card = form; card.classList.remove('has-validation-error'); void card.offsetWidth; card.classList.add('has-validation-error');
      setTimeout(() => card.classList.remove('has-validation-error'), 520);
      invalid[0]?.focus?.({ preventScroll: true });
      invalid[0]?.scrollIntoView?.({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  /* ---------------- Stepper ---------------- */
  const flow = isUrgent ? [2, 3] : [0, 1, 2, 3];
  const railItems = [...document.querySelectorAll('[data-steps] li')];
  railItems.forEach(li => {
    const idx = +li.dataset.step;
    const pos = flow.indexOf(idx);
    if (pos === -1) { li.style.display = 'none'; }
    else { li.querySelector('.num').textContent = pos + 1; }
  });
  const prevBtn = q('[data-prev]');
  const nextBtn = q('[data-next]');
  const mbarBtn = document.querySelector('[data-mbar-action]');
  const rail = document.querySelector('[data-steps]');
  let cur = 0;

  function render(moved = false) {
    flow.forEach((panelIdx, i) => {
      const p = form.querySelector(`[data-panel="${panelIdx}"]`);
      p?.classList.toggle('on', i === cur);
      const li = railItems.find(l => +l.dataset.step === panelIdx);
      li?.classList.toggle('active', i === cur);
      li?.classList.toggle('done', i < cur);
      if (li) { if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); }
    });
    prevBtn.disabled = cur === 0;
    const lastStep = cur === flow.length - 1;
    nextBtn.textContent = lastStep ? L.review : L.next;
    if (mbarBtn) mbarBtn.textContent = lastStep ? L.submitMobile : L.next;
    if (!moved) return;
    // The next step starts at the top of the form (below the fixed header), not at the top of the page.
    (rail || form).scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    form.querySelector(`[data-panel="${flow[cur]}"] > legend`)?.focus({ preventScroll: true });
  }
  function goTo(i) { cur = Math.max(0, Math.min(flow.length - 1, i)); render(true); }

  nextBtn.addEventListener('click', () => {
    if (!validatePanel(flow[cur])) return;
    if (cur < flow.length - 1) goTo(cur + 1);
    else document.querySelector('[data-submit-request]')?.focus();
  });
  prevBtn.addEventListener('click', () => goTo(cur - 1));
  mbarBtn?.addEventListener('click', () => {
    if (cur < flow.length - 1) { if (validatePanel(flow[cur])) goTo(cur + 1); }
    else submitRequest();
  });
  railItems.forEach(li => li.addEventListener('click', () => {
    const pos = flow.indexOf(+li.dataset.step);
    if (pos === -1 || pos === cur) return;
    if (pos > cur && !validatePanel(flow[cur])) return;
    goTo(pos);
  }));

  // A day or slot error belongs to the whole group: any box of the group clears it.
  const clearGroupError = target => {
    if (target.type === 'checkbox' && (target.name === 'days' || target.name === 'times')) clearFieldError(q(`[name="${target.name}"]`));
    else clearFieldError(target);
  };
  form.addEventListener('change', e => { if (e.target.matches('input,select,textarea')) clearGroupError(e.target); updateSummary(); });
  form.addEventListener('input', e => { if (e.target.matches('input,select,textarea')) clearGroupError(e.target); });

  /* ---------------- Envío ---------------- */
  let sending = false;
  function submitRequest() {
    if (sending) return;
    for (let i = 0; i < flow.length; i++) {
      if (!validatePanel(flow[i])) { goTo(i); return; }
    }
    const data = new FormData(form);
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const price = isUrgent ? L.byConfirm : (billing?.value === 'Ciclo' ? plan?.dataset.cycle : plan?.dataset.monthly);
    const phone = fullPhone();
    const rhythmLine = isUrgent ? L.msgRhythmUrgent : `${tagOf(plan)} · ${plan?.dataset.hours} · ${plan?.dataset.duration}`;
    const enrollLine = isUrgent ? L.msgEnrollUrgent : tagOf(billing);
    const timezone = tzLabel();

    const saved = saveRequest({
      p_name: String(data.get('name') || '').trim(),
      p_email: String(data.get('email') || '').trim().toLowerCase(),
      p_whatsapp: phone,
      p_objective: String(data.get('objective') || '').trim(),
      p_level: testLevel || null,
      p_plan: isUrgent ? null : plan?.value || null,
      p_hours: isUrgent ? null : (Number(plan?.dataset.h) || null),
      p_billing: isUrgent ? null : billing?.value || null,
      p_timezone: timezone,
      p_start_date: data.get('startDate') || null,
      p_days: days,
      p_times: times,
      p_exam_date: data.get('examDate') || null,
      p_comments: String(data.get('scheduleNote') || '').trim() || null,
      p_lang: ['es', 'fr', 'en', 'de'].includes(L.lang) ? L.lang : 'es',
      // First touch (campaign.js): where this visitor first came from, if known.
      ...firstTouch()
    });

    try {
      sessionStorage.setItem('pathwayEnrollmentRequest', JSON.stringify({
        level: resultLevel, objective: data.get('objective'),
        plan: tagOf(plan) || L.toRecommend, hours: plan?.dataset.hours || L.byConfirm,
        duration: plan?.dataset.duration || L.byConfirm, billing: tagOf(billing) || L.byConfirm,
        price, registrationFee: L.fee, phone,
        timezone, startDate: data.get('startDate'), days, times
      }));
    } catch (_) { /* the WhatsApp message still opens */ }

    const message = [
      isUrgent ? L.msgIntroUrgent : (testLevel ? L.msgIntro : L.msgIntroNoTest),
      '',
      line(L.lblName, data.get('name')),
      line(L.lblEmail, data.get('email')),
      line(L.lblWa, phone),
      line(L.lblObj, data.get('objective')),
      line(L.lblLevel, testLevel || L.byConfirm),
      line(L.lblRhythm, rhythmLine),
      line(L.lblEnroll, enrollLine),
      line(L.lblPrice, price),
      L.lblFee,
      line(L.lblTz, timezone),
      line(L.lblStart, data.get('startDate')),
      line(L.lblDays, days.join(', ')),
      line(L.lblSlots, times.join(', ')),
      line(L.lblExam, data.get('examDate') || L.tbd),
      line(L.lblNotes, data.get('scheduleNote') || L.none),
      '',
      L.msgClose
    ].join('\n');
    const whatsappUrl = `https://wa.me/51989887516?text=${encodeURIComponent(message)}`;
    try { sessionStorage.setItem('pathwayWhatsAppUrl', whatsappUrl); } catch (_) { /* the thanks page keeps a plain WhatsApp link */ }
    const opened = window.open(whatsappUrl, '_blank');
    if (opened) { try { opened.opener = null; } catch (_) { /* cross-origin already */ } }
    track('enrollment_whatsapp_prepared', { plan: plan?.value || '', billing: billing?.value || '' });

    // Then the thanks page (it can reopen WhatsApp). The request has a moment to reach Pathway;
    // a failed save is only logged and never blocks the student.
    sending = true;
    document.querySelectorAll('[data-submit-request]').forEach(b => { b.disabled = true; b.textContent = L.sending; });
    if (mbarBtn) { mbarBtn.disabled = true; mbarBtn.textContent = L.sending; }
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 2500));
    Promise.race([saved, timeout]).then(ok => {
      if (ok === false) track('enrollment_save_failed');
      location.href = `${L.thanksPage}?channel=whatsapp&from=inscription${ok === true ? '&saved=1' : ''}${opened ? '' : '&blocked=1'}`;
    });
  }
  document.querySelectorAll('[data-submit-request]').forEach(b => b.addEventListener('click', submitRequest));
  // Back from the thanks page (page cache): the buttons work again.
  const submitLabels = [...document.querySelectorAll('[data-submit-request]')].map(b => b.textContent);
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    sending = false;
    document.querySelectorAll('[data-submit-request]').forEach((b, i) => { b.disabled = false; b.textContent = submitLabels[i]; });
    if (mbarBtn) mbarBtn.disabled = false;
    render();
  });

  const sumDetails = document.querySelector('.sum details');
  if (sumDetails && matchMedia('(max-width:640px)').matches) sumDetails.removeAttribute('open');

  updateSummary();
  render();
})();
