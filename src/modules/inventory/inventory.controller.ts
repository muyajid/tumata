import { asyncHandler } from "../../exceptions/async-handler.exception";
import { Request, Response } from "express";
import {
  createDepartment,
  createLocation,
  getDepartments,
  getLocations,
  patchDepartmentById,
  patchLocationById,
} from "./inventory.service";

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