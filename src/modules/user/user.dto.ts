import Joi from "joi";

export type UserRole = "Super Admin" | "Admin" | "User";

export interface CreateUserReq {
  username: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface UserRes {
  id?: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface GetUserReq {
  limit: number;
  page: number;
}

export interface GetUserRes {
  data: UserRes[];
  pagination: {
    page: number;
    nextPage: number | null;
    limit: number;
    skip: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportUserRes {
  created: number;
  skipped: number;
  skippedUsers: UserRes[];
}

export interface PatchUserReq {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
}

export const postUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(100).required().messages({
    "string.base": "Username harus berupa teks",
    "string.empty": "Username tidak boleh kosong",
    "string.min": "Username minimal 3 karakter",
    "string.max": "Username maksimal 100 karakter",
    "any.required": "Username wajib diisi",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.base": "Email harus berupa teks",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Email harus menggunakan format email yang valid",
    "any.required": "Email wajib diisi",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^(?:\+62|62|0)[0-9]{8,13}$/)
    .required()
    .messages({
      "string.base": "Nomor telepon harus berupa teks",
      "string.empty": "Nomor telepon tidak boleh kosong",
      "string.pattern.base":
        "Nomor telepon harus menggunakan format nomor telepon yang valid",
      "any.required": "Nomor telepon wajib diisi",
    }),
  role: Joi.string().valid("Super Admin", "Admin", "User").required().messages({
    "any.only": "Role harus Super Admin, Admin atau User",
    "any.required": "Role wajib diisi",
  }),
});

export const patchUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(100).messages({
    "string.base": "Username harus berupa teks",
    "string.empty": "Username tidak boleh kosong",
    "string.min": "Username minimal 3 karakter",
    "string.max": "Username maksimal 100 karakter",
  }),
  email: Joi.string().trim().email().messages({
    "string.base": "Email harus berupa teks",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Email harus menggunakan format email yang valid",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^(?:\+62|62|0)[0-9]{8,13}$/)
    .messages({
      "string.base": "Nomor telepon harus berupa teks",
      "string.empty": "Nomor telepon tidak boleh kosong",
      "string.pattern.base":
        "Nomor telepon harus menggunakan format nomor telepon yang valid",
    }),
  role: Joi.string().valid("Super Admin", "Admin", "User").messages({
    "any.only": "Role harus Super Admin, Admin atau User",
  }),
});