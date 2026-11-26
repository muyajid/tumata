import logger from "../configs/logger";
import { UserRole } from "../modules/user/user.dto";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./auth.util";

interface UserPayload {
  id: string;
  username: string;
  role: UserRole;
}

const JWT_SECRET = String(process.env.JWT_SECRET);
const JWT_EXPIRE = process.env.JWT_EXPIRE;

export const createAuthToken = (payload: UserPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE as jwt.SignOptions["expiresIn"],
    });
  } catch (err: any) {
    logger.error(err, "Error during create auth token");
    throw err;
  }
};

export const verifAuthToken = (token: string): UserPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (err: any) {
    logger.error(err, "Error during verif auth token");
    return null;
  }
};

export const getUserPayload = (req: AuthRequest): UserPayload => {
  return req.user;
};