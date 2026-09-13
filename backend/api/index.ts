import type { Request, Response } from "express";
import { createApp } from "../src/app";
import { connectDB } from "../src/config/db";

// Initialize the Express app once per serverless instance.
const app = createApp();

let dbConnectPromise: Promise<void> | null = null;

// Connect to database on cold start (handled gracefully - won't block if DB is unavailable).
// Health endpoints report "degraded" until the connection is established.
function connectToDatabase(): void {
  if (dbConnectPromise) return;
  dbConnectPromise = connectDB()
    .then(() => {
      console.log("[vercel] Database connected successfully");
    })
    .catch((error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[vercel] DB connection failed - running in degraded mode: ${msg}`);
    });
}

connectToDatabase();

// Export the Express app as a serverless function handler.
// Vercel will invoke this handler for each request.
// NOTE: do NOT call app.listen() here - that would create a TCP listener that keeps
// the serverless process alive and triggers FUNCTION_INVOCATION_FAILED timeouts.
export default function handler(req: Request, res: Response) {
  return app(req, res);
}