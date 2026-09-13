type ServiceFeature = string;

type PricingCard = {
  title: string;
  desc: string;
  price: string;
  features: readonly ServiceFeature[];
  cta: string;
  highlighted: boolean;
  badge?: string;
};

const PRICING_CARDS: readonly PricingCard[] = [
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

const Services = () => {
  return (
    <section className="py-24 max-w-[1320px] mx-auto px-6 md:px-12" id="services">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary text-[11px] leading-[16px] font-semibold uppercase tracking-wider mb-4">
          Flexible Engagements
        </div>
        <h2 className="hidden md:block font-display text-[48px] leading-[56px] font-bold text-on-surface tracking-tight mb-4">
          Transparent Pricing &amp; High-Impact Services
        </h2>
        <h2 className="md:hidden font-display text-[32px] leading-[40px] font-bold text-on-surface tracking-tight mb-4">
          Transparent Pricing &amp; High-Impact Services
        </h2>
        <p className="text-[15px] leading-[24px] font-normal text-on-surface-variant">
          Tailored engineering solutions designed to turn complex business architectures into seamless, scalable, and
          conversion-ready digital platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PRICING_CARDS.map((card: PricingCard) => (
          <div
            key={card.title}
            className={
              card.highlighted
                ? "relative bg-surface-container/90 border border-primary-container/60 rounded-xl p-8 flex flex-col justify-between backdrop-blur-lg glow-cyan-card md:-translate-y-2"
                : "bg-surface-container/70 border border-outline-variant/40 rounded-xl p-8 flex flex-col justify-between backdrop-blur-md hover:border-primary/40 transition-all duration-300"
            }
          >
            {card.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container text-[11px] leading-[16px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                {card.badge}
              </div>
            )}
            <div>
              <div className="text-[22px] leading-[30px] font-semibold font-display text-on-surface mb-2 mt-1">
                {card.title}
              </div>
              <p className="text-[13px] leading-[20px] font-normal text-on-surface-variant mb-6">{card.desc}</p>
              <div className="mb-8">
                <span className="text-[18px] leading-[26px] font-semibold text-on-surface-variant">Starting at</span>
                <div className="text-[30px] leading-[38px] font-semibold font-display text-primary font-bold">{card.price}</div>
              </div>
              <ul className="space-y-3.5 mb-8">
                {card.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-3 text-[13px] leading-[20px] font-normal text-on-surface">
                    <span
                      className="material-symbols-outlined text-primary text-lg"
                      style={card.highlighted ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      check_circle
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <a
              className={
                card.highlighted
                  ? "w-full inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] leading-[20px] font-medium py-3.5 rounded-lg font-bold glow-button transition-all active:scale-95"
                  : "w-full inline-flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 text-on-surface text-[14px] leading-[20px] font-medium py-3 rounded-lg font-medium transition-all active:scale-95"
              }
              href="/discovery"
            >
              {card.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
