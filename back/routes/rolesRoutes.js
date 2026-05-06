const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const { listRoles, createRole, updateRole, deleteRole } = require("../controllers/rolesController");

const router = express.Router();

router.get("/", requirePermission(P.ROLES_VIEW), listRoles);
router.post("/", requirePermission(P.ROLES_CREATE), createRole);
router.patch("/:id", requirePermission(P.ROLES_EDIT), updateRole);
router.delete("/:id", requirePermission(P.ROLES_DELETE), deleteRole);

module.exports = router;
