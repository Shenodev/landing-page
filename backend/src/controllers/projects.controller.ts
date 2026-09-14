import { Request, Response, NextFunction } from "express";
import { listProjects, createProject } from "../services/projects.service";

export const getProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await listProjects();
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