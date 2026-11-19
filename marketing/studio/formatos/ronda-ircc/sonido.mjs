#!/usr/bin/env node
// Bande-son du format « Ronda IRCC », fabriquée en code (coût : 0 €, aucune dépendance).
// Une cumbia légère à 120 BPM (basse, guitare à contretemps, güiro, conga, marimba) + les bruitages
// calés sur les images de reel.html. Tout est déterministe : même script, même fichier.
// Usage : node marketing/studio/formatos/ronda-ircc/sonido.mjs <dossier de la pièce>   → audio.wav (15 s, en boucle)
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SR = 44100, DUR = 15, N = SR * DUR, BEAT = 0.5;
// Deux pistes séparées : la musique et les bruitages. On écrit ensuite deux fichiers :
// audio.wav (tout) et audio-effets.wav (bruitages seuls, au même niveau que dans le mix complet).
const ML = new Float32Array(N), MR = new Float32Array(N), FL = new Float32Array(N), FR = new Float32Array(N);
let L = ML, R = MR;

// Hasard semé (mulberry32).
let seed = 20261027;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const noise = () => rnd() * 2 - 1;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Pose un son à l'instant t ; ce qui dépasse 15 s revient au début, pour que la boucle soit propre.
function add(t, len, gain, pan, fn) {
  const n = Math.floor(len * SR), i0 = Math.round(t * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) {
    const v = fn(i / SR, i), k = ((i0 + i) % N + N) % N;
    L[k] += v * gl; R[k] += v * gr;
  }
}
// Corde pincée (Karplus-Strong) : guitare ou marimba selon l'amortissement.
function pluck(t, midi, len, gain, pan, bright = 0.5, damp = 0.996) {
  const p = Math.max(2, Math.round(SR / hz(midi))), buf = new Float32Array(p);
  let lp = 0;
  for (let i = 0; i < p; i++) { lp += bright * (noise() - lp); buf[i] = lp; }
  let j = 0;
  add(t, len, gain, pan, (s) => {
    const a = buf[j], b = buf[(j + 1) % p];
    buf[j] = damp * 0.5 * (a + b); j = (j + 1) % p;
    return a * Math.min(1, s / 0.002) * Math.min(1, (len - s) / 0.03);
  });
}
const tone = (t, len, gain, pan, f0, f1, decay, harm = 0) => {
  let ph = 0;
  add(t, len, gain, pan, (s) => {
    const f = f1 + (f0 - f1) * Math.exp(-s * 30);
    ph += (2 * Math.PI * f) / SR;
    return (Math.sin(ph) + harm * Math.sin(2 * ph)) * Math.exp(-s * decay) * Math.min(1, s / 0.003);
  });
};
// Bruit filtré (güiro, souffle, impact).
const hiss = (t, len, gain, pan, cut, decay, attack = 0.002) => {
  let lp = 0, prev = 0;
  add(t, len, gain, pan, (s) => {
    const x = noise(); lp += cut * (x - lp); const hp = x - lp; const y = 0.6 * hp + 0.4 * prev; prev = hp;
    return y * Math.exp(-s * decay) * Math.min(1, s / attack) * Math.min(1, (len - s) / 0.01);
  });
};

