type TrustMetric = {
  value: string;
  label: string;
};

const TRUST_METRICS: readonly TrustMetric[] = [
  { value: "99.9%", label: "Uptime Architecture" },
  { value: "<100ms", label: "Edge Latency" },
  { value: "100%", label: "Clean Code Delivery" },
] as const;

import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative pt-12 pb-20 md:py-24 max-w-[1320px] mx-auto px-6 md:px-12 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40 shadow-inner mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] leading-[16px] font-semibold text-primary uppercase tracking-wider font-sans">
              Think it, Sheno it
            </span>
            <span className="text-outline text-[11px] leading-[16px] font-semibold">|</span>
            <span className="text-[11px] leading-[16px] font-semibold text-on-surface-variant">Full-Stack Development Studio</span>
          </div>

          <h1 className="hidden md:block font-display text-[64px] leading-[72px] font-extrabold text-on-surface tracking-tight mb-6">
            Empowering Your Business with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">
              High-Performance
            </span>{" "}
            Web Solutions.
          </h1>
          <h1 className="md:hidden font-display text-[40px] leading-[48px] font-extrabold text-on-surface tracking-tight mb-6">
            Empowering Your Business with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">
              High-Performance
            </span>{" "}
            Web Solutions.
          </h1>

          <p className="text-[18px] leading-[28px] font-normal text-on-surface-variant max-w-xl mb-10">
            We build fast, scalable, and intelligent web applications engineered for authoritative performance, exceptional
            precision, and seamless user experiences.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-12">
            <Link
              href={"/discovery" as never}
              className="inline-flex items-center justify-center bg-primary-container hover:bg-primary text-on-primary-container text-[14px] leading-[20px] font-medium px-8 py-4 rounded-xl font-semibold glow-button hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              Start Your Project
              <span className="material-symbols-outlined ml-2 text-base">arrow_forward</span>
            </Link>
            <a
              className="inline-flex items-center justify-center bg-surface-container/60 hover:bg-surface-container-high text-on-surface border border-outline-variant/50 hover:border-primary/50 text-[14px] leading-[20px] font-medium px-7 py-4 rounded-xl transition-all duration-200 backdrop-blur-sm active:scale-95"
              href="#work"
            >
              View Our Work
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/30 w-full max-w-lg">
            {TRUST_METRICS.map((metric: TrustMetric) => (
              <div key={metric.label}>
                <div className="text-[18px] leading-[26px] font-display font-bold text-on-surface">
                  {metric.value}
                </div>
                <div className="text-[13px] leading-[20px] font-normal text-on-surface-variant">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:flex lg:col-span-5 hidden relative w-full items-center justify-center">
          <div className="w-full h-[500px] relative rounded-xl overflow-hidden">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src="/hero-boomerang.webm" type="video/webm" />
              <source src="/model2.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
