// Pure part of the « meetings » function (campus/db/041_agenda_reuniones.sql): the invitation to the
// free meeting with a teacher after the level test, its reminders, the host's reminder, the calendar
// file attached to the invitation and the team member's calendar subscription (ICS). No import and
// no Deno API, so it is tested with Node.

export type Meeting = {
  id: string; token: string; starts_at: string; duration_min: number; zoom_link: string; sender_email: string | null;
  timezone: string | null; lang: string | null; email: string; name: string | null; host: string | null;
  host_email?: string | null; host_timezone?: string | null; status: string;
};
export type FeedEvent = { kind: string; title: string; starts_at: string; ends_at: string; status: string; ref: string; zoom: string | null };

const FONT = 'Arial,Helvetica,sans-serif';
const INK = '#122b26', PAPER = '#fffaf2', ACTION = '#a34e3b', SAGE = '#cad8c3', MUTED = '#50625c';
const LOGO = 'https://pathway-languages.com/campus/email/logo.png';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const LOCALES: Record<string, string> = { es: 'es-PE', fr: 'fr-CA', en: 'en-CA', de: 'de-DE' };

export const SENDERS: Record<string, string> = {
  'ryan@pathway-languages.com': 'Ryan · Pathway Language Solutions',
  'abdrahim@pathway-languages.com': 'Abdrahim · Pathway Language Solutions',
  'contacto@pathway-languages.com': 'Pathway Language Solutions'
};
export const fromHeader = (email: string | null) => {
  const e = email && SENDERS[email] ? email : 'contacto@pathway-languages.com';
  return { from: `${SENDERS[e]} <${e}>`, replyTo: e };
};

// « Lima », « Ciudad de México », « Montréal »… from the IANA zone.
export const tzLabel = (tz: string) => tz.split('/').pop()!.replace(/_/g, ' ');
export function when(iso: string, tz: string, lang: string): { long: string; time: string; day: string } {
  const d = new Date(iso), locale = LOCALES[lang] || 'es-PE';
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: tz, ...o }).format(d);
  const day = f({ weekday: 'long', day: 'numeric', month: 'long' });
  const time = f({ hour: '2-digit', minute: '2-digit', hour12: false });
  return { long: `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`, time, day: f({ weekday: 'short', day: 'numeric', month: 'short' }) };
}

