
export type ErrorCode =
// transport-level — used by the generic factories
    | "BAD_REQUEST"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "VALIDATION_FAILED"
    | "INTERNAL"
// domain-level — passed explicitly where the meaning is specific
    | "INVALID_CREDENTIALS"
    | "EMAIL_ALREADY_REGISTERED"
    | "POLL_NOT_FOUND"
    | "POLL_CLOSED"
    | "POLL_OPTION_NOT_FOUND"
    | "ALREADY_VOTED";

export class ApiError extends Error {
    //readonly is optional
    readonly statusCode: number;
    readonly code: ErrorCode;
    readonly details?: unknown;

    constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, new.target);
    }

    static badRequest(message = "Bad request", details?: unknown) {
        return new ApiError(400, "BAD_REQUEST", message, details);
    }
    static unauthorized(message = "Authentication required") {
        return new ApiError(401, "UNAUTHORIZED", message);
    }
    static forbidden(message = "You do not have access to this resource") {
        return new ApiError(403, "FORBIDDEN", message);
    }
    static notFound(message = "Resource not found") {
        return new ApiError(404, "NOT_FOUND", message);
    }
    static conflict(message = "Conflict", details?: unknown) {
        return new ApiError(409, "CONFLICT", message, details);
    }
    static validation(message = "Validation failed", details?: unknown) {
        return new ApiError(422, "VALIDATION_FAILED", message, details);
    }
    static internal(message = "Internal server error") {
        return new ApiError(500, "INTERNAL", message);
    }

    static pollNotFound(message = "Poll not found ") {
        return new ApiError(404, "POLL_NOT_FOUND", message);
    }
}
