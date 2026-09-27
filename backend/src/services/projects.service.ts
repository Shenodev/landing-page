import mongoose from "mongoose";
import { projectSchema, hasNoSQLInjectionProject, type ProjectInput } from "../schemas/project";
import { purifyString, hasInjectionAttempt } from "../lib/sanitize";
import { hasValidFileSignature } from "../lib/security";
import { Project } from "../models/Project";
import { getConnectionState } from "../config/db";
import { env } from "../config/env";
import { deleteFromCloudinary, uploadToCloudinary } from "./cloudinary.service";
import { NotFoundError, ValidationError, UploadError, ServiceUnavailableError } from "../errors/http-errors";
import { ErrorIssue } from "../errors/api-error";
import { ProjectImage, ProjectResult, ProjectSubmission } from "../dto/project";

// In-memory fallback for test/degraded mode when DB not connected
const inMemoryProjects: Array<Record<string, unknown> & { _id: string; createdAt: string }> = [];

const ALLOWED_PROJECT_MIMES: readonly string[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const parseJsonField = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // Keep as string to let zod validation fail with 400, not 500
    return raw;
  }
};

const toErrorIssues = (issues: { message: string; path: (string | number | symbol)[] }[]): ErrorIssue[] =>
  issues.map((i) => ({
    message: i.message,
    path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number"),
  }));

/** Upload + magic-byte-verify image files to the shenoprojects folder. */
const uploadProjectImages = async (files: Express.Multer.File[]): Promise<ProjectImage[]> => {
  const uploaded: ProjectImage[] = [];
  for (const file of files) {
    // Magic-byte check: multer's mimetype comes from the client and is spoofable,
    // so verify actual file content before it ever reaches Cloudinary.
    if (!hasValidFileSignature(file.buffer, file.mimetype, ALLOWED_PROJECT_MIMES)) {
      throw new ValidationError("Invalid image file content detected");
    }
    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "shenoprojects",
        resourceType: "image",
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
      console.log(`[projects] Uploaded to Cloudinary: ${result.secure_url}`);
    } catch (cloudErr: unknown) {
      const msg: string = cloudErr instanceof Error ? cloudErr.message : String(cloudErr);
      console.error("[projects] Cloudinary upload failed:", msg);
      throw new UploadError("Failed to upload image to Cloudinary");
    }
  }
  return uploaded;
};

type AssembledBody = {
  uploadedImages: ProjectImage[];
  bodyForValidation: Record<string, unknown>;
};

/** Merge body + uploaded files into a full object ready for zod validation. */
const assembleBody = async (body: unknown, files: Express.Multer.File[]): Promise<AssembledBody> => {
  const uploadedImages: ProjectImage[] = await uploadProjectImages(files);
  const raw: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;
  const parsedTechStack: unknown = parseJsonField(raw.techStack);
  const parsedImageBody: unknown = parseJsonField(raw.images);
  const bodyImages: Array<{ url: string; publicId?: string }> = Array.isArray(parsedImageBody)
    ? (parsedImageBody as Array<{ url: string; publicId?: string }>)
    : [];
  const images: Array<{ url: string; publicId?: string }> = uploadedImages.length ? uploadedImages : bodyImages;
  const imageUrl: string = String(raw.imageUrl ?? "").trim() || (images[0]?.url ?? "");

  const bodyForValidation: Record<string, unknown> = {
    ...raw,
    ...(images.length ? { images } : {}),
    imageUrl,
    techStack: parsedTechStack,
  };
  return { uploadedImages, bodyForValidation };
};

/** Injection guards + zod validation + purification shared by create/update. */
const validateAndPurify = (bodyForValidation: Record<string, unknown>): ProjectSubmission => {
  if (hasNoSQLInjectionProject(bodyForValidation) || hasInjectionAttempt(bodyForValidation)) {
    throw new ValidationError("Invalid payload detected");
  }

  const parsed = projectSchema.safeParse(bodyForValidation);
  if (!parsed.success) {
    const message: string = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new ValidationError(message, toErrorIssues(parsed.error.issues));
  }

  const data: ProjectInput = parsed.data;
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
  return purified;
};

/** Fetch one project by id from DB or the memory fallback. Null when missing. */
const findProjectById = async (id: string): Promise<Record<string, unknown> | null> => {
  if (getConnectionState() === 1) {
    try {
      const doc = await Project.findById(id).lean();
      return (doc ?? null) as Record<string, unknown> | null;
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[projects] DB findById failed:", msg);
      return null;
    }
  }
  return inMemoryProjects.find((p) => p._id === id) ?? null;
};

const assertValidId = (id: string): void => {
  // Memory-fallback ids (mem_...) are valid in degraded mode; otherwise require ObjectId.
  if (id.startsWith("mem_")) return;
  if (!mongoose.isValidObjectId(id)) {
    throw new ValidationError("Invalid project id");
  }
};

/**
 * Whether reads may fall back to process memory when MongoDB is unreachable.
 *
 * True in development and test, where the in-memory store is the fixture the
 * suite writes to. False in production: a serverless instance boots with an
 * empty `inMemoryProjects`, so the fallback cannot return anything real. It
 * answered `200 {data: []}` and the portfolio silently went blank while the
 * deploy still looked healthy. Production reports the outage as a 503 instead.
 */
export const servesDegradedReads = (nodeEnv: string): boolean => nodeEnv !== "production";

/**
 * Guard for the in-memory write fallback.
 *
 * A write parked in per-instance memory returns a success response and then
 * disappears on the next cold start, so the operator sees a project they
 * believe is saved and is not. Dev and test keep the in-memory fixture; in
 * production a write that cannot reach MongoDB is reported as a 503.
 */
