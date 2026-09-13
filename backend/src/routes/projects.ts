import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { projectSchema, hasNoSQLInjectionProject } from "../schemas/project";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { Project } from "../models/Project";
import { getConnectionState } from "../config/db";
import { env } from "../config/env";
import { uploadToCloudinary } from "../config/cloudinary";

const router = Router();

const projectsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 100,
  message: { error: "Too Many Requests", message: "Please try again later", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory fallback for test/degraded mode when DB not connected
const inMemoryProjects: Array<Record<string, unknown> & { _id: string; createdAt: string }> = [];

// Multer memory storage for Cloudinary (ephemeral FS safe, no local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for projects"));
    }
  },
});

const checkAdminSecret = (req: Request, res: Response, next: NextFunction): void => {
  const headerSecret: string | undefined = req.headers["x-admin-secret"] as string | undefined;
  const authHeader: string | undefined = req.headers.authorization as string | undefined;
  const bearerSecret: string | undefined = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const provided: string | undefined = headerSecret ?? bearerSecret;
  // Prioritize process.env for test overrides, then env config
  const expected: string = process.env.ADMIN_SECRET ?? env.ADMIN_SECRET ?? "";

  if (!expected) {
    console.error("[projects] ADMIN_SECRET not configured");
    res.status(500).json({ error: "Server Misconfiguration", message: "Admin secret not set", statusCode: 500 });
    return;
  }

  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or missing admin secret", statusCode: 401 });
    return;
  }
  next();
};

router.get("/projects", projectsLimiter, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dbState: number = getConnectionState();
    if (dbState === 1) {
      try {
        const projects = await Project.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ data: projects });
        return;
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        console.error("[projects] DB fetch failed, fallback to memory:", msg);
      }
    }
    // Degraded / test fallback
    res.status(200).json({ data: [...inMemoryProjects].reverse() });
  } catch (err: unknown) {
    next(err);
  }
});

router.post(
  "/projects",
  projectsLimiter,
  checkAdminSecret,
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Handle file upload via Cloudinary if present, else use imageUrl from body
      let cloudinaryUrl: string | null = null;
      const file = (req as unknown as { file?: Express.Multer.File }).file;
      if (file) {
        try {
          const result = await uploadToCloudinary(file.buffer, {
            folder: "shenodev_projects",
            resourceType: "image",
          });
          cloudinaryUrl = result.secure_url;
          console.log(`[projects] Uploaded to Cloudinary: ${cloudinaryUrl}`);
        } catch (cloudErr: unknown) {
          const msg: string = cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
          console.error("[projects] Cloudinary upload failed:", msg);
          res.status(500).json({ error: "Upload Error", message: "Failed to upload image to Cloudinary", statusCode: 500 });
          return;
        }
      }

      // Merge cloudinary URL into body for validation (if file uploaded, use its URL)
      let parsedTechStack: unknown = req.body.techStack;
      if (typeof req.body.techStack === "string") {
        try {
          parsedTechStack = JSON.parse(req.body.techStack as string);
        } catch {
          // Keep as string to let zod validation fail with 400, not 500
          parsedTechStack = req.body.techStack;
        }
      }
      const bodyForValidation: Record<string, unknown> = {
        ...req.body,
        ...(cloudinaryUrl ? { imageUrl: cloudinaryUrl } : {}),
        techStack: parsedTechStack,
      };

      if (hasNoSQLInjectionProject(bodyForValidation as Record<string, unknown>) || hasInjectionAttempt(bodyForValidation as Record<string, unknown>)) {
        res.status(400).json({ error: "Validation Error", message: "Invalid payload detected", statusCode: 400 });
        return;
      }

      const parsed = projectSchema.safeParse(bodyForValidation);
      if (!parsed.success) {
        const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        res.status(400).json({ error: "Validation Error", message, statusCode: 400, issues: parsed.error.issues });
        return;
      }

      const purified = {
        title: purifyString(parsed.data.title),
        description: purifyString(parsed.data.description),
        imageUrl: purifyString(parsed.data.imageUrl),
        techStack: parsed.data.techStack.map((t: string) => purifyString(t)),
        demoUrl: purifyString(parsed.data.demoUrl ?? ""),
        githubUrl: purifyString(parsed.data.githubUrl ?? ""),
      };

    const injectionPattern = /\$where|__proto__|\$gt|\$ne/;
    if (injectionPattern.test(purified.title) || injectionPattern.test(purified.description)) {
      res.status(400).json({ error: "Validation Error", message: "Invalid content detected", statusCode: 400 });
      return;
    }

    const dbState: number = getConnectionState();
    if (dbState === 1) {
      try {
        const doc = await Project.create(purified);
        res.status(201).json({ message: "Project created", data: doc });
        return;
      } catch (dbErr: unknown) {
        const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[projects] DB create failed, fallback to memory:", msg);
        // Fall through to degraded
      }
    }

    // Fallback in-memory for test/degraded
    // NOTE: Email failure does NOT rollback DB — project is still created/queued.
    // Admin/DevOps can monitor Cloudinary upload status and email failures via logs,
    // and retry notifications via admin panel if needed.
    const memDoc = {
      _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...purified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    };
    inMemoryProjects.push(memDoc as never);
    res.status(201).json({ message: "Project created (degraded - memory)", data: memDoc });
  } catch (err: unknown) {
    next(err);
  }
});

// Test helper to clear memory store
export const _clearMemoryProjects = (): void => {
  inMemoryProjects.length = 0;
};

export default router;
