const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo,
} = require("../controllers/articulosController");

const router = express.Router();

router.get("/", requirePermission(P.ARTICULOS_VIEW), listArticulos);
router.get("/:id", requirePermission(P.ARTICULOS_VIEW), getArticuloById);
router.post("/", requirePermission(P.ARTICULOS_CREATE), createArticulo);
router.patch("/:id", requirePermission(P.ARTICULOS_EDIT), updateArticulo);
router.delete("/:id", requirePermission(P.ARTICULOS_DELETE), deleteArticulo);

module.exports = router;
