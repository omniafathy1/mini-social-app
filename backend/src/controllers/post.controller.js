const crypto = require("crypto");
const neo4j = require("neo4j-driver");
const driver = require("../config/db");
const { uploadImageBuffer } = require("../utils/uploadToCloudinary");
const { toIsoString } = require("../utils/formatDate");
const { getIO } = require("../socket/socketManager");
const { createNotification } = require("../utils/createNotification");

// POST /api/posts
async function createPost(req, res) {
  const { content } = req.body;
  const userId = req.userId; // جاي من الـ requireAuth middleware، مش من كلام الفرونت
  const id = crypto.randomUUID();

  const session = driver.session();

  try {
    // zod بيتحقق من شكل "content" بس (لأنه مش عارف بوجود الصورة، دي جايه من multer مش من الـ JSON body)
    // فبنعمل الفحص ده يدويًا هنا: لازم يبقى فيه نص أو صورة على الأقل
    if (!content && !req.file) {
      return res.status(400).json({ message: "Post must have content or an image" });
    }

    let imageUrl = null;

    // req.file بيبقى موجود بس لو الفرونت بعت صورة (upload.middleware هو اللي حاطه)
    if (req.file) {
      imageUrl = await uploadImageBuffer(req.file.buffer, req.file.mimetype);
    }

    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      CREATE (p:Post {
        id: $id,
        content: $content,
        imageUrl: $imageUrl,
        createdAt: datetime()
      })
      CREATE (u)-[:CREATED]->(p)
      RETURN p, u
      `,
      { userId, id, content, imageUrl }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = result.records[0].get("p");
    const author = result.records[0].get("u");

    // نفس شكل البوست بالظبط اللي الفرونت متعود عليه من getAllPosts، عشان يقدر يحطه في الفيد من غير أي تحويل
    const postPayload = {
      id: post.properties.id,
      content: post.properties.content,
      imageUrl: post.properties.imageUrl || null,
      createdAt: toIsoString(post.properties.createdAt),
      likesCount: 0,
      user: {
        id: author.properties.id,
        name: author.properties.name,
        email: author.properties.email,
        avatarUrl: author.properties.avatarUrl || null
      }
    };

    // بنبعت الحدث ده لكل الأجهزة المتصلة دلوقتي، حتى قبل ما نرد على الشخص اللي عمل البوست نفسه
    getIO().emit("post:created", postPayload);

    res.status(201).json({
      message: "Post created successfully",
      post: postPayload
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create post" });
  } finally {
    await session.close();
  }
}

// GET /api/posts?page=1&limit=10
async function getAllPosts(req, res) {
  // لو الفرونت مبعتش page أو limit، نستخدم قيم افتراضية معقولة
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const session = driver.session();

  try {
    // بنجيب العدد الكلي للبوستات عشان الفرونت يعرف فيه صفحات كام / هل فيه "أكتر" ولا لأ
    const countResult = await session.run(`
      MATCH (:User)-[:CREATED]->(p:Post)
      RETURN count(p) AS total
    `);
    const totalPosts = countResult.records[0].get("total").toNumber();

    const result = await session.run(
      `
      MATCH (u:User)-[:CREATED]->(p:Post)
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      RETURN p, u, count(liker) AS likeCount
      ORDER BY p.createdAt DESC
      SKIP $skip
      LIMIT $limit
      `,
      // neo4j.int(...) عشان الـ driver محتاج الأرقام دي كـ integers مش JS numbers عادية
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    const posts = result.records.map((record) => {
      const post = record.get("p");
      const user = record.get("u");
      const likeCount = record.get("likeCount").toNumber();

      return {
        id: post.properties.id,
        content: post.properties.content,
        imageUrl: post.properties.imageUrl || null,
        createdAt: toIsoString(post.properties.createdAt),
        likesCount: likeCount,
        user: {
          id: user.properties.id,
          name: user.properties.name,
          email: user.properties.email,
          avatarUrl: user.properties.avatarUrl || null
        }
      };
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasMore: page * limit < totalPosts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get posts" });
  } finally {
    await session.close();
  }
}

// GET /api/posts/:id
async function getPostById(req, res) {
  const { id } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User)-[:CREATED]->(p:Post {id: $id})
      RETURN p, u
      `,
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = result.records[0].get("p");
    const user = result.records[0].get("u");

    res.json({
      post: {
        id: post.properties.id,
        content: post.properties.content,
        imageUrl: post.properties.imageUrl || null,
        createdAt: toIsoString(post.properties.createdAt),
        user: {
          id: user.properties.id,
          name: user.properties.name,
          email: user.properties.email,
          avatarUrl: user.properties.avatarUrl || null
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get post" });
  } finally {
    await session.close();
  }
}

// PUT /api/posts/:id
async function updatePost(req, res) {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.userId;
  const session = driver.session();

  try {
    // الأول بنتأكد إن البوست موجود أصلاً، ومين صاحبه
    const ownerCheck = await session.run(
      `
      MATCH (p:Post {id: $id})
      OPTIONAL MATCH (owner:User)-[:CREATED]->(p)
      RETURN owner
      `,
      { id }
    );

    if (ownerCheck.records.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const owner = ownerCheck.records[0].get("owner");

    // Authentication (فوق في requireAuth) بتتأكد إنك مسجل دخول
    // ده هنا Authorization: بيتأكد إن اللي بيعدل هو نفسه صاحب البوست
    if (!owner || owner.properties.id !== userId) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    const result = await session.run(
      `
      MATCH (p:Post {id: $id})
      SET p.content = $content
      RETURN p
      `,
      { id, content }
    );

    const post = result.records[0].get("p");

    res.json({
      message: "Post updated successfully",
      post: {
        id: post.properties.id,
        content: post.properties.content,
        imageUrl: post.properties.imageUrl || null,
        createdAt: toIsoString(post.properties.createdAt)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update post" });
  } finally {
    await session.close();
  }
}

// DELETE /api/posts/:id (بيمسح الكومنتات المرتبطة كمان عشان ننضف الجراف)
async function deletePost(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const session = driver.session();

  try {
    const ownerCheck = await session.run(
      `
      MATCH (p:Post {id: $id})
      OPTIONAL MATCH (owner:User)-[:CREATED]->(p)
      RETURN owner
      `,
      { id }
    );

    if (ownerCheck.records.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const owner = ownerCheck.records[0].get("owner");

    if (!owner || owner.properties.id !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    const result = await session.run(
      `
      MATCH (p:Post {id: $id})
      OPTIONAL MATCH (c:Comment)-[:COMMENT_OF]->(p)
      DETACH DELETE p, c
      RETURN count(p) AS deletedCount
      `,
      { id }
    );

    const deletedCount = result.records[0].get("deletedCount").toNumber();

    res.json({ message: "Post deleted successfully", deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete post" });
  } finally {
    await session.close();
  }
}

// POST /api/posts/:postId/like  (Toggle: لو اللايك موجود يتشال، لو مش موجود يتحط)
async function togglePostLike(req, res) {
  const { postId } = req.params;
  const userId = req.userId; // من التوكن

  const session = driver.session();

  try {
    const checkResult = await session.run(
      `
      MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
      RETURN r
      `,
      { userId, postId }
    );

    let message = "";

    if (checkResult.records.length > 0) {
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
        DELETE r
        `,
        { userId, postId }
      );
      message = "Like removed successfully";
    } else {
      const likeResult = await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (p:Post {id: $postId})
        CREATE (u)-[:LIKED]->(p)
        WITH p
        MATCH (owner:User)-[:CREATED]->(p)
        RETURN owner.id AS ownerId
        `,
        { userId, postId }
      );
      message = "Post liked successfully";

      // بنبعت إشعار بس لما اللايك "يتحط" (مش لما يتشال)، وده نضع newly-liked branch بس
      if (likeResult.records.length > 0) {
        const ownerId = likeResult.records[0].get("ownerId");
        // منستناش الدالة دي (no await) عشان ما نأخرش الرد على اليوزر اللي بيعمل اللايك
        createNotification({ recipientId: ownerId, actorId: userId, type: "like", postId });
      }
    }

    const countResult = await session.run(
      `
      MATCH (:User)-[:LIKED]->(p:Post {id: $postId})
      RETURN count(p) as likeCount
      `,
      { postId }
    );

    const likeCount = countResult.records[0].get("likeCount").toNumber();

    // أي حد تاني فاتح الفيد دلوقتي هيشوف العدد ده يتحدث لايف، حتى لو هو مش اللي عمل اللايك
    getIO().emit("post:liked", { postId, likesCount: likeCount });

    res.json({ message, likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle like on post" });
  } finally {
    await session.close();
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  togglePostLike
};