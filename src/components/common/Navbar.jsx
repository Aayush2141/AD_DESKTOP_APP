import React from 'react';
import { Sun, Moon, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onSelectDissertation }) {
  const { user, logout, switchUser, demoAccounts } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const formatAccountLabel = (acc) => {
    const roleUpper = acc.role.toUpperCase();
    if (acc.role === 'admin') return `Admin • ${acc.full_name.split(' ')[0]} (Ministry)`;
    if (acc.role === 'hod') return `HOD • ${acc.full_name.split(' ')[1] || acc.full_name} (${acc.department_name?.split(' ')[0] || 'Dept'})`;
    if (acc.role === 'guide') return `Guide • ${acc.full_name.split(' ')[1] || acc.full_name} (${acc.current_load}/${acc.max_capacity} Load)`;
    if (acc.role === 'ethics') return `Ethics • ${acc.full_name.split(' ')[2] || acc.full_name}`;
    if (acc.role === 'student') return `Student • ${acc.full_name} (${acc.final_year_result_status || 'Enrolled'})`;
    return `${roleUpper} • ${acc.full_name}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="flex items-center justify-between px-6 py-2.5 max-w-[1920px] mx-auto">
        {/* Left Branding */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ayush-700 via-ayush-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-ayush-600/30 flex-shrink-0">
            <span className="font-serif font-extrabold text-xl tracking-tighter">आयु</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                PG Dissertation Management System
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold bg-ayush-100 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 rounded border border-ayush-200 dark:border-ayush-800 flex-shrink-0">
                Ministry of AYUSH
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Smart Education • Nationwide Post-Graduate Research Governance
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Demo User Fast Switcher */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-1.5 flex items-center flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-ayush-600 dark:text-ayush-400" />
              Role Demo:
            </span>
            <select
              value={user?.id || ''}
              onChange={(e) => switchUser(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-none rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-ayush-500 cursor-pointer shadow-sm text-xs max-w-[260px] truncate"
            >
              {demoAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {formatAccountLabel(acc)}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <NotificationDropdown onSelectDissertation={onSelectDissertation} />

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {user.role} {user.department_code ? `• ${user.department_code}` : ''}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
