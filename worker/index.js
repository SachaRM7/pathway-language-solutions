// Cloudflare Worker for pathway-languages.com.
// Serves the static site built in dist/client and keeps the IRCC Express Entry
// rounds current: /v4/data/ircc-rounds.json is read live from canada.ca on the
// server (no browser CORS limits), cached for 4 hours, and falls back to the
// verified snapshot shipped with the build if IRCC is unreachable or changes.
import { parseOfficialRounds, IRCC_SOURCES, unrecognisedRecentCategories, buildSnapshot } from '../v4/ircc-rounds.js';

const IRCC_PATH = '/v4/data/ircc-rounds.json';
const IRCC_TTL_SECONDS = 4 * 60 * 60;
const IRCC_TIMEOUT_MS = 10000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // One canonical address: www.pathway-languages.com → pathway-languages.com.
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === IRCC_PATH && (request.method === 'GET' || request.method === 'HEAD')) {
      return irccRounds(request, url, env, ctx);
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    return folderIndex(request, url, env, asset);
  }
};

// Same URL behaviour as GitHub Pages: /fr/ serves /fr/index.html and /fr redirects to /fr/.
async function folderIndex(request, url, env, notFound) {
  if (url.pathname.endsWith('/')) {
    const index = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}index.html`, url), request));
    return index.status === 404 ? notFound : index;
  }
  if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
    const index = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}/index.html`, url), request));
    if (index.ok) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
  }
  return notFound;
}

async function irccRounds(request, url, env, ctx) {
  const cache = globalThis.caches ? caches.default : null;
  const cacheKey = new Request(`${url.origin}${IRCC_PATH}`, { method: 'GET' });
  const cached = cache && await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const live = await fetchLiveSnapshot();
    const response = json(live, { 'cache-control': `public, max-age=${IRCC_TTL_SECONDS}`, 'x-pathway-ircc': 'live' });
    if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error(`IRCC live refresh failed, serving the build snapshot: ${error.message}`);
    const snapshot = await env.ASSETS.fetch(new Request(cacheKey.url, request));
    const response = new Response(snapshot.body, snapshot);
    response.headers.set('cache-control', 'public, max-age=900');
    response.headers.set('x-pathway-ircc', 'snapshot');
    return response;
  }
}

async function fetchLiveSnapshot() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IRCC_TIMEOUT_MS);
  try {
    const response = await fetch(IRCC_SOURCES.roundsDataUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'PathwayIRCCSnapshot/1.0' }
    });
    if (!response.ok) throw new Error(`IRCC returned HTTP ${response.status}`);
    const payload = await response.json();
    const parsed = parseOfficialRounds(payload);
    const unmatched = unrecognisedRecentCategories(payload);
    if (unmatched.length) throw new Error(`Unrecognised IRCC category names: ${unmatched.join(', ')}`);
    return buildSnapshot(parsed);
  } finally {
    clearTimeout(timer);
  }
}

function json(body, headers) {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
}
