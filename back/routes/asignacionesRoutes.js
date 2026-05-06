const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/asignacionesController");

const router = express.Router();
router.use(requirePermission(P.ASIGNACIONES_CRUD));
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
