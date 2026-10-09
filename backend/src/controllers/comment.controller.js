const crypto = require("crypto");
const driver = require("../config/db");
const { toIsoString } = require("../utils/formatDate");
const { createNotification } = require("../utils/createNotification");

// GET /api/posts/:postId/comments
async function getCommentsOfPost(req, res) {
  const { postId } = req.params;
  const session = driver.session();

  try {
    // الخطوة 1: الكومنتات الأساسية بس (المتعلقة بالبوست مباشرة بعلاقة COMMENT_OF)
    // الردود مش بتترابط بالبوست، بترتبط بالكومنت الأب بعلاقة REPLY_TO، فمش بتظهر هنا
    const commentsResult = await session.run(
      `
      MATCH (p:Post {id: $postId})
      OPTIONAL MATCH (c:Comment)-[:COMMENT_OF]->(p)
      OPTIONAL MATCH (u:User)-[:WROTE]->(c)
      RETURN c, u
      ORDER BY c.createdAt ASC
      `,
      { postId }
    );

    if (commentsResult.records.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = commentsResult.records
      .map((record) => {
        const comment = record.get("c");
        const user = record.get("u");

        if (!comment) return null;

        return {
          id: comment.properties.id,
          content: comment.properties.content,
          createdAt: toIsoString(comment.properties.createdAt),
          user: user ? { id: user.properties.id, name: user.properties.name, avatarUrl: user.properties.avatarUrl || null } : null,
          replies: [] // هنملاها في الخطوة الجاية
        };
      })
      .filter(Boolean);

    // الخطوة 2: جيب كل الردود اللي بترد على أي كومنت من الكومنتات دي، مع مين كاتبها ورادة على أنهي كومنت
    const repliesResult = await session.run(
      `
      MATCH (topComment:Comment)-[:COMMENT_OF]->(:Post {id: $postId})
      MATCH (reply:Comment)-[:REPLY_TO]->(topComment)
      OPTIONAL MATCH (replyUser:User)-[:WROTE]->(reply)
      RETURN reply, replyUser, topComment.id AS parentCommentId
      ORDER BY reply.createdAt ASC
      `,
      { postId }
    );

    // بنعمل "map" بسيط: parentCommentId → array بتاع الردود عليه، عشان نلزقهم بسرعة تحت
    const repliesByParentId = {};

    repliesResult.records.forEach((record) => {
      const reply = record.get("reply");
      const replyUser = record.get("replyUser");
      const parentCommentId = record.get("parentCommentId");

      const formattedReply = {
        id: reply.properties.id,
        content: reply.properties.content,
        createdAt: toIsoString(reply.properties.createdAt),
        user: replyUser ? { id: replyUser.properties.id, name: replyUser.properties.name, avatarUrl: replyUser.properties.avatarUrl || null } : null
      };

      if (!repliesByParentId[parentCommentId]) {
        repliesByParentId[parentCommentId] = [];
      }
      repliesByParentId[parentCommentId].push(formattedReply);
    });

    // الخطوة 3: نلزق كل كومنت بالردود بتاعته
    comments.forEach((comment) => {
      comment.replies = repliesByParentId[comment.id] || [];
    });

    res.json({ comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get comments" });
  } finally {
    await session.close();
  }
}

// POST /api/posts/:postId/comments
async function addCommentToPost(req, res) {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.userId;
  const commentId = crypto.randomUUID();

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (p:Post {id: $postId})
      CREATE (c:Comment {
        id: $commentId,
        content: $content,
        createdAt: datetime()
      })
      CREATE (u)-[:WROTE]->(c)
      CREATE (c)-[:COMMENT_OF]->(p)
      WITH c, u, p
      MATCH (owner:User)-[:CREATED]->(p)
      RETURN c, u, owner.id AS ownerId
      `,
      { userId, postId, commentId, content }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User or Post not found" });
    }

    const comment = result.records[0].get("c");
    const user = result.records[0].get("u");
    const ownerId = result.records[0].get("ownerId");

    // إشعار لصاحب البوست إن حد علّق على بوسته (createNotification نفسها بتتجاهل لو المعلّق هو صاحب البوست)
    createNotification({ recipientId: ownerId, actorId: userId, type: "comment", postId });

    res.status(201).json({
      message: "Comment added successfully",
      comment: {
        id: comment.properties.id,
        content: comment.properties.content,
        createdAt: toIsoString(comment.properties.createdAt),
        user: { id: user.properties.id, name: user.properties.name, avatarUrl: user.properties.avatarUrl || null }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add comment" });
  } finally {
    await session.close();
  }
}

// POST /api/comments/:commentId/replies
async function addReplyToComment(req, res) {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.userId;
  const replyId = crypto.randomUUID();

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (parentComment:Comment {id: $commentId})
      CREATE (reply:Comment {
        id: $replyId,
        content: $content,
        createdAt: datetime()
      })
      CREATE (u)-[:WROTE]->(reply)
      CREATE (reply)-[:REPLY_TO]->(parentComment)
      RETURN reply, u
      `,
      { userId, commentId, replyId, content }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User or Parent Comment not found" });
    }

    const reply = result.records[0].get("reply");
    const user = result.records[0].get("u");

    res.status(201).json({
      message: "Reply added successfully",
      reply: {
        id: reply.properties.id,
        content: reply.properties.content,
        createdAt: toIsoString(reply.properties.createdAt),
        user: { id: user.properties.id, name: user.properties.name, avatarUrl: user.properties.avatarUrl || null }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add reply" });
  } finally {
    await session.close();
  }
}

// PUT /api/comments/:id  (تعديل كومنت أو رد)
async function updateComment(req, res) {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.userId;
  const session = driver.session();

  try {
    const ownerCheck = await session.run(
      `
      MATCH (c:Comment {id: $id})
      OPTIONAL MATCH (author:User)-[:WROTE]->(c)
      RETURN author
      `,
      { id }
    );

    if (ownerCheck.records.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const author = ownerCheck.records[0].get("author");

    if (!author || author.properties.id !== userId) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const result = await session.run(
      `
      MATCH (c:Comment {id: $id})
      SET c.content = $content
      RETURN c
      `,
      { id, content }
    );

    const comment = result.records[0].get("c");

    res.json({
      message: "Comment updated successfully",
      comment: {
        id: comment.properties.id,
        content: comment.properties.content,
        createdAt: toIsoString(comment.properties.createdAt)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update comment" });
  } finally {
    await session.close();
  }
}

// DELETE /api/comments/:id (مع كل الردود الفرعية المرتبطة بيه)
async function deleteComment(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const session = driver.session();

  try {
    const ownerCheck = await session.run(
      `
      MATCH (c:Comment {id: $id})
      OPTIONAL MATCH (author:User)-[:WROTE]->(c)
      RETURN author
      `,
      { id }
    );

    if (ownerCheck.records.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const author = ownerCheck.records[0].get("author");

    if (!author || author.properties.id !== userId) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    const result = await session.run(
      `
      MATCH (c:Comment {id: $id})
      OPTIONAL MATCH (subComment:Comment)-[:REPLY_TO*1..]->(c)
      DETACH DELETE c, subComment
      RETURN count(c) AS deletedCount
      `,
      { id }
    );

    const deletedCount = result.records[0].get("deletedCount").toNumber();

    res.json({ message: "Comment deleted successfully and its replies", deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete comment" });
  } finally {
    await session.close();
  }
}

// POST /api/comments/:commentId/like  (Toggle)
async function toggleCommentLike(req, res) {
  const { commentId } = req.params;
  const userId = req.userId;

  const session = driver.session();

  try {
    const checkResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:LIKED]->(c:Comment {id: $commentId})
      RETURN r
      `,
      { userId, commentId }
    );

    let message = "";

    if (checkResult.records.length > 0) {
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:LIKED]->(c:Comment {id: $commentId})
        DELETE r
        `,
        { userId, commentId }
      );
      message = "Like removed from comment successfully";
    } else {
      await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (c:Comment {id: $commentId})
        CREATE (u)-[:LIKED]->(c)
        `,
        { userId, commentId }
      );
      message = "Comment liked successfully";
    }

    const countResult = await session.run(
      `
      MATCH (:User)-[:LIKED]->(c:Comment {id: $commentId})
      RETURN count(c) as likeCount
      `,
      { commentId }
    );

    const likeCount = countResult.records[0].get("likeCount").toNumber();

    res.json({ message, likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle like on comment" });
  } finally {
    await session.close();
  }
}

module.exports = {
  getCommentsOfPost,
  addCommentToPost,
  addReplyToComment,
  updateComment,
  deleteComment,
  toggleCommentLike
};