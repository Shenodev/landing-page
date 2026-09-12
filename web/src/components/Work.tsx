"use client";

import { useEffect, useState } from "react";

type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
};

const Work = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProjects = async (): Promise<void> => {
      try {
        const backendUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
        if (!backendUrl) throw new Error("NEXT_PUBLIC_API_URL not configured");
        const res: Response = await fetch(`${backendUrl}/api/projects`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        const data = (await res.json()) as { data: Project[] } | Project[];
        const list: Project[] = Array.isArray(data) ? data : (data as { data: Project[] }).data ?? [];
        setProjects(list);
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        console.error("[Work] fetch failed:", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchProjects();
  }, []);

  if (loading) {
    return (
      <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
            Our Work
          </div>
          <h2 className="font-display text-[32px] md:text-[48px] font-bold text-on-surface tracking-tight mb-4">My Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-surface-container/50 border border-outline-variant/20 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error && projects.length === 0) {
    return (
      <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-[32px] font-bold text-on-surface mb-4">My Works</h2>
          <p className="text-[13px] text-error">Unable to load projects: {error}</p>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
            Our Work
          </div>
          <h2 className="font-display text-[32px] md:text-[48px] font-bold text-on-surface tracking-tight mb-4">My Works</h2>
          <p className="text-[15px] text-on-surface-variant">A curated collection of our recent builds.</p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-surface-container/50 border border-primary/20 backdrop-blur-md p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary-container/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <h3 className="font-display text-[22px] font-semibold text-on-surface mb-3">Crafting new digital experiences... Coming Soon</h3>
          <p className="text-[13px] text-on-surface-variant max-w-md mx-auto leading-relaxed">
            We’re currently curating our finest work. Soon you’ll explore elegant, high-performance projects engineered with Next.js, TypeScript, and MongoDB.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/30 text-[11px] font-semibold text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Portfolio curation in progress
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="work" className="py-24 max-w-[1320px] mx-auto px-6 md:px-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Our Work
        </div>
        <h2 className="font-display text-[32px] md:text-[48px] font-bold text-on-surface tracking-tight mb-4">My Works</h2>
        <p className="text-[15px] text-on-surface-variant">A curated collection of high-performance builds.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project: Project) => (
          <div
            key={project._id}
            className="group relative bg-surface-container/70 border border-outline-variant/30 rounded-xl overflow-hidden backdrop-blur-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary-container/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="h-48 overflow-hidden bg-surface-container-lowest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-display text-[18px] font-semibold text-on-surface group-hover:text-primary transition-colors">{project.title}</h3>
              <p className="text-[13px] leading-[20px] text-on-surface-variant line-clamp-3">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech: string) => (
                  <span key={tech} className="px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-[11px] font-medium text-on-surface-variant">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary-container hover:bg-primary text-on-primary-container text-[13px] font-semibold px-4 py-2.5 rounded-lg glow-button transition-colors">
                    Live Demo <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm">code</span> Code
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Work;
