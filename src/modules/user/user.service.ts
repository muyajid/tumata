import { asc, count } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { users } from "../../db/schema/user.schema";
import { createError } from "../../exceptions/error.exception";
import { createUserPassword, hashPassword } from "../../utils/auth.util";
import { sendCredential } from "../mail/mail.service";
import { CreateUserReq, GetUserReq, GetUserRes, UserRes } from "./user.dto";

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

export const getUsers = async (py: GetUserReq): Promise<GetUserRes> => {
  try {
    const { limit, page } = py;

    const skip = (page - 1) * limit;

    const [data, totalData] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          role: users.role,
        })
        .from(users)
        .orderBy(asc(users.createdAt))
        .limit(limit)
        .offset(skip),

      db.select({ total: count() }).from(users),
    ]);

    const total = totalData[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      pagination: {
        page,
        nextPage: page < totalPages ? page + 1 : null,
        limit,
        skip,
        total,
        totalPages,
      },
    };
  } catch (err: any) {
    logger.error(err, "Get users error");
    throw err;
  }
};