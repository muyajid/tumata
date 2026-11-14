import Joi from "joi";

// --- Department and locations
export interface CreateDepartmentReq {
  name: string;
  code: string;
}

export interface CreateLocationReq {
  name: string;
  code: string;
  departmentId: string;
}

export interface DepartmentRes {
  id: string;
  name: string;
  code: string;
  locations?: LocationRes[];
}

export interface LocationRes {
  id: string;
  name: string;
  code: string;
  department?: DepartmentRes | null;
}

export interface PatchDepartmentReq {
  name?: string;
  code?: string;
}

export interface PatchLocationReq { 
  name?: string;
  code?: string;
}

export const postDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Nama jurusan minimal 2 karakter",
    "string.max": "Nama jurusan maksimal 100 karakter",
    "string.empty": "Nama jurusan tidak boleh kosong",
    "any.required": "Nama jurusan wajib diisi",
  }),
  code: Joi.string().min(2).max(20).required().messages({
    "string.min": "Kode jurusan minimal 2 karakter",
    "string.max": "Kode jurusan maksimal 20 karakter",
    "string.empty": "Kode jurusan tidak boleh kosong",
    "any.required": "Kode jurusan wajib diisi",
  }),
});

export const postLocationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Nama lokasi minimal 2 karakter",
    "string.max": "Nama lokasi maksimal 100 karakter",
    "string.empty": "Nama lokasi tidak boleh kosong",
    "any.required": "Nama lokasi wajib diisi",
  }),
  code: Joi.string().min(2).max(20).required().messages({
    "string.min": "Kode lokasi minimal 2 karakter",
    "string.max": "Kode lokasi maksimal 20 karakter",
    "string.empty": "Kode lokasi tidak boleh kosong",
    "any.required": "Kode lokasi wajib diisi",
  }),
  departmentId: Joi.string().required().messages({
    "string.empty": "Id lokasi tidak boleh kosong",
    "any.required": "Id lokasi wajib diisi",
  }),
});

export const patchDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    "string.min": "Nama jurusan minimal 2 karakter",
    "string.max": "Nama jurusan maksimal 100 karakter",
  }),
  code: Joi.string().min(2).max(20).messages({
    "string.min": "Kode jurusan minimal 2 karakter",
    "string.max": "Kode jurusan maksimal 20 karakter",
  }),
});

export const patchLocationSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    "string.min": "Nama lokasi minimal 2 karakter",
    "string.max": "Nama jurusan maksimal 100 karakter",
  }),
  code: Joi.string().min(2).max(20).messages({
    "string.min": "Kode lokasi minimal 2 karakter",
    "string.max": "Kode lokasi maksimal 20 karakter",
  }),
});