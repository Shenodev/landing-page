import { Request, Response, NextFunction } from "express";
import { createProject, deleteProject, listProjects, updateProject } from "../services/projects.service";

export const getProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await listProjects();
    // Browser + CDN layer: public list is same for everyone, cache 30s in
    // browsers and 60s on shared caches, serve stale up to 5min on revalidate.
    res.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
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
