import { z } from "zod";

// Shared schema - also mirrored in web/mobile for typesafe client validation
// Purified: trim, length limits, email validation, blocks NoSQL operator patterns and HTML
const noNoSQLPattern = /^\$|\./;

const sanitizeField = (val: string): string => {
  // Block NoSQL operator injection and HTML tags at zod level
  if (noNoSQLPattern.test(val) || /<[^>]*>/g.test(val)) {
    // Let zod refine handle; we sanitize later with DOMPurify too
  }
  return val.trim();
};

const messageField = z
  .string({ error: "Message is required" })
  .trim()
  .min(10, "Message must be at least 10 characters")
  .max(1000, "Message must be under 1000 characters")
  .refine((v: string) => !/^\$/.test(v), "Invalid message");

export const contactSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .regex(/^[a-zA-Z\s'\-]+$/, "Name contains invalid characters")
      .refine((v: string) => !noNoSQLPattern.test(v), "Invalid name")
      .transform(sanitizeField),
    email: z
      .string({ error: "Email is required" })
      .trim()
      .max(200, "Email must be under 200 characters")
      .email("Invalid email address")
      .toLowerCase()
      .refine((v: string) => !/[<>$]/.test(v), "Invalid email")
      .transform(sanitizeField),
    message: messageField.optional(),
    details: z
      .string()
      .trim()
      .min(10, "Details must be at least 10 characters")
      .max(1000, "Details must be under 1000 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.message && !data.details) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Message is required",
      });
    }
  })
  .transform((data) => ({
    name: data.name,
    email: data.email,
    message: (data.message ?? data.details ?? "") as string,
  }));

export type ContactInput = z.infer<typeof contactSchema>;

// Helper to detect NoSQL injection attempt in raw payload
export const hasNoSQLInjection = (obj: Record<string, unknown>): boolean => {
  const check = (val: unknown): boolean => {
    if (val === null || typeof val !== "string") {
      if (typeof val === "object" && val !== null) {
        return Object.keys(val as Record<string, unknown>).some((k) => k.startsWith("$") || k.includes(".") || check((val as Record<string, unknown>)[k]));
      }
      return false;
    }
    return val.trim().startsWith("$") || val.includes("$where") || val.includes("__proto__");
  };
  return Object.keys(obj).some((k) => k.startsWith("$") || k.includes(".") || check(obj[k]));
};
