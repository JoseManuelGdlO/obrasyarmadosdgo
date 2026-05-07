const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/ordenesTrabajoController");

const router = express.Router();
router.get("/", requirePermission(P.ORDENES_VIEW), controller.list);
router.get("/:id", requirePermission(P.ORDENES_VIEW), controller.getById);
router.post("/", requirePermission(P.ORDENES_CREATE), controller.create);
router.patch("/:id/cerrar", requirePermission(P.ORDENES_EDIT), controller.close);
router.patch("/:id", requirePermission(P.ORDENES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.ORDENES_DELETE), controller.remove);

module.exports = router;
