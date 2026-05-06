const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clientesController");

const router = express.Router();

router.get("/", requirePermission(P.CLIENTES_VIEW), listClientes);
router.get("/:id", requirePermission(P.CLIENTES_VIEW), getClienteById);
router.post("/", requirePermission(P.CLIENTES_CREATE), createCliente);
router.patch("/:id", requirePermission(P.CLIENTES_EDIT), updateCliente);
router.delete("/:id", requirePermission(P.CLIENTES_DELETE), deleteCliente);

module.exports = router;
