export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);

    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.isOperational = true; // Mark as operational error (trusted error)

    // Add error details if provided
    if (details) {
      this.details = details;
    }

    // Capture stack trace (excluding constructor call from it)
    Error.captureStackTrace(this, this.constructor);

    // Additional debugging info in development
    if (process.env.NODE_ENV === "development") {
      this.timestamp = new Date().toISOString();
      this.requestId = this.generateRequestId();
    }
  }

  // Generate unique request ID for debugging
  generateRequestId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Static factory methods for common errors
  static badRequest(msg = "Bad Request", details = null) {
    return new AppError(msg, 400, details);
  }

  static unauthorized(msg = "Unauthorized", details = null) {
    return new AppError(msg, 401, details);
  }

  static forbidden(msg = "Forbidden", details = null) {
    return new AppError(msg, 403, details);
  }

  static notFound(msg = "Resource not found", details = null) {
    return new AppError(msg, 404, details);
  }

  static conflict(msg = "Conflict occurred", details = null) {
    return new AppError(msg, 409, details);
  }

  static unprocessableEntity(msg = "Unprocessable Entity", details = null) {
    return new AppError(msg, 422, details);
  }

  static internalError(msg = "Internal Server Error", details = null) {
    return new AppError(msg, 500, details);
  }

  // Method to format response for API
  toResponse() {
    const response = {
      success: this.success,
      message: this.message,
    };

    // Create error object with status: "fail" and other error details
    const error = {
      statusCode: this.statusCode,
      isOperational: this.isOperational,
    };

    // Add development debugging info to error object
    if (process.env.NODE_ENV === "development") {
      // if (this.timestamp) error.timestamp = this.timestamp;
      // if (this.requestId) error.requestId = this.requestId;
      response.error = error;
    }

    // Include error details if provided
    if (this.details) {
      response.details = this.details;
    }

    // Include stack trace in development at root level
    if (process.env.NODE_ENV === "development" && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }

  // Method to send response via Express res object
  send(res) {
    // Add security headers
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    });

    return res.status(this.statusCode).json(this.toResponse());
  }

  // Method for validation errors with multiple field errors
  static validation(msg = "Validation Error", validationErrors = null) {
    return new AppError(msg, 422, validationErrors);
  }
}
