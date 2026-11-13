import { Request, Response } from "express";
import { asyncHandler } from "../../exceptions/async-handler.exception";
import {
  createUser,
  exportUsers,
  getUsers,
  importUser,
  patchUserById,
  putRoleById,
} from "./user.service";
import { createError } from "../../exceptions/error.exception";
import { UserRole } from "./user.dto";
import { getUserPayload } from "../../utils/token.util";

export const userCreate = asyncHandler(async (req: Request, res: Response) => {
  const result = await createUser(req.body);

  return res.status(201).json({
    success: true,
    message: "User created succesfully",
    data: result,
  });
});

export const userGet = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const result = await getUsers({ limit, page });
  return res.status(200).json({
    success: true,
    message: "User data retrivied successfully",
    data: result,
  });
});

export const userImport = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file || !file.buffer) {
    throw createError(400, "File data pengguna wajib di upload");
  }

  const result = await importUser(file.buffer);
  return res.status(201).json({
    success: true,
    message: "User data imported successfully",
    data: result,
  });
});

export const userExport = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as UserRole | undefined;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="datapengguna.xlsx"',
  );

  const file = await exportUsers(role);
  return res.send(file);
});

export const userPatch = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await patchUserById({
    id,
    ...req.body,
  });
  return res.status(200).json({
    success: true,
    message: "Successfully updated",
    data: result,
  });
});

export const userPutRole = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = getUserPayload(req);
    const id = String(req.params.id);

    if (currentUser.id === id)
      throw createError(403, "You cannot change your own role");

    const { role } = req.body;
    const result = await putRoleById(role, id);

    return res.status(200).json({
      success: true,
      message: "Role successfully updated",
      data: result,
    });
  },
);