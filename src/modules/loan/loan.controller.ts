import { asyncHandler } from "../../exceptions/async-handler.exception";
import { Request, Response } from "express";
import { getUserPayload } from "../../utils/token.util";
import { createError } from "../../exceptions/error.exception";
import { createLoan } from "./loan.service";

export const loanCreate = asyncHandler(async (req: Request, res: Response) => {
    const user = getUserPayload(req);

    const isAdmin = user.role === 'Super Admin' || user.role === 'Admin';
    if (isAdmin && !req.body.userId) {
        throw createError(400, 'Id pengguna yang ingin meminjam dibutuhkan');
    }

    const userId = isAdmin ? req.body.userId : user.id;
    
    const result = await createLoan({
        userId,
        ...req.body
    }, isAdmin);
    return res.status(201).json({
        success: true,
        message: "Loan created successfully",
        data: result
    });
})