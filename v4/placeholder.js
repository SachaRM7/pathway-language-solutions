const lang = (document.documentElement.lang || 'es').split('-')[0];
const labels = {
  es: ['Abrir el menú', 'Cerrar el menú'],
  fr: ['Ouvrir le menu', 'Fermer le menu'],
  en: ['Open menu', 'Close menu'],
  de: ['Menü öffnen', 'Menü schließen']
};
const [openLabel, closeLabel] = labels[lang] || labels.es;
const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const menuLabel = toggle?.querySelector('[data-menu-label]');
if (toggle && menu) {
  const setOpen = open => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    if (menuLabel) menuLabel.textContent = open ? closeLabel : openLabel;
  };
  toggle.disabled = false;
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', event => {
    if (header && !header.contains(event.target)) setOpen(false);
  });
}
