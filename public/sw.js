/**
 * StockLedger Service Worker
 *
 * Security-first strategy for an internal wholesale inventory system.
 *
 * Caching strategy:
 *  - Application shell (HTML, JS, CSS): Network-first, offline fallback.
 *  - Static assets (fonts, icons, images): Cache-first with long TTL.
 *  - API requests to Django backend: Network-only (NEVER cached).
 *    - Prevents stale stock/purchase/sales data.
 *    - Prevents cached auth tokens or private business data.
 *    - Prevents false offline "successes" for mutations.
 *
 * Update strategy:
 *  - New service worker activates after user confirms via in-app banner.
 *  - Clients are notified via postMessage.
 */

const SW_VERSION = "stockledger-sw-v1";

// Shell assets that form the application skeleton (Next.js static output).
// These are safe to cache because they carry no private user data.
const SHELL_CACHE = `${SW_VERSION}-shell`;
const STATIC_CACHE = `${SW_VERSION}-static`;
const OFFLINE_PAGE = "/offline";

// Static asset extensions that are safe to cache aggressively.
const STATIC_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

// API origin – all requests to this prefix are NETWORK-ONLY.
// This protects private inventory, sales, and authentication data.
const API_PATTERNS = [
  /\/api\//,
  /127\.0\.0\.1:8000/,
  /localhost:8000/,
];

// ─────────────────────────────────────────────────────────────
// INSTALL – pre-cache the offline fallback page and key shell
// ─────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_PAGE,
          "/favicon.ico",
          "/icon-192.png",
          "/icon-512.png",
          "/apple-touch-icon.png",
          "/manifest.json",
        ])
      )
      .then(() => {
        // Do NOT call skipWaiting() automatically.
        // The new SW waits until the user acknowledges the update banner.
      })
  );
});

// ─────────────────────────────────────────────────────────────
// ACTIVATE – clean up old caches from previous SW versions
// ─────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== SHELL_CACHE &&
                key !== STATIC_CACHE &&
                key.startsWith("stockledger-sw-")
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────────────────────
// FETCH – route each request to the correct strategy
// ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── 1. Ignore non-GET requests entirely (POST/PUT/PATCH/DELETE).
  //       Mutations must always reach the server.
  if (request.method !== "GET") {
    return;
  }

  // ── 2. API requests → NETWORK ONLY.
  //       Never cache authenticated inventory data.
  const isApiRequest = API_PATTERNS.some(
    (pattern) =>
      pattern.test(url.pathname) ||
      pattern.test(url.hostname) ||
      pattern.test(url.href)
  );

  if (isApiRequest) {
    event.respondWith(
      fetch(request).catch(() => {
        // API failed while offline → return JSON error so the UI can handle it.
        return new Response(
          JSON.stringify({
            detail:
              "You are offline. Live inventory data requires an internet connection.",
            offline: true,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // ── 3. Static assets (images, fonts, icons) → CACHE FIRST.
  const isStaticAsset = STATIC_EXTENSIONS.some((ext) =>
    url.pathname.toLowerCase().endsWith(ext)
  );

  if (isStaticAsset && url.origin === self.location.origin) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  // ── 4. Next.js generated JS/CSS chunks → CACHE FIRST (immutable, versioned).
  if (
    url.pathname.startsWith("/_next/static/") &&
    url.origin === self.location.origin
  ) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  // ── 5. Navigation (HTML pages) → NETWORK FIRST with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── 6. Everything else → Network first (safe default).
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─────────────────────────────────────────────────────────────
// Strategy: Cache-First for immutable static assets
// ─────────────────────────────────────────────────────────────
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Asset not available offline.", { status: 503 });
  }
}

// ─────────────────────────────────────────────────────────────
// Strategy: Network-First for navigation with offline fallback
// ─────────────────────────────────────────────────────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed – return cached page if available.
    const cached = await caches.match(request);
    if (cached) return cached;

    // Last resort: offline page.
    const offlinePage = await caches.match(OFFLINE_PAGE);
    return (
      offlinePage ||
      new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Offline – StockLedger</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8f9fc;
      color: #1a1a2e;
    }
    .card {
      text-align: center;
      padding: 2.5rem;
      max-width: 380px;
    }
    h1 { font-size: 1.5rem; margin-bottom: .5rem; }
    p { color: #666; line-height: 1.6; }
    button {
      margin-top: 1.5rem;
      padding: .65rem 1.5rem;
      background: #3b3fcf;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: .95rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>You are offline</h1>
    <p>StockLedger requires an internet connection to display live inventory data.</p>
    <button onclick="location.reload()">Try again</button>
  </div>
</body>
</html>`,
        { status: 503, headers: { "Content-Type": "text/html" } }
      )
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MESSAGE – handle skipWaiting triggered by the in-app banner
// ─────────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

