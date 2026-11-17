// First touch: where the visitor first came from (utm_campaign / utm_source / utm_medium of the
// landing address, or else the other website that sent them), kept 30 days in this browser
// (localStorage, no cookie). The placement test, the enrollment form and the CRS calculator send
// it with what the visitor submits (campus/db/023_crm.sql), so the Campus knows each lead's origin.
(() => {
  const KEY = 'pathwayFirstTouch';
  const MAX_AGE = 30 * 864e5;
  const clean = value => String(value || '').trim().replace(/[^\p{L}\p{N} ._\-·/:+]/gu, '').slice(0, 100);
  const read = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (stored && Date.now() - stored.at < MAX_AGE) return stored;
      if (stored) localStorage.removeItem(KEY);
    } catch (_) { /* storage blocked: keep this page's value only */ }
    return null;
  };
  let touch = read();
  if (!touch) {
    const query = new URLSearchParams(location.search);
    const campaign = clean(query.get('utm_campaign'));
    const via = [clean(query.get('utm_source')), clean(query.get('utm_medium'))].filter(Boolean).join(' · ');
    let referrer = '';
    try {
      const host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
      if (host && host !== location.hostname.replace(/^www\./, '')) referrer = clean(host);
    } catch (_) { /* no referrer */ }
    if (campaign || via || referrer) {
      touch = { campaign, source: via || referrer, at: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(touch)); } catch (_) { /* private mode */ }
    }
  }
  window.PathwayCampaign = Object.freeze({
    get: () => {
      const current = read() || touch;
      return { campaign: (current && current.campaign) || null, source: (current && current.source) || null };
    }
  });
})();

// Site journey (campus/db/029_relances_embudo.sql): anonymous steps of the level test and the
// enrolment (page opened, test started, half-way, email asked, result, request sent…) with the kind
// of device, to see where visitors leave. No name, email or IP address: a random visit id kept for
// this tab only. Off for visitors who send « Do Not Track » or Global Privacy Control, and outside
// pathway-languages.com. Never blocks the page.
(() => {
  const SUPABASE = { url: 'https://ynflykxalfynxoupkxmy.supabase.co', key: 'sb_publishable_e3Pa5ADDtYVU7BJilbkcxw_qaPPxtKB' };
  const nav = navigator;
  const off = location.hostname.replace(/^www\./, '') !== 'pathway-languages.com'
    || nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1';
  const ua = nav.userAgent || '';
  const device = /Android/i.test(ua) ? (/Mobile/i.test(ua) ? 'android' : 'tablet')
    : /iPhone|iPod/i.test(ua) ? 'iphone'
      : /iPad/i.test(ua) || (/Macintosh/i.test(ua) && nav.maxTouchPoints > 1) ? 'ipad'
        : /Macintosh/i.test(ua) ? 'mac'
          : /Windows|CrOS|Linux|X11/i.test(ua) ? 'pc' : 'other';
  let visit = '';
  try { visit = sessionStorage.getItem('pathwayVisit') || ''; } catch (_) { /* storage blocked */ }
  if (!/^[a-z0-9]{8,40}$/.test(visit)) {
    visit = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
    try { sessionStorage.setItem('pathwayVisit', visit); } catch (_) { /* one id per page then */ }
  }
  const lang = (document.documentElement.lang || 'es').slice(0, 2);
  const sent = new Set();
  const log = (event, detail) => {
    const id = `${event}|${detail || ''}`;
    if (off || sent.has(id)) return;
    sent.add(id);
    try {
      const touch = window.PathwayCampaign?.get() || {};
      fetch(`${SUPABASE.url}/rest/v1/rpc/log_funnel`, {
        method: 'POST', keepalive: true,
        headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_visit: visit, p_event: event, p_detail: detail ? String(detail).slice(0, 40) : null, p_lang: lang,
          p_device: device, p_campaign: touch.campaign || null, p_source: touch.source || null })
      }).catch(() => {});
    } catch (_) { /* never blocks the page */ }
  };
  window.PathwayFunnel = Object.freeze({ log, device });
  // Arrived from one of our emails (utm_source=email).
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('utm_source') === 'email') log('email_click', q.get('utm_campaign') || '');
  } catch (_) { /* no query */ }
  // A click on WhatsApp or Messenger, wherever it is on the page.
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const where = link.dataset.funnelPlace || location.pathname.replace(/^\/(fr|en|de)\//, '/').replace(/\.html$/, '').slice(0, 40);
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) log('contact_whatsapp', where);
    else if (/^https?:\/\/(m\.me|(www\.)?messenger\.com)\//i.test(href)) log('contact_messenger', where);
  }, true);
})();
