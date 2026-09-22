import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Explore ShenoDev's services, work, and contact options.",
};

const HELPFUL_LINKS = [
  { label: "Homepage", href: "/" },
  { label: "Services & Pricing", href: "/#services" },
  { label: "Selected Work", href: "/work" },
  { label: "Start a Project", href: "/discovery" },
  { label: "Contact", href: "/#contact" },
] as const;

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center bg-background">
      <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">search_off</span>
      </div>
      <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight mb-2">
        Page not found
      </h1>
      <p className="text-body-sm text-on-surface-variant max-w-md mb-8">
        The page you are looking for does not exist or has been moved. Here is where you can go instead:
      </p>
      <nav aria-label="Not found suggestions">
        <ul className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {HELPFUL_LINKS.map((link) => (
            <li key={link.href + link.label}>
              <Link
                href={link.href}
                className="inline-flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface text-body-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] font-medium px-6 py-3 rounded-lg font-semibold glow-button"
      >
        Back to home
      </Link>
    </div>
  );
};

export default NotFound;
