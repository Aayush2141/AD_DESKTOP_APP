const fs = require('fs');
const path = require('path');
const { getDb, getDbPath, closeDb, initDb } = require('../db');

function getSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  rows.forEach(r => {
    settingsObj[r.key] = r.value;
  });
  return {
    settings: settingsObj,
    list: rows
  };
}

function updateSetting(key, value, user) {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, String(value));

  // If guide_max_capacity is updated, update all guides
  if (key === 'guide_max_capacity') {
    const newCap = parseInt(value) || 3;
    db.prepare('UPDATE guides SET max_capacity = ?').run(newCap);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'UPDATE_SETTING', 'Settings', NULL, ?)
  `).run(user.id, user.full_name, user.role, `Updated setting "${key}" to "${value}"`);

  return getSettings();
}

async function exportDatabase(targetPath) {
  const db = getDb();
  if (!targetPath) {
    throw new Error('Target destination path required');
  }

  // Use better-sqlite3 backup API
  await db.backup(targetPath);
  return {
    success: true,
    destination: targetPath,
    timestamp: new Date().toISOString()
  };
}

function importDatabase(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error('Backup file does not exist');
  }

  const currentDbPath = getDbPath();
  closeDb();

  // Create safety copy of current db
  const backupCopy = currentDbPath + '.pre-restore.bak';
  if (fs.existsSync(currentDbPath)) {
    fs.copyFileSync(currentDbPath, backupCopy);
  }

  try {
    fs.copyFileSync(sourcePath, currentDbPath);
    // Re-open
    initDb();
    return { success: true };
  } catch (err) {
    // Restore backup if copy failed
    if (fs.existsSync(backupCopy)) {
      fs.copyFileSync(backupCopy, currentDbPath);
    }
    initDb();
    throw err;
  }
}

function getSystemMetadata() {
  const db = getDb();
  const colleges = db.prepare('SELECT * FROM colleges ORDER BY name').all();
  const departments = db.prepare('SELECT d.*, c.name as college_name FROM departments d JOIN colleges c ON d.college_id = c.id ORDER BY d.name').all();
  const thrustAreas = db.prepare('SELECT ta.*, d.name as department_name FROM thrust_areas ta JOIN departments d ON ta.department_id = d.id WHERE ta.is_active = 1 ORDER BY ta.name').all();
  const guides = db.prepare('SELECT g.*, u.full_name, u.email, d.name as department_name, c.name as college_name FROM guides g JOIN users u ON g.user_id = u.id JOIN departments d ON g.department_id = d.id JOIN colleges c ON g.college_id = c.id ORDER BY u.full_name').all();

  return {
    colleges,
    departments,
    thrustAreas,
    guides,
  };
}

module.exports = {
  getSettings,
  updateSetting,
  exportDatabase,
  importDatabase,
  getSystemMetadata,
};
