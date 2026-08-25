const express = require("express");
const { requirePermission, requireProyectoScope } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listEstimaciones,
  getEstimacionById,
  createEstimacion,
  updateEstimacion,
  deleteEstimacion,
  addFotosEstimacion,
  deleteFotoEstimacion,
} = require("../controllers/proyectoEstimacionesController");
const {
  uploadEstimacionFiles,
  ESTIMACION_CARATULA_FIELDS,
  ESTIMACION_FOTOS_FIELDS,
  validateUploadedEstimacionFileSizes,
  cleanupUploadedEstimacionFilesIfPresent,
} = require("../middlewares/uploadEstimacionFiles");

const router = express.Router({ mergeParams: true });

const handleCaratulaUpload = (req, res, next) => {
  uploadEstimacionFiles.fields(ESTIMACION_CARATULA_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedEstimacionFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedEstimacionFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedEstimacionFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "La imagen no puede superar 2MB." });
    }
    return res.status(400).json({
      message: error.message || "No se pudo procesar la carátula.",
    });
  });
};

const handleFotosUpload = (req, res, next) => {
  uploadEstimacionFiles.fields(ESTIMACION_FOTOS_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedEstimacionFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedEstimacionFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedEstimacionFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "La imagen no puede superar 2MB." });
    }
    if (error.name === "MulterError" && error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Máximo 20 fotos extra por estimación.",
      });
    }
    return res.status(400).json({
      message: error.message || "No se pudieron procesar las fotos.",
    });
  });
};

router.use(requireProyectoScope);

router.get("/", requirePermission(P.PROYECTOS_VIEW), listEstimaciones);
router.post("/", requirePermission(P.PROYECTOS_EDIT), handleCaratulaUpload, createEstimacion);
router.post(
  "/:id/fotos",
  requirePermission(P.PROYECTOS_EDIT),
  handleFotosUpload,
  addFotosEstimacion
);
router.delete(
  "/:id/fotos/:fotoId",
  requirePermission(P.PROYECTOS_EDIT),
  deleteFotoEstimacion
);
router.get("/:id", requirePermission(P.PROYECTOS_VIEW), getEstimacionById);
router.patch(
  "/:id",
  requirePermission(P.PROYECTOS_EDIT),
  handleCaratulaUpload,
  updateEstimacion
);
router.delete("/:id", requirePermission(P.PROYECTOS_EDIT), deleteEstimacion);

module.exports = router;
