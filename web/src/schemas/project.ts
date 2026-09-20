import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .max(500, "URL too long")
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a valid http(s) URL or empty")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v.trim() : ""));

export const adminProjectSchema = z
  .object({
    adminSecret: z.string().trim().min(1, "Admin password is required").max(200, "Password too long"),
    title: z
      .string({ error: "Title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(100, "Title must be under 100 characters"),
    description: z
      .string({ error: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be under 1000 characters"),
    imageUrl: urlOrEmpty,
    techStackInput: z
      .string({ error: "Tech stack is required" })
      .trim()
      .min(1, "Add at least one technology (comma separated)")
      .max(500, "Tech stack too long"),
    demoUrl: urlOrEmpty,
    githubUrl: urlOrEmpty,
  })
  .superRefine((val, ctx) => {
    if (!val.imageUrl) {
      // imageUrl may be empty when files are uploaded — checked at submit time.
      // Keep schema-level pass; form adds "upload or URL required" error.
      return;
    }
    void ctx;
  });

export type AdminProjectInput = z.infer<typeof adminProjectSchema>;

export const parseTechStack = (raw: string): string[] =>
  raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

export const MAX_PROJECT_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
