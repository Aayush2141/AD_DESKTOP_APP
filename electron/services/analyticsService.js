const { getDb } = require('../db');

function getDashboardAnalytics(user = null) {
  const db = getDb();

  // 1. Total counts
  const totalDissertations = db.prepare('SELECT COUNT(*) as count FROM dissertations').get().count;
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const totalGuides = db.prepare('SELECT COUNT(*) as count FROM guides').get().count;
  const totalColleges = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count;
  const totalPublications = db.prepare('SELECT COUNT(*) as count FROM publications').get().count;

  // 2. Status distribution
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM dissertations
    GROUP BY status
  `).all();

  const statusMap = {
    'Draft': 0,
    'Submitted': 0,
    'Topic Approved': 0,
    'Topic Revision Requested': 0,
    'Topic Rejected': 0,
    'Ethics Review': 0,
    'Ethics Cleared': 0,
    'In Progress': 0,
    'Submitted for Evaluation': 0,
    'Evaluated - Approved': 0,
    'Evaluated - Disapproved': 0,
    'Evaluated - Resubmit': 0,
  };
  statusRows.forEach(r => {
    statusMap[r.status] = r.count;
  });

  const statusDistribution = Object.keys(statusMap).map(k => ({
    name: k,
    count: statusMap[k],
  }));

  // 3. Department-wise counts
  const departmentCounts = db.prepare(`
    SELECT d.id, d.name, d.code, COUNT(dis.id) as count
    FROM departments d
    LEFT JOIN dissertations dis ON d.id = dis.department_id
    GROUP BY d.id
    ORDER BY count DESC
  `).all();

  // 4. Guide Load & Capacity analysis
  const guideLoads = db.prepare(`
    SELECT g.id, u.full_name as guide_name, g.designation,
           g.max_capacity, g.current_load,
           d.name as department_name, c.name as college_name,
           ROUND(CAST(g.current_load AS FLOAT) / g.max_capacity * 100, 1) as utilization_pct
    FROM guides g
    JOIN users u ON g.user_id = u.id
    JOIN departments d ON g.department_id = d.id
    JOIN colleges c ON g.college_id = c.id
    ORDER BY g.current_load DESC
  `).all();

  // 5. University Final-Year Result Status
  const resultStats = db.prepare(`
    SELECT final_year_result_status as status, COUNT(*) as count
    FROM students
    GROUP BY final_year_result_status
  `).all();

  // 6. Publications by Indexing
  const indexingStats = db.prepare(`
    SELECT indexing, COUNT(*) as count
    FROM publications
    GROUP BY indexing
    ORDER BY count DESC
  `).all();

  // 7. Overdue Milestones count
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = db.prepare(`
    SELECT COUNT(DISTINCT m.dissertation_id) as count
    FROM milestones m
    JOIN dissertations d ON m.dissertation_id = d.id
    WHERE m.status != 'Completed' AND m.due_date < ? AND d.status NOT IN ('Evaluated - Approved', 'Evaluated - Disapproved')
  `).get(today).count;

  // 8. Pending Approvals count (for HOD / Ethics / Admin)
  const pendingApprovalsCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM dissertations
    WHERE status IN ('Submitted', 'Ethics Review', 'Submitted for Evaluation')
  `).get().count;

  // 9. Recent Audit Logs
  const recentLogs = db.prepare(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10
  `).all();

  // User-specific stats
  let userScoped = {};
  if (user) {
    if (user.role === 'student' && user.student_id) {
      const studentD = db.prepare(`
        SELECT d.*, s.final_year_result_status,
               (SELECT COUNT(*) FROM milestones m WHERE m.dissertation_id = d.id AND m.status = 'Completed') as completed_milestones,
               (SELECT COUNT(*) FROM milestones m WHERE m.dissertation_id = d.id) as total_milestones
        FROM dissertations d
        JOIN students s ON d.student_id = s.id
        WHERE d.student_id = ?
        ORDER BY d.id DESC LIMIT 1
      `).get(user.student_id);

      userScoped = {
        myDissertation: studentD || null,
        myResultStatus: user.final_year_result_status,
      };
    } else if (user.role === 'guide' && user.guide_id) {
      const myStudents = db.prepare(`
        SELECT d.id, d.title, d.status, s.enrollment_no, u.full_name as student_name
        FROM dissertations d
        JOIN students s ON d.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE d.guide_id = ?
      `).all(user.guide_id);

      userScoped = {
        myStudents,
        myLoad: user.current_load,
        myMaxCapacity: user.max_capacity,
        pendingReviewCount: myStudents.filter(s => ['Submitted', 'Submitted for Evaluation'].includes(s.status)).length
      };
    } else if (user.role === 'hod' && user.department_id) {
      const deptPending = db.prepare(`
        SELECT COUNT(*) as count FROM dissertations
        WHERE department_id = ? AND status = 'Submitted'
      `).get(user.department_id).count;

      userScoped = {
        pendingDeptApprovals: deptPending
      };
    } else if (user.role === 'ethics') {
      const ethicsPending = db.prepare(`
        SELECT COUNT(*) as count FROM ethics_clearances WHERE status = 'Pending'
      `).get().count;

      userScoped = {
        pendingEthicsReviews: ethicsPending
      };
    }
  }

  return {
    overview: {
      totalDissertations,
      totalStudents,
      totalGuides,
      totalColleges,
      totalPublications,
      overdueCount,
      pendingApprovalsCount,
    },
    statusDistribution,
    departmentCounts,
    guideLoads,
    resultStats,
    indexingStats,
    recentLogs,
    userScoped
  };
}

module.exports = {
  getDashboardAnalytics,
};
