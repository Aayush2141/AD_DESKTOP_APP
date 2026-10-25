const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

let currentSession = null;

function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, 
           c.name as college_name, c.code as college_code,
           d.name as department_name, d.code as department_code,
           s.id as student_id, s.enrollment_no, s.final_year_result_status, s.guide_id as student_guide_id,
           g.id as guide_id, g.designation, g.max_capacity, g.current_load
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN guides g ON u.id = g.user_id
    WHERE LOWER(u.email) = LOWER(?)
  `).get(email.trim());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Remove hash from session payload
  delete user.password_hash;
  currentSession = user;

  // Log successful login in audit_logs
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, 'USER_LOGIN', 'User', ?, ?)
    `).run(user.id, user.full_name, user.role, user.id, `User logged in successfully with role: ${user.role}`);
  } catch (e) {
    console.error('Audit log error on login:', e);
  }

  return user;
}

function logout() {
  if (currentSession) {
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, 'USER_LOGOUT', 'User', ?, 'User logged out')
      `).run(currentSession.id, currentSession.full_name, currentSession.role, currentSession.id);
    } catch (e) {
      // Ignore
    }
  }
  currentSession = null;
  return { success: true };
}

function getCurrentUser() {
  if (!currentSession) return null;

  // Refresh user details from DB to get updated role/result statuses
  const db = getDb();
  const refreshedUser = db.prepare(`
    SELECT u.*, 
           c.name as college_name, c.code as college_code,
           d.name as department_name, d.code as department_code,
           s.id as student_id, s.enrollment_no, s.final_year_result_status, s.guide_id as student_guide_id,
           g.id as guide_id, g.designation, g.max_capacity, g.current_load
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN guides g ON u.id = g.user_id
    WHERE u.id = ?
  `).get(currentSession.id);

  if (refreshedUser) {
    delete refreshedUser.password_hash;
    currentSession = refreshedUser;
  }
  return currentSession;
}

function switchUser(userId) {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, 
           c.name as college_name, c.code as college_code,
           d.name as department_name, d.code as department_code,
           s.id as student_id, s.enrollment_no, s.final_year_result_status, s.guide_id as student_guide_id,
           g.id as guide_id, g.designation, g.max_capacity, g.current_load
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN guides g ON u.id = g.user_id
    WHERE u.id = ?
  `).get(userId);

  if (!user) {
    throw new Error('User not found');
  }

  delete user.password_hash;
  currentSession = user;
  return user;
}

function getDemoAccounts() {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT u.id, u.email, u.full_name, u.role, 
           c.name as college_name, d.name as department_name,
           s.enrollment_no, s.final_year_result_status,
           g.designation, g.max_capacity, g.current_load
    FROM users u
    LEFT JOIN colleges c ON u.college_id = c.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN guides g ON u.id = g.user_id
    WHERE u.email IN (
      'admin@ayush.gov.in',
      'ethics@ayush.gov.in',
      'hod.kaya@nia.edu.in',
      'guide.pancha@nia.edu.in',
      'arjun.sharma@student.ayush.gov.in',
      'meera.iyer@student.ayush.gov.in'
    )
    ORDER BY CASE u.role
      WHEN 'admin' THEN 1
      WHEN 'hod' THEN 2
      WHEN 'guide' THEN 3
      WHEN 'ethics' THEN 4
      WHEN 'student' THEN 5
      ELSE 6
    END
  `).all();

  return accounts.map(acc => {
    let defaultPass = 'admin123';
    if (acc.role === 'hod') defaultPass = 'hod123';
    if (acc.role === 'guide') defaultPass = 'guide123';
    if (acc.role === 'ethics') defaultPass = 'ethics123';
    if (acc.role === 'student') defaultPass = 'student123';

    return {
      ...acc,
      defaultPassword: defaultPass
    };
  });
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  switchUser,
  getDemoAccounts,
};
