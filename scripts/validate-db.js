// Automated Database Sanity & Integrity Validator for PGDMS
const { initDb, closeDb } = require('../electron/db');

function validateDatabase() {
  console.log('=== Running Database Schema & Integrity Validation ===\n');
  const db = initDb();

  // 1. Verify all 17 expected tables exist
  const expectedTables = [
    'users',
    'colleges',
    'departments',
    'thrust_areas',
    'guides',
    'students',
    'dissertations',
    'approvals',
    'ethics_clearances',
    'milestones',
    'progress_reports',
    'evaluations',
    'publications',
    'documents',
    'notifications',
    'audit_logs',
    'settings',
  ];

  const existingTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map(r => r.name);

  console.log(`[1] Total Tables in DB: ${existingTables.length} / ${expectedTables.length}`);
  for (const table of expectedTables) {
    if (!existingTables.includes(table)) {
      throw new Error(`Missing expected table: ${table}`);
    }
  }

  // 2. Check foreign key pragma
  const fkStatus = db.pragma('foreign_keys', { simple: true });
  console.log(`[2] Foreign Key Constraints: ${fkStatus ? 'ENABLED' : 'DISABLED'}`);
  if (!fkStatus) {
    throw new Error('Foreign key enforcement is disabled!');
  }

  // 3. Foreign key integrity check
  const fkCheck = db.pragma('foreign_key_check');
  console.log(`[3] Foreign Key Violations Found: ${fkCheck.length}`);
  if (fkCheck.length > 0) {
    console.error('Violations:', fkCheck);
    throw new Error('Database contains foreign key integrity violations');
  }

  // 4. Check system settings table
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  console.log(`[4] System Settings Initialized: ${settingsCount} parameters`);
  if (settingsCount === 0) {
    throw new Error('Default settings not populated');
  }

  // 5. Check dissertations count
  const dissCount = db.prepare('SELECT COUNT(*) as count FROM dissertations').get().count;
  console.log(`[5] Seeded Dissertations: ${dissCount} records`);

  console.log('\nAll database integrity checks passed successfully!\n');
  closeDb();
  process.exit(0);
}

validateDatabase();
