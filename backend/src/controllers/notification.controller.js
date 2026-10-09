const driver = require("../config/db");
const { toIsoString } = require("../utils/formatDate");

// GET /api/notifications
async function getMyNotifications(req, res) {
  const userId = req.userId;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
      OPTIONAL MATCH (actor:User)-[:TRIGGERED]->(n)
      RETURN n, actor
      ORDER BY n.createdAt DESC
      LIMIT 30
      `,
      { userId }
    );

    const notifications = result.records.map((record) => {
      const n = record.get("n");
      const actor = record.get("actor");

      return {
        id: n.properties.id,
        type: n.properties.type,
        postId: n.properties.postId || null,
        isRead: n.properties.isRead,
        createdAt: toIsoString(n.properties.createdAt),
        actor: actor
          ? {
              id: actor.properties.id,
              name: actor.properties.name,
              avatarUrl: actor.properties.avatarUrl || null
            }
          : null
      };
    });

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get notifications" });
  } finally {
    await session.close();
  }
}

// GET /api/notifications/unread-count  (للرقم الأحمر اللي على الجرس)
async function getUnreadCount(req, res) {
  const userId = req.userId;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {isRead: false})
      RETURN count(n) AS count
      `,
      { userId }
    );

    const count = result.records[0].get("count").toNumber();
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get unread count" });
  } finally {
    await session.close();
  }
}

// PUT /api/notifications/read-all
async function markAllAsRead(req, res) {
  const userId = req.userId;
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {isRead: false})
      SET n.isRead = true
      `,
      { userId }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark all as read" });
  } finally {
    await session.close();
  }
}

// PUT /api/notifications/:id/read
async function markAsRead(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const session = driver.session();

  try {
    // المطابقة بتمر عن طريق (:User {id: $userId}) عشان نتأكد إن الإشعار ده بتاعك انت فعلاً (ownership check)
    const result = await session.run(
      `
      MATCH (:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {id: $id})
      SET n.isRead = true
      RETURN n
      `,
      { userId, id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  } finally {
    await session.close();
  }
}

module.exports = { getMyNotifications, getUnreadCount, markAllAsRead, markAsRead };