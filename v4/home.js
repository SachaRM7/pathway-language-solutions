const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const track = (event, details) => window.PathwayAnalytics?.track(event, details);
const pageLanguage = (document.documentElement.lang || 'es').split('-')[0];
const translations = {
  es: {
    menuOpen: 'Abrir el menú',
    menuClose: 'Cerrar el menú',
    stage: 'etapa',
    of: 'de',
    pauseAnimation: 'Pausar animación',
    resumeAnimation: 'Reanudar animación',
    skills: { reading: 'comprensión escrita', listening: 'comprensión oral', grammarVocabulary: 'gramática y vocabulario' },
    yourResult: 'Tu resultado',
    estimatedLevel: level => `Tu nivel estimado: ${level}.`,
    firstCyclePriority: skill => `Prioridad del primer ciclo: ${skill}.`
  },
  fr: {
    menuOpen: 'Ouvrir le menu',
    menuClose: 'Fermer le menu',
    stage: 'étape',
    of: 'sur',
    pauseAnimation: 'Mettre l’animation en pause',
    resumeAnimation: 'Reprendre l’animation',
    skills: { reading: 'compréhension écrite', listening: 'compréhension orale', grammarVocabulary: 'grammaire et vocabulaire' },
    yourResult: 'Votre résultat',
    estimatedLevel: level => `Votre niveau estimé : ${level}.`,
    firstCyclePriority: skill => `Priorité du premier cycle : ${skill}.`
  },
  en: {
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    stage: 'stage',
    of: 'of',
    pauseAnimation: 'Pause animation',
    resumeAnimation: 'Resume animation',
    skills: { reading: 'reading', listening: 'listening', grammarVocabulary: 'grammar and vocabulary' },
    yourResult: 'Your result',
    estimatedLevel: level => `Your estimated level: ${level}.`,
    firstCyclePriority: skill => `First-cycle priority: ${skill}.`
  },
  de: {
    menuOpen: 'Menü öffnen',
    menuClose: 'Menü schließen',
    stage: 'Etappe',
    of: 'von',
    pauseAnimation: 'Animation pausieren',
    resumeAnimation: 'Animation fortsetzen',
    skills: { reading: 'Leseverstehen', listening: 'Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz' },
    yourResult: 'Ihr Ergebnis',
    estimatedLevel: level => `Ihr geschätztes Niveau: ${level}.`,
    firstCyclePriority: skill => `Priorität des ersten Zyklus: ${skill}.`
  }
};
const t = translations[pageLanguage] || translations.es;

function setupNavigation() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const menuLabel = toggle.querySelector('[data-menu-label]');
  const desktop = window.matchMedia('(min-width: 1200px)');

  function setOpen(open, returnFocus = false) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menuLabel.textContent = open ? t.menuClose : t.menuOpen;
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const wasOpen = menu.classList.contains('is-open');
    setOpen(false);
    if (wasOpen && link.hash && link.pathname === location.pathname) {
      const destination = document.getElementById(link.hash.slice(1));
      if (destination) {
        destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false, true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) setOpen(false);
  });

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }
}

function setupPrograms() {
  const carousel = document.querySelector('[data-program-carousel]');
  const slides = [...carousel.querySelectorAll('[data-program-slide]')];
  const buttons = [...carousel.querySelectorAll('[data-stage]')];
  const dots = [...carousel.querySelectorAll('[data-route-dot]')];
  const link = carousel.querySelector('[data-program-link]');
  const label = carousel.querySelector('[data-program-link-label]');
  const count = carousel.querySelector('[data-program-count]');
  const status = carousel.querySelector('[data-program-status]');
  const progress = carousel.querySelector('[data-route-progress]');
  let current = 0;
  let animation;
  let pointerStart;
  let lastSwipe = -Infinity;

  function show(index, announce = true) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== current; });
    buttons.forEach((button, buttonIndex) => {
      button.classList.toggle('is-current', buttonIndex === current);
      button.setAttribute('aria-pressed', String(buttonIndex === current));
    });
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-complete', dotIndex <= current));
    progress.style.strokeDashoffset = String(100 - current / (slides.length - 1) * 100);
    const slide = slides[current];
    link.href = slide.dataset.href;
    link.dataset.cta = `v4-program-${slide.dataset.level.toLowerCase().replaceAll(' ', '-')}`;
    label.textContent = slide.dataset.linkLabel;
    count.textContent = `${current + 1}/${slides.length}`;
    carousel.dataset.current = String(current);
    animation?.cancel();
    if (announce) {
      status.textContent = `${slide.dataset.level}, ${t.stage} ${current + 1} ${t.of} ${slides.length}`;
      track('program_viewed', { level: slide.dataset.level, version: 'v4' });
      if (!reducedMotion.matches) {
        animation = slide.animate([
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }
  }

  carousel.querySelector('[data-program-previous]').addEventListener('click', () => show(current - 1));
  carousel.querySelector('[data-program-next]').addEventListener('click', () => show(current + 1));
  buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
  carousel.addEventListener('keydown', event => {
    const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
    if (!(event.key in destinations) || event.altKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    show(destinations[event.key]);
    if (event.target.matches('[data-stage]')) buttons[current].focus({ preventScroll: true });
  });
  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });
  carousel.addEventListener('pointerup', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    lastSwipe = performance.now();
    show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  carousel.addEventListener('pointercancel', () => { pointerStart = null; });
  carousel.addEventListener('click', event => {
    if (performance.now() - lastSwipe < 350) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) animation?.cancel();
  });
  show(0, false);
}

