import { asyncHandler } from "../../exceptions/async-handler.exception";
import { Request, Response } from "express";
import {
  createDepartment,
  createItem,
  createLocation,
  exportItem,
  getDepartments,
  getItemById,
  getItems,
  getLocations,
  importItem,
  patchDepartmentById,
  patchLocationById,
} from "./inventory.service";
import { createError } from "../../exceptions/error.exception";

// --- Department and locations
export const departmentCreate = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createDepartment(req.body);
    return res.status(201).json({
      success: true,
      message: "Department successfully created",
      data: result,
    });
  },
);

export const departmentGet = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getDepartments();
    return res.status(200).json({
      success: true,
      message: "Deparment and location retrivied successfully",
      data,
    });
  },
);

export const locationCreate = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createLocation(req.body);
    return res.status(201).json({
      success: true,
      message: "Location successfully created",
      data: result,
    });
  },
);

export const locationGet = asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.departmentId as string | undefined;

  const data = await getLocations(id);
  return res.status(200).json({
    success: true,
    message: "Location successfully retrivied",
    data,
  });
});

export const patchDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await patchDepartmentById(id as string, req.body);
    return res.status(200).json({
      success: true,
      message: "Succesfully updated",
      data: result,
    });
  },
);

export const patchLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await patchLocationById(id as string, req.body);
    return res.status(200).json({
      success: true,
      message: "Succesfully updated",
      data: result,
    });
  },
);

export const itemCreate = asyncHandler(async (req: Request, res: Response) => {
  const result = await createItem(req.body);
  return res.status(201).json({
    success: true,
    message: "Item succesfully created",
    data: result,
  });
});

export const itemGet = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.limit) || 1;

  const result = await getItems({
    limit,
    page,
  });
  return res.status(200).json({
    success: true,
    message: "Items retrivied successfully",
    data: result,
  });
});

export const itemByIdGet = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const result = await getItemById(id);
  return res.status(200).json({
    success: true,
    message: "Item retrivied successfully",
    data: result,
  });
});

export const itemImport = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file || !file.buffer) {
    throw createError(400, "File data barang wajib di upload");
  }

  const result = await importItem(file.buffer);
  return res.status(201).json({
    success: true,
    message: "Item data succesfully imported",
    data: result,
  });
});

export const itemExport = asyncHandler(async (req: Request, res: Response) => {
  const deptCode = req.query.departmentCode as string | undefined;
  const loctCode = req.query.locationCode as string | undefined;

  const data = await exportItem(deptCode, loctCode);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="data-barang.xlsx"',
  );

  res.send(data);
});