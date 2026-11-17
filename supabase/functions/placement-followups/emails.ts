// The three follow-up emails after the level test (campus/db/029_relances_embudo.sql), in the
// language of the test: 1. the result and the plan (right away), 2. how the classes work (2 days
// later), 3. an offer to help choose a pace (5 days later, the last one). Same tone as the result
// page of the site: one message for each level and the month the NCLC 7 could come at 3 h a week.

export type Due = {
  id: string; email: string; level: string; overall: number | null; mode: string | null; lang: string;
  detail: { skills?: Record<string, number> } | null; step: number; unsub_token: string; full_name: string | null;
};
export type Links = { site: string; whatsapp: string; messenger: string };

const FONT = 'Arial,Helvetica,sans-serif';
const INK = '#122b26', PAPER = '#fffaf2', ACTION = '#a34e3b', SAGE = '#cad8c3', MUTED = '#50625c';
const LOGO = 'https://pathway-languages.com/campus/email/logo.png';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const MONTHS_LEFT: Record<string, number> = { A1: 20, A2: 15, B1: 10, B2: 5 };

type Copy = {
  locale: string; insPath: string; hello: (name: string) => string;
  skills: Record<string, string>; speaking: string; outOf: string;
  title: Record<string, string>; level: Record<string, (date: string) => string>;
  r1: { subject: (l: string) => string; preview: string; tag: string; intro: string; skillsTitle: string; cta: string; talk: string; note: string };
  r2: { subject: string; preview: string; tag: string; hero: string; title: string; intro: (l: string) => string; points: string[]; price: string; cta: string; talk: string };
  r3: { subject: string; preview: string; tag: string; hero: string; title: string; body: (l: string) => string; date: (d: string) => string; cta: string; self: string; last: string };
  wa: (l: string) => string; footer: string; unsubscribe: string;
};

