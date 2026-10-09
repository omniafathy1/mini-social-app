const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");

const {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead
} = require("../controllers/notification.controller");

router.get("/", requireAuth, getMyNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.put("/read-all", requireAuth, markAllAsRead);
router.put("/:id/read", requireAuth, markAsRead);

module.exports = router;