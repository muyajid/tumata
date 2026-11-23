import { and, eq, gte, inArray, lte, sql, count, desc } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import {
  items,
  loanCounters,
  loans,
  locations,
  returnImages,
  units,
  users,
} from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import {
  CreateLoanReq,
  CreateLoanRes,
  GetLoanReq,
  GetLoanRes,
  LoanRes,
} from "./loan.dto";
import { alias } from "drizzle-orm/pg-core";
import { resolveLoanStatus } from "../../utils/loan.util";

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
        "Waktu mulai pinjam haru hari ini atau setelahnya",
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
        throw createError(400, "Unit tidak tersedia pada waktu tersebut");

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

export const getLoans = async (
  py: GetLoanReq,
  userId?: string,
): Promise<GetLoanRes> => {
  try {
    const { limit, page } = py;

    const skip = (page - 1) * limit;
    const whereCondition = userId ? eq(loans.userId, userId) : undefined;

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

          unitCode: units.code,
          itemName: items.name,

          borrowedDate: loans.borrowedDate,
          returnDate: loans.returnDate,

          status: loans.status,
          createdAt: loans.createdAt,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .innerJoin(units, eq(loans.unitId, units.id))
        .innerJoin(items, eq(units.itemId, items.id))
        .where(whereCondition)
        .orderBy(desc(loans.createdAt))
        .limit(limit)
        .offset(skip),
      db
        .select({
          total: count(),
        })
        .from(loans)
        .where(whereCondition),
    ]);

    const data: LoanRes[] = rows.map((i) => ({
      id: i.id,
      code: i.code,

      user: i.user,
      unitCode: i.unitCode,
      itemName: i.itemName,

      borrowedDate: i.borrowedDate.toISOString(),
      returnDate: i.returnDate.toISOString(),
      status: resolveLoanStatus(i.status, i.returnDate),

      createdAt: i.createdAt.toISOString(),
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

export const getLoanById = async (
  id: string,
  userId?: string,
): Promise<LoanRes> => {
  try {
    const processedByUser = alias(users, "processedByUser");
    const checkedByUser = alias(users, "checkedByUser");

    const [loanRow, images] = await Promise.all([
      db
        .select({
          id: loans.id,
          code: loans.code,

          user: {
            username: users.username,
            phone: users.phone,
            email: users.email,
          },

          unitCode: units.code,
          itemName: items.name,
          locationName: locations.name,

          borrowedDate: loans.borrowedDate,
          returnDate: loans.returnDate,
          actualReturnDate: loans.actualReturnDate,

          purpose: loans.purpose,

          processedBy: {
            username: processedByUser.username,
          },

          checkedBy: {
            username: checkedByUser.username,
          },

          status: loans.status,
          createdAt: loans.createdAt,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .innerJoin(units, eq(loans.unitId, units.id))
        .innerJoin(items, eq(units.itemId, items.id))
        .innerJoin(locations, eq(items.locationId, locations.id))
        .leftJoin(processedByUser, eq(loans.processedBy, processedByUser.id))
        .leftJoin(checkedByUser, eq(loans.checkedBy, checkedByUser.id))
        .where(
          and(userId ? eq(loans.userId, userId) : undefined, eq(loans.id, id)),
        )
        .limit(1),
      db
        .select({ imgUrl: returnImages.imgUrl })
        .from(returnImages)
        .where(eq(returnImages.loanId, id)),
    ]);

    const loan = loanRow[0];

    if (!loan) {
      throw createError(404, "Peminjaman tidak ditemukan");
    }

    return {
      ...loan,
      borrowedDate: loan.borrowedDate.toISOString(),
      returnDate: loan.returnDate.toISOString(),
      actualReturnDate: loan.actualReturnDate?.toISOString() ?? undefined,
      createdAt: loan.createdAt.toISOString(),
      status: resolveLoanStatus(loan.status, loan.returnDate),
      returnImages: images.map((image) => image.imgUrl),
    };
  } catch (err) {
    logger.error(err, "Get loan by id error");
    throw err;
  }
};
