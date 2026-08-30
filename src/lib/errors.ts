export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: ErrorCode = "INTERNAL_SERVER_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required to access this resource", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", details?: unknown) {
    super(`${resource} not found`, "NOT_FOUND", 404, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(message, "CONFLICT", 409, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request payload", details?: unknown) {
    super(message, "BAD_REQUEST", 400, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.", details?: unknown) {
    super(message, "TOO_MANY_REQUESTS", 429, details);
  }
}
