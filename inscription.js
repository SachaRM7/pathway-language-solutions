(() => {
  const form = document.querySelector('[data-enroll-form]');
  if (!form) return;
  const error = document.querySelector('[data-form-error]');

  /* =========================================================================
     Textos localizables. Español por defecto; las páginas FR/EN/DE inyectan
     window.PATHWAY_ENROLL antes de cargar este script. {x} = marcador.
     ========================================================================= */
  const L = Object.assign({
    levelSuffix: '· estimado', byConfirm: 'Por confirmar',
    headLevel: 'Nivel {L} estimado', headLevelUnknown: 'Nivel por confirmar',
    durationA1: 'ciclo de {m} meses desde A1', durationOther: 'aprox. {m} meses desde {L}',
    urgentEyebrow: 'Tu fecha primero', urgentTitle: 'Dinos cuándo puedes estudiar y tu fecha objetivo.',
    urgentIntro: 'Compararemos tu fecha, tu nivel y tus disponibilidades para recomendarte un ritmo realista antes de cualquier pago.',
    noResults: 'Sin resultados',
    urgentPlan: 'A recomendar según tu fecha', urgentBilling: 'A elegir tras la recomendación', urgentPrice: 'Después de confirmar el ritmo',
    cycleReduction: '{c} · reducción directa 15 %', daysTbd: 'Días por definir', slotTbd: 'franja por definir', toComplete: 'Por completar',
    guidance: 'Para un ritmo de {h}, intenta proponer al menos {n} días posibles. No tienen que convertirse todos en días de clase.',
    required: 'Este campo es obligatorio.', badEmail: 'Escribe un email válido.', badValue: 'Revisa este valor.',
    pickDay: 'Selecciona un día o “Cualquier día”.', pickSlot: 'Selecciona al menos una franja.',
    next: 'Siguiente →', review: 'Revisar solicitud ✓', submitMobile: 'Solicitar horario',
    msgIntro: 'Hola Pathway, terminé el test de placement y quiero solicitar la confirmación de un horario.',
    msgIntroUrgent: 'Hola Pathway, tengo poco tiempo antes de mi objetivo y quiero saber qué ritmo es viable.',
    msgClose: 'Entiendo que el horario y el precio final deben ser confirmados antes del pago.',
    msgRhythmUrgent: 'Por recomendar según mi fecha y nivel', msgEnrollUrgent: 'Por elegir después de la recomendación',
    toRecommend: 'Por recomendar', toChoose: 'Por elegir', fee: '15 CAD (una sola vez)', none: 'Ninguna', tbd: 'Por definir',
    lblName: 'Nombre completo', lblEmail: 'Email', lblWa: 'WhatsApp', lblObj: 'Objetivo', lblLevel: 'Nivel estimado',
    lblRhythm: 'Ritmo de referencia', lblEnroll: 'Inscripción', lblPrice: 'Precio de referencia', lblFee: 'Cuota de inscripción: 15 CAD (una sola vez)',
    lblTz: 'Zona horaria', lblStart: 'Inicio ideal', lblDays: 'Días posibles', lblSlots: 'Franjas posibles', lblExam: 'Fecha objetivo TEF/TCF', lblNotes: 'Precisiones'
  }, window.PATHWAY_ENROLL || {});
  const fmt = (str, map) => String(str).replace(/\{(\w+)\}/g, (_, k) => (map && map[k] != null ? map[k] : ''));

  /* =========================================================================
     HubSpot — punto de conexión del CRM.
     Rellena portalId/formId con el bloque "Embed" de tu formulario HubSpot
     y el envío al CRM se activa automáticamente (además de WhatsApp).
       region: 'na1' -> app.hubspot.com | 'eu1' -> app-eu1.hubspot.com
     Mientras portalId/formId estén vacíos, no se envía nada al CRM (solo WhatsApp).
     ========================================================================= */
  const HUBSPOT = Object.assign({ portalId: '', formId: '', region: 'na1' }, window.PATHWAY_HUBSPOT || {});

  function submitToHubspot(fields) {
    if (!HUBSPOT.portalId || !HUBSPOT.formId) return;
    const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT.portalId}/${HUBSPOT.formId}`;
    const payload = {
      fields: Object.entries(fields).map(([name, value]) => ({ name, value: String(value ?? '') })),
      context: { pageUri: location.href, pageName: document.title }
    };
    try {
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
    } catch (_) { /* nunca bloquea el flujo WhatsApp */ }
  }

  /* ---------------- Contexto del test ---------------- */
  const scenario = new URLSearchParams(location.search).get('scenario');
  const isUrgent = scenario === 'urgent';
  const storedResult = JSON.parse(sessionStorage.getItem('pathwayPlacementResult') || 'null');
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];
  const resultLevel = storedResult?.level ? `${storedResult.level} ${L.levelSuffix}` : L.byConfirm;
  const effectiveLevel = levelOrder.includes(storedResult?.level) ? storedResult.level : 'A1';
  const planTimelines = {
    Esencial: { A1: 6, A2: 9, B1: 7, B2: 5 },
    'Acelerado 3h': { A1: 5, A2: 6, B1: 4, B2: 3 },
    Acelerado: { A1: 5, A2: 5, B1: 4, B2: 3 },
    'Intensivo 5h': { A1: 4, A2: 4, B1: 3, B2: 2 },
    Intensivo: { A1: 4, A2: 3, B1: 2, B2: 2 }
  };

  const q = sel => form.querySelector(sel);
  const qa = sel => [...form.querySelectorAll(sel)];
  const getSelected = name => form.querySelector(`[name="${name}"]:checked`);
  const getCheckedValues = name => qa(`[name="${name}"]:checked`).map(i => i.value);
  const tagOf = radio => radio ? (radio.dataset.tag || radio.value) : '';

  const headLevel = document.querySelector('[data-head-level]');
  if (headLevel) headLevel.textContent = storedResult?.level ? fmt(L.headLevel, { L: storedResult.level }) : L.headLevelUnknown;
  const summaryLevel = document.querySelector('[data-summary-level]');
  if (summaryLevel) summaryLevel.textContent = resultLevel;

  // Duración de cada plan según el nivel estimado
  qa('[name="plan"]').forEach(plan => {
    const months = planTimelines[plan.value]?.[effectiveLevel] || 6;
    const label = effectiveLevel === 'A1' ? fmt(L.durationA1, { m: months }) : fmt(L.durationOther, { m: months, L: effectiveLevel });
    const node = plan.closest('.opt')?.querySelector('[data-plan-duration]');
    if (node) node.textContent = label;
    plan.dataset.duration = label;
  });

  const startDate = q('[name="startDate"]');
  if (startDate) startDate.min = new Date().toISOString().slice(0, 10);

  /* ---------------- Escenario urgente ---------------- */
  if (isUrgent) {
    document.querySelector('[data-enroll-eyebrow]')?.replaceChildren(document.createTextNode(L.urgentEyebrow));
    const t = document.querySelector('[data-enroll-title]'); if (t) t.textContent = L.urgentTitle;
    const intro = document.querySelector('[data-enroll-intro]'); if (intro) intro.textContent = L.urgentIntro;
  }

  /* ---------------- Selector de país (2 bloques) ---------------- */
  const flag = iso => iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  // Nombres de país localizados automáticamente según el idioma de la página
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
    if (telFlag) telFlag.textContent = flag(c[0]);
    if (telDial) telDial.textContent = `+${c[2]}`;
    if (telDialInput) telDialInput.value = `+${c[2]}`;
    if (telIso) telIso.value = c[0];
  }
  function renderList(filter = '') {
    const f = filter.trim().toLowerCase();
    const items = COUNTRIES.filter(c => !f || cname(c).toLowerCase().includes(f) || c[1].toLowerCase().includes(f) || c[2].includes(f) || c[0].toLowerCase() === f);
    telList.innerHTML = items.length
      ? items.map(c => `<button type="button" class="tel-opt" data-iso="${c[0]}" role="option"><span class="flag">${flag(c[0])}</span><span class="nm">${cname(c)}</span><span class="dial">+${c[2]}</span></button>`).join('')
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
  function updateSummary() {
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    const price = isUrgent ? L.urgentPrice
      : (billing?.value === 'Ciclo' ? fmt(L.cycleReduction, { c: plan?.dataset.cycle }) : (plan?.dataset.monthly || L.byConfirm));
    setText('[data-summary-plan]', isUrgent ? L.urgentPlan : `${tagOf(plan) || L.byConfirm} · ${plan?.dataset.hours || ''}`);
    setText('[data-summary-billing]', isUrgent ? L.urgentBilling : (tagOf(billing) || L.byConfirm));
    setText('[data-summary-price]', price);
    setText('[data-mbar-price]', isUrgent ? L.byConfirm : (plan?.dataset.monthly || '—'));
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
    (container || c.closest('.f') || c.parentElement).append(node);
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
        markFieldError(c, c.validity.valueMissing ? L.required : c.validity.typeMismatch ? L.badEmail : L.badValue);
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
      invalid[0]?.scrollIntoView?.({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
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
  let cur = 0;

  function render() {
    flow.forEach((panelIdx, i) => {
      const p = form.querySelector(`[data-panel="${panelIdx}"]`);
      p?.classList.toggle('on', i === cur);
      const li = railItems.find(l => +l.dataset.step === panelIdx);
      li?.classList.toggle('active', i === cur);
      li?.classList.toggle('done', i < cur);
    });
    prevBtn.disabled = cur === 0;
    const lastStep = cur === flow.length - 1;
    nextBtn.textContent = lastStep ? L.review : L.next;
    if (mbarBtn) mbarBtn.textContent = lastStep ? L.submitMobile : L.next;
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function goTo(i) { cur = Math.max(0, Math.min(flow.length - 1, i)); render(); }

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
    if (pos === -1) return;
    if (pos > cur && !validatePanel(flow[cur])) return;
    goTo(pos);
  }));

  form.addEventListener('change', e => { if (e.target.matches('input,select,textarea')) clearFieldError(e.target); updateSummary(); });
  form.addEventListener('input', e => { if (e.target.matches('input,select,textarea')) clearFieldError(e.target); });

  /* ---------------- Envío ---------------- */
  function submitRequest() {
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

    submitToHubspot({
      firstname: data.get('name'), email: data.get('email'), phone,
      message: [
        `${L.lblLevel}: ${storedResult?.level || L.byConfirm}`,
        `${L.lblObj}: ${data.get('objective')}`,
        `${L.lblRhythm}: ${isUrgent ? L.toRecommend : rhythmLine}`,
        `${L.lblEnroll}: ${isUrgent ? L.toChoose : enrollLine}`,
        `${L.lblPrice}: ${price}`,
        `${L.lblTz}: ${data.get('timezone')}`,
        `${L.lblStart}: ${data.get('startDate')}`,
        `${L.lblDays}: ${days.join(', ')}`,
        `${L.lblSlots}: ${times.join(', ')}`,
        `${L.lblExam}: ${data.get('examDate') || L.tbd}`,
        `${L.lblNotes}: ${data.get('scheduleNote') || L.none}`
      ].join('\n')
    });

    sessionStorage.setItem('pathwayEnrollmentRequest', JSON.stringify({
      level: resultLevel, objective: data.get('objective'),
      plan: tagOf(plan) || L.toRecommend, hours: plan?.dataset.hours || L.byConfirm,
      duration: plan?.dataset.duration || L.byConfirm, billing: tagOf(billing) || L.byConfirm,
      price, registrationFee: L.fee, phone,
      timezone: data.get('timezone'), startDate: data.get('startDate'), days, times
    }));

    const message = [
      isUrgent ? L.msgIntroUrgent : L.msgIntro,
      '',
      `${L.lblName}: ${data.get('name')}`,
      `${L.lblEmail}: ${data.get('email')}`,
      `${L.lblWa}: ${phone}`,
      `${L.lblObj}: ${data.get('objective')}`,
      `${L.lblLevel}: ${storedResult?.level || L.byConfirm}`,
      `${L.lblRhythm}: ${rhythmLine}`,
      `${L.lblEnroll}: ${enrollLine}`,
      `${L.lblPrice}: ${price}`,
      L.lblFee,
      `${L.lblTz}: ${data.get('timezone')}`,
      `${L.lblStart}: ${data.get('startDate')}`,
      `${L.lblDays}: ${days.join(', ')}`,
      `${L.lblSlots}: ${times.join(', ')}`,
      `${L.lblExam}: ${data.get('examDate') || L.tbd}`,
      `${L.lblNotes}: ${data.get('scheduleNote') || L.none}`,
      '',
      L.msgClose
    ].join('\n');
    window.open(`https://wa.me/51989887516?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }
  document.querySelectorAll('[data-submit-request]').forEach(b => b.addEventListener('click', submitRequest));

  const sumDetails = document.querySelector('.sum details');
  if (sumDetails && matchMedia('(max-width:640px)').matches) sumDetails.removeAttribute('open');

  updateSummary();
  render();
})();
