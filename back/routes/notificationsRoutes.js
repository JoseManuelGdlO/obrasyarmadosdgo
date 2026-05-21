const express = require("express");
const controller = require("../controllers/notificationsController");

const router = express.Router();

router.get("/", controller.listNotifications);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);

module.exports = router;
