const { z } = require("zod");

// وقت الإنشاء، النص اختياري لأنك ممكن تعمل بوست بصورة بس من غير نص خالص
// (لو بعت نص فعلاً، لازم يكون شكله سليم برضه)
const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .max(2000, "Post content is too long (max 2000 characters)")
    .optional()
    .default(""),
});

// وقت التعديل، مفيش صور، فالنص بقى إجباري
const updatePostSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .trim()
    .min(1, "Post content cannot be empty")
    .max(2000, "Post content is too long (max 2000 characters)"),
});

module.exports = { createPostSchema, updatePostSchema };