type Copy = {
  hello: (n: string) => string; tz: (city: string) => string; minutes: (n: number) => string;
  inviteSubject: (w: string) => string; inviteTag: string; invite: (host: string) => string; what: string;
  confirm: string; other: string; calendar: string; google: string; ics: string; zoom: string; reply: string;
  daySubject: string; dayTag: string; day: (host: string) => string; dayConfirm: string;
  hourSubject: string; hourTag: string; hour: (host: string, time: string) => string; join: string;
  title: string; footer: string;
};
const C: Record<string, Copy> = {
  es: {
    hello: n => (n ? `Hola ${n},` : 'Hola,'), tz: c => `hora de ${c}`, minutes: n => `${n} min`,
    inviteSubject: w => `Tu reunión con Pathway: ${w}`, inviteTag: 'TU REUNIÓN CON UN PROFESOR',
    invite: h => `${h} te propone una reunión gratuita por Zoom para completar tu test de nivel:`,
    what: 'Hacemos la parte oral de tu test, hablamos de tu objetivo y de cuándo podrías empezar, y te explicamos las clases, la inscripción y las tarifas.',
    confirm: 'Confirmo la reunión', other: '¿No puedes a esa hora? Elige otro horario', calendar: 'Añadir a mi calendario:', google: 'Google Calendar', ics: 'Apple u Outlook: abre el archivo adjunto',
    zoom: 'El día de la reunión, entra con este enlace:', reply: '¿Una pregunta? Responde a este correo.',
    daySubject: 'Mañana: tu reunión con Pathway', dayTag: 'RECORDATORIO', day: h => `Te recordamos tu reunión gratuita por Zoom con ${h}:`, dayConfirm: 'Confírmanos que puedes conectarte:',
    hourSubject: 'Tu reunión con Pathway empieza en 1 hora', hourTag: 'EN 1 HORA', hour: (h, t) => `Tu reunión con ${h} empieza a las ${t}. Entra unos minutos antes para probar tu micrófono.`, join: 'Entrar a la reunión',
    title: 'Reunión con Pathway (test de nivel)', footer: 'Recibes este correo porque pediste una reunión después de tu test de nivel en pathway-languages.com.'
  },
  fr: {
    hello: n => (n ? `Bonjour ${n},` : 'Bonjour,'), tz: c => `heure de ${c}`, minutes: n => `${n} min`,
    inviteSubject: w => `Votre réunion avec Pathway : ${w}`, inviteTag: 'VOTRE RÉUNION AVEC UN PROFESSEUR',
    invite: h => `${h} vous propose une réunion gratuite sur Zoom pour compléter votre test de niveau :`,
    what: 'Nous faisons la partie orale de votre test, parlons de votre objectif et de quand vous pourriez commencer, et vous expliquons les cours, l’inscription et les tarifs.',
    confirm: 'Je confirme la réunion', other: 'Pas disponible à cette heure ? Choisissez un autre horaire', calendar: 'Ajouter à mon calendrier :', google: 'Google Agenda', ics: 'Apple ou Outlook : ouvrez la pièce jointe',
    zoom: 'Le jour de la réunion, connectez-vous avec ce lien :', reply: 'Une question ? Répondez à cet e-mail.',
    daySubject: 'Demain : votre réunion avec Pathway', dayTag: 'RAPPEL', day: h => `Petit rappel de votre réunion gratuite sur Zoom avec ${h} :`, dayConfirm: 'Confirmez-nous que vous pourrez vous connecter :',
    hourSubject: 'Votre réunion avec Pathway commence dans 1 heure', hourTag: 'DANS 1 HEURE', hour: (h, t) => `Votre réunion avec ${h} commence à ${t}. Connectez-vous quelques minutes avant pour tester votre micro.`, join: 'Rejoindre la réunion',
    title: 'Réunion avec Pathway (test de niveau)', footer: 'Vous recevez cet e-mail parce que vous avez demandé une réunion après votre test de niveau sur pathway-languages.com.'
  },
  en: {
    hello: n => (n ? `Hi ${n},` : 'Hi,'), tz: c => `${c} time`, minutes: n => `${n} min`,
    inviteSubject: w => `Your meeting with Pathway: ${w}`, inviteTag: 'YOUR MEETING WITH A TEACHER',
    invite: h => `${h} suggests a free Zoom meeting to complete your level test:`,
    what: 'We do the speaking part of your test, talk about your goal and when you could start, and explain the classes, enrolment and fees.',
    confirm: 'I confirm the meeting', other: 'Can’t make it? Choose another time', calendar: 'Add to my calendar:', google: 'Google Calendar', ics: 'Apple or Outlook: open the attached file',
    zoom: 'On the day, join with this link:', reply: 'A question? Reply to this email.',
    daySubject: 'Tomorrow: your meeting with Pathway', dayTag: 'REMINDER', day: h => `A reminder of your free Zoom meeting with ${h}:`, dayConfirm: 'Let us know you can join:',
    hourSubject: 'Your meeting with Pathway starts in 1 hour', hourTag: 'IN 1 HOUR', hour: (h, t) => `Your meeting with ${h} starts at ${t}. Join a few minutes early to test your microphone.`, join: 'Join the meeting',
    title: 'Meeting with Pathway (level test)', footer: 'You are receiving this email because you asked for a meeting after your level test on pathway-languages.com.'
  },
  de: {
    hello: n => (n ? `Hallo ${n},` : 'Hallo,'), tz: c => `Zeit ${c}`, minutes: n => `${n} Min.`,
    inviteSubject: w => `Ihr Gespräch mit Pathway: ${w}`, inviteTag: 'IHR GESPRÄCH MIT EINER LEHRKRAFT',
    invite: h => `${h} schlägt Ihnen ein kostenloses Zoom-Gespräch vor, um Ihren Einstufungstest zu vervollständigen:`,
    what: 'Wir machen den mündlichen Teil Ihres Tests, sprechen über Ihr Ziel und wann Sie beginnen könnten, und erklären Unterricht, Anmeldung und Preise.',
    confirm: 'Ich bestätige das Gespräch', other: 'Keine Zeit? Wählen Sie einen anderen Termin', calendar: 'Zu meinem Kalender hinzufügen:', google: 'Google Kalender', ics: 'Apple oder Outlook: Anhang öffnen',
    zoom: 'Am Tag des Gesprächs mit diesem Link teilnehmen:', reply: 'Eine Frage? Antworten Sie auf diese E-Mail.',
    daySubject: 'Morgen: Ihr Gespräch mit Pathway', dayTag: 'ERINNERUNG', day: h => `Eine Erinnerung an Ihr kostenloses Zoom-Gespräch mit ${h}:`, dayConfirm: 'Bestätigen Sie uns, dass Sie teilnehmen können:',
    hourSubject: 'Ihr Gespräch mit Pathway beginnt in 1 Stunde', hourTag: 'IN 1 STUNDE', hour: (h, t) => `Ihr Gespräch mit ${h} beginnt um ${t}. Kommen Sie ein paar Minuten früher, um Ihr Mikrofon zu testen.`, join: 'Am Gespräch teilnehmen',
    title: 'Gespräch mit Pathway (Einstufungstest)', footer: 'Sie erhalten diese E-Mail, weil Sie nach Ihrem Einstufungstest auf pathway-languages.com ein Gespräch angefragt haben.'
  }
};

