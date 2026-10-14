const crypto = require("crypto");
const driver = require("../config/db");
const { toIsoString } = require("./formatDate");
const { getIO } = require("../socket/socketManager");

// Shared notification creation for likes, comments, and follows.
async function createNotification({ recipientId, actorId, type, postId = null }) {
  // Do not notify users about their own actions.
  if (recipientId === actorId) return;

  const session = driver.session();

  try {
    const id = crypto.randomUUID();

    const result = await session.run(
      `
      MATCH (recipient:User {id: $recipientId})
      MATCH (actor:User {id: $actorId})
      CREATE (n:Notification {
        id: $id,
        type: $type,
        postId: $postId,
        isRead: false,
        createdAt: datetime()
      })
      CREATE (recipient)-[:HAS_NOTIFICATION]->(n)
      CREATE (actor)-[:TRIGGERED]->(n)
      RETURN n, actor
      `,
      { recipientId, actorId, id, type, postId }
    );

    if (result.records.length === 0) return;

    const notification = result.records[0].get("n");
    const actor = result.records[0].get("actor");

    const payload = {
      id: notification.properties.id,
      type: notification.properties.type,
      postId: notification.properties.postId,
      isRead: false,
      createdAt: toIsoString(notification.properties.createdAt),
      actor: {
        id: actor.properties.id,
        name: actor.properties.name,
        avatarUrl: actor.properties.avatarUrl || null
      }
    };

    // Send the event only to the recipient's room, not to every connected client.
    getIO().to(recipientId).emit("notification:new", payload);
  } catch (error) {
    // Notification failures must not interrupt the action that triggered them.
    console.error("Failed to create notification:", error);
  } finally {
    await session.close();
  }
}

module.exports = { createNotification };