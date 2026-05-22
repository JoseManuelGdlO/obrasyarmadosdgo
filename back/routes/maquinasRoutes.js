const express = require("express");
const {
  listMaquinas,
  getMaquinaById,
  createMaquina,
  updateMaquina,
  deleteMaquina,
} = require("../controllers/maquinasController");
const {
  requirePermission,
  requireMaquinaReadAccess,
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
} = require("../middlewares/permissions");
const P = require("../constants/permissions");
const checklistRoutes = require("./maquinaChecklistItemsRoutes");
const planesRoutes = require("./maquinaPlanesServicioRoutes");
const operadoresRoutes = require("./maquinasOperadoresRoutes");
const {
  uploadMaquinaFiles,
  MAQUINA_UPLOAD_FIELDS,
  validateUploadedFileSizes,
  cleanupUploadedFilesIfPresent,
} = require("../middlewares/uploadMaquinaFiles");

const router = express.Router();

const handleMaquinaFilesUpload = (req, res, next) => {
  uploadMaquinaFiles.fields(MAQUINA_UPLOAD_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Uno de los archivos excede el tamaño máximo permitido (5MB).",
      });
    }
    return res.status(400).json({
      message: error.message || "No se pudieron procesar los archivos adjuntos.",
    });
  });
};

/** En GET/PATCH /:id la máquina va en `id`; el middleware de asignación espera `maquinaId`. */
const exposeMaquinaIdParam = (req, _res, next) => {
  if (req.params.id && !req.params.maquinaId) {
    req.params.maquinaId = req.params.id;
  }
  return next();
};

router.get("/", requireMaquinaReadAccess, listMaquinas);
router.post("/", requirePermission(P.MAQUINAS_CREATE), handleMaquinaFilesUpload, createMaquina);

router.use("/:maquinaId/operadores", operadoresRoutes);
router.use("/:maquinaId/checklist-items", checklistRoutes);
router.use("/:maquinaId/planes-servicio", planesRoutes);

router.get(
  "/:id",
  requireMaquinaReadAccess,
  exposeMaquinaIdParam,
  requireMaquinaAssignment,
  getMaquinaById
);
router.patch(
  "/:id",
  requireMaquinaWriteAccess,
  exposeMaquinaIdParam,
  requireMaquinaAssignment,
  handleMaquinaFilesUpload,
  updateMaquina
);
router.delete("/:id", requirePermission(P.MAQUINAS_DELETE), deleteMaquina);

module.exports = router;
