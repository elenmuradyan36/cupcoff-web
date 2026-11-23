"use client";

import { useEffect, useRef } from "react";
import { bricolage, instrument } from "@/app/fonts";

// The app keeps its own hash router and module state, so it must start once per page load
// (React Strict Mode runs effects twice in development).
let started = false;

export default function CupCoffApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || started) return;
    started = true;
    (async () => {
      const [{ CONFIG }, { startCupCoff }] = await Promise.all([import("@/lib/config"), import("@/lib/app")]);
      CONFIG.fonts = { display: bricolage.style.fontFamily, body: instrument.style.fontFamily };
      startCupCoff(root);
    })().catch((err) => {
      started = false;
      console.error(err);
      root.textContent = "CupCoff couldn't start. Reload the page to try again.";
    });
  }, []);

  // React never renders children here: the app owns everything inside this element.
  return <div id="cupcoff-root" ref={rootRef} suppressHydrationWarning />;
}
