const express = require("express");
const {
  listPlanesServicio,
  getPlanServicioById,
  createPlanServicio,
  updatePlanServicio,
  deletePlanServicio,
} = require("../controllers/maquinaPlanesServicioController");
const {
  requireMaquinaReadAccess,
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
} = require("../middlewares/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", requireMaquinaReadAccess, requireMaquinaAssignment, listPlanesServicio);
router.get(
  "/:id",
  requireMaquinaReadAccess,
  requireMaquinaAssignment,
  getPlanServicioById
);
router.post(
  "/",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  createPlanServicio
);
router.patch(
  "/:id",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  updatePlanServicio
);
router.delete(
  "/:id",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  deletePlanServicio
);

module.exports = router;
