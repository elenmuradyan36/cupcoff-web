// CupCoff service worker: makes the app installable and lets the app shell open offline.
// API calls always go to the network, so stamps and data are never served stale.
const CACHE = "cupcoff-shell-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page sends the /_next/static bundles it loaded before this worker took control.
self.addEventListener("message", (e) => {
  if (e.data?.type !== "warm" || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(e.data.urls.map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {}))))));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (e.request.mode === "navigate") {
    // Network first for the page, so updates arrive; cached copy if offline.
    e.respondWith(
      fetch(e.request)
        .then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("/", copy)); } return r; })
        .catch(() => caches.match("/"))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    // Hashed, immutable build files: cache first, store on first use.
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return r;
      }))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
