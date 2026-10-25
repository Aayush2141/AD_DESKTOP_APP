const bcrypt = require('bcryptjs');
const { getDb } = require('./index');

function hashPassword(plainText) {
  return bcrypt.hashSync(plainText, 10);
}

function seedDatabase(db = null) {
  const database = db || getDb();
  console.log('[Seed] Seeding AYUSH PG Dissertation Management System database...');

  const transaction = database.transaction(() => {
    // Clean old data if re-seeding
    database.prepare('DELETE FROM audit_logs').run();
    database.prepare('DELETE FROM notifications').run();
    database.prepare('DELETE FROM documents').run();
    database.prepare('DELETE FROM publications').run();
    database.prepare('DELETE FROM evaluations').run();
    database.prepare('DELETE FROM progress_reports').run();
    database.prepare('DELETE FROM milestones').run();
    database.prepare('DELETE FROM ethics_clearances').run();
    database.prepare('DELETE FROM approvals').run();
    database.prepare('DELETE FROM dissertations').run();
    database.prepare('DELETE FROM students').run();
    database.prepare('DELETE FROM guides').run();
    database.prepare('DELETE FROM thrust_areas').run();
    database.prepare('DELETE FROM users').run();
    database.prepare('DELETE FROM departments').run();
    database.prepare('DELETE FROM colleges').run();

    // 1. Colleges
    const insertCollege = database.prepare(`
      INSERT INTO colleges (name, code, city, state) VALUES (?, ?, ?, ?)
    `);
    const c1 = insertCollege.run('National Institute of Ayurveda (Deemed University)', 'NIA-JPR', 'Jaipur', 'Rajasthan').lastInsertRowid;
    const c2 = insertCollege.run('All India Institute of Ayurveda (AIIA)', 'AIIA-DEL', 'New Delhi', 'Delhi').lastInsertRowid;

    // 2. Departments
    const insertDept = database.prepare(`
      INSERT INTO departments (college_id, name, code) VALUES (?, ?, ?)
    `);
    const d1 = insertDept.run(c1, 'Kayachikitsa (General Medicine)', 'KC-NIA').lastInsertRowid;
    const d2 = insertDept.run(c1, 'Panchakarma (Purification Therapies)', 'PK-NIA').lastInsertRowid;
    const d3 = insertDept.run(c1, 'Dravyaguna Vigyana (Materia Medica & Pharmacology)', 'DG-NIA').lastInsertRowid;
    const d4 = insertDept.run(c2, 'Kayachikitsa (General Medicine)', 'KC-AIIA').lastInsertRowid;
    const d5 = insertDept.run(c2, 'Panchakarma (Purification Therapies)', 'PK-AIIA').lastInsertRowid;
    const d6 = insertDept.run(c2, 'Shalya Tantra (Surgery & Wound Care)', 'ST-AIIA').lastInsertRowid;

    // 3. Thrust Research Areas
    const insertThrust = database.prepare(`
      INSERT INTO thrust_areas (department_id, name, description) VALUES (?, ?, ?)
    `);
    const t1 = insertThrust.run(d1, 'Metabolic Disorders & Type-2 Diabetes (Madhumeha)', 'Integrative clinical protocols and herbal formulations for glycemic control').lastInsertRowid;
    const t2 = insertThrust.run(d1, 'Autoimmune & Rheumatic Disorders (Amavata)', 'Pathophysiological markers and Rasayana intervention in chronic arthritis').lastInsertRowid;
    const t3 = insertThrust.run(d2, 'Neuro-degenerative & Musculoskeletal Disorders', 'Vasti therapies in motor neuron and degenerative spine disorders').lastInsertRowid;
    const t4 = insertThrust.run(d2, 'Dermatological Conditions & Psoriasis (Kitibha)', 'Virechana and Takradhara protocols with biochemical biomarker tracking').lastInsertRowid;
    const t5 = insertThrust.run(d3, 'Phytochemical Standardization & Heavy Metal Assay', 'Pharmacopoeial quality control and HPTLC fingerprinting of classical drugs').lastInsertRowid;
    const t6 = insertThrust.run(d3, 'Herbal Immunomodulators & Rasayana Drugs', 'In-vivo and clinical evaluation of adaptogenic herbs').lastInsertRowid;
    const t7 = insertThrust.run(d4, 'Cardio-metabolic Risk Mitigation in Geriatrics', 'Ayurvedic formulations on arterial stiffness and endothelial function').lastInsertRowid;
    const t8 = insertThrust.run(d5, 'Stress & Mental Health (Manovaha Srotas)', 'Sirodhara and Nasya in generalized anxiety and insomnia').lastInsertRowid;
    const t9 = insertThrust.run(d6, 'Anorectal Diseases & Ksharasutra Management', 'Modified alkaline thread therapies in recurrent complex fistula-in-ano').lastInsertRowid;
    const t10 = insertThrust.run(d6, 'Diabetic Foot Ulcer & Wound Healing (Vrana Ropana)', 'Leech therapy (Jalaukavacharana) and herbal bioactive ointments').lastInsertRowid;

    // 4. Users (Admin, HODs, Guides, Ethics Committee, Students)
    const insertUser = database.prepare(`
      INSERT INTO users (email, password_hash, full_name, role, college_id, department_id, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const adminHash = hashPassword('admin123');
    const hodHash = hashPassword('hod123');
    const guideHash = hashPassword('guide123');
    const ethicsHash = hashPassword('ethics123');
    const studentHash = hashPassword('student123');

    // Admin
    const uAdmin = insertUser.run('admin@ayush.gov.in', adminHash, 'Dr. Vaidya K. S. Dhiman (National Admin)', 'admin', c1, null, '+91-9811002233').lastInsertRowid;

    // Ethics Committee Chair
    const uEthics = insertUser.run('ethics@ayush.gov.in', ethicsHash, 'Prof. (Dr.) Arvind Joshi (Ethics Chair)', 'ethics', c1, null, '+91-9414001122').lastInsertRowid;

    // HODs & Guides
    const uHod1 = insertUser.run('hod.kaya@nia.edu.in', hodHash, 'Prof. Rajesh Sharma (HOD Kayachikitsa)', 'hod', c1, d1, '+91-9414012345').lastInsertRowid;
    const uGuide1 = insertUser.run('guide.pancha@nia.edu.in', guideHash, 'Dr. Sunita Meena (Assoc. Prof)', 'guide', c1, d2, '+91-9414023456').lastInsertRowid;
    const uGuide2 = insertUser.run('guide.dravya@nia.edu.in', guideHash, 'Dr. Vikramaditya Rathore (Asst. Prof)', 'guide', c1, d3, '+91-9414034567').lastInsertRowid;

    const uHod2 = insertUser.run('hod.shalya@aiia.edu.in', hodHash, 'Prof. Ananya Verma (HOD Shalya Tantra)', 'hod', c2, d6, '+91-9810012345').lastInsertRowid;
    const uGuide3 = insertUser.run('guide.kaya@aiia.edu.in', guideHash, 'Dr. Priya Nair (Assoc. Prof)', 'guide', c2, d4, '+91-9810023456').lastInsertRowid;
    const uGuide4 = insertUser.run('guide.pancha@aiia.edu.in', guideHash, 'Dr. Harish Chandra (Assoc. Prof)', 'guide', c2, d5, '+91-9810034567').lastInsertRowid;

    // 5. Guides Table Records with Max Capacity (3)
    const insertGuide = database.prepare(`
      INSERT INTO guides (user_id, college_id, department_id, designation, max_capacity, current_load)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const g1 = insertGuide.run(uHod1, c1, d1, 'Professor & HOD', 3, 2).lastInsertRowid;
    const g2 = insertGuide.run(uGuide1, c1, d2, 'Associate Professor', 3, 3).lastInsertRowid; // Full capacity!
    const g3 = insertGuide.run(uGuide2, c1, d3, 'Assistant Professor', 3, 1).lastInsertRowid;
    const g4 = insertGuide.run(uHod2, c2, d6, 'Professor & HOD', 3, 2).lastInsertRowid;
    const g5 = insertGuide.run(uGuide3, c2, d4, 'Associate Professor', 3, 2).lastInsertRowid;
    const g6 = insertGuide.run(uGuide4, c2, d5, 'Associate Professor', 3, 1).lastInsertRowid;

    // 6. Students (15 students)
    const studentData = [
      { name: 'Arjun Sharma', email: 'arjun.sharma@student.ayush.gov.in', roll: 'AYU-2024-001', col: c1, dept: d1, guide: g1, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Meera Iyer', email: 'meera.iyer@student.ayush.gov.in', roll: 'AYU-2024-002', col: c1, dept: d2, guide: g2, year: 2024, resStatus: 'RELEASED' },
      { name: 'Rohan Gupta', email: 'rohan.gupta@student.ayush.gov.in', roll: 'AYU-2024-003', col: c1, dept: d3, guide: g3, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Kavita Joshi', email: 'kavita.joshi@student.ayush.gov.in', roll: 'AYU-2024-004', col: c2, dept: d6, guide: g4, year: 2024, resStatus: 'RELEASED' },
      { name: 'Siddharth Patel', email: 'siddharth.patel@student.ayush.gov.in', roll: 'AYU-2024-005', col: c2, dept: d4, guide: g5, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Ananya Deshmukh', email: 'ananya.deshmukh@student.ayush.gov.in', roll: 'AYU-2024-006', col: c1, dept: d2, guide: g2, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Naveen Kumar', email: 'naveen.kumar@student.ayush.gov.in', roll: 'AYU-2024-007', col: c1, dept: d1, guide: g1, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Divya Ranganathan', email: 'divya.ranganathan@student.ayush.gov.in', roll: 'AYU-2024-008', col: c2, dept: d6, guide: g4, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Aditya Birla', email: 'aditya.birla@student.ayush.gov.in', roll: 'AYU-2024-009', col: c2, dept: d5, guide: g6, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Pooja Hegde', email: 'pooja.hegde@student.ayush.gov.in', roll: 'AYU-2024-010', col: c2, dept: d4, guide: g5, year: 2024, resStatus: 'RELEASED' },
      { name: 'Kunal Singhal', email: 'kunal.singhal@student.ayush.gov.in', roll: 'AYU-2024-011', col: c1, dept: d2, guide: g2, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@student.ayush.gov.in', roll: 'AYU-2024-012', col: c1, dept: d3, guide: g3, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Rahul Bose', email: 'rahul.bose@student.ayush.gov.in', roll: 'AYU-2024-013', col: c1, dept: d1, guide: null, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Tanvi Shah', email: 'tanvi.shah@student.ayush.gov.in', roll: 'AYU-2024-014', col: c2, dept: d6, guide: null, year: 2024, resStatus: 'WITHHELD' },
      { name: 'Varun Nair', email: 'varun.nair@student.ayush.gov.in', roll: 'AYU-2024-015', col: c2, dept: d5, guide: null, year: 2024, resStatus: 'WITHHELD' },
    ];

    const insertStudent = database.prepare(`
      INSERT INTO students (user_id, enrollment_no, college_id, department_id, guide_id, admission_year, final_year_result_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const studentIds = [];
    for (const s of studentData) {
      const uid = insertUser.run(s.email, studentHash, s.name, 'student', s.col, s.dept, '+91-9900' + Math.floor(100000 + Math.random() * 900000)).lastInsertRowid;
      const sid = insertStudent.run(uid, s.roll, s.col, s.dept, s.guide, s.year, s.resStatus).lastInsertRowid;
      studentIds.push({ id: sid, userId: uid, ...s });
    }

    // 7. Dissertations (~20 sample records covering all states)
    const insertDissertation = database.prepare(`
      INSERT INTO dissertations (
        student_id, guide_id, department_id, college_id, thrust_area_id,
        title, abstract, keywords, category, status, similarity_score,
        submission_date, approval_date, final_submission_date, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEthics = database.prepare(`
      INSERT INTO ethics_clearances (
        dissertation_id, study_type, risk_level, consent_details, ethical_justification,
        document_path, document_name, status, committee_comments, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMilestone = database.prepare(`
      INSERT INTO milestones (dissertation_id, name, order_index, due_date, status, completion_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertProgress = database.prepare(`
      INSERT INTO progress_reports (
        dissertation_id, student_id, report_period, work_summary, challenges_faced,
        planned_next, guide_feedback, guide_rating, guide_reviewed_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEval = database.prepare(`
      INSERT INTO evaluations (
        dissertation_id, guide_score, external_examiner_name, external_score,
        rubric_scores_json, total_percentage, final_result, evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPub = database.prepare(`
      INSERT INTO publications (
        dissertation_id, student_id, title, journal_name, doi,
        indexing, publication_year, status, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertApproval = database.prepare(`
      INSERT INTO approvals (dissertation_id, stage, action, actor_id, actor_role, comments)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Standard milestones template helper
    function addStandardMilestones(did, completionStage = 0) {
      const list = [
        { name: 'Synopsis & Departmental Presentation', due: '2024-11-15' },
        { name: 'Institutional Ethics Clearance', due: '2024-12-30' },
        { name: 'Subject Enrollment & Clinical Interventions', due: '2025-06-30' },
        { name: 'Statistical Data Compilation & Analysis', due: '2025-09-30' },
        { name: 'Draft Thesis Guide Review', due: '2025-11-30' },
        { name: 'Final Dissertation Submission & Pre-Viva', due: '2026-01-15' },
      ];
      list.forEach((m, idx) => {
        let st = 'Not Started';
        let comp = null;
        if (idx < completionStage) {
          st = 'Completed';
          comp = m.due;
        } else if (idx === completionStage) {
          st = 'In Progress';
        }
        insertMilestone.run(did, m.name, idx + 1, m.due, st, comp, 'Milestone recorded as per academic schedule');
      });
    }

    // DISSERTATION 1: Evaluated - Approved (Meera Iyer)
    const dId1 = insertDissertation.run(
      studentIds[1].id, g2, d2, c1, t4,
      'Clinical Evaluation of Virechana Karma and Takradhara in Kitibha Kushtha (Psoriasis Vulgaris)',
      'A prospective randomized clinical study evaluating the therapeutic efficacy of classical Virechana Karma followed by medicated Takradhara in 60 patients with moderate to severe plaque psoriasis. Clinical improvement was tracked via PASI score and serum TNF-alpha biomarkers over 12 weeks.',
      'Psoriasis, Kitibha Kushtha, Virechana Karma, Takradhara, PASI score, Cytokines',
      'Clinical Trial', 'Evaluated - Approved', 0.08,
      '2024-10-15', '2024-11-01', '2025-12-20', 'Outstanding research work and peer-reviewed publication.'
    ).lastInsertRowid;
    addStandardMilestones(dId1, 6);
    insertEthics.run(dId1, 'clinical', 'medium', 'Informed written consent taken in Hindi and English', 'Human trial on approved pharmacopoeial formulations', 'ethics_clearance_001.pdf', 'Ethics_Clearance_001.pdf', 'Cleared', 'Approved unanimously without revisions.', uEthics, '2024-11-20');
    insertProgress.run(dId1, studentIds[1].id, 'Term 1 (Oct-Dec 2024)', 'Completed patient screening and baseline blood profiling of 60 subjects.', 'Recruitment delays due to winter holidays', 'Initiate Shodhanang snehapana', 'Good progress, ensure strict diet adherence during Snehana.', 5, '2024-12-28', 'Reviewed');
    insertProgress.run(dId1, studentIds[1].id, 'Term 2 (Jan-Apr 2025)', 'Administered Virechana Karma to all cohorts. No adverse drug events noted.', 'None', 'Begin Takradhara regimen', 'Exemplary clinical discipline demonstrated.', 5, '2025-05-02', 'Reviewed');
    insertEval.run(dId1, 47.5, 'Prof. S. K. Mishra (BHU IMS)', 48.0, JSON.stringify({ clarity: 10, literature: 9.5, methodology: 10, statistics: 9, defense: 9 }), 95.5, 'Approved', '2026-01-20');
    insertPub.run(dId1, studentIds[1].id, 'Therapeutic efficacy of Virechana Karma in Plaque Psoriasis: A 60-patient Clinical Trial', 'Journal of Ayurveda and Integrative Medicine (JAIM)', '10.1016/j.jaim.2025.100982', 'PubMed', 2025, 'Published', 'https://doi.org/10.1016/j.jaim.2025.100982');
    insertApproval.run(dId1, 'Final Evaluation', 'APPROVE', uAdmin, 'admin', 'Degree requirements completed. University result Released.');

    // DISSERTATION 2: Evaluated - Approved (Kavita Joshi)
    const dId2 = insertDissertation.run(
      studentIds[3].id, g4, d6, c2, t9,
      'Comparative Study of Guggulu-based vs Snuhi-based Ksharasutra in High Anal Fistula (Bhagandara)',
      'Management of complex and high trans-sphincteric fistula-in-ano remains a surgical dilemma. This study examines Unit Cut-through Time (UCTT), pain index, and recurrence rate in 40 patients treated with modified Ksharasutra.',
      'Bhagandara, High Anal Fistula, Ksharasutra, Guggulu, Wound Healing, Ayur-Surgery',
      'Surgical Research', 'Evaluated - Approved', 0.12,
      '2024-10-20', '2024-11-05', '2025-12-18', 'Approved with distinction.'
    ).lastInsertRowid;
    addStandardMilestones(dId2, 6);
    insertEthics.run(dId2, 'clinical', 'high', 'Detailed surgical consent and emergency coverage', 'Minimally invasive management of complex surgical conditions', 'ethics_clearance_002.pdf', 'Ethics_Clearance_002.pdf', 'Cleared', 'Cleared under surgical protocol guidelines.', uEthics, '2024-11-25');
    insertEval.run(dId2, 46.0, 'Dr. R. C. Gupta (IPGTRA Jamnagar)', 46.5, JSON.stringify({ clarity: 9.5, literature: 9, methodology: 9.5, statistics: 9.5, defense: 9 }), 92.5, 'Approved', '2026-01-18');
    insertPub.run(dId2, studentIds[3].id, 'Comparative Efficacy of Modified Ksharasutra in Complex Fistula-in-Ano', 'AYU Journal', '10.4103/ayu.AYU_240_25', 'Scopus', 2025, 'Published', 'https://doi.org/10.4103/ayu.AYU_240_25');

    // DISSERTATION 3: Evaluated - Approved (Pooja Hegde)
    const dId3 = insertDissertation.run(
      studentIds[9].id, g5, d4, c2, t7,
      'Evaluation of Arjuna (Terminalia arjuna) and Pushkarmoola in Arterial Stiffness and Endothelial Dysfunction in Pre-Hypertensive Adults',
      'Investigation of pulse wave velocity, carotid intima-media thickness, and serum nitric oxide levels among 50 pre-hypertensive volunteers after 16 weeks of standardized Ayurvedic decoctions.',
      'Arterial Stiffness, Endothelial Function, Arjuna, Pushkarmoola, Hridroga, Pre-hypertension',
      'Clinical Trial', 'Evaluated - Approved', 0.05,
      '2024-10-18', '2024-11-02', '2025-12-22', 'Commended for robust methodology.'
    ).lastInsertRowid;
    addStandardMilestones(dId3, 6);
    insertEthics.run(dId3, 'clinical', 'medium', 'Written consent with lipid profile screening', 'Cardio-protective herbal trial', 'ethics_003.pdf', 'Ethics_Clearance_003.pdf', 'Cleared', 'Approved.', uEthics, '2024-11-18');
    insertEval.run(dId3, 45.0, 'Prof. Anita Sharma (BHU)', 45.0, JSON.stringify({ clarity: 9, literature: 9, methodology: 9, statistics: 9, defense: 9 }), 90.0, 'Approved', '2026-01-22');

    // DISSERTATION 4: Evaluated - Disapproved (Arjun Sharma) -> Result WITHHELD
    const dId4 = insertDissertation.run(
      studentIds[0].id, g1, d1, c1, t1,
      'Evaluation of Nisha-Amalaki Granules in Glycemic Control of Newly Diagnosed Diabetes Mellitus',
      'Clinical trial on 30 subjects with high fasting blood glucose evaluating HbA1c reduction over 8 weeks. However, substantial methodology deviations and missing data points were observed during audit.',
      'Madhumeha, Type 2 Diabetes, Nisha-Amalaki, Glycemic Control, HbA1c',
      'Clinical Trial', 'Evaluated - Disapproved', 0.22,
      '2024-10-22', '2024-11-10', '2026-01-05', 'Fails scientific rigor, unverified laboratory data, high attrition rate.'
    ).lastInsertRowid;
    addStandardMilestones(dId4, 5);
    insertEthics.run(dId4, 'clinical', 'medium', 'Consent forms incomplete for 12 participants', 'Study approved initially with conditions', 'ethics_004.pdf', 'Ethics_004.pdf', 'Cleared', 'Conditional approval granted.', uEthics, '2024-11-28');
    insertEval.run(dId4, 21.0, 'Prof. D. K. Maurya (Lucknow University)', 22.0, JSON.stringify({ clarity: 5, literature: 5, methodology: 4, statistics: 4, defense: 4.5 }), 43.0, 'Disapproved', '2026-01-25');

    // DISSERTATION 5: Evaluated - Disapproved (Naveen Kumar) -> Result WITHHELD
    const dId5 = insertDissertation.run(
      studentIds[6].id, g1, d1, c1, t2,
      'Assessment of Vatari Guggulu in Seronegative Rheumatoid Arthritis (Amavata)',
      'Single-arm clinical study in 25 subjects. Follow-up visits were not recorded in 40% of cases, and primary endpoint analysis was flawed.',
      'Amavata, Rheumatoid Arthritis, Vatari Guggulu, Inflammatory Markers',
      'Clinical Trial', 'Evaluated - Disapproved', 0.15,
      '2024-10-25', '2024-11-12', '2026-01-10', 'Disapproved by board due to protocol violation.'
    ).lastInsertRowid;
    addStandardMilestones(dId5, 4);
    insertEthics.run(dId5, 'clinical', 'medium', 'Consent collected', 'Rheumatoid trial', 'ethics_005.pdf', 'Ethics_005.pdf', 'Cleared', 'Cleared.', uEthics, '2024-11-30');
    insertEval.run(dId5, 20.0, 'Dr. V. K. Upadhyay (IMS BHU)', 21.5, JSON.stringify({ clarity: 4.5, literature: 5, methodology: 4, statistics: 4, defense: 4 }), 41.5, 'Disapproved', '2026-01-28');

    // DISSERTATION 6: Submitted for Evaluation (Siddharth Patel)
    const dId6 = insertDissertation.run(
      studentIds[4].id, g5, d4, c2, t7,
      'A Comparative Study of Punarnavadi Kwatha and Shilajitwadi Vati in Chronic Kidney Disease (Stage 2-3)',
      'Clinical assessment of estimated Glomerular Filtration Rate (eGFR), serum creatinine, and microalbuminuria in 45 patients under Ayurvedic nephro-protective care.',
      'Chronic Kidney Disease, Vrikka Roga, Punarnavadi Kwatha, Shilajit, eGFR',
      'Clinical Trial', 'Submitted for Evaluation', 0.11,
      '2024-10-12', '2024-11-04', '2026-01-14', 'Thesis submitted. External examiner panel assigned.'
    ).lastInsertRowid;
    addStandardMilestones(dId6, 5);
    insertEthics.run(dId6, 'clinical', 'high', 'Nephrology safety oversight and nephrologist consent', 'Nephro-protective Ayurvedic therapies', 'ethics_006.pdf', 'Ethics_006.pdf', 'Cleared', 'Approved with mandatory serum electrolyte monitoring.', uEthics, '2024-11-22');
    insertProgress.run(dId6, studentIds[4].id, 'Term 3 (May-Aug 2025)', 'Completed follow-up for 42 participants. 3 dropped out.', 'Serum creatinine fluctuations noted in 2 cases', 'Finalize biostatistical modeling', 'Thorough and well-managed case sheets.', 4, '2025-09-05', 'Reviewed');

    // DISSERTATION 7: Submitted for Evaluation (Divya Ranganathan)
    const dId7 = insertDissertation.run(
      studentIds[7].id, g4, d6, c2, t10,
      'Role of Jalaukavacharana (Leech Therapy) and Jatyadi Taila in Chronic Non-Healing Diabetic Foot Ulcer (Dushta Vrana)',
      'Controlled clinical trial in 40 diabetic foot ulcer patients evaluating reduction in ulcer surface area, granulation tissue formation, and vascular perfusion scores.',
      'Dushta Vrana, Diabetic Foot Ulcer, Jalaukavacharana, Leech Therapy, Jatyadi Taila, Wound Healing',
      'Clinical Trial', 'Submitted for Evaluation', 0.09,
      '2024-10-28', '2024-11-15', '2026-01-18', 'Thesis under external evaluation.'
    ).lastInsertRowid;
    addStandardMilestones(dId7, 5);
    insertEthics.run(dId7, 'clinical', 'high', 'Informed consent with Doppler ultrasound confirmation', 'Wound debridement and biological leech therapy', 'ethics_007.pdf', 'Ethics_007.pdf', 'Cleared', 'Approved with sterile leech husbandry certificate.', uEthics, '2024-12-02');

    // DISSERTATION 8: In Progress (Rohan Gupta)
    const dId8 = insertDissertation.run(
      studentIds[2].id, g3, d3, c1, t5,
      'HPTLC Fingerprinting and Quantitative Estimation of Withaferin-A in Ecotypes of Withania somnifera (Ashwagandha)',
      'Physicochemical standardization, trace heavy metal profiling (ICP-MS), and HPTLC densitometric validation of Ashwagandha roots gathered from arid and semi-arid agro-climatic zones of Rajasthan.',
      'Withania somnifera, Ashwagandha, HPTLC, Withaferin-A, Heavy Metals, Quality Control',
      'Pharmacognosy & Phytochemistry', 'In Progress', 0.14,
      '2024-11-01', '2024-11-20', null, 'Active laboratory bench work ongoing.'
    ).lastInsertRowid;
    addStandardMilestones(dId8, 3);
    insertEthics.run(dId8, 'literature', 'minimal', 'N/A (Plant specimen analysis only)', 'Herbarium specimens and laboratory phytochemical assay', 'ethics_008.pdf', 'Ethics_008.pdf', 'Cleared', 'Exempted from clinical ethical committee as it is non-human/non-animal.', uEthics, '2024-11-25');
    insertProgress.run(dId8, studentIds[2].id, 'Term 2 (Jan-Apr 2025)', 'Gathered 18 distinct plant ecotypes. Completed solvent extraction and initial TLC plates.', 'Solvent purity variations', 'Calibrate HPTLC CAMAG instrument', 'Good analytical pace maintained.', 4, '2025-05-10', 'Reviewed');

    // DISSERTATION 9: In Progress (Ananya Deshmukh)
    const dId9 = insertDissertation.run(
      studentIds[5].id, g2, d2, c1, t3,
      'Efficacy of Matra Basti with Sahacharadi Taila in Lumbar Canal Stenosis (Katigraha)',
      'Clinical trial evaluating pain relief, Walking Distance Capacity (WDC), and Oswestry Disability Index in 35 diagnosed lumbar stenosis patients.',
      'Lumbar Stenosis, Katigraha, Matra Basti, Sahacharadi Taila, Oswestry Index',
      'Clinical Trial', 'In Progress', 0.16,
      '2024-11-05', '2024-11-24', null, 'Patient intake nearing completion.'
    ).lastInsertRowid;
    addStandardMilestones(dId9, 2);
    insertEthics.run(dId9, 'clinical', 'medium', 'MRI-verified enrollment with written informed consent', 'Therapeutic oil enema protocol', 'ethics_009.pdf', 'Ethics_009.pdf', 'Cleared', 'Cleared.', uEthics, '2024-12-05');
    insertProgress.run(dId9, studentIds[5].id, 'Term 1 (Nov 2024-Feb 2025)', 'Enrolled 22 patients so far. Administering 14-day Matra Basti courses.', 'Patient transportation difficulties for elderly', 'Organize volunteer van service', 'Monitor vital signs post-basti.', 4, '2025-03-01', 'Reviewed');

    // DISSERTATION 10: In Progress (Aditya Birla)
    const dId10 = insertDissertation.run(
      studentIds[8].id, g6, d5, c2, t8,
      'Clinical Study on Shirodhara with Brahmi Taila in Generalized Anxiety Disorder (Chittodvega)',
      'Evaluation of Hamilton Anxiety Rating Scale (HAM-A), salivary cortisol levels, and sleep EEG patterns in 30 patients undergoing 21 sessions of continuous lukewarm Shirodhara.',
      'Generalized Anxiety, Chittodvega, Shirodhara, Brahmi Taila, Cortisol, Sleep Quality',
      'Clinical Trial', 'In Progress', 0.07,
      '2024-11-10', '2024-12-01', null, 'Subject interventions halfway through.'
    ).lastInsertRowid;
    addStandardMilestones(dId10, 3);
    insertEthics.run(dId10, 'clinical', 'medium', 'Psychological consent and psychiatric co-clearance', 'Holistic management of mood and anxiety', 'ethics_010.pdf', 'Ethics_010.pdf', 'Cleared', 'Cleared with condition of psychiatric psychiatrist co-supervision.', uEthics, '2024-12-10');

    // DISSERTATION 11: Ethics Cleared (Kunal Singhal)
    const dId11 = insertDissertation.run(
      studentIds[10].id, g2, d2, c1, t3,
      'Therapeutic Effect of Patra Pinda Sweda in Cervical Spondylosis (Manyastambha)',
      'Clinical evaluation of neck disability index and range of motion in 40 patients suffering from occupational neck stiffness and radiculopathy treated with herbal bolus fomentation.',
      'Manyastambha, Cervical Spondylosis, Patra Pinda Sweda, Ergonomics, Fomentation',
      'Clinical Trial', 'Ethics Cleared', 0.18,
      '2024-11-15', '2024-12-05', null, 'Ethics cleared, ready to start patient enrollment.'
    ).lastInsertRowid;
    addStandardMilestones(dId11, 2);
    insertEthics.run(dId11, 'clinical', 'low', 'Standard therapy consent', 'Non-invasive external therapeutic fomentation', 'ethics_011.pdf', 'Ethics_011.pdf', 'Cleared', 'Unanimously cleared.', uEthics, '2024-12-20');

    // DISSERTATION 12: Ethics Review (Sneha Kulkarni)
    const dId12 = insertDissertation.run(
      studentIds[11].id, g3, d3, c1, t6,
      'Comparative Hepatoprotective Activity of Kalmegh (Andrographis paniculata) and Kutki (Picrorhiza kurroa) in Paracetamol-Induced Liver Injury',
      'Experimental pre-clinical study measuring serum AST, ALT, alkaline phosphatase, and histopathological architecture in Wistar albino rats.',
      'Kalmegh, Kutki, Hepatoprotective, Liver Toxicity, Histopathology, Yakrit Roga',
      'Animal Experimental', 'Ethics Review', 0.13,
      '2024-11-20', '2024-12-10', null, 'Under review by Institutional Animal Ethics Committee (IAEC).'
    ).lastInsertRowid;
    addStandardMilestones(dId12, 1);
    insertEthics.run(dId12, 'animal', 'high', 'CPCSEA guidelines compliance and animal welfare plan', 'Testing classical liver tonic herbal extracts in-vivo', 'iaec_protocol_012.pdf', 'IAEC_Protocol_012.pdf', 'Pending', 'IAEC animal housing inspection scheduled for this week.', null, null);

    // DISSERTATION 13: Ethics Review (Rahul Bose)
    const dId13 = insertDissertation.run(
      studentIds[12].id, g1, d1, c1, t1,
      'Impact of Mamajjaka (Enicostemma littorale) Churna on Insulin Sensitivity Markers in Metabolic Syndrome',
      'Investigation of HOMA-IR, waist-to-hip ratio, and lipid profile in 40 patients presenting with impaired glucose tolerance.',
      'Mamajjaka, Enicostemma littorale, Insulin Resistance, HOMA-IR, Metabolic Syndrome',
      'Clinical Trial', 'Ethics Review', 0.19,
      '2024-12-01', '2024-12-18', null, 'Awaiting ethics committee board meeting.'
    ).lastInsertRowid;
    addStandardMilestones(dId13, 1);
    insertEthics.run(dId13, 'clinical', 'medium', 'Written consent with nutritional assessment', 'Clinical trial on single herb formulation', 'ethics_013.pdf', 'Ethics_013.pdf', 'Pending', 'Review scheduled in upcoming monthly IEC meet.', null, null);

    // DISSERTATION 14: Topic Revision Requested (Tanvi Shah)
    const dId14 = insertDissertation.run(
      studentIds[13].id, g4, d6, c2, t10,
      'Application of Honey and Curcumin Dressing on Surgical Wounds',
      'Study of topical application of bee honey mixed with turmeric on clean contaminated surgical incisions.',
      'Wound Dressing, Honey, Curcumin, Surgical Wounds, Vrana',
      'Surgical Research', 'Topic Revision Requested', 0.28,
      '2024-12-10', null, null, 'HOD requested sample size calculation and microbiological swab protocol inclusion.'
    ).lastInsertRowid;
    addStandardMilestones(dId14, 0);
    insertApproval.run(dId14, 'Topic Scrutiny', 'REQUEST_REVISION', uHod2, 'hod', 'Please specify standard sterilization grade of honey and define microbiological colony count endpoints.');

    // DISSERTATION 15: Topic Revision Requested (Varun Nair)
    const dId15 = insertDissertation.run(
      studentIds[14].id, g6, d5, c2, t8,
      'Yoga and Ayurvedic Dietary Intervention in Chronic Insomnia (Anidra)',
      'Assessment of sleep diary and PSQI score after 6 weeks of lifestyle regimen.',
      'Anidra, Insomnia, Ayurveda Diet, Yoga Nidra, Sleep Hygiene',
      'Literature & Lifestyle', 'Topic Revision Requested', 0.20,
      '2024-12-12', null, null, 'Add objective polysomnography or actigraphy measurement.'
    ).lastInsertRowid;
    addStandardMilestones(dId15, 0);
    insertApproval.run(dId15, 'Topic Scrutiny', 'REQUEST_REVISION', uHod1, 'hod', 'Self-reported sleep scores alone are insufficient. Incorporate digital actigraphy watch metrics.');

    // DISSERTATION 16: Submitted (Awaiting Topic Approval) (Student 15 duplicate candidate / test)
    const dId16 = insertDissertation.run(
      studentIds[14].id, g6, d5, c2, t8,
      'Clinical Study on Shirodhara with Ashwagandha Oil in Anxiety and Sleep Disturbance',
      'Clinical trial evaluating anxiety scores and sleep latency using medicated herbal oil dripping on forehead.',
      'Shirodhara, Ashwagandha Oil, Anxiety, Sleep Disturbance, Cortisol',
      'Clinical Trial', 'Submitted', 0.42,
      '2025-01-05', null, null, 'Pending HOD approval and guide capacity verification.'
    ).lastInsertRowid;
    addStandardMilestones(dId16, 0);
    insertApproval.run(dId16, 'Topic Submission', 'SUBMIT', studentIds[14].userId, 'student', 'Topic proposed for 2025 academic session.');

    // DISSERTATION 17: Submitted (Awaiting Topic Approval)
    const dId17 = insertDissertation.run(
      studentIds[12].id, g1, d1, c1, t2,
      'Evaluation of Rasayana Regimen in Chronic Fatigue Syndrome in Post-Viral Convalescence',
      'Investigating Ayurvedic adaptogenic formulations on fatigue severity scale and mitochondrial enzyme activity in convalescent patients.',
      'Rasayana, Chronic Fatigue, Post-viral, Convalescence, Adaptogens, Dhatvagni',
      'Clinical Trial', 'Submitted', 0.10,
      '2025-01-08', null, null, 'Assigned to Dr. Rajesh Sharma.'
    ).lastInsertRowid;
    addStandardMilestones(dId17, 0);
    insertApproval.run(dId17, 'Topic Submission', 'SUBMIT', studentIds[12].userId, 'student', 'Submitted proposal.');

    // DISSERTATION 18: Submitted (Awaiting Topic Approval)
    const dId18 = insertDissertation.run(
      studentIds[13].id, g4, d6, c2, t9,
      'Comparative Clinical Assessment of Apamarga Ksharasutra vs Udumbara Ksharasutra in Bhagandara',
      'A double blind clinical investigation comparing knot tensile properties and wound healing time in fistulectomy patients.',
      'Bhagandara, Ksharasutra, Apamarga, Udumbara, Fistula, Ayur-Surgery',
      'Surgical Research', 'Submitted', 0.38,
      '2025-01-10', null, null, 'Duplicate similarity warning flagged (38% similar to Dissertation #2).'
    ).lastInsertRowid;
    addStandardMilestones(dId18, 0);

    // DISSERTATION 19: Draft (Student 1)
    insertDissertation.run(
      studentIds[0].id, g1, d1, c1, t1,
      'Exploratory Investigation of Haridra and Daruharidra Extracts in Non-Alcoholic Fatty Liver Disease (NAFLD)',
      'Draft concept investigating hepatic steatosis ultrasound grades and lipid accumulation in hepatocyte cultures.',
      'NAFLD, Hepatic Steatosis, Haridra, Curcuma longa, Daruharidra, Liver Metabolism',
      'Pre-clinical & Clinical', 'Draft', 0.0,
      null, null, null, 'Student currently editing draft.'
    );

    // DISSERTATION 20: Draft (Student 11)
    insertDissertation.run(
      studentIds[10].id, g2, d2, c1, t4,
      'Standardized Snehana-Swedana Protocols in Generalized Fibromyalgia Syndrome',
      'Drafting protocol for pain threshold measurements with pressure algometer in fibromyalgia.',
      'Fibromyalgia, Snehana, Swedana, Pain Threshold, Mamsagata Vata',
      'Clinical Trial', 'Draft', 0.0,
      null, null, null, 'Draft in preparation.'
    );

    // 8. Notifications for all demo users
    const insertNotif = database.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link_type, link_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Notifications for Admin
    insertNotif.run(uAdmin, 'National PG Portal Active', 'Academic Session 2025-2026 synchronized with 20 sample dissertations.', 'info', 0, 'system', null);
    insertNotif.run(uAdmin, 'Result Withheld Notice', 'Student Arjun Sharma (AYU-2024-001) marked WITHHELD due to Disapproved dissertation.', 'warning', 0, 'result', 1);

    // Notifications for HOD Kayachikitsa
    insertNotif.run(uHod1, 'New Topic Submissions', '2 new dissertation proposals pending your departmental review.', 'info', 0, 'topic', dId17);
    insertNotif.run(uHod1, 'Guide Capacity Alert', 'Guide Dr. Sunita Meena has reached maximum scholar capacity (3/3).', 'warning', 0, 'guide', g2);

    // Notifications for Ethics Chair
    insertNotif.run(uEthics, 'Ethics Review Pending', 'Proposal #12 (IAEC Pre-clinical) and #13 (Clinical Trial) require committee decision.', 'info', 0, 'ethics', dId12);

    // Notifications for Guides
    insertNotif.run(uGuide1, 'Capacity Maximum Reached', 'You are currently guiding 3 students (Maximum limit reached).', 'warning', 0, 'capacity', g2);
    insertNotif.run(uGuide1, 'Dissertation Evaluated', 'Student Meera Iyer dissertation successfully evaluated (Score: 95.5%). Result RELEASED.', 'success', 0, 'evaluation', dId1);

    // Notifications for Students
    insertNotif.run(studentIds[0].userId, 'Dissertation Disapproved', 'Your dissertation was evaluated as Disapproved. University Final Result is WITHHELD. Contact your HOD for re-submission guidelines.', 'danger', 0, 'dissertation', dId4);
    insertNotif.run(studentIds[1].userId, 'Degree Requirement Cleared', 'Your dissertation is Approved with 95.5%! University Final-Year Result is officially RELEASED.', 'success', 0, 'result', dId1);
    insertNotif.run(studentIds[13].userId, 'Topic Revision Requested', 'HOD has requested revisions to your proposed surgical dressing protocol.', 'warning', 0, 'topic', dId14);

    // 9. Initial Audit Logs
    const insertAudit = database.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(uAdmin, 'National Admin', 'admin', 'SYSTEM_INITIALIZATION', 'System', 1, 'AYUSH PG Dissertation Management Database seeded with verified data.');
    insertAudit.run(studentIds[1].userId, 'Meera Iyer', 'student', 'DISSERTATION_FINAL_SUBMIT', 'Dissertation', dId1, 'Final thesis uploaded for evaluation.');
    insertAudit.run(uAdmin, 'National Admin', 'admin', 'RESULT_RELEASE', 'Student', studentIds[1].id, 'University final year result automatically RELEASED upon Approved dissertation.');
    insertAudit.run(uAdmin, 'National Admin', 'admin', 'RESULT_WITHHOLD', 'Student', studentIds[0].id, 'University final year result WITHHELD due to Disapproved dissertation.');
  });

  transaction();
  console.log('[Seed] Database seeded successfully with 20 sample dissertations, 15 students, 6 guides, ethics records, and milestones!');
}

module.exports = { seedDatabase };
