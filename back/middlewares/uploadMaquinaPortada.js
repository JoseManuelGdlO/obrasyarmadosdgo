const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  MACHINE_UPLOADS_DIR,
  ensureMachineUploadsDir,
} = require("../config/uploads");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const getExtensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return "";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureMachineUploadsDir();
    cb(null, MACHINE_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = getExtensionFromMimeType(file.mimetype) || path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext.toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error("Formato de imagen inválido. Solo se permite JPG o PNG."));
    return;
  }
  cb(null, true);
};

const uploadMaquinaPortada = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = {
  uploadMaquinaPortada,
  MAX_FILE_SIZE,
};
