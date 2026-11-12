import { NextFunction, Request, Response } from "express";
import { isAppEror } from "./error.exception.js";
import logger from "../configs/logger.js";

export function errorHandler(
  err: any,
  _: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isAppEror(err)) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      error: err.error ?? null,
    });
  }

  logger.error({ err }, `[ERROR] Internal server error - ${err?.message}`);
  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
    error: null,
  });
}
