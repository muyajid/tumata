import Joi from "joi";

export interface CreateLoanReq {
  userId: string;
  unitId: string;
  purpose: string;
  borrowedDate: string;
  returnDate: string;
}
export type CreateLoanRes = LoanActionRes;

export type LoanStatus =
  | "Menunggu"
  | "Disetujui"
  | "Ditolak"
  | "Dipinjam"
  | "Dikembalikan"
  | "Dibatalkan"
  | "Terlambat";

export interface GetLoanReq {
  limit: number;
  page: number;
  search?: string;
  dateType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LoanRes {
  id: string;
  code: string;

  user: {
    username: string;
    phone: string;
    email: string;
  };

  unitCode: string;
  unitImgUrl?: string | null;
  itemName: string;
  locationName?: string;
  departmentName?: string;

  borrowedDate: string;
  returnDate: string;
  actualReturnDate?: string | null;

  purpose?: string;

  reviewedBy?: string | null;
  reviewedAt?: string | null;

  handedOverBy?: string | null;
  handedOverAt?: string | null;

  returnCheckedBy?: string | null;
  returnCheckedAt?: string | null;

  rejectedReason?: string | null;
  returnImages?: string[] | null;

  status: LoanStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface GetLoanRes {
  data: LoanRes[];
  pagination: {
    page: number;
    nextPage: number | null;
    limit: number;
    skip: number;
    total: number;
    totalPages: number;
  };
}

export interface LoanActionReq {
  id: string;
  adminId: string;
}

export interface LoanActionRes {
  code: string;
  status: LoanStatus;
}

export const postLoanSchema = Joi.object({
  userId: Joi.string().uuid().optional().messages({
    "string.guid": "Id pengguna tidak valid",
  }),
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

export const rejectLoanSchema = Joi.object({
  reason: Joi.string().max(255).required().messages({
    "string.empty": "Alasan penolakan tidak boleh kosong",
    "string.max": "Alasan penolakan maksimal 255 karakter",
    "any.required": "Alasan penolakan wajib diisi",
  }),
});