const C: Record<string, Copy> = {
  es: {
    locale: 'es-PE', insPath: '/inscription.html', hello: n => (n ? `Hola ${n},` : 'Hola,'),
    skills: { reading: 'Comprensión escrita', listening: 'Comprensión oral', grammarVocabulary: 'Gramática y vocabulario' },
    speaking: 'Expresión oral: se confirma en tu primera clase.', outOf: '/100',
    title: { A1: 'Tu nivel: A1. El mejor momento para construir bien.', A2: 'Tu nivel: A2. Tus bases ya están: falta el método.', B1: 'Tu nivel: B1. Ya hiciste la mitad del camino.', B2: 'Tu nivel: B2. El NCLC 7 está a tu alcance.' },
    level: {
      A1: d => `Empezar con un profesor particular desde la primera clase evita los errores que luego cuestan meses corregir. Con 3 h por semana, tu NCLC 7 podría llegar hacia ${d}*. Cada mes que esperas, esa fecha se aleja un mes.`,
      A2: d => `En A2 un profesor particular marca la diferencia: corrige lo que se fijó mal y acelera lo que ya sabes. Con 3 h por semana, tu NCLC 7 podría llegar hacia ${d}*. Cada mes que esperas, esa fecha se aleja un mes.`,
      B1: d => `Entre B1 y B2 es donde más gente se estanca estudiando sola. Con un plan semanal y correcciones personalizadas, tu NCLC 7 podría llegar hacia ${d}*. Cada mes que esperas, esa fecha se aleja un mes.`,
      B2: d => `Ahora se trata de dominar el formato del TEF o del TCF y asegurar cada competencia el día del examen. Con una preparación enfocada, podrías presentarte hacia ${d}*: cuanto antes empiezas, antes sumas tus puntos de francés.`
    },
    r1: { subject: l => `Tu resultado del test: ${l} (y tu plan hacia el NCLC 7)`, preview: 'Tu nivel, tus puntos fuertes y la fecha a la que podrías llegar al NCLC 7.', tag: 'TU RESULTADO DEL TEST DE NIVEL', intro: 'Aquí tienes tu resultado. Tu profesor lo tendrá listo para tu primera clase.', skillsTitle: 'Tu detalle por competencia', cta: 'Elegir mi ritmo y mis horarios', talk: '¿Prefieres hablarlo antes con nosotros?', note: '*Estimación con 3 h por semana (un nivel cada 5 meses); tu profesor confirma el plan en tu primera clase.' },
    r2: { subject: 'Así es una semana con Pathway', preview: 'Clases particulares en vivo, ejercicios corregidos y un objetivo claro: el NCLC 7.', tag: 'CÓMO FUNCIONA', hero: 'Tu semana', title: 'Así avanzas cada semana', intro: l => `Hace dos días hiciste el test (nivel ${l}). Así sería tu ruta con nosotros:`, points: ['Clases particulares en vivo por Zoom: un alumno, un profesor, en tus horarios.', 'Tu Campus entre clases: ejercicios en tu nivel, corregidos y explicados.', 'Un objetivo claro: el TEF o el TCF Canada y tu NCLC 7.', 'Pagas solo después de confirmar tu horario por escrito.'], price: 'Desde 185 CAD al mes (2 h por semana). En la página verás el equivalente aproximado en tu moneda.', cta: 'Ver ritmos y precios', talk: '¿Una pregunta? Escríbenos:' },
    r3: { subject: '¿Te ayudamos a elegir tu ritmo?', preview: 'Cuéntanos tu fecha de examen y te proponemos un ritmo realista, sin compromiso.', tag: 'TU RITMO', hero: '¿2, 3 o 4 h?', title: '¿Te ayudamos a elegir?', body: l => `Hiciste el test hace unos días (nivel ${l}). Si dudas entre 2, 3 o más horas por semana, cuéntanos tu fecha de examen y tu disponibilidad: te proponemos un ritmo realista, sin compromiso.`, date: d => `Con 3 h por semana, tu NCLC 7 podría llegar hacia ${d}. Cada mes que esperas, esa fecha se aleja un mes.`, cta: 'Escribirnos por WhatsApp', self: 'O elige tú mismo tu ritmo y tus horarios', last: 'Es nuestro último correo sobre tu test: después, solo te escribimos si tú nos escribes.' },
    wa: l => `Hola Pathway, hice el test de nivel (resultado: ${l}) y quisiera ayuda para elegir mi ritmo.`,
    footer: 'Recibes este correo porque hiciste el test de nivel en pathway-languages.com.', unsubscribe: 'Darme de baja'
  },
  fr: {
    locale: 'fr-CA', insPath: '/fr/inscription.html', hello: n => (n ? `Bonjour ${n},` : 'Bonjour,'),
    skills: { reading: 'Compréhension écrite', listening: 'Compréhension orale', grammarVocabulary: 'Grammaire et vocabulaire' },
    speaking: 'Expression orale : confirmée dès votre premier cours.', outOf: '/100',
    title: { A1: 'Votre niveau : A1. Le meilleur moment pour bien construire.', A2: 'Votre niveau : A2. Les bases sont là : il manque la méthode.', B1: 'Votre niveau : B1. La moitié du chemin est faite.', B2: 'Votre niveau : B2. Le NCLC 7 est à votre portée.' },
    level: {
      A1: d => `Commencer avec un professeur particulier dès le premier cours évite les erreurs qui coûtent ensuite des mois à corriger. Avec 3 h par semaine, votre NCLC 7 pourrait arriver vers ${d}*. Chaque mois d’attente repousse cette date d’un mois.`,
      A2: d => `En A2, un professeur particulier fait la différence : il corrige ce qui s’est mal fixé et accélère ce que vous savez déjà. Avec 3 h par semaine, votre NCLC 7 pourrait arriver vers ${d}*. Chaque mois d’attente repousse cette date d’un mois.`,
      B1: d => `C’est entre B1 et B2 que l’on stagne le plus en travaillant seul. Avec un plan hebdomadaire et des corrections personnalisées, votre NCLC 7 pourrait arriver vers ${d}*. Chaque mois d’attente repousse cette date d’un mois.`,
      B2: d => `Il s’agit maintenant de maîtriser le format du TEF ou du TCF et d’assurer chaque compétence le jour de l’examen. Avec une préparation ciblée, vous pourriez le passer vers ${d}* : plus tôt vous commencez, plus tôt vos points de français comptent.`
    },
    r1: { subject: l => `Votre résultat au test : ${l} (et votre plan vers le NCLC 7)`, preview: 'Votre niveau, vos points forts et la date à laquelle vous pourriez atteindre le NCLC 7.', tag: 'VOTRE RÉSULTAT AU TEST DE NIVEAU', intro: 'Voici votre résultat. Votre professeur l’aura sous les yeux dès votre premier cours.', skillsTitle: 'Votre détail par compétence', cta: 'Choisir mon rythme et mes horaires', talk: 'Vous préférez en parler avec nous d’abord ?', note: '*Estimation avec 3 h par semaine (un niveau tous les 5 mois) ; votre professeur confirme le plan dès votre premier cours.' },
    r2: { subject: 'Une semaine avec Pathway', preview: 'Cours particuliers en direct, exercices corrigés et un objectif clair : le NCLC 7.', tag: 'COMMENT ÇA MARCHE', hero: 'Votre semaine', title: 'Comment vous progressez chaque semaine', intro: l => `Il y a deux jours, vous avez fait le test (niveau ${l}). Voici à quoi ressemblerait votre parcours avec nous :`, points: ['Des cours particuliers en direct sur Zoom : un élève, un professeur, à vos horaires.', 'Votre Campus entre les cours : des exercices à votre niveau, corrigés et expliqués.', 'Un objectif clair : le TEF ou le TCF Canada et votre NCLC 7.', 'Vous ne payez qu’après la confirmation écrite de votre horaire.'], price: 'À partir de 185 CAD par mois (2 h par semaine).', cta: 'Voir les rythmes et les prix', talk: 'Une question ? Écrivez-nous :' },
    r3: { subject: 'On vous aide à choisir votre rythme ?', preview: 'Donnez-nous votre date d’examen : nous vous proposons un rythme réaliste, sans engagement.', tag: 'VOTRE RYTHME', hero: '2, 3 ou 4 h ?', title: 'On vous aide à choisir ?', body: l => `Vous avez fait le test il y a quelques jours (niveau ${l}). Si vous hésitez entre 2, 3 heures par semaine ou plus, donnez-nous votre date d’examen et vos disponibilités : nous vous proposons un rythme réaliste, sans engagement.`, date: d => `Avec 3 h par semaine, votre NCLC 7 pourrait arriver vers ${d}. Chaque mois d’attente repousse cette date d’un mois.`, cta: 'Nous écrire sur WhatsApp', self: 'Ou choisissez vous-même votre rythme et vos horaires', last: 'C’est notre dernier e-mail sur votre test : ensuite, nous ne vous écrivons que si vous nous écrivez.' },
    wa: l => `Bonjour Pathway, j’ai fait le test de niveau (résultat : ${l}) et j’aimerais de l’aide pour choisir mon rythme.`,
    footer: 'Vous recevez cet e-mail parce que vous avez fait le test de niveau sur pathway-languages.com.', unsubscribe: 'Me désinscrire'
  },
  en: {
    locale: 'en-CA', insPath: '/en/inscription.html', hello: n => (n ? `Hi ${n},` : 'Hi,'),
    skills: { reading: 'Reading', listening: 'Listening', grammarVocabulary: 'Grammar & vocabulary' },
    speaking: 'Speaking: confirmed in your first class.', outOf: '/100',
    title: { A1: 'Your level: A1. The best time to build it right.', A2: 'Your level: A2. The basics are there: now you need a method.', B1: 'Your level: B1. You are halfway there.', B2: 'Your level: B2. NCLC 7 is within reach.' },
    level: {
      A1: d => `Starting with a private teacher from the first class avoids the mistakes that take months to fix later. At 3 h a week, your NCLC 7 could come around ${d}*. Every month you wait pushes that date back a month.`,
      A2: d => `At A2 a private teacher makes the difference: fixing what was learned wrong and speeding up what you already know. At 3 h a week, your NCLC 7 could come around ${d}*. Every month you wait pushes that date back a month.`,
      B1: d => `Between B1 and B2 is where most people stall studying alone. With a weekly plan and personal corrections, your NCLC 7 could come around ${d}*. Every month you wait pushes that date back a month.`,
      B2: d => `Now it is about mastering the TEF or TCF format and securing every skill on exam day. With focused preparation, you could sit the exam around ${d}*: the sooner you start, the sooner your French points count.`
    },
    r1: { subject: l => `Your test result: ${l} (and your plan to NCLC 7)`, preview: 'Your level, your strengths and when you could reach NCLC 7.', tag: 'YOUR LEVEL TEST RESULT', intro: 'Here is your result. Your teacher will have it ready for your first class.', skillsTitle: 'Your skills in detail', cta: 'Choose my pace and schedule', talk: 'Prefer to talk it over with us first?', note: '*Estimate at 3 h a week (one level every 5 months); your teacher confirms the plan in your first class.' },
    r2: { subject: 'A week with Pathway', preview: 'Live private classes, corrected exercises and one clear goal: NCLC 7.', tag: 'HOW IT WORKS', hero: 'Your week', title: 'How you progress every week', intro: l => `Two days ago you took the test (level ${l}). Here is what your path with us would look like:`, points: ['Live private classes on Zoom: one student, one teacher, at your times.', 'Your Campus between classes: exercises at your level, corrected and explained.', 'One clear goal: the TEF or TCF Canada and your NCLC 7.', 'You only pay once your schedule is confirmed in writing.'], price: 'From 185 CAD a month (2 h a week).', cta: 'See paces and prices', talk: 'A question? Message us:' },
    r3: { subject: 'Shall we help you choose your pace?', preview: 'Tell us your exam date and we will suggest a realistic pace, no commitment.', tag: 'YOUR PACE', hero: '2, 3 or 4 h?', title: 'Shall we help you choose?', body: l => `You took the test a few days ago (level ${l}). If you are hesitating between 2, 3 or more hours a week, tell us your exam date and availability: we will suggest a realistic pace, no commitment.`, date: d => `At 3 h a week, your NCLC 7 could come around ${d}. Every month you wait pushes that date back a month.`, cta: 'Message us on WhatsApp', self: 'Or choose your pace and schedule yourself', last: 'This is our last email about your test: after this, we only write if you write to us.' },
    wa: l => `Hello Pathway, I took the level test (result: ${l}) and would like help choosing my pace.`,
    footer: 'You are receiving this email because you took the level test on pathway-languages.com.', unsubscribe: 'Unsubscribe'
  },
  de: {
    locale: 'de-DE', insPath: '/de/inscription.html', hello: n => (n ? `Hallo ${n},` : 'Hallo,'),
    skills: { reading: 'Leseverstehen', listening: 'Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz' },
    speaking: 'Sprechen: wird in Ihrer ersten Stunde bestätigt.', outOf: '/100',
    title: { A1: 'Ihr Niveau: A1. Der beste Moment, es richtig aufzubauen.', A2: 'Ihr Niveau: A2. Die Grundlagen sind da: jetzt fehlt die Methode.', B1: 'Ihr Niveau: B1. Die Hälfte des Weges ist geschafft.', B2: 'Ihr Niveau: B2. NCLC 7 ist in Reichweite.' },
    level: {
      A1: d => `Mit einer Privatlehrkraft ab der ersten Stunde vermeiden Sie Fehler, deren Korrektur später Monate kostet. Mit 3 Std. pro Woche könnte Ihr NCLC 7 um ${d}* erreicht sein. Jeder Monat Warten verschiebt dieses Datum um einen Monat.`,
      A2: d => `Auf A2 macht eine Privatlehrkraft den Unterschied: Sie korrigiert, was sich falsch eingeprägt hat, und beschleunigt, was Sie schon können. Mit 3 Std. pro Woche könnte Ihr NCLC 7 um ${d}* erreicht sein. Jeder Monat Warten verschiebt dieses Datum um einen Monat.`,
      B1: d => `Zwischen B1 und B2 bleiben die meisten beim Selbstlernen stecken. Mit einem Wochenplan und persönlichen Korrekturen könnte Ihr NCLC 7 um ${d}* erreicht sein. Jeder Monat Warten verschiebt dieses Datum um einen Monat.`,
      B2: d => `Jetzt geht es darum, das Format von TEF oder TCF zu beherrschen und jede Kompetenz am Prüfungstag zu sichern. Mit gezielter Vorbereitung könnten Sie um ${d}* antreten: Je früher Sie beginnen, desto früher zählen Ihre Französischpunkte.`
    },
    r1: { subject: l => `Ihr Testergebnis: ${l} (und Ihr Plan zum NCLC 7)`, preview: 'Ihr Niveau, Ihre Stärken und wann Sie NCLC 7 erreichen könnten.', tag: 'IHR ERGEBNIS IM EINSTUFUNGSTEST', intro: 'Hier ist Ihr Ergebnis. Ihre Lehrkraft hat es zur ersten Stunde vorliegen.', skillsTitle: 'Ihre Kompetenzen im Detail', cta: 'Rhythmus und Zeiten wählen', talk: 'Lieber vorher mit uns sprechen?', note: '*Schätzung bei 3 Std. pro Woche (ein Niveau alle 5 Monate); Ihre Lehrkraft bestätigt den Plan in der ersten Stunde.' },
    r2: { subject: 'Eine Woche mit Pathway', preview: 'Live-Privatunterricht, korrigierte Übungen und ein klares Ziel: NCLC 7.', tag: 'SO FUNKTIONIERT ES', hero: 'Ihre Woche', title: 'So kommen Sie jede Woche voran', intro: l => `Vor zwei Tagen haben Sie den Test gemacht (Niveau ${l}). So sähe Ihr Weg mit uns aus:`, points: ['Live-Privatunterricht über Zoom: eine Person, eine Lehrkraft, zu Ihren Zeiten.', 'Ihr Campus zwischen den Stunden: Übungen auf Ihrem Niveau, korrigiert und erklärt.', 'Ein klares Ziel: TEF oder TCF Canada und Ihr NCLC 7.', 'Sie zahlen erst nach der schriftlichen Bestätigung Ihres Termins.'], price: 'Ab 185 CAD pro Monat (2 Std. pro Woche).', cta: 'Rhythmen und Preise ansehen', talk: 'Eine Frage? Schreiben Sie uns:' },
    r3: { subject: 'Sollen wir Ihnen bei der Wahl des Rhythmus helfen?', preview: 'Nennen Sie uns Ihr Prüfungsdatum: Wir schlagen einen realistischen Rhythmus vor, unverbindlich.', tag: 'IHR RHYTHMUS', hero: '2, 3 oder 4 Std.?', title: 'Sollen wir helfen?', body: l => `Sie haben den Test vor ein paar Tagen gemacht (Niveau ${l}). Wenn Sie zwischen 2, 3 oder mehr Stunden pro Woche schwanken, nennen Sie uns Ihr Prüfungsdatum und Ihre Verfügbarkeit: Wir schlagen einen realistischen Rhythmus vor, unverbindlich.`, date: d => `Mit 3 Std. pro Woche könnte Ihr NCLC 7 um ${d} erreicht sein. Jeder Monat Warten verschiebt dieses Datum um einen Monat.`, cta: 'Per WhatsApp schreiben', self: 'Oder wählen Sie Rhythmus und Zeiten selbst', last: 'Dies ist unsere letzte E-Mail zu Ihrem Test: Danach schreiben wir nur, wenn Sie uns schreiben.' },
    wa: l => `Hallo Pathway, ich habe den Einstufungstest gemacht (Ergebnis: ${l}) und hätte gern Hilfe bei der Wahl meines Rhythmus.`,
    footer: 'Sie erhalten diese E-Mail, weil Sie den Einstufungstest auf pathway-languages.com gemacht haben.', unsubscribe: 'Abmelden'
  }
};

