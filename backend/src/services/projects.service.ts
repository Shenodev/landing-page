import { projectSchema, hasNoSQLInjectionProject } from "../schemas/project";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { Project } from "../models/Project";
import { getConnectionState } from "../config/db";
import { uploadToCloudinary } from "./cloudinary.service";
import { ValidationError, UploadError } from "../errors/http-errors";
import { ErrorIssue } from "../errors/api-error";
import { ProjectImage, ProjectResult, ProjectSubmission } from "../dto/project";

// In-memory fallback for test/degraded mode when DB not connected
const inMemoryProjects: Array<Record<string, unknown> & { _id: string; createdAt: string }> = [];

const parseJsonField = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // Keep as string to let zod validation fail with 400, not 500
    return raw;
  }
};

export const listProjects = async (): Promise<unknown[]> => {
  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      return (await Project.find().sort({ createdAt: -1 }).lean()) as unknown[];
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[projects] DB fetch failed, fallback to memory:", msg);
    }
  }
  // Degraded / test fallback
  return [...inMemoryProjects].reverse();
};

export const createProject = async (body: unknown, files: Express.Multer.File[]): Promise<ProjectResult> => {
  // Handle multiple image uploads via Cloudinary if present
  const uploadedImages: ProjectImage[] = [];
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "shenodev_projects",
        resourceType: "image",
      });
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id });
      console.log(`[projects] Uploaded to Cloudinary: ${result.secure_url}`);
    } catch (cloudErr: unknown) {
      const msg: string = cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
      console.error("[projects] Cloudinary upload failed:", msg);
      throw new UploadError("Failed to upload image to Cloudinary");
    }
  }

  const raw: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;
  const parsedTechStack: unknown = parseJsonField(raw.techStack);
  const parsedImageBody: unknown = parseJsonField(raw.images);
  const bodyImages: Array<{ url: string; publicId?: string }> = Array.isArray(parsedImageBody) ? (parsedImageBody as Array<{ url: string; publicId?: string }>) : [];
  const images: Array<{ url: string; publicId?: string }> = uploadedImages.length ? uploadedImages : bodyImages;
  const imageUrl: string = String(raw.imageUrl ?? "").trim() || (images[0]?.url ?? "");

  const bodyForValidation: Record<string, unknown> = {
    ...raw,
    ...(images.length ? { images } : {}),
    imageUrl,
    techStack: parsedTechStack,
  };

  if (hasNoSQLInjectionProject(bodyForValidation) || hasInjectionAttempt(bodyForValidation)) {
    throw new ValidationError("Invalid payload detected");
  }

  const parsed = projectSchema.safeParse(bodyForValidation);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    const issues: ErrorIssue[] = parsed.error.issues.map((i) => ({ message: i.message, path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number") }));
    throw new ValidationError(message, issues);
  }

  const data = parsed.data;
  const purified: ProjectSubmission = {
    title: purifyString(data.title),
    description: purifyString(data.description),
    imageUrl: purifyString(data.imageUrl),
    images: data.images.map((im) => ({
      url: purifyString(im.url),
      publicId: purifyString(im.publicId ?? ""),
    })),
    techStack: data.techStack.map((t: string) => purifyString(t)),
    demoUrl: purifyString(data.demoUrl ?? ""),
    githubUrl: purifyString(data.githubUrl ?? ""),
  };

  const injectionPattern = /\$where|__proto__|\$gt|\$ne/;
  if (injectionPattern.test(purified.title) || injectionPattern.test(purified.description)) {
    throw new ValidationError("Invalid content detected");
  }

  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      const doc = await Project.create(purified);
      return { data: doc, degraded: false };
    } catch (dbErr: unknown) {
      const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[projects] DB create failed, fallback to memory:", msg);
      // Fall through to degraded
    }
  }

  // Fallback in-memory for test/degraded.
  // NOTE: Email failure does NOT rollback DB — project is still created/queued.
  const memDoc: Record<string, unknown> & { _id: string; createdAt: string } = {
    _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...purified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0,
  };
  inMemoryProjects.push(memDoc);
  return { data: memDoc, degraded: true };
};

// Test helper to clear memory store
export const _clearMemoryProjects = (): void => {
  inMemoryProjects.length = 0;
};