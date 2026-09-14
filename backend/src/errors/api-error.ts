/**
 * Base class for all operational API errors.
 *
 * `statusCode < 500` marks the error as operational (a known, expected client
 * failure such as validation or authorization). Errors with `statusCode >= 500`
 * are treated as unexpected by the centralized error handler, which hides
 * internals from the response in production.
 */
export interface ErrorIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<string | number>;
}

export interface ApiErrorOptions {
  statusCode?: number;
  errorCode?: string;
  issues?: ErrorIssue[];
  cause?: unknown;
}

export const INTERNAL_ERROR_CODE = "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly issues: ErrorIssue[];
  readonly isOperational: boolean;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options.statusCode ?? 500;
    this.errorCode = options.errorCode ?? INTERNAL_ERROR_CODE;
    this.issues = options.issues ?? [];
    this.isOperational = this.statusCode < 500;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}