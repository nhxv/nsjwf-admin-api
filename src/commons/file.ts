import createError from "http-errors";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";

const imageStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const savePath = process.env.FILE_STORAGE;
    callback(null, savePath);
  },
  filename: (req, file, callback) => {
    // Temporary name only; services move the file to its final path.
    // Unique so concurrent uploads with the same original name don't overwrite each other.
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});
export const imageReceiver = multer({
  storage: imageStorage,
  limits: {
    files: 1,
    // fileSize: 1000000000,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new createError.BadRequest("Attachment must be an image."));
    }
    callback(null, true);
  },
});
