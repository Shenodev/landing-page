"use client";

import ProjectCard from "@/components/work/ProjectCard";
import {
  WorkEmpty,
  WorkError,
  WorkHeading,
  WorkSkeleton,
} from "@/components/work/WorkStates";
import { useProjects } from "@/hooks/useProjects";

type WorkSectionProps = {
  showViewAll?: boolean;
  /** Use h1 when this section is the page's primary heading (e.g. /work). */
  headingLevel?: 1 | 2;
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
      <WorkHeading showViewAll={showViewAll} level={headingLevel} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  );
};