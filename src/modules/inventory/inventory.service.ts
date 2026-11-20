import { and, count, eq, or, sql } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { departments, items, locations, units } from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import {
  CreateDepartmentReq,
  CreateItemReq,
  CreateLocationReq,
  DepartmentRes,
  GetItemReq,
  GetItemRes,
  importItemSchema,
  ImportReq,
  ImportRes,
  ItemRes,
  LocationRes,
  PatchDepartmentReq,
  PatchItemReq,
  PatchLocationReq,
  SkippedItem,
  UnitRes,
} from "./inventory.dto";
import { createItemCode } from "../../utils/code.util";
import { createUnits } from "../../utils/unit.util";
import {
  exporToXLSX,
  parseXLSXToJson,
  validateRows,
} from "../../utils/xlsx.util";
import { createImage, updateImage } from "../image/image.service";

// --- Department and locations
export const createDepartment = async (
  py: CreateDepartmentReq,
): Promise<DepartmentRes> => {
  try {
    const isExist = await db.query.departments.findFirst({
      where: (departments, { or, eq }) =>
        or(eq(departments.name, py.name), eq(departments.code, py.code)),
    });

    if (isExist) {
      const duplicateFields = [
        isExist.name === py.name && {
          field: "name",
          error: "Nama jurusan sudah terdaftar",
        },
        isExist.code === py.code && {
          field: "code",
          error: "Code jurusan sudah terdaftar",
        },
      ].filter(Boolean);

      throw createError(409, "Jurusan sudah terdaftar", duplicateFields);
    }

    const [department] = await db
      .insert(departments)
      .values({
        name: py.name,
        code: py.code,
      })
      .returning({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      });
    return department;
  } catch (err: any) {
    logger.error(err, "Create department error");
    throw err;
  }
};

export const getDepartments = async () => {
  return await db.query.departments.findMany({
    columns: {
      id: true,
      name: true,
      code: true,
    },
    with: {
      locations: {
        columns: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
};

export const createLocation = async (
  py: CreateLocationReq,
): Promise<LocationRes> => {
  try {
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, py.departmentId),
      columns: {
        id: true,
      },
    });

    if (!department) {
      throw createError(404, "Department not found");
    }

    const isExist = await db.query.locations.findFirst({
      where: or(eq(locations.name, py.name), eq(locations.code, py.code)),
    });

    if (isExist) {
      const duplicateFields = [
        isExist.name === py.name && {
          field: "name",
          error: "Nama lokasi sudah terdaftar",
        },
        isExist.code === py.code && {
          field: "code",
          error: "Kode lokasi sudah terdaftar",
        },
      ].filter(Boolean);

      throw createError(409, "Location sudah terdaftar", duplicateFields);
    }

    const [location] = await db
      .insert(locations)
      .values({
        name: py.name,
        code: py.code,
        departmentId: py.departmentId,
      })
      .returning({
        id: locations.id,
        name: locations.name,
        code: locations.code,
        departmentId: locations.departmentId,
      });

    return location;
  } catch (err) {
    logger.error(err, "Create location error");
    throw err;
  }
};

export const getLocations = async (
  departmentId?: string,
): Promise<LocationRes[]> => {
  try {
    const query = db
      .select({
        id: locations.id,
        name: locations.name,
        code: locations.code,
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code,
        },
      })
      .from(locations)
      .leftJoin(departments, eq(locations.departmentId, departments.id));

    return departmentId
      ? await query.where(eq(locations.departmentId, departmentId))
      : await query;
  } catch (err) {
    logger.error(err, "Get locations error");
    throw err;
  }
};

export const patchDepartmentById = async (
  id: string,
  py: PatchDepartmentReq,
): Promise<DepartmentRes> => {
  try {
    const [department] = await db
      .update(departments)
      .set({ ...py })
      .where(eq(departments.id, id))
      .returning({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      });

    if (!department) throw createError(404, "Jurusan tidak ditemukan");
    return department;
  } catch (err) {
    logger.error(err, "Patch department error");
    throw err;
  }
};

