// The three follow-up emails after the level test (campus/db/029_relances_embudo.sql, 037), in the
// language of the test: 1. thanks, the result and what to work on, then the invitation to complete
// the test (right away); 2. a reminder of that invitation (2 days later); 3. the last reminder
// (5 days later). No date, no pace and no price: those are for the meeting.
//
// The test has no speaking part: it is completed in a personalised Zoom meeting with a teacher,
// where the team also talks about the goal, the availability and start date, how the classes and
// the Campus work, enrolment, fees and payment. The button opens disponibilidad.html, where the
// person sends their free times (db/037); a reply to the email lands in the Campus (« Correo »).

export type Due = {
  id: string; email: string; level: string; overall: number | null; mode: string | null; lang: string;
  detail: { skills?: Record<string, number> } | null; step: number; unsub_token: string; full_name: string | null;
  // Free times already sent from the result page (db/039): the first email confirms them instead.
  has_meeting?: boolean | null;
};
export type Links = { site: string };

const FONT = 'Arial,Helvetica,sans-serif';
const INK = '#122b26', PAPER = '#fffaf2', ACTION = '#a34e3b', SAGE = '#cad8c3', MUTED = '#50625c';
const LOGO = 'https://pathway-languages.com/campus/email/logo.png';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

type Copy = {
  hello: (name: string) => string;
  skills: Record<string, string>; outOf: string; priority: string; speaking: string;
  meetingTitle: string; meetingIntro: string; meetingPoints: string[]; cta: string; ctaNote: string; reply: string;
  gotTitle: string; got: string;
  r1: { subject: (l: string) => string; preview: string; tag: string; thanks: string; title: (l: string, score: string) => string; skillsTitle: string };
  r2: { subject: string; preview: string; tag: string; hero: string; title: string; intro: (l: string) => string };
  r3: { subject: string; preview: string; tag: string; hero: string; title: string; body: (l: string) => string; last: string };
  footer: string; unsubscribe: string;
};

