const express = require("express");
const {
  listPiezas,
  getPiezaById,
  createPieza,
  updatePieza,
  deletePieza,
} = require("../controllers/planServicioPiezasController");
const {
  requireMaquinaReadAccess,
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
} = require("../middlewares/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", requireMaquinaReadAccess, requireMaquinaAssignment, listPiezas);
router.get("/:id", requireMaquinaReadAccess, requireMaquinaAssignment, getPiezaById);
router.post("/", requireMaquinaWriteAccess, requireMaquinaAssignment, createPieza);
router.patch("/:id", requireMaquinaWriteAccess, requireMaquinaAssignment, updatePieza);
router.delete("/:id", requireMaquinaWriteAccess, requireMaquinaAssignment, deletePieza);

module.exports = router;
