(() => {
  const config = window.PATHWAY_CONFIG || {};
  const track = (name, details = {}) => {
    const payload = { event: name, ...details, page: location.pathname, timestamp: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('pathway:conversion', { detail: payload }));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    if (config.analyticsProvider === 'plausible' && typeof window.plausible === 'function') window.plausible(name, { props: details });
  };
  window.PathwayAnalytics = Object.freeze({ track });
  if (config.analyticsProvider === 'plausible' && config.analyticsKey) {
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = config.analyticsKey;
    script.src = 'https://plausible.io/js/script.js';
    document.head.append(script);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a,button');
    if (!link) return;
    const cta = link.dataset.cta;
    const href = link.getAttribute('href') || '';
    if (cta) track('cta_click', { cta });
    else if (href.includes('wa.me/')) track('whatsapp_click', { label: link.textContent.trim().slice(0, 80) });
    else if (href.startsWith('mailto:')) track('email_click');
    else if (href.startsWith('tel:')) track('phone_click');
  });
})();
