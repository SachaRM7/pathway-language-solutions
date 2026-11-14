// Cookie policy and legal notice in French, English and German, translated by
// hand from the Spanish pages in v4-pages-content.mjs (NEW_LEGAL). Same facts,
// same sections, same anchors.

const contactRows = site => [['Email', '<a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>'], ['WhatsApp', '<a href="https://wa.me/51989887516" target="_blank" rel="noopener">+51 989 887 516</a>'], [site, 'pathway-languages.com']];

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
      lead: 'Le site de Pathway n’installe aucun cookie publicitaire ni de suivi. Pour que le test, le calculateur et l’inscription fonctionnent, il garde quelques données dans votre propre navigateur.',
      card: { pill: 'En bref', title: 'Ce que garde votre navigateur', rows: [['Cookies de suivi', 'Aucun'], ['Publicité', 'Aucune'], ['Stockage de session', 'Test et inscription'], ['Stockage local', 'Données d’IRCC, préférences']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway n’utilise aucun cookie propre de suivi, de publicité ni de profilage. Aucun outil de mesure d’audience n’est activé sur le site aujourd’hui.', '<p class="pg-note"><strong>Si une mesure d’audience est activée un jour,</strong> cette page sera mise à jour avant, avec le nom du service, ce qu’il mesure et la façon de vous y opposer.</p>']],
        ['sesion', 'Stockage de session', ['Pendant votre navigation, certaines pages enregistrent des données dans le stockage de session de votre navigateur. Elles sont effacées à la fermeture de l’onglet.', '<ul><li><strong>Test de positionnement :</strong> votre résultat (<code>pathwayPlacementResult</code>) et votre adresse e-mail (<code>pathwayPlacementEmail</code>), pour préparer l’inscription. Quand vous voyez votre résultat, ils sont aussi envoyés à la base de données de Pathway, comme l’explique la <a href="{privacy}">politique de confidentialité</a>.</li><li><strong>Page d’accueil :</strong> la formule et la modalité que vous choisissez (<code>pathwayV4Selection</code>), pour les reprendre dans l’inscription.</li><li><strong>Inscription :</strong> le résumé de votre demande (<code>pathwayEnrollmentRequest</code>), pour l’afficher sur la page de confirmation. La demande est aussi envoyée à Pathway.</li></ul>']],
        ['local', 'Stockage local', ['Le calculateur et les rondes d’IRCC gardent dans votre navigateur une copie des dernières données publiques d’IRCC (rondes d’invitations et règles du CRS), pour continuer à fonctionner si canada.ca ne répond pas. Elles ne contiennent aucune donnée personnelle.', 'Certaines pages retiennent aussi vos préférences d’affichage, comme le thème clair ou sombre (<code>pathway-theme</code>), et l’origine de votre première visite (<code>pathwayFirstTouch</code> : campagne ou site d’où vous venez), effacée au bout de 30 jours.']],
        ['terceros', 'Services externes', ['Le test et l’inscription envoient des données à la base de données de Pathway (Supabase), comme l’explique la <a href="{privacy}">politique de confidentialité</a>. Les rondes d’IRCC sont consultées sur canada.ca. Certaines pages peuvent charger des polices de Google Fonts. Si vous choisissez de nous écrire sur WhatsApp ou par e-mail, les politiques de ces services s’appliquent.']],
        ['control', 'Comment effacer ces données', ['Vous pouvez effacer le stockage de session en fermant l’onglet, et le stockage local depuis les réglages de confidentialité de votre navigateur. Le site continue de fonctionner sans ces données. Pour nous demander d’effacer ce qui a été envoyé à Pathway, écrivez à <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']]
      ]
    },
    legal: {
      title: 'Mentions légales', description: 'Mentions légales de Pathway Language Solutions : activité, contact, propriété intellectuelle et limites des informations publiées.',
      eyebrow: 'Informations légales', h1: ['Mentions légales'],
      lead: 'Pathway Language Solutions est un institut de langues qui propose des cours particuliers de français en ligne et une préparation aux examens TEF Canada et TCF Canada.',
      card: { pill: 'Contact', title: 'Pathway Language Solutions', rows: contactRows('Site') },
      sections: [
        ['actividad', 'Activité', ['Pathway Language Solutions propose des cours particuliers de français en direct sur Zoom (un élève, un professeur), un matériel pédagogique propre et une préparation aux examens de français reconnus par IRCC.', '<p class="pg-note"><strong>Pathway ne fait pas de conseil en immigration</strong> et ne représente pas de candidats auprès d’IRCC. Pour une décision d’immigration, consultez les sources officielles ou un professionnel réglementé.</p>']],
        ['informacion', 'Informations publiées', ['Les données d’IRCC (rondes d’invitations, règles du CRS) proviennent des sources officielles de canada.ca et sont affichées à titre informatif. Elles peuvent changer à tout moment ; aucune donnée du site ne constitue une prévision ni une garantie d’invitation.', 'Les estimations du test de positionnement et du calculateur CRS sont indicatives et se confirment avec un professeur ou avec les outils officiels.']],
        ['propiedad', 'Propriété intellectuelle', ['Les manuels, leur structure pédagogique, les textes, les images et le design du site appartiennent à Pathway Language Solutions. Les extraits publiés sont proposés pour une consultation personnelle ; toute reproduction ou diffusion nécessite une autorisation écrite préalable.']],
        ['enlaces', 'Liens externes', ['Le site renvoie vers des services tiers (canada.ca, WhatsApp, organismes d’examen). Pathway ne contrôle ni leur contenu ni leurs politiques.']],
        ['condiciones', 'Conditions et données', ['Les formules, les prix, les règles d’assiduité et l’engagement NCLC 7 sont détaillés dans les <a href="{conditions}">conditions générales</a>, et l’utilisation de vos données dans la <a href="{privacy}">politique de confidentialité</a> et la <a href="{cookies}">politique de cookies</a>.']]
      ]
    }
  },
  en: {
    cookies: {
      title: 'Cookie policy', description: 'What the Pathway website stores in your browser: no tracking cookies, session storage for the test and enrolment.',
      eyebrow: 'Transparency', h1: ['Cookie policy', 'and storage.'],
      lead: 'The Pathway website sets no advertising or tracking cookies. So that the test, the calculator and enrolment work, it keeps a little data in your own browser.',
      card: { pill: 'In short', title: 'What your browser keeps', rows: [['Tracking cookies', 'None'], ['Advertising', 'None'], ['Session storage', 'Test and enrolment'], ['Local storage', 'IRCC data, preferences']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway uses no first-party tracking, advertising or profiling cookies. No audience measurement tool is active on the site today.', '<p class="pg-note"><strong>If audience measurement is ever switched on,</strong> this page will be updated first, with the name of the service, what it measures and how to opt out.</p>']],
        ['sesion', 'Session storage', ['While you browse, some pages save data in your browser’s session storage. It is deleted when you close the tab.', '<ul><li><strong>Placement test:</strong> your result (<code>pathwayPlacementResult</code>) and your email address (<code>pathwayPlacementEmail</code>), to prepare your enrolment. When you see your result, they are also sent to Pathway’s database, as explained in the <a href="{privacy}">privacy policy</a>.</li><li><strong>Home page:</strong> the plan and payment option you choose (<code>pathwayV4Selection</code>), to carry them over to enrolment.</li><li><strong>Enrolment:</strong> the summary of your request (<code>pathwayEnrollmentRequest</code>), to show it on the confirmation page. The request is also sent to Pathway.</li></ul>']],
        ['local', 'Local storage', ['The calculator and the IRCC rounds keep a copy of the latest public IRCC data (rounds of invitations and CRS rules) in your browser, so they keep working if canada.ca doesn’t respond. It contains no personal data.', 'Some pages also remember your display preferences, such as the light or dark theme (<code>pathway-theme</code>), and where your first visit came from (<code>pathwayFirstTouch</code>: the campaign or website that sent you), deleted after 30 days.']],
        ['terceros', 'External services', ['The test and enrolment send data to Pathway’s database (Supabase), as explained in the <a href="{privacy}">privacy policy</a>. IRCC rounds are read from canada.ca. Some pages may load fonts from Google Fonts. If you choose to write to us on WhatsApp or by email, those services’ policies apply.']],
        ['control', 'How to delete this data', ['You can clear session storage by closing the tab, and local storage from your browser’s privacy settings. The site keeps working without this data. To ask us to delete what was sent to Pathway, write to <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']]
      ]
    },
    legal: {
      title: 'Legal notice', description: 'Legal notice of Pathway Language Solutions: activity, contact, intellectual property and the limits of the information published.',
      eyebrow: 'Legal information', h1: ['Legal notice'],
      lead: 'Pathway Language Solutions is a language institute offering one-to-one online French classes and preparation for the TEF Canada and TCF Canada exams.',
      card: { pill: 'Contact', title: 'Pathway Language Solutions', rows: contactRows('Website') },
      sections: [
        ['actividad', 'Activity', ['Pathway Language Solutions offers live one-to-one French classes on Zoom (one student, one teacher), its own teaching materials and preparation for the French exams recognized by IRCC.', '<p class="pg-note"><strong>Pathway does not provide immigration advice</strong> and does not represent applicants before IRCC. For an immigration decision, check the official sources or consult a regulated professional.</p>']],
        ['informacion', 'Published information', ['IRCC data (rounds of invitations, CRS rules) comes from the official canada.ca sources and is shown for information only. It may change at any time; nothing on the site is a forecast or a guarantee of an invitation.', 'Estimates from the placement test and the CRS calculator are indicative and are confirmed with a teacher or with the official tools.']],
        ['propiedad', 'Intellectual property', ['The workbooks, their teaching structure, the texts, the images and the site design belong to Pathway Language Solutions. The published excerpts are offered for personal reference; any reproduction or distribution requires prior written permission.']],
        ['enlaces', 'External links', ['The site links to third-party services (canada.ca, WhatsApp, exam providers). Pathway does not control their content or their policies.']],
        ['condiciones', 'Conditions and data', ['Plans, prices, attendance rules and the NCLC 7 commitment are set out in the <a href="{conditions}">terms and conditions</a>, and the use of your data in the <a href="{privacy}">privacy policy</a> and the <a href="{cookies}">cookie policy</a>.']]
      ]
    }
  },
  de: {
    cookies: {
      title: 'Cookie-Richtlinie', description: 'Was die Website von Pathway in Ihrem Browser speichert: keine Tracking-Cookies, Sitzungsspeicher für Test und Anmeldung.',
      eyebrow: 'Transparenz', h1: ['Cookie-Richtlinie', 'und Speicherung.'],
      lead: 'Die Website von Pathway setzt keine Werbe- oder Tracking-Cookies. Damit Test, Rechner und Anmeldung funktionieren, speichert sie einige Daten in Ihrem eigenen Browser.',
      card: { pill: 'Kurz gesagt', title: 'Was Ihr Browser speichert', rows: [['Tracking-Cookies', 'Keine'], ['Werbung', 'Keine'], ['Sitzungsspeicher', 'Test und Anmeldung'], ['Lokaler Speicher', 'IRCC-Daten, Einstellungen']] },
      sections: [
        ['cookies', 'Cookies', ['Pathway verwendet keine eigenen Cookies für Tracking, Werbung oder Profilbildung. Derzeit ist auf der Website kein Tool zur Reichweitenmessung aktiv.', '<p class="pg-note"><strong>Sollte eines Tages eine Reichweitenmessung aktiviert werden,</strong> wird diese Seite vorher aktualisiert: mit dem Namen des Dienstes, dem, was er misst, und wie Sie widersprechen können.</p>']],
        ['sesion', 'Sitzungsspeicher', ['Während Sie surfen, speichern einige Seiten Daten im Sitzungsspeicher Ihres Browsers. Sie werden beim Schließen des Tabs gelöscht.', '<ul><li><strong>Einstufungstest:</strong> Ihr Ergebnis (<code>pathwayPlacementResult</code>) und Ihre E-Mail-Adresse (<code>pathwayPlacementEmail</code>), zur Vorbereitung der Anmeldung. Wenn Sie Ihr Ergebnis sehen, werden beide auch an die Datenbank von Pathway gesendet, wie in der <a href="{privacy}">Datenschutzerklärung</a> beschrieben.</li><li><strong>Startseite:</strong> das Paket und die Zahlungsart, die Sie wählen (<code>pathwayV4Selection</code>), um sie in die Anmeldung zu übernehmen.</li><li><strong>Anmeldung:</strong> die Zusammenfassung Ihrer Anfrage (<code>pathwayEnrollmentRequest</code>), um sie auf der Bestätigungsseite anzuzeigen. Die Anfrage wird auch an Pathway gesendet.</li></ul>']],
        ['local', 'Lokaler Speicher', ['Der Rechner und die IRCC-Runden speichern in Ihrem Browser eine Kopie der neuesten öffentlichen IRCC-Daten (Einladungsrunden und CRS-Regeln), damit sie weiter funktionieren, wenn canada.ca nicht antwortet. Sie enthalten keine personenbezogenen Daten.', 'Einige Seiten merken sich außerdem Ihre Anzeigeeinstellungen, etwa das helle oder dunkle Design (<code>pathway-theme</code>), und die Herkunft Ihres ersten Besuchs (<code>pathwayFirstTouch</code>: Kampagne oder Website, von der Sie kommen), die nach 30 Tagen gelöscht wird.']],
        ['terceros', 'Externe Dienste', ['Test und Anmeldung senden Daten an die Datenbank von Pathway (Supabase), wie in der <a href="{privacy}">Datenschutzerklärung</a> beschrieben. Die IRCC-Runden werden von canada.ca abgerufen. Einige Seiten können Schriften von Google Fonts laden. Wenn Sie uns per WhatsApp oder E-Mail schreiben, gelten die Richtlinien dieser Dienste.']],
        ['control', 'So löschen Sie diese Daten', ['Den Sitzungsspeicher löschen Sie, indem Sie den Tab schließen, den lokalen Speicher in den Datenschutzeinstellungen Ihres Browsers. Die Website funktioniert auch ohne diese Daten. Um die Löschung der an Pathway gesendeten Daten zu verlangen, schreiben Sie an <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']]
      ]
    },
    legal: {
      title: 'Rechtliche Hinweise', description: 'Rechtliche Hinweise von Pathway Language Solutions: Tätigkeit, Kontakt, geistiges Eigentum und Grenzen der veröffentlichten Informationen.',
      eyebrow: 'Rechtliches', h1: ['Rechtliche Hinweise'],
      lead: 'Pathway Language Solutions ist ein Sprachinstitut, das Online-Einzelunterricht in Französisch und Vorbereitung auf die Prüfungen TEF Canada und TCF Canada anbietet.',
      card: { pill: 'Kontakt', title: 'Pathway Language Solutions', rows: contactRows('Website') },
      sections: [
        ['actividad', 'Tätigkeit', ['Pathway Language Solutions bietet Live-Einzelunterricht in Französisch über Zoom (eine lernende Person, eine Lehrkraft), eigenes Lehrmaterial und Vorbereitung auf die von IRCC anerkannten Französischprüfungen.', '<p class="pg-note"><strong>Pathway bietet keine Einwanderungsberatung</strong> und vertritt keine Bewerberinnen und Bewerber gegenüber IRCC. Für eine Einwanderungsentscheidung nutzen Sie die offiziellen Quellen oder eine zugelassene Fachperson.</p>']],
        ['informacion', 'Veröffentlichte Informationen', ['Die IRCC-Daten (Einladungsrunden, CRS-Regeln) stammen aus den offiziellen Quellen von canada.ca und dienen nur der Information. Sie können sich jederzeit ändern; keine Angabe auf der Website ist eine Prognose oder eine Garantie für eine Einladung.', 'Die Schätzungen des Einstufungstests und des CRS-Rechners sind Richtwerte und werden mit einer Lehrkraft oder mit den offiziellen Werkzeugen bestätigt.']],
        ['propiedad', 'Geistiges Eigentum', ['Die Lehrbücher, ihr didaktischer Aufbau, die Texte, die Bilder und das Design der Website gehören Pathway Language Solutions. Die veröffentlichten Auszüge dienen der persönlichen Ansicht; jede Vervielfältigung oder Verbreitung bedarf einer vorherigen schriftlichen Genehmigung.']],
        ['enlaces', 'Externe Links', ['Die Website verlinkt auf Dienste Dritter (canada.ca, WhatsApp, Prüfungsanbieter). Pathway hat keinen Einfluss auf deren Inhalte oder Richtlinien.']],
        ['condiciones', 'Bedingungen und Daten', ['Pakete, Preise, Anwesenheitsregeln und die NCLC-7-Zusage stehen in den <a href="{conditions}">allgemeinen Bedingungen</a>, die Verwendung Ihrer Daten in der <a href="{privacy}">Datenschutzerklärung</a> und der <a href="{cookies}">Cookie-Richtlinie</a>.']]
      ]
    }
  }
};