function layout(lang: string, title: string, tag: string, hero: string, body: string, footer: string): string {
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f5efe4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5efe4;"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 18px;"><img src="${LOGO}" width="148" height="42" alt="Pathway" style="display:block;border:0;width:148px;height:42px;"></td></tr>
    <tr><td style="background:${PAPER};border-radius:24px;overflow:hidden;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="background:${INK};padding:28px 28px 24px;border-radius:24px 24px 0 0;">
        <p style="margin:0 0 8px;font:700 12px/1.4 ${FONT};color:${SAGE};letter-spacing:.08em;">${esc(tag)}</p>
        <p style="margin:0;font:800 34px/1.1 ${FONT};letter-spacing:-1px;color:${PAPER};">${esc(hero)}</p>
      </td></tr>
      <tr><td style="padding:28px;">${body}</td></tr>
    </table></td></tr>
    <tr><td style="padding:18px 8px 0;font:400 12px/1.6 ${FONT};color:#7d8a85;text-align:center;">${esc(footer)}<br>Pathway Language Solutions · <a href="https://pathway-languages.com/" style="color:#7d8a85;">pathway-languages.com</a></td></tr>
  </table>
</td></tr></table></body></html>`;
}
const para = (t: string, extra = '') => `<p style="margin:0 0 18px;font:400 16px/1.6 ${FONT};color:${MUTED};${extra}">${t}</p>`;
const strong = (t: string) => `<p style="margin:0 0 18px;padding:16px 18px;background:#f3eee4;border-radius:14px;font:700 18px/1.45 ${FONT};color:${INK};">${t}</p>`;
const button = (href: string, label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;"><tr><td align="center" style="background:${ACTION};border-radius:12px;"><a href="${esc(href)}" style="display:block;padding:17px 20px;font:700 16px/1.2 ${FONT};color:${PAPER};text-decoration:none;text-align:center;border-radius:12px;">${esc(label)} &rarr;</a></td></tr></table>`;
const link = (href: string, label: string) => `<a href="${esc(href)}" style="color:${INK};font-weight:700;">${esc(label)}</a>`;

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const endOf = (m: Meeting) => new Date(new Date(m.starts_at).getTime() + m.duration_min * 60000).toISOString();
export function googleLink(m: Meeting, title: string, details: string): string {
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(title)}&dates=${stamp(m.starts_at)}/${stamp(endOf(m))}`
    + `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(m.zoom_link)}`;
}

// ─── iCalendar ───
const icsText = (s: string) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lines of at most 75 octets, continued with a space (RFC 5545).
function fold(line: string): string {
  const enc = new TextEncoder(); const out: string[] = []; let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}
const cal = (lines: string[]) => lines.map(fold).join('\r\n') + '\r\n';
export function inviteIcs(m: Meeting, title: string, details: string, now = new Date()): string {
  return cal(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pathway Language Solutions//Campus//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:meeting-${m.id}@pathway-languages.com`, `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(m.starts_at)}`, `DTEND:${stamp(endOf(m))}`, `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`, `LOCATION:${icsText(m.zoom_link)}`, `URL:${icsText(m.zoom_link)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT30M', `DESCRIPTION:${icsText(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR']);
}
const KIND: Record<string, string> = { clase: 'Clase', reunion: 'Reunión', bloqueo: 'No disponible' };
const MEETING_STATUS: Record<string, string> = { propuesta: 'propuesta, sin confirmar', confirmada: 'confirmada', hecha: 'hecha', no_vino: 'no se conectó' };
export function feedIcs(feed: { name: string; events: FeedEvent[] }, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pathway Language Solutions//Campus//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(`Pathway · ${feed.name || 'Agenda'}`)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M'];
  for (const e of feed.events || []) {
    const summary = e.kind === 'bloqueo' ? (e.title || KIND.bloqueo) : `${KIND[e.kind] || e.kind} · ${e.title}${e.kind === 'reunion' && MEETING_STATUS[e.status] ? ` (${MEETING_STATUS[e.status]})` : ''}`;
    lines.push('BEGIN:VEVENT', `UID:${e.kind}-${e.ref}-${stamp(e.starts_at)}@pathway-languages.com`, `DTSTAMP:${stamp(now.toISOString())}`,
      `DTSTART:${stamp(e.starts_at)}`, `DTEND:${stamp(e.ends_at)}`, `SUMMARY:${icsText(summary)}`,
      ...(e.zoom ? [`LOCATION:${icsText(e.zoom)}`, `DESCRIPTION:${icsText('Zoom: ' + e.zoom)}`] : []),
      `TRANSP:${e.kind === 'bloqueo' ? 'OPAQUE' : 'OPAQUE'}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return cal(lines);
}

// ─── Emails to the person ───
const copyOf = (m: Meeting) => C[m.lang && C[m.lang] ? m.lang : 'es'];
const langOf = (m: Meeting) => (m.lang && C[m.lang] ? m.lang : 'es');
function base(m: Meeting) {
  const t = copyOf(m), lang = langOf(m), tz = m.timezone || 'America/Lima';
  const w = when(m.starts_at, tz, lang);
  const first = (m.name || '').trim().split(/\s+/)[0] || '';
  const host = (m.host || 'Pathway').trim().split(/\s+/)[0];
  return { t, lang, tz, w, first, host, whenLine: `${w.long} (${t.tz(tzLabel(tz))}) · ${t.minutes(m.duration_min)}` };
}
const pageUrl = (site: string, m: Meeting, answer: string, lang: string) => `${site}/reunion.html?t=${encodeURIComponent(m.token)}&a=${answer}&l=${lang}`;

export function renderInvite(m: Meeting, site: string, now = new Date()) {
  const { t, lang, w, first, host, whenLine } = base(m);
  const body = para(esc(t.hello(first)), `color:${INK};`) + para(esc(t.invite(host))) + strong(esc(whenLine)) + para(esc(t.what))
    + button(pageUrl(site, m, 'confirm', lang), t.confirm)
    + para(link(pageUrl(site, m, 'other', lang), t.other), 'text-align:center;font-size:15px;')
    + para(`${esc(t.calendar)} ${link(googleLink(m, t.title, `${t.what}\n\nZoom: ${m.zoom_link}`), t.google)} · ${esc(t.ics)}`, 'font-size:14px;')
    + para(`${esc(t.zoom)}<br>${link(m.zoom_link, m.zoom_link)}`, 'font-size:15px;') + para(esc(t.reply), 'font-size:15px;');
  return { subject: t.inviteSubject(w.long), html: layout(lang, t.inviteSubject(w.long), t.inviteTag, `${w.day} · ${w.time}`, body, t.footer),
    ics: inviteIcs(m, t.title, `${t.what}\n\nZoom: ${m.zoom_link}`, now) };
}
export function renderReminder(m: Meeting, kind: 'day' | 'hour', site: string) {
  const { t, lang, w, first, host, whenLine } = base(m);
  if (kind === 'day') {
    const body = para(esc(t.hello(first)), `color:${INK};`) + para(esc(t.day(host))) + strong(esc(whenLine))
      + (m.status === 'propuesta' ? para(esc(t.dayConfirm)) + button(pageUrl(site, m, 'confirm', lang), t.confirm) + para(link(pageUrl(site, m, 'other', lang), t.other), 'text-align:center;font-size:15px;') : '')
      + para(`${esc(t.zoom)}<br>${link(m.zoom_link, m.zoom_link)}`, 'font-size:15px;') + para(esc(t.reply), 'font-size:15px;');
    return { subject: t.daySubject, html: layout(lang, t.daySubject, t.dayTag, `${w.day} · ${w.time}`, body, t.footer) };
  }
  const body = para(esc(t.hello(first)), `color:${INK};`) + para(esc(t.hour(host, w.time))) + strong(esc(whenLine)) + button(m.zoom_link, t.join) + para(esc(t.reply), 'font-size:15px;');
  return { subject: t.hourSubject, html: layout(lang, t.hourSubject, t.hourTag, w.time, body, t.footer) };
}

// ─── Email to the team member who runs it (Spanish) ───
export function renderHostReminder(m: Meeting, site: string) {
  const tz = m.host_timezone || 'America/Lima', w = when(m.starts_at, tz, 'es');
  const who = m.name || m.email;
  const subject = `Reunión con ${who} en 1 hora (${w.time})`;
  const body = para(`Tu reunión con <b>${esc(who)}</b> empieza a las <b>${esc(w.time)}</b> (hora de ${esc(tzLabel(tz))})${m.status === 'confirmada' ? ', confirmada' : ', todavía sin confirmar'}.`)
    + para('Parte oral del test, su objetivo y cuándo podría empezar, las clases, la inscripción y las tarifas. Después, márcala en su ficha: «Se hizo» o «No vino».')
    + button(m.zoom_link, 'Abrir Zoom') + para(link(`${site}/campus/#prospectos`, 'Ver su ficha en el Campus'), 'font-size:15px;');
  return { subject, html: layout('es', subject, 'CAMPUS PATHWAY · REUNIÓN', w.time, body, 'Recordatorio automático del Campus.') };
}
