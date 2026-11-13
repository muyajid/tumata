import { Request, Response } from "express";
import { asyncHandler } from "../../exceptions/async-handler.exception";
import { createUser, getUsers, importUser } from "./user.service";
import { createError } from "../../exceptions/error.exception";

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
