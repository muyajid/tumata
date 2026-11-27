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
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(createError(401, "Token autentikasi dibutuhkan"));
    }

    const verif = verifAuthToken(token);

    if (!verif) {
      return next(
        createError(401, "Token autentikasi salah atau sudah kadaluwarsa"),
      );
    }

    req.user = verif;
    logger.info(`Welcome ${verif.username}`);

    next();
  } catch (err: any) {
    logger.error(err, "Error on auth middleware");
    return next(createError(401, "Token autentikasi tidak valid"));
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
