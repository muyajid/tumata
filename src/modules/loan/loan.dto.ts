import Joi from "joi";

export interface CreateLoanReq {
  userId: string;
  unitId: string;
  purpose: string;
  borrowedDate: string;
  returnDate: string;
}

type LoanStatus = "pending" | "borrowed" | "rejected" | "returned" | "overdue";

export interface CreateLoanRes {
  code: string;
  status: LoanStatus;
}

export const postLoanSchema = Joi.object({
  unitId: Joi.string().trim().required().messages({
    "string.empty": "Id unit tidak boleh kosong",
    "any.required": "Id unit wajib diisi",
  }),
  purpose: Joi.string().max(255).required().messages({
    "string.empty": "Tujuan meminjam tidak boleh kosong",
    "string.max": "Maksimal 255 karakter",
    "any.required": "Tujuan meminjam wajib diisi",
  }),
  borrowedDate: Joi.date().iso().required().messages({
    "date.base": "Format tanggal mulai pinjam tidak valid",
    "any.required": "Tanggal mulai pinjam wajib diisi",
  }),
  returnDate: Joi.date()
    .iso()
    .greater(Joi.ref("borrowedDate"))
    .required()
    .messages({
      "date.base": "Format tanggal pengembalian tidak valid",
      "date.greater": "Tanggal pengembalian harus setelah tanggal mulai pinjam",
      "any.required": "Tanggal pengembalian wajib diisi",
    }),
});
