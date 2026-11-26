import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";
import logger from "../configs/logger.js";
import { createError } from "../exceptions/error.exception.js";

export const validate = (schema: ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.context?.label,
        message: d.message,
      }));

      logger.error({ errors }, "Validation failed");

      throw createError(400, "Data yang dikirim tidak valid", errors);
    }

    req.body = value;
    next();
  };
};