import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

// Self-hosted by Next at build time (no request to Google from the browser).
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

export const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
