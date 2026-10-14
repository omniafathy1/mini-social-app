const { z } = require("zod");

// Post creation allows image-only posts; provided text is still validated.
const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .max(2000, "Post content is too long (max 2000 characters)")
    .optional()
    .default(""),
});

// Post updates require non-empty text because images cannot be changed here.
const updatePostSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Post content cannot be empty")
    .max(2000, "Post content is too long (max 2000 characters)"),
});

module.exports = { createPostSchema, updatePostSchema };