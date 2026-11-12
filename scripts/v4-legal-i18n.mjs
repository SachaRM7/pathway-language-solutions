// Cookie policy and legal notice in French, English and German, translated by
// hand from the Spanish pages in v4-pages-content.mjs (NEW_LEGAL). Same facts,
// same sections, same anchors.

const contactRows = site => [['Email', '<a href="mailto:contacto@pathway-languages.com">contacto@pathway-languages.com</a>'], ['WhatsApp', '<a href="https://wa.me/51989887516" target="_blank" rel="noopener">+51 989 887 516</a>'], [site, 'pathway-languages.com']];

export const NEW_LEGAL_ASK = {
  es: ['¿Tienes una pregunta?', 'Escríbenos y te respondemos personalmente.', 'Contactar por email'],
  fr: ['Une question ?', 'Écrivez-nous, nous vous répondons personnellement.', 'Nous écrire'],
  en: ['Have a question?', 'Write to us and we’ll answer you personally.', 'Email us'],
  de: ['Haben Sie eine Frage?', 'Schreiben Sie uns, wir antworten persönlich.', 'E-Mail schreiben']
};

export const NEW_LEGAL_I18N = {
  fr: {
    cookies: {
      title: 'Politique de cookies', description: 'Ce que le site de Pathway enregistre dans votre navigateur : aucun cookie de suivi, un stockage de session pour le test et l’inscription.',
      eyebrow: 'Transparence', h1: ['Politique de cookies', 'et stockage.'],
      lead: 'Le site de Pathway n’installe aucun cookie publicitaire ni de suivi. Pour que le test, le calculateur et l’inscription fonctionnent, il enregistre temporairement quelques données dans votre propre navigateur.',
      card: { pill: 'En bref', title: 'Ce que garde votre navigateur', rows: [['Cookies de suivi', 'Aucun'], ['Publicité', 'Aucune'], ['Stockage de session', 'Test et inscription'], ['Stockage local', 'Données publiques d’IRCC']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway n’utilise aucun cookie propre de suivi, de publicité ni de profilage. Aucun outil de mesure d’audience n’est activé sur le site aujourd’hui.', '<p class="pg-note"><strong>Si une mesure d’audience est activée un jour,</strong> cette page sera mise à jour avant, avec le nom du service, ce qu’il mesure et la façon de vous y opposer.</p>']],
        ['sesion', 'Stockage de session', ['Pendant votre navigation, certaines pages enregistrent des données dans le stockage de session de votre navigateur. Elles sont effacées à la fermeture de l’onglet et ne sont pas envoyées à Pathway d’elles-mêmes.', '<ul><li><strong>Test de placement :</strong> le résultat estimé, pour préparer l’inscription.</li><li><strong>Inscription :</strong> le rythme, le mode de paiement et les préférences que vous choisissez.</li><li><strong>Calculateur CRS :</strong> les réponses du formulaire et le message WhatsApp préparé.</li></ul>']],
        ['local', 'Stockage local', ['Le calculateur et les rondes d’IRCC gardent dans votre navigateur une copie des dernières données publiques d’IRCC (rondes d’invitations et règles du CRS), pour continuer à fonctionner si canada.ca ne répond pas. Elles ne contiennent aucune donnée personnelle.']],
        ['terceros', 'Services externes', ['Certaines pages chargent des polices de Google Fonts ou des données publiques de canada.ca. Si vous choisissez de nous écrire par WhatsApp ou par email, les politiques de ces services s’appliquent.']],
        ['control', 'Comment effacer ces données', ['Vous pouvez effacer le stockage de session en fermant l’onglet, et le stockage local depuis les réglages de confidentialité de votre navigateur. Le site continue de fonctionner sans ces données. Pour toute question, consultez notre <a href="{privacy}">politique de confidentialité</a>.']]
      ]
    },
    legal: {
      title: 'Mentions légales', description: 'Mentions légales de Pathway Language Solutions : activité, contact, propriété intellectuelle et limites des informations publiées.',
      eyebrow: 'Informations légales', h1: ['Mentions légales'],
      lead: 'Pathway Language Solutions est un institut de langues qui propose des cours privés de français en ligne et une préparation aux examens TEF Canada et TCF Canada.',
      card: { pill: 'Contact', title: 'Pathway Language Solutions', rows: contactRows('Site') },
      sections: [
        ['actividad', 'Activité', ['Pathway Language Solutions propose des cours privés de français en direct, un matériel pédagogique propre et une préparation aux examens de français reconnus par IRCC.', '<p class="pg-note"><strong>Pathway ne fait pas de conseil en immigration</strong> et ne représente pas de candidats auprès d’IRCC. Pour une décision d’immigration, consultez les sources officielles ou un professionnel réglementé.</p>']],
        ['contenido', 'Informations publiées', ['Les données d’IRCC (rondes d’invitations, règles du CRS) proviennent des sources officielles de canada.ca et sont affichées à titre informatif. Elles peuvent changer à tout moment ; aucune donnée du site ne constitue une prévision ni une garantie d’invitation.', 'Les estimations du test de placement et du calculateur CRS sont indicatives et se confirment avec un professeur ou avec les outils officiels.']],
        ['propiedad', 'Propriété intellectuelle', ['Les manuels, leur structure pédagogique, les textes, les images et le design du site appartiennent à Pathway Language Solutions. Les extraits publiés sont proposés pour une consultation personnelle ; toute reproduction ou diffusion nécessite une autorisation écrite préalable.']],
        ['enlaces', 'Liens externes', ['Le site renvoie vers des services tiers (canada.ca, WhatsApp, organismes d’examen). Pathway ne contrôle ni leur contenu ni leurs politiques.']],
        ['condiciones', 'Conditions et données', ['Les conditions de l’engagement NCLC 7 sont détaillées dans les <a href="{conditions}">conditions générales</a>, et l’utilisation de vos données dans la <a href="{privacy}">politique de confidentialité</a> et la <a href="{cookies}">politique de cookies</a>.']]
      ]
    }
  },
  en: {
    cookies: {
      title: 'Cookie policy', description: 'What the Pathway website stores in your browser: no tracking cookies, session storage for the test and enrolment.',
      eyebrow: 'Transparency', h1: ['Cookie policy', 'and storage.'],
      lead: 'The Pathway website sets no advertising or tracking cookies. So that the test, the calculator and enrolment work, it temporarily stores a little data in your own browser.',
      card: { pill: 'In short', title: 'What your browser keeps', rows: [['Tracking cookies', 'None'], ['Advertising', 'None'], ['Session storage', 'Test and enrolment'], ['Local storage', 'Public IRCC data']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway uses no first-party tracking, advertising or profiling cookies. No audience measurement tool is active on the site today.', '<p class="pg-note"><strong>If audience measurement is ever switched on,</strong> this page will be updated first, with the name of the service, what it measures and how to opt out.</p>']],
        ['sesion', 'Session storage', ['While you browse, some pages save data in your browser’s session storage. It is deleted when you close the tab and is never sent to Pathway on its own.', '<ul><li><strong>Placement test:</strong> the estimated result, to prepare your enrolment.</li><li><strong>Enrolment:</strong> the pace, payment option and preferences you choose.</li><li><strong>CRS calculator:</strong> your form answers and the prepared WhatsApp message.</li></ul>']],
        ['local', 'Local storage', ['The calculator and the IRCC rounds keep a copy of the latest public IRCC data (rounds of invitations and CRS rules) in your browser, so they keep working if canada.ca doesn’t respond. It contains no personal data.']],
        ['terceros', 'External services', ['Some pages load fonts from Google Fonts or public data from canada.ca. If you choose to write to us on WhatsApp or by email, those services’ policies apply.']],
        ['control', 'How to delete this data', ['You can clear session storage by closing the tab, and local storage from your browser’s privacy settings. The site keeps working without this data. For any question, see our <a href="{privacy}">privacy policy</a>.']]
      ]
    },
    legal: {
      title: 'Legal notice', description: 'Legal notice of Pathway Language Solutions: activity, contact, intellectual property and the limits of the information published.',
      eyebrow: 'Legal information', h1: ['Legal notice'],
      lead: 'Pathway Language Solutions is a language institute offering private online French lessons and preparation for the TEF Canada and TCF Canada exams.',
      card: { pill: 'Contact', title: 'Pathway Language Solutions', rows: contactRows('Website') },
      sections: [
        ['actividad', 'Activity', ['Pathway Language Solutions offers live private French lessons, its own teaching materials and preparation for the French exams recognized by IRCC.', '<p class="pg-note"><strong>Pathway does not provide immigration advice</strong> and does not represent applicants before IRCC. For an immigration decision, check the official sources or consult a regulated professional.</p>']],
        ['contenido', 'Published information', ['IRCC data (rounds of invitations, CRS rules) comes from the official canada.ca sources and is shown for information only. It may change at any time; nothing on the site is a forecast or a guarantee of an invitation.', 'Estimates from the placement test and the CRS calculator are indicative and are confirmed with a teacher or with the official tools.']],
        ['propiedad', 'Intellectual property', ['The workbooks, their teaching structure, the texts, the images and the site design belong to Pathway Language Solutions. The published excerpts are offered for personal reference; any reproduction or distribution requires prior written permission.']],
        ['enlaces', 'External links', ['The site links to third-party services (canada.ca, WhatsApp, exam providers). Pathway does not control their content or their policies.']],
        ['condiciones', 'Conditions and data', ['The conditions of the NCLC 7 commitment are set out in the <a href="{conditions}">terms and conditions</a>, and the use of your data in the <a href="{privacy}">privacy policy</a> and the <a href="{cookies}">cookie policy</a>.']]
      ]
    }
  },
  de: {
    cookies: {
      title: 'Cookie-Richtlinie', description: 'Was die Website von Pathway in Ihrem Browser speichert: keine Tracking-Cookies, Sitzungsspeicher für Test und Anmeldung.',
      eyebrow: 'Transparenz', h1: ['Cookie-Richtlinie', 'und Speicherung.'],
      lead: 'Die Website von Pathway setzt keine Werbe- oder Tracking-Cookies. Damit Test, Rechner und Anmeldung funktionieren, speichert sie vorübergehend einige Daten in Ihrem eigenen Browser.',
      card: { pill: 'Kurz gesagt', title: 'Was Ihr Browser speichert', rows: [['Tracking-Cookies', 'Keine'], ['Werbung', 'Keine'], ['Sitzungsspeicher', 'Test und Anmeldung'], ['Lokaler Speicher', 'Öffentliche IRCC-Daten']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway verwendet keine eigenen Cookies für Tracking, Werbung oder Profilbildung. Derzeit ist auf der Website kein Tool zur Reichweitenmessung aktiv.', '<p class="pg-note"><strong>Sollte eines Tages eine Reichweitenmessung aktiviert werden,</strong> wird diese Seite vorher aktualisiert: mit dem Namen des Dienstes, dem, was er misst, und wie Sie widersprechen können.</p>']],
        ['sesion', 'Sitzungsspeicher', ['Während Sie surfen, speichern einige Seiten Daten im Sitzungsspeicher Ihres Browsers. Sie werden beim Schließen des Tabs gelöscht und nicht von selbst an Pathway gesendet.', '<ul><li><strong>Einstufungstest:</strong> das geschätzte Ergebnis, zur Vorbereitung der Anmeldung.</li><li><strong>Anmeldung:</strong> das Tempo, die Zahlungsart und die Präferenzen, die Sie wählen.</li><li><strong>CRS-Rechner:</strong> Ihre Formularantworten und die vorbereitete WhatsApp-Nachricht.</li></ul>']],
        ['local', 'Lokaler Speicher', ['Der Rechner und die IRCC-Runden speichern in Ihrem Browser eine Kopie der neuesten öffentlichen IRCC-Daten (Einladungsrunden und CRS-Regeln), damit sie weiter funktionieren, wenn canada.ca nicht antwortet. Sie enthalten keine personenbezogenen Daten.']],
        ['terceros', 'Externe Dienste', ['Einige Seiten laden Schriften von Google Fonts oder öffentliche Daten von canada.ca. Wenn Sie uns per WhatsApp oder E-Mail schreiben, gelten die Richtlinien dieser Dienste.']],
        ['control', 'So löschen Sie diese Daten', ['Den Sitzungsspeicher löschen Sie, indem Sie den Tab schließen, den lokalen Speicher in den Datenschutzeinstellungen Ihres Browsers. Die Website funktioniert auch ohne diese Daten. Bei Fragen lesen Sie unsere <a href="{privacy}">Datenschutzerklärung</a>.']]
      ]
    },
    legal: {
      title: 'Rechtliche Hinweise', description: 'Rechtliche Hinweise von Pathway Language Solutions: Tätigkeit, Kontakt, geistiges Eigentum und Grenzen der veröffentlichten Informationen.',
      eyebrow: 'Rechtliches', h1: ['Rechtliche Hinweise'],
      lead: 'Pathway Language Solutions ist ein Sprachinstitut, das privaten Französischunterricht online und Vorbereitung auf die Prüfungen TEF Canada und TCF Canada anbietet.',
      card: { pill: 'Kontakt', title: 'Pathway Language Solutions', rows: contactRows('Website') },
      sections: [
        ['actividad', 'Tätigkeit', ['Pathway Language Solutions bietet live Einzelunterricht in Französisch, eigenes Lehrmaterial und Vorbereitung auf die von IRCC anerkannten Französischprüfungen.', '<p class="pg-note"><strong>Pathway bietet keine Einwanderungsberatung</strong> und vertritt keine Bewerberinnen und Bewerber gegenüber IRCC. Für eine Einwanderungsentscheidung nutzen Sie die offiziellen Quellen oder eine zugelassene Fachperson.</p>']],
        ['contenido', 'Veröffentlichte Informationen', ['Die IRCC-Daten (Einladungsrunden, CRS-Regeln) stammen aus den offiziellen Quellen von canada.ca und dienen nur der Information. Sie können sich jederzeit ändern; keine Angabe auf der Website ist eine Prognose oder eine Garantie für eine Einladung.', 'Die Schätzungen des Einstufungstests und des CRS-Rechners sind Richtwerte und werden mit einer Lehrkraft oder mit den offiziellen Werkzeugen bestätigt.']],
        ['propiedad', 'Geistiges Eigentum', ['Die Lehrbücher, ihr didaktischer Aufbau, die Texte, die Bilder und das Design der Website gehören Pathway Language Solutions. Die veröffentlichten Auszüge dienen der persönlichen Ansicht; jede Vervielfältigung oder Verbreitung bedarf einer vorherigen schriftlichen Genehmigung.']],
        ['enlaces', 'Externe Links', ['Die Website verlinkt auf Dienste Dritter (canada.ca, WhatsApp, Prüfungsanbieter). Pathway hat keinen Einfluss auf deren Inhalte oder Richtlinien.']],
        ['condiciones', 'Bedingungen und Daten', ['Die Bedingungen der NCLC-7-Zusage stehen in den <a href="{conditions}">allgemeinen Bedingungen</a>, die Verwendung Ihrer Daten in der <a href="{privacy}">Datenschutzerklärung</a> und der <a href="{cookies}">Cookie-Richtlinie</a>.']]
      ]
    }
  }
};
