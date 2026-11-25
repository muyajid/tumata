import { asyncHandler } from "../../exceptions/async-handler.exception";
import { Request, Response } from "express";
import { getUserPayload } from "../../utils/token.util";
import { createError } from "../../exceptions/error.exception";
import {
  approveLoanById,
  createLoan,
  getLoanById,
  getLoans,
  handOverLoanById,
  rejectLoanById,
} from "./loan.service";

export const loanCreate = asyncHandler(async (req: Request, res: Response) => {
  const user = getUserPayload(req);

  const isAdmin = user.role === "Super Admin" || user.role === "Admin";
  if (isAdmin && !req.body.userId) {
    throw createError(400, "Id pengguna yang ingin meminjam dibutuhkan");
  }

  const userId = isAdmin ? req.body.userId : user.id;

  const result = await createLoan(
    {
      ...req.body,
      userId,
    },
    isAdmin,
    user.id,
  );
  return res.status(201).json({
    success: true,
    message: "Loan created successfully",
    data: result,
  });
});

export const loanGet = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const { search, dateType, dateFrom, dateTo } = req.query;

  const user = getUserPayload(req);
  const userId =
    user.role == "Admin" || user.role == "Super Admin" ? undefined : user.id;

  const result = await getLoans(
    {
      limit,
      page,
      search: search as string,
      dateType: dateType as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    },
    userId,
  );
  return res.status(200).json({
    success: true,
    message: "Loan retrivied successfully",
    data: result.data,
    pagination: result.pagination,
  });
});

export const loanGetById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const user = getUserPayload(req);
  const userId = user.role == "User" ? user.id : undefined;

  const result = await getLoanById(id, userId);
  return res.status(200).json({
    success: true,
    message: "Loan retrivied successfully",
    data: result,
  });
});

export const loanApprove = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const admin = getUserPayload(req);

  const result = await approveLoanById({ id, adminId: admin.id });
  return res.status(200).json({
    success: true,
    message: "Loan approved successfully",
    data: result,
  });
});

export const loanReject = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const admin = getUserPayload(req);

  const result = await rejectLoanById(
    { id, adminId: admin.id },
    req.body.reason,
  );
  return res.status(200).json({
    success: true,
    message: "Loan rejected successfully",
    data: result,
  });
});

export const loanHandOver = asyncHandler(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const admin = getUserPayload(req);

    const result = await handOverLoanById({ id, adminId: admin.id });
    return res.status(200).json({
      success: true,
      message: "Unit has been handed ove",
      data: result,
    });
  },
);
