const { getDb } = require('../db');
const { checkDuplicateSimilarity } = require('./similarityService');

// State machine definition
const VALID_TRANSITIONS = {
  'Draft': ['Submitted'],
  'Submitted': ['Topic Approved', 'Topic Rejected', 'Topic Revision Requested', 'Ethics Review'],
  'Topic Revision Requested': ['Submitted'],
  'Topic Rejected': ['Draft', 'Submitted'],
  'Topic Approved': ['Ethics Review', 'In Progress'],
  'Ethics Review': ['Ethics Cleared', 'Ethics Rejected', 'In Progress'],
  'Ethics Cleared': ['In Progress'],
  'Ethics Rejected': ['Ethics Review', 'Topic Revision Requested'],
  'In Progress': ['Submitted for Evaluation'],
  'Submitted for Evaluation': ['Evaluated - Approved', 'Evaluated - Disapproved', 'Evaluated - Resubmit'],
  'Evaluated - Resubmit': ['In Progress', 'Submitted for Evaluation'],
  'Evaluated - Disapproved': ['In Progress', 'Submitted for Evaluation'],
  'Evaluated - Approved': [] // Terminal
};

function getDissertations(filters = {}, user = null) {
  const db = getDb();
  let query = `
    SELECT d.*, 
           s.enrollment_no, s.final_year_result_status,
           u_s.full_name as student_name, u_s.email as student_email,
           u_g.full_name as guide_name, u_g.email as guide_email,
           g.designation as guide_designation, g.max_capacity as guide_max_capacity, g.current_load as guide_current_load,
           dept.name as department_name, dept.code as department_code,
           col.name as college_name, col.code as college_code,
           ta.name as thrust_area_name,
           (SELECT COUNT(*) FROM progress_reports pr WHERE pr.dissertation_id = d.id) as progress_count,
           (SELECT COUNT(*) FROM publications pub WHERE pub.dissertation_id = d.id) as publications_count,
           (SELECT ec.status FROM ethics_clearances ec WHERE ec.dissertation_id = d.id) as ethics_status,
           (SELECT ec.study_type FROM ethics_clearances ec WHERE ec.dissertation_id = d.id) as ethics_study_type,
           (SELECT ev.final_result FROM evaluations ev WHERE ev.dissertation_id = d.id) as evaluation_result,
           (SELECT ev.total_percentage FROM evaluations ev WHERE ev.dissertation_id = d.id) as evaluation_percentage
    FROM dissertations d
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    LEFT JOIN guides g ON d.guide_id = g.id
    LEFT JOIN users u_g ON g.user_id = u_g.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    LEFT JOIN thrust_areas ta ON d.thrust_area_id = ta.id
    WHERE 1=1
  `;

  const params = [];

  // Scoping for specific role dashboards (if not repository search)
  if (filters.scoped && user) {
    if (user.role === 'student' && user.student_id) {
      query += ` AND d.student_id = ? `;
      params.push(user.student_id);
    } else if (user.role === 'guide' && user.guide_id) {
      query += ` AND d.guide_id = ? `;
      params.push(user.guide_id);
    } else if (user.role === 'hod' && user.department_id) {
      query += ` AND d.department_id = ? `;
      params.push(user.department_id);
    } else if (user.role === 'ethics') {
      // Ethics committee focuses on ethics review and cleared
      if (filters.ethicsOnly) {
        query += ` AND (d.status IN ('Ethics Review', 'Ethics Cleared', 'Ethics Rejected', 'Topic Approved') OR EXISTS (SELECT 1 FROM ethics_clearances ec WHERE ec.dissertation_id = d.id)) `;
      }
    }
  }

  // Filters
  if (filters.category) {
    query += ` AND d.category = ? `;
    params.push(filters.category);
  }
  if (filters.status) {
    query += ` AND d.status = ? `;
    params.push(filters.status);
  }
  if (filters.department_id) {
    query += ` AND d.department_id = ? `;
    params.push(Number(filters.department_id));
  }
  if (filters.college_id) {
    query += ` AND d.college_id = ? `;
    params.push(Number(filters.college_id));
  }
  if (filters.guide_id) {
    query += ` AND d.guide_id = ? `;
    params.push(Number(filters.guide_id));
  }
  if (filters.thrust_area_id) {
    query += ` AND d.thrust_area_id = ? `;
    params.push(Number(filters.thrust_area_id));
  }
  if (filters.year) {
    query += ` AND strftime('%Y', d.created_at) = ? `;
    params.push(String(filters.year));
  }
  if (filters.search) {
    const sTerm = `%${filters.search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(d.title) LIKE ? OR 
      LOWER(d.abstract) LIKE ? OR 
      LOWER(d.keywords) LIKE ? OR 
      LOWER(u_s.full_name) LIKE ? OR 
      LOWER(s.enrollment_no) LIKE ? OR
      LOWER(u_g.full_name) LIKE ?
    ) `;
    params.push(sTerm, sTerm, sTerm, sTerm, sTerm, sTerm);
  }

  // Sort
  query += ` ORDER BY d.updated_at DESC, d.id DESC `;

  return db.prepare(query).all(...params);
}

