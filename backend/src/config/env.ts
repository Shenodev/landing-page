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
  ADMIN_SECRET: z.string().default("dev-admin-secret-change-in-prod"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Optional for production
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
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