// Conditions of enrolment (with the NCLC 7 commitment) and privacy policy in
// French, English and German. The Spanish source is /condiciones.html and
// /privacidad.html (read at build time by build-v4-pages.mjs). Same sections,
// same ids (other pages link to #asistencia and #compromiso-nclc7), same facts.
// French typography (narrow no-break spaces) is applied when the page is built.

const priceTable = (head, rows) => `<table><thead><tr>${head.map(cell => `<th scope="col">${cell}</th>`).join('')}</tr></thead><tbody>${rows.map(([name, month, cycle]) => `<tr><th scope="row">${name}</th><td>${month}</td><td>${cycle}</td></tr>`).join('')}</tbody></table>`;

export const CONDITIONS_I18N = {
  fr: {
    eyebrow: 'Conditions générales', h1: 'Conditions d’inscription et engagement NCLC 7',
    lead: 'Formules, prix, paiement, assiduité et engagement NCLC 7 : tout ce que vous acceptez en vous inscrivant aux cours de français de Pathway.',
    sections: [
      ['formulas', 'Formules et prix', [
        'Tous les cours sont particuliers : un élève et un professeur, en direct sur Zoom. Vous choisissez combien d’heures par semaine vous voulez étudier ; le prix dépend seulement de ces heures, jamais de votre niveau.',
        priceTable(['Formule', 'Au mois', 'Cycle complet (−15 %)'], [
          ['Essentiel · 2&nbsp;h/semaine', '185&nbsp;CAD/mois', '6&nbsp;mois · 943,50&nbsp;CAD'],
          ['Accéléré · 3&nbsp;h/semaine', '277,50&nbsp;CAD/mois', '5&nbsp;mois · 1&#8239;179,50&nbsp;CAD'],
          ['Accéléré · 4&nbsp;h/semaine', '370&nbsp;CAD/mois', '5&nbsp;mois · 1&#8239;572,50&nbsp;CAD'],
          ['Intensif · 5&nbsp;h/semaine', '462,50&nbsp;CAD/mois', '4&nbsp;mois · 1&#8239;572,50&nbsp;CAD'],
          ['Intensif · 6&nbsp;h/semaine', '555&nbsp;CAD/mois', '4&nbsp;mois · 1&#8239;887&nbsp;CAD']
        ]),
        'Un mois d’inscription correspond à 4 semaines de cours. Les prix sont en dollars canadiens (CAD).',
        '<p class="pg-note">Le rythme exact se confirme après l’évaluation initiale, selon votre niveau, vos disponibilités et votre date cible.</p>'
      ]],
      ['ciclo', 'Au mois ou cycle complet', [
        '<ul><li><strong>Inscription mensuelle :</strong> vous payez chaque période de 4 semaines, sans engagement minimum. Vous pouvez arrêter à la fin de n’importe quelle période.</li><li><strong>Cycle complet :</strong> un cycle correspond au travail prévu pour maîtriser un niveau du CECR (A1, A2, B1 ou B2). Sa durée de référence dépend de la formule : 6 mois en Essentiel, 5 mois en Accéléré et 4 mois en Intensif.</li><li><strong>Prix du cycle :</strong> la mensualité multipliée par les mois du cycle, avec 15 % de réduction. Si vous commencez par un mois puis continuez avec un cycle complet, la réduction du cycle est de 10 %.</li></ul>',
        'Aller de l’A1 au B2 représente quatre cycles : environ 24 mois en Essentiel, environ 20 mois en Accéléré et environ 16 mois en Intensif.'
      ]],
      ['pago', 'Paiement et remboursements', [
        '<ul><li><strong>Aucun paiement avant la confirmation de votre horaire.</strong> Vous passez d’abord le test de positionnement et envoyez votre demande ; nous convenons avec vous d’un horaire, et seulement ensuite nous vous demandons le paiement.</li><li><strong>Frais d’inscription :</strong> 15&nbsp;CAD, une seule fois, avec le premier paiement.</li><li><strong>Inscription mensuelle :</strong> chaque période de 4 semaines se paie avant de commencer.</li><li><strong>Cycle complet :</strong> il se paie avant de commencer et n’est pas remboursable.</li></ul>',
        'Les moyens de paiement vous sont indiqués à la confirmation de l’horaire. Toute exception doit être convenue par écrit.'
      ]],
      ['asistencia', 'Assiduité et cours manqués', [
        '<ul><li><strong>Si vous prévenez au moins 48&nbsp;h à l’avance,</strong> ou justifiez votre absence dans les 72&nbsp;h qui suivent, nous rattrapons le cours.</li><li><strong>Sans préavis ni justification valable,</strong> l’heure est perdue et n’est pas rattrapée.</li><li><strong>Inscription mensuelle (4 semaines) :</strong> 3 absences non justifiées dans les mêmes 4 semaines invalident le mois : le passage au niveau suivant n’est pas validé et, pour continuer, le mois doit être payé de nouveau.</li><li><strong>Cycle complet :</strong> pas de cette sanction, mais les heures perdues ne sont ni rattrapées ni remboursées.</li></ul>'
      ]],
      ['compromiso-nclc7', 'Engagement NCLC 7 : à qui il s’applique', [
        'L’engagement NCLC 7 s’applique aux inscriptions en <strong>cycle complet</strong>, dans l’une des trois formules (Essentiel, Accéléré ou Intensif), lorsque le plan d’études convenu va jusqu’au B2 avec l’objectif NCLC 7. L’inscription mensuelle n’inclut pas cet engagement.',
        'Les sections suivantes décrivent ses étapes et les conditions qui le déclenchent.'
      ]],
      ['objetivo', 'Ce que couvre l’engagement', [
        'L’objectif est d’atteindre au moins le NCLC 7 en compréhension orale, compréhension écrite, expression orale et expression écrite, avec un examen accepté par IRCC (TEF Canada ou TCF Canada). La poursuite sans nouvelles mensualités concerne exclusivement la préparation linguistique de Pathway, après le parcours convenu.'
      ]],
      ['nivel-inicial', 'Niveau de départ, cycles et durée', [
        'Le niveau de départ est indiqué par le test de positionnement de Pathway et confirmé lors d’une évaluation initiale en direct. Il sert à définir par écrit le parcours nécessaire avant l’inscription.',
        '<ul><li><strong>Un cycle</strong> correspond au travail prévu pour maîtriser un niveau du CECR (par exemple A1, A2, B1 ou B2), pas à un simple nombre de cours.</li><li>Selon le niveau de départ et l’objectif, l’élève s’engage à suivre <strong>le nombre de cycles défini dans le plan d’études convenu avant l’inscription</strong>.</li><li>Chaque cycle dure <strong>6, 5 ou 4 mois</strong> selon la formule choisie (Essentiel, Accéléré ou Intensif).</li><li>Le nombre de cycles, la formule, le volume hebdomadaire et la date d’examen recommandée sont consignés dans l’accord d’inscription.</li></ul>',
        '<p class="pg-note">La poursuite au titre de l’engagement ne peut être évaluée qu’après tous les cycles prévus depuis le niveau de départ confirmé.</p>'
      ]],
      ['proyeccion-b1', 'Étape 1 : projection au B1', [
        'Lorsque vous atteignez le B1, Pathway fait une première projection vers l’objectif NCLC 7. Nous mesurons l’écart entre votre niveau et l’objectif dans chaque compétence et identifions ce qu’il faudra renforcer pendant le B2.',
        'Ce bilan permet d’anticiper les difficultés et d’orienter la préparation avant la fin du parcours.'
      ]],
      ['evaluacion-b2', 'Étape 2 : évaluation à la fin du B2', [
        'À la fin du B2, nous évaluons les quatre compétences et analysons les résultats de vos activités et de vos examens blancs TEF Canada ou TCF Canada. Ce bilan définit les ajustements nécessaires pour l’étape suivante.',
        '<p class="pg-note"><strong>La fin du B2 n’active pas immédiatement les cours sans coût supplémentaire.</strong> Elle est suivie d’un cycle de vérification et de consolidation.</p>'
      ]],
      ['consolidacion', 'Étape 3 : consolidation de 4 mois', [
        'Ce cycle de vérification et de consolidation dure <strong>4 mois</strong>, est facturé normalement selon le rythme prévu dans votre plan et précède toute éventuelle poursuite sans nouvelles mensualités.',
        'Pendant cette étape, le professeur stabilise vos acquis, les transpose au format et aux durées de votre examen (TEF Canada ou TCF Canada), vérifie la régularité de vos résultats et distingue les difficultés linguistiques de celles propres à l’examen.',
        '<p class="pg-note">C’est une étape pédagogique prévue dès le départ, avec une durée et un objectif vérifiables. Elle n’active pas encore la poursuite sans coût supplémentaire.</p>'
      ]],
      ['requisitos', 'Conditions à remplir par l’élève', [
        '<ul><li>Atteindre au moins 90 % d’assiduité dans chaque cycle.</li><li>Rendre au moins 85 % des devoirs et corrections demandés.</li><li>Faire les contrôles de progression et les deux examens blancs prévus.</li><li>Respecter le rythme et la durée convenus pour chaque cycle.</li><li>Passer l’examen officiel dans la période recommandée par Pathway.</li><li>Transmettre le résultat officiel complet pour identifier les compétences à renforcer.</li></ul>',
        '<p class="pg-note"><strong>Comment l’assiduité est comptée :</strong> un cours annoncé au moins 48&nbsp;h à l’avance, ou justifié dans les 72&nbsp;h, puis rattrapé, n’est pas décompté de l’assiduité.</p>',
        'Une interruption prolongée, un changement unilatéral d’intensité ou le non-respect de ces conditions peut modifier le calendrier et suspendre l’application de l’engagement. Toute exception doit être convenue par écrit.'
      ]],
      ['continuidad', 'Comment fonctionne la poursuite', [
        'Une fois le cycle de consolidation de 4 mois terminé, si vous n’atteignez pas encore le NCLC 7 dans les quatre compétences et que les conditions ci-dessus sont remplies, Pathway fait le point sur les compétences à renforcer et établit un plan de poursuite. Les cours de français prévus par ce plan ne donnent lieu à aucune nouvelle mensualité.',
        'La fréquence, le format et la prochaine date d’examen sont confirmés par écrit. En cas de différence entre cette page et l’accord individuel signé avant l’inscription, l’accord individuel prévaut.'
      ]],
      ['exclusiones', 'Ce que l’engagement ne garantit pas', [
        'Pathway ne garantit ni un score CRS précis, ni un seuil de sélection futur, ni une invitation d’IRCC, ni une décision d’immigration, ni la résidence permanente. Le service n’est pas du conseil en immigration.',
        'L’engagement ne couvre pas les frais de tiers (inscription ou reprise d’un examen, déplacements, matériel externe ou démarches administratives), sauf mention expresse dans l’accord d’inscription.',
        '<p class="pg-note">Les règles d’IRCC, les équivalences NCLC et les formats d’examen peuvent changer. La préparation s’adapte aux règles officielles en vigueur.</p>'
      ]]
    ]
  },
  en: {
    eyebrow: 'Terms and conditions', h1: 'Enrolment terms and the NCLC 7 commitment',
    lead: 'Plans, prices, payment, attendance and the NCLC 7 commitment: everything you agree to when you enrol in Pathway’s French classes.',
    sections: [
      ['formulas', 'Plans and prices', [
        'All classes are one-to-one: one student and one teacher, live on Zoom. You choose how many hours a week you want to study; the price depends only on those hours, never on your level.',
        priceTable(['Plan', 'Month to month', 'Full cycle (−15%)'], [
          ['Essential · 2&nbsp;h/week', '185&nbsp;CAD/month', '6&nbsp;months · 943.50&nbsp;CAD'],
          ['Accelerated · 3&nbsp;h/week', '277.50&nbsp;CAD/month', '5&nbsp;months · 1,179.50&nbsp;CAD'],
          ['Accelerated · 4&nbsp;h/week', '370&nbsp;CAD/month', '5&nbsp;months · 1,572.50&nbsp;CAD'],
          ['Intensive · 5&nbsp;h/week', '462.50&nbsp;CAD/month', '4&nbsp;months · 1,572.50&nbsp;CAD'],
          ['Intensive · 6&nbsp;h/week', '555&nbsp;CAD/month', '4&nbsp;months · 1,887&nbsp;CAD']
        ]),
        'One month of enrolment means 4 weeks of classes. Prices are in Canadian dollars (CAD).',
        '<p class="pg-note">The exact pace is confirmed after the initial assessment, based on your level, your availability and your target date.</p>'
      ]],
      ['ciclo', 'Month to month or full cycle', [
        '<ul><li><strong>Monthly enrolment:</strong> you pay for each 4-week period, with no minimum commitment. You can stop at the end of any period.</li><li><strong>Full cycle:</strong> one cycle is the planned work to master one CEFR level (A1, A2, B1 or B2). Its reference length depends on the plan: 6 months on Essential, 5 months on Accelerated and 4 months on Intensive.</li><li><strong>Cycle price:</strong> the monthly fee multiplied by the months of the cycle, with a 15% discount. If you start with one month and then continue with a full cycle, the cycle discount is 10%.</li></ul>',
        'Going from A1 to B2 takes four cycles: about 24 months on Essential, about 20 months on Accelerated and about 16 months on Intensive.'
      ]],
      ['pago', 'Payment and refunds', [
        '<ul><li><strong>No payment before your schedule is confirmed.</strong> You first take the placement test and send your request; we agree on a schedule with you, and only then do we ask for payment.</li><li><strong>Registration fee:</strong> 15&nbsp;CAD, once, with your first payment.</li><li><strong>Monthly enrolment:</strong> each 4-week period is paid before it starts.</li><li><strong>Full cycle:</strong> paid before it starts and non-refundable.</li></ul>',
        'Payment methods are given when your schedule is confirmed. Any exception must be agreed in writing.'
      ]],
      ['asistencia', 'Attendance and missed classes', [
        '<ul><li><strong>If you let us know at least 48&nbsp;hours in advance,</strong> or justify your absence within the following 72&nbsp;hours, we make up the class.</li><li><strong>Without notice or a valid reason,</strong> the hour is lost and is not made up.</li><li><strong>Monthly enrolment (4 weeks):</strong> 3 unjustified absences within the same 4 weeks invalidate the month: moving up to the next level is not validated and, to continue, the month must be paid again.</li><li><strong>Full cycle:</strong> no such penalty, but lost hours are neither made up nor refunded.</li></ul>'
      ]],
      ['compromiso-nclc7', 'NCLC 7 commitment: who it applies to', [
        'The NCLC 7 commitment applies to <strong>full-cycle</strong> enrolments, on any of the three plans (Essential, Accelerated or Intensive), when the agreed study plan goes up to B2 with NCLC 7 as the goal. Monthly enrolment does not include this commitment.',
        'The following sections describe its stages and the conditions that trigger it.'
      ]],
      ['objetivo', 'What the commitment covers', [
        'The goal is to reach at least NCLC 7 in listening, reading, speaking and writing, with an exam accepted by IRCC (TEF Canada or TCF Canada). Continuing without new monthly fees refers only to Pathway’s language preparation, after the agreed path has been completed.'
      ]],
      ['nivel-inicial', 'Starting level, cycles and length', [
        'Your starting level is given by the Pathway placement test and confirmed in a live initial assessment. It is used to set out in writing the path you need before you enrol.',
        '<ul><li><strong>One cycle</strong> is the planned work to master one CEFR level (for example A1, A2, B1 or B2), not just a number of classes.</li><li>Depending on the starting level and the goal, the student commits to completing <strong>the number of cycles set in the study plan agreed before enrolment</strong>.</li><li>Each cycle lasts <strong>6, 5 or 4 months</strong> depending on the plan chosen (Essential, Accelerated or Intensive).</li><li>The number of cycles, the plan, the weekly hours and the recommended exam date are recorded in the enrolment agreement.</li></ul>',
        '<p class="pg-note">Continuation under the commitment can only be assessed once every cycle planned from the confirmed starting level has been completed.</p>'
      ]],
      ['proyeccion-b1', 'Stage 1: projection at B1', [
        'When you reach B1, Pathway makes a first projection towards the NCLC 7 goal. We measure the gap between your level and the goal in each skill and identify what you will need to strengthen during B2.',
        'This review helps anticipate difficulties and steer your preparation before the end of the path.'
      ]],
      ['evaluacion-b2', 'Stage 2: assessment at the end of B2', [
        'At the end of B2, we assess all four skills and review the results of your activities and your TEF Canada or TCF Canada mock exams. This review sets the adjustments needed for the next stage.',
        '<p class="pg-note"><strong>The end of B2 does not immediately trigger classes at no extra cost.</strong> A verification and consolidation cycle comes next.</p>'
      ]],
      ['consolidacion', 'Stage 3: 4-month consolidation', [
        'This verification and consolidation cycle lasts <strong>4 months</strong>, is billed normally at the pace set in your plan and comes before any continuation without new monthly fees.',
        'During this stage, the teacher stabilises what you know, transfers it to the format and timing of your exam (TEF Canada or TCF Canada), checks how consistent your results are and separates language difficulties from exam-specific ones.',
        '<p class="pg-note">It is a teaching stage planned from the start, with a length and purpose that can be checked. It does not yet trigger continuation at no extra cost.</p>'
      ]],
      ['requisitos', 'What the student must do', [
        '<ul><li>Reach at least 90% attendance in each cycle.</li><li>Hand in at least 85% of the required homework and corrections.</li><li>Complete the progress checks and the two planned mock exams.</li><li>Keep to the pace and length agreed for each cycle.</li><li>Sit the official exam within the window recommended by Pathway.</li><li>Share the full official result so the skills to strengthen can be identified.</li></ul>',
        '<p class="pg-note"><strong>How attendance is counted:</strong> a class you cancelled at least 48&nbsp;hours ahead, or justified within 72&nbsp;hours, and then made up, does not count against your attendance.</p>',
        'A long interruption, a unilateral change of intensity or not meeting these requirements may change the schedule and suspend the commitment. Any exception must be agreed in writing.'
      ]],
      ['continuidad', 'How continuation works', [
        'Once the 4-month consolidation cycle is over, if you have not yet reached NCLC 7 in all four skills and the conditions above are met, Pathway reviews the skills to strengthen and sets up a continuation plan. The French classes in that plan carry no new monthly fees.',
        'Frequency, format and the next exam date are confirmed in writing. If this page and the individual agreement signed before enrolment differ, the individual agreement prevails.'
      ]],
      ['exclusiones', 'What it does not guarantee', [
        'Pathway does not guarantee a specific CRS score, a future cut-off score, an invitation from IRCC, an immigration decision or permanent residence. The service is not immigration advice.',
        'The commitment does not cover third-party costs (registering for or retaking an exam, travel, external materials or administrative procedures), unless the enrolment agreement expressly says so.',
        '<p class="pg-note">IRCC rules, NCLC equivalences and exam formats can change. The preparation follows the official rules in force.</p>'
      ]]
    ]
  },
  de: {
    eyebrow: 'Allgemeine Bedingungen', h1: 'Anmeldebedingungen und NCLC-7-Zusage',
    lead: 'Pakete, Preise, Zahlung, Anwesenheit und die NCLC-7-Zusage: alles, dem Sie mit der Anmeldung zum Französischunterricht bei Pathway zustimmen.',
    sections: [
      ['formulas', 'Pakete und Preise', [
        'Der gesamte Unterricht ist Einzelunterricht: eine Lernende oder ein Lernender und eine Lehrkraft, live über Zoom. Sie wählen, wie viele Stunden pro Woche Sie lernen möchten; der Preis hängt nur von diesen Stunden ab, nie von Ihrem Niveau.',
        priceTable(['Paket', 'Monatlich', 'Ganzer Zyklus (−15 %)'], [
          ['Basis · 2&nbsp;Std./Woche', '185&nbsp;CAD/Monat', '6&nbsp;Monate · 943,50&nbsp;CAD'],
          ['Beschleunigt · 3&nbsp;Std./Woche', '277,50&nbsp;CAD/Monat', '5&nbsp;Monate · 1.179,50&nbsp;CAD'],
          ['Beschleunigt · 4&nbsp;Std./Woche', '370&nbsp;CAD/Monat', '5&nbsp;Monate · 1.572,50&nbsp;CAD'],
          ['Intensiv · 5&nbsp;Std./Woche', '462,50&nbsp;CAD/Monat', '4&nbsp;Monate · 1.572,50&nbsp;CAD'],
          ['Intensiv · 6&nbsp;Std./Woche', '555&nbsp;CAD/Monat', '4&nbsp;Monate · 1.887&nbsp;CAD']
        ]),
        'Ein Anmeldemonat entspricht 4 Wochen Unterricht. Die Preise sind in kanadischen Dollar (CAD) angegeben.',
        '<p class="pg-note">Das genaue Tempo wird nach der Ersteinstufung bestätigt, je nach Ihrem Niveau, Ihrer Verfügbarkeit und Ihrem Zieldatum.</p>'
      ]],
      ['ciclo', 'Monatlich oder ganzer Zyklus', [
        '<ul><li><strong>Monatliche Anmeldung:</strong> Sie bezahlen jeden 4-Wochen-Zeitraum einzeln, ohne Mindestlaufzeit. Sie können am Ende jedes Zeitraums aufhören.</li><li><strong>Ganzer Zyklus:</strong> Ein Zyklus ist die geplante Arbeit, um ein GER-Niveau (A1, A2, B1 oder B2) zu beherrschen. Seine Richtdauer hängt vom Paket ab: 6 Monate bei Basis, 5 Monate bei Beschleunigt und 4 Monate bei Intensiv.</li><li><strong>Preis des Zyklus:</strong> der Monatspreis mal die Monate des Zyklus, mit 15 % Rabatt. Wenn Sie mit einem Monat beginnen und danach mit einem ganzen Zyklus weitermachen, beträgt der Rabatt auf den Zyklus 10 %.</li></ul>',
        'Von A1 bis B2 sind es vier Zyklen: etwa 24 Monate bei Basis, etwa 20 Monate bei Beschleunigt und etwa 16 Monate bei Intensiv.'
      ]],
      ['pago', 'Zahlung und Erstattung', [
        '<ul><li><strong>Keine Zahlung, bevor Ihr Stundenplan bestätigt ist.</strong> Sie machen zuerst den Einstufungstest und senden Ihre Anfrage; wir vereinbaren mit Ihnen einen Stundenplan, und erst dann bitten wir um die Zahlung.</li><li><strong>Anmeldegebühr:</strong> 15&nbsp;CAD, einmalig, mit der ersten Zahlung.</li><li><strong>Monatliche Anmeldung:</strong> Jeder 4-Wochen-Zeitraum wird vor Beginn bezahlt.</li><li><strong>Ganzer Zyklus:</strong> wird vor Beginn bezahlt und nicht erstattet.</li></ul>',
        'Die Zahlungsmöglichkeiten nennen wir Ihnen, wenn der Stundenplan bestätigt ist. Jede Ausnahme muss schriftlich vereinbart werden.'
      ]],
      ['asistencia', 'Anwesenheit und verpasste Stunden', [
        '<ul><li><strong>Wenn Sie mindestens 48&nbsp;Stunden vorher absagen</strong> oder Ihre Abwesenheit innerhalb der folgenden 72&nbsp;Stunden begründen, holen wir die Stunde nach.</li><li><strong>Ohne Absage oder gültige Begründung</strong> verfällt die Stunde und wird nicht nachgeholt.</li><li><strong>Monatliche Anmeldung (4 Wochen):</strong> 3 unentschuldigte Fehlstunden in denselben 4 Wochen machen den Monat ungültig: Der Übergang ins nächste Niveau wird nicht bestätigt, und um weiterzumachen, muss der Monat erneut bezahlt werden.</li><li><strong>Ganzer Zyklus:</strong> keine solche Sanktion, aber verfallene Stunden werden weder nachgeholt noch erstattet.</li></ul>'
      ]],
      ['compromiso-nclc7', 'NCLC-7-Zusage: für wen sie gilt', [
        'Die NCLC-7-Zusage gilt für Anmeldungen mit <strong>ganzem Zyklus</strong>, in jedem der drei Pakete (Basis, Beschleunigt oder Intensiv), wenn der vereinbarte Lernplan bis B2 mit dem Ziel NCLC 7 reicht. Die monatliche Anmeldung enthält diese Zusage nicht.',
        'Die folgenden Abschnitte beschreiben ihre Etappen und die Bedingungen, unter denen sie greift.'
      ]],
      ['objetivo', 'Was die Zusage abdeckt', [
        'Ziel ist mindestens NCLC 7 in Hörverstehen, Leseverstehen, mündlichem und schriftlichem Ausdruck, mit einer von IRCC anerkannten Prüfung (TEF Canada oder TCF Canada). Die Fortsetzung ohne neue Monatsbeiträge betrifft ausschließlich die Sprachvorbereitung von Pathway nach Abschluss des vereinbarten Lernwegs.'
      ]],
      ['nivel-inicial', 'Ausgangsniveau, Zyklen und Dauer', [
        'Das Ausgangsniveau ergibt sich aus dem Einstufungstest von Pathway und wird in einer Live-Ersteinstufung bestätigt. Damit wird vor der Anmeldung der nötige Lernweg schriftlich festgelegt.',
        '<ul><li><strong>Ein Zyklus</strong> ist die geplante Arbeit, um ein GER-Niveau (zum Beispiel A1, A2, B1 oder B2) zu beherrschen, nicht einfach eine Anzahl von Stunden.</li><li>Je nach Ausgangsniveau und Ziel verpflichten sich die Lernenden, <strong>die im vor der Anmeldung vereinbarten Lernplan festgelegte Anzahl von Zyklen</strong> zu absolvieren.</li><li>Jeder Zyklus dauert <strong>6, 5 oder 4 Monate</strong>, je nach gewähltem Paket (Basis, Beschleunigt oder Intensiv).</li><li>Anzahl der Zyklen, Paket, Wochenstunden und empfohlenes Prüfungsdatum werden in der Anmeldevereinbarung festgehalten.</li></ul>',
        '<p class="pg-note">Eine Fortsetzung im Rahmen der Zusage kann erst geprüft werden, wenn alle ab dem bestätigten Ausgangsniveau geplanten Zyklen abgeschlossen sind.</p>'
      ]],
      ['proyeccion-b1', 'Etappe 1: Prognose auf B1-Niveau', [
        'Wenn Sie B1 erreichen, erstellt Pathway eine erste Prognose in Richtung NCLC 7. Wir messen für jede Kompetenz den Abstand zwischen Ihrem Niveau und dem Ziel und legen fest, was Sie während B2 stärken sollten.',
        'So lassen sich Schwierigkeiten früh erkennen und die Vorbereitung vor dem Ende des Lernwegs ausrichten.'
      ]],
      ['evaluacion-b2', 'Etappe 2: Bewertung am Ende von B2', [
        'Am Ende von B2 bewerten wir alle vier Kompetenzen und werten die Ergebnisse Ihrer Aufgaben und Ihrer Probeprüfungen für TEF Canada oder TCF Canada aus. Daraus ergeben sich die Anpassungen für die nächste Etappe.',
        '<p class="pg-note"><strong>Das Ende von B2 aktiviert den Unterricht ohne Zusatzkosten noch nicht.</strong> Danach folgt ein Prüfungs- und Konsolidierungszyklus.</p>'
      ]],
      ['consolidacion', 'Etappe 3: viermonatige Konsolidierung', [
        'Dieser Prüfungs- und Konsolidierungszyklus dauert <strong>4 Monate</strong>, wird regulär nach dem im Lernplan vorgesehenen Tempo berechnet und geht jeder Fortsetzung ohne neue Monatsbeiträge voraus.',
        'In dieser Etappe festigt die Lehrkraft Ihr Wissen, überträgt es auf Format und Zeitvorgaben Ihrer Prüfung (TEF Canada oder TCF Canada), prüft, wie stabil Ihre Ergebnisse sind, und trennt sprachliche Schwierigkeiten von prüfungsbedingten.',
        '<p class="pg-note">Es ist eine von Anfang an geplante Lernetappe mit überprüfbarer Dauer und überprüfbarem Zweck. Sie aktiviert die Fortsetzung ohne Zusatzkosten noch nicht.</p>'
      ]],
      ['requisitos', 'Was die Lernenden erfüllen müssen', [
        '<ul><li>In jedem Zyklus mindestens 90 % Anwesenheit erreichen.</li><li>Mindestens 85 % der verlangten Aufgaben und Korrekturen abgeben.</li><li>Die Fortschrittskontrollen und die zwei vorgesehenen Probeprüfungen absolvieren.</li><li>Das für jeden Zyklus vereinbarte Tempo und die Dauer einhalten.</li><li>Die offizielle Prüfung im von Pathway empfohlenen Zeitraum ablegen.</li><li>Das vollständige offizielle Ergebnis vorlegen, damit die zu stärkenden Kompetenzen erkannt werden.</li></ul>',
        '<p class="pg-note"><strong>So wird die Anwesenheit gezählt:</strong> Eine Stunde, die Sie mindestens 48&nbsp;Stunden vorher abgesagt oder innerhalb von 72&nbsp;Stunden begründet und danach nachgeholt haben, wird nicht von der Anwesenheit abgezogen.</p>',
        'Eine längere Unterbrechung, eine einseitige Änderung der Intensität oder die Nichterfüllung dieser Anforderungen kann den Zeitplan ändern und die Zusage aussetzen. Jede Ausnahme muss schriftlich vereinbart werden.'
      ]],
      ['continuidad', 'Wie die Fortsetzung funktioniert', [
        'Wenn Sie nach dem viermonatigen Konsolidierungszyklus NCLC 7 noch nicht in allen vier Kompetenzen erreicht haben und die oben genannten Bedingungen erfüllt sind, prüft Pathway die zu stärkenden Kompetenzen und erstellt einen Fortsetzungsplan. Für den Französischunterricht in diesem Plan fallen keine neuen Monatsbeiträge an.',
        'Häufigkeit, Format und das nächste Prüfungsdatum werden schriftlich bestätigt. Weichen diese Seite und die vor der Anmeldung unterzeichnete individuelle Vereinbarung voneinander ab, gilt die individuelle Vereinbarung.'
      ]],
      ['exclusiones', 'Was die Zusage nicht garantiert', [
        'Pathway garantiert keinen bestimmten CRS-Wert, keine künftige Mindestpunktzahl, keine Einladung von IRCC, keine Einwanderungsentscheidung und keinen dauerhaften Aufenthalt. Die Leistung ist keine Einwanderungsberatung.',
        'Die Zusage deckt keine Kosten Dritter (Anmeldung zu einer Prüfung oder deren Wiederholung, Reisen, externe Materialien oder Behördengänge), sofern die Anmeldevereinbarung nichts anderes ausdrücklich vorsieht.',
        '<p class="pg-note">Die Regeln von IRCC, die NCLC-Entsprechungen und die Prüfungsformate können sich ändern. Die Vorbereitung richtet sich nach den geltenden offiziellen Regeln.</p>'
      ]]
    ]
  }
};

