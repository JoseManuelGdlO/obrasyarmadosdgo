const express = require("express");
const { issuePermanentToken, me, logout } = require("../controllers/authController");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");

const router = express.Router();

router.post(
  "/permanent-token",
  requirePermission(P.USERS_EDIT),
  issuePermanentToken
);
router.get("/me", me);
router.post("/logout", logout);

module.exports = router;
