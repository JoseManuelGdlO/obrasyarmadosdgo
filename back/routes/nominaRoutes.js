const express = require("express");
const { requirePermission, requireAnyPermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/nominaController");

const router = express.Router();

router.get("/periodos", requirePermission(P.NOMINA_VIEW), controller.listPeriodos);
router.post("/periodos", requirePermission(P.NOMINA_CREATE), controller.createPeriodo);
router.get("/periodos/:id", requirePermission(P.NOMINA_VIEW), controller.getPeriodo);
router.get(
  "/periodos/:id/xlsx",
  requirePermission(P.NOMINA_VIEW),
  controller.exportPeriodoXlsx
);
router.patch(
  "/periodos/:id",
  requireAnyPermission(P.NOMINA_CREATE, P.NOMINA_PAY),
  controller.updatePeriodo
);
router.patch(
  "/periodos/:id/lineas/:lineaId",
  requireAnyPermission(P.NOMINA_CREATE, P.NOMINA_PAY),
  controller.updateLinea
);
router.post(
  "/periodos/:id/lineas/:lineaId/conceptos",
  requirePermission(P.NOMINA_CREATE),
  controller.addConcepto
);
router.patch(
  "/periodos/:id/lineas/:lineaId/conceptos/:conceptoId",
  requirePermission(P.NOMINA_CREATE),
  controller.updateConcepto
);
router.delete(
  "/periodos/:id/lineas/:lineaId/conceptos/:conceptoId",
  requirePermission(P.NOMINA_CREATE),
  controller.deleteConcepto
);

router.get("/extras", requirePermission(P.NOMINA_VIEW), controller.listExtras);
router.post("/extras", requirePermission(P.NOMINA_CREATE), controller.createExtra);
router.patch(
  "/extras/:id",
  requireAnyPermission(P.NOMINA_CREATE, P.NOMINA_PAY),
  controller.updateExtra
);

module.exports = router;
