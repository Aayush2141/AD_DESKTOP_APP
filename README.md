# PG Dissertation Management System
### Ministry of AYUSH • Smart Education Initiative

A complete, secure, offline-first desktop application built using Electron, React, Tailwind CSS, and better-sqlite3 for nationwide post-graduate dissertation governance across AYUSH educational institutions.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite UI Layer                           │
│  - Tailwind CSS + AYUSH Smart Education Design System (Dark/Light)     │
│  - Role-Tailored Dashboards (Admin, HOD, Guide, Student, Ethics)       │
│  - Interactive Workflow Steppers, Capacity Meters, Recharts Analytics │
│  - Toast Notifications, Audit Log Viewer, Dissertation Repository     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ IPC (safe contextBridge)
┌────────────────────────────────────▼───────────────────────────────────┐
│                        Electron Main Process                           │
│  - Secure Configuration: contextIsolation: true, nodeIntegration: false│
│  - Session Management & bcryptjs Password Verification                 │
│  - TF-IDF Cosine & Jaccard Duplicate Similarity Engine                 │
│  - Workflow State Machine with Strict Transition Validations           │
│  - Student-Guide Ratio Enforcer (Configurable Max Limits)              │
│  - Automated University Result Withholding / Release Trigger           │
│  - Local App-Data Storage (Files/PDFs & better-sqlite3 DB)             │
│  - Automated SQLite Backup & Restore Service                           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Parameterized Queries & Transactions
┌────────────────────────────────────▼───────────────────────────────────┐
│                         SQLite (better-sqlite3)                        │
│  - 17 Relational Tables: Users, Roles, Colleges, Depts, Thrust Areas, │
│    Guides, Students, Dissertations, Approvals, Ethics, Milestones,     │
│    Progress Reports, Evaluations, Publications, Docs, Notifications,   │
│    Audit Logs, System Settings.                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Demo Role Credentials

Pre-configured demo accounts for all 5 roles are embedded into the login screen with **1-Click Instant Login**:

| Role | Name & Designation | Email | Password | Pre-seeded State |
|---|---|---|---|---|
| **Admin** | Dr. Vaidya K. S. Dhiman (National Admin) | `admin@ayush.gov.in` | `admin123` | National governance, settings, audit trail |
| **HOD** | Prof. Rajesh Sharma (HOD Kayachikitsa, NIA) | `hod.kaya@nia.edu.in` | `hod123` | Pending topic approvals & guide assignment |
| **Guide** | Dr. Sunita Meena (Assoc. Prof, Panchakarma) | `guide.pancha@nia.edu.in` | `guide123` | Full capacity (3/3), pending progress reviews |
| **Ethics Chair** | Prof. (Dr.) Arvind Joshi (Ethics Chair) | `ethics@ayush.gov.in` | `ethics123` | Clinical & animal trial clearance dossiers |
| **Student (Withheld)** | Arjun Sharma (Roll: AYU-2024-001) | `arjun.sharma@student.ayush.gov.in` | `student123` | Disapproved thesis → **Result WITHHELD** |
| **Student (Released)** | Meera Iyer (Roll: AYU-2024-002) | `meera.iyer@student.ayush.gov.in` | `student123` | Approved thesis (95.5%) → **Result RELEASED** |

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
# 1. Install dependencies and rebuild native better-sqlite3 for Electron
npm install

# 2. Seed database with realistic AYUSH colleges, thrust areas, and 20 sample dissertations
npm run seed

# 3. Start development environment (Vite + Electron live-reload)
npm run dev
```

### Packaging & Distribution
```bash
# Build Vite production bundle and package desktop app with electron-builder
npm run dist
```
The packaged desktop application is generated in `dist-electron/`:
- **macOS**: `dist-electron/PG Dissertation Management System-1.0.0-arm64.dmg` (~84MB optimized single-arch build with maximum compression and stripped locale assets)
- **Windows**: `dist-electron/win-unpacked/` and setup executable (configured in `package.json`)

### Automated Verification & Integrity Testing
```bash
# 1. Verify NLP duplicate detection engine and similarity scoring
node scripts/verify-similarity.js