export const patchLocationById = async (
  id: string,
  py: PatchLocationReq,
): Promise<LocationRes> => {
  try {
    const [location] = await db
      .update(locations)
      .set({ ...py })
      .where(eq(locations.id, id))
      .returning({
        id: locations.id,
        name: locations.name,
        code: locations.code,
      });

    if (!location) throw createError(404, "Lokasi tidak ditemukan");
    return location;
  } catch (err) {
    logger.error(err, "Patch location error");
    throw err;
  }
};
// --- Items and unit
export const insertItem = async (tx: any, data: CreateItemReq) => {
  const itemCode = createItemCode("WISKAR");

  const [item] = await tx
    .insert(items)
    .values({
      code: itemCode,
      name: data.name,
      departmentId: data.departmentId,
      locationId: data.locationId,
      procurementYear: data.procurementYear,
      description: data.description ?? null,
    })
    .returning();

  await tx.insert(units).values(createUnits(item.id, itemCode, data.quantity));

  return item;
};

export const createItem = async (py: CreateItemReq): Promise<ItemRes> => {
  try {
    const [department, location] = await Promise.all([
      db.query.departments.findFirst({
        where: eq(departments.id, py.departmentId),
      }),
      db.query.locations.findFirst({
        where: and(
          eq(locations.id, py.locationId),
          eq(locations.departmentId, py.departmentId),
        ),
      }),
    ]);

    const errors = [];
    if (!department) {
      errors.push({
        field: "departmentId",
        message: "Jurusan tidak ditemukan",
      });
    }
    if (!location) {
      errors.push({ field: "locationId", message: "Lokasi tidak ditemukan" });
    }

    if (errors.length > 0 || !department || !location) {
      throw createError(400, "Validasi gagal", errors);
    }

    return await db.transaction(async (tx) => {
      const item = await insertItem(tx, py);
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
        },
        location: {
          id: location.id,
          name: location.name,
          code: location.code,
        },
        procurementYear: item.procurementYear,
        description: item.description,
        quantity: py.quantity,
        createdAt: item.createdAt.toISOString(),
      };
    });
  } catch (err) {
    logger.error(err, "Create item error");
    throw err;
  }
};

