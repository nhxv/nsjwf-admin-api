import multer from "multer";

const imageStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const savePath = process.env.FILE_STORAGE;
    callback(null, savePath);
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
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
      // Raise exception here instead of silently ignore?
      callback(null, false);
    }
    callback(null, true);
  },
});
