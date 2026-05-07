const express = require("express");
const { requireAnyPermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const { getHome } = require("../controllers/dashboardController");

const router = express.Router();

router.get(
  "/home",
  requireAnyPermission(
    P.ORDENES_VIEW,
    P.MAQUINAS_VIEW,
    P.MAQUINAS_READ_ASSIGNED,
    P.MAQUINAS_UPDATE_ASSIGNED,
    P.CHECKLIST_DIARIO_VIEW,
    P.ARTICULOS_VIEW
  ),
  getHome
);

module.exports = router;
