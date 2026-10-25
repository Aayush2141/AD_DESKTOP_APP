import React from 'react';
import Modal from '../common/Modal';
import { AlertTriangle, ShieldAlert, CheckCircle2, BookOpen } from 'lucide-react';

export default function DuplicateWarningModal({ isOpen, onClose, duplicateData, onProceedAnyway = null }) {
  if (!duplicateData) return null;

  const { isDuplicate, highestScore, threshold, matches = [] } = duplicateData;
  const pct = Math.round(highestScore * 100);
  const thresholdPct = Math.round(threshold * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Research Topic Detection Analysis"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
            isDuplicate
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
              : pct > 25
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {isDuplicate ? (
            <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          ) : pct > 25 ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-base">
              {isDuplicate
                ? `High Similarity Detected (${pct}%) - Exceeds Duplication Threshold (${thresholdPct}%)`
                : pct > 25
                ? `Moderate Similarity Flagged (${pct}%) - Review Matching Research`
                : `Original Topic Verified (${pct}% Similarity - Safe to Propose)`}
            </div>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">
              {isDuplicate
                ? 'Ministry of AYUSH policy requires research dissertations to demonstrate distinct clinical originality. A very high overlap with an existing dissertation was found. Please refine your title, scope, or methodology.'
                : 'TF-IDF Cosine & Jaccard token analysis was executed across the nationwide repository of PG dissertations.'}
            </p>
          </div>
        </div>

        {/* Matching Records List */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center">
            <BookOpen className="w-4 h-4 mr-1.5 text-ayush-600" />
            Top Similar Dissertations in Repository ({matches.length})
          </h4>

          {matches.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm text-slate-500">
              No similar dissertations found. Your topic has high novelty!
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, idx) => (
                <div
                  key={match.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex-1">
                      #{match.id} - {match.title}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        match.percentage >= thresholdPct
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}
                    >
                      {match.percentage}% Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {match.abstract}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                      Dept: {match.department_name}
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                      Guide: {match.guide_name || 'Assigned'}
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                      Status: {match.status}
                    </span>
                  </div>

                  {match.matchedTerms && match.matchedTerms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                      <span className="text-slate-400 text-[11px]">Matched terms:</span>
                      {match.matchedTerms.map((term, tIdx) => (
                        <span
                          key={tIdx}
                          className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono text-[10px]"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Revise Topic Details
          </button>
          {onProceedAnyway && (
            <button
              onClick={() => {
                onProceedAnyway();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition-all"
            >
              Submit with Justification
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
