import { ApiError, ErrorIssue } from "./api-error";

/** 400 - request payload failed type-safe validation or an injection guard. */
export class ValidationError extends ApiError {
  constructor(message: string, issues: ErrorIssue[] = []) {
    super(message, { statusCode: 400, errorCode: "VALIDATION_ERROR", issues });
    this.name = "ValidationError";
  }
}

/** 401 - missing or invalid credentials. */
export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, { statusCode: 401, errorCode: "UNAUTHORIZED" });
    this.name = "UnauthorizedError";
  }
}

/** 404 - the requested resource does not exist. */
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, { statusCode: 404, errorCode: "NOT_FOUND" });
    this.name = "NotFoundError";
  }
}

/** 500 - the server is running but is missing required configuration. */
export class MisconfigurationError extends ApiError {
  constructor(message: string) {
    super(message, { statusCode: 500, errorCode: "MISCONFIGURATION" });
    this.name = "MisconfigurationError";
  }
}

/** 500 - a third-party upload (e.g. Cloudinary) failed. */
export class UploadError extends ApiError {
  constructor(message: string) {
    super(message, { statusCode: 500, errorCode: "UPLOAD_ERROR" });
    this.name = "UploadError";
  }
}