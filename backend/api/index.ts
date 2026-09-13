import type { Request, Response } from "express";
import { createApp } from "../src/app";
import { connectOnDemand } from "../src/config/db";

// Initialize the Express app once per serverless instance.
const app = createApp();

// Connect to the database on demand for every request (self-healing).
// If the previous attempt failed (wrong env, Atlas allowlist, cold start), the
// next request retries instead of staying degraded forever. connectOnDemand
// is bounded by connectDB's serverSelectionTimeoutMS (5s) and never blocks
// beyond that - failures fall back to the app's existing degraded mode.
export default async function handler(req: Request, res: Response): Promise<void> {
  await connectOnDemand();
  return app(req, res);
}