const express = require("express");
const {
  listArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo,
} = require("../controllers/articulosController");

const router = express.Router();

router.get("/", listArticulos);
router.get("/:id", getArticuloById);
router.post("/", createArticulo);
router.patch("/:id", updateArticulo);
router.delete("/:id", deleteArticulo);

module.exports = router;
