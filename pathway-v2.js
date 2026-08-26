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

  }

  const weekSwipeCopy = document.querySelector('[data-week-swipe-copy]');
  const planSwipeCopy = document.querySelector('[data-plan-swipe-copy]');
  const storySwipeCopy = document.querySelector('[data-story-swipe-copy]');
  if (weekSwipeCopy) weekSwipeCopy.textContent = homeCopy.interface?.weekSwipe || 'Desliza para recorrer la semana';
  if (planSwipeCopy) planSwipeCopy.textContent = homeCopy.interface?.planSwipe || 'Desliza para comparar los ritmos';
  if (storySwipeCopy) storySwipeCopy.textContent = homeCopy.interface?.storySwipe || 'Desliza para leer las experiencias';

  const setupSwipeDeck = (deck, cardSelector, indexNode, initialIndex = 0) => {
    if (!deck || !indexNode) return;
    const cards = [...deck.querySelectorAll(cardSelector)];
    if (!cards.length) return;
    const mobileDeckQuery = window.matchMedia('(max-width: 760px)');
    let frame = 0;
    let currentIndex = 0;
    let initialPositionApplied = false;
    const updateIndex = () => {
      frame = 0;
      const deckRect = deck.getBoundingClientRect();
      const deckCenter = deckRect.left + deckRect.width / 2;
      const activeIndex = cards.reduce((closest, card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - deckCenter);
        return distance < closest.distance ? { index, distance } : closest;
      }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
      currentIndex = activeIndex;
      indexNode.textContent = String(activeIndex + 1);
    };
    deck.addEventListener('scroll', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateIndex);
    }, { passive: true });
    window.addEventListener('resize', updateIndex);
    deck.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const targetIndex = Math.min(cards.length - 1, Math.max(0, currentIndex + direction));
      const target = cards[targetIndex];
      deck.scrollTo({
        left: target.offsetLeft - (deck.clientWidth - target.clientWidth) / 2,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
    const applyInitialPosition = () => {
      if (!mobileDeckQuery.matches || initialPositionApplied) {
        updateIndex();
        return;
      }
      const target = cards[Math.min(initialIndex, cards.length - 1)];
      deck.scrollLeft = target.offsetLeft - (deck.clientWidth - target.clientWidth) / 2;
      initialPositionApplied = true;
      requestAnimationFrame(updateIndex);
    };
    mobileDeckQuery.addEventListener('change', event => {
      if (!event.matches) {
        initialPositionApplied = false;
        deck.scrollLeft = 0;
        return;
      }
      requestAnimationFrame(applyInitialPosition);
    });
    requestAnimationFrame(applyInitialPosition);
  };

  setupSwipeDeck(document.querySelector('[data-week-list]'), ':scope > li', document.querySelector('[data-week-deck-index]'));
  setupSwipeDeck(document.querySelector('[data-plans-deck]'), ':scope > [data-plan]', document.querySelector('[data-plan-deck-index]'), 1);

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
  const mobileRouteQuery = window.matchMedia('(max-width: 760px)');
  const activateRouteStop = index => {
    routeStops.forEach((stop, stopIndex) => stop.classList.toggle('is-active', stopIndex <= index));
    routeMap?.style.setProperty('--route-progress', routeStops.length > 1 ? String(index / (routeStops.length - 1)) : '1');
  };
  if (routeMap && routeStops.length) {
    activateRouteStop(0);
    let routeFrame = 0;
    const updateMobileRoute = () => {
      routeFrame = 0;
      if (!mobileRouteQuery.matches) return;
      if (reducedMotion) {
        routeMap.style.setProperty('--route-progress', '1');
        routeStops.forEach(stop => stop.classList.add('is-active'));
        return;
      }
      const firstRect = routeStops[0].getBoundingClientRect();
      const lastRect = routeStops[routeStops.length - 1].getBoundingClientRect();
      const firstCenter = firstRect.top + 30;
      const lastCenter = lastRect.top + 30;
      const viewportAnchor = window.innerHeight * .62;
      const routeRect = routeMap.getBoundingClientRect();
      const rawProgress = (viewportAnchor - firstCenter) / Math.max(1, lastCenter - firstCenter);
      const progress = routeRect.bottom <= window.innerHeight * .86
        ? 1
        : Math.min(1, Math.max(0, rawProgress));
      routeMap.style.setProperty('--route-progress', progress.toFixed(4));
      routeStops.forEach((stop, stopIndex) => {
        const activationPoint = stopIndex / Math.max(1, routeStops.length - 1);
        stop.classList.toggle('is-active', progress + .035 >= activationPoint);
      });
    };
    const requestMobileRouteUpdate = () => {
      if (reducedMotion || !mobileRouteQuery.matches || routeFrame) return;
      routeFrame = requestAnimationFrame(updateMobileRoute);
    };
    window.addEventListener('scroll', requestMobileRouteUpdate, { passive: true });
    window.addEventListener('resize', requestMobileRouteUpdate);
    mobileRouteQuery.addEventListener('change', event => event.matches ? updateMobileRoute() : activateRouteStop(0));
    updateMobileRoute();
    if ('IntersectionObserver' in window && !reducedMotion) {
      const routeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || mobileRouteQuery.matches) return;
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

  const storyDeck = document.querySelector('[data-story-deck]');
  if (storyDeck) {
    const storySlides = [...storyDeck.querySelectorAll('[data-story-slide]')];
    const storyCarousels = [...storyDeck.querySelectorAll('[data-story-carousel]')];
    storySlides.forEach(slide => {
      slide.hidden = false;
      slide.style.minHeight = '';
      storyDeck.append(slide);
    });
    storyCarousels.forEach(carousel => carousel.remove());
    setupSwipeDeck(storyDeck, ':scope > [data-story-slide]', document.querySelector('[data-story-deck-index]'));
  }

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
