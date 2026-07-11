export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorDetails?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, errorDetails?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
