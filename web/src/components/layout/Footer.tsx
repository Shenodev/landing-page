import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/work" },
  { label: "Pricing", href: "/#services" },
  { label: "Contact", href: "/#contact" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

export const Footer = () => (
  <footer className="bg-surface-container-lowest border-t border-outline-variant/30">
    <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 py-12 max-w-[1320px] mx-auto gap-6">
      <div className="flex flex-col items-center md:items-start gap-3">
        <Image
          src="/assets/Logo Horizontal without slugan.svg"
          alt="ShenoDev"
          width={140}
          height={44}
          className="h-7 w-auto object-contain"
        />
        <p className="text-body-sm text-on-surface-variant">
          © 2026 ShenoDev. All rights reserved. Think it, Sheno it.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            className="text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);