const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  ESTIMACION_UPLOADS_DIR,
  ensureEstimacionUploadsDir,
} = require("../config/uploads");
const { logger } = require("../utils/logger");

const ESTIMACION_IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

const FIELD_CONFIG = {
  caratula: { mimeTypes: IMAGE_MIME_TYPES, maxSize: ESTIMACION_IMAGE_MAX_SIZE },
  fotos: { mimeTypes: IMAGE_MIME_TYPES, maxSize: ESTIMACION_IMAGE_MAX_SIZE },
};

const getExtensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return "";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureEstimacionUploadsDir();
    cb(null, ESTIMACION_UPLOADS_DIR);
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

const uploadEstimacionFiles = multer({
  storage,
  limits: { fileSize: ESTIMACION_IMAGE_MAX_SIZE },
  fileFilter,
});

const ESTIMACION_CARATULA_FIELDS = [{ name: "caratula", maxCount: 1 }];
const ESTIMACION_FOTOS_FIELDS = [{ name: "fotos", maxCount: 20 }];

const validateUploadedEstimacionFileSizes = (req) => {
  const files = req.files || {};
  const errors = [];
  for (const [fieldname, entries] of Object.entries(files)) {
    const config = FIELD_CONFIG[fieldname];
    if (!config || !entries?.length) continue;
    for (const file of entries) {
      if (file.size > config.maxSize) {
        errors.push(`La imagen no puede superar ${config.maxSize / (1024 * 1024)}MB.`);
      }
    }
  }
  return errors;
};

const cleanupUploadedEstimacionFilesIfPresent = async (req) => {
  const paths = new Set();
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
  uploadEstimacionFiles,
  ESTIMACION_CARATULA_FIELDS,
  ESTIMACION_FOTOS_FIELDS,
  validateUploadedEstimacionFileSizes,
  cleanupUploadedEstimacionFilesIfPresent,
  ESTIMACION_IMAGE_MAX_SIZE,
};
