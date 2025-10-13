export class AppSuccess {
  constructor(
    statusCode = 200,
    data = null,
    pagination = null,
    filters = null
  ) {
    this.success = true;
    this.statusCode = statusCode;

    // Calculate results count safely
    this.results = Array.isArray(data) ? data.length : data ? 1 : 0;
    this.data = data;

    // Add pagination info if provided
    if (pagination) {
      this.pagination = pagination;
    }
    if (filters) {
      this.filters = filters;
    }
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

  // Static factory methods for common success responses
  static ok(data = null, pagination = null) {
    return new AppSuccess(200, data, pagination);
  }

  static created(data = null) {
    return new AppSuccess(201, data);
  }

  static noContent() {
    return new AppSuccess(204, null);
  }

  // Method to format response for API
  toResponse() {
    const response = {
      success: this.success,
      count: this.results,
    };

    // Include data if it exists
    if (this.data !== null && this.data !== undefined) {
      response.data = this.data;
    }

    // Include pagination if provided
    if (this.pagination) {
      response.pagination = this.pagination;
    }

    // Include filters if provided
    if (this.filters) {
      response.filters = this.filters;
    }

    // Development debugging info
    // if (process.env.NODE_ENV === "development") {
    //   if (this.timestamp) response.timestamp = this.timestamp;
    //   if (this.requestId) response.requestId = this.requestId;
    // }

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

  // Method for paginated responses
  static paginated(data, pagination, filters) {
    return new AppSuccess(200, data, pagination, filters);
  }
}