function targetMonth(level: string, locale: string, now = new Date()): string {
  const d = new Date(now); d.setMonth(d.getMonth() + (MONTHS_LEFT[level] || 20));
  try { return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d); } catch (_) { return String(d.getFullYear()); }
}

function layout(o: { lang: string; title: string; preview: string; tag: string; hero: string; body: string; footer: string; unsubscribeUrl: string; unsubscribe: string }): string {
  return `<!doctype html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5efe4;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5efe4;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 18px;"><img src="${LOGO}" width="148" height="42" alt="Pathway" style="display:block;border:0;width:148px;height:42px;"></td></tr>
    <tr><td style="background:${PAPER};border-radius:24px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:${INK};padding:28px 28px 24px;border-radius:24px 24px 0 0;">
          <p style="margin:0 0 8px;font:700 12px/1.4 ${FONT};color:${SAGE};letter-spacing:.08em;">${esc(o.tag)}</p>
          <p style="margin:0;font:800 52px/1 ${FONT};letter-spacing:-2px;color:${PAPER};">${esc(o.hero)}</p>
        </td></tr>
        <tr><td style="padding:28px;">${o.body}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 8px 0;font:400 12px/1.6 ${FONT};color:#7d8a85;text-align:center;">
      ${esc(o.footer)}<br>Pathway Language Solutions · <a href="https://pathway-languages.com/" style="color:#7d8a85;">pathway-languages.com</a> · <a href="${o.unsubscribeUrl}" style="color:#7d8a85;">${esc(o.unsubscribe)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
const h1 = (t: string) => `<h1 style="margin:0 0 14px;font:800 24px/1.25 ${FONT};letter-spacing:-.4px;color:${INK};">${esc(t)}</h1>`;
const para = (t: string, extra = '') => `<p style="margin:0 0 18px;font:400 16px/1.6 ${FONT};color:${MUTED};${extra}">${t}</p>`;
const small = (t: string) => `<p style="margin:0;font:400 13px/1.6 ${FONT};color:#7d8a85;">${esc(t)}</p>`;
const button = (href: string, label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;"><tr><td align="center" style="background:${ACTION};border-radius:12px;"><a href="${href}" style="display:block;padding:17px 20px;font:700 16px/1.2 ${FONT};color:${PAPER};text-decoration:none;text-align:center;border-radius:12px;">${esc(label)} &rarr;</a></td></tr></table>`;
const channels = (l: Links, wa: string, label: string) => {
  const cell = (href: string, text: string, color: string) => `<td width="50%" style="padding:0 4px;"><a href="${href}" style="display:block;padding:14px 8px;border:1.5px solid ${color};border-radius:12px;font:700 15px/1 ${FONT};color:${color};text-decoration:none;text-align:center;">${text}</a></td>`;
  const row = l.messenger
    ? `${cell(wa, 'WhatsApp', '#128c4a')}${cell(l.messenger, 'Messenger', '#0866ff')}`
    : `<td style="padding:0 4px;"><a href="${wa}" style="display:block;padding:14px 8px;border:1.5px solid #128c4a;border-radius:12px;font:700 15px/1 ${FONT};color:#128c4a;text-decoration:none;text-align:center;">WhatsApp</a></td>`;
  return `<p style="margin:0 0 10px;font:700 15px/1.4 ${FONT};color:${INK};">${esc(label)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;table-layout:fixed;"><tr>${row}</tr></table>`;
};

export function renderFollowup(d: Due, links: Links, now = new Date()): { subject: string; html: string; unsubscribeUrl: string } {
  const lang = C[d.lang] ? d.lang : 'es';
  const t = C[lang];
  const level = ['A1', 'A2', 'B1', 'B2'].includes(d.level) ? d.level : 'A1';
  const date = targetMonth(level, t.locale, now);
  const first = (d.full_name || '').trim().split(/\s+/)[0] || '';
  const campaign = `test_r${d.step + 1}`;
  const ins = `${links.site}${t.insPath}?mode=${encodeURIComponent(d.mode || 'express')}&level=${level}&utm_source=email&utm_medium=followup&utm_campaign=${campaign}`;
  const wa = `${links.whatsapp}?text=${encodeURIComponent(t.wa(level))}`;
  const messenger = links.messenger ? `${links.messenger}${links.messenger.includes('?') ? '&' : '?'}ref=${campaign}` : '';
  const ln: Links = { ...links, messenger };
  const unsubscribeUrl = `${links.site}/baja.html?t=${encodeURIComponent(d.unsub_token)}&l=${lang}`;
  const base = { lang, footer: t.footer, unsubscribe: t.unsubscribe, unsubscribeUrl };
  const hello = para(esc(t.hello(first)), `color:${INK};`);

  if (d.step === 0) {
    const skills = d.detail?.skills || {};
    const rows = ['reading', 'listening', 'grammarVocabulary'].filter(k => typeof skills[k] === 'number').map(k => {
      const v = Math.max(0, Math.min(100, Math.round(skills[k])));
      return `<tr><td style="padding:8px 0;font:400 15px/1.4 ${FONT};color:${INK};">${esc(t.skills[k])}</td><td align="right" style="padding:8px 0;font:700 15px/1.4 ${FONT};color:${INK};white-space:nowrap;">${v}${t.outOf}</td></tr>
        <tr><td colspan="2" style="padding:0 0 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;background:#e7e2d8;border-radius:6px;"><table role="presentation" width="${Math.max(2, v)}%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;background:${INK};border-radius:6px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>`;
    }).join('');
    const body = hello + para(esc(t.r1.intro)) + h1(t.title[level]) + para(esc(t.level[level](date)))
      + button(ins, t.r1.cta) + channels(ln, wa, t.r1.talk)
      + (rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;padding:16px 18px;background:#f3eee4;border-radius:16px;"><tr><td colspan="2" style="padding:0 0 6px;font:700 14px/1.4 ${FONT};color:${INK};">${esc(t.r1.skillsTitle)}</td></tr>${rows}<tr><td colspan="2" style="padding:6px 0 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(t.speaking)}</td></tr></table>` : '')
      + small(t.r1.note);
    return { subject: t.r1.subject(level), unsubscribeUrl, html: layout({ ...base, title: t.r1.subject(level), preview: t.r1.preview, tag: t.r1.tag, hero: level, body }) };
  }
  if (d.step === 1) {
    const list = t.r2.points.map(p => `<tr><td valign="top" style="padding:6px 10px 6px 0;font:700 16px/1.5 ${FONT};color:${ACTION};">&#10003;</td><td style="padding:6px 0;font:400 16px/1.5 ${FONT};color:${INK};">${esc(p)}</td></tr>`).join('');
    const body = hello + h1(t.r2.title) + para(esc(t.r2.intro(level)))
      + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">${list}</table>`
      + para(esc(t.r2.price), 'font-size:15px;') + button(ins, t.r2.cta) + channels(ln, wa, t.r2.talk);
    return { subject: t.r2.subject, unsubscribeUrl, html: layout({ ...base, title: t.r2.subject, preview: t.r2.preview, tag: t.r2.tag, hero: t.r2.hero, body }) };
  }
  const body = hello + h1(t.r3.title) + para(esc(t.r3.body(level))) + para(esc(t.r3.date(date)), `color:${INK};font-weight:700;`)
    + button(wa, t.r3.cta)
    + (messenger ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:-8px 0 22px;"><tr><td><a href="${messenger}" style="display:block;padding:14px 8px;border:1.5px solid #0866ff;border-radius:12px;font:700 15px/1 ${FONT};color:#0866ff;text-decoration:none;text-align:center;">Messenger</a></td></tr></table>` : '')
    + para(`<a href="${ins}" style="color:${INK};font-weight:700;">${esc(t.r3.self)} &rarr;</a>`) + small(t.r3.last);
  return { subject: t.r3.subject, unsubscribeUrl, html: layout({ ...base, title: t.r3.subject, preview: t.r3.preview, tag: t.r3.tag, hero: t.r3.hero, body }) };
}
