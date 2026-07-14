const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const { listRoleProyectos, syncRoleProyectos } = require("../controllers/roleProyectosController");

const router = express.Router();

router.get("/", requirePermission(P.ROLE_PERMISSIONS_VIEW), listRoleProyectos);
router.put("/:rol", requirePermission(P.ROLE_PERMISSIONS_CREATE), syncRoleProyectos);

module.exports = router;
