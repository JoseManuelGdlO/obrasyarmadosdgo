const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  COMPRAS_IMPORTS_DIR,
  COMPRAS_FACTURAS_DIR,
  ensureComprasUploadsDir,
} = require("../config/uploads");
const { logger } = require("../utils/logger");

const XLSM_MAX_SIZE = 20 * 1024 * 1024;
const FACTURA_MAX_SIZE = 10 * 1024 * 1024;

const FACTURA_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const XLSM_MIME_TYPES = new Set([
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "application/zip",
]);

const getExtensionFromMimeType = (mimeType, originalname) => {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  const fromName = path.extname(originalname || "").toLowerCase();
  if (fromName) return fromName;
  return ".bin";
};

const importStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureComprasUploadsDir();
    cb(null, COMPRAS_IMPORTS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".xlsm";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const facturaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureComprasUploadsDir();
    cb(null, COMPRAS_FACTURAS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = getExtensionFromMimeType(file.mimetype, file.originalname);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const uploadComprasImport = multer({
  storage: importStorage,
  limits: { fileSize: XLSM_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ext !== ".xlsm" && ext !== ".xlsx") {
      cb(new Error("Solo se permiten archivos .xlsm (o .xlsx)."));
      return;
    }
    if (!XLSM_MIME_TYPES.has(file.mimetype) && file.mimetype !== "application/haansoftxlsx") {
      // Algunos navegadores envían MIME raro; la extensión ya se validó.
    }
    cb(null, true);
  },
});

const uploadComprasFactura = multer({
  storage: facturaStorage,
  limits: { fileSize: FACTURA_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!FACTURA_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Formato inválido. Solo PDF, JPG o PNG."));
      return;
    }
    cb(null, true);
  },
});

const cleanupUploadedPath = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn(`No se pudo eliminar archivo temporal: ${error.message}`);
    }
  }
};

const cleanupUploadedFileIfPresent = async (req) => {
  await cleanupUploadedPath(req.file?.path);
};

module.exports = {
  uploadComprasImport,
  uploadComprasFactura,
  cleanupUploadedFileIfPresent,
  cleanupUploadedPath,
  XLSM_MAX_SIZE,
  FACTURA_MAX_SIZE,
};
