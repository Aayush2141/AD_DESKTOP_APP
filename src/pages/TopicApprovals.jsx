import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CheckSquare,
  Search,
  Filter,
  Check,
  X,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import CapacityMeter from '../components/common/CapacityMeter';
import Modal from '../components/common/Modal';
import DuplicateWarningModal from '../components/workflow/DuplicateWarningModal';

export default function TopicApprovals({ onSelectDissertation }) {
  const { user, isAdmin, isHod } = useAuth();
  const { addToast } = useToast();

  const [dissertations, setDissertations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Submitted');

  // Action Modal State
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'revision', 'reject', 'assign_guide'
  const [actionComments, setActionComments] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [guideCapacityInfo, setGuideCapacityInfo] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Duplicate Inspection Modal
  const [duplicateModalData, setDuplicateModalData] = useState(null);

  const fetchTopics = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getDissertations({
        status: statusFilter || undefined,
        search: search || undefined,
        scoped: !isAdmin, // HOD scoped to department
      });
      setDissertations(list || []);

      const meta = await window.api.getSystemMetadata();
      setGuides(meta.guides || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load topic approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [user, statusFilter, search]);

  useEffect(() => {
    async function checkCap() {
      if (selectedGuideId && window.api) {
        try {
          const cap = await window.api.checkGuideCapacity(Number(selectedGuideId));
          setGuideCapacityInfo(cap);
        } catch (e) {
          console.error(e);
        }
      } else {
        setGuideCapacityInfo(null);
      }
    }
    checkCap();
  }, [selectedGuideId]);

  const handleOpenAction = (topic, type) => {
    setSelectedTopic(topic);
    setActionType(type);
    setActionComments('');
    setSelectedGuideId(topic.guide_id || '');
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedTopic || !window.api) return;
    try {
      if (actionType === 'approve') {
        await window.api.transitionStatus(
          selectedTopic.id,
          'Topic Approved',
          actionComments || 'Topic approved by Department Head'
        );
        addToast(`Topic approved successfully!`, 'success');
      } else if (actionType === 'revision') {
        if (!actionComments.trim()) {
          addToast('Please provide revision guidelines in remarks', 'warning');
          return;
        }
        await window.api.transitionStatus(
          selectedTopic.id,
          'Topic Revision Requested',
          actionComments
        );
        addToast(`Revision requested from scholar`, 'info');
      } else if (actionType === 'reject') {
        await window.api.transitionStatus(
          selectedTopic.id,
          'Topic Rejected',
          actionComments || 'Topic rejected'
        );
        addToast(`Topic rejected`, 'error');
      } else if (actionType === 'assign_guide') {
        if (!selectedGuideId) {
          addToast('Please select a guide', 'warning');
          return;
        }
        if (guideCapacityInfo?.isFull) {
          addToast(`Guide has reached maximum scholar capacity (${guideCapacityInfo.currentLoad}/${guideCapacityInfo.maxCapacity}). Assignment blocked.`, 'error');
          return;
        }
        await window.api.assignGuide(selectedTopic.id, Number(selectedGuideId));
        addToast(`Guide assigned successfully!`, 'success');
      }

      setIsActionModalOpen(false);
      fetchTopics();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleInspectDuplicate = async (topic) => {
    if (!window.api) return;
    try {
      const res = await window.api.checkDuplicate({
        title: topic.title,
        abstract: topic.abstract,
        keywords: topic.keywords,
        excludeId: topic.id,
      });
      setDuplicateModalData(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-amber-600" />
            HOD Topic Scrutiny & Guide Allocation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review proposed PG dissertations, ensure alignment with department thrust areas, and maintain guide capacity ratio.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholar or topic..."
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500 font-medium"
          >
            <option value="">All Topics</option>
            <option value="Submitted">Pending Submitted</option>
            <option value="Topic Approved">Approved Topics</option>
            <option value="Topic Revision Requested">Revision Requested</option>
            <option value="Topic Rejected">Rejected Topics</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Topic Details & Department</th>
                <th className="py-3.5 px-4">Scholar Info</th>
                <th className="py-3.5 px-4">Allocated Guide & Capacity</th>
                <th className="py-3.5 px-4 text-center">Duplication Match</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dissertations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No topics found matching current filter.
                  </td>
                </tr>
              ) : (
                dissertations.map((t) => {
                  const similarityPct = Math.round((t.similarity_score || 0) * 100);
                  const isHighSim = similarityPct >= 45;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {t.department_name} • {t.thrust_area_name || t.category}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {t.student_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t.enrollment_no}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[160px]">
                        {t.guide_name ? (
                          <div className="space-y-1">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {t.guide_name}
                            </div>
                            <CapacityMeter
                              currentLoad={t.guide_current_load || 0}
                              maxCapacity={t.guide_max_capacity || 3}
                              showLabel={false}
                            />
                            <div className="text-[10px] text-slate-400">
                              Load: {t.guide_current_load || 0}/{t.guide_max_capacity || 3}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-[11px]">
                            No Guide Assigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleInspectDuplicate(t)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] border transition-transform hover:scale-105 ${
                            isHighSim
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 animate-pulse'
                              : similarityPct > 25
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300'
                          }`}
                          title="Click to inspect duplicate similarity"
                        >
                          {similarityPct}% Sim
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {t.status === 'Submitted' && (
                            <>
                              <button
                                onClick={() => handleOpenAction(t, 'approve')}
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
                                title="Approve Topic"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenAction(t, 'revision')}
                                className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-colors"
                                title="Request Revision"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenAction(t, 'reject')}
                                className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition-colors"
                                title="Reject Topic"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleOpenAction(t, 'assign_guide')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                            title="Assign / Reassign Guide"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Execution Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === 'approve'
            ? 'Approve Dissertation Topic'
            : actionType === 'revision'
            ? 'Request Topic Revision'
            : actionType === 'reject'
            ? 'Reject Dissertation Topic'
            : 'Assign / Reallocate PG Guide'
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">Selected Topic: </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">"{selectedTopic?.title}"</span>
            <div className="mt-1 text-[11px] text-slate-500">
              Scholar: {selectedTopic?.student_name} ({selectedTopic?.enrollment_no})
            </div>
          </div>

          {actionType === 'assign_guide' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Department Guide (Max 3 scholars)
              </label>
              <select
                value={selectedGuideId}
                onChange={(e) => setSelectedGuideId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ayush-500"
              >
                <option value="">-- Choose Guide --</option>
                {guides.map((g) => {
                  const isFull = g.current_load >= g.max_capacity;
                  return (
                    <option key={g.id} value={g.id} disabled={isFull}>
                      {g.full_name} ({g.designation}) — Load: {g.current_load}/{g.max_capacity} {isFull ? '[FULL]' : ''}
                    </option>
                  );
                })}
              </select>

              {guideCapacityInfo && (
                <div className="pt-2">
                  <CapacityMeter
                    currentLoad={guideCapacityInfo.currentLoad}
                    maxCapacity={guideCapacityInfo.maxCapacity}
                  />
                  {guideCapacityInfo.isFull && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">
                      ⚠️ Selected guide is currently full ({guideCapacityInfo.currentLoad}/{guideCapacityInfo.maxCapacity}). Reallocation blocked.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Remarks / Directions for Scholar <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                placeholder="State approval conditions, methodology adjustments, or revision reasons..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ayush-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAction}
              disabled={actionType === 'assign_guide' && guideCapacityInfo?.isFull}
              className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : actionType === 'revision'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : actionType === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : guideCapacityInfo?.isFull
                  ? 'bg-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-ayush-600 hover:bg-ayush-500 shadow-ayush-600/30'
              }`}
            >
              Confirm Action
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Inspection Modal */}
      <DuplicateWarningModal
        isOpen={!!duplicateModalData}
        onClose={() => setDuplicateModalData(null)}
        duplicateData={duplicateModalData}
      />
    </div>
  );
}
