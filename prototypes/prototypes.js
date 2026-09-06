document.documentElement.classList.add('js');

const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menu.dataset.open = String(!open);
  });
}

document.querySelectorAll('[data-level]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-level]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });
    const result = document.querySelector('[data-level-result]');
    if (result) {
      result.innerHTML = `<strong>${button.dataset.title}</strong><span>${button.dataset.copy}</span>`;
    }
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));

