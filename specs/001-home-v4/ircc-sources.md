# IRCC round sources (v4 homepage)

Scope: the homepage "rondes IRCC" panel shows only the latest official
Express Entry round for two categories, with date and CRS cutoff. No historic
value is ever shown as current, and no invitation count or percentage is used.

## Official endpoints (verified 2026-10-05)

| Purpose | URL |
| --- | --- |
| Rounds JSON (live + snapshot source) | https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json |
| Rounds of invitations page | https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html |
| Per-round page | https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html?q=<drawNumber> |
| CRS calculator (check your score) | https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html |
| CRS criteria | https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html |

The JSON endpoint returns `access-control-allow-origin: *`, so the browser
fetches it live. The same-origin snapshot at `v4/data/ircc-rounds.json` is
used only when the live request fails, and is always labeled with its
verification date in the UI.

## Verified latest rounds (fetched 2026-10-05)

| Category | Draw | Date | CRS cutoff | Source |
| --- | --- | --- | --- | --- |
| French-Language proficiency 2026-Version 2 | #437 | 2026-08-19 | 382 | https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html?q=437 |
| Canadian Experience Class | #446 | 2026-09-29 | 518 | https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html?q=446 |

Client "today" is 2026-10-05; rounds dated after it are rejected by the parser
so a bad endpoint clock cannot surface a not-yet-official round.

## Regenerating the snapshot

```
node scripts/refresh-v4-ircc.mjs --check                  # fetch + validate only
node scripts/refresh-v4-ircc.mjs --ceiling 2026-10-05     # write snapshot
```
