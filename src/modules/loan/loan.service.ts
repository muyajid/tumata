import {
  and,
  eq,
  gte,
  inArray,
  lte,
  sql,
  count,
  desc,
  or,
  ilike,
  lt,
} from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import {
  departments,
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
  LoanActionReq,
  LoanActionRes,
  LoanRes,
} from "./loan.dto";
import { alias } from "drizzle-orm/pg-core";
import { resolveLoanStatus } from "../../utils/loan.util";
import {
  buildImageURL,
  createImage,
  deleteImage,
} from "../image/image.service";

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

const assertUnitUsable = async (tx: any, id: string) => {
  const [unit] = await tx
    .select()
    .from(units)
    .where(eq(units.id, id))
    .for("update");

  if (!unit) throw createError(404, "Unit tidak ditemukan");
  if (unit.isArchived) throw createError(400, "Unit sudah diarsipkan");
  if (unit.status !== "Tersedia") {
    throw createError(400, "Unit sedang tidak tersedia");
  }
  return unit;
};

const assertUnitNotBorrowed = async (tx: any, unitId: string) => {
  const [stillBorrowed] = await tx
    .select({
      code: loans.code,
      username: users.username,
      returnDate: loans.returnDate,
    })
    .from(loans)
    .innerJoin(users, eq(loans.userId, users.id))
    .where(and(eq(loans.unitId, unitId), eq(loans.status, "Dipinjam")))
    .limit(1);

  if (stillBorrowed) {
    throw createError(409, "Unit masih dipinjam dan belum dikembalikan", {
      code: stillBorrowed.code,
      username: stillBorrowed.username,
      returnDate: stillBorrowed.returnDate.toISOString(),
    });
  }
};

export const createLoan = async (
  py: CreateLoanReq,
  isAdmin: boolean,
  adminId?: string,
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
      await assertUnitUsable(tx, py.unitId);

      const conflict = await tx.query.loans.findFirst({
        where: and(
          eq(loans.unitId, py.unitId),
          inArray(loans.status, ["Menunggu", "Dipinjam", "Disetujui"]),
          lte(loans.borrowedDate, dateReturned),
          gte(loans.returnDate, dateBorrowed),
        ),
      });

      if (conflict)
        throw createError(400, "Unit tidak tersedia pada waktu tersebut");
      if (isAdmin) await assertUnitNotBorrowed(tx, py.unitId);

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
          status: isAdmin ? "Dipinjam" : "Menunggu",
          handedOverBy: isAdmin ? adminId : undefined,
          handedOverAt: isAdmin ? new Date() : undefined,
          reviewedBy: isAdmin ? adminId : undefined,
          reviewedAt: isAdmin ? new Date() : undefined,
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
    const { limit, page, search, dateType, dateFrom, dateTo } = py;

    const dateColom =
      dateType == "return" ? loans.returnDate : loans.borrowedDate;
    const dateCondition = and(
      dateFrom ? gte(dateColom, new Date(dateFrom)) : undefined,

      dateTo
        ? lt(dateColom, new Date(new Date(dateTo).getTime() + 86400000))
        : undefined,
    );
    const skip = (page - 1) * limit;
    const whereCondition = and(
      search
        ? or(
            ilike(loans.code, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(items.name, `%${search}%`),
          )
        : undefined,
      userId ? eq(loans.userId, userId) : undefined,
      dateCondition,
    );

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
        .innerJoin(users, eq(loans.userId, users.id))
        .innerJoin(units, eq(loans.unitId, units.id))
        .innerJoin(items, eq(units.itemId, items.id))
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
    const reviewedByUser = alias(users, "reviewedByUser");
    const handedOverByUser = alias(users, "handedOverByUser");
    const returnCheckedByUser = alias(users, "returnCheckedByUser");

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
          unitImgUrl: units.imgUrl,
          itemName: items.name,
          locationName: locations.name,
          departmentName: departments.name,

          borrowedDate: loans.borrowedDate,
          returnDate: loans.returnDate,
          actualReturnDate: loans.actualReturnDate,

          purpose: loans.purpose,

          reviewedBy: reviewedByUser.username,
          reviewedAt: loans.reviewedAt,

          handedOverBy: handedOverByUser.username,
          handedOverAt: loans.handedOverAt,

          returnCheckedBy: returnCheckedByUser.username,
          returnCheckedAt: loans.returnCheckedAt,

          rejectedReason: loans.rejectedReason,

          status: loans.status,
          createdAt: loans.createdAt,
          updatedAt: loans.updatedAt,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .innerJoin(units, eq(loans.unitId, units.id))
        .innerJoin(items, eq(units.itemId, items.id))
        .innerJoin(locations, eq(items.locationId, locations.id))
        .innerJoin(departments, eq(locations.departmentId, departments.id))
        .leftJoin(reviewedByUser, eq(loans.reviewedBy, reviewedByUser.id))
        .leftJoin(handedOverByUser, eq(loans.handedOverBy, handedOverByUser.id))
        .leftJoin(
          returnCheckedByUser,
          eq(loans.returnCheckedBy, returnCheckedByUser.id),
        )
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
      unitImgUrl: buildImageURL(loan.unitImgUrl),
      borrowedDate: loan.borrowedDate.toISOString(),
      returnDate: loan.returnDate.toISOString(),
      actualReturnDate: loan.actualReturnDate?.toISOString() ?? null,
      reviewedAt: loan.reviewedAt?.toISOString() ?? null,
      handedOverAt: loan.handedOverAt?.toISOString() ?? null,
      returnCheckedAt: loan.returnCheckedAt?.toISOString() ?? null,
      rejectedReason: loan.rejectedReason ?? null,
      returnImages: images.map((image) => buildImageURL(image.imgUrl)!),
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
      status: resolveLoanStatus(loan.status, loan.returnDate),
    };
  } catch (err) {
    logger.error(err, "Get loan by id error");
    throw err;
  }
};

