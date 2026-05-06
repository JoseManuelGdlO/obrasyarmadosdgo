const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listRolePermissions,
  createRolePermission,
  deleteRolePermission,
} = require("../controllers/rolePermissionsController");

const router = express.Router();

router.get("/", requirePermission(P.ROLE_PERMISSIONS_VIEW), listRolePermissions);
router.post("/", requirePermission(P.ROLE_PERMISSIONS_CREATE), createRolePermission);
router.delete("/:id", requirePermission(P.ROLE_PERMISSIONS_DELETE), deleteRolePermission);

module.exports = router;
