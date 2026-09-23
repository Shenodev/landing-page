"use client";

import Link from "next/link";
import ProjectCard from "@/components/work/ProjectCard";
import {
  WorkEmpty,
  WorkError,
  WorkHeading,
  WorkSkeleton,
} from "@/components/work/WorkStates";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/lib/api";

type WorkSectionProps = {
  showViewAll?: boolean;
  /** Use h1 when this section is the page's primary heading (e.g. /work). */
  headingLevel?: 1 | 2;
};

const PopulatedHeading = ({ count, level }: { count: number; level: 1 | 2 }) => {
  const TitleTag = level === 1 ? "h1" : "h2";
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">Portfolio</p>
        <TitleTag className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight mt-3 text-balance">
          Selected work
        </TitleTag>
        <p className="text-body-md text-on-surface-variant mt-3 tabular-nums">
          {count} {count === 1 ? "build" : "builds"} shipped and live
        </p>
      </div>
      <Link
        href="/discovery"
        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:text-primary-container transition-colors"
      >
        Start a project <MaterialIcon name="arrow_forward" className="text-sm" />
      </Link>
    </div>
  );
};

const ProjectGrid = ({ projects }: { projects: Project[] }) => {
  const [first, ...rest] = projects;
  if (!first) return null;
  return (
    <div className="space-y-8">
      <ProjectCard project={first} index={0} featured />
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rest.map((project, i) => (
            <ProjectCard key={project._id} project={project} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkSection = ({ showViewAll = true, headingLevel = 2 }: WorkSectionProps) => {
  const { projects, loading, error } = useProjects();

  if (loading) {
    return <WorkSkeleton showViewAll={showViewAll} level={headingLevel} />;
  }

  if (error && projects.length === 0) {
    return <WorkError showViewAll={showViewAll} level={headingLevel} message={error} />;
  }

  if (projects.length === 0) {
    return <WorkEmpty showViewAll={showViewAll} level={headingLevel} />;
  }

  return (
    <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
      {showViewAll ? (
        <WorkHeading showViewAll={showViewAll} level={headingLevel} />
      ) : (
        <PopulatedHeading count={projects.length} level={headingLevel} />
      )}
      <ProjectGrid projects={projects} />
    </section>
  );
};
