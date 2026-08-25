const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/cuentasContablesController");

const router = express.Router();
router.get("/", requirePermission(P.CUENTAS_CONTABLES_VIEW), controller.list);
router.get("/:id", requirePermission(P.CUENTAS_CONTABLES_VIEW), controller.getById);
router.post("/", requirePermission(P.CUENTAS_CONTABLES_CREATE), controller.create);
router.patch("/:id", requirePermission(P.CUENTAS_CONTABLES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.CUENTAS_CONTABLES_DELETE), controller.remove);

module.exports = router;