function getDissertationById(id) {
  const db = getDb();
  const dissertation = db.prepare(`
    SELECT d.*, 
           s.id as student_id, s.enrollment_no, s.final_year_result_status, s.admission_year,
           u_s.id as student_user_id, u_s.full_name as student_name, u_s.email as student_email, u_s.phone as student_phone,
           u_g.id as guide_user_id, u_g.full_name as guide_name, u_g.email as guide_email, u_g.phone as guide_phone,
           g.id as guide_id, g.designation as guide_designation, g.max_capacity as guide_max_capacity, g.current_load as guide_current_load,
           dept.id as department_id, dept.name as department_name, dept.code as department_code,
           col.id as college_id, col.name as college_name, col.code as college_code,
           ta.id as thrust_area_id, ta.name as thrust_area_name, ta.description as thrust_area_description
    FROM dissertations d
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    LEFT JOIN guides g ON d.guide_id = g.id
    LEFT JOIN users u_g ON g.user_id = u_g.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
    LEFT JOIN thrust_areas ta ON d.thrust_area_id = ta.id
    WHERE d.id = ?
  `).get(id);

  if (!dissertation) return null;

  // Attached Milestones
  dissertation.milestones = db.prepare(`
    SELECT * FROM milestones WHERE dissertation_id = ? ORDER BY order_index ASC
  `).all(id);

  // Attached Ethics Clearance
  dissertation.ethics_clearance = db.prepare(`
    SELECT ec.*, u.full_name as reviewer_name
    FROM ethics_clearances ec
    LEFT JOIN users u ON ec.reviewed_by = u.id
    WHERE ec.dissertation_id = ?
  `).get(id);

  // Attached Progress Reports
  dissertation.progress_reports = db.prepare(`
    SELECT * FROM progress_reports WHERE dissertation_id = ? ORDER BY created_at DESC
  `).all(id);

  // Attached Evaluation
  dissertation.evaluation = db.prepare(`
    SELECT * FROM evaluations WHERE dissertation_id = ?
  `).get(id);

  // Attached Publications
  dissertation.publications = db.prepare(`
    SELECT * FROM publications WHERE dissertation_id = ? ORDER BY publication_year DESC
  `).all(id);

  // Attached Documents
  dissertation.documents = db.prepare(`
    SELECT doc.*, u.full_name as uploaded_by_name
    FROM documents doc
    LEFT JOIN users u ON doc.uploaded_by = u.id
    WHERE doc.dissertation_id = ?
    ORDER BY doc.created_at DESC
  `).all(id);

  // Attached Approvals History
  dissertation.approvals = db.prepare(`
    SELECT a.*, u.full_name as actor_name
    FROM approvals a
    LEFT JOIN users u ON a.actor_id = u.id
    WHERE a.dissertation_id = ?
    ORDER BY a.created_at DESC
  `).all(id);

  return dissertation;
}

