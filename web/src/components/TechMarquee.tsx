const STACK_ITEMS = [
  "Next.js",
  "TypeScript",
  "React",
  "Node.js",
  "PostgreSQL",
  "Tailwind CSS",
  "Express",
  "Zod",
] as const;

const MARQUEE_SETS = 4;

export const TechMarquee = () => {
  const loopItems = Array.from({ length: MARQUEE_SETS }, () => STACK_ITEMS).flat();

  return (
    <section
      className="py-8 border-y border-white/10 bg-surface-dim/40 relative overflow-hidden"
      aria-label="Core technologies"
    >
      <div className="absolute top-0 bottom-0 left-0 w-24 md:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 md:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex overflow-hidden">
        <div className="animate-marquee-infinite flex shrink-0 items-center gap-8 md:gap-12">
          {loopItems.map((tech, idx) => (
            <div
              key={`${tech}-${idx}`}
              className="flex shrink-0 items-center bg-surface/80 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md"
            >
              <span className="text-body-sm font-medium font-display tracking-wide text-on-surface/90">
                {tech}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};