// Privacy policy: what the site really records (placement test and enrolment
// request in Pathway's Supabase database, WhatsApp opened afterwards), why,
// for how long and how to have it deleted. Nothing about company registration
// is stated: it is not public yet.
const storage = '<code>pathwayPlacementResult</code>, <code>pathwayPlacementEmail</code>, <code>pathwayV4Selection</code>';

export const PRIVACY_I18N = {
  fr: {
    eyebrow: 'Transparence', h1: 'Politique de confidentialité',
    lead: 'Ce que Pathway enregistre quand vous passez le test, vous inscrivez ou nous écrivez : pourquoi, combien de temps et comment le faire supprimer.',
    sections: [
      ['responsable', 'Qui utilise vos données', ['Pathway Language Solutions, institut de cours de français en ligne, utilise vos données uniquement pour vos cours et pour vous répondre. Pour toute question sur vos données, écrivez-nous à <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']],
      ['datos', 'Les données que nous enregistrons', ['<ul><li><strong>Test de positionnement :</strong> lorsque vous voyez votre résultat, nous enregistrons votre adresse e-mail, le niveau estimé, votre score global et vos scores par compétence dans la base de données de Pathway (Supabase). Le test ne vous envoie aucun e-mail.</li><li><strong>Formulaire d’inscription :</strong> votre nom, votre adresse e-mail, votre WhatsApp, la formule choisie, vos disponibilités, votre objectif et vos commentaires. La demande est enregistrée dans la même base de données, puis WhatsApp s’ouvre avec un message préparé, que vous décidez d’envoyer.</li><li><strong>Calculateur CRS :</strong> vos réponses sont calculées dans votre navigateur et ne sont pas envoyées à Pathway. Si vous laissez vos coordonnées pour que nous vous écrivions, nous enregistrons votre nom, votre WhatsApp, votre e-mail et votre score estimé dans la même base de données.</li><li><strong>Origine de votre visite :</strong> si vous arrivez par un lien de campagne (<code>utm_campaign</code>) ou depuis un autre site, votre navigateur le garde 30 jours, sans cookie, et nous l’envoyons avec votre test, votre inscription ou vos coordonnées du calculateur, pour savoir comment vous nous avez connus.</li><li><strong>Messages :</strong> si vous nous écrivez sur WhatsApp ou par e-mail, le contenu de cette conversation.</li></ul>']],
      ['finalidad', 'À quoi elles servent', ['<ul><li>Que votre professeur connaisse votre niveau dès le premier cours.</li><li>Que votre Campus Pathway démarre au bon niveau.</li><li>Répondre à votre demande et vous proposer un horaire adapté à votre niveau et à votre date cible.</li><li>Suivre vos cours et vos progrès.</li></ul>', 'Nous ne vendons pas vos données, ne les utilisons pas pour de la publicité et ne faisons pas de conseil en immigration.']],
      ['servicios', 'Où elles sont conservées et services externes', ['Les données du test et de l’inscription sont conservées dans Supabase, le service de base de données utilisé par Pathway. Le site est servi par Cloudflare. Si vous nous écrivez sur WhatsApp ou par e-mail, les politiques de ces services s’appliquent aussi. Les rondes d’IRCC sont consultées sur canada.ca, sans envoyer aucune donnée personnelle.']],
      ['conservacion', 'Combien de temps nous les gardons', ['Nous conservons vos données jusqu’à 24 mois après notre dernier contact avec vous (votre dernier cours, votre dernier message ou votre dernier test). Ensuite, nous les supprimons.']],
      ['derechos', 'Vos droits', ['Vous pouvez à tout moment demander à consulter, corriger ou supprimer vos données en écrivant à <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>. Si vous demandez la suppression, nous effaçons votre résultat du test et votre demande d’inscription de notre base de données.']],
      ['navegador', 'Ce que garde votre navigateur', [`Pour que le parcours fonctionne, certaines pages gardent des données dans votre propre navigateur : votre résultat du test, votre adresse e-mail, la formule choisie sur la page d’accueil (${storage}), votre demande d’inscription, l’origine de votre première visite (<code>pathwayFirstTouch</code>, 30 jours) et vos préférences d’affichage. Le détail figure dans la <a href="{cookies}">politique de cookies</a>.`]]
    ]
  },
  en: {
    eyebrow: 'Transparency', h1: 'Privacy policy',
    lead: 'What Pathway records when you take the placement test, enrol or write to us: why, for how long and how to have it deleted.',
    sections: [
      ['responsable', 'Who uses your data', ['Pathway Language Solutions, an online French school, uses your data only for your classes and to answer you. For any question about your data, write to <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']],
      ['datos', 'The data we record', ['<ul><li><strong>Placement test:</strong> when you see your result, we record your email address, the estimated level, your overall score and your score in each skill in Pathway’s database (Supabase). The test does not send you any email.</li><li><strong>Enrolment form:</strong> your name, email address, WhatsApp number, the plan you chose, your availability, your goal and your comments. The request is recorded in the same database, then WhatsApp opens with a prepared message that you decide whether to send.</li><li><strong>CRS calculator:</strong> your answers are calculated in your browser and are not sent to Pathway. If you leave your details so we can write to you, we record your name, WhatsApp number, email address and estimated score in the same database.</li><li><strong>Where your visit came from:</strong> if you arrive through a campaign link (<code>utm_campaign</code>) or from another website, your browser keeps it for 30 days, without cookies, and we send it with your test, your enrolment or your calculator details, to know how you found us.</li><li><strong>Messages:</strong> if you write to us on WhatsApp or by email, the content of that conversation.</li></ul>']],
      ['finalidad', 'What we use it for', ['<ul><li>So your teacher knows your level from the first class.</li><li>So your Pathway Campus starts at the right level.</li><li>To answer your request and suggest a schedule that fits your level and target date.</li><li>To follow your classes and your progress.</li></ul>', 'We do not sell your data, do not use it for advertising and do not give immigration advice.']],
      ['servicios', 'Where it is stored and external services', ['Placement test and enrolment data are stored in Supabase, the database service Pathway uses. The site is served through Cloudflare. If you write to us on WhatsApp or by email, those services’ policies also apply. IRCC rounds are read from canada.ca without sending any personal data.']],
      ['conservacion', 'How long we keep it', ['We keep your data for up to 24 months after our last contact with you (your last class, your last message or your last test). After that, we delete it.']],
      ['derechos', 'Your rights', ['You can ask at any time to see, correct or delete your data by writing to <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>. If you ask for deletion, we erase your test result and your enrolment request from our database.']],
      ['navegador', 'What your browser keeps', [`So the journey works, some pages keep data in your own browser: your test result, your email address, the plan chosen on the home page (${storage}), your enrolment request, where your first visit came from (<code>pathwayFirstTouch</code>, 30 days) and your display preferences. The details are in the <a href="{cookies}">cookie policy</a>.`]]
    ]
  },
  de: {
    eyebrow: 'Transparenz', h1: 'Datenschutzerklärung',
    lead: 'Was Pathway speichert, wenn Sie den Test machen, sich anmelden oder uns schreiben: wozu, wie lange und wie Sie die Löschung verlangen.',
    sections: [
      ['responsable', 'Wer Ihre Daten verwendet', ['Pathway Language Solutions, eine Online-Französischschule, verwendet Ihre Daten nur für Ihren Unterricht und um Ihnen zu antworten. Bei Fragen zu Ihren Daten schreiben Sie an <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>.']],
      ['datos', 'Welche Daten wir speichern', ['<ul><li><strong>Einstufungstest:</strong> Wenn Sie Ihr Ergebnis sehen, speichern wir Ihre E-Mail-Adresse, das geschätzte Niveau, Ihre Gesamtpunktzahl und Ihre Punktzahl je Kompetenz in der Datenbank von Pathway (Supabase). Der Test schickt Ihnen keine E-Mail.</li><li><strong>Anmeldeformular:</strong> Ihr Name, Ihre E-Mail-Adresse, Ihre WhatsApp-Nummer, das gewählte Paket, Ihre Verfügbarkeit, Ihr Ziel und Ihre Anmerkungen. Die Anfrage wird in derselben Datenbank gespeichert, danach öffnet sich WhatsApp mit einer vorbereiteten Nachricht, die Sie selbst abschicken oder nicht.</li><li><strong>CRS-Rechner:</strong> Ihre Antworten werden in Ihrem Browser berechnet und nicht an Pathway gesendet. Wenn Sie Ihre Daten hinterlassen, damit wir Ihnen schreiben, speichern wir Ihren Namen, Ihre WhatsApp-Nummer, Ihre E-Mail-Adresse und Ihre geschätzte Punktzahl in derselben Datenbank.</li><li><strong>Herkunft Ihres Besuchs:</strong> Wenn Sie über einen Kampagnenlink (<code>utm_campaign</code>) oder von einer anderen Website kommen, speichert Ihr Browser dies 30 Tage lang, ohne Cookies, und wir senden es mit Ihrem Test, Ihrer Anmeldung oder Ihren Daten aus dem Rechner, um zu wissen, wie Sie uns gefunden haben.</li><li><strong>Nachrichten:</strong> Wenn Sie uns per WhatsApp oder E-Mail schreiben, der Inhalt dieses Austauschs.</li></ul>']],
      ['finalidad', 'Wozu wir sie verwenden', ['<ul><li>Damit Ihre Lehrkraft Ihr Niveau ab der ersten Stunde kennt.</li><li>Damit Ihr Pathway-Campus auf dem richtigen Niveau beginnt.</li><li>Um Ihre Anfrage zu beantworten und Ihnen einen Stundenplan passend zu Ihrem Niveau und Zieldatum vorzuschlagen.</li><li>Um Ihren Unterricht und Ihre Fortschritte zu begleiten.</li></ul>', 'Wir verkaufen Ihre Daten nicht, nutzen sie nicht für Werbung und bieten keine Einwanderungsberatung.']],
      ['servicios', 'Wo sie gespeichert werden und externe Dienste', ['Die Daten aus Test und Anmeldung werden in Supabase gespeichert, dem Datenbankdienst, den Pathway nutzt. Die Website wird über Cloudflare ausgeliefert. Wenn Sie uns per WhatsApp oder E-Mail schreiben, gelten zusätzlich die Richtlinien dieser Dienste. Die IRCC-Runden werden von canada.ca abgerufen, ohne personenbezogene Daten zu senden.']],
      ['conservacion', 'Wie lange wir sie aufbewahren', ['Wir bewahren Ihre Daten bis zu 24 Monate nach unserem letzten Kontakt mit Ihnen auf (Ihre letzte Stunde, Ihre letzte Nachricht oder Ihr letzter Test). Danach löschen wir sie.']],
      ['derechos', 'Ihre Rechte', ['Sie können jederzeit Auskunft, Berichtigung oder Löschung Ihrer Daten verlangen, per E-Mail an <a href="mailto:contact@pathway-languages.com">contact@pathway-languages.com</a>. Wenn Sie die Löschung verlangen, entfernen wir Ihr Testergebnis und Ihre Anmeldeanfrage aus unserer Datenbank.']],
      ['navegador', 'Was Ihr Browser speichert', [`Damit der Ablauf funktioniert, speichern einige Seiten Daten in Ihrem eigenen Browser: Ihr Testergebnis, Ihre E-Mail-Adresse, das auf der Startseite gewählte Paket (${storage}), Ihre Anmeldeanfrage, die Herkunft Ihres ersten Besuchs (<code>pathwayFirstTouch</code>, 30 Tage) und Ihre Anzeigeeinstellungen. Einzelheiten finden Sie in der <a href="{cookies}">Cookie-Richtlinie</a>.`]]
    ]
  }
};
