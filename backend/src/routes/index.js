const express = require("express");
const router = express.Router();

const userRoutes = require("./user.routes");
const postRoutes = require("./post.routes");
const commentRoutes = require("./comment.routes");
const authRoutes = require("./auth.routes");
const searchRoutes = require("./search.routes");
const notificationRoutes = require("./notification.routes");
const healthRoutes = require("./health.routes");


// Feature routers are mounted under /api in app.js.
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/auth", authRoutes);
router.use("/search", searchRoutes);
router.use("/notifications", notificationRoutes);
router.use("/", healthRoutes); // /api/test-db

module.exports = router;  