/* CupCoff — runtime config.
 *
 * Set these in .env.local (see .env.example). NEXT_PUBLIC_ vars are inlined into
 * the browser bundle at build time, so rebuild after changing them.
 */
const env = {
  mode: process.env.NEXT_PUBLIC_CUPCOFF_MODE,
  apiBaseUrl: process.env.NEXT_PUBLIC_CUPCOFF_API_BASE,
  joinBaseUrl: process.env.NEXT_PUBLIC_CUPCOFF_JOIN_URL,
  pwa: process.env.NEXT_PUBLIC_CUPCOFF_PWA,
};

export const CONFIG = {
  mode: env.mode === "live" ? "live" : "demo",          // "demo" | "live"  (live = use real endpoints where they exist)
  apiBaseUrl: env.apiBaseUrl || "/api",                  // used in live mode
  joinBaseUrl: env.joinBaseUrl || "https://demo.cupcoff.app/join", // QR target; replace with the real customer app URL
  demoLatencyMs: 120,
  // Service worker (installable app + offline shell). Off in `next dev` so it never caches dev bundles.
  pwa: process.env.NODE_ENV === "production" && env.pwa !== "false",
  // Filled in by components/CupCoffApp.tsx with next/font's generated family names.
  fonts: { display: "", body: "" },
};

export default CONFIG;