function setupTeachers() {
  const stage = document.querySelector('[data-teacher-stage]');
  const pause = stage.querySelector('[data-teacher-pause]');
  const pauseLabel = pause.querySelector('span');
  const pauseIcon = pause.querySelector('use');
  let visible = false;
  let manuallyPaused = false;
  let timer;

  function syncTimer() {
    clearInterval(timer);
    timer = undefined;
    if (!visible || manuallyPaused || document.hidden || reducedMotion.matches) return;
    timer = window.setInterval(() => {
      stage.classList.add('has-swapped');
      stage.dataset.front = stage.dataset.front === 'first' ? 'second' : 'first';
    }, 2500);
  }

  pause.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    pause.setAttribute('aria-pressed', String(manuallyPaused));
    pauseLabel.textContent = manuallyPaused ? t.resumeAnimation : t.pauseAnimation;
    pauseIcon.setAttribute('href', manuallyPaused ? '#i-play' : '#i-pause');
    syncTimer();
  });
  document.addEventListener('visibilitychange', syncTimer);
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', syncTimer);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stage.classList.remove('has-swapped');
    syncTimer();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncTimer();
    }, { threshold: .15 });
    observer.observe(stage);
  } else {
    visible = true;
    syncTimer();
  }
}

function restorePlacementResult() {
  let result;
  try {
    const saved = window.sessionStorage.getItem('pathwayPlacementResult');
    if (!saved) return;
    result = JSON.parse(saved);
  } catch {
    return;
  }
  const skills = t.skills;
  const scores = result?.skillScores;
  if (!['A1', 'A2', 'B1', 'B2'].includes(result?.level) || !scores) return;
  if (!Object.keys(skills).every(key => Number.isFinite(scores[key]) && scores[key] >= 0 && scores[key] <= 100)) return;
  const weakest = Object.hasOwn(skills, result.weakestSkill)
    ? result.weakestSkill
    : Object.keys(skills).reduce((previous, key) => scores[key] < scores[previous] ? key : previous);

  const report = document.querySelector('[data-skill-report]');
  const priorityLabel = report.querySelector('.priority-label');
  report.querySelector('[data-result-label]').textContent = t.yourResult;
  report.querySelector('[data-result-summary]').textContent = t.estimatedLevel(result.level);
  report.querySelector('[data-result-priority]').textContent = t.firstCyclePriority(skills[weakest]);
  for (const [key] of Object.entries(skills)) {
    const row = report.querySelector(`[data-skill="${key}"]`);
    const score = Math.round(scores[key]);
    row.style.setProperty('--score', `${score}%`);
    row.querySelector('[data-skill-value]').textContent = `${score}/100`;
    row.classList.toggle('is-priority', key === weakest);
    if (key === weakest) row.querySelector('dt').append(priorityLabel);
  }
}

function setupSkillReportAnimation() {
  const report = document.querySelector('[data-skill-report]');
  if (!report || reducedMotion.matches) return;

  const rows = [...report.querySelectorAll('.skill-row:not(.skill-pending)')];
  if (!rows.length) return;

  report.classList.add('is-skill-prepared');
  let played = false;
  let cancelled = false;

  const wait = duration => new Promise(resolve => window.setTimeout(resolve, duration));

  const animateRow = row => new Promise(resolve => {
    const fill = row.querySelector('.skill-fill');
    if (!fill) {
      resolve();
      return;
    }

    const finish = () => {
      fill.removeEventListener('animationend', finish);
      row.classList.remove('is-skill-running');
      row.classList.add('is-skill-done');
      resolve();
    };

    fill.addEventListener('animationend', finish, { once: true });
    row.classList.add('is-skill-running');
  });

  const reveal = async () => {
    if (played) return;
    played = true;
    report.dataset.skillAnimationPlayed = 'true';

    for (const row of rows) {
      if (cancelled) return;
      await animateRow(row);
      if (cancelled) return;
      await wait(250);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      reveal();
    }, { threshold: .35, rootMargin: '0px 0px -8% 0px' });
    observer.observe(report);
  } else {
    reveal();
  }

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    cancelled = true;
    rows.forEach(row => {
      row.classList.remove('is-skill-running');
      row.classList.add('is-skill-done');
    });
    report.classList.remove('is-skill-prepared');
  });
}

function setupSectionTracking() {
  if (!('IntersectionObserver' in window)) return;
  const events = {
    recorrido: 'methodology_viewed',
    'tu-semana': 'weekly_preview_viewed',
    profesores: 'teachers_viewed'
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      track(events[entry.target.id], { version: 'v4' });
      observer.unobserve(entry.target);
    }
  }, { threshold: .25 });
  Object.keys(events).map(id => document.getElementById(id)).filter(Boolean).forEach(section => observer.observe(section));
}

setupNavigation();
setupPrograms();
setupTeachers();
restorePlacementResult();
setupSkillReportAnimation();
setupSectionTracking();
document.querySelectorAll('.menu-toggle, .stage-button, .round-button, .teacher-pause').forEach(button => {
  button.disabled = false;
});
document.querySelector('[data-year]').textContent = String(new Date().getFullYear());

