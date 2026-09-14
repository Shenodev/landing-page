const STACK_ITEMS = [
  { label: "Next.js", dot: "bg-primary-container" },
  { label: "React", dot: "bg-primary" },
  { label: "Node.js", dot: "bg-tertiary" },
  { label: "Express", dot: "bg-secondary" },
  { label: "MongoDB", dot: "bg-tertiary-container" },
  { label: "Tailwind CSS", dot: "bg-primary-fixed-dim" },
  { label: "Zod", dot: "bg-secondary-fixed" },
] as const;

const MARQUEE_SETS = 4;

export const TechMarquee = () => {
  // 4x duplication ensures the viewport is always filled on ultrawide screens;
  // the animation translates -50% (exactly 2 sets) for a gap-free seamless loop.
  const loopItems = Array.from({ length: MARQUEE_SETS }, () => STACK_ITEMS).flat();

  return (
    <section
      className="py-12 border-y border-outline-variant/30 bg-surface-container-lowest/40 relative overflow-hidden"
      aria-label="Technology stack"
    >
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex overflow-hidden">
        <div className="animate-marquee-infinite flex shrink-0 items-center gap-12 md:gap-16">
          {loopItems.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="flex shrink-0 items-center gap-3 bg-surface-container-high/60 border border-outline-variant/40 rounded-xl px-5 py-2.5 backdrop-blur-md"
            >
              <span className={`w-2 h-2 rounded-full ${item.dot}`} aria-hidden="true" />
              <span className="text-body-lg font-semibold font-display tracking-wide text-on-surface">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};