const getLoanForUpdate = async (tx: any, id: string) => {
  const [loan] = await tx
    .select()
    .from(loans)
    .where(eq(loans.id, id))
    .for("update");

  if (!loan) throw createError(404, "Peminjaman tidak ditemukan");
  return loan;
};

export const approveLoanById = async (
  py: LoanActionReq,
): Promise<LoanActionRes> => {
  try {
    const result = await db.transaction(async (tx) => {
      const loan = await getLoanForUpdate(tx, py.id);

      if (loan.status !== "Menunggu") {
        throw createError(
          400,
          "Hanya pengajuan berstatus Menunggu yang dapat disetujui",
        );
      }

      await assertUnitUsable(tx, loan.unitId);
      const [updated] = await tx
        .update(loans)
        .set({
          status: "Disetujui",
          reviewedBy: py.adminId,
          reviewedAt: new Date(),
        })
        .where(eq(loans.id, py.id))
        .returning({
          code: loans.code,
          status: loans.status,
          userId: loans.userId,
        });
      return updated;
    });
    logger.info(`Pengajuan disetujui notif dikirim ke user ${result.userId}`);
    return { code: result.code, status: result.status };
  } catch (err) {
    logger.error(err, "Approve loan by id error");
    throw err;
  }
};

export const rejectLoanById = async (
  py: LoanActionReq,
  reason: string,
): Promise<LoanActionRes> => {
  try {
    const result = await db.transaction(async (tx) => {
      const loan = await getLoanForUpdate(tx, py.id);

      if (loan.status !== "Menunggu") {
        throw createError(
          400,
          "Hanya pengajuan berstatus Menunggu yang dapat ditolak",
        );
      }
      const [updated] = await tx
        .update(loans)
        .set({
          status: "Ditolak",
          reviewedBy: py.adminId,
          reviewedAt: new Date(),
          rejectedReason: reason,
        })
        .where(eq(loans.id, py.id))
        .returning({
          code: loans.code,
          status: loans.status,
          userId: loans.userId,
        });
      return updated;
    });
    logger.info(`Pengajuan ditolak notif dikirim ke user ${result.userId}`);
    return { code: result.code, status: result.status };
  } catch (err) {
    logger.error(err, "Reject loan by id error");
    throw err;
  }
};

