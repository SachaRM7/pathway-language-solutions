(() => {
  const form = document.querySelector('[data-enroll-form]');
  const submit = document.querySelector('[data-submit-request]');
  const error = document.querySelector('[data-form-error]');
  const scenario = new URLSearchParams(window.location.search).get('scenario');
  const isUrgentScenario = scenario === 'urgent';
  const storedResult = JSON.parse(sessionStorage.getItem('pathwayPlacementResult') || 'null');
  const resultLevel = storedResult?.level ? `${storedResult.level} · estimado` : 'Por confirmar';
  document.querySelector('[data-summary-level]').textContent = resultLevel;
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];
  const planTimelines = {
    Esencial: { A1: 18, A2: 12, B1: 6, B2: 3 },
    Acelerado: { A1: 12, A2: 8, B1: 4, B2: 2 },
    Intensivo: { A1: 8, A2: 6, B1: 3, B2: 2 }
  };
  const effectiveLevel = levelOrder.includes(storedResult?.level) ? storedResult.level : 'A1';
  if (isUrgentScenario) {
    document.querySelector('[data-enroll-eyebrow]').textContent = 'Tu fecha primero';
    document.querySelector('[data-enroll-title]').textContent = 'Dinos cuánto tiempo tienes y cuándo puedes estudiar.';
    document.querySelector('[data-enroll-intro]').textContent = 'No tienes que elegir la intensidad a ciegas. Compararemos tu fecha, tu nivel y tus disponibilidades para recomendarte un ritmo realista antes de cualquier pago.';
    document.querySelector('[data-journey-first]').textContent = 'Fecha objetivo y disponibilidades';
    document.querySelector('[data-rhythm-section]').hidden = true;
    document.querySelector('[data-billing-section]').hidden = true;
    document.querySelector('[data-schedule-legend]').textContent = '1. Fecha y disponibilidades';
    document.querySelector('[data-contact-legend]').textContent = '2. Contacto para confirmar';
  }
  form.querySelectorAll('[name="plan"]').forEach(plan => {
    const months = planTimelines[plan.value][effectiveLevel];
    const duration = plan.closest('.choice').querySelector('[data-plan-duration]');
    if (duration) duration.textContent = `${plan.dataset.hours} · aprox. ${months} meses desde una base ${effectiveLevel}`;
    plan.dataset.duration = `aprox. ${months} meses desde ${effectiveLevel}`;
  });
  const startDate = form.querySelector('[name="startDate"]');
  startDate.min = new Date().toISOString().slice(0, 10);

  const getSelected = name => form.querySelector(`[name="${name}"]:checked`);
  const getCheckedValues = name => [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);

  const updateSummary = () => {
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    document.querySelector('[data-summary-plan]').textContent = isUrgentScenario ? 'A recomendar según tu fecha' : `${plan.value} · ${plan.dataset.hours} · ${plan.dataset.duration}`;
    document.querySelector('[data-summary-billing]').textContent = isUrgentScenario ? 'A elegir después de la recomendación' : billing.value;
    document.querySelector('[data-summary-price]').textContent = isUrgentScenario ? 'Después de confirmar el ritmo' : (billing.value === 'Ciclo' ? plan.dataset.cycle : plan.dataset.monthly);
    document.querySelector('[data-summary-schedule]').textContent = days.length || times.length ? `${days.join(', ') || 'Días por definir'} · ${times.join(', ') || 'franja por definir'}` : 'Por completar';
    document.querySelector('[data-schedule-guidance]').textContent = `Para un ritmo de ${plan.dataset.hours}, intenta proponer al menos ${plan.dataset.suggestedDays} días posibles. No tienen que convertirse todos en días de clase.`;
  };

  form.addEventListener('change', updateSummary);
  updateSummary();

  submit.addEventListener('click', () => {
    error.hidden = true;
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    if (!form.reportValidity()) return;
    if (!days.length || !times.length) {
      error.textContent = 'Selecciona al menos un día y una franja horaria.';
      error.hidden = false;
      return;
    }

    const data = new FormData(form);
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const price = billing.value === 'Ciclo' ? plan.dataset.cycle : plan.dataset.monthly;
    const message = [
      isUrgentScenario
        ? 'Hola Pathway, tengo poco tiempo antes de mi objetivo y quiero saber qué ritmo es viable según mi fecha y mis disponibilidades.'
        : 'Hola Pathway, terminé el test de placement y quiero solicitar la confirmación de un horario.',
      '',
      `Nombre: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `WhatsApp: ${data.get('phone')}`,
      `Nivel estimado: ${resultLevel}`,
      `Ritmo de referencia: ${isUrgentScenario ? 'Por recomendar según mi fecha y nivel' : `${plan.value} · ${plan.dataset.hours} · ${plan.dataset.duration}`}`,
      `Inscripción: ${isUrgentScenario ? 'Por elegir después de la recomendación' : billing.value}`,
      `Precio de referencia: ${isUrgentScenario ? 'Por confirmar' : price}`,
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
      plan: plan.value,
      hours: plan.dataset.hours,
      duration: plan.dataset.duration,
      billing: billing.value,
      price,
      timezone: data.get('timezone'),
      startDate: data.get('startDate'),
      days,
      times
    }));
    window.open(`https://wa.me/51989887516?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });
})();
