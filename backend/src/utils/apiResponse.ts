class ApiResponse<T = any> {
  public statusCode: number;
  public success: boolean;
  public message: string;
  public data: T | null;

  constructor(
    statusCode: number,
    message: string, 
    data: T | null = null
  ) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
  }

  /**
   * Formats the response for consistency
   */
  format() {
    return {
      statusCode: this.statusCode,
      success: this.success,
      message: this.message,
      data: this.data,
    };
  }

  static success<T>(message: string, data: T) {
    return new ApiResponse<T>(200, message, data);
  }

  static created<T>(message: string, data: T) {
    return new ApiResponse<T>(201, message, data);
  }
}

export { ApiResponse };