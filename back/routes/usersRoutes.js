const express = require("express");
const { requireRole } = require("../middlewares/authorize");
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");

const router = express.Router();

router.use(requireRole("admin"));

router.get("/", listUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
