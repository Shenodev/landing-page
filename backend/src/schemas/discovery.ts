import { z } from "zod";

const noNoSQLPattern = /^\$|\./;

const sanitizeField = (val: string): string => val.trim();

export const discoverySchema = z.object({
  fullName: z
    .string({ error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be under 100 characters")
    .regex(/^[a-zA-Z\s'\-]+$/, "Full name contains invalid characters")
    .refine((v: string) => !noNoSQLPattern.test(v), "Invalid fullName")
    .transform(sanitizeField),
  companyName: z
    .string({ error: "Company name is required" })
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be under 100 characters")
    .transform(sanitizeField),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .max(200, "Email must be under 200 characters")
    .email("Invalid email address")
    .toLowerCase()
    .refine((v: string) => !/[<>$]/.test(v), "Invalid email")
    .transform(sanitizeField),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be under 30 characters")
    .regex(/^[\+\d\s\-\(\)]*$/, "Invalid phone format")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? sanitizeField(v) : "")),
  businessDesc: z
    .string({ error: "Business description is required" })
    .trim()
    .min(10, "Business description must be at least 10 characters")
    .max(2000, "Business description must be under 2000 characters")
    .transform(sanitizeField),
  targetAudience: z.string().trim().max(1000, "Target audience must be under 1000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  competitors: z.string().trim().max(1000, "Competitors must be under 1000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  brandStatus: z.enum(["ready", "logo_only", "need_identity"], { error: "Invalid brand status" }),
  references: z.string().trim().max(1000, "References must be under 1000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  dislikes: z.string().trim().max(1000, "Dislikes must be under 1000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  targetPackage: z.enum(["corporate", "dashboard", "platform"], { error: "Invalid target package" }),
  requiredFeatures: z.string().trim().max(2000, "Required features must be under 2000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  integrations: z.string().trim().max(1000, "Integrations must be under 1000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  launchDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => {
        if (!v || v === "") return true;
        const d = new Date(v);
        return !isNaN(d.getTime());
      },
      { message: "Invalid launch date format" }
    )
    .transform((v) => (v ? v.trim() : "")),
  extraDetails: z.string().trim().max(2000, "Extra details must be under 2000").optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  meetingDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => {
        if (!v || v === "") return true;
        return !isNaN(Date.parse(v));
      },
      { message: "Invalid meeting date" }
    )
    .transform((v) => (v ? sanitizeField(v) : "")),
  meetingTime: z
    .string()
    .trim()
    .max(20, "Meeting time too long")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?[AP]M)?$/i, "Invalid meeting time")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? sanitizeField(v) : "")),
  meetingUrl: z.string().trim().max(500, "Meeting URL too long").url("Invalid meeting URL").optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
  calendlyEventUri: z.string().trim().max(500, "Calendly URI too long").optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
  calendlyEventUrl: z.string().trim().max(500, "Calendly URL too long").optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
  attachmentUrl: z.string().trim().max(500, "Attachment URL too long").optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
  attachmentPublicId: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v.trim() : "")),
});

export type DiscoveryInput = z.infer<typeof discoverySchema>;

export const hasNoSQLInjectionDiscovery = (obj: Record<string, unknown>): boolean => {
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
