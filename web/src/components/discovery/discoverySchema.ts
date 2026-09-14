import { z } from "zod";

export const BRAND_STATUS_OPTIONS = ["ready", "logo_only", "need_identity"] as const;
export const TARGET_PACKAGE_OPTIONS = ["corporate", "dashboard", "platform"] as const;

const optionalText = (max: number) => z.string().trim().max(max, `Must be under ${max} characters`);

export const discoverySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name required")
    .max(100, "Full name must be under 100 characters"),
  companyName: z
    .string()
    .trim()
    .min(2, "Company required")
    .max(150, "Company must be under 150 characters"),
  email: z.string().trim().email("Invalid email").max(200, "Email must be under 200 characters").toLowerCase(),
  phone: optionalText(60),
  businessDesc: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  targetAudience: optionalText(1000),
  competitors: optionalText(1000),
  brandStatus: z.enum(BRAND_STATUS_OPTIONS),
  references: optionalText(1000),
  dislikes: optionalText(1000),
  targetPackage: z.enum(TARGET_PACKAGE_OPTIONS),
  requiredFeatures: optionalText(1000),
  integrations: optionalText(1000),
  launchDate: optionalText(20),
  extraDetails: optionalText(500),
});

export type DiscoveryFormData = z.infer<typeof discoverySchema>;

export const PACKAGE_PRICES: Record<(typeof TARGET_PACKAGE_OPTIONS)[number], string> = {
  corporate: "10,000 EGP",
  dashboard: "25,000 EGP",
  platform: "45,000 EGP",
};