function checkDuplicate(topicData) {
  const db = getDb();
  // Fetch existing dissertations to compare
  const existing = db.prepare(`
    SELECT d.id, d.title, d.abstract, d.keywords, d.status, d.created_at,
           u_g.full_name as guide_name, dept.name as department_name, col.name as college_name
    FROM dissertations d
    LEFT JOIN guides g ON d.guide_id = g.id
    LEFT JOIN users u_g ON g.user_id = u_g.id
    JOIN departments dept ON d.department_id = dept.id
    JOIN colleges col ON d.college_id = col.id
  `).all();

  const thresholdRow = db.prepare(`SELECT value FROM settings WHERE key = 'duplicate_similarity_threshold'`).get();
  const threshold = thresholdRow ? parseFloat(thresholdRow.value) : 0.45;

  return checkDuplicateSimilarity(topicData, existing, threshold);
}

function checkGuideCapacity(guideId) {
  const db = getDb();
  const guide = db.prepare(`
    SELECT g.*, u.full_name
    FROM guides g
    JOIN users u ON g.user_id = u.id
    WHERE g.id = ?
  `).get(guideId);

  if (!guide) {
    throw new Error('Guide not found');
  }

  // Active dissertations count (in progress or submitted)
  const activeCount = db.prepare(`
    SELECT COUNT(*) as active_count
    FROM dissertations
    WHERE guide_id = ? AND status NOT IN ('Draft', 'Topic Rejected', 'Evaluated - Approved', 'Evaluated - Disapproved')
  `).get(guideId).active_count;

  const isFull = activeCount >= guide.max_capacity;

  return {
    guideId: guide.id,
    guideName: guide.full_name,
    designation: guide.designation,
    maxCapacity: guide.max_capacity,
    currentLoad: activeCount,
    availableSlots: Math.max(0, guide.max_capacity - activeCount),
    isFull
  };
}

