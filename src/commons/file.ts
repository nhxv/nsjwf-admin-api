import multer from "multer";

const imageStorage = multer.diskStorage({
  // Destination is intentionally ignored so it saves to OS-designated temp folder.
  // On Linux it is /tmp
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