# 2. Validate SQLite database schema, foreign key enforcement, and default parameters
npx electron scripts/validate-db.js
```

---

## ✨ Core Features & Technical Highlights

### 1. Authentication & Role-Based Access Control (RBAC)
- bcrypt password hashing with salt rounds.
- Electron session persistence in the main process.
- 5 tailored role dashboards: Admin, Department Head (HOD), PG Guide, Student / Scholar, and Institutional Ethics Committee (IEC).
- 1-Click Demo Accounts card selector on login page for frictionless evaluation.

### 2. Department Thrust Areas & Duplicate Detection Engine
- Topics must align with department thrust research areas (e.g. Metabolic Disorders, Basti Protocols, Phytochemical Standardization).
- **Natural Language Processing Similarity Engine**:
  - Implements **TF-IDF Cosine Similarity** + **Jaccard Token Overlap** with stop-word pruning.
  - Automatically compares new topic proposals against all historical dissertations nationwide.
  - Configurable threshold (defaults to 45%); highlights matching terms, percentage overlap, and blocks duplicate proposals.

### 3. Student-Guide Ratio Enforcement
- Configurable maximum scholar capacity per guide (default: 3 scholars).
- Interactive visual capacity meters (e.g. `2 / 3 Scholars`, `3 / 3 FULL`).
- Strictly blocks guide allocation if maximum capacity is reached.

### 4. Strict State Machine Workflow
State transitions are validated on both renderer and main process:
`Draft` → `Submitted` → `Topic Approved` / `Topic Rejected` / `Topic Revision Requested` → `Ethics Review` → `Ethics Cleared` / `Ethics Rejected` → `In Progress` → `Submitted for Evaluation` → `Evaluated - Approved` / `Evaluated - Disapproved` / `Evaluated - Resubmit`.
- Every transition logs actor, timestamp, and comments into the immutable audit trail.

### 5. Institutional Ethics Committee (IEC) Clearance
- Comprehensive ethical dossier form: Study Type (Clinical, Animal, Literature, In-Vitro), Assessed Patient Risk Level (Minimal, Low, Medium, High), Informed Consent Details, and Protocol upload.
- Dedicated Ethics Committee review console to Clear, Reject, or Request Changes.

### 6. Progress Monitoring & Overdue Alerts
- 6 standardized milestones: Synopsis Approval, Ethics Clearance, Subject Interventions, Bio-Statistical Compilation, Draft Verification, Final Submission.
- Automated Overdue detection: milestones past due date without completion trigger visual warning banners.
- Periodic progress reports by students with guide feedback and **1–5 Star Rating**.

### 7. Defense Evaluation & Automatic University Result Withholding / Release
- Structured 5-dimension rubric scoring:
  1. Problem Formulation & Originality (10 pts)
  2. Classical Literature Review (10 pts)
  3. Clinical / Pharmacological Methodology (10 pts)
  4. Bio-Statistical Rigor & Data Presentation (10 pts)
  5. Defense Viva Presentation (10 pts)
- Internal guide marks (50) + External examiner marks (50).
- **Statutory University Result Automation**:
  - **Approved**: Automatically unlocks and updates scholar's degree result to **`RELEASED`**.
  - **Disapproved / Not Submitted**: Automatically flags result as **`WITHHELD`**, showing warning banners on student and admin dashboards.

### 8. Publication Registry
- Tracks peer-reviewed papers arising from dissertations with Journal Name, DOI link, Indexing database (Scopus, PubMed, UGC-CARE, Web of Science), and Publication Year.

### 9. Nationwide Dissertation Repository
- Full-text multi-field search (keywords, title, abstract, scholar, guide, department, college, year).
- **Export to CSV**: Instant spreadsheet download.
- **Export to PDF**: Formatted Ministry of AYUSH academic catalog generated using jsPDF and autoTable.

### 10. Governance & Offline Resilience
- **Offline-First SQLite**: Uses `better-sqlite3` with WAL mode and foreign key constraints located in OS application data.
- **Backup & Restore**: Native file-dialog export and restoration of SQLite database snapshots.
- **Audit Trail**: Every login, topic transition, and evaluation action recorded with timestamp and user metadata.

---

## 🎬 End-to-End Demo Script (Student's Journey)

To demonstrate the full lifecycle from topic submission to result release:

1. **Sign In as Student (Arjun Sharma)**:
   - Click the **Student Arjun Sharma** card on the login screen.
   - Notice the prominent red alert banner: **"Degree Result Currently WITHHELD Under University Regulations"**.
2. **Propose a Topic with Duplicate Detection**:
   - Go to **Propose Topic**.
   - Type in a title similar to psoriasis: `"Clinical Evaluation of Virechana Karma in Kitibha Kushtha Psoriasis"` and click **Run Duplication Check**.
   - Notice the **Duplicate Warning Modal** pops up: flags **67% Match** with existing dissertation #1 and shows matched keywords.
   - Try selecting **Dr. Sunita Meena** as guide: notice she is at **3/3 FULL (Maximum Capacity Reached)**, blocking over-assignment.
   - Refine topic to an original concept, select an available guide, and click **Submit Topic for HOD Approval**.
3. **Switch to HOD (Prof. Rajesh Sharma)**:
   - Use the 1-Click Role Switcher in the top navigation bar to select **HOD**.
   - Go to **Topic Approvals**: review the proposal and click the green checkmark to **Approve Topic**.
4. **Switch to Ethics Chair (Prof. Arvind Joshi)**:
   - Select **Ethics Chair** from the top bar.
   - Navigate to **Ethics Clearance**: open the submitted protocol and click **Clear Protocol** (adds committee remarks).
   - The dissertation automatically transitions to **In Progress**.
5. **Monitor Progress & Submit Final Thesis**:
   - Switch back to the student: complete milestones and submit periodic progress reports (ratings appear from guide).
   - In **Evaluation & Defense**, upload the final thesis PDF and submit for evaluation.
6. **Defense Evaluation & Automatic Result Release**:
   - Switch to **Admin** or **Guide**.
   - Open **Evaluation & Defense**: score the 5 rubric dimensions, enter external examiner marks (e.g. 46/50), select **Approved**, and commit the evaluation.
   - Notice the immediate celebration banner: **"🎉 Dissertation APPROVED! University final year result is automatically RELEASED"**.
   - Open **University Results**: the student's status has shifted from **WITHHELD** to **RELEASED**!
# AD_DESKTOP_APP
