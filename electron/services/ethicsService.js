const { getDb } = require('../db');
const { transitionStatus } = require('./dissertationService');

function getEthicsClearance(dissertationId) {
  const db = getDb();
  return db.prepare(`
    SELECT ec.*, u.full_name as reviewed_by_name,
           d.title as dissertation_title, d.status as dissertation_status,
           u_s.full_name as student_name, s.enrollment_no,
           dept.name as department_name, col.name as college_name
    FROM ethics_clearances ec
    JOIN dissertations d ON ec.dissertation_id = d.id
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    LEFT JOIN users u ON ec.reviewed_by = u.id
    WHERE ec.dissertation_id = ?
  `).get(dissertationId);
}

function getAllEthicsClearances(filters = {}) {
  const db = getDb();
  let query = `
    SELECT ec.*, u.full_name as reviewed_by_name,
           d.title as dissertation_title, d.status as dissertation_status,
           u_s.full_name as student_name, s.enrollment_no,
           dept.name as department_name, col.name as college_name
    FROM ethics_clearances ec
    JOIN dissertations d ON ec.dissertation_id = d.id
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    LEFT JOIN users u ON ec.reviewed_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ' AND ec.status = ? ';
    params.push(filters.status);
  }
  if (filters.study_type) {
    query += ' AND ec.study_type = ? ';
    params.push(filters.study_type);
  }
  if (filters.risk_level) {
    query += ' AND ec.risk_level = ? ';
    params.push(filters.risk_level);
  }

  query += ' ORDER BY ec.created_at DESC ';
  return db.prepare(query).all(...params);
}

function submitEthicsClearance(data, user) {
  const db = getDb();
  const d = db.prepare('SELECT * FROM dissertations WHERE id = ?').get(data.dissertation_id);
  if (!d) throw new Error('Dissertation not found');

  const existing = db.prepare('SELECT * FROM ethics_clearances WHERE dissertation_id = ?').get(data.dissertation_id);

  if (existing) {
    db.prepare(`
      UPDATE ethics_clearances SET
        study_type = ?,
        risk_level = ?,
        consent_details = ?,
        ethical_justification = ?,
        document_path = COALESCE(?, document_path),
        document_name = COALESCE(?, document_name),
        status = 'Pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE dissertation_id = ?
    `).run(
      data.study_type,
      data.risk_level,
      data.consent_details,
      data.ethical_justification,
      data.document_path || null,
      data.document_name || null,
      data.dissertation_id
    );
  } else {
    db.prepare(`
      INSERT INTO ethics_clearances (
        dissertation_id, study_type, risk_level, consent_details, ethical_justification,
        document_path, document_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      data.dissertation_id,
      data.study_type,
      data.risk_level,
      data.consent_details,
      data.ethical_justification,
      data.document_path || null,
      data.document_name || null
    );
  }

  // Move dissertation to 'Ethics Review' if not already
  if (d.status === 'Topic Approved' || d.status === 'Submitted') {
    transitionStatus(d.id, 'Ethics Review', 'Submitted ethics dossier for Institutional Ethics Committee review', user);
  }

  // Notify Ethics Committee members
  const ethicsUsers = db.prepare(`SELECT id FROM users WHERE role = 'ethics'`).all();
  ethicsUsers.forEach(eu => {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
      VALUES (?, 'Ethics Dossier Submitted', ?, 'info', 'ethics', ?)
    `).run(eu.id, `Ethics protocol submitted for "${d.title.substring(0, 45)}...". Review required.`, d.id);
  });

  return getEthicsClearance(data.dissertation_id);
}

function reviewEthicsClearance(data, user) {
  const db = getDb();
  if (user.role !== 'ethics' && user.role !== 'admin') {
    throw new Error('Only Ethics Committee members or Admin can review ethical clearance');
  }

  const { dissertation_id, status, committee_comments } = data; // status: 'Cleared', 'Rejected', 'Changes Requested'
  if (!['Cleared', 'Rejected', 'Changes Requested'].includes(status)) {
    throw new Error('Invalid ethics status: must be Cleared, Rejected, or Changes Requested');
  }

  db.prepare(`
    UPDATE ethics_clearances SET
      status = ?,
      committee_comments = ?,
      reviewed_by = ?,
      reviewed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE dissertation_id = ?
  `).run(status, committee_comments || '', user.id, dissertation_id);

  // Transition dissertation workflow
  let nextDissertationStatus;
  if (status === 'Cleared') {
    nextDissertationStatus = 'Ethics Cleared';
  } else if (status === 'Rejected') {
    nextDissertationStatus = 'Ethics Rejected';
  } else {
    nextDissertationStatus = 'Ethics Review'; // stays in review, but flagged changes requested
  }

  const d = db.prepare('SELECT status FROM dissertations WHERE id = ?').get(dissertation_id);
  if (d.status !== nextDissertationStatus) {
    transitionStatus(dissertation_id, nextDissertationStatus, `Ethics Committee verdict: ${status}. Comments: ${committee_comments}`, user);
    // If cleared, can proceed to In Progress
    if (status === 'Cleared') {
      transitionStatus(dissertation_id, 'In Progress', 'Ethical clearance approved. Research started in progress.', user);
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'ETHICS_REVIEW_DECISION', 'EthicsClearance', ?, ?)
  `).run(user.id, user.full_name, user.role, dissertation_id, `Ethics review: ${status}. ${committee_comments}`);

  return getEthicsClearance(dissertation_id);
}

module.exports = {
  getEthicsClearance,
  getAllEthicsClearances,
  submitEthicsClearance,
  reviewEthicsClearance,
};
