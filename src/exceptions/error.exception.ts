import { MulterError } from "multer";
import logger from "../configs/logger";

class AppError extends Error {
  public statusCode: number;
  public errors: unknown;

  constructor(statusCode: number, message: string, errors: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const isAppEror = (err: any): boolean => {
  return err instanceof AppError;
};

export const isMulterError = (err: any): boolean => {
  return err instanceof MulterError;
}

export const createError = (
  statusCode: number,
  message: string,
  errors: unknown = null,
) => {
  return new AppError(statusCode, message, errors);
};