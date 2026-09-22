import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { Project } from "@/lib/api";

const ProjectCard = ({ project }: { project: Project }) => (
  <Card
    className="group h-full bg-surface-container/70 border-outline-variant/30 overflow-hidden backdrop-blur-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary-container/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    <div className="h-48 overflow-hidden bg-surface-container-lowest">
      <Image
        src={project.imageUrl}
        alt={project.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-6 space-y-4">
      <h3 className="font-display text-title-md text-on-surface group-hover:text-primary transition-colors">
        {project.title}
      </h3>
      <p className="text-body-sm leading-[20px] text-on-surface-variant line-clamp-3">{project.description}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
        {project.techStack.map((tech) => (
          <li
            key={tech}
            className="px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-label-sm font-medium text-on-surface-variant"
          >
            {tech}
          </li>
        ))}
      </ul>
      {(project.demoUrl || project.githubUrl) && (
        <div className="flex items-center gap-3 pt-2">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary-container hover:bg-primary text-on-primary-container text-body-sm font-semibold px-4 py-2.5 rounded-lg glow-button transition-colors"
            >
              Live Demo <MaterialIcon name="open_in_new" className="text-sm" />
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface text-body-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <MaterialIcon name="code" className="text-sm" /> Code
            </a>
          )}
        </div>
      )}
    </div>
  </Card>
);

export default ProjectCard;