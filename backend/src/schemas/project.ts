import { z } from "zod";

const noNoSQLPattern = /^\$|\./;

const sanitizeField = (val: string): string => val.trim();

const urlOrEmpty = z
  .string()
  .trim()
  .max(500, "URL too long")
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Invalid URL")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v.trim() : ""));

export const projectSchema = z
  .object({
    title: z
      .string({ error: "Title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(100, "Title must be under 100 characters")
      .refine((v: string) => !noNoSQLPattern.test(v), "Invalid title")
      .transform(sanitizeField),
    description: z
      .string({ error: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be under 1000 characters")
      .transform(sanitizeField),
    imageUrl: urlOrEmpty,
    images: z
      .array(
        z.object({
          url: z.string().trim().max(500, "Image URL too long").refine((v) => /^https?:\/\/.+/.test(v), "Invalid image URL"),
          publicId: z.string().trim().max(500, "Image public ID too long").optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
        })
      )
      .max(10, "Too many images")
      .optional()
      .default([]),
    techStack: z.array(z.string().trim().min(1).max(30)).min(1, "At least one tech is required").max(20, "Too many techs"),
    demoUrl: urlOrEmpty,
    githubUrl: urlOrEmpty,
  })
  .superRefine((val, ctx) => {
    if (!val.imageUrl && !(val.images && val.images.length > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Image is required - provide imageUrl or upload at least one image",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;

export const hasNoSQLInjectionProject = (obj: Record<string, unknown>): boolean => {
  const check = (val: unknown): boolean => {
    if (val === null || typeof val !== "string") {
      if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) return val.some((v) => check(v));
        return Object.keys(val as Record<string, unknown>).some((k) => k.startsWith("$") || k.includes(".") || check((val as Record<string, unknown>)[k]));
      }
      return false;
    }
    return val.trim().startsWith("$") || val.includes("$where") || val.includes("__proto__");
  };
  return Object.keys(obj).some((k) => k.startsWith("$") || k.includes(".") || check(obj[k]));
};
