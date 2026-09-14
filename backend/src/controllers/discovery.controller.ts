import { Request, Response, NextFunction } from "express";
import { submitDiscovery } from "../services/discovery.service";

export const postDiscovery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // multer.fields() exposes req.files as Record<string, File[]> (or File[]), so flatten it.
    const uploadedFields = (req as unknown as { files?: Record<string, Express.Multer.File[]> | Express.Multer.File[] }).files;
    const files: Express.Multer.File[] = Array.isArray(uploadedFields)
      ? uploadedFields
      : uploadedFields
        ? Object.values(uploadedFields).flat()
        : [];

    const result = await submitDiscovery(req.body, files, req.ip ?? "");

    if (result.id !== undefined) {
      res.status(201).json({
        message: "Discovery submitted successfully",
        data: { id: result.id, ...result.data },
      });
      return;
    }

    res.status(201).json({
      message: "Discovery received (degraded - queued)",
      data: result.data,
      degraded: true,
    });
  } catch (err: unknown) {
    next(err);
  }
};