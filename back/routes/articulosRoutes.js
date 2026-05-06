const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  getInventarioResumen,
} = require("../controllers/articulosController");
const {
  listKardexArticulo,
  createMovimiento,
} = require("../controllers/movimientosInventarioController");

const router = express.Router();

router.get("/", requirePermission(P.ARTICULOS_VIEW), listArticulos);
router.get("/resumen", requirePermission(P.ARTICULOS_VIEW), getInventarioResumen);
router.get("/:id", requirePermission(P.ARTICULOS_VIEW), getArticuloById);
router.get("/:id/kardex", requirePermission(P.ARTICULOS_VIEW), listKardexArticulo);
router.post("/:id/movimientos", requirePermission(P.ARTICULOS_EDIT), createMovimiento);
router.post("/", requirePermission(P.ARTICULOS_CREATE), createArticulo);
router.patch("/:id", requirePermission(P.ARTICULOS_EDIT), updateArticulo);
router.delete("/:id", requirePermission(P.ARTICULOS_DELETE), deleteArticulo);

module.exports = router;
