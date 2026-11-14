import { eq, or } from "drizzle-orm";
import { db } from "../../configs/db.config";
import logger from "../../configs/logger";
import { departments, locations } from "../../db/schema";
import { createError } from "../../exceptions/error.exception";
import {
  CreateDepartmentReq,
  CreateLocationReq,
  DepartmentRes,
  LocationRes,
  PatchDepartmentReq,
  PatchLocationReq,
} from "./inventory.dto";

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