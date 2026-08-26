document.documentElement.classList.add('js');

(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const usesPathwayPalette = document.documentElement.classList.contains('brand-palette');
  const homeCopy = window.PathwayHomeCopy || {};
  const copy = (key, fallback) => homeCopy[key] ?? fallback;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // La variante Pathway conserve l'architecture C, mais précise immédiatement
  // l'objectif NCLC 7 et présente le programme comme la force de frappe principale.
  if (usesPathwayPalette) {
    document.title = copy('title', 'NCLC 7 · Preparación TEF y TCF | Pathway');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = copy('metaDescription', 'Clases privadas de francés para alcanzar NCLC 7 y preparar el TEF Canada o el TCF Canada con una intensidad adaptada a tu fecha.');

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

    if (heroLabel) heroLabel.textContent = copy('heroLabel', 'Objetivo NCLC 7 · Preparación TEF Canada y TCF Canada');
    if (heroTitle) heroTitle.innerHTML = copy('heroTitleHtml', 'Tu ruta al NCLC 7 empieza por <span>un plan que sí cabe en tu vida.</span>');
    if (heroLead) heroLead.textContent = copy('heroLead', 'Pathway mide tu nivel, define la intensidad que exige tu fecha y te acompaña con clases privadas hasta el NCLC 7 en el TEF Canada o el TCF Canada.');
    if (honestyNote) honestyNote.hidden = false;
    if (pricingChoice) pricingChoice.hidden = false;
    if (hoursReference) hoursReference.hidden = false;
    if (pricingReference) pricingReference.hidden = false;
    if (pricingFaq) pricingFaq.textContent = copy('pricingFaq', 'Sí. Puedes inscribirte mes a mes, sin permanencia, o elegir un ciclo completo con 15 % de descuento. Si pasas al ciclo después de un primer mes, el descuento del ciclo es del 10 %.');
    if (examLevel) {
      examLevel.dataset.title = copy('examLevelTitle', 'Tu objetivo es el TEF o el TCF');
      examLevel.textContent = copy('examLevelLabel', 'Preparo el TEF o el TCF');
    }
    const examCopies = homeCopy.examCopies || {
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
      element.textContent = copy('simulations', '2 simulacros TEF / TCF');
    });
    document.querySelectorAll('[data-cta="header-evaluation"], [data-cta="hero-evaluation"], [data-cta="closing-evaluation"], [data-cta="mobile-evaluation"], [data-cta^="plan-"]').forEach(link => {
      link.href = copy('evaluationHref', 'test-placement.html');
    });
    if (weekTitle) weekTitle.textContent = copy('weekTitle', 'La intensidad que exige tu objetivo, organizada semana a semana.');
    if (weekCopy) weekCopy.textContent = copy('weekCopy', 'Según tu nivel, tu fecha y tus necesidades, eliges un ritmo de 2, 4 o 6 horas* por semana en clases privadas, además de una práctica guiada entre sesiones.');
    if (weekList) {
      weekList.innerHTML = copy('weekListHtml', `
        <li><span>Tu modalidad</span><div><strong>Clases privadas en vivo</strong><small>2, 4 o 6 horas* por semana según tu plan</small></div><b>2 · 4 · 6 h*</b></li>
        <li><span>Entre sesiones</span><div><strong>Práctica dirigida</strong><small>Ejercicios específicos conectados con tu última clase</small></div><b>Guiada</b></li>
        <li><span>Después de cada clase</span><div><strong>Correcciones continuas</strong><small>Feedback oral y escrito sobre tus prioridades</small></div><b>Continuo</b></li>
        <li><span>Cada etapa</span><div><strong>Control del progreso</strong><small>Objetivos semanales y simulacros antes del TEF o el TCF</small></div><b>Medible</b></li>
      `);
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
          price.innerHTML = `${plan.dataset.cyclePrice} <small>${homeCopy.pricing?.cycleSuffix || 'CAD · ciclo completo'}</small>`;
          hours.innerHTML = `<strong>${plan.dataset.cycleDuration}</strong> · ${plan.dataset.cycleHours}`;
          summary.innerHTML = `<s>${plan.dataset.cycleOriginal} CAD</s><strong>${homeCopy.pricing?.savingPrefix || 'Ahorras'} ${plan.dataset.cycleSaving} CAD</strong><span>${homeCopy.pricing?.equivalentPrefix || 'Equivale a'} ${plan.dataset.cycleEquivalent} ${homeCopy.pricing?.perMonthSuffix || 'CAD al mes.'}</span><small>${homeCopy.pricing?.referencePrefix || 'Precio de referencia:'} ${plan.dataset.cycleReference}.</small>`;
          summary.hidden = false;
          return;
        }

        price.innerHTML = `${plan.dataset.monthPrice} <small>${homeCopy.pricing?.monthlySuffix || 'CAD / mes'}</small>`;
        hours.textContent = plan.dataset.monthHours;
        summary.hidden = true;
      });
    };

    pricingButtons.forEach(button => {
      button.addEventListener('click', () => setPricingMode(button.dataset.pricingMode));
    });
    setPricingMode('monthly');

    const planSelectors = [...document.querySelectorAll('[data-plan-selector]')];
    const mobilePlanQuery = window.matchMedia('(max-width: 760px)');
    let selectedPlan = planSelectors.find(button => button.getAttribute('aria-selected') === 'true')?.dataset.planSelector || 'accelerated';
    const setSelectedPlan = planId => {
      selectedPlan = planId;
      planSelectors.forEach(button => button.setAttribute('aria-selected', String(button.dataset.planSelector === planId)));
      plans.forEach(plan => {
        plan.hidden = mobilePlanQuery.matches && plan.dataset.planId !== planId;
      });
    };
    planSelectors.forEach((button, buttonIndex) => {
      button.addEventListener('click', () => setSelectedPlan(button.dataset.planSelector));
      button.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? planSelectors.length - 1
            : (buttonIndex + (event.key === 'ArrowRight' ? 1 : -1) + planSelectors.length) % planSelectors.length;
        planSelectors[nextIndex].focus();
        setSelectedPlan(planSelectors[nextIndex].dataset.planSelector);
      });
    });
    mobilePlanQuery.addEventListener('change', () => setSelectedPlan(selectedPlan));
    setSelectedPlan(selectedPlan);
  }

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menu.dataset.open = 'false';
    document.body.classList.remove('menu-open');
    document.querySelector('main')?.removeAttribute('inert');
    document.querySelector('.mobile-action')?.removeAttribute('inert');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.dataset.open = String(!isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
    document.querySelector('main')?.toggleAttribute('inert', !isOpen);
    document.querySelector('.mobile-action')?.toggleAttribute('inert', !isOpen);
  });

  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || menuButton?.getAttribute('aria-expanded') !== 'true') return;
    closeMenu();
    menuButton.focus();
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const levelAnswer = document.querySelector('[data-level-answer]');
  const levelAnswerTitle = levelAnswer?.querySelector('[data-level-answer-title]');
  const levelAnswerCopy = levelAnswer?.querySelector('[data-level-answer-copy]');
  const levelAnswerCta = levelAnswer?.querySelector('[data-level-answer-cta]');

  document.querySelectorAll('[data-level]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-level]').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      if (!levelAnswer || !levelAnswerTitle || !levelAnswerCopy || !levelAnswerCta) return;
      levelAnswerTitle.textContent = button.dataset.title;
      levelAnswerCopy.textContent = button.dataset.copy;
      levelAnswerCta.href = button.dataset.ctaHref;
      levelAnswerCta.firstChild.textContent = `${button.dataset.ctaLabel} `;
      if (!reducedMotion) {
        levelAnswer.animate(
          [{ opacity: .58, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      }
    });
  });

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

  const routeMap = document.querySelector('.route-map');
  const routeStops = [...document.querySelectorAll('.route-stop')];
  const activateRouteStop = index => {
    routeStops.forEach((stop, stopIndex) => stop.classList.toggle('is-active', stopIndex <= index));
    routeMap?.style.setProperty('--route-progress', routeStops.length > 1 ? String(index / (routeStops.length - 1)) : '1');
  };
  if (routeMap && routeStops.length) {
    activateRouteStop(0);
    if ('IntersectionObserver' in window && !reducedMotion) {
      const routeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          activateRouteStop(routeStops.indexOf(entry.target));
        });
      }, { rootMargin: '-38% 0px -42% 0px', threshold: .15 });
      routeStops.forEach(stop => routeObserver.observe(stop));
    } else {
      activateRouteStop(routeStops.length - 1);
    }
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

    const syncHeight = () => {
      slides.forEach(slide => { slide.hidden = false; slide.style.minHeight = ''; });
      const maxHeight = Math.ceil(Math.max(...slides.map(slide => slide.getBoundingClientRect().height)));
      slides.forEach((slide, slideIndex) => {
        slide.hidden = slideIndex !== current;
        slide.style.minHeight = `${maxHeight}px`;
      });
    };

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'carousel-arrow carousel-prev';
    previous.setAttribute('aria-label', homeCopy.carousel?.previous || 'Testimonio anterior');
    previous.textContent = '←';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-arrow carousel-next';
    next.setAttribute('aria-label', homeCopy.carousel?.next || 'Testimonio siguiente');
    next.textContent = '→';

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    dots.setAttribute('aria-label', homeCopy.carousel?.choose || 'Elegir un testimonio');

    const show = index => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== current; });
      [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    };

    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `${homeCopy.carousel?.writtenItem || 'Ver testimonio'} ${index + 1}`);
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
    syncHeight();
    let resizeTimer;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(syncHeight, 120);
    }, { passive: true });
    document.fonts?.ready.then(syncHeight);
  };

  document.querySelectorAll('[data-story-carousel]').forEach(buildStoryCarousel);

  const storiesMore = document.querySelector('[data-stories-more]');
  const writtenStories = storiesMore?.closest('.written-stories');
  storiesMore?.addEventListener('click', () => {
    const isExpanded = storiesMore.getAttribute('aria-expanded') === 'true';
    storiesMore.setAttribute('aria-expanded', String(!isExpanded));
    writtenStories.dataset.expanded = String(!isExpanded);
    storiesMore.textContent = isExpanded
      ? (homeCopy.interface?.storiesMore || 'Ver más experiencias')
      : (homeCopy.interface?.storiesLess || 'Mostrar menos experiencias');
  });

  const assetBase = copy('assetBase', '');
  const testimonialVideos = [
    {
      src: `${assetBase}assets/videos/testimonio-25-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-25-poster.jpg?v=20260821-testimonial-first`,
      name: 'Yazmin'
    },
    {
      src: `${assetBase}assets/videos/testimonio-majo-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-majo-poster.jpg?v=20260814`,
      name: 'Majo'
    },
    {
      src: `${assetBase}assets/videos/testimonio-22-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-22-poster.jpg?v=20260814-2`,
      name: 'Pia'
    },
    {
      src: `${assetBase}assets/videos/testimonio-24-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-24-poster.jpg?v=20260821-video-carousel`,
      name: 'Diego'
    },
    {
      src: `${assetBase}assets/videos/testimonio-21-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-21-poster.jpg?v=20260814-2`,
      name: 'Jennifer'
    },
    {
      src: `${assetBase}assets/videos/testimonio-23-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-23-poster.jpg?v=20260814-2`,
      name: 'Fabián'
    },
    {
      src: `${assetBase}assets/videos/testimonio-meli-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-meli-poster.jpg?v=20260814`,
      name: 'Melissa'
    },
    {
      src: `${assetBase}assets/videos/testimonio-20-web.mp4`,
      poster: `${assetBase}assets/videos/testimonio-20-poster.jpg?v=20260814-2`,
      name: 'Elisa'
    }
  ];
  const videoCarousel = document.querySelector('[data-video-carousel]');
  if (videoCarousel && testimonialVideos.length) {
    const video = videoCarousel.querySelector('[data-testimonial-video]');
    const videoStage = videoCarousel.querySelector('.video-stage');
    const poster = videoCarousel.querySelector('.video-stage > img');
    const placeholder = videoCarousel.querySelector('.video-placeholder');
    const playButton = videoCarousel.querySelector('[data-video-play]');
    const previous = videoCarousel.querySelector('[data-video-previous]');
    const next = videoCarousel.querySelector('[data-video-next]');
    const dots = videoCarousel.querySelector('[data-video-dots]');
    const count = videoCarousel.querySelector('[data-video-count]');
    const name = videoCarousel.querySelector('[data-video-name]');
    let current = 0;
    let hasStarted = false;

    const showVideo = (index, shouldPlay = false) => {
      current = (index + testimonialVideos.length) % testimonialVideos.length;
      const item = testimonialVideos[current];
      video.pause();
      videoStage.classList.remove('is-playing');
      video.src = item.src;
      video.poster = item.poster || '';
      video.setAttribute('aria-label', `${copy('videoAriaPrefix', 'Testimonio en video:')} ${item.name}`);
      video.load();
      if (shouldPlay) video.play().catch(() => {});
      count.textContent = `${current + 1} / ${testimonialVideos.length}`;
      name.textContent = item.name;
      [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    };

    testimonialVideos.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `${homeCopy.carousel?.videoItem || 'Ver video'} ${index + 1}: ${item.name}`);
      dot.addEventListener('click', () => {
        if (!hasStarted) return;
        showVideo(index, true);
      });
      dots.append(dot);
    });
    [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === 0)));
    previous.addEventListener('click', () => showVideo(current - 1, true));
    next.addEventListener('click', () => showVideo(current + 1, true));
    playButton?.addEventListener('click', () => {
      hasStarted = true;
      poster.hidden = true;
      placeholder.hidden = true;
      playButton.hidden = true;
      video.hidden = false;
      videoCarousel.classList.add('has-videos');
      previous.hidden = testimonialVideos.length < 2;
      next.hidden = testimonialVideos.length < 2;
      showVideo(0, true);
    });
    video.addEventListener('play', () => videoStage.classList.add('is-playing'));
    video.addEventListener('pause', () => videoStage.classList.remove('is-playing'));
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
      const irccLocale = copy('irccLocale', 'es-ES');
      setAll('[data-ircc-cec-date]', PathwayIRCC.formatDate(data.cec.date, irccLocale));
      setAll('[data-ircc-french-date]', PathwayIRCC.formatDate(data.french.date, irccLocale));
      setAll('[data-draw-date]', PathwayIRCC.formatLongDate(data.french.date, irccLocale));

      const status = data.source === 'live'
        ? (homeCopy.dataStatus?.live || 'consulta automática activa')
        : data.source === 'cache'
          ? (homeCopy.dataStatus?.cache || 'última consulta exitosa conservada')
          : (homeCopy.dataStatus?.fallback || 'datos de respaldo incluidos');
      setAll('[data-data-status]', status);
    })
    .catch(() => {
      setAll('[data-data-status]', homeCopy.dataStatus?.fallback || 'datos de respaldo incluidos');
    });
})();
