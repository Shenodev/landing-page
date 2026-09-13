import Image from "next/image";

type FooterLink = {
  label: string;
  href: string;
};

const FOOTER_LINKS: readonly FooterLink[] = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/work" },
  { label: "Pricing", href: "/#services" },
  { label: "Contact", href: "/#contact" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

const Footer = () => {
  return (
    <footer className="full-width bg-surface-container-lowest border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 py-12 max-w-[1320px] mx-auto gap-6">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Image
            src="/assets/Logo Horizontal without slugan.svg"
            alt="ShenoDev"
            width={140}
            height={44}
            priority={false}
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
          <p className="text-[13px] leading-[20px] font-normal text-on-surface-variant">
            © 2026 ShenoDev. All rights reserved. Think it, Sheno it.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {FOOTER_LINKS.map((link: FooterLink) => (
            <a
              key={link.label}
              className="text-[11px] leading-[16px] font-semibold text-on-surface-variant hover:text-primary transition-colors duration-200"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
