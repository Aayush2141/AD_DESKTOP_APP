const { getDb } = require('../db');

function logAction(userId, userName, userRole, action, entityType, entityId, details, ipAddress = '127.0.0.1') {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, userName, userRole, action, entityType, entityId, details, ipAddress);
  } catch (err) {
    console.error('[AuditLog] Error writing audit log:', err);
  }
}

function getAuditLogs(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (filters.action) {
    query += ' AND action LIKE ? ';
    params.push(`%${filters.action}%`);
  }
  if (filters.user_role) {
    query += ' AND user_role = ? ';
    params.push(filters.user_role);
  }
  if (filters.search) {
    const s = `%${filters.search.toLowerCase()}%`;
    query += ' AND (LOWER(user_name) LIKE ? OR LOWER(details) LIKE ? OR LOWER(action) LIKE ?) ';
    params.push(s, s, s);
  }

  query += ' ORDER BY created_at DESC LIMIT 150';
  return db.prepare(query).all(...params);
}

module.exports = {
  logAction,
  getAuditLogs,
};
