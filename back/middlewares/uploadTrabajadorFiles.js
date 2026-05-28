const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  WORKER_UPLOADS_DIR,
  ensureWorkerUploadsDir,
} = require("../config/uploads");
const { logger } = require("../utils/logger");

const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

const FIELD_CONFIG = {
  avatar: { mimeTypes: AVATAR_MIME_TYPES, maxSize: AVATAR_MAX_SIZE },
};

const getExtensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return "";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureWorkerUploadsDir();
    cb(null, WORKER_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext =
      getExtensionFromMimeType(file.mimetype) || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const config = FIELD_CONFIG[file.fieldname];
  if (!config) {
    cb(new Error(`Campo de archivo no permitido: ${file.fieldname}.`));
    return;
  }
  if (!config.mimeTypes.has(file.mimetype)) {
    cb(new Error("Formato de imagen inválido. Solo se permite JPG o PNG."));
    return;
  }
  cb(null, true);
};

const uploadTrabajadorFiles = multer({
  storage,
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter,
});

const TRABAJADOR_UPLOAD_FIELDS = [{ name: "avatar", maxCount: 1 }];

const validateUploadedFileSizes = (req) => {
  const files = req.files || {};
  const errors = [];
  for (const [fieldname, entries] of Object.entries(files)) {
    const config = FIELD_CONFIG[fieldname];
    if (!config || !entries?.length) continue;
    const file = entries[0];
    if (file.size > config.maxSize) {
      const maxMb = config.maxSize / (1024 * 1024);
      errors.push(`El avatar no puede superar ${maxMb}MB.`);
    }
  }
  return errors;
};

const cleanupUploadedFilesIfPresent = async (req) => {
  const paths = new Set();
  if (req.file?.path) paths.add(req.file.path);
  if (req.files) {
    for (const entries of Object.values(req.files)) {
      for (const file of entries) {
        if (file?.path) paths.add(file.path);
      }
    }
  }
  for (const filePath of paths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.warn(`No se pudo eliminar archivo temporal: ${error.message}`);
      }
    }
  }
};

module.exports = {
  uploadTrabajadorFiles,
  TRABAJADOR_UPLOAD_FIELDS,
  validateUploadedFileSizes,
  cleanupUploadedFilesIfPresent,
  AVATAR_MAX_SIZE,
};
