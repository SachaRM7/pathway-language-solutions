(() => {
  const storageKey = 'pathway-theme';
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  root.dataset.theme = saved === 'dark' || saved === 'light' ? saved : preferred;

  const updateControls = () => {
    const isDark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
      button.setAttribute('title', isDark ? 'Modo claro' : 'Modo oscuro');
      const icon = button.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = isDark ? '☀' : '☾';
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = isDark ? '#081b17' : '#f7f5ef';
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateControls();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(storageKey, root.dataset.theme); } catch (_) {}
        updateControls();
      });
    });
  });
})();
