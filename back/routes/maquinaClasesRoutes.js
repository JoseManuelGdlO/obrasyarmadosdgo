const express = require("express");
const { requirePermission, requireAnyPermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/maquinaClasesController");

const router = express.Router();
router.get("/", requireAnyPermission(P.MAQUINAS_VIEW, P.MAQUINAS_READ_ASSIGNED), controller.list);
router.get("/:id", requireAnyPermission(P.MAQUINAS_VIEW, P.MAQUINAS_READ_ASSIGNED), controller.getById);
router.post("/", requirePermission(P.MAQUINAS_EDIT), controller.create);
router.patch("/:id", requirePermission(P.MAQUINAS_EDIT), controller.update);
router.delete("/:id", requirePermission(P.MAQUINAS_EDIT), controller.remove);

module.exports = router;
