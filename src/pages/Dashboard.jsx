import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Users,
  GraduationCap,
  BookOpen,
  Building,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import CapacityMeter from '../components/common/CapacityMeter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#16a34a', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export default function Dashboard({ setActiveTab, onSelectDissertation }) {
  const { user, isAdmin, isHod, isGuide, isStudent, isEthics } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const data = await window.api.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-ayush-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Governance Dashboard...</span>
        </div>
      </div>
    );
  }

  const { overview, statusDistribution, departmentCounts, guideLoads, recentLogs, userScoped } = analytics;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-[1920px] mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ayush-950 via-slate-900 to-navy-950 p-6 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-ayush-300 text-xs font-semibold mb-2 border border-white/10">
              <span>National PG Dissertation Portal</span>
              <span>•</span>
              <span className="capitalize">{user.role} Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, {user.full_name}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {user.college_name || 'Ministry of AYUSH'}
              {user.department_name ? ` • Department of ${user.department_name}` : ''}
              {user.enrollment_no ? ` • Enrollment: ${user.enrollment_no}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isStudent && (
              <button
                onClick={() => setActiveTab('topic-submission')}
                className="px-4 py-2.5 bg-ayush-600 hover:bg-ayush-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-ayush-600/30 transition-all flex items-center space-x-1.5"
              >
                <span>Propose Dissertation Topic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {isHod && (
              <button
                onClick={() => setActiveTab('topic-approvals')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center space-x-1.5"
              >
                <span>Review Pending Topics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {isEthics && (
              <button
                onClick={() => setActiveTab('ethics-clearance')}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-1.5"
              >
                <span>Review Ethics Dossiers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setActiveTab('repository')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
            >
              Browse National Repository
            </button>
          </div>
        </div>
      </div>

      {/* STUDENT SPECIFIC: University Result Withholding / Release Banner */}
      {isStudent && (
        <div
          className={`p-6 rounded-3xl border shadow-lg transition-all ${
            user.final_year_result_status === 'RELEASED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-2xl ${
                user.final_year_result_status === 'RELEASED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
              }`}
            >
              {user.final_year_result_status === 'RELEASED' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Official University Degree Result Status
                </span>
                <StatusBadge status={user.final_year_result_status || 'WITHHELD'} />
              </div>
              <h3 className="text-lg font-bold mt-1">
                {user.final_year_result_status === 'RELEASED'
                  ? 'Degree Result Officially RELEASED'
                  : 'Degree Result Currently WITHHELD Under University Regulations'}
              </h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-3xl">
                {user.final_year_result_status === 'RELEASED'
                  ? 'Your PG Dissertation has met all academic, ethical, and external defense requirements with distinction. Your final university degree mark-sheet and degree award eligibility are unlocked.'
                  : 'As per Ministry of AYUSH & University PG Regulations, final-year PG degree results are strictly WITHHELD until the candidate\'s PG dissertation is evaluated and formally Approved by the guide and external board.'}
              </p>

              {userScoped?.myDissertation && (
                <div className="mt-4 pt-4 border-t border-current/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold">Current Dissertation: </span>
                    <span>"{userScoped.myDissertation.title}"</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Status:</span>
                    <StatusBadge status={userScoped.myDissertation.status} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Dissertations</span>
            <FileText className="w-4 h-4 text-ayush-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {overview.totalDissertations}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across 4 departments</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {overview.pendingApprovalsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Requires authority action</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Overdue Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {overview.overdueCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Milestones past deadline</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">PG Scholars</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {overview.totalStudents}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Enrolled scholars</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Active Guides</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {overview.totalGuides}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Max 3 scholars/guide</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Publications</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {overview.totalPublications}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Indexed papers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Institutes</span>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {overview.totalColleges}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">NIA Jaipur & AIIA Delhi</div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Status Distribution Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Dissertation Lifecycle Status Distribution
              </h3>
              <p className="text-xs text-slate-400">Current active count across all stages</p>
            </div>
            <span className="text-[11px] font-semibold text-ayush-600 bg-ayush-50 dark:bg-ayush-950/60 px-2.5 py-1 rounded-lg border border-ayush-200 dark:border-ayush-900/60">
              National Metrics
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusDistribution.filter(s => s.count > 0)}
                margin={{ top: 10, right: 15, left: -20, bottom: 60 }}
              >
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-Wise Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Departmental Research Load
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">AYUSH Disciplines</span>
            </div>

            {/* Clean Centered Donut without overlapping overlay */}
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentCounts}
                    dataKey="count"
                    nameKey="code"
                    cx="50%"
                    cy="50%"
                    outerRadius={68}
                    innerRadius={42}
                    paddingAngle={3}
                  >
                    {departmentCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clean Custom Legend List Below (No overlap glitch) */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {departmentCounts.map((d, index) => (
              <div key={d.id} className="flex items-center space-x-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {d.code}:
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {d.count} topics
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Capacity Utilization Meters Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center">
              <Users className="w-4 h-4 mr-2 text-ayush-600" />
              Student-Guide Ratio Enforcement & Capacity Meters
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict limit enforced: maximum 3 scholars assigned per guide to maintain research quality.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            6 Official Guides Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guideLoads.map((guide) => (
            <div
              key={guide.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {guide.guide_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {guide.designation} • {guide.department_name}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                  {guide.college_name?.split(' ')[0]}
                </span>
              </div>

              <CapacityMeter currentLoad={guide.current_load} maxCapacity={guide.max_capacity} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audit Activities */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Recent System Governance Log
            </h3>
            <p className="text-xs text-slate-400">Authenticated actions with timestamps</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs text-ayush-600 dark:text-ayush-400 font-semibold hover:underline"
            >
              View Full Audit Trail →
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recentLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                  {log.action}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                  {log.details}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap ml-4 flex-shrink-0">
                {log.user_name} • {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
