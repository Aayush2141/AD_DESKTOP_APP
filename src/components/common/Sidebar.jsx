import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  Award,
  GraduationCap,
  BookOpen,
  Search,
  History,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'topic-submission',
      label: user?.role === 'student' ? 'Propose Topic' : 'New Topic',
      icon: FilePlus,
      roles: ['student', 'admin'],
    },
    {
      id: 'topic-approvals',
      label: 'Topic Approvals',
      icon: CheckSquare,
      badge: 'HOD',
      roles: ['hod', 'admin'],
    },
    {
      id: 'ethics-clearance',
      label: 'Ethics Clearance',
      icon: ShieldCheck,
      badge: user?.role === 'ethics' ? 'Review' : null,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'progress-monitoring',
      label: 'Progress Monitoring',
      icon: TrendingUp,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'evaluation',
      label: 'Evaluation & Defense',
      icon: Award,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'university-results',
      label: 'University Results',
      icon: GraduationCap,
      badge: 'Withholding',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
      roles: ['admin', 'hod', 'student'],
    },
    {
      id: 'publications',
      label: 'Publications',
      icon: BookOpen,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'repository',
      label: 'Dissertation Repository',
      icon: Search,
      roles: ['admin', 'hod', 'guide', 'student', 'ethics'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Trail',
      icon: History,
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <aside className="w-64 bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-4 px-3 flex-shrink-0 transition-colors overflow-hidden">
      <div className="space-y-1 overflow-y-auto pr-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Navigation Menu
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-ayush-600 text-white shadow-md shadow-ayush-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.badgeColor ||
                    (isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Pill Card */}
      <div className="mt-4 p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Role</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-ayush-100 dark:bg-ayush-950/80 text-ayush-800 dark:text-ayush-300 border border-ayush-200 dark:border-ayush-800">
            {user?.role}
          </span>
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
          {user?.full_name}
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {user?.college_name || 'Ministry of AYUSH'}
        </div>
      </div>
    </aside>
  );
}
