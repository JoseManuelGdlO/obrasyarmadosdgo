const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  MACHINE_UPLOADS_DIR,
  ensureMachineUploadsDir,
} = require("../config/uploads");
const { logger } = require("../utils/logger");

const PORTADA_MAX_SIZE = 2 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 5 * 1024 * 1024;
const MULTER_MAX_SIZE = DOCUMENT_MAX_SIZE;

const PORTADA_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const FIELD_CONFIG = {
  fotoPortada: { mimeTypes: PORTADA_MIME_TYPES, maxSize: PORTADA_MAX_SIZE },
  archivoPedimento: { mimeTypes: DOCUMENT_MIME_TYPES, maxSize: DOCUMENT_MAX_SIZE },
  archivoPolizaSeguro: { mimeTypes: DOCUMENT_MIME_TYPES, maxSize: DOCUMENT_MAX_SIZE },
};

const getExtensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "application/msword") return ".doc";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return ".docx";
  }
  return "";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureMachineUploadsDir();
    cb(null, MACHINE_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext =
      getExtensionFromMimeType(file.mimetype) || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const config = FIELD_CONFIG[file.fieldname];
  if (!config) {
    cb(new Error(`Campo de archivo no permitido: ${file.fieldname}.`));
    return;
  }
  if (!config.mimeTypes.has(file.mimetype)) {
    if (file.fieldname === "fotoPortada") {
      cb(new Error("Formato de imagen inválido. Solo se permite JPG o PNG."));
      return;
    }
    cb(
      new Error(
        "Formato de archivo inválido. Solo se permite PDF, DOC, DOCX, JPG o PNG."
      )
    );
    return;
  }
  cb(null, true);
};

const uploadMaquinaFiles = multer({
  storage,
  limits: { fileSize: MULTER_MAX_SIZE },
  fileFilter,
});

const MAQUINA_UPLOAD_FIELDS = [
  { name: "fotoPortada", maxCount: 1 },
  { name: "archivoPedimento", maxCount: 1 },
  { name: "archivoPolizaSeguro", maxCount: 1 },
];

const validateUploadedFileSizes = (req) => {
  const files = req.files || {};
  const errors = [];
  for (const [fieldname, entries] of Object.entries(files)) {
    const config = FIELD_CONFIG[fieldname];
    if (!config || !entries?.length) continue;
    const file = entries[0];
    if (file.size > config.maxSize) {
      const maxMb = config.maxSize / (1024 * 1024);
      if (fieldname === "fotoPortada") {
        errors.push(`La imagen de portada no puede superar ${maxMb}MB.`);
      } else {
        errors.push(`El archivo "${fieldname}" no puede superar ${maxMb}MB.`);
      }
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
  uploadMaquinaFiles,
  MAQUINA_UPLOAD_FIELDS,
  validateUploadedFileSizes,
  cleanupUploadedFilesIfPresent,
  PORTADA_MAX_SIZE,
  DOCUMENT_MAX_SIZE,
};
