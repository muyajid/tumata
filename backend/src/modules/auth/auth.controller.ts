import { Request, Response } from "express";
import { asyncHandler } from "../../exceptions/async-handler.exception";
import { authCurrentUser, authLogin } from "./auth.service";
import { getUserPayload } from "../../utils/token.util";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authLogin(req.body);

  res.cookie("accessToken", result.accesToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Login berhasil",
    data: result,
  });
});

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getUserPayload(req).id;

    const result = await authCurrentUser(id);

    return res.status(200).json({
      succes: true,
      message: "User profile retrivied successfully",
      data: result,
    });
  },
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({ success: true, message: "Logout berhasil" });
});