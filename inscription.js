(() => {
  const form = document.querySelector('[data-enroll-form]');
  const submit = document.querySelector('[data-submit-request]');
  const error = document.querySelector('[data-form-error]');
  if (!form || !submit) return;

  const scenario = new URLSearchParams(window.location.search).get('scenario');
  const isUrgentScenario = scenario === 'urgent';
  const storedResult = JSON.parse(sessionStorage.getItem('pathwayPlacementResult') || 'null');
  const resultLevel = storedResult?.level ? `${storedResult.level} · estimado` : 'Por confirmar';
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];
  const effectiveLevel = levelOrder.includes(storedResult?.level) ? storedResult.level : 'A1';
  const planTimelines = {
    Esencial: { A1: 12, A2: 9, B1: 7, B2: 5 },
    'Acelerado 3h': { A1: 8, A2: 6, B1: 4, B2: 3 },
    Acelerado: { A1: 6, A2: 5, B1: 4, B2: 3 },
    'Intensivo 5h': { A1: 5, A2: 4, B1: 3, B2: 2 },
    Intensivo: { A1: 4, A2: 3, B1: 2, B2: 2 }
  };

  const summaryLevel = document.querySelector('[data-summary-level]');
  if (summaryLevel) summaryLevel.textContent = resultLevel;

  if (isUrgentScenario) {
    document.querySelector('[data-enroll-eyebrow]').textContent = 'Tu fecha primero';
    document.querySelector('[data-enroll-title]').textContent = 'Dinos cuánto tiempo tienes y cuándo puedes estudiar.';
    document.querySelector('[data-enroll-intro]').textContent = 'No tienes que elegir la intensidad a ciegas. Compararemos tu fecha, tu nivel y tus disponibilidades para recomendarte un ritmo realista antes de cualquier pago.';
    document.querySelector('[data-journey-first]').textContent = 'Fecha objetivo y disponibilidades';
    document.querySelector('[data-rhythm-section]').hidden = true;
    document.querySelector('[data-billing-section]').hidden = true;
    document.querySelector('[data-rhythm-section]').querySelectorAll('input,select,textarea').forEach(control => { control.disabled = true; });
    document.querySelector('[data-billing-section]').querySelectorAll('input,select,textarea').forEach(control => { control.disabled = true; });
    document.querySelector('[data-schedule-legend]').textContent = '1. Fecha y disponibilidades';
    document.querySelector('[data-contact-legend]').textContent = '2. Contacto para confirmar';
  }

  form.querySelectorAll('[name="plan"]').forEach(plan => {
    const months = planTimelines[plan.value]?.[effectiveLevel] || 6;
    const duration = plan.closest('.choice')?.querySelector('[data-plan-duration]');
    if (duration) duration.textContent = `${plan.dataset.hours} · aprox. ${months} meses desde ${effectiveLevel}`;
    plan.dataset.duration = `aprox. ${months} meses desde ${effectiveLevel}`;
  });

  const startDate = form.querySelector('[name="startDate"]');
  if (startDate) startDate.min = new Date().toISOString().slice(0, 10);
  const getSelected = name => form.querySelector(`[name="${name}"]:checked`);
  const getCheckedValues = name => [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);

  const updateSummary = () => {
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    const summaryPlan = document.querySelector('[data-summary-plan]');
    const summaryBilling = document.querySelector('[data-summary-billing]');
    const summaryPrice = document.querySelector('[data-summary-price]');
    const summarySchedule = document.querySelector('[data-summary-schedule]');
    if (summaryPlan) summaryPlan.textContent = isUrgentScenario ? 'A recomendar según tu fecha' : `${plan?.value || 'Por confirmar'} · ${plan?.dataset.hours || ''} · ${plan?.dataset.duration || ''}`;
    if (summaryBilling) summaryBilling.textContent = isUrgentScenario ? 'A elegir después de la recomendación' : (billing?.value || 'Por confirmar');
    if (summaryPrice) summaryPrice.textContent = isUrgentScenario ? 'Después de confirmar el ritmo' : (billing?.value === 'Ciclo' ? `${plan.dataset.cycle} · reducción directa 15 %` : plan?.dataset.monthly || 'Por confirmar');
    if (summarySchedule) summarySchedule.textContent = days.length || times.length ? `${days.join(', ') || 'Días por definir'} · ${times.join(', ') || 'franja por definir'}` : 'Por completar';
    const guidance = document.querySelector('[data-schedule-guidance]');
    if (guidance && plan) guidance.textContent = `Para un ritmo de ${plan.dataset.hours}, intenta proponer al menos ${plan.dataset.suggestedDays} días posibles. No tienen que convertirse todos en días de clase.`;
  };

  const clearFieldError = control => {
    control.removeAttribute('aria-invalid');
    const errorId = control.dataset.errorId;
    if (errorId) document.getElementById(errorId)?.remove();
    delete control.dataset.errorId;
  };

  const markFieldError = (control, message) => {
    clearFieldError(control);
    const id = `field-error-${control.name || control.id || Math.random().toString(36).slice(2)}`;
    const messageNode = document.createElement('span');
    messageNode.id = id;
    messageNode.className = 'field-error';
    messageNode.setAttribute('role', 'alert');
    messageNode.textContent = message;
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', id);
    control.dataset.errorId = id;
    control.closest('.field, .check-grid, .form-section')?.append(messageNode);
    return messageNode;
  };

  const validate = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach(clearFieldError);
    error.hidden = true;
    const invalid = [];
    form.querySelectorAll('input,select,textarea').forEach(control => {
      if (control.disabled || control.type === 'radio' || control.type === 'checkbox') return;
      if (!control.checkValidity()) {
        invalid.push(control);
        const message = control.validity.valueMissing ? 'Este campo es obligatorio.' : control.validity.typeMismatch ? 'Escribe un email válido.' : 'Revisa este valor.';
        markFieldError(control, message);
      }
    });
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    if (!days.length) {
      const dayControl = form.querySelector('[name="days"]');
      invalid.push(dayControl);
      markFieldError(dayControl, 'Selecciona un día o “Cualquier día”.');
    }
    if (!times.length) {
      const timeControl = form.querySelector('[name="times"]');
      invalid.push(timeControl);
      markFieldError(timeControl, 'Selecciona al menos una franja horaria.');
    }
    if (!invalid.length) return true;
    const first = invalid[0];
    form.classList.remove('has-validation-error');
    void form.offsetWidth;
    form.classList.add('has-validation-error');
    window.setTimeout(() => form.classList.remove('has-validation-error'), 520);
    first?.focus({ preventScroll: true });
    first?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    return false;
  };

  form.addEventListener('change', event => {
    if (event.target.matches('input,select,textarea')) clearFieldError(event.target);
    updateSummary();
  });
  form.addEventListener('input', event => {
    if (event.target.matches('input,select,textarea')) clearFieldError(event.target);
  });
  updateSummary();

  submit.addEventListener('click', () => {
    if (!validate()) return;
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    const data = new FormData(form);
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const price = isUrgentScenario ? 'Por confirmar' : (billing?.value === 'Ciclo' ? plan.dataset.cycle : plan.dataset.monthly);
    const message = [
      isUrgentScenario ? 'Hola Pathway, tengo poco tiempo antes de mi objetivo y quiero saber qué ritmo es viable.' : 'Hola Pathway, terminé el test de placement y quiero solicitar la confirmación de un horario.',
      '',
      `Nombre completo: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `WhatsApp: ${data.get('phone')}`,
      `Objetivo: ${data.get('objective')}`,
      `Nivel estimado: ${resultLevel}`,
      `Ritmo de referencia: ${isUrgentScenario ? 'Por recomendar según mi fecha y nivel' : `${plan.value} · ${plan.dataset.hours} · ${plan.dataset.duration}`}`,
      `Inscripción: ${isUrgentScenario ? 'Por elegir después de la recomendación' : billing.value}`,
      `Precio de referencia: ${price}`,
      `Zona horaria: ${data.get('timezone')}`,
      `Inicio ideal: ${data.get('startDate')}`,
      `Días posibles: ${days.join(', ')}`,
      `Franjas posibles: ${times.join(', ')}`,
      `Fecha objetivo TEF/TCF: ${data.get('examDate') || 'Por definir'}`,
      `Precisiones: ${data.get('scheduleNote') || 'Ninguna'}`,
      '',
      'Entiendo que el horario y el precio final deben ser confirmados antes del pago.'
    ].join('\n');
    sessionStorage.setItem('pathwayEnrollmentRequest', JSON.stringify({
      level: resultLevel,
      objective: data.get('objective'),
      plan: plan?.value || 'Por recomendar',
      hours: plan?.dataset.hours || 'Por confirmar',
      duration: plan?.dataset.duration || 'Por confirmar',
      billing: billing?.value || 'Por confirmar',
      price,
      timezone: data.get('timezone'),
      startDate: data.get('startDate'),
      days,
      times
    }));
    const destination = `https://wa.me/51989887516?text=${encodeURIComponent(message)}`;
    window.open(destination, '_blank', 'noopener');
  });
})();
