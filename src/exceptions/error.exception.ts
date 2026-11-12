class AppError extends Error {
  public statusCode: number;
  public error: unknown;

  constructor(statusCode: number, message: string, error: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const isAppEror = (err: any): boolean => {
  return err instanceof AppError;
};

export const createError = (
  statusCode: number,
  message: string,
  error: unknown = null,
) => {
  return new AppError(statusCode, message, error);
};