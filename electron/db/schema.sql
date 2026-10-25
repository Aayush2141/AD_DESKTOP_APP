-- PG Dissertation Management System Database Schema (SQLite)
-- Ministry of AYUSH, Smart Education

CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'hod', 'guide', 'student', 'ethics')),
  college_id INTEGER,
  department_id INTEGER,
  phone TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS thrust_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  college_id INTEGER NOT NULL,
  department_id INTEGER NOT NULL,
  designation TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 3,
  current_load INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  enrollment_no TEXT UNIQUE NOT NULL,
  college_id INTEGER NOT NULL,
  department_id INTEGER NOT NULL,
  guide_id INTEGER,
  admission_year INTEGER NOT NULL,
  final_year_result_status TEXT NOT NULL DEFAULT 'WITHHELD' CHECK(final_year_result_status IN ('PENDING', 'WITHHELD', 'RELEASED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (guide_id) REFERENCES guides(id)
);

CREATE TABLE IF NOT EXISTS dissertations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  guide_id INTEGER,
  department_id INTEGER NOT NULL,
  college_id INTEGER NOT NULL,
  thrust_area_id INTEGER,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  keywords TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Clinical Research',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN (
    'Draft',
    'Submitted',
    'Topic Approved',
    'Topic Rejected',
    'Topic Revision Requested',
    'Ethics Review',
    'Ethics Cleared',
    'Ethics Rejected',
    'In Progress',
    'Submitted for Evaluation',
    'Evaluated - Approved',
    'Evaluated - Disapproved',
    'Evaluated - Resubmit'
  )),
  similarity_score REAL DEFAULT 0.0,
  duplicate_matched_id INTEGER,
  submission_date DATETIME,
  approval_date DATETIME,
  final_submission_date DATETIME,
  completion_date DATETIME,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES guides(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (college_id) REFERENCES colleges(id),
  FOREIGN KEY (thrust_area_id) REFERENCES thrust_areas(id),
  FOREIGN KEY (duplicate_matched_id) REFERENCES dissertations(id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  actor_role TEXT NOT NULL,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ethics_clearances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER UNIQUE NOT NULL,
  study_type TEXT NOT NULL CHECK(study_type IN ('human', 'animal', 'clinical', 'literature', 'other')),
  risk_level TEXT NOT NULL CHECK(risk_level IN ('minimal', 'low', 'medium', 'high')),
  consent_details TEXT,
  ethical_justification TEXT,
  document_path TEXT,
  document_name TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Cleared', 'Rejected', 'Changes Requested')),
  committee_comments TEXT,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed', 'Overdue')),
  completion_date DATE,
  remarks TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  report_period TEXT NOT NULL,
  work_summary TEXT NOT NULL,
  challenges_faced TEXT,
  planned_next TEXT,
  file_path TEXT,
  file_name TEXT,
  guide_feedback TEXT,
  guide_rating INTEGER CHECK(guide_rating BETWEEN 1 AND 5),
  guide_reviewed_at DATETIME,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'Reviewed', 'Revision Requested')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER UNIQUE NOT NULL,
  thesis_file_path TEXT,
  thesis_file_name TEXT,
  guide_score REAL,
  guide_max_score REAL DEFAULT 50,
  guide_comments TEXT,
  external_examiner_name TEXT,
  external_score REAL,
  external_max_score REAL DEFAULT 50,
  external_comments TEXT,
  rubric_scores_json TEXT,
  total_percentage REAL,
  final_result TEXT NOT NULL CHECK(final_result IN ('Approved', 'Disapproved', 'Resubmit')),
  evaluated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  journal_name TEXT NOT NULL,
  doi TEXT,
  indexing TEXT NOT NULL CHECK(indexing IN ('Scopus', 'Web of Science', 'PubMed', 'UGC-CARE', 'Peer-Reviewed', 'Other')),
  publication_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Published' CHECK(status IN ('Published', 'Accepted', 'Under Review')),
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dissertation_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('synopsis', 'ethics_form', 'progress_report', 'thesis_draft', 'final_dissertation', 'certificate', 'other')),
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dissertation_id) REFERENCES dissertations(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'danger')),
  is_read INTEGER NOT NULL DEFAULT 0,
  link_type TEXT,
  link_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast searches and queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_dissertations_status ON dissertations(status);
CREATE INDEX IF NOT EXISTS idx_dissertations_student ON dissertations(student_id);
CREATE INDEX IF NOT EXISTS idx_dissertations_guide ON dissertations(guide_id);
CREATE INDEX IF NOT EXISTS idx_dissertations_dept ON dissertations(department_id);
CREATE INDEX IF NOT EXISTS idx_dissertations_college ON dissertations(college_id);
CREATE INDEX IF NOT EXISTS idx_dissertations_category ON dissertations(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_milestones_dissertation ON milestones(dissertation_id);
