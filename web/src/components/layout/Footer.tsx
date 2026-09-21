import Image from "next/image";
import Link from "next/link";

const SERVICE_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/work" },
  { label: "Discovery", href: "/discovery" },
  { label: "Contact", href: "/#contact" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Unsubscribe", href: "/unsubscribe" },
] as const;

export const Footer = () => (
  <footer className="bg-surface-container-lowest border-t border-outline-variant/30">
    <div className="w-full px-6 md:px-12 py-12 max-w-[1320px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col items-center md:items-start gap-3 max-w-sm">
          <Image
            src="/assets/Logo Horizontal without slugan.svg"
            alt="ShenoDev"
            width={140}
            height={44}
            className="h-7 w-auto object-contain"
          />
          <p className="text-body-sm text-on-surface-variant text-center md:text-left">
            Independent web development practice. Fixed-scope proposals, no hidden fees.
          </p>
          <p className="text-body-sm text-on-surface-variant text-center md:text-left">
            <a className="text-primary hover:underline" href="mailto:hello@contact.shenodev.tech">
              hello@contact.shenodev.tech
            </a>
            {" · "}
            <a
              className="text-primary hover:underline"
              href="https://shenodev.tech"
              target="_blank"
              rel="noopener noreferrer"
            >
              shenodev.tech
            </a>
          </p>
          <p className="text-body-sm text-on-surface-variant">© 2026 ShenoDev. All rights reserved.</p>
        </div>
        <nav className="flex flex-col items-center md:items-start gap-2.5" aria-label="Services">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface">Explore</p>
          {SERVICE_LINKS.map((link) => (
            <Link
              key={link.label}
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="flex flex-col items-center md:items-start gap-2.5" aria-label="Legal">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface">Legal</p>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.label}
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  </footer>
);

export default Footer;