function createDissertation(data, user) {
  const db = getDb();

  // Validate student user
  if (user.role !== 'student') {
    throw new Error('Only students can propose new dissertation topics');
  }

  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  if (!student) {
    throw new Error('Student record not found for user');
  }

  // Check duplicate similarity
  const dupResult = checkDuplicate({
    title: data.title,
    abstract: data.abstract,
    keywords: data.keywords,
  });

  // If similarity is above threshold and not forced/draft
  if (dupResult.isDuplicate && data.status !== 'Draft' && !data.forceOverride) {
    const topMatch = dupResult.matches[0];
    const err = new Error(`Topic duplication detected (${Math.round(dupResult.highestScore * 100)}% match with existing dissertation #${topMatch.id}: "${topMatch.title}"). Duplicate submission blocked.`);
    err.duplicateData = dupResult;
    throw err;
  }

  // Check Guide Capacity if guide assigned
  const guideId = data.guide_id || student.guide_id || null;
  if (guideId && data.status !== 'Draft') {
    const capacity = checkGuideCapacity(guideId);
    if (capacity.isFull) {
      throw new Error(`Guide ${capacity.guideName} has reached maximum student capacity (${capacity.currentLoad}/${capacity.maxCapacity}). Please select another guide or contact your HOD.`);
    }
  }

  const initialStatus = data.status === 'Draft' ? 'Draft' : 'Submitted';
  const submissionDate = initialStatus === 'Submitted' ? new Date().toISOString() : null;

  const stmt = db.prepare(`
    INSERT INTO dissertations (
      student_id, guide_id, department_id, college_id, thrust_area_id,
      title, abstract, keywords, category, status, similarity_score,
      duplicate_matched_id, submission_date, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const topMatchId = dupResult.matches.length > 0 ? dupResult.matches[0].id : null;

  const res = stmt.run(
    student.id,
    guideId,
    student.department_id,
    student.college_id,
    data.thrust_area_id || null,
    data.title.trim(),
    data.abstract.trim(),
    data.keywords.trim(),
    data.category || 'Clinical Research',
    initialStatus,
    dupResult.highestScore,
    topMatchId,
    submissionDate,
    data.remarks || null
  );

  const newId = res.lastInsertRowid;

  // Insert standard milestones template
  const defaultMilestones = [
    { name: 'Synopsis & Departmental Protocol Approval', days: 30 },
    { name: 'Institutional Ethics Committee Clearance', days: 60 },
    { name: 'Subject Screening & Research Interventions', days: 180 },
    { name: 'Statistical Compilation & Bio-Analysis', days: 270 },
    { name: 'Thesis Draft Guide Verification', days: 330 },
    { name: 'Final Dissertation Submission & Pre-Defense', days: 365 },
  ];

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (dissertation_id, name, order_index, due_date, status)
    VALUES (?, ?, ?, date('now', '+' || ? || ' days'), 'Not Started')
  `);

  defaultMilestones.forEach((m, idx) => {
    insertMilestone.run(newId, m.name, idx + 1, m.days);
  });

  // Approval record
  db.prepare(`
    INSERT INTO approvals (dissertation_id, stage, action, actor_id, actor_role, comments)
    VALUES (?, 'Topic Proposal', ?, ?, 'student', ?)
  `).run(newId, initialStatus === 'Draft' ? 'SAVE_DRAFT' : 'SUBMIT', user.id, data.remarks || 'Initial topic proposed by scholar');

  // Update guide current load if guide assigned and submitted
  if (guideId && initialStatus === 'Submitted') {
    updateGuideLoad(guideId);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'TOPIC_SUBMITTED', 'Dissertation', ?, ?)
  `).run(user.id, user.full_name, user.role, newId, `Dissertation topic proposed: "${data.title}" (Status: ${initialStatus})`);

  // Notifications
  if (initialStatus === 'Submitted') {
    // Notify HOD
    const hod = db.prepare(`SELECT user_id FROM users WHERE role = 'hod' AND department_id = ?`).get(student.department_id);
    if (hod) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
        VALUES (?, 'New Topic Submission', ?, 'info', 'dissertation', ?)
      `).run(hod.user_id, `Scholar ${user.full_name} submitted topic "${data.title.substring(0, 45)}..." for approval.`, newId);
    }
    // Notify Guide if assigned
    if (guideId) {
      const guideUser = db.prepare('SELECT user_id FROM guides WHERE id = ?').get(guideId);
      if (guideUser) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
          VALUES (?, 'Scholar Topic Assigned', ?, 'info', 'dissertation', ?)
        `).run(guideUser.user_id, `You were proposed as guide for scholar ${user.full_name}.`, newId);
      }
    }
  }

  return getDissertationById(newId);
}

function updateDissertation(id, data, user) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM dissertations WHERE id = ?').get(id);
  if (!existing) {
    throw new Error('Dissertation not found');
  }

  // Check duplicate similarity if title/abstract/keywords changed
  let highestScore = existing.similarity_score;
  let topMatchId = existing.duplicate_matched_id;

  if (data.title || data.abstract || data.keywords) {
    const dupResult = checkDuplicate({
      title: data.title || existing.title,
      abstract: data.abstract || existing.abstract,
      keywords: data.keywords || existing.keywords,
      excludeId: id,
    });
    highestScore = dupResult.highestScore;
    topMatchId = dupResult.matches.length > 0 ? dupResult.matches[0].id : null;

    if (dupResult.isDuplicate && data.status !== 'Draft' && !data.forceOverride) {
      const err = new Error(`Topic duplication detected (${Math.round(highestScore * 100)}% match).`);
      err.duplicateData = dupResult;
      throw err;
    }
  }

  // Guide capacity check if changing guide
  if (data.guide_id && data.guide_id !== existing.guide_id) {
    const capacity = checkGuideCapacity(data.guide_id);
    if (capacity.isFull) {
      throw new Error(`Guide ${capacity.guideName} is at capacity (${capacity.currentLoad}/${capacity.maxCapacity})`);
    }
  }

  const stmt = db.prepare(`
    UPDATE dissertations SET
      title = COALESCE(?, title),
      abstract = COALESCE(?, abstract),
      keywords = COALESCE(?, keywords),
      category = COALESCE(?, category),
      thrust_area_id = COALESCE(?, thrust_area_id),
      guide_id = COALESCE(?, guide_id),
      status = COALESCE(?, status),
      similarity_score = ?,
      duplicate_matched_id = ?,
      submission_date = CASE WHEN ? = 'Submitted' AND submission_date IS NULL THEN CURRENT_TIMESTAMP ELSE submission_date END,
      remarks = COALESCE(?, remarks),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    data.title || null,
    data.abstract || null,
    data.keywords || null,
    data.category || null,
    data.thrust_area_id || null,
    data.guide_id || null,
    data.status || null,
    highestScore,
    topMatchId,
    data.status || null,
    data.remarks || null,
    id
  );

  // If status changed to Submitted from Draft
  if (existing.status === 'Draft' && data.status === 'Submitted') {
    db.prepare(`
      INSERT INTO approvals (dissertation_id, stage, action, actor_id, actor_role, comments)
      VALUES (?, 'Topic Proposal', 'SUBMIT', ?, 'student', 'Draft submitted for approval')
    `).run(id, user.id);
  }

  if (data.guide_id) {
    updateGuideLoad(data.guide_id);
  }
  if (existing.guide_id && existing.guide_id !== data.guide_id) {
    updateGuideLoad(existing.guide_id);
  }

  return getDissertationById(id);
}

