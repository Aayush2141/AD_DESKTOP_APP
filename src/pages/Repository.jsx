import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  BookOpen,
  Calendar,
  Building,
  User,
  Award,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import WorkflowStepper from '../components/common/WorkflowStepper';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Repository({ selectedId = null }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [dissertations, setDissertations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ colleges: [], departments: [] });

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);

  const fetchRepository = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getDissertations({
        search: search || undefined,
        department_id: deptFilter || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        year: yearFilter || undefined,
        scoped: false, // Repository allows nationwide search across all dissertations
      });
      setDissertations(list || []);

      const meta = await window.api.getSystemMetadata();
      setMetadata(meta);

      if (selectedId) {
        openDetail(selectedId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepository();
  }, [search, deptFilter, statusFilter, categoryFilter, yearFilter]);

  const openDetail = async (id) => {
    if (!window.api) return;
    try {
      const full = await window.api.getDissertationById(id);
      setActiveDetail(full);
      setDetailModalOpen(true);
    } catch (err) {
      addToast('Failed to load details', 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (dissertations.length === 0) {
      addToast('No records to export', 'warning');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Scholar Name',
      'Enrollment No',
      'Department',
      'College',
      'Guide',
      'Category',
      'Status',
      'Degree Result Status',
      'Defense Score (%)',
      'Submission Date',
    ];

    const rows = dissertations.map((d) => [
      d.id,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${d.student_name || ''}"`,
      `"${d.enrollment_no || ''}"`,
      `"${d.department_name || ''}"`,
      `"${d.college_name || ''}"`,
      `"${d.guide_name || ''}"`,
      `"${d.category || ''}"`,
      `"${d.status || ''}"`,
      `"${d.final_year_result_status || ''}"`,
      d.evaluation_percentage || '',
      d.submission_date ? new Date(d.submission_date).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AYUSH_PG_Dissertations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('CSV export downloaded successfully', 'success');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (dissertations.length === 0) {
      addToast('No records to export', 'warning');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    // Title & Header
    doc.setFontSize(16);
    doc.setTextColor(22, 101, 52); // AYUSH green
    doc.text('Ministry of AYUSH - National PG Dissertation Repository', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Official Academic Catalog • Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = dissertations.map((d) => [
      d.id,
      d.title.length > 55 ? d.title.substring(0, 52) + '...' : d.title,
      d.student_name,
      d.department_code || d.department_name,
      d.guide_name || '—',
      d.status,
      d.final_year_result_status || 'WITHHELD',
    ]);

    doc.autoTable({
      head: [['#', 'Dissertation Title', 'Scholar', 'Dept', 'Guide', 'Status', 'Result']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    });

    doc.save(`AYUSH_PG_Dissertation_Catalog_${Date.now()}.pdf`);
    addToast('PDF catalog downloaded successfully', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Search className="w-5 h-5 mr-2 text-ayush-600" />
            Nationwide PG Dissertation Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Searchable and filterable database across all institutes, departments, research thrust areas, and guides.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ayush-600 hover:bg-ayush-500 text-white shadow-md shadow-ayush-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF Catalog</span>
          </button>
        </div>
      </div>

      {/* Multi-Field Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Full-text search by title, abstract keywords, scholar name, enrollment, or guide..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ayush-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="">All Departments</option>
            {metadata.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="Evaluated - Approved">Evaluated - Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted for Evaluation">Submitted for Evaluation</option>
            <option value="Submitted">Submitted</option>
            <option value="Ethics Review">Ethics Review</option>
            <option value="Evaluated - Disapproved">Evaluated - Disapproved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            <option value="Clinical Trial">Clinical Trial</option>
            <option value="Surgical Research">Surgical Research</option>
            <option value="Pharmacognosy & Phytochemistry">Pharmacognosy & Phytochemistry</option>
            <option value="Animal Experimental">Animal Experimental</option>
            <option value="Literature & Lifestyle">Literature & Lifestyle</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="">All Academic Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Total Dissertations Found: {dissertations.length}
          </span>
          <span className="text-[11px] text-slate-400">
            Showing records across all stages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Title & Keywords</th>
                <th className="py-3 px-4">Scholar & Roll</th>
                <th className="py-3 px-4">Department & College</th>
                <th className="py-3 px-4">Guide</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Result</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dissertations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No dissertations found matching query.
                  </td>
                </tr>
              ) : (
                dissertations.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => openDetail(d.id)}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {d.id}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {d.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {d.keywords}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {d.student_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {d.enrollment_no}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {d.department_code || d.department_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.college_name?.split('(')[0]}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {d.guide_name || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={d.status} />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          d.final_year_result_status === 'RELEASED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {d.final_year_result_status || 'WITHHELD'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(d.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                        title="View Full Dissertation Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Dissertation Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Dissertation Record #${activeDetail?.id}`}
        maxWidth="max-w-4xl"
      >
        {activeDetail && (
          <div className="space-y-5 text-xs">
            {/* Header / Title */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-ayush-100 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 border border-ayush-200">
                  {activeDetail.category}
                </span>
                <StatusBadge status={activeDetail.status} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {activeDetail.title}
              </h3>
            </div>

            {/* Workflow Stepper */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <WorkflowStepper currentStatus={activeDetail.status} />
            </div>

            {/* Scholar & Guide Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  PG Scholar Info:
                </span>
                <div>Name: <span className="font-semibold">{activeDetail.student_name}</span></div>
                <div>Enrollment No: <span className="font-mono">{activeDetail.enrollment_no}</span></div>
                <div>Email: {activeDetail.student_email}</div>
                <div>University Result: <span className="font-bold text-emerald-600">{activeDetail.final_year_result_status}</span></div>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Department & Guide:
                </span>
                <div>Guide: <span className="font-semibold">{activeDetail.guide_name || 'Unassigned'}</span></div>
                <div>Department: {activeDetail.department_name}</div>
                <div>Institute: {activeDetail.college_name}</div>
                <div>Thrust Area: {activeDetail.thrust_area_name || 'General'}</div>
              </div>
            </div>

            {/* Abstract */}
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Abstract & Methodology:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {activeDetail.abstract}
              </p>
            </div>

            {/* Keywords */}
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Keywords:</span>
              <div className="flex flex-wrap gap-1.5">
                {activeDetail.keywords.split(',').map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Attached Publications */}
            {activeDetail.publications && activeDetail.publications.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1 text-ayush-600" />
                  Resulting Peer-Reviewed Publications ({activeDetail.publications.length}):
                </span>
                <div className="space-y-1.5">
                  {activeDetail.publications.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.title}</div>
                        <div className="text-[11px] text-slate-500">{p.journal_name} ({p.publication_year}) • {p.indexing}</div>
                      </div>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ayush-600 font-bold hover:underline"
                        >
                          View DOI →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
