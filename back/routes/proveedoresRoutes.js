const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/proveedoresController");

const router = express.Router();
router.get("/", requirePermission(P.PROVEEDORES_VIEW), controller.list);
router.get("/:id", requirePermission(P.PROVEEDORES_VIEW), controller.getById);
router.post("/", requirePermission(P.PROVEEDORES_CREATE), controller.create);
router.patch("/:id", requirePermission(P.PROVEEDORES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.PROVEEDORES_DELETE), controller.remove);

module.exports = router;
