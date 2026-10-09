const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");

const {
  addReplyToComment,
  updateComment,
  deleteComment,
  toggleCommentLike
} = require("../controllers/comment.controller");

router.post("/:commentId/replies", requireAuth, addReplyToComment);
router.put("/:id", requireAuth, updateComment);
router.delete("/:id", requireAuth, deleteComment);
router.post("/:commentId/like", requireAuth, toggleCommentLike);

module.exports = router;