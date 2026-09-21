import { z } from "zod";

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .max(200, "Email must be under 200 characters")
  .email("Invalid email address")
  .toLowerCase()
  .refine((v: string) => !/[<>$]/.test(v), "Invalid email");

export const unsubscribeSchema = z.object({
  email: emailField,
});

export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;

export const deletionRequestSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[a-zA-Z\s'\-]+$/, "Name contains invalid characters"),
  email: emailField,
  details: z
    .string()
    .trim()
    .max(1000, "Details must be under 1000 characters")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.trim() : "")),
});

export type DeletionRequestInput = z.infer<typeof deletionRequestSchema>;
