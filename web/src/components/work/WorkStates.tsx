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

const WorkHeading = ({ showViewAll }: { showViewAll: boolean }) => (
  <SectionHeading
    title="My Works"
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

export const WorkSkeleton = ({ showViewAll }: { showViewAll: boolean }) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <WorkHeading showViewAll={showViewAll} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 bg-surface-container/50 border border-outline-variant/20 rounded-xl" />
      ))}
    </div>
  </section>
);

export const WorkError = ({ showViewAll, message }: { showViewAll: boolean; message: string }) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="font-display text-headline-lg-mobile font-bold text-on-surface mb-4">My Works</h2>
      <p className="text-body-sm text-error" role="alert">
        Unable to load projects: {message}
      </p>
      {showViewAll && <ViewAllLink className="mt-5" />}
    </div>
  </section>
);

export const WorkEmpty = ({ showViewAll }: { showViewAll: boolean }) => (
  <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
    <WorkHeading showViewAll={showViewAll} />
    <Card className="relative overflow-hidden bg-surface-container/50 border-primary/20 backdrop-blur-md p-12 md:p-16 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary-container/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
        <MaterialIcon name="auto_awesome" className="text-primary text-3xl" />
      </div>
      <h3 className="font-display text-headline-sm text-on-surface mb-3">
        Crafting new digital experiences... Coming Soon
      </h3>
      <p className="text-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
        We&apos;re currently curating our finest work. Soon you&apos;ll explore elegant, high-performance projects
        engineered with Next.js, TypeScript, and MongoDB.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/30 text-label-sm text-on-surface-variant">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Portfolio curation in progress
      </div>
    </Card>
  </section>
);