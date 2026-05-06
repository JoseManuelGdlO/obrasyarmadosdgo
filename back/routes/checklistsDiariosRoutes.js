const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/checklistsDiariosController");

const router = express.Router();
router.get("/", requirePermission(P.CHECKLIST_DIARIO_VIEW), controller.list);
router.get("/:id", requirePermission(P.CHECKLIST_DIARIO_VIEW), controller.getById);
router.post("/", requirePermission(P.CHECKLIST_DIARIO_CREATE), controller.create);

module.exports = router;
