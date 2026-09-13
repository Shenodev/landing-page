import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import UnhandledReporter from "@/components/UnhandledReporter";

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
  title: "ShenoDev | Premium Full-Stack Web Development Agency",
  description:
    "ShenoDev builds fast, scalable, and intelligent web applications engineered for authoritative performance and seamless user experiences.",
  icons: {
    icon: "/assets/Logo Icon.png",
    shortcut: "/assets/Logo Icon.png",
    apple: "/assets/Logo Icon.png",
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${sora.variable} bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col justify-between font-sans`}
      >
        <Script id="bigint-shim" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: BIGINT_SHIM }} />
        <UnhandledReporter />
        {/* Atmospheric Background Glow */}
        <div className="fixed inset-0 pointer-events-none cyan-ambient-radial -z-10" />
        <div className="fixed top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 left-1/3 w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        {children}
      </body>
    </html>
  );
};

export default Layout;
