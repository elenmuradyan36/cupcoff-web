# CupCoff

CupCoff is a coffee-loyalty app with two sides: an owner dashboard for cafés, and a customer app for collecting stamps. This repo is the original single-file pitch rebuilt as a **Next.js** (App Router) project.

Right now it runs in **demo mode**. All data is an in-browser sample café, so there's no backend to set up.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Link | What it opens |
| --- | --- |
| `/` | "How will you use CupCoff?" role picker |
| `/#overview` | Owner dashboard (also `#analytics`, `#insights`, `#customers`, `#vip`, `#subscription`, `#payments`, `#support`, `#shop-settings`) |
| `/#counter` | Barista scanner screen |
| `/#c-cards` | Customer app (also `#c-code`, `#c-rewards`, `#c-discover`, `#c-profile`) |

## Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and choose **Continue with GitHub**.
3. Click **Add New… → Project** and **Import** this repo.
4. Leave every setting at its default. Vercel detects Next.js on its own. Click **Deploy**.
5. Vercel gives you a URL like `https://cupcoff-xxxx.vercel.app`. To add your own domain, go to **Project → Settings → Domains**.

Each push to `main` redeploys automatically.

## Project layout

```
app/
  layout.tsx        <html>, metadata, theme colour, fonts (next/font)
  page.tsx          the single page that hosts the app
  manifest.ts       PWA manifest (/manifest.webmanifest)
  fonts.ts          Bricolage Grotesque + Instrument Sans, self-hosted by Next
  globals.css       all styles
components/
  CupCoffApp.tsx    client component that mounts the app once
lib/
  app.js            screens, hash router, dialogs (owner, counter, customer)
  api.js            data layer: demo store + proposed live endpoints
  config.js         settings read from NEXT_PUBLIC_CUPCOFF_* env vars
  charts.js         SVG charts
  qr.js             QR encoder
  illustrations.js  hand-inked café drawings
  pwa.js            service worker registration
public/
  sw.js             service worker (installable + offline shell)
  icons/            app icons
```

## Configuration

Copy `.env.example` to `.env.local`. On Vercel, set the same names under **Settings → Environment Variables**.

- `NEXT_PUBLIC_CUPCOFF_MODE`: `demo` (default) or `live`
- `NEXT_PUBLIC_CUPCOFF_API_BASE`: backend base URL for live mode (default `/api`)
- `NEXT_PUBLIC_CUPCOFF_JOIN_URL`: where customer QR codes point
- `NEXT_PUBLIC_CUPCOFF_PWA`: `false` turns off the service worker

## Notes

- The screens are the original vanilla-JS code, moved into ES modules and rendered inside `#cupcoff-root`. React only hosts it. You can rewrite screens as React components one at a time later.
- The service worker only runs in production builds (`npm run build && npm start`, or on Vercel), so it never caches dev bundles.
- The QR scanner uses the browser's `BarcodeDetector` when it's available. Otherwise it loads the `jsqr` package.
