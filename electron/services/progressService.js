const { getDb } = require('../db');

function getMilestones(dissertationId) {
  const db = getDb();
  const milestones = db.prepare(`
    SELECT * FROM milestones WHERE dissertation_id = ? ORDER BY order_index ASC
  `).all(dissertationId);

  const today = new Date().toISOString().split('T')[0];
  let completedCount = 0;

  const processed = milestones.map(m => {
    let currentStatus = m.status;
    if (m.status !== 'Completed' && m.due_date && m.due_date < today) {
      currentStatus = 'Overdue';
    }
    if (m.status === 'Completed') {
      completedCount++;
    }
    return {
      ...m,
      effectiveStatus: currentStatus,
      isOverdue: currentStatus === 'Overdue'
    };
  });

  const total = processed.length || 1;
  const progressPercentage = Math.round((completedCount / total) * 100);

  return {
    milestones: processed,
    totalCount: total,
    completedCount,
    progressPercentage
  };
}

function updateMilestone(id, data, user) {
  const db = getDb();
  const m = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  if (!m) throw new Error('Milestone not found');

  const completionDate = data.status === 'Completed' ? (data.completion_date || new Date().toISOString().split('T')[0]) : null;

  db.prepare(`
    UPDATE milestones SET
      status = COALESCE(?, status),
      completion_date = ?,
      remarks = COALESCE(?, remarks),
      due_date = COALESCE(?, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.status || null,
    completionDate,
    data.remarks || null,
    data.due_date || null,
    id
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'UPDATE_MILESTONE', 'Milestone', ?, ?)
  `).run(user.id, user.full_name, user.role, id, `Milestone "${m.name}" updated to status: ${data.status || m.status}`);

  return getMilestones(m.dissertation_id);
}

function submitProgressReport(data, user) {
  const db = getDb();
  const d = db.prepare(`
    SELECT d.*, s.id as student_id
    FROM dissertations d
    JOIN students s ON d.student_id = s.id
    WHERE d.id = ?
  `).get(data.dissertation_id);

  if (!d) throw new Error('Dissertation not found');

  const stmt = db.prepare(`
    INSERT INTO progress_reports (
      dissertation_id, student_id, report_period, work_summary, challenges_faced,
      planned_next, file_path, file_name, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
  `);

  const res = stmt.run(
    data.dissertation_id,
    d.student_id,
    data.report_period,
    data.work_summary,
    data.challenges_faced || null,
    data.planned_next || null,
    data.file_path || null,
    data.file_name || null
  );

  const reportId = res.lastInsertRowid;

  // Notify Guide
  if (d.guide_id) {
    const guide = db.prepare('SELECT user_id FROM guides WHERE id = ?').get(d.guide_id);
    if (guide) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
        VALUES (?, 'New Progress Report Submitted', ?, 'info', 'progress', ?)
      `).run(guide.user_id, `Scholar ${user.full_name} submitted progress report for "${data.report_period}". Rating & review required.`, d.id);
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'SUBMIT_PROGRESS_REPORT', 'ProgressReport', ?, ?)
  `).run(user.id, user.full_name, user.role, reportId, `Progress report submitted for period: ${data.report_period}`);

  return db.prepare('SELECT * FROM progress_reports WHERE id = ?').get(reportId);
}

function reviewProgressReport(data, user) {
  const db = getDb();
  const report = db.prepare(`
    SELECT pr.*, d.student_id, s.user_id as student_user_id, d.title as dissertation_title
    FROM progress_reports pr
    JOIN dissertations d ON pr.dissertation_id = d.id
    JOIN students s ON d.student_id = s.id
    WHERE pr.id = ?
  `).get(data.id);

  if (!report) throw new Error('Progress report not found');

  db.prepare(`
    UPDATE progress_reports SET
      guide_feedback = ?,
      guide_rating = ?,
      guide_reviewed_at = CURRENT_TIMESTAMP,
      status = ?
    WHERE id = ?
  `).run(
    data.guide_feedback || 'Satisfactory progress maintained.',
    data.guide_rating || 4,
    data.status || 'Reviewed',
    data.id
  );

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
    VALUES (?, 'Guide Feedback on Progress Report', ?, 'success', 'progress', ?)
  `).run(
    report.student_user_id,
    `Your guide reviewed your ${report.report_period} report. Rating: ${data.guide_rating || 4}/5 stars.`,
    report.dissertation_id
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'REVIEW_PROGRESS_REPORT', 'ProgressReport', ?, ?)
  `).run(user.id, user.full_name, user.role, data.id, `Progress report #${data.id} reviewed with rating ${data.guide_rating || 4}/5`);

  return db.prepare('SELECT * FROM progress_reports WHERE id = ?').get(data.id);
}

function getOverdueDissertations() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  return db.prepare(`
    SELECT DISTINCT d.id, d.title, d.status,
           s.enrollment_no, u_s.full_name as student_name, u_s.email as student_email,
           u_g.full_name as guide_name, dept.name as department_name, col.name as college_name,
           m.name as overdue_milestone, m.due_date
    FROM milestones m
    JOIN dissertations d ON m.dissertation_id = d.id
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    LEFT JOIN guides g ON d.guide_id = g.id
    LEFT JOIN users u_g ON g.user_id = u_g.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    WHERE m.status != 'Completed' AND m.due_date < ? AND d.status NOT IN ('Evaluated - Approved', 'Evaluated - Disapproved')
    ORDER BY m.due_date ASC
  `).all(today);
}

module.exports = {
  getMilestones,
  updateMilestone,
  submitProgressReport,
  reviewProgressReport,
  getOverdueDissertations,
};
