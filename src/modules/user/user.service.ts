import { asc, count, inArray, or } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { users } from "../../db/schema/user.schema";
import { createError } from "../../exceptions/error.exception";
import { createUserPassword, hashPassword } from "../../utils/auth.util";
import { sendCredential } from "../mail/mail.service";
import {
  CreateUserReq,
  GetUserReq,
  GetUserRes,
  ImportUserRes,
  postUserSchema,
  UserRes,
} from "./user.dto";
import { parseXLSXToJson, validateRows } from "../../utils/xlsx.util";

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

const checkDuplicateField = (data: CreateUserReq[]) => {
  const usernameSet = new Set<String>();
  const emailSet = new Set<String>();
  const phoneSet = new Set<String>();

  data.forEach((item, index) => {
    if (usernameSet.has(item.username))
      throw createError(400, `Baris data ke ${index + 2} username duplikat`);
    if (emailSet.has(item.email))
      throw createError(400, `Baris data ke ${index + 2} email duplikat`);
    if (phoneSet.has(item.phone))
      throw createError(400, `Bari data ke ${index + 2} nomor hp duplikat`);

    usernameSet.add(item.username);
    emailSet.add(item.email);
    phoneSet.add(item.phone);
  });
};

const prepareUsers = async (data: CreateUserReq[]) => {
  const prepared = [];

  for (const item of data) {
    const plainPassword = createUserPassword();

    prepared.push({
      plainPassword,
      data: {
        username: item.username,
        email: item.email,
        phone: item.phone,
        password: await hashPassword(plainPassword),
        role: item.role,
      },
    });
  }

  return prepared;
};

export const importUser = async (data: Buffer): Promise<ImportUserRes> => {
  try {
    const usersJson = parseXLSXToJson<CreateUserReq>(data);

    if (usersJson.length <= 0)
      throw createError(400, "File data pengguna kosong");

    validateRows<CreateUserReq>(usersJson, postUserSchema);
    checkDuplicateField(usersJson);

    const existUsers = await db
      .select({
        username: users.username,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(
        or(
          inArray(
            users.username,
            usersJson.map((i) => i.username),
          ),
          inArray(
            users.email,
            usersJson.map((i) => i.email),
          ),
          inArray(
            users.phone,
            usersJson.map((i) => i.phone),
          ),
        ),
      );

    const existUsernames = new Set(existUsers.map((u) => u.username));
    const existEmails = new Set(existUsers.map((u) => u.email));
    const existPhones = new Set(existUsers.map((u) => u.phone));

    const skippedUsers: CreateUserReq[] = [];
    const createdUsers: CreateUserReq[] = [];

    for (const user of usersJson) {
      const isExist =
        existUsernames.has(user.username) ||
        existEmails.has(user.email) ||
        existPhones.has(user.phone);

      (isExist ? skippedUsers : createdUsers).push(user);
    }

    if (createdUsers.length === 0)
      throw createError(400, "Semua pengguna sudah terdaftar");

    const preparedUsers = await prepareUsers(createdUsers);

    await db.insert(users).values(preparedUsers.map((i) => i.data));

    for (const i of preparedUsers) {
      await sendCredential({
        to: i.data.email,
        username: i.data.username,
        password: i.plainPassword,
      });
    }

    return {
      created: createdUsers.length,
      skipped: skippedUsers.length,
      skippedUsers: skippedUsers,
    };
  } catch (err: any) {
    logger.error(err, "Import user error");
    throw err;
  }
};