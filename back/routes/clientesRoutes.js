const express = require("express");
const {
  listClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clientesController");

const router = express.Router();

router.get("/", listClientes);
router.get("/:id", getClienteById);
router.post("/", createCliente);
router.patch("/:id", updateCliente);
router.delete("/:id", deleteCliente);

module.exports = router;
