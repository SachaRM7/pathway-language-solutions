#!/usr/bin/env node
// Crée une pièce « Ronda IRCC » à partir de la dernière ronde vérifiée (v4/data/ircc-rounds.json).
// Usage : node marketing/studio/formatos/ronda-ircc/nueva-pieza.mjs
// Aucun chiffre n'est saisi à la main : tout vient de l'instantané officiel, avec sa date de vérification.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..', '..', '..');
const snap = JSON.parse(readFileSync(resolve(root, 'v4/data/ircc-rounds.json'), 'utf8'));
const { french, cec } = snap.categories;
if (!french?.score || !cec?.score) throw new Error('Instantané IRCC incomplet : pas de pièce.');
if (cec.score - french.score <= 0) throw new Error('Le format compare « francés » à un score plus haut : cette ronde ne convient pas, à traiter à la main.');

const id = `${french.date}-ronda-${french.drawNumber}`;
const dir = resolve(here, '..', '..', 'piezas', id);
mkdirSync(dir, { recursive: true });
const data = {
  id, formato: 'ronda-ircc', verifiedAt: snap.verifiedAt, source: snap.roundsPage,
  french: { drawNumber: french.drawNumber, date: french.date, score: french.score },
  cec: { drawNumber: cec.drawNumber, date: cec.date, score: cec.score }
};
writeFileSync(resolve(dir, 'data.js'), `// Données de la pièce, tirées de v4/data/ircc-rounds.json (vérifié sur IRCC le ${snap.verifiedAt}).\nwindow.PIEZA = ${JSON.stringify(data, null, 2)};\n`);
copyFileSync(resolve(here, 'reel.html'), resolve(dir, 'reel.html'));
console.log(existsSync(resolve(dir, 'script.md')) ? `Pièce mise à jour : ${dir}` : `Pièce créée : ${dir} (écrire script.md et shots.md)`);