const C: Record<string, Copy> = {
  es: {
    hello: n => (n ? `Hola ${n},` : 'Hola,'),
    skills: { reading: 'Comprensión escrita', listening: 'Comprensión oral', grammarVocabulary: 'Gramática y vocabulario' },
    outOf: '/100', priority: 'Tu prioridad', speaking: 'Expresión oral: se evalúa en la reunión con un profesor.',
    meetingTitle: 'Completa tu test con un profesor',
    meetingIntro: 'Este test no evalúa la expresión oral. Para completarlo, te invitamos a una reunión personalizada y gratuita por Zoom con un profesor de Pathway. En esa reunión:',
    meetingPoints: [
      'Hacemos juntos la parte oral del test.',
      'Hablamos de tu objetivo: Entrada Express, Quebec, estudios, trabajo…',
      'Vemos tus disponibilidades y cuándo podrías empezar.',
      'Te mostramos cómo funcionan las clases y el Campus.',
      'Te explicamos la inscripción, las tarifas y las formas de pago, y respondemos a todas tus preguntas.'
    ],
    cta: 'Enviar mis disponibilidades', ctaNote: 'Te toma un minuto: marcas los momentos de la semana en que puedes conectarte y te proponemos la reunión.',
    reply: '¿Una pregunta? Responde a este correo: lo lee una persona del equipo.',
    gotTitle: 'Recibimos tus disponibilidades', got: 'Gracias: un profesor te escribe muy pronto para proponerte tu reunión gratuita por Zoom. Ahí hacemos la parte oral de tu test, hablamos de tu objetivo y de cuándo podrías empezar, y te explicamos las clases, la inscripción y las tarifas.',
    r1: { subject: l => `Tu resultado del test de nivel: ${l}`, preview: 'Tu nivel, lo que conviene trabajar y el último paso: la parte oral con un profesor.', tag: 'TU RESULTADO DEL TEST DE NIVEL',
      thanks: 'Gracias por tu interés en Pathway y por tomarte el tiempo de hacer el test. Aquí tienes tu resultado.',
      title: (l, s) => `Tu nivel estimado: ${l}${s}`, skillsTitle: 'Tu resultado por competencia' },
    r2: { subject: '¿Cuándo hacemos la parte oral de tu test?', preview: 'Marca tus momentos libres y un profesor te propone la reunión.', tag: 'TU REUNIÓN CON UN PROFESOR', hero: 'Parte oral',
      title: 'Te falta un paso para completar tu test',
      intro: l => `Hace dos días hiciste el test de nivel (resultado: ${l}). Falta la parte oral: se hace en una reunión personalizada y gratuita por Zoom con un profesor, donde también hablamos de tu objetivo, de cómo funcionan las clases, de la inscripción y de las tarifas.` },
    r3: { subject: 'Tu test de nivel sigue incompleto', preview: 'Último recordatorio: la parte oral con un profesor.', tag: 'ÚLTIMO RECORDATORIO', hero: '¿Hablamos?',
      title: '¿Completamos tu test?',
      body: l => `Hiciste el test hace unos días (resultado: ${l}), pero falta la parte oral. Envíanos tus disponibilidades y un profesor te propone una reunión gratuita por Zoom para completarlo y responder a tus preguntas.`,
      last: 'Es nuestro último correo sobre tu test: después, solo te escribimos si tú nos escribes.' },
    footer: 'Recibes este correo porque hiciste el test de nivel en pathway-languages.com.', unsubscribe: 'Darme de baja'
  },
  fr: {
    hello: n => (n ? `Bonjour ${n},` : 'Bonjour,'),
    skills: { reading: 'Compréhension écrite', listening: 'Compréhension orale', grammarVocabulary: 'Grammaire et vocabulaire' },
    outOf: '/100', priority: 'Votre priorité', speaking: 'Expression orale : évaluée pendant la réunion avec un professeur.',
    meetingTitle: 'Complétez votre test avec un professeur',
    meetingIntro: 'Ce test n’évalue pas l’expression orale. Pour le compléter, nous vous invitons à une réunion personnalisée et gratuite sur Zoom avec un professeur de Pathway. Pendant cette réunion :',
    meetingPoints: [
      'Nous faisons ensemble la partie orale du test.',
      'Nous parlons de votre objectif : Entrée express, Québec, études, travail…',
      'Nous voyons vos disponibilités et quand vous pourriez commencer.',
      'Nous vous montrons comment fonctionnent les cours et le Campus.',
      'Nous vous expliquons l’inscription, les tarifs et les modes de paiement, et répondons à toutes vos questions.'
    ],
    cta: 'Envoyer mes disponibilités', ctaNote: 'Cela prend une minute : cochez les moments de la semaine où vous pouvez vous connecter, nous vous proposons la réunion.',
    reply: 'Une question ? Répondez à cet e-mail : une personne de l’équipe le lit.',
    gotTitle: 'Nous avons reçu vos disponibilités', got: 'Merci : un professeur vous écrit très vite pour vous proposer votre réunion gratuite sur Zoom. Nous y ferons la partie orale de votre test, parlerons de votre objectif et de quand vous pourriez commencer, et vous expliquerons les cours, l’inscription et les tarifs.',
    r1: { subject: l => `Votre résultat au test de niveau : ${l}`, preview: 'Votre niveau, ce qu’il faut travailler et la dernière étape : la partie orale avec un professeur.', tag: 'VOTRE RÉSULTAT AU TEST DE NIVEAU',
      thanks: 'Merci pour votre intérêt pour Pathway et pour le temps pris à faire le test. Voici votre résultat.',
      title: (l, s) => `Votre niveau estimé : ${l}${s}`, skillsTitle: 'Votre résultat par compétence' },
    r2: { subject: 'Quand faisons-nous la partie orale de votre test ?', preview: 'Cochez vos moments libres et un professeur vous propose la réunion.', tag: 'VOTRE RÉUNION AVEC UN PROFESSEUR', hero: 'Partie orale',
      title: 'Il reste une étape pour compléter votre test',
      intro: l => `Il y a deux jours, vous avez fait le test de niveau (résultat : ${l}). Il manque la partie orale : elle se fait lors d’une réunion personnalisée et gratuite sur Zoom avec un professeur, où nous parlons aussi de votre objectif, du fonctionnement des cours, de l’inscription et des tarifs.` },
    r3: { subject: 'Votre test de niveau est encore incomplet', preview: 'Dernier rappel : la partie orale avec un professeur.', tag: 'DERNIER RAPPEL', hero: 'On en parle ?',
      title: 'On complète votre test ?',
      body: l => `Vous avez fait le test il y a quelques jours (résultat : ${l}), mais il manque la partie orale. Envoyez-nous vos disponibilités : un professeur vous propose une réunion gratuite sur Zoom pour le compléter et répondre à vos questions.`,
      last: 'C’est notre dernier e-mail sur votre test : ensuite, nous ne vous écrivons que si vous nous écrivez.' },
    footer: 'Vous recevez cet e-mail parce que vous avez fait le test de niveau sur pathway-languages.com.', unsubscribe: 'Me désinscrire'
  },
  en: {
    hello: n => (n ? `Hi ${n},` : 'Hi,'),
    skills: { reading: 'Reading', listening: 'Listening', grammarVocabulary: 'Grammar & vocabulary' },
    outOf: '/100', priority: 'Your priority', speaking: 'Speaking: assessed in the meeting with a teacher.',
    meetingTitle: 'Complete your test with a teacher',
    meetingIntro: 'This test does not assess speaking. To complete it, we invite you to a free, personalised Zoom meeting with a Pathway teacher. In that meeting:',
    meetingPoints: [
      'We do the speaking part of the test together.',
      'We talk about your goal: Express Entry, Quebec, studies, work…',
      'We look at your availability and when you could start.',
      'We show you how the classes and the Campus work.',
      'We explain enrolment, fees and payment options, and answer all your questions.'
    ],
    cta: 'Send my availability', ctaNote: 'It takes a minute: tick the times of the week when you can connect and we will suggest the meeting.',
    reply: 'A question? Reply to this email: a person on the team reads it.',
    gotTitle: 'We have your availability', got: 'Thank you: a teacher will write to you very soon to suggest your free Zoom meeting. There we do the speaking part of your test, talk about your goal and when you could start, and explain the classes, enrolment and fees.',
    r1: { subject: l => `Your level test result: ${l}`, preview: 'Your level, what to work on and the last step: the speaking part with a teacher.', tag: 'YOUR LEVEL TEST RESULT',
      thanks: 'Thank you for your interest in Pathway and for taking the time to do the test. Here is your result.',
      title: (l, s) => `Your estimated level: ${l}${s}`, skillsTitle: 'Your result by skill' },
    r2: { subject: 'When shall we do the speaking part of your test?', preview: 'Tick your free times and a teacher will suggest the meeting.', tag: 'YOUR MEETING WITH A TEACHER', hero: 'Speaking',
      title: 'One step left to complete your test',
      intro: l => `Two days ago you took the level test (result: ${l}). The speaking part is still missing: it is done in a free, personalised Zoom meeting with a teacher, where we also talk about your goal, how the classes work, enrolment and fees.` },
    r3: { subject: 'Your level test is still incomplete', preview: 'Last reminder: the speaking part with a teacher.', tag: 'LAST REMINDER', hero: 'Shall we talk?',
      title: 'Shall we complete your test?',
      body: l => `You took the test a few days ago (result: ${l}), but the speaking part is missing. Send us your availability and a teacher will suggest a free Zoom meeting to complete it and answer your questions.`,
      last: 'This is our last email about your test: after this, we only write if you write to us.' },
    footer: 'You are receiving this email because you took the level test on pathway-languages.com.', unsubscribe: 'Unsubscribe'
  },
  de: {
    hello: n => (n ? `Hallo ${n},` : 'Hallo,'),
    skills: { reading: 'Leseverstehen', listening: 'Hörverstehen', grammarVocabulary: 'Grammatik und Wortschatz' },
    outOf: '/100', priority: 'Ihre Priorität', speaking: 'Sprechen: wird im Gespräch mit einer Lehrkraft bewertet.',
    meetingTitle: 'Vervollständigen Sie Ihren Test mit einer Lehrkraft',
    meetingIntro: 'Dieser Test bewertet das Sprechen nicht. Um ihn zu vervollständigen, laden wir Sie zu einem kostenlosen, persönlichen Zoom-Gespräch mit einer Lehrkraft von Pathway ein. In diesem Gespräch:',
    meetingPoints: [
      'machen wir gemeinsam den mündlichen Teil des Tests,',
      'sprechen wir über Ihr Ziel: Express Entry, Quebec, Studium, Arbeit …,',
      'klären wir Ihre Verfügbarkeit und wann Sie beginnen könnten,',
      'zeigen wir Ihnen, wie der Unterricht und der Campus funktionieren,',
      'erklären wir Anmeldung, Preise und Zahlungsweisen und beantworten alle Ihre Fragen.'
    ],
    cta: 'Meine Verfügbarkeit senden', ctaNote: 'Das dauert eine Minute: Kreuzen Sie an, wann Sie in der Woche Zeit haben, und wir schlagen Ihnen das Gespräch vor.',
    reply: 'Eine Frage? Antworten Sie auf diese E-Mail: Eine Person aus dem Team liest sie.',
    gotTitle: 'Wir haben Ihre Verfügbarkeit erhalten', got: 'Danke: Eine Lehrkraft schreibt Ihnen sehr bald, um Ihnen Ihr kostenloses Zoom-Gespräch vorzuschlagen. Dort machen wir den mündlichen Teil Ihres Tests, sprechen über Ihr Ziel und wann Sie beginnen könnten, und erklären Unterricht, Anmeldung und Preise.',
    r1: { subject: l => `Ihr Ergebnis im Einstufungstest: ${l}`, preview: 'Ihr Niveau, woran Sie arbeiten sollten, und der letzte Schritt: der mündliche Teil mit einer Lehrkraft.', tag: 'IHR ERGEBNIS IM EINSTUFUNGSTEST',
      thanks: 'Danke für Ihr Interesse an Pathway und dafür, dass Sie sich Zeit für den Test genommen haben. Hier ist Ihr Ergebnis.',
      title: (l, s) => `Ihr geschätztes Niveau: ${l}${s}`, skillsTitle: 'Ihr Ergebnis nach Kompetenz' },
    r2: { subject: 'Wann machen wir den mündlichen Teil Ihres Tests?', preview: 'Kreuzen Sie Ihre freien Zeiten an, und eine Lehrkraft schlägt Ihnen das Gespräch vor.', tag: 'IHR GESPRÄCH MIT EINER LEHRKRAFT', hero: 'Mündlich',
      title: 'Noch ein Schritt bis zum vollständigen Test',
      intro: l => `Vor zwei Tagen haben Sie den Einstufungstest gemacht (Ergebnis: ${l}). Es fehlt der mündliche Teil: Er findet in einem kostenlosen, persönlichen Zoom-Gespräch mit einer Lehrkraft statt, in dem wir auch über Ihr Ziel, den Unterricht, die Anmeldung und die Preise sprechen.` },
    r3: { subject: 'Ihr Einstufungstest ist noch unvollständig', preview: 'Letzte Erinnerung: der mündliche Teil mit einer Lehrkraft.', tag: 'LETZTE ERINNERUNG', hero: 'Sprechen wir?',
      title: 'Sollen wir Ihren Test vervollständigen?',
      body: l => `Sie haben den Test vor ein paar Tagen gemacht (Ergebnis: ${l}), aber der mündliche Teil fehlt. Senden Sie uns Ihre Verfügbarkeit, und eine Lehrkraft schlägt Ihnen ein kostenloses Zoom-Gespräch vor, um ihn zu vervollständigen und Ihre Fragen zu beantworten.`,
      last: 'Dies ist unsere letzte E-Mail zu Ihrem Test: Danach schreiben wir nur, wenn Sie uns schreiben.' },
    footer: 'Sie erhalten diese E-Mail, weil Sie den Einstufungstest auf pathway-languages.com gemacht haben.', unsubscribe: 'Abmelden'
  }
};

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
const h2 = (t: string) => `<h2 style="margin:26px 0 10px;font:800 20px/1.3 ${FONT};letter-spacing:-.3px;color:${INK};">${esc(t)}</h2>`;
const para = (t: string, extra = '') => `<p style="margin:0 0 18px;font:400 16px/1.6 ${FONT};color:${MUTED};${extra}">${t}</p>`;
const small = (t: string, extra = '') => `<p style="margin:0 0 18px;font:400 13px/1.6 ${FONT};color:#7d8a85;${extra}">${esc(t)}</p>`;
const button = (href: string, label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 10px;"><tr><td align="center" style="background:${ACTION};border-radius:12px;"><a href="${href}" style="display:block;padding:17px 20px;font:700 16px/1.2 ${FONT};color:${PAPER};text-decoration:none;text-align:center;border-radius:12px;">${esc(label)} &rarr;</a></td></tr></table>`;
const checks = (items: string[]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">${items.map(p => `<tr><td valign="top" style="padding:5px 10px 5px 0;font:700 16px/1.5 ${FONT};color:${ACTION};">&#10003;</td><td style="padding:5px 0;font:400 16px/1.5 ${FONT};color:${INK};">${esc(p)}</td></tr>`).join('')}</table>`;

// The skills from weakest to strongest; the weakest is marked as the priority.
function skillsTable(t: Copy, skills: Record<string, number>, title: string): string {
  const list = ['reading', 'listening', 'grammarVocabulary'].filter(k => typeof skills[k] === 'number' && Number.isFinite(skills[k]))
    .map(k => ({ k, v: Math.max(0, Math.min(100, Math.round(skills[k]))) })).sort((a, b) => a.v - b.v);
  if (!list.length) return '';
  const rows = list.map(({ k, v }, i) => `<tr><td style="padding:8px 0;font:${i === 0 ? 700 : 400} 15px/1.4 ${FONT};color:${INK};">${esc(t.skills[k])}${i === 0 && list.length > 1 ? ` <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:${ACTION};color:${PAPER};font:700 11px/1.5 ${FONT};letter-spacing:.02em;">${esc(t.priority)}</span>` : ''}</td><td align="right" style="padding:8px 0;font:700 15px/1.4 ${FONT};color:${INK};white-space:nowrap;">${v}${t.outOf}</td></tr>
    <tr><td colspan="2" style="padding:0 0 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;background:#e7e2d8;border-radius:6px;"><table role="presentation" width="${Math.max(2, v)}%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;background:${i === 0 && list.length > 1 ? ACTION : INK};border-radius:6px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table></td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;padding:16px 18px;background:#f3eee4;border-radius:16px;"><tr><td colspan="2" style="padding:0 0 6px;font:700 14px/1.4 ${FONT};color:${INK};">${esc(title)}</td></tr>${rows}<tr><td colspan="2" style="padding:6px 0 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(t.speaking)}</td></tr></table>`;
}

export function renderFollowup(d: Due, links: Links): { subject: string; html: string; unsubscribeUrl: string } {
  const lang = C[d.lang] ? d.lang : 'es';
  const t = C[lang];
  const level = ['A1', 'A2', 'B1', 'B2'].includes(d.level) ? d.level : 'A1';
  const first = (d.full_name || '').trim().split(/\s+/)[0] || '';
  const campaign = `test_r${d.step + 1}`;
  const token = encodeURIComponent(d.unsub_token);
  const availability = `${links.site}/disponibilidad.html?t=${token}&l=${lang}&utm_source=email&utm_medium=followup&utm_campaign=${campaign}`;
  const unsubscribeUrl = `${links.site}/baja.html?t=${token}&l=${lang}`;
  const base = { lang, footer: t.footer, unsubscribe: t.unsubscribe, unsubscribeUrl };
  const hello = para(esc(t.hello(first)), `color:${INK};`);
  const invite = button(availability, t.cta) + small(t.ctaNote, 'text-align:center;') + para(esc(t.reply), 'font-size:15px;');

  if (d.step === 0) {
    const score = typeof d.overall === 'number' && Number.isFinite(d.overall) ? ` · ${Math.round(d.overall)}${t.outOf}` : '';
    const next = d.has_meeting
      ? h2(t.gotTitle) + para(esc(t.got)) + para(esc(t.reply), 'font-size:15px;')
      : h2(t.meetingTitle) + para(esc(t.meetingIntro)) + checks(t.meetingPoints) + invite;
    const body = hello + para(esc(t.r1.thanks)) + h1(t.r1.title(level, score)) + skillsTable(t, d.detail?.skills || {}, t.r1.skillsTitle) + next;
    return { subject: t.r1.subject(level), unsubscribeUrl, html: layout({ ...base, title: t.r1.subject(level), preview: t.r1.preview, tag: t.r1.tag, hero: level, body }) };
  }
  if (d.step === 1) {
    const body = hello + h1(t.r2.title) + para(esc(t.r2.intro(level))) + invite;
    return { subject: t.r2.subject, unsubscribeUrl, html: layout({ ...base, title: t.r2.subject, preview: t.r2.preview, tag: t.r2.tag, hero: t.r2.hero, body }) };
  }
  const body = hello + h1(t.r3.title) + para(esc(t.r3.body(level))) + invite + small(t.r3.last);
  return { subject: t.r3.subject, unsubscribeUrl, html: layout({ ...base, title: t.r3.subject, preview: t.r3.preview, tag: t.r3.tag, hero: t.r3.hero, body }) };
}
