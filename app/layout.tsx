import type { Metadata, Viewport } from "next";
import { bricolage, instrument } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CupCoff · Owner dashboard",
  description: "CupCoff owner dashboard: loyalty customers, stamps, rewards and analytics for coffee shops.",
  applicationName: "CupCoff",
  appleWebApp: { capable: true, title: "CupCoff", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#51000E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
