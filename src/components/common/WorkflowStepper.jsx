import React from 'react';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'Topic Selection', keys: ['Draft', 'Submitted'] },
  { id: 2, name: 'HOD Approval', keys: ['Topic Approved', 'Topic Revision Requested', 'Topic Rejected'] },
  { id: 3, name: 'Ethics Clearance', keys: ['Ethics Review', 'Ethics Cleared', 'Ethics Rejected'] },
  { id: 4, name: 'Research Progress', keys: ['In Progress'] },
  { id: 5, name: 'Defense Evaluation', keys: ['Submitted for Evaluation', 'Evaluated - Resubmit'] },
  { id: 6, name: 'University Result', keys: ['Evaluated - Approved', 'Evaluated - Disapproved'] },
];

function getStageStatus(stage, currentStatus) {
  // Determine if this stage is completed, active, or pending
  const statusOrder = [
    'Draft',
    'Submitted',
    'Topic Revision Requested',
    'Topic Rejected',
    'Topic Approved',
    'Ethics Review',
    'Ethics Rejected',
    'Ethics Cleared',
    'In Progress',
    'Submitted for Evaluation',
    'Evaluated - Resubmit',
    'Evaluated - Disapproved',
    'Evaluated - Approved',
  ];

  if (currentStatus === 'Evaluated - Disapproved' && stage.id === 6) {
    return 'disapproved';
  }
  if (currentStatus === 'Evaluated - Approved' && stage.id === 6) {
    return 'approved';
  }

  // Active check
  if (stage.keys.includes(currentStatus)) {
    if (currentStatus.includes('Rejected') || currentStatus.includes('Disapproved')) return 'rejected';
    if (currentStatus.includes('Revision')) return 'warning';
    return 'active';
  }

  // Past check
  if (stage.id === 1 && currentStatus !== 'Draft') return 'completed';
  if (stage.id === 2 && ['Topic Approved', 'Ethics Review', 'Ethics Cleared', 'In Progress', 'Submitted for Evaluation', 'Evaluated - Approved', 'Evaluated - Disapproved'].includes(currentStatus)) return 'completed';
  if (stage.id === 3 && ['Ethics Cleared', 'In Progress', 'Submitted for Evaluation', 'Evaluated - Approved', 'Evaluated - Disapproved'].includes(currentStatus)) return 'completed';
  if (stage.id === 4 && ['Submitted for Evaluation', 'Evaluated - Approved', 'Evaluated - Disapproved'].includes(currentStatus)) return 'completed';
  if (stage.id === 5 && ['Evaluated - Approved', 'Evaluated - Disapproved'].includes(currentStatus)) return 'completed';

  return 'pending';
}

export default function WorkflowStepper({ currentStatus = 'Draft', className = '' }) {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />

        {STAGES.map((stage) => {
          const state = getStageStatus(stage, currentStatus);

          let circleClass = 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700';
          let labelClass = 'text-slate-400 dark:text-slate-500';
          let icon = <span className="text-xs font-bold">{stage.id}</span>;

          if (state === 'completed' || state === 'approved') {
            circleClass = 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100 dark:ring-emerald-950/60';
            labelClass = 'text-emerald-700 dark:text-emerald-400 font-semibold';
            icon = <Check className="w-4 h-4 stroke-[2.5]" />;
          } else if (state === 'active') {
            circleClass = 'bg-ayush-600 text-white border-ayush-500 shadow-lg shadow-ayush-600/40 ring-4 ring-ayush-100 dark:ring-ayush-950/80 animate-pulse';
            labelClass = 'text-ayush-600 dark:text-ayush-400 font-bold';
            icon = <Clock className="w-4 h-4" />;
          } else if (state === 'warning') {
            circleClass = 'bg-amber-500 text-white border-amber-400 ring-4 ring-amber-100 dark:ring-amber-950/80';
            labelClass = 'text-amber-600 dark:text-amber-400 font-bold';
            icon = <AlertCircle className="w-4 h-4" />;
          } else if (state === 'rejected' || state === 'disapproved') {
            circleClass = 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/80';
            labelClass = 'text-rose-600 dark:text-rose-400 font-bold';
            icon = <XCircle className="w-4 h-4" />;
          }

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${circleClass}`}
              >
                {icon}
              </div>
              <span className={`mt-2 text-xs text-center font-medium max-w-[85px] leading-tight ${labelClass}`}>
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
