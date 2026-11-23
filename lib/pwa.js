/* CupCoff — service worker registration.
 * After the worker is ready, it is handed the Next.js bundles this page already loaded,
 * so the app shell opens offline from the very next visit.
 */
export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => {
      const urls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => { try { const x = new URL(u); return x.origin === location.origin && x.pathname.startsWith("/_next/static/"); } catch { return false; } });
      reg.active?.postMessage({ type: "warm", urls });
    })
    .catch(() => {});
}
