const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listMovimientos,
  listAlertasStockMinimo,
} = require("../controllers/movimientosInventarioController");

const router = express.Router();

router.get("/", requirePermission(P.ARTICULOS_VIEW), listMovimientos);
router.get("/alertas/stock-minimo", requirePermission(P.ARTICULOS_VIEW), listAlertasStockMinimo);

module.exports = router;
