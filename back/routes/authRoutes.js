const express = require("express");
const { issuePermanentToken } = require("../controllers/authController");
const { requireRole } = require("../middlewares/authorize");

const router = express.Router();

router.post("/permanent-token", requireRole("admin"), issuePermanentToken);

module.exports = router;
