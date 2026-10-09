const crypto = require("crypto");
const driver = require("../config/db");
const { toIsoString } = require("./formatDate");
const { getIO } = require("../socket/socketManager");

// دالة واحدة بنستخدمها من 3 أماكن مختلفة (لايك، كومنت، فولو) عشان منكررش نفس المنطق 3 مرات
// recipientId: مين هياخد الإشعار | actorId: مين اللي عمل الفعل | type: 'like' | 'comment' | 'follow'
async function createNotification({ recipientId, actorId, type, postId = null }) {
  // محدش محتاج إشعار إنه هو نفسه عمل حاجة لنفسه (مثلاً عملت لايك لبوستك انت)
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

    if (result.records.length === 0) return; // اليوزر recipient أو actor مش موجودين أصلاً (حالة نادرة)

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

    // الفرق هنا عن io.emit(): بنبعت لـ "أوضة" الـ recipient بس (اسمها نفس الـ userId بتاعه)
    // مش لكل حد متصل بالسيرفر
    getIO().to(recipientId).emit("notification:new", payload);
  } catch (error) {
    // لو حصل أي مشكلة هنا، منوقفش الـ request الأساسي (اللايك/الكومنت/الفولو) بسببها
    console.error("Failed to create notification:", error);
  } finally {
    await session.close();
  }
}

module.exports = { createNotification };