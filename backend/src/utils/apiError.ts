class ApiError extends Error {
  public statusCode: number;
  public success: boolean;
  public errors?: any[];
  public data?: any;

  constructor(
    statusCode: number,
    message: string = "Something went wrong!",
    errors: any[] = [],
    stack: string = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Format error response
   * @returns Formatted error object
   */
  format() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      data: this.data,
      success: this.success,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined, // Show stack trace only in dev mode
    };
  }

  // Common error static methods
  static badRequest(message: string = "Bad Request", errors: any[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found") {
    return new ApiError(404, message);
  }

  static internalServer(message: string = "Internal Server Error") {
    return new ApiError(500, message);
  }
}

export { ApiError };