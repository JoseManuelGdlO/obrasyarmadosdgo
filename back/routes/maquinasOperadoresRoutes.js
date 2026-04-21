const express = require("express");
const {
  listOperadores,
  assignOperador,
  unassignOperador,
} = require("../controllers/maquinasOperadoresController");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", requirePermission(P.OPERADORES_MANAGE), listOperadores);
router.post("/", requirePermission(P.OPERADORES_MANAGE), assignOperador);
router.delete("/:userId", requirePermission(P.OPERADORES_MANAGE), unassignOperador);

module.exports = router;
