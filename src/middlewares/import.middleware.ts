import multer, { memoryStorage } from "multer";
import logger from "../configs/logger";
import { createError } from "../exceptions/error.exception";

let allowedType: string[];

export const importImage = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    allowedType = ["image/jpeg", "image/png"];

    if (!allowedType.includes(file.mimetype)) {
      logger.warn({ mimeType: file.mimetype }, "Not allowed file type");
      cb(
        createError(
          400,
          "Format foto tidak valid gunakan .jpg atau .png",
        ) as any,
        false,
      );
    } else {
      cb(null, true);
    }
  },
});

export const importXLSX = multer({
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => {
    allowedType = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedType.includes(file.mimetype)) {
      logger.warn({ mimeType: file.mimetype }, "Not allowed file type");
      cb(
        createError(400, "Format file tidak valid gunakan .xlsx") as any,
        false,
      );
    } else {
      cb(null, true);
    }
  },
});
