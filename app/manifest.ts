import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest; Next adds the <link rel="manifest"> tag.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CupCoff",
    short_name: "CupCoff",
    description: "Coffee stamps for customers, loyalty tools for cafés. One app for both.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFDFA",
    theme_color: "#51000E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My code", url: "/#c-code", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Scan customer", url: "/#counter", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
