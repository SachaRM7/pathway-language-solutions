document.documentElement.classList.add('js');

(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const usesPathwayPalette = document.documentElement.classList.contains('brand-palette');

  // La variante Pathway conserve l'architecture C, mais précise immédiatement
  // l'objectif NCLC 7 et présente le programme comme la force de frappe principale.
  if (usesPathwayPalette) {
    const heroLabel = document.querySelector('[data-hero-label]');
    const heroTitle = document.querySelector('[data-hero-title]');
    const heroLead = document.querySelector('[data-hero-lead]');
    const honestyNote = document.querySelector('[data-honesty-note]');
    const weekTitle = document.querySelector('[data-week-title]');
    const weekCopy = document.querySelector('[data-week-copy]');
    const weekList = document.querySelector('[data-week-list]');

    if (heroLabel) heroLabel.textContent = 'Objetivo NCLC 7 · Preparación TEF Canada';
    if (heroTitle) heroTitle.innerHTML = 'Tu ruta al NCLC 7 empieza por <span>un plan que sí cabe en tu vida.</span>';
    if (heroLead) heroLead.textContent = 'Pathway mide tu nivel, define la intensidad que exige tu fecha y te acompaña con clases privadas hasta el NCLC 7 en el TEF Canada.';
    if (honestyNote) honestyNote.hidden = false;
    if (weekTitle) weekTitle.textContent = 'La intensidad que exige tu objetivo, organizada semana a semana.';
    if (weekCopy) weekCopy.textContent = 'Según tu nivel y tu fecha, trabajas 2, 4 o 6 horas por semana en clases privadas, además de una práctica guiada entre sesiones.';
    if (weekList) {
      weekList.innerHTML = `
        <li><span>Tu modalidad</span><div><strong>Clases privadas en vivo</strong><small>2, 4 o 6 horas por semana según tu plan</small></div><b>2 · 4 · 6 h</b></li>
        <li><span>Entre sesiones</span><div><strong>Práctica dirigida</strong><small>Ejercicios específicos conectados con tu última clase</small></div><b>Guiada</b></li>
        <li><span>Después de cada clase</span><div><strong>Correcciones continuas</strong><small>Feedback oral y escrito sobre tus prioridades</small></div><b>Continuo</b></li>
        <li><span>Cada etapa</span><div><strong>Control del progreso</strong><small>Objetivos semanales y simulacros antes del TEF</small></div><b>Medible</b></li>
      `;
    }
  }

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menu.dataset.open = 'false';
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.dataset.open = String(!isOpen);
  });

  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('[data-level]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-level]').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      const answer = document.querySelector('[data-level-answer]');
      if (!answer) return;
      answer.innerHTML = `<strong>${button.dataset.title}</strong><span>${button.dataset.copy}</span>`;
    });
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(element => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .1 });
    document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
  }

  const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const observedSections = sectionLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    const navigationObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: [0, .1, .5] });
    observedSections.forEach(section => navigationObserver.observe(section));
  }

  document.querySelectorAll('.faq-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.faq-list details').forEach(other => {
        if (other !== details) other.open = false;
      });
    });
  });

  document.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const setAll = (selector, value) => {
    document.querySelectorAll(selector).forEach(element => {
      element.textContent = value;
    });
  };

  if (!window.PathwayIRCC) return;

  PathwayIRCC.load()
    .then(data => {
      setAll('[data-ircc-cec-score]', data.cec.score);
      setAll('[data-ircc-french-score]', data.french.score);
      setAll('[data-ircc-difference]', Math.abs(data.cec.score - data.french.score));
      setAll('[data-draw-date]', PathwayIRCC.formatLongDate(data.french.date, 'es-ES'));

      const status = data.source === 'live'
        ? 'consulta automática activa'
        : data.source === 'cache'
          ? 'última consulta exitosa conservada'
          : 'datos de respaldo incluidos';
      setAll('[data-data-status]', status);
    })
    .catch(() => {
      setAll('[data-data-status]', 'datos de respaldo incluidos');
    });
})();
