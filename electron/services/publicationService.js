const { getDb } = require('../db');

function getPublications(filters = {}) {
  const db = getDb();
  let query = `
    SELECT p.*, d.title as dissertation_title,
           u_s.full_name as student_name, s.enrollment_no,
           dept.name as department_name, col.name as college_name
    FROM publications p
    JOIN dissertations d ON p.dissertation_id = d.id
    JOIN students s ON p.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.dissertation_id) {
    query += ' AND p.dissertation_id = ? ';
    params.push(filters.dissertation_id);
  }
  if (filters.student_id) {
    query += ' AND p.student_id = ? ';
    params.push(filters.student_id);
  }
  if (filters.indexing) {
    query += ' AND p.indexing = ? ';
    params.push(filters.indexing);
  }
  if (filters.status) {
    query += ' AND p.status = ? ';
    params.push(filters.status);
  }

  query += ' ORDER BY p.publication_year DESC, p.created_at DESC ';
  return db.prepare(query).all(...params);
}

function addPublication(data, user) {
  const db = getDb();
  const d = db.prepare('SELECT student_id, title FROM dissertations WHERE id = ?').get(data.dissertation_id);
  if (!d) throw new Error('Dissertation not found');

  const stmt = db.prepare(`
    INSERT INTO publications (
      dissertation_id, student_id, title, journal_name, doi,
      indexing, publication_year, status, url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    data.dissertation_id,
    d.student_id,
    data.title.trim(),
    data.journal_name.trim(),
    data.doi ? data.doi.trim() : null,
    data.indexing || 'Peer-Reviewed',
    parseInt(data.publication_year) || new Date().getFullYear(),
    data.status || 'Published',
    data.url ? data.url.trim() : null
  );

  const pubId = res.lastInsertRowid;

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'ADD_PUBLICATION', 'Publication', ?, ?)
  `).run(user.id, user.full_name, user.role, pubId, `Recorded publication "${data.title}" in ${data.journal_name} (${data.indexing})`);

  return db.prepare('SELECT * FROM publications WHERE id = ?').get(pubId);
}

function deletePublication(id, user) {
  const db = getDb();
  db.prepare('DELETE FROM publications WHERE id = ?').run(id);
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'DELETE_PUBLICATION', 'Publication', ?, 'Deleted publication')
  `).run(user.id, user.full_name, user.role, id);
  return { success: true };
}

module.exports = {
  getPublications,
  addPublication,
  deletePublication,
};
