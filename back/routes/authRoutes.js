const express = require("express");
const { issuePermanentToken } = require("../controllers/authController");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");

const router = express.Router();

router.post(
  "/permanent-token",
  requirePermission(P.USERS_MANAGE),
  issuePermanentToken
);

module.exports = router;
