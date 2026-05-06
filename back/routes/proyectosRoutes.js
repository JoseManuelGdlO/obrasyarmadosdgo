const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/proyectosController");

const router = express.Router();
router.get("/", requirePermission(P.PROYECTOS_VIEW), controller.list);
router.get("/:id", requirePermission(P.PROYECTOS_VIEW), controller.getById);
router.post("/", requirePermission(P.PROYECTOS_CREATE), controller.create);
router.patch("/:id", requirePermission(P.PROYECTOS_EDIT), controller.update);
router.delete("/:id", requirePermission(P.PROYECTOS_DELETE), controller.remove);

module.exports = router;
