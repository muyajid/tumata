import logger from "../configs/logger";
import { createError } from "../exceptions/error.exception";
import { AuthRequest } from "../utils/auth.util";
import { NextFunction, Response } from "express";
import { verifAuthToken } from "../utils/token.util";
import { UserRole } from "../modules/user/user.dto";

export const authenticate = (
  req: AuthRequest,
  _: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return next(createError(400, "Token autentikasi dibutuhkan"));
    }

    if (!header?.startsWith("Bearer ")) {
      return next(
        createError(400, "Format token tidak valid gunakan Bearer <token>"),
      );
    }

    const bearer = header.split(" ")[1];

    if (!bearer) {
      return next(createError(400, "Token autentikasi dibutuhkan"));
    }

    const verif = verifAuthToken(bearer);

    if (!verif || verif == null) {
      return next(createError(400, "Token salah atau sudah kadaluwarsa"));
    }

    req.user = verif;
    logger.info(`Welcome ${verif.username}`);

    next();
  } catch (err: any) {
    logger.error(err, "Error on auth middleware");
    throw err;
  }
};

export const authorize = (...role: UserRole[]) => {
  return (req: AuthRequest, _: Response, next: NextFunction) => {
    const user = req.user;

    const isAllowed = role.includes(user.role);

    if (!isAllowed) {
      logger.error(
        { username: user.username, role: user.role },
        "Access denied: insufficient permissions",
      );
      return next(createError(403, "Akses ditolak"));
    }
    next();
  };
};
