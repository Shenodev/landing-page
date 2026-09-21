import { z } from "zod";

const sanitizeField = (val: string): string => val.trim();

export const contactSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[a-zA-Z\s'\-]+$/, "Name contains invalid characters")
    .transform(sanitizeField),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .max(200, "Email must be under 200 characters")
    .email("Invalid email address")
    .toLowerCase()
    .transform(sanitizeField),
  details: z
    .string({ error: "Project details is required" })
    .trim()
    .min(10, "Details must be at least 10 characters")
    .max(1000, "Details must be under 1000 characters"),
  privacyConsent: z.literal(true, { error: "Please accept the privacy notice" }),
  ageConfirmed: z.literal(true, { error: "Please confirm you are 16 or older" }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactFormData = ContactInput;
