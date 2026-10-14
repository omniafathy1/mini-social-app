const crypto = require("crypto");
const driver = require("../config/db");
const { toIsoString } = require("../utils/formatDate");
const { uploadImageBuffer } = require("../utils/uploadToCloudinary");
const { createNotification } = require("../utils/createNotification");
const { serializeUser } = require("../utils/serializeUser");

// POST /api/users
async function createUser(req, res) {
  const { name, email } = req.body;
  const id = crypto.randomUUID();

  const session = driver.session();

  try {
    const result = await session.run(
      `
      CREATE (u:User {
        id: $id,
        name: $name,
        email: $email
      })
      RETURN u
      `,
      { id, name, email }
    );

    const user = result.records[0].get("u");

    res.status(201).json({
      message: "User created successfully",
      user: serializeUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  } finally {
    await session.close();
  }
}

// GET /api/users/:id
async function getUserById(req, res) {
  const { id } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      RETURN u
      `,
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.records[0].get("u");

    const followersResult = await session.run(
      `MATCH (:User)-[:FOLLOWS]->(u:User {id: $id}) RETURN count(*) AS count`,
      { id }
    );
    const followersCount = followersResult.records[0].get("count").toNumber();

    const followingResult = await session.run(
      `MATCH (u:User {id: $id})-[:FOLLOWS]->(:User) RETURN count(*) AS count`,
      { id }
    );
    const followingCount = followingResult.records[0].get("count").toNumber();

    // Only calculate follow state for authenticated users viewing another profile.
    let isFollowing = false;
    if (req.userId && req.userId !== id) {
      const followCheckResult = await session.run(
        `
        MATCH (:User {id: $currentUserId})-[r:FOLLOWS]->(:User {id: $id})
        RETURN r IS NOT NULL AS isFollowing
        `,
        { currentUserId: req.userId, id }
      );
      isFollowing = followCheckResult.records[0]?.get("isFollowing") || false;
    }

    res.json({
      user: {
        id: user.properties.id,
        name: user.properties.name,
        email: user.properties.email,
        avatarUrl: user.properties.avatarUrl || null,
        followersCount,
        followingCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get user" });
  } finally {
    await session.close();
  }
}

// GET /api/users/:id/posts
async function getUserPosts(req, res) {
  const { id } = req.params;
  const currentUserId = req.userId || "";
  const session = driver.session();

  try {
    const userCheck = await session.run(
      `MATCH (u:User {id: $id}) RETURN u`,
      { id }
    );

    if (userCheck.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await session.run(
      `
      MATCH (u:User {id: $id})-[:CREATED]->(p:Post)
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      WITH p, count(liker) AS likeCount
      OPTIONAL MATCH (currentUser:User {id: $currentUserId})-[myLike:LIKED]->(p)
      RETURN p, likeCount, myLike IS NOT NULL AS isLiked
      ORDER BY p.createdAt DESC
      `,
      { id, currentUserId }
    );

    const posts = result.records.map((record) => {
      const post = record.get("p");
      const likeCount = record.get("likeCount").toNumber();
      const isLiked = record.get("isLiked");

      return {
        id: post.properties.id,
        content: post.properties.content,
        imageUrl: post.properties.imageUrl || null,
        createdAt: toIsoString(post.properties.createdAt),
        likesCount: likeCount,
        isLiked
      };
    });

    res.json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get user posts" });
  } finally {
    await session.close();
  }
}

// POST /api/users/:id/follow
async function toggleFollow(req, res) {
  const { id } = req.params;
  const currentUserId = req.userId;

  if (currentUserId === id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const session = driver.session();

  try {
    const targetCheck = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
    if (targetCheck.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const checkResult = await session.run(
      `
      MATCH (:User {id: $currentUserId})-[r:FOLLOWS]->(:User {id: $id})
      RETURN r
      `,
      { currentUserId, id }
    );

    let following;

    if (checkResult.records.length > 0) {
      await session.run(
        `
        MATCH (:User {id: $currentUserId})-[r:FOLLOWS]->(:User {id: $id})
        DELETE r
        `,
        { currentUserId, id }
      );
      following = false;
    } else {
      await session.run(
        `
        MATCH (a:User {id: $currentUserId})
        MATCH (b:User {id: $id})
        CREATE (a)-[:FOLLOWS]->(b)
        `,
        { currentUserId, id }
      );
      following = true;

      // Notify only when a follow is added.
      createNotification({ recipientId: id, actorId: currentUserId, type: "follow" });
    }

    const countResult = await session.run(
      `MATCH (:User)-[:FOLLOWS]->(u:User {id: $id}) RETURN count(*) AS count`,
      { id }
    );
    const followersCount = countResult.records[0].get("count").toNumber();

    res.json({ following, followersCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle follow" });
  } finally {
    await session.close();
  }
}

// GET /api/users/:id/followers
async function getFollowers(req, res) {
  const { id } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (follower:User)-[:FOLLOWS]->(:User {id: $id})
      RETURN follower
      ORDER BY follower.name ASC
      `,
      { id }
    );

    const followers = result.records.map((record) => {
      const user = record.get("follower");
      return {
        id: user.properties.id,
        name: user.properties.name,
        avatarUrl: user.properties.avatarUrl || null
      };
    });

    res.json({ followers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get followers" });
  } finally {
    await session.close();
  }
}

// GET /api/users/:id/following
async function getFollowing(req, res) {
  const { id } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (:User {id: $id})-[:FOLLOWS]->(following:User)
      RETURN following
      ORDER BY following.name ASC
      `,
      { id }
    );

    const following = result.records.map((record) => {
      const user = record.get("following");
      return {
        id: user.properties.id,
        name: user.properties.name,
        avatarUrl: user.properties.avatarUrl || null
      };
    });

    res.json({ following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get following list" });
  } finally {
    await session.close();
  }
}

// PUT /api/users/:id/avatar
async function uploadAvatar(req, res) {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You can only change your own avatar" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  const session = driver.session();

  try {
    const avatarUrl = await uploadImageBuffer(req.file.buffer, req.file.mimetype);

    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      SET u.avatarUrl = $avatarUrl
      RETURN u
      `,
      { id, avatarUrl }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.records[0].get("u");

    res.json({
      message: "Avatar updated successfully",
      user: {
        id: user.properties.id,
        name: user.properties.name,
        email: user.properties.email,
        avatarUrl: user.properties.avatarUrl || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update avatar" });
  } finally {
    await session.close();
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email } = req.body;

  // Users may only update their own account.
  if (req.userId !== id) {
    return res.status(403).json({ message: "You can only edit your own account" });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      SET u.name = $name,
          u.email = $email
      RETURN u
      `,
      { id, name, email }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.records[0].get("u");

    res.json({
      message: "User updated successfully",
      user: serializeUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update user" });
  } finally {
    await session.close();
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({ message: "You can only delete your own account" });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $id})
      DETACH DELETE u
      RETURN count(u) AS deletedCount
      `,
      { id }
    );

    const deletedCount = result.records[0].get("deletedCount").toNumber();

    if (deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user" });
  } finally {
    await session.close();
  }
}

module.exports = {
  createUser,
  getUserById,
  getUserPosts,
  toggleFollow,
  getFollowers,
  getFollowing,
  uploadAvatar,
  updateUser,
  deleteUser
};