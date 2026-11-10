import { cp, readFile } from 'node:fs/promises';
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
  return { path: '/campus/' };
}
