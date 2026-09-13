import { z } from "zod";

const sanitizeField = (val: string): string => val.trim();

export const discoverySchema = z.object({
  fullName: z.string("Full name required").trim().min(2).max(100).regex(/^[a-zA-Z\s'\-]+$/).transform(sanitizeField),
  companyName: z.string("Company required").trim().min(2).max(100).transform(sanitizeField),
  email: z.string("Email required").trim().max(200).email().toLowerCase().transform(sanitizeField),
  phone: z.string().trim().max(30).regex(/^[\+\d\s\-\(\)]*$/).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  businessDesc: z.string("Business desc required").trim().min(10).max(2000).transform(sanitizeField),
  targetAudience: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  competitors: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  brandStatus: z.enum(["ready", "logo_only", "need_identity"]),
  references: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  dislikes: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  targetPackage: z.enum(["corporate", "dashboard", "platform"]),
  requiredFeatures: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  integrations: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  launchDate: z.string().optional().or(z.literal("")).refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid date" }).transform((v) => (v ? v.trim() : "")),
  extraDetails: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => (v ? sanitizeField(v) : "")),
  meetingDate: z.string().optional().or(z.literal("")),
  meetingTime: z.string().optional().or(z.literal("")),
  meetingUrl: z.string().optional().or(z.literal("")),
  calendlyEventUri: z.string().optional().or(z.literal("")),
});

export type DiscoveryInput = z.infer<typeof discoverySchema>;
