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
