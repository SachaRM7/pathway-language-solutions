#!/usr/bin/env node
// Rend une pièce HTML (window.seek(t)) en images PNG, puis en MP4, et sort la planche de 18 images.
// Usage : node marketing/studio/motor/render.mjs <pieza/reel.html> [--secs 15] [--fps 30] [--w 1080] [--h 1920]
//         [--sub 1]      sous-images par image (4 = flou de mouvement)
//         [--planche]    ne sort que la planche de 18 images (pas de MP4)
//         [--audio f]    piste audio à poser sous la vidéo
// Sorties, à côté du fichier HTML : contact-sheet.png, reel.mp4
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

// Playwright est installé globalement dans les sessions cloud : on le charge par require.
const { chromium } = createRequire(import.meta.url)('playwright');

const args = process.argv.slice(2);
const flags = new Set(['planche']);
const file = args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--') || flags.has(args[i - 1].slice(2))));
if (!file) { console.error('Fichier HTML manquant.'); process.exit(1); }
const num = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? Number(args[i + 1]) : d; };
const str = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const SECS = num('secs', 15), FPS = num('fps', 30), W = num('w', 1080), H = num('h', 1920), SUB = num('sub', 1);
const plancheOnly = args.includes('--planche');
const out = str('out') || 'reel';
const dir = dirname(resolve(file));
const N = Math.round(SECS * FPS); // images 0..N-1 : l'image N serait l'image 0 (boucle)
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(file)).href + '?render=1', { waitUntil: 'load' });
await page.evaluate(async () => { await document.fonts.ready; });
const seek = async (t) => page.evaluate(async (t) => {
  window.seek(t);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}, t);

const tmp = mkdtempSync(join(tmpdir(), 'pathway-studio-'));
try {
  // 1. Planche de 18 images, réparties sur toute la durée (6 colonnes × 3 lignes).
  for (let i = 0; i < 18; i++) {
    await seek((i * SECS) / 18);
    await page.screenshot({ path: join(tmp, `p${String(i).padStart(2, '0')}.png`) });
  }
  ff(['-framerate', '1', '-i', join(tmp, 'p%02d.png'), '-vf', 'scale=360:-1,tile=6x3:padding=12:margin=12:color=0x122b26', '-frames:v', '1', join(dir, 'contact-sheet.png')]);
  console.log('planche :', join(dir, 'contact-sheet.png'));

  if (!plancheOnly) {
    // 2. Toutes les images, puis le MP4 (H.264, lisible partout).
    let n = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < SUB; j++) {
        await seek((i + (j / SUB) * 0.5) / FPS); // sous-images sur une demi-image = obturateur à 180°
        await page.screenshot({ path: join(tmp, `f${String(n++).padStart(5, '0')}.png`) });
      }
    }
    const audio = str('audio');
    const vf = SUB > 1 ? ['-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`] : [];
    ff(['-framerate', String(FPS * SUB), '-i', join(tmp, 'f%05d.png'),
      ...(audio && existsSync(audio) ? ['-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
      ...vf, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(dir, out + '.mp4')]);
    console.log('vidéo :', join(dir, out + '.mp4'));
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