function transitionStatus(id, newStatus, comments = '', actor) {
  const db = getDb();
  const d = db.prepare(`
    SELECT d.*, s.user_id as student_user_id, s.id as s_id, s.final_year_result_status,
           u_s.full_name as student_name
    FROM dissertations d
    JOIN students s ON d.student_id = s.id
    JOIN users u_s ON s.user_id = u_s.id
    WHERE d.id = ?
  `).get(id);

  if (!d) throw new Error('Dissertation not found');

  const allowed = VALID_TRANSITIONS[d.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid state transition from "${d.status}" to "${newStatus}". Allowed next states: ${allowed.join(', ') || 'None'}`);
  }

  // Update status in DB
  const updateStmt = db.prepare(`
    UPDATE dissertations SET 
      status = ?,
      approval_date = CASE WHEN ? IN ('Topic Approved', 'In Progress') AND approval_date IS NULL THEN CURRENT_TIMESTAMP ELSE approval_date END,
      completion_date = CASE WHEN ? IN ('Evaluated - Approved', 'Evaluated - Disapproved') THEN CURRENT_TIMESTAMP ELSE completion_date END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateStmt.run(newStatus, newStatus, newStatus, id);

  // Automatic University Result Withholding / Release Logic
  if (newStatus === 'Evaluated - Approved') {
    // Release student's university result!
    db.prepare(`
      UPDATE students SET final_year_result_status = 'RELEASED' WHERE id = ?
    `).run(d.s_id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, 'RESULT_RELEASE', 'Student', ?, ?)
    `).run(actor.id, actor.full_name, actor.role, d.s_id, `University Final-Year result officially RELEASED for ${d.student_name} upon dissertation approval.`);

    // High priority notification to student
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
      VALUES (?, 'Congratulations! University Result RELEASED', ?, 'success', 'result', ?)
    `).run(d.student_user_id, `Your PG Dissertation "${d.title.substring(0, 40)}..." has been Approved. Your final-year degree results are now RELEASED.`, id);
  } else if (newStatus === 'Evaluated - Disapproved') {
    // Withhold student's university result!
    db.prepare(`
      UPDATE students SET final_year_result_status = 'WITHHELD' WHERE id = ?
    `).run(d.s_id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, 'RESULT_WITHHOLD', 'Student', ?, ?)
    `).run(actor.id, actor.full_name, actor.role, d.s_id, `University Final-Year result WITHHELD for ${d.student_name} due to dissertation disapproval.`);

    // Urgent notification to student
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
      VALUES (?, 'Notice: University Result WITHHELD', ?, 'danger', 'result', ?)
    `).run(d.student_user_id, `Your PG Dissertation has been Disapproved. Per University norms, your final degree result is WITHHELD pending re-submission.`, id);
  }

  // Create approval record
  db.prepare(`
    INSERT INTO approvals (dissertation_id, stage, action, actor_id, actor_role, comments)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, d.status + ' -> ' + newStatus, newStatus, actor.id, actor.role, comments || `Status moved to ${newStatus}`);

  // Create audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'WORKFLOW_TRANSITION', 'Dissertation', ?, ?)
  `).run(actor.id, actor.full_name, actor.role, id, `Dissertation transitioned from "${d.status}" to "${newStatus}". Comments: ${comments || 'N/A'}`);

  // Notify student of any workflow change
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
    VALUES (?, ?, ?, 'info', 'dissertation', ?)
  `).run(
    d.student_user_id,
    `Dissertation Status Update: ${newStatus}`,
    `Your dissertation has moved to "${newStatus}". Remarks: ${comments || 'No remarks provided.'}`,
    id
  );

  if (d.guide_id) {
    updateGuideLoad(d.guide_id);
  }

  return getDissertationById(id);
}

function assignGuide(dissertationId, guideId, actor) {
  const db = getDb();
  const capacity = checkGuideCapacity(guideId);
  if (capacity.isFull) {
    throw new Error(`Cannot assign guide: ${capacity.guideName} is already at full capacity (${capacity.currentLoad}/${capacity.maxCapacity} scholars).`);
  }

  const d = db.prepare('SELECT * FROM dissertations WHERE id = ?').get(dissertationId);
  if (!d) throw new Error('Dissertation not found');

  const oldGuideId = d.guide_id;

  db.prepare(`
    UPDATE dissertations SET guide_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(guideId, dissertationId);

  // Update student table's guide_id
  db.prepare(`
    UPDATE students SET guide_id = ? WHERE id = ?
  `).run(guideId, d.student_id);

  // Recalculate loads
  updateGuideLoad(guideId);
  if (oldGuideId) updateGuideLoad(oldGuideId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'ASSIGN_GUIDE', 'Dissertation', ?, ?)
  `).run(actor.id, actor.full_name, actor.role, dissertationId, `Assigned guide ${capacity.guideName} to dissertation #${dissertationId}`);

  // Notify guide
  const guideUser = db.prepare('SELECT user_id FROM guides WHERE id = ?').get(guideId);
  if (guideUser) {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link_type, link_id)
      VALUES (?, 'Scholar Assigned to You', ?, 'info', 'dissertation', ?)
    `).run(guideUser.user_id, `You have been officially assigned as guide for dissertation #${dissertationId}: "${d.title}".`, dissertationId);
  }

  return getDissertationById(dissertationId);
}

function updateGuideLoad(guideId) {
  const db = getDb();
  const activeCount = db.prepare(`
    SELECT COUNT(*) as count FROM dissertations
    WHERE guide_id = ? AND status NOT IN ('Draft', 'Topic Rejected', 'Evaluated - Approved', 'Evaluated - Disapproved')
  `).get(guideId).count;

  db.prepare(`UPDATE guides SET current_load = ? WHERE id = ?`).run(activeCount, guideId);
}

module.exports = {
  getDissertations,
  getDissertationById,
  createDissertation,
  updateDissertation,
  transitionStatus,
  assignGuide,
  checkDuplicate,
  checkGuideCapacity,
};
