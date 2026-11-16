import e from "express";
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

export interface CreateItemReq {
  name: string;
  departmentId: string;
  locationId: string;
  procurementYear: number;
  description?: string;
  quantity: number;
}

export interface ItemRes {
  id: string;
  code: string;
  name: string;
  department: DepartmentRes;
  location: LocationRes;
  procurementYear: number;
  description: string | null;
  quantity?: number;
  units?: UnitRes[];
  createdAt: string;
}

export interface CreateUnitReq {
  itemId: string;
  code: string;
}

export type UnitStatus = "Tersedia" | "Rusak" | "Dalam Perawatan";

export interface UnitRes {
  id: string;
  itemId?: string;
  code: string;
  status: UnitStatus;
  isArchived: boolean;
}

export interface GetItemReq {
  limit: number;
  page: number;
}

export interface GetItemRes {
  data: ItemRes[];
  pagination: {
    page: number;
    nextPage: number | null;
    limit: number;
    skip: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportReq {
  nama: string;
  jurusan: string;
  lokasi: string;
  pengadaan: number;
  deskripsi?: string;
  jumlah: number;
}

export interface SkippedItem {
  row: number;
  name: string;
  reason: string;
}

export interface ImportRes {
  totalData: number;
  created: number;
  skipped: number;
  skippedItem: SkippedItem[];
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

export const postItemSchema = Joi.object({
  name: Joi.string().min(3).max(200).required().messages({
    "string.min": "Nama barang minimal 3 karakter",
    "string.max": "Nama barang maksimal 200 karakter",
    "any.required": "Nama barang wajib diisi",
  }),
  departmentId: Joi.string().required().messages({
    "any.required": "Id jurusan wajib diisi",
  }),
  locationId: Joi.string().required().messages({
    "any.required": "Id lokasi wajib diisi",
  }),
  procurementYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required()
    .messages({
      "number.base": "Tahun pengadaan harus berupa angka",
      "number.integer": "Tahun pengadaan harus berupa bilangan bulat",
      "number.min": "Tahun pengadaan minimal 1900",
      "number.max": "Tahun pengadaan tidak boleh melebihi tahun ini",
      "any.required": "Tahun pengadaan wajib diisi",
    }),
  description: Joi.string().max(200).optional().messages({
    "string.max": "Deskripsi maksimal 200 karakter",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Jumlah barang harus berupa angka",
    "number.integer": "Jumlah barang harus berupa bilangan bulat",
    "number.min": "Jumlah barang minimal 1",
    "any.required": "Jumlah barang wajib diisi",
  }),
});

export const importItemSchema = Joi.object({
  nama: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "Nama barang wajib diisi",
    "string.min": "Nama barang minimal 3 karakter",
    "string.max": "Nama barang maksimal 200 karakter",
    "any.required": "Nama barang wajib diisi",
  }),
  jurusan: Joi.string().trim().required().messages({
    "string.empty": "Kode jurusan tidak boleh kosong",
    "any.required": "Kode jurusan wajib diisi"
  }),
  lokasi: Joi.string().trim().required().messages({
    "string.empty": "Kode lokasi tidak boleh kosong",
    "any.required": "Kode lokasi wajib diisi"
  }),
  pengadaan: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required()
    .messages({
      "number.base": "Tahun pengadaan harus berupa angka",
      "number.min": "Tahun pengadaan minimal 1900",
      "number.max": "Tahun pengadaan tidak boleh melebih tahun ini",
      "any.required": "Tahun pengadaan wajib diisi",
    }),
  deskripsi: Joi.string().max(200).allow("").messages({
    "string.max": "Deskripsi maksimal 200 karakter",
  }),
  jumlah: Joi.number().integer().min(1).required().messages({
    "number.base": "Jumlah unit harus berupa angka",
    "number.min": "Jumlah barang minimal 1",
    "any.required": "Jumlah barang wajib diisi",
  }),
});