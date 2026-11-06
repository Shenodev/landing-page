import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ViewAllLink = ({ className }: { className?: string }) => (
  <div className={className}>
    <Link
      href="/work"
      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:text-primary-container transition-colors"
    >
      View All Projects <MaterialIcon name="arrow_forward" className="text-sm" />
    </Link>
  </div>
);

const WorkHeading = ({ showViewAll, level = 2 }: { showViewAll: boolean; level?: 1 | 2 }) => (
  <SectionHeading
    level={level}
    title="Selected Work"
    subtitle={
      <span className="text-body-md text-on-surface-variant">
        A curated collection of {showViewAll ? "our recent builds" : "high-performance builds"}.
      </span>
    }
  >
    {showViewAll && <ViewAllLink className="mt-5" />}
  </SectionHeading>
);

export { WorkHeading };

type WorkStateProps = {
  showViewAll: boolean;
  level?: 1 | 2;
};

export const WorkSkeleton = ({ showViewAll, level = 2 }: WorkStateProps) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <WorkHeading showViewAll={showViewAll} level={level} />
    <div className="space-y-8 animate-pulse" aria-hidden="true">
      <div className="h-72 bg-surface/50 border border-white/10 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64 bg-surface/50 border border-white/10 rounded-xl" />
        <div className="h-64 bg-surface/50 border border-white/10 rounded-xl" />
      </div>
    </div>
  </section>
);

export const WorkError = ({ showViewAll, message, level = 2 }: WorkStateProps & { message: string }) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <div className="text-center max-w-2xl mx-auto">
      {level === 1 ? (
        <h1 className="font-display text-headline-lg-mobile font-bold text-on-surface mb-4">Selected Work</h1>
      ) : (
        <h2 className="font-display text-headline-lg-mobile font-bold text-on-surface mb-4">Selected Work</h2>
      )}
      <p className="text-body-sm text-error" role="alert">
        Unable to load projects: {message}
      </p>
      {showViewAll && <ViewAllLink className="mt-5" />}
    </div>
  </section>
);

export const WorkEmpty = ({ showViewAll, level = 2 }: WorkStateProps) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <WorkHeading showViewAll={showViewAll} level={level} />
    <Card className="relative overflow-hidden bg-surface/60 border border-white/10 backdrop-blur-md p-12 md:p-16 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/[0.02] pointer-events-none" />
      <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-surface-dim border border-white/10 flex items-center justify-center">
        <MaterialIcon name="folder_open" className="text-primary text-2xl" />
      </div>
      <h3 className="font-display text-headline-sm text-on-surface mb-3">
        Client builds under active NDA
      </h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
        Enterprise and client platforms live behind logins and confidentiality agreements. Contact us for direct architectural walkthroughs.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/discovery"
          className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold px-5 py-2.5 rounded-xl glow-button transition-colors"
        >
          Start a project <MaterialIcon name="arrow_forward" className="text-sm" />
        </Link>
        <Link
          href="/#contact"
          className="inline-flex items-center justify-center gap-1.5 bg-surface hover:bg-surface-bright border border-white/10 text-on-surface text-body-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Inquire directly
        </Link>
      </div>
    </Card>
  </section>
);