export const handOverLoanById = async (
  py: LoanActionReq,
): Promise<LoanActionRes> => {
  try {
    const result = await db.transaction(async (tx) => {
      const loan = await getLoanForUpdate(tx, py.id);

      if (loan.status !== "Disetujui") {
        throw createError(
          400,
          "Hanya peminjaman berstatus Disetujui yang dapat diserahkan",
        );
      }

      await assertUnitUsable(tx, loan.unitId);
      const [stillBorrowed] = await tx
        .select({
          code: loans.code,
          username: users.username,
          returnDate: loans.returnDate,
          status: loans.status,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .where(and(eq(loans.unitId, loan.unitId), eq(loans.status, "Dipinjam")))
        .limit(1);

      if (stillBorrowed) {
        throw createError(409, "Unit masih dipinjam dan belum dikembalikan", {
          code: stillBorrowed.code,
          username: stillBorrowed.username,
          returnDate: stillBorrowed.returnDate.toISOString(),
        });
      }

      const [updated] = await tx
        .update(loans)
        .set({
          status: "Dipinjam",
          handedOverBy: py.adminId,
          handedOverAt: new Date(),
        })
        .where(eq(loans.id, py.id))
        .returning({
          code: loans.code,
          status: loans.status,
          userId: loans.userId,
        });

      return updated;
    });

    logger.info(`Barang diserahkan, notif dikirim ke user ${result.userId}`);
    return { code: result.code, status: result.status };
  } catch (err) {
    logger.error(err, "Hand over loan by id error");
    throw err;
  }
};

export const cancelLoanById = async (
  loanId: string,
  userId: string,
): Promise<LoanActionRes> => {
  try {
    return await db.transaction(async (tx) => {
      const loan = await getLoanForUpdate(tx, loanId);

      if (loan.userId !== userId) {
        throw createError(404, "Peminjaman tidak ditemukan");
      }

      if (loan.status !== "Menunggu") {
        throw createError(
          400,
          "Hanya pengajuan berstatus Menunggu yang dapat dibatalkan",
        );
      }

      const [updated] = await tx
        .update(loans)
        .set({ status: "Dibatalkan" })
        .where(eq(loans.id, loanId))
        .returning({
          code: loans.code,
          status: loans.status,
        });

      return updated;
    });
  } catch (err) {
    logger.error(err, "Cancel loan by id error");
    throw err;
  }
};

export const returnLoanById = async (
  id: string,
  adminId: string,
  images: Buffer[],
) => {
  try {
    if (images.length < 1 || images.length > 3) {
      throw createError(400, "Foto kondisi barang minimal 1 dan maksimal 3");
    }

    return await db.transaction(async (tx) => {
      const loan = await getLoanForUpdate(tx, id);

      if (loan.status !== "Dipinjam") {
        throw createError(
          400,
          "Hanya peminjaman berstatus Dipinjam yang dapat dikonfirmasi pengembaliannya",
        );
      }

      const imageUrls = await Promise.all(
        images.map((img) => createImage(img)),
      );

      try {
        const [updated] = await tx
          .update(loans)
          .set({
            status: "Dikembalikan",
            actualReturnDate: new Date(),
            returnCheckedBy: adminId,
            returnCheckedAt: new Date(),
          })
          .where(eq(loans.id, id))
          .returning({
            code: loans.code,
            status: loans.status,
          });

        await tx.insert(returnImages).values(
          imageUrls.map((imgUrl) => ({
            loanId: id,
            imgUrl,
          })),
        );

        return updated;
      } catch (err) {
        await Promise.all(
          imageUrls.map((url) =>
            deleteImage(url).catch((cleanupErr) =>
              logger.error(
                { err: cleanupErr, url },
                "Cleanup return image error",
              ),
            ),
          ),
        );
        throw err;
      }
    });
  } catch (err) {
    logger.error(err, "Confirm return by id error");
    throw err;
  }
};
