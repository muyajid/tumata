import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { loanCounters, loans } from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import { CreateLoanReq, CreateLoanRes } from "./loan.dto";

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
