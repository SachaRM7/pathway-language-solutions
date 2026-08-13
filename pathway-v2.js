document.documentElement.classList.add('js');

(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

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
