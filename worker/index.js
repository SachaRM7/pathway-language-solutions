// Cloudflare Worker for pathway-languages.com.
// Serves the static site built in dist/client and keeps the IRCC Express Entry
// rounds current: /v4/data/ircc-rounds.json is read live from canada.ca on the
// server (no browser CORS limits), cached for 4 hours, and falls back to the
// verified snapshot shipped with the build if IRCC is unreachable or changes.
//
// It also runs first for every page (*.html), every folder address and the
// audio and video files (see run_worker_first in wrangler.jsonc), to:
// - send http:// and www. to https://pathway-languages.com (301);
// - redirect old addresses and working copies to the current page (301), from
//   dist/worker-data.json written by scripts/build-seo.mjs;
// - answer Range requests (206) for audio and video, which Safari on iPhone
//   needs to play and seek them;
// - serve the 404 page with a 404 status;
// - add the security headers (the _headers file covers the other files).
import { parseOfficialRounds, IRCC_SOURCES, unrecognisedRecentCategories, buildSnapshot } from '../v4/ircc-rounds.js';
import WORKER_DATA from '../dist/worker-data.json' with { type: 'json' };

const IRCC_PATH = '/v4/data/ircc-rounds.json';
const IRCC_TTL_SECONDS = 4 * 60 * 60;
const IRCC_TIMEOUT_MS = 10000;
const CANONICAL_HOST = 'pathway-languages.com';
const MEDIA_PATH = /^\/assets\/(videos|audio)\//;
const REDIRECTS = WORKER_DATA.redirects;
const MEDIA_SIZES = WORKER_DATA.media;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  // Only what cannot break a page: no framing by other sites, no <base> or plugins.
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const local = LOCAL_HOSTS.has(url.hostname);
    // One canonical address: https://pathway-languages.com.
    if (!local && (url.protocol === 'http:' || url.hostname === `www.${CANONICAL_HOST}`)) {
      url.protocol = 'https:';
      if (url.hostname === `www.${CANONICAL_HOST}`) url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === IRCC_PATH && (request.method === 'GET' || request.method === 'HEAD')) {
      return irccRounds(request, url, env, ctx);
    }
    const target = REDIRECTS[url.pathname];
    if (target) return secure(Response.redirect(`${url.origin}${target}${url.search}`, 301));
    if (MEDIA_PATH.test(url.pathname)) return secure(await mediaRange(request, env, url));
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return secure(asset);
    return secure(await folderIndex(request, url, env) || await notFound(request, url, env, asset));
  }
};

function secure(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!headers.has(name)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// Same URL behaviour as GitHub Pages: /fr/ serves /fr/index.html and /fr redirects to /fr/.
async function folderIndex(request, url, env) {
  if (url.pathname.endsWith('/')) {
    const index = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}index.html`, url), request));
    return index.status === 404 ? null : index;
  }
  if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
    const index = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}/index.html`, url), request));
    if (index.ok) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);
  }
  return null;
}

// Pages and folders get the site's 404 page (4 languages); files keep an empty 404.
async function notFound(request, url, env, fallback) {
  const isPage = url.pathname.endsWith('/') || url.pathname.endsWith('.html') || !/\.[a-z0-9]+$/i.test(url.pathname);
  if (!isPage || !['GET', 'HEAD'].includes(request.method)) return fallback;
  const page = await env.ASSETS.fetch(new Request(new URL('/404.html', url), { method: request.method, headers: request.headers }));
  if (!page.ok) return fallback;
  const headers = new Headers(page.headers);
  headers.set('cache-control', 'no-store');
  return new Response(request.method === 'HEAD' ? null : page.body, { status: 404, headers });
}

// Audio and video with byte ranges: GET bytes=a-b, a- or -n returns 206 with
// that part only; anything else returns the whole file, announcing
// Accept-Ranges so the browser knows it can ask for parts.
async function mediaRange(request, env, url) {
  const range = request.headers.get('range');
  if (range) {
    // If the asset service answers ranges itself, use its answer.
    const direct = await env.ASSETS.fetch(request);
    if (direct.status === 206 || direct.status === 416 || direct.status === 304) return direct;
    direct.body?.cancel();
  }
  const plain = new Headers(request.headers);
  plain.delete('range');
  plain.delete('if-range');
  const full = await env.ASSETS.fetch(new Request(request.url, { method: request.method, headers: plain }));
  if (full.status !== 200) return full;
  const headers = new Headers(full.headers);
  headers.set('accept-ranges', 'bytes');
  // The size comes from the build: the asset service does not always send Content-Length.
  const size = MEDIA_SIZES[url.pathname] ?? Number(full.headers.get('content-length'));
  const ifRange = request.headers.get('if-range');
  const etag = full.headers.get('etag');
  const parsed = range && (!ifRange || ifRange === etag) ? parseRange(range, size) : null;
  if (!parsed) return new Response(full.body, { status: 200, headers });
  if (parsed === 'unsatisfiable') {
    full.body?.cancel();
    headers.set('content-range', `bytes */${size}`);
    headers.delete('content-length');
    return new Response(null, { status: 416, headers });
  }
  const { start, end } = parsed;
  headers.set('content-range', `bytes ${start}-${end}/${size}`);
  headers.set('content-length', String(end - start + 1));
  if (request.method === 'HEAD' || !full.body) {
    full.body?.cancel();
    return new Response(null, { status: 206, headers });
  }
  // A fixed-length stream keeps Content-Length on the 206 answer.
  const { readable, writable } = new FixedLengthStream(end - start + 1);
  full.body.pipeThrough(byteSlice(start, end)).pipeTo(writable).catch(() => {});
  return new Response(readable, { status: 206, headers });
}

function parseRange(header, size) {
  if (!Number.isFinite(size) || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) return null; // several ranges or malformed: whole file
  let start;
  let end;
  if (match[1] === '') {
    const suffix = Number(match[2]);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
    if (start >= size) return 'unsatisfiable';
    if (end < start) return null;
  }
  return { start, end };
}

// Passes bytes start..end (inclusive) of a stream.
function byteSlice(start, end) {
  let offset = 0;
  return new TransformStream({
    transform(chunk, controller) {
      const chunkStart = offset;
      offset += chunk.byteLength;
      if (offset <= start || chunkStart > end) {
        if (chunkStart > end) controller.terminate();
        return;
      }
      controller.enqueue(chunk.subarray(Math.max(0, start - chunkStart), Math.min(chunk.byteLength, end - chunkStart + 1)));
      if (offset > end) controller.terminate();
    }
  });
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
