"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "Contact", href: "/#contact" },
] as const;

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = (): void => {
    setMobileOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") {
      closeMobile();
    }
  };

  return (
    <header
      onKeyDown={handleKeyDown}
      className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm"
    >
      <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-[1320px] mx-auto h-20">
        <Link
          className="flex items-center group"
          href="/"
          onClick={closeMobile}
          aria-label="ShenoDev - Back to top"
        >
          <Image
            src="/assets/Logo Horizontal without slugan.svg"
            alt="ShenoDev"
            width={160}
            height={36}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              className="text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button href="/discovery" size="md">
            Get a Quote
          </Button>
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="md:hidden text-on-surface p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            onClick={() => setMobileOpen((prev) => !prev)}
            type="button"
          >
            <MaterialIcon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div
        className={`${mobileOpen ? "flex" : "hidden"} md:hidden px-6 py-4 bg-surface-container-high border-b border-outline-variant/30 flex-col gap-4`}
        id="mobile-menu"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            className="text-label-md text-on-surface-variant hover:text-primary transition-colors"
            href={link.href}
            onClick={closeMobile}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
};