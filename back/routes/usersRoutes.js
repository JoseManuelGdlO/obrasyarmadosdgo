const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");

const router = express.Router();

router.get("/", requirePermission(P.USERS_VIEW), listUsers);
router.get("/:id", requirePermission(P.USERS_VIEW), getUserById);
router.post("/", requirePermission(P.USERS_CREATE), createUser);
router.patch("/:id", requirePermission(P.USERS_EDIT), updateUser);
router.delete("/:id", requirePermission(P.USERS_DELETE), deleteUser);

module.exports = router;
