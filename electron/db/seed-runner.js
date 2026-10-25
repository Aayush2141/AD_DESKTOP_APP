const { initDb, closeDb } = require('./index');
const { seedDatabase } = require('./seed');

try {
  const db = initDb();
  seedDatabase(db);
  closeDb();
  console.log('Seed runner completed successfully.');
  process.exit(0);
} catch (err) {
  console.error('Seed runner failed:', err);
  process.exit(1);
}
