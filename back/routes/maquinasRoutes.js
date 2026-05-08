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
const { uploadMaquinaPortada } = require("../middlewares/uploadMaquinaPortada");

const router = express.Router();

const handlePortadaUpload = (req, res, next) => {
  uploadMaquinaPortada.single("fotoPortada")(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "La imagen excede el tamaño máximo permitido de 2MB.",
      });
    }
    return res.status(400).json({
      message: error.message || "No se pudo procesar la imagen de portada.",
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
router.post("/", requirePermission(P.MAQUINAS_CREATE), handlePortadaUpload, createMaquina);

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
  handlePortadaUpload,
  updateMaquina
);
router.delete("/:id", requirePermission(P.MAQUINAS_DELETE), deleteMaquina);

module.exports = router;
