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

const router = express.Router();

/** En GET/PATCH /:id la máquina va en `id`; el middleware de asignación espera `maquinaId`. */
const exposeMaquinaIdParam = (req, _res, next) => {
  if (req.params.id && !req.params.maquinaId) {
    req.params.maquinaId = req.params.id;
  }
  return next();
};

router.get("/", requireMaquinaReadAccess, listMaquinas);
router.post("/", requirePermission(P.MAQUINAS_CRUD), createMaquina);

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
  updateMaquina
);
router.delete("/:id", requirePermission(P.MAQUINAS_CRUD), deleteMaquina);

module.exports = router;
