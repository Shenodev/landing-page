type StackItem = {
  label: string;
  dot: string;
};

const STACK_ITEMS: readonly StackItem[] = [
  { label: "Next.js", dot: "bg-primary-container" },
  { label: "React", dot: "bg-primary" },
  { label: "Node.js", dot: "bg-tertiary" },
  { label: "Express", dot: "bg-secondary" },
  { label: "MongoDB", dot: "bg-tertiary-container" },
  { label: "Tailwind CSS", dot: "bg-primary-fixed-dim" },
  { label: "Zod", dot: "bg-secondary-fixed" },
] as const;

const TechMarquee = () => {
  // 4x duplication ensures viewport is always filled on ultrawide screens;
  // animation translates -50% (exactly 2 sets) for gap-free seamless loop.
  // Removed pr-12/pr-16 which added trailing empty space at reset point.
  const loopItems: readonly StackItem[] = [
    ...STACK_ITEMS,
    ...STACK_ITEMS,
    ...STACK_ITEMS,
    ...STACK_ITEMS,
  ] as const;

  return (
    <section className="py-12 border-y border-outline-variant/30 bg-surface-container-lowest/40 relative overflow-hidden">
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex overflow-hidden">
        <div className="animate-marquee-infinite flex shrink-0 items-center gap-12 md:gap-16">
          {loopItems.map((item: StackItem, idx: number) => (
            <div
              key={`${item.label}-${idx}`}
              className="flex shrink-0 items-center gap-3 bg-surface-container-high/60 border border-outline-variant/40 rounded-xl px-5 py-2.5 backdrop-blur-md"
            >
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className="text-[18px] leading-[26px] font-semibold font-display tracking-wide text-on-surface">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechMarquee;
