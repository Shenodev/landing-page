const SITE_URL = "https://shenodev.tech";
const EMAIL = "hello@contact.shenodev.tech";

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#business`,
  name: "ShenoDev",
  url: SITE_URL,
  slogan: "Think it, Sheno it.",
  description:
    "ShenoDev builds fast, scalable, and intelligent web applications — corporate websites, business dashboards, and full-stack platforms with fixed-scope proposals.",
  email: EMAIL,
  priceRange: "EGP 10,000 - EGP 45,000+",
  areaServed: "Worldwide",
  sameAs: [] as string[],
  makesOffer: [
    { "@type": "Offer", name: "Smart Corporate Website", price: "10000", priceCurrency: "EGP" },
    { "@type": "Offer", name: "Business Dashboard", price: "25000", priceCurrency: "EGP" },
    { "@type": "Offer", name: "Full-Stack Platform", price: "45000", priceCurrency: "EGP" },
  ],
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "ShenoDev",
  publisher: { "@id": `${SITE_URL}/#business` },
};

/** Site-wide Organization + WebSite structured data (local business included). */
export const SiteJsonLd = () => (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE) }} />
  </>
);

export type Crumb = {
  label: string;
  href?: string;
};

/** BreadcrumbList structured data for the given trail (always starts at Home). */
export const BreadcrumbJsonLd = ({ trail }: { trail: readonly Crumb[] }) => {
  const items = [{ label: "Home", href: SITE_URL }, ...trail].map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.label,
    ...(crumb.href ? { item: crumb.href.startsWith("http") ? crumb.href : `${SITE_URL}${crumb.href}` } : {}),
  }));
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
};
