import { db } from "../../configs/db.config.js";
import logger from "../../configs/logger.js";
import { users } from "../../db/schema.js";
import { createError } from "../../exceptions/error.exception.js";
import { createUserPassword, hashPassword } from "../../utils/auth.util.js";
import { sendCredential } from "../mail/mail.service.js";
import { CreateUserReq, UserRes } from "./user.dto.js";

export const createUser = async (py: CreateUserReq): Promise<UserRes> => {
  try {
    const isExist = await db.query.users.findFirst({
      where: (users, { or, eq }) =>
        or(
          eq(users.username, py.username),
          eq(users.email, py.email),
          eq(users.phone, py.phone),
        ),
    });

    if (isExist) {
      const duplicateFields = [
        isExist.username === py.username && {
          field: "username",
          error: "Username sudah terdaftar",
        },
        isExist.email === py.email && {
          field: "email",
          error: "Email sudah terdaftar",
        },
        isExist.phone === py.phone && {
          field: "phone",
          error: "Nomor HP sudah terdaftar",
        },
      ].filter(Boolean);

      throw createError(409, "User sudah terdaftar", duplicateFields);
    }

    const password: string = createUserPassword();

    const [user] = await db
      .insert(users)
      .values({
        username: py.username,
        email: py.email,
        phone: py.phone,
        role: py.role,
        password: await hashPassword(password),
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    await sendCredential({
      to: py.email,
      password,
      username: py.username,
    });

    return user;
  } catch (err: any) {
    logger.error(err, "Create user error");
    throw err;
  }
};