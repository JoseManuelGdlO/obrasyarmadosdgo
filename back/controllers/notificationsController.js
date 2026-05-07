const Notification = require("../models/Notification");

const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 25,
    });
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar notificaciones.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada." });
    }
    if (!notification.isRead) {
      await notification.update({ isRead: true, readAt: new Date() });
    }
    return res.status(200).json({
      message: "Notificación marcada como leída.",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar notificación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );
    return res.status(200).json({
      message: "Notificaciones marcadas como leídas.",
      updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar notificaciones.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};
