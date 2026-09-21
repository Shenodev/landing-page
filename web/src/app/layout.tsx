import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import UnhandledReporter from "@/components/UnhandledReporter";
import { BackgroundGlow } from "@/components/layout/BackgroundGlow";
import { SkipLink } from "@/components/layout/SkipLink";
import { CookieBanner } from "@/components/legal/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

// Safari/iOS < 14 has no `BigInt`. Zod 4's coercion module eagerly evaluates
// BigInt("...") at load (and React's RSC flight parser may too), which crashes
// the page with "Can't find variable: BigInt". This shim defines BigInt as a
// Number-based function ONLY when the global is missing. Our schemas never use
// int64/uint64 coercion, so Number(Math.trunc()) is a safe stand-in.
const BIGINT_SHIM = `if (typeof BigInt === "undefined") {
  window.BigInt = function BigInt(value) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };
  window.BigInt.asIntN = function (bits, value) { return window.BigInt(value) % Math.pow(2, bits); };
  window.BigInt.asUintN = function (bits, value) {
    var v = window.BigInt(value) % Math.pow(2, bits);
    return v < 0 ? v + Math.pow(2, bits) : v;
  };
  window.BigInt.prototype = Object.create(Number.prototype);
}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://shenodev.tech"),
  title: {
    default: "ShenoDev | Premium Full-Stack Web Development Agency",
    template: "%s | ShenoDev",
  },
  description:
    "ShenoDev builds fast, scalable, and intelligent web applications engineered for authoritative performance and seamless user experiences.",
  icons: {
    icon: [
      { url: "/assets/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/assets/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/assets/favicon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/assets/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/assets/Logo Horizontal without slugan.svg",
        color: "#0b1326",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "https://shenodev.tech",
    siteName: "ShenoDev",
    title: "ShenoDev | Premium Full-Stack Web Development Agency",
    description:
      "Fast, scalable, and intelligent web applications engineered for authoritative performance and seamless user experiences.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShenoDev | Premium Full-Stack Web Development Agency",
    description:
      "Fast, scalable, and intelligent web applications engineered for authoritative performance and seamless user experiences.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Populate from GSC after domain verification if using meta-tag verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1326",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Third-party icon font (Material Symbols) — not available via next/font */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${sora.variable} bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col justify-between font-sans`}
      >
        <Script id="bigint-shim" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: BIGINT_SHIM }} />
        <SkipLink />
        <UnhandledReporter />
        <BackgroundGlow />
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
};

export default Layout;