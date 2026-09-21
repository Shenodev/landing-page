import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

// Design goals we build toward — not measured guarantees.
const TRUST_METRICS = [
  { value: "Uptime-first", label: "Resilient architecture" },
  { value: "Edge-ready", label: "Fast global delivery" },
  { value: "Reviewed", label: "Clean, tested code" },
] as const;

export const Hero = () => {
  return (
    <section className="relative pt-12 pb-20 md:py-24 max-w-[1320px] mx-auto px-6 md:px-12 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-start z-10">

          <h1 className="font-display text-display-hero-mobile md:text-display-hero text-on-surface tracking-tight mb-6">
            Empowering Your Business with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">
              High-Performance
            </span>{" "}
            Web Solutions.
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-xl mb-10">
            We build fast, scalable, and intelligent web applications engineered for authoritative performance,
            exceptional precision, and seamless user experiences.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-12">
            <Button href="/discovery" size="lg">
              Start Your Project
              <MaterialIcon name="arrow_forward" className="text-base" />
            </Button>
            <Button href="#work" variant="outline" size="lg">
              View Our Work
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/30 w-full max-w-lg">
            {TRUST_METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="text-title-md font-display font-bold text-on-surface">{metric.value}</div>
                <div className="text-body-sm text-on-surface-variant">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

          <div className="lg:flex lg:col-span-5 hidden relative w-full items-center justify-center">
          <div className="w-full h-[500px] relative rounded-xl overflow-hidden">
            <video autoPlay loop muted playsInline aria-hidden="true" tabIndex={-1} className="w-full h-full object-cover">
              <source src="/hero-boomerang.webm" type="video/webm" />
              <source src="/model2.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};