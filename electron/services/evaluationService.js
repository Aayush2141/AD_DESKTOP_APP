const { getDb } = require('../db');
const { transitionStatus } = require('./dissertationService');

function getEvaluation(dissertationId) {
  const db = getDb();
  return db.prepare(`
    SELECT ev.*, d.title as dissertation_title, d.status as dissertation_status,
           s.enrollment_no, s.final_year_result_status,
           u_s.full_name as student_name, u_s.email as student_email,
           u_g.full_name as guide_name, dept.name as department_name, col.name as college_name
    FROM evaluations ev
    JOIN dissertations d ON ev.dissertation_id = d.id
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    LEFT JOIN guides g ON d.guide_id = g.id
    LEFT JOIN users u_g ON g.user_id = u_g.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    WHERE ev.dissertation_id = ?
  `).get(dissertationId);
}

function submitFinalDissertation(data, user) {
  const db = getDb();
  const d = db.prepare('SELECT * FROM dissertations WHERE id = ?').get(data.dissertation_id);
  if (!d) throw new Error('Dissertation not found');

  // Must be In Progress or Evaluated - Resubmit
  if (!['In Progress', 'Evaluated - Resubmit'].includes(d.status)) {
    throw new Error(`Cannot submit for evaluation while in status: ${d.status}`);
  }

  // Update or insert evaluation shell with thesis file
  const existing = db.prepare('SELECT id FROM evaluations WHERE dissertation_id = ?').get(data.dissertation_id);
  if (existing) {
    db.prepare(`
      UPDATE evaluations SET
        thesis_file_path = ?,
        thesis_file_name = ?,
        final_result = 'Resubmit'
      WHERE dissertation_id = ?
    `).run(data.thesis_file_path, data.thesis_file_name, data.dissertation_id);
  } else {
    db.prepare(`
      INSERT INTO evaluations (
        dissertation_id, thesis_file_path, thesis_file_name, final_result
      ) VALUES (?, ?, ?, 'Resubmit')
    `).run(data.dissertation_id, data.thesis_file_path, data.thesis_file_name);
  }

  // Transition workflow to Submitted for Evaluation
  transitionStatus(d.id, 'Submitted for Evaluation', `Final thesis submitted: ${data.thesis_file_name}`, user);

  // Notify Guide & HOD
  if (d.guide_id) {
    const guide = db.prepare('SELECT user_id FROM guides WHERE id = ?').get(d.guide_id);
    if (guide) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
        VALUES (?, 'Final Dissertation Submitted for Evaluation', ?, 'info', 'evaluation', ?)
      `).run(guide.user_id, `Scholar has submitted complete dissertation for grading and external viva evaluation.`, d.id);
    }
  }

  return getEvaluation(data.dissertation_id);
}

function saveEvaluation(data, user) {
  const db = getDb();
  const {
    dissertation_id,
    guide_score,
    guide_comments,
    external_examiner_name,
    external_score,
    external_comments,
    rubric_scores, // Object with rubric scores { originalResearch, methodology, literatureReview, statisticsData, presentationViva }
    final_result // 'Approved', 'Disapproved', 'Resubmit'
  } = data;

  const d = db.prepare(`
    SELECT d.*, s.id as student_id, s.user_id as student_user_id, u_s.full_name as student_name
    FROM dissertations d
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    WHERE d.id = ?
  `).get(dissertation_id);

  if (!d) throw new Error('Dissertation not found');

  const gScore = parseFloat(guide_score) || 0;
  const eScore = parseFloat(external_score) || 0;
  const totalPercentage = Math.round(((gScore + eScore) / 100) * 100 * 10) / 10;

  const rubricJson = typeof rubric_scores === 'object' ? JSON.stringify(rubric_scores) : rubric_scores;

  const existing = db.prepare('SELECT id FROM evaluations WHERE dissertation_id = ?').get(dissertation_id);

  if (existing) {
    db.prepare(`
      UPDATE evaluations SET
        guide_score = ?,
        guide_comments = ?,
        external_examiner_name = ?,
        external_score = ?,
        external_comments = ?,
        rubric_scores_json = ?,
        total_percentage = ?,
        final_result = ?,
        evaluated_at = CURRENT_TIMESTAMP
      WHERE dissertation_id = ?
    `).run(
      gScore,
      guide_comments || '',
      external_examiner_name || 'External Examination Board',
      eScore,
      external_comments || '',
      rubricJson,
      totalPercentage,
      final_result,
      dissertation_id
    );
  } else {
    db.prepare(`
      INSERT INTO evaluations (
        dissertation_id, guide_score, guide_comments, external_examiner_name,
        external_score, external_comments, rubric_scores_json, total_percentage,
        final_result, evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      dissertation_id,
      gScore,
      guide_comments || '',
      external_examiner_name || 'External Examination Board',
      eScore,
      external_comments || '',
      rubricJson,
      totalPercentage,
      final_result
    );
  }

  // State Machine transition based on result
  let nextStatus;
  if (final_result === 'Approved') {
    nextStatus = 'Evaluated - Approved';
  } else if (final_result === 'Disapproved') {
    nextStatus = 'Evaluated - Disapproved';
  } else {
    nextStatus = 'Evaluated - Resubmit';
  }

  if (d.status !== nextStatus) {
    transitionStatus(dissertation_id, nextStatus, `Evaluation completed with verdict: ${final_result} (Total score: ${totalPercentage}%). Guide: ${gScore}/50, External: ${eScore}/50.`, user);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'EVALUATION_COMPLETED', 'Evaluation', ?, ?)
  `).run(
    user.id,
    user.full_name,
    user.role,
    dissertation_id,
    `Evaluated dissertation #${dissertation_id} as ${final_result} with total score ${totalPercentage}% by ${user.full_name} & ${external_examiner_name || 'External Board'}`
  );

  return getEvaluation(dissertation_id);
}

module.exports = {
  getEvaluation,
  submitFinalDissertation,
  saveEvaluation,
};