// ---------- La musique : 15 mesures de 2 temps, 5 accords × 3 (boucle exacte sur 15 s).
// Do – Sol – La m – Fa – Sol : lumineux, simple, familier.
const CH = [
  { root: 36, notes: [60, 64, 67] }, // C
  { root: 43, notes: [59, 62, 67] }, // G
  { root: 45, notes: [60, 64, 69] }, // Am
  { root: 41, notes: [60, 65, 69] }, // F
  { root: 43, notes: [59, 62, 67] }  // G
];
const MEL = [ // marimba : une phrase de 10 temps, répétée 3 fois. [temps, note]
  [0, 76], [0.5, 79], [1.5, 76], [2, 74], [2.5, 71], [3.5, 74], [4, 72], [4.5, 76], [5.5, 72], [6, 69], [6.5, 72], [7.5, 77], [8, 74], [8.5, 71], [9.5, 74]
];
for (let bar = 0; bar < 15; bar++) {
  const t0 = bar * 2 * BEAT, c = CH[bar % 5];
  // Basse de cumbia : fondamentale sur le 1, quinte sur le 2, petite levée avant la mesure suivante.
  tone(t0, 0.42, 0.34, 0, hz(c.root) * 1.5, hz(c.root), 5, 0.35);
  tone(t0 + BEAT, 0.3, 0.28, 0, hz(c.root + 7) * 1.4, hz(c.root + 7), 6, 0.3);
  tone(t0 + 1.5 * BEAT, 0.2, 0.2, 0, hz(CH[(bar + 1) % 5].root) * 1.3, hz(CH[(bar + 1) % 5].root), 9, 0.3);
  for (let b = 0; b < 2; b++) {
    const tb = t0 + b * BEAT;
    // Guitare à contretemps (le « chac » de la cumbia), léger arpège.
    c.notes.forEach((n, i) => pluck(tb + BEAT / 2 + i * 0.012, n, 0.32, 0.105, -0.35, 0.55, 0.988));
    // Güiro : croche + deux doubles (« chk – chk-chk »).
    hiss(tb, 0.11, 0.075, 0.45, 0.35, 38, 0.012);
    hiss(tb + BEAT / 2, 0.05, 0.05, 0.45, 0.3, 70);
    hiss(tb + 0.75 * BEAT, 0.05, 0.042, 0.45, 0.3, 70);
    // Grosse caisse feutrée sur chaque temps.
    tone(tb, 0.16, 0.2, 0, 120, 52, 22);
  }
  // Conga : ouverte sur la fin de la mesure.
  tone(t0 + 1.5 * BEAT, 0.22, 0.15, 0.3, 300, 225, 16, 0.2);
  tone(t0 + 1.75 * BEAT, 0.2, 0.12, 0.3, 270, 200, 18, 0.2);
}
for (let rep = 0; rep < 3; rep++) MEL.forEach(([b, n]) => pluck(rep * 10 * BEAT + b * BEAT, n, 0.5, 0.15, 0.2, 0.9, 0.975));

// ---------- Les bruitages, sur les images de reel.html (un son tombe sur son image, jamais avant).
L = FL; R = FR;
const whoosh = (t) => { let lp = 0; add(t - 0.05, 0.5, 0.11, 0, (s) => { lp += (0.02 + 0.3 * Math.sin(Math.PI * s / 0.5) ** 2) * (noise() - lp); return lp * Math.sin(Math.PI * s / 0.5) ** 2; }); };
const pop = (t, f, g = 0.2) => tone(t, 0.14, g, 0.1, f * 0.7, f, 28, 0.15);
const thud = (t, g) => { tone(t, 0.3, g, 0, 170, 62, 13, 0.1); hiss(t, 0.05, g * 0.35, 0, 0.6, 60); };
const tick = (t, f) => { tone(t, 0.07, 0.16, 0.25, f, f, 60, 0.4); hiss(t, 0.02, 0.05, 0.25, 0.2, 150); };

thud(0.0, 0.32);                                   // le 407 « bat »
pop(0.5, 880, 0.14);                               // la pastille de la ronde
[2.5, 6.5, 10.0, 13.5].forEach(whoosh);            // changements de plan
thud(3.3, 0.26); pop(3.3, 523, 0.16);              // 519 se pose
thud(4.3, 0.26); pop(4.3, 659, 0.16);              // 407 se pose
pop(5.0, 988, 0.24); pop(5.06, 1319, 0.14);        // « 112 puntos menos »
[0, 1, 2, 3].forEach((i) => tick(6.5 + 0.85 + i * 0.2 + 0.12, 1568 + i * 196)); // les 4 coches, de plus en plus aigu
// Le coup de tampon (image 330) : le son le plus fort de la vidéo.
tone(11.0, 0.45, 0.6, 0, 210, 48, 9, 0.2); hiss(11.0, 0.09, 0.3, 0, 0.75, 45); hiss(11.0, 0.3, 0.1, 0, 0.08, 14);
pop(11.75, 784, 0.15);                             // le logo
tick(12.0, 1175);                                  // le « clic » du bouton

// ---------- Mixage : limiteur doux, puis WAV 16 bits stéréo.
// Le gain est calculé sur le mix complet et appliqué aussi aux bruitages seuls : un tampon sonne pareil dans les deux versions.
const AL = new Float32Array(N), AR = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) { AL[i] = ML[i] + FL[i]; AR[i] = MR[i] + FR[i]; peak = Math.max(peak, Math.abs(AL[i]), Math.abs(AR[i])); }
const g = 0.9 / Math.max(peak, 1e-6);
function wav(name, A, B) {
  const out = Buffer.alloc(44 + N * 4);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    out.writeInt16LE(Math.round(Math.tanh(A[i] * g * 1.15) / Math.tanh(1.15) * 32000), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.tanh(B[i] * g * 1.15) / Math.tanh(1.15) * 32000), 46 + i * 4);
  }
  const dest = resolve(process.argv[2] || '.', name);
  writeFileSync(dest, out);
  console.log('son :', dest);
}
wav('audio.wav', AL, AR);          // musique + bruitages
wav('audio-effets.wav', FL, FR);   // bruitages seuls
