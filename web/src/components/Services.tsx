import { PricingCard, type PricingCardData } from "@/components/pricing/PricingCard";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PRICING_CARDS: readonly PricingCardData[] = [
  {
    title: "Smart Corporate Website",
    desc: "Engineered for brand eminence, customer trust, and speed.",
    price: "10,000 EGP",
    features: [
      "Fast, SEO-Optimized",
      "3-5 Tailored Core Pages",
      "CMS Ready & Configured",
      "Responsive Mobile-First UI",
      "Analytics & Tag Setup",
    ],
    cta: "Choose Plan",
    highlighted: false,
  },
  {
    title: "Business Dashboard",
    desc: "Centralized intelligence, data control, and authenticated access.",
    price: "25,000 EGP",
    features: [
      "Secure Auth & Session Vault",
      "Dynamic CRUD Operations",
      "Data Management & Filters",
      "Role-Based Access Control (RBAC)",
      "Third-Party API Integrations",
      "Real-time Telemetry & Charts",
    ],
    cta: "Get Started",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    title: "Full-Stack Platform",
    desc: "Bespoke distributed applications engineered for massive scale.",
    price: "45,000 EGP",
    features: [
      "Custom Architecture Design",
      "Scalable Database (SQL/NoSQL)",
      "End-to-End Automation Pipelines",
      "High-Concurrency Support",
      "Microservices / Serverless Engine",
      "Dedicated SLA & Deployment Care",
    ],
    cta: "Scale Up",
    highlighted: false,
  },
] as const;

export const Services = () => {
  return (
    <section className="py-24 max-w-[1320px] mx-auto px-6 md:px-12" id="services">
      <SectionHeading
        badge={<SectionBadge>Flexible Engagements</SectionBadge>}
        title="Transparent Pricing &amp; High-Impact Services"
        subtitle="Tailored engineering solutions designed to turn complex business architectures into seamless, scalable, and conversion-ready digital platforms."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PRICING_CARDS.map((card) => (
          <PricingCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
};