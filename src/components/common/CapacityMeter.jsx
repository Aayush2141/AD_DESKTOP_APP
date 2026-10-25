import React from 'react';

export default function CapacityMeter({ currentLoad = 0, maxCapacity = 3, showLabel = true, className = '' }) {
  const percentage = Math.min(100, Math.round((currentLoad / (maxCapacity || 1)) * 100));
  const isFull = currentLoad >= maxCapacity;
  const isNear = currentLoad === maxCapacity - 1;

  let barColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';

  if (isFull) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
  } else if (isNear) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
  }

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Guide Capacity Load</span>
          <span className={`px-2 py-0.5 rounded-md border font-semibold ${badgeColor}`}>
            {currentLoad} / {maxCapacity} {isFull ? '(FULL)' : 'Scholars'}
          </span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
