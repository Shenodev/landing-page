import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { MisconfigurationError, UnauthorizedError } from "../errors/http-errors";

/**
 * Guard middleware: require a valid ADMIN_SECRET via x-admin-secret header
 * or Authorization: Bearer <secret> before the handler executes.
 * Throws a MisconfigurationError (500) when the secret is not configured,
 * or an UnauthorizedError (401) when the provided value is missing/wrong.
 */
export const requireAdminSecret = (req: Request, _res: Response, next: NextFunction): void => {
  const headerSecret: string | undefined = req.headers["x-admin-secret"] as string | undefined;
  const authHeader: string | undefined = req.headers.authorization as string | undefined;
  const bearerSecret: string | undefined = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const provided: string | undefined = headerSecret ?? bearerSecret;
  // Prioritize process.env for test overrides, then env config
  const expected: string = process.env.ADMIN_SECRET ?? env.ADMIN_SECRET ?? "";

  if (!expected) {
    console.error("[projects] ADMIN_SECRET not configured");
    next(new MisconfigurationError("Admin secret not set"));
    return;
  }

  if (!provided || provided !== expected) {
    next(new UnauthorizedError("Invalid or missing admin secret"));
    return;
  }

  next();
};