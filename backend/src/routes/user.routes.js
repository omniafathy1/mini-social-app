const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  getUserById,
  getUserPosts,
  toggleFollow,
  getFollowers,
  getFollowing,
  uploadAvatar,
  updateUser,
  deleteUser
} = require("../controllers/user.controller");

// Note: Direct user creation is disabled. Users must register via /api/auth/register or Google OAuth.
router.get("/:id", optionalAuth, getUserById); // optionalAuth: public profile view with personalized isFollowing
router.get("/:id/posts", optionalAuth, getUserPosts);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.post("/:id/follow", requireAuth, toggleFollow);
router.put("/:id/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.put("/:id", requireAuth, updateUser);
router.delete("/:id", requireAuth, deleteUser);

module.exports = router;
