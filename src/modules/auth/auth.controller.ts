import { Request, Response } from "express";
import { asyncHandler } from "../../exceptions/async-handler.exception";
import { authLogin } from "./auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authLogin(req.body);

  return res.status(200).json({
    success: true,
    message: "Login berhasil",
    data: result,
  });
});
