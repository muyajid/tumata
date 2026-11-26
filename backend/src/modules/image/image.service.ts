import { randomInt } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import logger from "../../configs/logger.js";
import { createError } from "../../exceptions/error.exception.js";

const IMG_DIRECTORY = path.join(process.cwd(), "public", "images");

const validateImage = (buffer: Buffer): boolean => {
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const isPNG = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  return isJPEG || isPNG;
};

export const createImage = async (file: Buffer): Promise<string> => {
  try {
    if (!validateImage(file)) {
      throw createError(400, "Format gambar tidak valid");
    }

    const isPNG = file
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const extension = isPNG ? "png" : "jpg";
    const fileName = `${Date.now()}${randomInt(1000, 9999)}.${extension}`;
    const filePath = path.join(IMG_DIRECTORY, fileName);

    await fs.mkdir(IMG_DIRECTORY, { recursive: true });
    await fs.writeFile(filePath, file, { flag: "wx" });

    return `/images/${fileName}`;
  } catch (err) {
    logger.error({ err }, "Create image error");
    throw err;
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const fileName = path.basename(imageUrl);
    await fs.unlink(path.join(IMG_DIRECTORY, fileName));
  } catch (err) {
    logger.error({ err, imageUrl }, "Delete image error");
    throw err;
  }
};

export const updateImage = async (
  file: Buffer,
  old: string,
): Promise<string> => {
  const newImageUrl = await createImage(file);

  try {
    await deleteImage(old);
    return newImageUrl;
  } catch (err) {
    await deleteImage(newImageUrl).catch((cleanupError) => {
      logger.error(
        { err: cleanupError, imageUrl: newImageUrl },
        "Cleanup new image error",
      );
    });

    logger.error({ err }, "Update image error");
    throw err;
  }
};

export function buildImageURL(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = process.env.BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("BASE_URL belum diatur");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}