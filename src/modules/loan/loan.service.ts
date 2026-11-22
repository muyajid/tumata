import { and, eq, gte, inArray, lte, sql, count, desc } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { items, loanCounters, loans, units, users } from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import {
  CreateLoanReq,
  CreateLoanRes,
  GetLoanReq,
  GetLoanRes,
  LoanRes,
} from "./loan.dto";

const createLoanCode = async (tx: any): Promise<string> => {
  const year = new Date().getFullYear();

  const [counter] = await tx
    .insert(loanCounters)
    .values({
      year,
      lastNumber: 1,
    })
    .onConflictDoUpdate({
      target: loanCounters.year,
      set: {
        lastNumber: sql`${loanCounters.lastNumber} + 1`,
      },
    })
    .returning();

  const number = String(counter.lastNumber).padStart(5, "0");
  return `PJM.${year}.${number}`;
};

export const createLoan = async (
  py: CreateLoanReq,
  isAdmin: boolean,
): Promise<CreateLoanRes> => {
  try {
    const dateBorrowed = new Date(py.borrowedDate);
    const dateReturned = new Date(py.returnDate);

    if (dateBorrowed.setSeconds(0, 0) < new Date().setSeconds(0, 0)) {
      throw createError(
        400,
        "Tanggal mulai pinjam haru hari ini atau setelahnya",
      );
    }

    const loan = await db.transaction(async (tx) => {
      const [unit] = await tx
        .select()
        .from(units)
        .where(eq(units.id, py.unitId))
        .for("update");

      if (!unit) throw createError(404, "Unit tidak ditemukan");

      if (unit.status !== "Tersedia") {
        throw createError(400, "Unit sedang tidak tersedia");
      }
      if (unit.isArchived) throw createError(400, "Unit sudah diarsipkan");

      const conflict = await tx.query.loans.findFirst({
        where: and(
          eq(loans.unitId, py.unitId),
          inArray(loans.status, ["pending", "borrowed"]),
          lte(loans.borrowedDate, dateReturned),
          gte(loans.returnDate, dateBorrowed),
        ),
      });

      if (conflict)
        throw createError(400, "Unit tidak tersedia pada tanggal tersebut");

      const code = await createLoanCode(tx);

      const [created] = await tx
        .insert(loans)
        .values({
          code,
          userId: py.userId,
          unitId: py.unitId,
          purpose: py.purpose,
          borrowedDate: dateBorrowed,
          returnDate: dateReturned,
        })
        .returning({
          code: loans.code,
          status: loans.status,
        });
      return created;
    });

    if (!isAdmin) logger.info(`Sending notif to admin`);

    return loan;
  } catch (err) {
    logger.error(err, "Create loan error");
    throw err;
  }
};

export const getLoans = async (py: GetLoanReq): Promise<GetLoanRes> => {
  try {
    const { limit, page } = py;

    const skip = (page - 1) * limit;

    const [rows, totalData] = await Promise.all([
      db
        .select({
          id: loans.id,
          code: loans.code,
          user: {
            username: users.username,
            phone: users.phone,
            email: users.email,
          },
          unit: {
            code: units.code,
            imgUrl: units.imgUrl,
            itemName: items.name,
          },
          borrowedDate: loans.borrowedDate,
          returnDate: loans.returnDate,
          status: loans.status,
          createdAt: loans.createdAt,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .innerJoin(units, eq(loans.unitId, units.id))
        .innerJoin(items, eq(units.itemId, items.id))
        .limit(limit)
        .offset(skip)
        .orderBy(desc(loans.createdAt)),

      db.select({ total: count() }).from(loans),
    ]);

    const data: LoanRes[] = rows.map((r) => ({
      id: r.id,
      code: r.code,
      user: r.user,
      unit: {
        code: r.unit.code,
        imgUrl: r.unit.imgUrl ?? "",
        item: {
          name: r.unit.itemName,
        },
      },
      borrowedDate: r.borrowedDate.toISOString(),
      returnDate: r.returnDate.toISOString(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    const total = totalData[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        nextPage: page < totalPages ? page + 1 : null,
        limit,
        skip,
        total,
        totalPages,
      },
    };
  } catch (err) {
    logger.error(err, "Get loans error");
    throw err;
  }
};