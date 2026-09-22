import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import type { Crumb } from "@/components/seo/JsonLd";
import { Card } from "@/components/ui/Card";

export type LegalSection = {
  title: string;
  body?: string;
  items?: readonly string[];
};

const RELATED_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
  { label: "Cookie Policy", href: "/cookies" },
] as const;

type LegalPageProps = {
  title: string;
  intro: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
  children?: React.ReactNode;
  /** Current page label for the breadcrumb trail (defaults to title). */
  crumb?: string;
};

export const LegalPage = ({ title, intro, effectiveDate, sections, children, crumb }: LegalPageProps) => (

  <>
    <Navbar />
    <main
      id="main-content"
      className="flex-grow relative overflow-hidden py-12 md:py-20 px-4 md:px-8"
      style={{
        background: "radial-gradient(circle 800px at 50% -100px, rgba(6,182,212,0.12), transparent 80%)",
      }}
    >
      <div className="max-w-[880px] mx-auto">
        <Breadcrumbs trail={[{ label: crumb ?? title }]} className="mb-8" />
        <div className="text-center space-y-4 mb-14">
          <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
            {title}
          </h1>
          <p className="text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mx-auto">{intro}</p>
          <p className="text-label-sm font-medium text-outline">Effective date: {effectiveDate}</p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="relative border-outline-variant/30 hover:border-primary/40 transition-colors p-6 md:p-8 bg-surface-container-low/70 backdrop-blur-md"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-t-xl" />
              <h2 className="font-display text-title-md text-on-surface mb-3">{section.title}</h2>
              {section.body && <p className="text-body-sm leading-[22px] text-on-surface-variant">{section.body}</p>}
              {section.items && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-body-sm leading-[22px] text-on-surface-variant">
                      <span aria-hidden="true" className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>

        {children}

        <nav aria-label="Related policies" className="mt-10">
          <Card className="p-6 md:p-8 bg-surface-container-low/70 backdrop-blur-md">
            <h2 className="font-display text-title-md text-on-surface mb-4">Related policies</h2>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {RELATED_LINKS.filter((link) => link.label !== title).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </nav>
      </div>
    </main>
    <Footer />
  </>
);
