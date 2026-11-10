'use strict';

// Anagramma's offline service worker.
//
// Why a hand-written one: Flutter's own worker is a stub that unregisters
// itself, so nothing is cached for offline play (docs/OFFLINE_FIRST_AUDIT.md).
//
// What it does, in order of importance:
//  1. Keeps a complete copy of one build (every file listed in that build's
//     offline-manifest.json) in a cache named for the build id, so the game
//     starts and plays with no connection once that copy exists.
//  2. Fills that copy in the background, checking every file's size and
//     SHA-256 against the manifest. The copy only counts once all of it is
//     there and correct; until then the previous build's copy keeps serving.
//  3. Never takes over a running game. A new build waits (no skipWaiting)
//     until the player approves a restart (the page sends SKIP_WAITING) or
//     every tab is closed; the old copy is deleted only after the new one is
//     complete.
//
// It never touches localStorage or IndexedDB, so an update cannot reach
// player data, and it only handles requests to its own origin.
//
// BUILD_ID is stamped by tools/stamp_offline_build.py at deploy time. A local
// build keeps the token, and sw_register.js then does not register this
// worker at all.

const BUILD_ID = '20261110.b4ca1db';
const PREFIX = 'anagramma-offline-';
const CACHE = PREFIX + BUILD_ID;
const MANIFEST = 'offline-manifest.json';
const COMPLETE = '__complete__';
const FETCH_TIMEOUT_MS = 30000;

// Never answered from the cache: how a new build is noticed.
const ALWAYS_NETWORK = ['version.json', MANIFEST, 'anagramma_sw.js'];

const scopeUrl = (path) => new URL(path, self.registration.scope).href;

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Downloads the whole build into [CACHE], or throws and leaves the previous
// build's cache as it was. Files already stored (an interrupted earlier
// attempt) are kept.
async function precache() {
  const cache = await caches.open(CACHE);
  if (await cache.match(scopeUrl(COMPLETE))) return;
  const response = await fetchWithTimeout(
    scopeUrl(MANIFEST) + '?b=' + encodeURIComponent(BUILD_ID),
    { cache: 'no-store' },
    FETCH_TIMEOUT_MS,
  );
  if (!response.ok) throw new Error('offline manifest: HTTP ' + response.status);
  const manifest = await response.json();
  if (manifest.buildId !== BUILD_ID) {
    throw new Error('offline manifest is for build ' + manifest.buildId);
  }
  for (const file of manifest.files) {
    const key = scopeUrl(file.path);
    if (await cache.match(key)) continue;
    const res = await fetchWithTimeout(
      key + '?v=' + encodeURIComponent(BUILD_ID),
      { cache: 'no-store' },
      FETCH_TIMEOUT_MS * 2,
    );
    if (!res.ok) throw new Error(file.path + ': HTTP ' + res.status);
    const body = await res.arrayBuffer();
    if (body.byteLength !== file.size) {
      throw new Error(file.path + ': wrong size');
    }
    if ((await sha256Hex(body)) !== file.sha256) {
      throw new Error(file.path + ': wrong contents');
    }
    await cache.put(
      key,
      new Response(body, {
        headers: { 'content-type': res.headers.get('content-type') || '' },
      }),
    );
  }
  await cache.put(
    scopeUrl(COMPLETE),
    new Response(JSON.stringify({ buildId: BUILD_ID, files: manifest.files.length })),
  );
}

self.addEventListener('install', (event) => {
  // No skipWaiting: see the header.
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Only retire the older copies once this one is whole.
      if (await cache.match(scopeUrl(COMPLETE))) {
        for (const name of await caches.keys()) {
          if (name.startsWith(PREFIX) && name !== CACHE) {
            await caches.delete(name);
          }
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data === 'GET_STATUS' && event.source) {
    event.source.postMessage({ type: 'status', buildId: BUILD_ID });
  }
});

async function serve(request) {
  const cache = await caches.open(CACHE);
  // The word-list URLs carry ?v=<build id>; the stored copy has no query.
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  if (request.mode === 'navigate') {
    const page = await cache.match(scopeUrl('index.html'));
    if (page) return page;
  }
  try {
    return await fetchWithTimeout(request, {}, FETCH_TIMEOUT_MS);
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (ALWAYS_NETWORK.some((name) => url.pathname.endsWith('/' + name))) return;
  event.respondWith(serve(request));
});
