const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/asignacionesController");

const router = express.Router();
router.get("/", requirePermission(P.ASIGNACIONES_VIEW), controller.list);
router.get("/:id", requirePermission(P.ASIGNACIONES_VIEW), controller.getById);
router.post("/", requirePermission(P.ASIGNACIONES_CREATE), controller.create);
router.patch("/:id", requirePermission(P.ASIGNACIONES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.ASIGNACIONES_DELETE), controller.remove);

module.exports = router;