const assertDegradedWriteAllowed = (context: string, cause?: unknown): void => {
  if (servesDegradedReads(env.NODE_ENV)) return;
  throw new ServiceUnavailableError(`Cannot ${context} right now, please retry`, { cause });
};

export const listProjects = async (): Promise<unknown[]> => {
  // Caching happens in front of this function: the browser and the CDN (see the
  // Cache-Control header in the controller). There is no server-side cache here.
  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      return (await Project.find().sort({ createdAt: -1 }).lean()) as unknown[];
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      console.error("[projects] DB fetch failed:", msg);
      // A query that throws is a real failure, not a licence to invent an
      // empty portfolio. Report it so the CDN does not cache the outage.
      throw new ServiceUnavailableError("Projects are temporarily unavailable", { cause: err });
    }
  }

  if (!servesDegradedReads(env.NODE_ENV)) {
    throw new ServiceUnavailableError("Projects are temporarily unavailable");
  }

  // Degraded / test fallback
  return [...inMemoryProjects].reverse();
};

export const createProject = async (body: unknown, files: Express.Multer.File[]): Promise<ProjectResult> => {
  const { bodyForValidation } = await assembleBody(body, files);
  const purified: ProjectSubmission = validateAndPurify(bodyForValidation);

  const dbState: number = getConnectionState();
  if (dbState === 1) {
    try {
      const doc = await Project.create(purified);
      return { data: doc, degraded: false };
    } catch (dbErr: unknown) {
      const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[projects] DB create failed:", msg);
      assertDegradedWriteAllowed("create a project", dbErr);
    }
  }

  assertDegradedWriteAllowed("create a project");

  // Fallback in-memory for test/degraded.
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

export const updateProject = async (
  id: string,
  body: unknown,
  files: Express.Multer.File[]
): Promise<ProjectResult> => {
  assertValidId(id);
  const existing = await findProjectById(id);
  if (!existing) {
    throw new NotFoundError("Project not found");
  }

  const { uploadedImages, bodyForValidation } = await assembleBody(body, files);
  const raw: Record<string, unknown> = (body ?? {}) as Record<string, unknown>;

  // Partial update: fall back to stored values for anything not supplied.
  // New uploads replace images; an explicit images array replaces them;
  // otherwise the stored gallery is kept (so image stays required).
  const prevImages = (existing.images ?? []) as Array<{ url: string; publicId?: string }>;
  const hasExplicitImages: boolean =
    uploadedImages.length > 0 || (typeof raw.images !== "undefined" && String(raw.images ?? "").trim() !== "");
  const merged: Record<string, unknown> = {
    title: raw.title ?? existing.title,
    description: raw.description ?? existing.description,
    techStack: typeof raw.techStack === "undefined" ? existing.techStack : bodyForValidation.techStack,
    demoUrl: typeof raw.demoUrl === "undefined" ? (existing.demoUrl ?? "") : (bodyForValidation.demoUrl ?? ""),
    githubUrl: typeof raw.githubUrl === "undefined" ? (existing.githubUrl ?? "") : (bodyForValidation.githubUrl ?? ""),
    imageUrl: String(bodyForValidation.imageUrl ?? "").trim() || String(existing.imageUrl ?? ""),
    images: hasExplicitImages ? (bodyForValidation.images as Array<{ url: string; publicId?: string }>) : prevImages,
  };

  const purified: ProjectSubmission = validateAndPurify(merged);

  // Best-effort: remove replaced Cloudinary assets so storage doesn't leak.
  const oldIds: string[] = prevImages.map((im) => String(im.publicId ?? "")).filter(Boolean);
  const newIds: Set<string> = new Set(purified.images.map((im) => im.publicId).filter(Boolean));
  const orphaned: string[] = oldIds.filter((pid) => !newIds.has(pid));

  if (getConnectionState() === 1 && !String(id).startsWith("mem_")) {
    try {
      const doc = await Project.findByIdAndUpdate(id, purified, { new: true, runValidators: true }).lean();
      if (!doc) throw new NotFoundError("Project not found");
      for (const pid of orphaned) {
        await deleteFromCloudinary(pid);
      }
      return { data: doc, degraded: false };
    } catch (dbErr: unknown) {
      if (dbErr instanceof NotFoundError) throw dbErr;
      const msg: string = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[projects] DB update failed:", msg);
      throw dbErr instanceof Error ? dbErr : new Error(msg);
    }
  }

  // Memory fallback update
  assertDegradedWriteAllowed("update a project");
  const idx: number = inMemoryProjects.findIndex((p) => p._id === id);
  if (idx === -1) throw new NotFoundError("Project not found");
  inMemoryProjects[idx] = {
    ...inMemoryProjects[idx],
    ...purified,
    updatedAt: new Date().toISOString(),
  };
  return { data: inMemoryProjects[idx], degraded: true };
};

export const deleteProject = async (id: string): Promise<{ id: string; degraded: boolean }> => {
  assertValidId(id);
  const existing = await findProjectById(id);
  if (!existing) {
    throw new NotFoundError("Project not found");
  }
  const images = (existing.images ?? []) as Array<{ url: string; publicId?: string }>;

  if (getConnectionState() === 1 && !String(id).startsWith("mem_")) {
    const res = await Project.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      throw new NotFoundError("Project not found");
    }
    for (const im of images) {
      if (im.publicId) await deleteFromCloudinary(im.publicId);
    }
    return { id, degraded: false };
  }

  assertDegradedWriteAllowed("delete a project");
  const idx: number = inMemoryProjects.findIndex((p) => p._id === id);
  if (idx === -1) throw new NotFoundError("Project not found");
  inMemoryProjects.splice(idx, 1);
  return { id, degraded: true };
};

// Test helper to clear memory store
export const _clearMemoryProjects = (): void => {
  inMemoryProjects.length = 0;
};
