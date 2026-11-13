import { ObjectSchema } from "joi";
import XLSX from "xlsx";
import { createError } from "../exceptions/error.exception";

export const parseXLSXToJson = <T>(source: string | Buffer): T[] => {
  const workbook =
    typeof source === "string"
      ? XLSX.readFile(source)
      : XLSX.read(source, { type: "buffer" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json<T>(sheet, {
    defval: "",
  });
};

export const validateRows = <T>(data: T[], schema: ObjectSchema): void => {
  const errors: string[] = [];

  data.forEach((item, index) => {
    const { error } = schema.validate(item, {
      abortEarly: false,
    });

    if (error) {
      error.details.forEach((detail) => {
        errors.push(`Baris ${index + 2}: Kolom ${detail.message}`);
      });
    }
  });

  if (errors.length > 0) {
    throw createError(400, "Validasi data pengguna gagal", errors);
  }
};

export const exporToXLSX = <T>(
  data: T[],
  sheetName: string = "Data pengguna",
): Buffer => {
  const workBook = XLSX.utils.book_new();
  const workSheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workBook, workSheet, sheetName);

  return XLSX.write(workBook, {
    type: "buffer",
    bookType: "xlsx",
  });
};
