const { getDb } = require('../db');

function getNotifications(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId);
}

function getUnreadCount(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT COUNT(*) as unread FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId).unread;
}

function markAsRead(id, userId) {
  const db = getDb();
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(id, userId);
  return { success: true };
}

function markAllAsRead(userId) {
  const db = getDb();
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ?
  `).run(userId);
  return { success: true };
}

function createNotification(userId, title, message, type = 'info', linkType = null, linkId = null) {
  const db = getDb();
  const res = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, title, message, type, linkType, linkId);
  return res.lastInsertRowid;
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
