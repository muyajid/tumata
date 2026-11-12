import { eq } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { users } from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import { comparePassword } from "../../utils/auth.util";
import { LoginReq, LoginRes } from "./auth.dto";
import { createAuthToken } from "../../utils/token.util";

export const authLogin = async (py: LoginReq): Promise<LoginRes> => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, py.username))
      .limit(1);

    if (!user) {
      throw createError(404, "User tidak ditemukan");
    }

    const isPasswordValid = await comparePassword(py.password, user.password);

    if (!isPasswordValid) {
      throw createError(401, "Password salah");
    }

    const accesToken = createAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      accesToken,
      role: user.role,
    };
  } catch (err: any) {
    logger.error(err, "Login error");
    throw err;
  }
};