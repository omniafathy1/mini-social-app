const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const upload = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validate.middleware");
const { createPostSchema, updatePostSchema } = require("../validators/posts.schema");

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  togglePostLike
} = require("../controllers/post.controller");

const {
  getCommentsOfPost,
  addCommentToPost
} = require("../controllers/comment.controller");

router.post("/", requireAuth, upload.single("image"), validate(createPostSchema), createPost);
router.get("/", getAllPosts);
router.get("/:id", optionalAuth, getPostById);
router.put("/:id", requireAuth, validate(updatePostSchema), updatePost);
router.delete("/:id", requireAuth, deletePost);

router.post("/:postId/like", requireAuth, togglePostLike);

// الكومنتات بتتحط جوه راوت البوستات لأنها تابعة له (nested route)
router.get("/:postId/comments", getCommentsOfPost);
router.post("/:postId/comments", requireAuth, addCommentToPost);
router.get("/", optionalAuth, getAllPosts);

module.exports = router;