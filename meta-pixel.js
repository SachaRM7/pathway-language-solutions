// Meta Pixel (Facebook / Instagram ads): measures visits and the actions that matter, so the ads
// can be optimised and their results counted. Loaded on the public site only (not the Campus).
// • Only on pathway-languages.com (never on a preview or a local copy).
// • Off for visitors who send « Do Not Track » or the Global Privacy Control signal.
// • Events carry no name, email or phone: only the action (Lead, Contact, ViewContent).
// Pixel: « Pathway Coordinacion - Píxel » (Meta Events Manager).
(() => {
  const PIXEL_ID = '1066217513158304';
  const host = location.hostname.replace(/^www\./, '');
  if (host !== 'pathway-languages.com') return;
  const nav = navigator;
  if (nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (window.fbq) return;

  // Standard Meta loader.
  const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
  const script = document.createElement('script');
  script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  // Actions reported by analytics.js and the forms (window event « pathway:conversion »).
  const MAP = {
    placement_completed: ['Lead', { content_name: 'placement_test' }],
    enrollment_whatsapp_prepared: ['Lead', { content_name: 'enrollment_request' }],
    lead_whatsapp_prepared: ['Lead', { content_name: 'crs_calculator' }],
    program_viewed: ['ViewContent', { content_name: 'program' }],
    crs_calculated: ['ViewContent', { content_name: 'crs_calculator' }]
  };
  // A click on a WhatsApp, email or phone link (works on every page, with or without analytics.js).
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const way = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href) ? 'whatsapp' : href.startsWith('mailto:') ? 'email' : href.startsWith('tel:') ? 'phone' : '';
    if (!way) return;
    try { fbq('track', 'Contact', { content_name: way }); } catch (_) { /* never blocks the page */ }
  }, true);
  const sent = new Set();
  window.addEventListener('pathway:conversion', event => {
    const detail = event.detail || {};
    const entry = MAP[detail.event];
    if (!entry) return;
    // A page-view style event is sent once per page; Lead and Contact each time they happen.
    const once = entry[0] === 'ViewContent';
    if (once && sent.has(detail.event)) return;
    sent.add(detail.event);
    try { fbq('track', entry[0], entry[1]); } catch (_) { /* never blocks the page */ }
  });
})();
