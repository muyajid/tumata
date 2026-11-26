import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
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
  PatchUserReq,
  postUserSchema,
  SkippedUser,
  UserRes,
  UserRole,
} from "./user.dto";
import {
  exporToXLSX,
  parseXLSXToJson,
  RowError,
  validateRows,
} from "../../utils/xlsx.util";

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
    const { limit, page, search, role } = py;

    const whereCondition = and(
      search
        ? or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.phone, `%${search}%`),
          )
        : undefined,
      role ? eq(users.role, role) : undefined,
    );

    const skip = (page - 1) * limit;

    const [data, totalData] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(whereCondition)
        .orderBy(asc(users.createdAt))
        .limit(limit)
        .offset(skip),

      db.select({ total: count() }).from(users).where(whereCondition),
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
  const errors: RowError[] = [];

  const usernameMap = new Map<string, number>();
  const emailMap = new Map<string, number>();
  const phoneMap = new Map<string, number>();

  data.forEach((item, index) => {
    const row = index + 2;

    const username = item.username.trim().toLowerCase();
    const email = item.email.trim().toLowerCase();
    const phone = String(item.phone).trim();

    const usernameRow = usernameMap.get(username);
    const emailRow = emailMap.get(email);
    const phoneRow = phoneMap.get(phone);

    if (usernameRow)
      errors.push({
        row,
        field: "username",
        message: `Username duplikat dengan baris ${usernameRow}`,
      });
    else usernameMap.set(username, row);

    if (emailRow)
      errors.push({
        row,
        field: "email",
        message: `Email duplikat dengan baris ${emailRow}`,
      });
    else emailMap.set(email, row);

    if (phoneRow)
      errors.push({
        row,
        field: "phone",
        message: `Nomor HP duplikat dengan baris ${phoneRow}`,
      });
    else phoneMap.set(phone, row);
  });

  if (errors.length > 0) {
    throw createError(400, "Terdapat data duplikat dalam file", errors);
  }
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

const MAX_ROW = 100;

export const importUser = async (data: Buffer): Promise<ImportUserRes> => {
  try {
    const usersJson = parseXLSXToJson<CreateUserReq>(data);

    if (usersJson.length <= 0)
      throw createError(400, "File data pengguna kosong");
    if (usersJson.length > MAX_ROW) {
      throw createError(400, `Maksimal import ${MAX_ROW} data dalam satu file`);
    }
    const rows = validateRows<CreateUserReq>(usersJson, postUserSchema);
    checkDuplicateField(rows);

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
            rows.map((i) => i.username),
          ),
          inArray(
            users.email,
            rows.map((i) => i.email),
          ),
          inArray(
            users.phone,
            rows.map((i) => i.phone),
          ),
        ),
      );

    const existUsernames = new Set(existUsers.map((u) => u.username));
    const existEmails = new Set(existUsers.map((u) => u.email));
    const existPhones = new Set(existUsers.map((u) => u.phone));

    const skippedUsers: SkippedUser[] = [];
    const createdUsers: CreateUserReq[] = [];

    rows.forEach((user, index) => {
      const reasons: string[] = [];
      if (existUsernames.has(user.username.toLowerCase()))
        reasons.push("Username");
      if (existEmails.has(user.email.toLowerCase())) reasons.push("Email");
      if (existPhones.has(user.phone)) reasons.push("Nomor HP");

      if (reasons.length > 0) {
        skippedUsers.push({
          row: index + 2,
          username: user.username,
          reason: `${reasons.join(", ")} sudah terdaftar`,
        });
      } else {
        createdUsers.push(user);
      }
    });

    if (createdUsers.length > 0) {
      const preparedUsers = await prepareUsers(createdUsers);

      await db.insert(users).values(preparedUsers.map((i) => i.data));

      for (const i of preparedUsers) {
        await sendCredential({
          to: i.data.email,
          username: i.data.username,
          password: i.plainPassword,
        });
      }
    }
    return {
      totalData: rows.length,
      created: createdUsers.length,
      skipped: skippedUsers.length,
      skippedUsers: skippedUsers,
    };
  } catch (err: any) {
    logger.error(err, "Import user error");
    throw err;
  }
};

export const exportUsers = async (role?: UserRole): Promise<Buffer> => {
  try {
    const query = db
      .select({
        username: users.username,
        email: users.email,
        phone: users.phone,
        role: users.role,
      })
      .from(users);

    const data = role ? await query.where(eq(users.role, role)) : await query;

    const exportData = data.map((user, index) => ({
      no: index + 1,
      ...user,
    }));

    return exporToXLSX(exportData);
  } catch (err: any) {
    logger.error(err, "Export user error");
    throw err;
  }
};

export const patchUserById = async (py: PatchUserReq): Promise<UserRes> => {
  try {
    const [user] = await db
      .update(users)
      .set({ ...py })
      .where(eq(users.id, py.id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    if (!user) {
      throw createError(404, "Pengguna tidak ditemukan");
    }
    return user;
  } catch (err: any) {
    logger.error(err, "Patch user error");
    throw err;
  }
};

const setUserStatus = async (id: string, isActive: boolean) => {
  try {
    const [user] = await db
      .update(users)
      .set({
        isActive,
      })
      .where(eq(users.id, id))
      .returning({
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    if (!user) throw createError(404, "Pengguna tidak ditemukan");
    return user;
  } catch (err) {
    logger.error(err, "Set user status error");
    throw err;
  }
};

export const activateUser = async (id: string) => setUserStatus(id, true);
export const deactivateUser = async (id: string) => setUserStatus(id, false);
