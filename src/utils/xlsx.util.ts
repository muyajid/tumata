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

export const validateRows = <T>(data: T[], schema: ObjectSchema) => {
  data.forEach((item, index) => {
    const { error } = schema.validate(item);

    if (error) {
      throw createError(400, `Baris ke ${index + 2} ${error.message}`);
    }
  });
};