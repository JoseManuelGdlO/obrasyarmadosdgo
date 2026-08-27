const path = require("path");
const fs = require("fs/promises");
const {
  ESTIMACION_UPLOADS_DIR,
  ESTIMACION_UPLOADS_ROUTE,
} = require("../config/uploads");
const { logger } = require("./logger");

const resolveStoredEstimacionUploadToAbsolute = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") return null;
  const normalizedRoute = `${ESTIMACION_UPLOADS_ROUTE}/`;
  if (!storedPath.startsWith(normalizedRoute)) return null;
  const filename = decodeURIComponent(storedPath.slice(normalizedRoute.length));
  const absolutePath = path.resolve(ESTIMACION_UPLOADS_DIR, filename);
  const uploadsRoot = path.resolve(ESTIMACION_UPLOADS_DIR);
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`) && absolutePath !== uploadsRoot) {
    return null;
  }
  return absolutePath;
};

const safeDeleteStoredEstimacionUpload = async (storedPath) => {
  const absolutePath = resolveStoredEstimacionUploadToAbsolute(storedPath);
  if (!absolutePath) return;
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const deleteStoredEstimacionUploadsBestEffort = async (storedPaths) => {
  const paths = storedPaths.filter(Boolean);
  const results = await Promise.allSettled(paths.map(safeDeleteStoredEstimacionUpload));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.warn(
        `No se pudo eliminar archivo de estimación ${paths[index]}: ${result.reason?.message || result.reason}`
      );
    }
  });
};

module.exports = {
  resolveStoredEstimacionUploadToAbsolute,
  safeDeleteStoredEstimacionUpload,
  deleteStoredEstimacionUploadsBestEffort,
};
