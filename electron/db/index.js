const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function getDbPath() {
  let basePath;
  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      basePath = app.getPath('userData');
    }
  } catch (err) {
    // Running outside electron (e.g. standalone node script)
  }

  if (!basePath) {
    basePath = path.resolve(__dirname, '../../data');
  }

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  return path.join(basePath, 'pgdms.sqlite');
}

function initDb(customPath = null) {
  if (dbInstance) return dbInstance;

  const dbPath = customPath || getDbPath();
  console.log(`[DB] Initializing SQLite database at: ${dbPath}`);

  dbInstance = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  });

  // Optimize SQLite
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Load and apply schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  dbInstance.exec(schemaSql);

  // Initialize default system settings if not already present
  const initSetting = dbInstance.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)
  `);

  initSetting.run('guide_max_capacity', '3', 'Maximum number of PG scholars permitted per guide');
  initSetting.run('duplicate_similarity_threshold', '0.45', 'Similarity score threshold (0-1) triggering duplicate warning/blocking');
  initSetting.run('academic_year', '2025-2026', 'Active PG academic session');
  initSetting.run('university_result_auto_withhold', 'true', 'Auto-withhold final year university results if dissertation is disapproved or pending');

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDb,
  getDb,
  closeDb,
  getDbPath,
};