export const getItems = async (py: GetItemReq): Promise<GetItemRes> => {
  try {
    const { limit, page } = py;
    const skip = (page - 1) * limit;

    const [data, totalData] = await Promise.all([
      db
        .select({
          id: items.id,
          code: items.code,
          name: items.name,
          department: {
            id: departments.id,
            name: departments.name,
            code: departments.code,
          },
          location: {
            id: locations.id,
            name: locations.name,
            code: locations.code,
          },
          procurementYear: items.procurementYear,
          description: items.description,
          quantity: sql<number>`(
            SELECT COUNT(*)::int
            FROM ${units}
            WHERE ${units.itemId} = ${items.id}
          )`,
          createdAt: items.createdAt,
        })
        .from(items)
        .innerJoin(departments, eq(items.departmentId, departments.id))
        .innerJoin(locations, eq(items.locationId, locations.id))
        .limit(limit)
        .offset(skip),

      db
        .select({
          total: count(),
        })
        .from(items),
    ]);

    const total = totalData[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
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
    logger.error(err, "Get item error");
    throw err;
  }
};

export const getItemById = async (id: string): Promise<ItemRes> => {
  try {
    const item = await db.query.items.findFirst({
      where: eq(items.id, id),
      columns: {
        id: true,
        code: true,
        name: true,
        procurementYear: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        department: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
        location: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
        units: {
          columns: {
            id: true,
            code: true,
            imgUrl: true,
            status: true,
            isArchived: true,
          },
        },
      },
    });

    if (!item) {
      throw createError(404, "Barang tidak ditemukan");
    }

    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  } catch (err) {
    logger.error(err, "Get item by id error");
    throw err;
  }
};

const MAX_ROW = 100;

export const importItem = async (data: Buffer): Promise<ImportRes> => {
  try {
    const itemJson = parseXLSXToJson<ImportReq>(data);

    if (itemJson.length <= 0) throw createError(400, "File data barang kosong");
    if (itemJson.length > MAX_ROW) {
      throw createError(400, `Maksimal import ${MAX_ROW} data dalam satu file`);
    }
    const rows = validateRows<ImportReq>(itemJson, importItemSchema);

    const [dept, loct] = await Promise.all([
      db
        .select({
          id: departments.id,
          code: departments.code,
        })
        .from(departments),
      db
        .select({
          id: locations.id,
          code: locations.code,
          departmentId: locations.departmentId,
        })
        .from(locations),
    ]);

    const deptMap = new Map(dept.map((i) => [i.code, i.id]));
    const loctMap = new Map(loct.map((i) => [i.code, i]));

    const created: CreateItemReq[] = [];
    const skipped: SkippedItem[] = [];

    for (const [i, row] of rows.entries()) {
      const deptId = deptMap.get(row.jurusan);
      const location = loctMap.get(row.lokasi);

      const reasons = [];
      if (!deptId) reasons.push("Kode jurusan");
      if (!location) {
        reasons.push("Kode lokasi");
      } else if (deptId && location.departmentId !== deptId) {
        reasons.push("Lokasi tidak sesuai dengan jurusan");
      }

      if (reasons.length > 0) {
        skipped.push({
          row: i + 2,
          name: row.nama,
          reason: `${reasons.join(" dan ")} tidak ditemukan`,
        });
        continue;
      }

      created.push({
        name: row.nama,
        departmentId: deptId!,
        locationId: location!.id,
        procurementYear: row.pengadaan,
        description: row.deskripsi,
        quantity: row.jumlah,
      });
    }

    if (created.length > 0) {
      await db.transaction(async (tx) => {
        for (const item of created) {
          await insertItem(tx, item);
        }
      });
    }

    return {
      totalData: rows.length,
      created: created.length,
      skipped: skipped.length,
      skippedItem: skipped,
    };
  } catch (err) {
    logger.error(err, "Import item error");
    throw err;
  }
};

export const exportItem = async (
  deptCode?: string,
  loctCode?: string,
): Promise<Buffer> => {
  try {
    const query = await db
      .select({
        code: items.code,
        name: items.name,
        department: departments.name,
        departmentCode: departments.code,
        location: locations.name,
        locationCode: locations.code,
        procurementYear: items.procurementYear,
        description: items.description,
        totalUnits: count(units.id),
      })
      .from(items)
      .innerJoin(departments, eq(items.departmentId, departments.id))
      .innerJoin(locations, eq(items.locationId, locations.id))
      .leftJoin(units, eq(units.itemId, items.id))
      .where(
        and(
          deptCode ? eq(departments.code, deptCode) : undefined,
          loctCode ? eq(locations.code, loctCode) : undefined,
        ),
      )
      .groupBy(
        items.id,
        departments.name,
        departments.code,
        locations.name,
        locations.code,
      );

    const data = query.map((item) => ({
      Kode: item.code,
      Nama: item.name,
      Jurusan: item.department,
      Kode_Jurusan: item.departmentCode,
      Lokasi: item.location,
      Kode_Lokasi: item.locationCode,
      Tahun_Pengadaan: item.procurementYear,
      Deskripsi: item.description ?? "",
      Jumlah_Unit: Number(item.totalUnits),
    }));

    return exporToXLSX(data, "Data Barang");
  } catch (err) {
    logger.error(err, "Export item error");
    throw err;
  }
};

export const patchItemById = async (id: string, py: PatchItemReq) => {
  try {
    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (!item) throw createError(400, "Barang tidak ditemukan");

    if (py.departmentId || py.locationId) {
      const deptId = py.departmentId ?? item.departmentId;
      const loctId = py.locationId ?? item.locationId;

      const [ref] = await db
        .select()
        .from(locations)
        .where(
          and(eq(locations.departmentId, deptId), eq(locations.id, loctId)),
        );

      if (!ref)
        throw createError(
          404,
          "Lokasi penyimpanan tidak sesuai dengan jurusan",
        );
    }
    const [updated] = await db
      .update(items)
      .set({
        ...py,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    return {
      ...py,
      updatedAt: updated.updatedAt,
    };
  } catch (err) {
    logger.error(err, "Patch item by id error");
    throw err;
  }
};

export const patchUnitImg = async (id: string, img: Buffer) => {
  try {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, id),
    });

    if (!unit) {
      throw createError(404, "Unit tidak ditemukan");
    }

    const imgUrl = unit.imgUrl
      ? await updateImage(img, unit.imgUrl)
      : await createImage(img);

    const [updatedUnit] = await db
      .update(units)
      .set({
        imgUrl,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning({
        imgUrl: units.imgUrl,
        updatedAt: units.updatedAt,
      });

    return updatedUnit;
  } catch (err) {
    logger.error(err, "Patch unit image error");
    throw err;
  }
};