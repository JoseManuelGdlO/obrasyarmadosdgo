const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/nomenclaturasController");

const router = express.Router();
router.get("/", requirePermission(P.NOMENCLATURAS_VIEW), controller.list);
router.get("/:id", requirePermission(P.NOMENCLATURAS_VIEW), controller.getById);
router.post("/", requirePermission(P.NOMENCLATURAS_CREATE), controller.create);
router.patch("/:id", requirePermission(P.NOMENCLATURAS_EDIT), controller.update);
router.delete("/:id", requirePermission(P.NOMENCLATURAS_DELETE), controller.remove);

module.exports = router;
