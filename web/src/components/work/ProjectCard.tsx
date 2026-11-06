import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { Project } from "@/lib/api";

type ProjectCardProps = {
  project: Project;
  index: number;
  featured?: boolean;
};

const STAGGER_MS = 90;
const MAX_STAGGER = 5;

const TechList = ({ techStack, small }: { techStack: readonly string[]; small?: boolean }) => (
  <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
    {techStack.map((tech) => (
      <li
        key={tech}
        className={
          small
            ? "px-2 py-0.5 rounded-md bg-surface-dim/80 text-xs font-medium text-on-surface-variant"
            : "px-2.5 py-1 rounded-md bg-surface-dim/80 border border-white/10 text-xs font-medium text-on-surface-variant"
        }
      >
        {tech}
      </li>
    ))}
  </ul>
);

const CardActions = ({ project, stretch }: { project: Project; stretch?: boolean }) => {
  if (!project.demoUrl && !project.githubUrl) return null;
  return (
    <div className="flex items-center gap-3 mt-auto pt-5">
      {project.demoUrl && (
        <a
          href={project.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold px-4 py-2.5 rounded-xl glow-button transition-colors"
        >
          Live Demo <MaterialIcon name="open_in_new" className="text-sm" />
        </a>
      )}
      {project.githubUrl && (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${stretch ? "" : "flex-1"} inline-flex items-center justify-center gap-1.5 bg-surface-dim hover:bg-surface border border-white/10 text-on-surface text-body-sm px-4 py-2.5 rounded-xl transition-colors`}
        >
          <MaterialIcon name="code" className="text-sm" /> Code
        </a>
      )}
    </div>
  );
};

const ProjectCard = ({ project, index, featured = false }: ProjectCardProps) => {
  const order = String(index + 1).padStart(2, "0");
  const delay = `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`;

  if (featured) {
    return (
      <article
        className="animate-rise group grid overflow-hidden rounded-xl bg-surface/80 border border-white/10 backdrop-blur-md transition-colors duration-200 hover:border-primary/40 lg:grid-cols-12"
        style={{ animationDelay: delay }}
      >
        <div className="relative h-60 overflow-hidden bg-surface-dim sm:h-72 lg:col-span-7 lg:h-auto lg:min-h-[340px]">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
          <span className="absolute left-5 top-4 font-display text-title-md font-bold tabular-nums text-on-surface/90">
            {order}
          </span>
        </div>
        <div className="flex flex-col p-7 sm:p-9 lg:col-span-5">
          <span className="text-xs font-semibold text-primary">Featured build</span>
          <h3 className="font-display text-headline-sm text-on-surface mt-2 text-balance">{project.title}</h3>
          <p className="text-body-md leading-[24px] text-on-surface-variant mt-3 max-w-prose">{project.description}</p>
          <div className="mt-5">
            <TechList techStack={project.techStack} />
          </div>
          <CardActions project={project} stretch />
        </div>
      </article>
    );
  }

  return (
    <article
      className="animate-rise group flex h-full flex-col overflow-hidden rounded-xl bg-surface/80 border border-white/10 backdrop-blur-md transition-colors duration-200 hover:border-primary/40"
      style={{ animationDelay: delay }}
    >
      <div className="relative h-52 shrink-0 overflow-hidden bg-surface-dim">
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
        <span className="absolute left-4 top-3 font-display text-title-md font-bold tabular-nums text-on-surface/90">
          {order}
        </span>
      </div>
      <div className="flex grow flex-col p-6">
        <h3 className="font-display text-title-md text-on-surface text-balance transition-colors group-hover:text-primary">
          {project.title}
        </h3>
        <p className="text-body-sm leading-[20px] text-on-surface-variant mt-2 line-clamp-3">{project.description}</p>
        <div className="mt-4">
          <TechList techStack={project.techStack} small />
        </div>
        <CardActions project={project} />
      </div>
    </article>
  );
};

export default ProjectCard;
