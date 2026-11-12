import { NextFunction, Request, Response } from "express";
import logger from "../configs/logger";

export const requestLogMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  logger.info(
    {
      endpoint: `${req.method} ${req.originalUrl}`,
      body: req.body,
    },
    "incoming request",
  );

  next();
};