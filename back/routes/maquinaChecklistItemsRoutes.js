const express = require("express");
const {
  listChecklistItems,
  getChecklistItemById,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} = require("../controllers/maquinaChecklistItemsController");
const {
  requireMaquinaReadAccess,
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
} = require("../middlewares/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", requireMaquinaReadAccess, requireMaquinaAssignment, listChecklistItems);
router.get(
  "/:id",
  requireMaquinaReadAccess,
  requireMaquinaAssignment,
  getChecklistItemById
);
router.post(
  "/",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  createChecklistItem
);
router.patch(
  "/:id",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  updateChecklistItem
);
router.delete(
  "/:id",
  requireMaquinaWriteAccess,
  requireMaquinaAssignment,
  deleteChecklistItem
);

module.exports = router;
