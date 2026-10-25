import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  let colorStyles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  switch (status) {
    case 'Draft':
      colorStyles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      break;
    case 'Submitted':
      colorStyles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      break;
    case 'Topic Approved':
      colorStyles = 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      break;
    case 'Topic Revision Requested':
      colorStyles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      break;
    case 'Topic Rejected':
      colorStyles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      break;
    case 'Ethics Review':
      colorStyles = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      break;
    case 'Ethics Cleared':
      colorStyles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      break;
    case 'Ethics Rejected':
      colorStyles = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
      break;
    case 'In Progress':
      colorStyles = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      break;
    case 'Submitted for Evaluation':
      colorStyles = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      break;
    case 'Evaluated - Approved':
      colorStyles = 'bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-200 border-green-300 dark:border-green-700 font-semibold';
      break;
    case 'Evaluated - Disapproved':
      colorStyles = 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold';
      break;
    case 'Evaluated - Resubmit':
      colorStyles = 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      break;
    // University Results
    case 'RELEASED':
      colorStyles = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-600 font-bold';
      break;
    case 'WITHHELD':
      colorStyles = 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-600 font-bold animate-pulse';
      break;
    case 'PENDING':
      colorStyles = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${colorStyles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
}
