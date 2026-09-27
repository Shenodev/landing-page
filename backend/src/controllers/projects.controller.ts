import { Request, Response, NextFunction } from "express";
import { createProject, deleteProject, listProjects, updateProject } from "../services/projects.service";

/**
 * Cache policy for the public project list.
 *
 * This is the only defence between a traffic spike and the function + MongoDB:
 * the list is identical for every visitor, so the edge can answer almost all of
 * them without the origin running at all.
 *
 * The shared-cache TTL is deliberately long. Vercel does not collapse
 * concurrent requests that arrive after an entry expires - every one of them is
 * forwarded to the origin at once. Measured: 50 simultaneous requests against
 * a cold entry produced 0 edge hits and sent all 50 to the function. A 60s
 * shared TTL reopened that window every minute; 300s reopens it five times
 * less often, and each opening is covered by stale-while-revalidate so
 * visitors are still served instantly while the origin refreshes in the
 * background.
 *
 * stale-if-error covers the remaining window: if the origin is down during a
 * revalidation, the edge keeps serving the last good copy rather than handing
 * visitors an error. Short browser max-age keeps a visitor's own copy fresh
 * without making the shared cache the bottleneck.
 */
const PUBLIC_FEED_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=300, stale-if-error=86400";

export const getProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await listProjects();
    // Set only after the read succeeds. A throw skips this line, so the error
    // response carries no public directive and the edge cannot cache an outage.
    res.set("Cache-Control", PUBLIC_FEED_CACHE_CONTROL);
    res.status(200).json({ data: projects });
  } catch (err: unknown) {
    next(err);
  }
};

/**
 * Guarded read used by the admin dashboard to verify the admin secret.
 * Deliberately not cacheable: the response depends on a credential, and a
 * shared cache must never keep it.
 */
export const getProjectsAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await listProjects();
    res.set("Cache-Control", "private, no-store");
    res.status(200).json({ data: projects });
  } catch (err: unknown) {
    next(err);
  }
};

export const postProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // multer.array("images", 10) populates req.files
    const files: Express.Multer.File[] = ((req as unknown as { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];
    const result = await createProject(req.body, files);

    if (!result.degraded) {
      res.status(201).json({ message: "Project created", data: result.data });
      return;
    }

    res.status(201).json({ message: "Project created (degraded - memory)", data: result.data });
  } catch (err: unknown) {
    next(err);
  }
};

const paramId = (req: Request): string => {
  const raw: string | string[] = req.params.id;
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
};

export const putProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files: Express.Multer.File[] = ((req as unknown as { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];
    const result = await updateProject(paramId(req), req.body, files);

    if (!result.degraded) {
      res.status(200).json({ message: "Project updated", data: result.data });
      return;
    }

    res.status(200).json({ message: "Project updated (degraded - memory)", data: result.data });
  } catch (err: unknown) {
    next(err);
  }
};

export const deleteProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await deleteProject(paramId(req));

    if (!result.degraded) {
      res.status(200).json({ message: "Project deleted", data: result });
      return;
    }

    res.status(200).json({ message: "Project deleted (degraded - memory)", data: result });
  } catch (err: unknown) {
    next(err);
  }
};
