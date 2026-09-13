"use client";

import { useState } from "react";
import Image from "next/image";

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: readonly NavLink[] = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Contact", href: "/#contact" },
] as const;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const toggleMobile = () => {
    setMobileOpen((prev: boolean) => !prev);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-[1320px] mx-auto h-20">
        <a
          className="flex items-center gap-2 group"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="ShenoDev - Back to top"
        >
          <Image
            src="/assets/Logo Horizontal without slugan.svg"
            alt="ShenoDev"
            width={160}
            height={36}
            priority
            style={{ height: 28, width: "auto", objectFit: "contain" }}
          />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link: NavLink) => (
            <a
              key={link.label}
              className="text-[14px] leading-[20px] font-medium text-on-surface-variant hover:text-primary transition-colors duration-200"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            className="hidden sm:inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] leading-[20px] font-medium px-5 py-2.5 rounded-lg font-semibold glow-button hover:scale-[1.02] active:scale-95 transition-all duration-150"
            href="/discovery"
          >
            Get a Quote
          </a>
          <button
            aria-label="Toggle Menu"
            aria-expanded={mobileOpen}
            className="md:hidden text-on-surface p-2 focus:outline-none"
            onClick={toggleMobile}
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      <div
        className={`${mobileOpen ? "flex" : "hidden"} md:hidden px-6 py-4 bg-surface-container-high border-b border-outline-variant/30 flex-col gap-4`}
        id="mobile-menu"
      >
        {NAV_LINKS.map((link: NavLink) => (
          <a
            key={link.label}
            className="text-[14px] leading-[20px] font-medium text-on-surface-variant hover:text-primary transition-colors"
            href={link.href}
            onClick={closeMobile}
          >
            {link.label}
          </a>
        ))}
      </div>
    </header>
  );
};

export default Navbar;
