import { NextFunction, Request, Response } from "express";
import { isAppEror, isMulterError } from "./error.exception.js";
import logger from "../configs/logger.js";

export function errorHandler(
  err: any,
  _: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isMulterError(err)) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "Ukuran file terlalu besar",
          errors: null,
        });
        
      default:
        return res.status(400).json({
          success: false,
          message: "Terjadi kesalahan saat mengunggah file",
          errors: null,
        });
    }
  }

  if (isAppEror(err)) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errors: err.errors ?? null,
    });
  }

  logger.error({ err }, `[ERROR] Internal server error - ${err?.message}`);
  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
    error: null,
  });
}
