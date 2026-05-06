const express = require("express");
const {
  listOperadores,
  assignOperador,
  unassignOperador,
} = require("../controllers/maquinasOperadoresController");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", requirePermission(P.OPERADORES_VIEW), listOperadores);
router.post("/", requirePermission(P.OPERADORES_CREATE), assignOperador);
router.delete("/:userId", requirePermission(P.OPERADORES_DELETE), unassignOperador);

module.exports = router;
