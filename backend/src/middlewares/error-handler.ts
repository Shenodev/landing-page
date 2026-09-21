import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiError } from "../errors/api-error";

const ERROR_CODE_LABELS: Record<string, string> = {
  VALIDATION_ERROR: "Validation Error",
  UNAUTHORIZED: "Unauthorized",
  NOT_FOUND: "Not Found",
  MISCONFIGURATION: "Server Misconfiguration",
  UPLOAD_ERROR: "Upload Error",
};

const FILE_TYPE_PATTERNS: ReadonlyArray<RegExp> = [
  /Unsupported file type/i,
  /Only image files are allowed/i,
];

/** Minimal interface for reading properties off an arbitrary error value. */
interface ErrorLike {
  name?: string;
  message?: string;
  stack?: string;
  statusCode?: number;
  issues?: unknown[];
  errorCode?: string;
}

const toErrorLike = (err: unknown): ErrorLike =>
  err !== null && typeof err === "object" ? (err as ErrorLike) : { message: String(err) };

const isFileTypeRejection = (err: ErrorLike): boolean =>
  Boolean(err.message) && FILE_TYPE_PATTERNS.some((p) => p.test(err.message ?? ""));

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};

export const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const error: ErrorLike = toErrorLike(err);
  let statusCode: number = error.statusCode ?? 500;
  let errorCode: string | undefined = error.errorCode;
  let issues: unknown[] | undefined = error.issues;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    issues = err.issues.length > 0 ? err.issues : undefined;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    errorCode = "UPLOAD_ERROR";
  } else if (isFileTypeRejection(error)) {
    statusCode = 400;
    errorCode = "UPLOAD_ERROR";
  }

  const isProd: boolean = process.env.NODE_ENV === "production";
  // Never leak internals (stacks, DB strings, paths) to clients in production.
  const message: string =
    statusCode >= 500 && isProd ? "Internal Server Error" : (error.message ?? "Internal Server Error");

  const computeLabel = (): string => {
    if (statusCode >= 500) return "Internal Server Error";
    if (errorCode && ERROR_CODE_LABELS[errorCode]) return ERROR_CODE_LABELS[errorCode];
    if (error.name && error.name !== "Error") return error.name;
    return "Error";
  };

  // Server-side log keeps detail; client response below stays generic on 5xx.
  console.error(`[error] ${statusCode} - ${message}`, error.stack);

  res.status(statusCode).json({
    error: computeLabel(),
    message,
    statusCode,
    ...(issues ? { issues } : {}),
    ...(!isProd && error.stack ? { stack: error.stack } : {}),
  });
};