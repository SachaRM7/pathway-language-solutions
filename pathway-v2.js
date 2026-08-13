document.documentElement.classList.add('js');

(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const usesPathwayPalette = document.documentElement.classList.contains('brand-palette');

  // La variante Pathway conserve l'architecture C, mais précise immédiatement
  // l'objectif NCLC 7 et présente le programme comme la force de frappe principale.
  if (usesPathwayPalette) {
    document.title = 'NCLC 7 · Preparación TEF y TCF | Pathway';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = 'Clases privadas de francés para alcanzar NCLC 7 y preparar el TEF Canada o el TCF Canada con una intensidad adaptada a tu fecha.';

    const heroLabel = document.querySelector('[data-hero-label]');
    const heroTitle = document.querySelector('[data-hero-title]');
    const heroLead = document.querySelector('[data-hero-lead]');
    const honestyNote = document.querySelector('[data-honesty-note]');
    const weekTitle = document.querySelector('[data-week-title]');
    const weekCopy = document.querySelector('[data-week-copy]');
    const weekList = document.querySelector('[data-week-list]');
    const examLevel = document.querySelector('[data-exam-level]');
    const pricingChoice = document.querySelector('[data-pricing-choice]');
    const pricingFaq = document.querySelector('[data-pricing-faq]');
    const hoursReference = document.querySelector('[data-hours-reference]');
    const pricingReference = document.querySelector('[data-pricing-reference]');

    if (heroLabel) heroLabel.textContent = 'Objetivo NCLC 7 · Preparación TEF Canada y TCF Canada';
    if (heroTitle) heroTitle.innerHTML = 'Tu ruta al NCLC 7 empieza por <span>un plan que sí cabe en tu vida.</span>';
    if (heroLead) heroLead.textContent = 'Pathway mide tu nivel, define la intensidad que exige tu fecha y te acompaña con clases privadas hasta el NCLC 7 en el TEF Canada o el TCF Canada.';
    if (honestyNote) honestyNote.hidden = false;
    if (pricingChoice) pricingChoice.hidden = false;
    if (hoursReference) hoursReference.hidden = false;
    if (pricingReference) pricingReference.hidden = false;
    if (pricingFaq) pricingFaq.textContent = 'Sí. Puedes inscribirte mes a mes, sin permanencia, o elegir un ciclo completo con 15 % de descuento.';
    if (examLevel) {
      examLevel.dataset.title = 'Tu objetivo es el TEF o el TCF';
      examLevel.textContent = 'Preparo el TEF o el TCF';
    }
    const examCopies = {
      '[data-exam-session]': 'Expresión oral · práctica TEF / TCF',
      '[data-exam-route]': 'Dos simulacros verifican si las cuatro competencias están listas para el TEF o el TCF.',
      '[data-exam-specialty]': 'TEF Canada · TCF Canada',
      '[data-exam-faq-intro]': 'Para explicaciones más detalladas, consulta nuestras guías sobre los exámenes de francés y NCLC 7.'
    };
    Object.entries(examCopies).forEach(([selector, copy]) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = copy;
    });
    document.querySelectorAll('[data-exam-simulations]').forEach(element => {
      element.textContent = '2 simulacros TEF / TCF';
    });
    document.querySelectorAll('[data-cta="header-evaluation"], [data-cta="hero-evaluation"], [data-cta="closing-evaluation"], [data-cta="mobile-evaluation"], [data-cta^="plan-"]').forEach(link => {
      link.href = 'test-placement.html';
    });
    if (weekTitle) weekTitle.textContent = 'La intensidad que exige tu objetivo, organizada semana a semana.';
    if (weekCopy) weekCopy.textContent = 'Según tu nivel, tu fecha y tus necesidades, eliges un ritmo de 2, 4 o 6 horas* por semana en clases privadas, además de una práctica guiada entre sesiones.';
    if (weekList) {
      weekList.innerHTML = `
        <li><span>Tu modalidad</span><div><strong>Clases privadas en vivo</strong><small>2, 4 o 6 horas* por semana según tu plan</small></div><b>2 · 4 · 6 h*</b></li>
        <li><span>Entre sesiones</span><div><strong>Práctica dirigida</strong><small>Ejercicios específicos conectados con tu última clase</small></div><b>Guiada</b></li>
        <li><span>Después de cada clase</span><div><strong>Correcciones continuas</strong><small>Feedback oral y escrito sobre tus prioridades</small></div><b>Continuo</b></li>
        <li><span>Cada etapa</span><div><strong>Control del progreso</strong><small>Objetivos semanales y simulacros antes del TEF o el TCF</small></div><b>Medible</b></li>
      `;
    }

    const pricingButtons = document.querySelectorAll('[data-pricing-mode]');
    const plans = document.querySelectorAll('[data-plan]');

    const setPricingMode = mode => {
      pricingButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.pricingMode === mode));
      });

      plans.forEach(plan => {
        const price = plan.querySelector('[data-plan-price]');
        const hours = plan.querySelector('[data-plan-hours]');
        const summary = plan.querySelector('[data-cycle-summary]');
        if (!price || !hours || !summary) return;

        const isCycle = mode === 'cycle';
        plan.classList.toggle('is-cycle', isCycle);
        price.setAttribute('aria-live', 'polite');

        if (isCycle) {
          price.innerHTML = `${plan.dataset.cyclePrice} <small>CAD · ciclo completo</small>`;
          hours.innerHTML = `<strong>${plan.dataset.cycleDuration}</strong> · ${plan.dataset.cycleHours}`;
          summary.innerHTML = `<s>${plan.dataset.cycleOriginal} CAD</s><strong>Ahorras ${plan.dataset.cycleSaving} CAD</strong><span>Equivale a ${plan.dataset.cycleEquivalent} CAD al mes.</span><small>Precio de referencia: ${plan.dataset.cycleReference}.</small>`;
          summary.hidden = false;
          return;
        }

        price.innerHTML = `${plan.dataset.monthPrice} <small>CAD / mes</small>`;
        hours.textContent = plan.dataset.monthHours;
        summary.hidden = true;
      });
    };

    pricingButtons.forEach(button => {
      button.addEventListener('click', () => setPricingMode(button.dataset.pricingMode));
    });
    setPricingMode('monthly');
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

  const buildStoryCarousel = carousel => {
    const slides = [...carousel.querySelectorAll('[data-story-slide]')];
    const controls = carousel.querySelector('[data-carousel-controls]');
    if (!controls || !slides.length) return;
    let current = 0;

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'carousel-arrow carousel-prev';
    previous.setAttribute('aria-label', 'Testimonio anterior');
    previous.textContent = '←';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-arrow carousel-next';
    next.setAttribute('aria-label', 'Testimonio siguiente');
    next.textContent = '→';

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    dots.setAttribute('aria-label', 'Elegir un testimonio');

    const show = index => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== current; });
      [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    };

    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Ver testimonio ${index + 1}`);
      dot.addEventListener('click', () => show(index));
      dots.append(dot);
    });
    previous.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    controls.append(previous, dots, next);
    if (slides.length < 2) {
      previous.hidden = true;
      next.hidden = true;
    }
    show(0);
  };

  document.querySelectorAll('[data-story-carousel]').forEach(buildStoryCarousel);

  /* Ajouter les huit fichiers réels ici dès leur réception. */
  const testimonialVideos = [];
  const videoCarousel = document.querySelector('[data-video-carousel]');
  if (videoCarousel && testimonialVideos.length) {
    const video = videoCarousel.querySelector('[data-testimonial-video]');
    const poster = videoCarousel.querySelector('.video-stage > img');
    const placeholder = videoCarousel.querySelector('.video-placeholder');
    const previous = videoCarousel.querySelector('[data-video-previous]');
    const next = videoCarousel.querySelector('[data-video-next]');
    const dots = videoCarousel.querySelector('[data-video-dots]');
    const count = videoCarousel.querySelector('[data-video-count]');
    const name = videoCarousel.querySelector('[data-video-name]');
    let current = 0;

    const showVideo = index => {
      current = (index + testimonialVideos.length) % testimonialVideos.length;
      const item = testimonialVideos[current];
      video.src = item.src;
      video.poster = item.poster || '';
      video.load();
      count.textContent = `${current + 1} / ${testimonialVideos.length}`;
      name.textContent = item.name;
      [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    };

    poster.hidden = true;
    placeholder.hidden = true;
    video.hidden = false;
    previous.hidden = false;
    next.hidden = false;
    testimonialVideos.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Ver video ${index + 1}: ${item.name}`);
      dot.addEventListener('click', () => showVideo(index));
      dots.append(dot);
    });
    previous.addEventListener('click', () => showVideo(current - 1));
    next.addEventListener('click', () => showVideo(current + 1));
    video.addEventListener('ended', () => {
      showVideo(current + 1);
      video.play().catch(() => {});
    });
    showVideo(0);
  }

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
      setAll('[data-ircc-cec-date]', PathwayIRCC.formatDate(data.cec.date, 'es-ES'));
      setAll('[data-ircc-french-date]', PathwayIRCC.formatDate(data.french.date, 'es-ES'));
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
