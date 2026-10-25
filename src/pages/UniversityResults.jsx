import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  FileCheck,
  ShieldAlert,
  Building,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';

export default function UniversityResults({ onSelectDissertation }) {
  const { user, isAdmin, isStudent } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchResults = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      // Fetch all dissertations to map student result status
      const diss = await window.api.getDissertations({
        search: search || undefined,
        scoped: isStudent, // Student sees own
      });
      setStudents(diss || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [user, search]);

  const filtered = students.filter((s) => {
    if (!statusFilter) return true;
    return s.final_year_result_status === statusFilter;
  });

  const countReleased = students.filter((s) => s.final_year_result_status === 'RELEASED').length;
  const countWithheld = students.filter((s) => s.final_year_result_status === 'WITHHELD').length;
  const countPending = students.filter((s) => s.final_year_result_status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-ayush-600" />
            University Final-Year Degree Results Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic withholding and release of university final-year marks based on PG dissertation defense approval.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholar or enrollment..."
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500 font-medium"
          >
            <option value="">All Results</option>
            <option value="WITHHELD">Result WITHHELD</option>
            <option value="RELEASED">Result RELEASED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      {/* Result Status Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Degree Results Released
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {countReleased}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Dissertation approved by external board
            </div>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Degree Results Withheld
            </div>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {countWithheld}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
              Disapproved, resubmit, or pending defense
            </div>
          </div>
          <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/30 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Enrolled PG Scholars
            </div>
            <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
              {students.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Monitored under Smart Education Portal
            </div>
          </div>
          <div className="p-3 bg-slate-700 text-white rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Regulation Explanation Card */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Statutory Ayush University Ordinance: </span>
          "A candidate shall not be declared to have passed the Post-Graduate Degree Examination unless his/her dissertation is accepted and approved by the examiners. The university shall withhold the publication of the final result of any candidate whose dissertation has been disapproved or not submitted until such time as the dissertation is resubmitted and approved."
        </div>
      </div>

      {/* Students Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Scholar & Roll No</th>
                <th className="py-3 px-4">Department & Institute</th>
                <th className="py-3 px-4">Dissertation Topic</th>
                <th className="py-3 px-4 text-center">Dissertation Status</th>
                <th className="py-3 px-4 text-center">Defense Score</th>
                <th className="py-3 px-4 text-center">University Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No student result records found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isReleased = s.final_year_result_status === 'RELEASED';
                  const isWithheld = s.final_year_result_status === 'WITHHELD';

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {s.student_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.enrollment_no}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {s.department_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.college_name?.split('(')[0]}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                        {s.title}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={s.status} />
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {s.evaluation_percentage ? (
                          <span
                            className={
                              s.evaluation_result === 'Approved'
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }
                          >
                            {s.evaluation_percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${
                            isReleased
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300'
                              : isWithheld
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 animate-pulse'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                          }`}
                        >
                          {s.final_year_result_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
