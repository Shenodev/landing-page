import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1000).max(65535).default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/shenodev"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:8081,https://shenodev.tech"),
  FRONTEND_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_SECRET: z.string().min(32, "ADMIN_SECRET must be >=32 chars in production"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Optional for production
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (data.ADMIN_SECRET === "dev-admin-secret-change-in-prod") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ADMIN_SECRET must be set to a secure value (>=32 chars) in production",
        path: ["ADMIN_SECRET"],
      });
    }
    if (!data.CLOUDINARY_CLOUD_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CLOUDINARY_CLOUD_NAME is required in production",
        path: ["CLOUDINARY_CLOUD_NAME"],
      });
    }
    if (!data.CLOUDINARY_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CLOUDINARY_API_KEY is required in production",
        path: ["CLOUDINARY_API_KEY"],
      });
    }
    if (!data.CLOUDINARY_API_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CLOUDINARY_API_SECRET is required in production",
        path: ["CLOUDINARY_API_SECRET"],
      });
    }
    if (!data.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RESEND_API_KEY is required in production",
        path: ["RESEND_API_KEY"],
      });
    }
    if (!data.FRONTEND_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FRONTEND_URL is required in production",
        path: ["FRONTEND_URL"],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env: Env = parsed.data;

// Production guard: disallow localhost fallback for Mongo in prod
if (env.NODE_ENV === "production" && env.MONGODB_URI.includes("localhost")) {
  console.warn("[env] WARNING: MONGODB_URI is localhost in production - ensure this is intentional");
}

export const allowedOrigins: string[] = [
  ...env.ALLOWED_ORIGINS.split(",")
    .map((o: string) => o.trim())
    .filter(Boolean),
  ...(env.FRONTEND_URL ? [env.FRONTEND_URL.trim()] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
].filter((v, i, a) => v && a.indexOf(v) === i);