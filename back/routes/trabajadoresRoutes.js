const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/trabajadoresController");

const router = express.Router();
router.get("/", requirePermission(P.TRABAJADORES_VIEW), controller.list);
router.get("/:id", requirePermission(P.TRABAJADORES_VIEW), controller.getById);
router.post("/", requirePermission(P.TRABAJADORES_CREATE), controller.create);
router.patch("/:id", requirePermission(P.TRABAJADORES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.TRABAJADORES_DELETE), controller.remove);

module.exports = router;
