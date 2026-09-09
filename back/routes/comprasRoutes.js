const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/comprasController");
const {
  uploadComprasImport,
  uploadComprasFactura,
  cleanupUploadedFileIfPresent,
} = require("../middlewares/uploadComprasFiles");

const router = express.Router();

const handleImportUpload = (req, res, next) => {
  uploadComprasImport.single("archivo")(req, res, async (error) => {
    if (error) {
      await cleanupUploadedFileIfPresent(req);
      return res.status(400).json({ message: error.message || "Error subiendo el archivo." });
    }
    return next();
  });
};

const handleFacturaUpload = (req, res, next) => {
  uploadComprasFactura.single("archivo")(req, res, async (error) => {
    if (error) {
      await cleanupUploadedFileIfPresent(req);
      return res.status(400).json({ message: error.message || "Error subiendo la factura." });
    }
    return next();
  });
};

router.post(
  "/importar",
  requirePermission(P.COMPRAS_IMPORT),
  handleImportUpload,
  controller.importar
);
router.get("/", requirePermission(P.COMPRAS_VIEW), controller.list);
router.post("/", requirePermission(P.COMPRAS_IMPORT), controller.create);
router.get("/:id", requirePermission(P.COMPRAS_VIEW), controller.getById);
router.patch(
  "/:id/partidas/:partidaId/gestion",
  requirePermission(P.COMPRAS_IMPORT),
  controller.updatePartidaGestion
);
router.post(
  "/:id/xlsm",
  requirePermission(P.COMPRAS_IMPORT),
  handleImportUpload,
  controller.uploadXlsm
);
router.post(
  "/:id/facturas",
  requirePermission(P.COMPRAS_FACTURAS),
  handleFacturaUpload,
  controller.uploadFactura
);
router.delete(
  "/:id/facturas/:facturaId",
  requirePermission(P.COMPRAS_FACTURAS),
  controller.deleteFactura
);

module.exports = router;
