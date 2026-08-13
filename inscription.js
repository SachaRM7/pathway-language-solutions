(() => {
  const form = document.querySelector('[data-enroll-form]');
  const submit = document.querySelector('[data-submit-request]');
  const error = document.querySelector('[data-form-error]');
  const storedResult = JSON.parse(sessionStorage.getItem('pathwayPlacementResult') || 'null');
  const resultLevel = storedResult?.level ? `${storedResult.level} · estimado` : 'Por confirmar';
  document.querySelector('[data-summary-level]').textContent = resultLevel;
  const startDate = form.querySelector('[name="startDate"]');
  startDate.min = new Date().toISOString().slice(0, 10);

  const getSelected = name => form.querySelector(`[name="${name}"]:checked`);
  const getCheckedValues = name => [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);

  const updateSummary = () => {
    const plan = getSelected('plan');
    const billing = getSelected('billing');
    const days = getCheckedValues('days');
    const times = getCheckedValues('times');
    document.querySelector('[data-summary-plan]').textContent = `${plan.value} · ${plan.dataset.hours}`;
    document.querySelector('[data-summary-billing]').textContent = billing.value;
    document.querySelector('[data-summary-price]').textContent = billing.value === 'Ciclo' ? plan.dataset.cycle : plan.dataset.monthly;
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
      'Hola Pathway, terminé el test de placement y quiero solicitar la confirmación de un horario.',
      '',
      `Nombre: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `WhatsApp: ${data.get('phone')}`,
      `Nivel estimado: ${resultLevel}`,
      `Ritmo de referencia: ${plan.value} · ${plan.dataset.hours}`,
      `Inscripción: ${billing.value}`,
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
      plan: plan.value,
      hours: plan.dataset.hours,
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
