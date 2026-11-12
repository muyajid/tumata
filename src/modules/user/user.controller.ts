import { Request, Response } from "express";
import { asyncHandler } from "../../exceptions/async-handler.exception.js";
import { createUser } from "./user.service.js";

export const userCreate = asyncHandler(async (req: Request, res: Response) => {
  const result = await createUser(req.body);

  return res.status(201).json({
    success: true,
    message: "User created succesfully",
    data: result,
  })
  
});
