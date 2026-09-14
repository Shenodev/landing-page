export interface ProjectImage {
  url: string;
  publicId: string;
}

/** Purified project payload ready for persistence. */
export interface ProjectSubmission {
  title: string;
  description: string;
  imageUrl: string;
  images: ProjectImage[];
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
}

export interface ProjectResult {
  /** The created document (or in-memory fallback) to send back to the client. */
  data: unknown;
  degraded: boolean;
}