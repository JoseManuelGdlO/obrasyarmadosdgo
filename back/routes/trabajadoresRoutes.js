const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/trabajadoresController");
const {
  uploadTrabajadorFiles,
  TRABAJADOR_UPLOAD_FIELDS,
  validateUploadedFileSizes,
  cleanupUploadedFilesIfPresent,
} = require("../middlewares/uploadTrabajadorFiles");

const router = express.Router();

const handleTrabajadorFilesUpload = (req, res, next) => {
  uploadTrabajadorFiles.fields(TRABAJADOR_UPLOAD_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "El avatar excede el tamaño máximo permitido (2MB).",
      });
    }
    return res.status(400).json({
      message: error.message || "No se pudieron procesar los archivos adjuntos.",
    });
  });
};

router.get("/", requirePermission(P.TRABAJADORES_VIEW), controller.list);
router.get("/:id", requirePermission(P.TRABAJADORES_VIEW), controller.getById);
router.post(
  "/",
  requirePermission(P.TRABAJADORES_CREATE),
  handleTrabajadorFilesUpload,
  controller.create
);
router.patch(
  "/:id",
  requirePermission(P.TRABAJADORES_EDIT),
  handleTrabajadorFilesUpload,
  controller.update
);
router.delete("/:id", requirePermission(P.TRABAJADORES_DELETE), controller.remove);

module.exports = router;
