import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

// Publishes the student/teacher campus under /campus/. The SQL migrations and notes stay out of the site.
export async function buildCampus({ outDir, rootDir }) {
  const source = resolve(rootDir, 'campus');
  const destination = resolve(outDir, 'campus');
  await cp(source, destination, {
    recursive: true,
    filter: path => {
      const rel = relative(source, path);
      return !(rel === 'db' || rel.startsWith(`db${sep}`) || rel.endsWith('.md'));
    }
  });
  const html = await readFile(resolve(destination, 'index.html'), 'utf8');
  for (const marker of ['name="robots" content="noindex', 'src="config.js"', 'src="app.js"', '@supabase/supabase-js@2.45.4/dist/umd/supabase.js', 'id="lesson"', 'id="ob"', 'id="login"']) {
    if (!html.includes(marker)) throw new Error(`campus/index.html is missing ${marker}`);
  }
  const config = await readFile(resolve(destination, 'config.js'), 'utf8');
  if (/sb_secret_|service_role/.test(config)) throw new Error('campus/config.js must only contain the publishable key.');
  if (!/supabaseUrl: 'https:\/\/[a-z0-9]+\.supabase\.co'/.test(config) || !/supabaseKey: 'sb_publishable_/.test(config)) {
    throw new Error('campus/config.js needs the Supabase project URL and publishable key.');
  }
  const linked = await linkCampusFromHeaders(outDir);
  if (!linked) throw new Error('No site header received the campus link.');
  return { path: '/campus/', linked };
}

// Adds the student access link to every published page header that has the main call to action,
// in the page language. Pages are found by markup, so new pages get the link without extra work.
const LABELS = { es: 'Acceso alumnos', fr: 'Espace élève', en: 'Student area', de: 'Kursbereich' };
const SPANISH_NOTE = { fr: 'en espagnol', en: 'in Spanish', de: 'auf Spanisch' };
const NAV_CTA = '<a class="button button-primary nav-cta"';
async function htmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    const rel = relative(base, path);
    if (entry.isDirectory()) { if (!['campus', 'v3', 'prototipos', 'prototypes', 'assets'].includes(rel)) out.push(...await htmlFiles(path, base)); }
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}
async function linkCampusFromHeaders(outDir) {
  let count = 0;
  for (const file of await htmlFiles(outDir)) {
    const html = await readFile(file, 'utf8');
    if (!html.includes(NAV_CTA) || html.includes('class="nav-campus"')) continue;
    const lang = (html.match(/<html[^>]*\slang="([a-z]{2})/) || [])[1] || 'es';
    const label = LABELS[lang] || LABELS.es;
    const iconMarkup = html.includes('id="i-people"') ? '<svg class="icon" aria-hidden="true"><use href="#i-people"/></svg>' : '';
    // The Campus is in Spanish: other languages open a translated sign-in screen that says so.
    const href = lang === 'es' ? '/campus/' : `/campus/?lang=${lang}`;
    const aria = lang === 'es' ? label : `${label} (${SPANISH_NOTE[lang]})`;
    const link = `<a class="nav-campus" href="${href}" data-cta="header-campus" aria-label="${aria}" title="${aria}">${iconMarkup}<span class="nav-campus-label">${label}</span></a>\n        `;
    await writeFile(file, html.replace(NAV_CTA, link + NAV_CTA), 'utf8');
    count++;
  }
  return count;
}
