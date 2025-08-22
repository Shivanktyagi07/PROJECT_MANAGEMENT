class ApiError extends Error {
  constructor(
    statusCode,
    meaasge = "An error occurred",
    error = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // Assuming data is not needed for ApiError
    this.message = message;
    this.error = error;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
