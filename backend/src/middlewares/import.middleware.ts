import multer, { memoryStorage } from "multer";
import logger from "../configs/logger";
import { createError } from "../exceptions/error.exception";

const createUploader = (
  allowedTypes: string[],
  errorMessage: string,
  maxSize?: number,
) =>
  multer({
    storage: memoryStorage(),
    limits: {
      ...(maxSize && { fileSize: maxSize }),
    },
    fileFilter: (_, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn(
          { mimeType: file.mimetype },
          "Not allowed file type",
        );

        return cb(createError(400, errorMessage) as any);
      }

      cb(null, true);
    },
  });

export const importImage = createUploader(
  ["image/jpeg", "image/png"],
  "Format foto tidak valid. Gunakan JPG atau PNG.",
  2 * 1024 * 1024,
);

export const importXLSX = createUploader(
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  "Format file tidak valid. Gunakan XLSX.",
);