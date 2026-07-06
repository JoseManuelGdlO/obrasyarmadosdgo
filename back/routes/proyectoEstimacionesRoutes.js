const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listEstimaciones,
  getEstimacionById,
  createEstimacion,
  updateEstimacion,
  deleteEstimacion,
} = require("../controllers/proyectoEstimacionesController");

const router = express.Router({ mergeParams: true });

router.get("/", requirePermission(P.PROYECTOS_VIEW), listEstimaciones);
router.get("/:id", requirePermission(P.PROYECTOS_VIEW), getEstimacionById);
router.post("/", requirePermission(P.PROYECTOS_EDIT), createEstimacion);
router.patch("/:id", requirePermission(P.PROYECTOS_EDIT), updateEstimacion);
router.delete("/:id", requirePermission(P.PROYECTOS_EDIT), deleteEstimacion);

module.exports = router;
