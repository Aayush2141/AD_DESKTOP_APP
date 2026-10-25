import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  FileText,
  Plus,
  Send,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';

export default function ProgressMonitoring() {
  const { user, isStudent, isGuide, isHod, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [dissertations, setDissertations] = useState([]);
  const [selectedDid, setSelectedDid] = useState(null);
  const [activeDissertation, setActiveDissertation] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submit Progress Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    report_period: 'Quarter 1 (Oct-Dec)',
    work_summary: '',
    challenges_faced: '',
    planned_next: '',
  });

  // Guide Review Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [guideFeedback, setGuideFeedback] = useState('');
  const [guideRating, setGuideRating] = useState(5);
  const [isReviewReportModalOpen, setIsReviewReportModalOpen] = useState(false);

  // Update Milestone Modal
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneStatus, setMilestoneStatus] = useState('Completed');
  const [milestoneRemarks, setMilestoneRemarks] = useState('');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Overdue scholars list
  const [overdueList, setOverdueList] = useState([]);
  const [viewOverdueTab, setViewOverdueTab] = useState(false);

  const fetchDissertations = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getDissertations({ scoped: !isAdmin });
      setDissertations(list || []);

      if (list && list.length > 0 && !selectedDid) {
        setSelectedDid(list[0].id);
      }

      const overdue = await window.api.getOverdueDissertations();
      setOverdueList(overdue || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDissertations();
  }, [user]);

  const loadDetails = async (did) => {
    if (!did || !window.api) return;
    try {
      const full = await window.api.getDissertationById(did);
      setActiveDissertation(full);

      const mData = await window.api.getMilestones(did);
      setMilestoneData(mData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedDid) {
      loadDetails(selectedDid);
    }
  }, [selectedDid]);

  const handleUpdateMilestone = async () => {
    if (!selectedMilestone || !window.api) return;
    try {
      await window.api.updateMilestone(selectedMilestone.id, {
        status: milestoneStatus,
        remarks: milestoneRemarks,
      });
      addToast('Milestone updated successfully', 'success');
      setIsMilestoneModalOpen(false);
      loadDetails(selectedDid);
    } catch (err) {
      addToast(err.message || 'Failed to update milestone', 'error');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.work_summary.trim()) {
      addToast('Please describe your research progress summary', 'warning');
      return;
    }
    try {
      await window.api.submitProgressReport({
        dissertation_id: selectedDid,
        ...reportForm,
      });
      addToast('Periodic progress report submitted to your PG Guide!', 'success');
      setIsReportModalOpen(false);
      loadDetails(selectedDid);
    } catch (err) {
      addToast(err.message || 'Failed to submit report', 'error');
    }
  };

  const handleReviewReport = async () => {
    if (!selectedReport || !window.api) return;
    try {
      await window.api.reviewProgressReport({
        id: selectedReport.id,
        guide_feedback: guideFeedback,
        guide_rating: Number(guideRating),
        status: 'Reviewed',
      });
      addToast('Guide evaluation & rating saved', 'success');
      setIsReviewReportModalOpen(false);
      loadDetails(selectedDid);
    } catch (err) {
      addToast(err.message || 'Failed to save review', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-ayush-600" />
            Research Progress Monitoring & Milestone Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Periodic progress evaluation, milestone tracker, guide ratings (1-5 stars), and automated overdue alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewOverdueTab(!viewOverdueTab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              viewOverdueTab
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Alerts ({overdueList.length})</span>
          </button>
        </div>
      </div>

      {/* OVERDUE ALERTS DRAWER / VIEW */}
      {viewOverdueTab && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-600" />
              Scholars With Overdue Milestones ({overdueList.length})
            </h3>
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              Requires immediate supervisor attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDid(item.id);
                  setViewOverdueTab(false);
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80 shadow-sm cursor-pointer hover:border-rose-400 transition-all space-y-1.5"
              >
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scholar: {item.student_name} ({item.enrollment_no})
                </div>
                <div className="text-[11px] text-rose-600 font-semibold flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Overdue: "{item.overdue_milestone}" (Due: {item.due_date})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dissertation Selector List (if multiple) */}
        {!isStudent && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2 max-h-[75vh] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Select Scholar Dissertation ({dissertations.length})
            </div>
            {dissertations.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDid(d.id)}
                className={`w-full p-3 rounded-2xl text-left border transition-all text-xs space-y-1.5 ${
                  selectedDid === d.id
                    ? 'bg-ayush-50 dark:bg-ayush-950/40 border-ayush-400 dark:border-ayush-800 shadow-sm'
                    : 'bg-transparent border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {d.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{d.student_name}</span>
                  <StatusBadge status={d.status} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Right: Active Dissertation Milestones & Reports */}
        <div className={`${isStudent ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {activeDissertation ? (
            <>
              {/* Overview Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {activeDissertation.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Scholar: {activeDissertation.student_name} ({activeDissertation.enrollment_no}) • Guide: {activeDissertation.guide_name || 'Unassigned'}
                    </p>
                  </div>
                  <StatusBadge status={activeDissertation.status} />
                </div>

                {/* Progress Bar */}
                {milestoneData && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">
                        Overall Milestone Progress
                      </span>
                      <span className="text-ayush-600 dark:text-ayush-400 font-bold">
                        {milestoneData.completedCount} / {milestoneData.totalCount} Completed ({milestoneData.progressPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-ayush-600 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${milestoneData.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Milestones Timeline */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-ayush-600" />
                    Dissertation Milestones Timeline
                  </h4>
                  <span className="text-[11px] text-slate-400">Click any milestone to update status</span>
                </div>

                <div className="space-y-3">
                  {milestoneData?.milestones?.map((m) => {
                    const isOverdue = m.effectiveStatus === 'Overdue';
                    const isCompleted = m.effectiveStatus === 'Completed';

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMilestone(m);
                          setMilestoneStatus(m.status);
                          setMilestoneRemarks(m.remarks || '');
                          setIsMilestoneModalOpen(true);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isCompleted
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                            : isOverdue
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/80 animate-pulse'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isOverdue
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {m.order_index}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {m.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                              <span>Due: {m.due_date || 'Unspecified'}</span>
                              {m.completion_date && (
                                <span className="text-emerald-600 font-medium">
                                  • Completed: {m.completion_date}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {m.effectiveStatus}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Periodic Progress Reports & Guide Ratings */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-ayush-600" />
                      Periodic Progress Reports & Guide Star Ratings
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Term reports evaluated with remarks and 1-5 star ratings by the guide
                    </p>
                  </div>

                  {isStudent && (
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-ayush-600 hover:bg-ayush-500 text-white font-bold text-xs flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Term Report</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {activeDissertation.progress_reports?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No periodic progress reports submitted yet.
                    </div>
                  ) : (
                    activeDissertation.progress_reports?.map((pr) => (
                      <div
                        key={pr.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {pr.report_period}
                          </span>
                          <div className="flex items-center space-x-2">
                            {pr.guide_rating && (
                              <div className="flex items-center text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md font-bold">
                                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                <span>{pr.guide_rating} / 5 Stars</span>
                              </div>
                            )}
                            <StatusBadge status={pr.status} />
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Work Completed:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {pr.work_summary}
                          </p>
                        </div>

                        {pr.challenges_faced && (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Challenges / Observations:
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                              {pr.challenges_faced}
                            </p>
                          </div>
                        )}

                        {pr.guide_feedback && (
                          <div className="p-2.5 rounded-xl bg-ayush-50 dark:bg-ayush-950/30 border border-ayush-200 dark:border-ayush-900/60 text-ayush-900 dark:text-ayush-200">
                            <span className="font-bold">Guide Remarks: </span>
                            {pr.guide_feedback}
                          </div>
                        )}

                        {(isGuide || isAdmin) && (
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => {
                                setSelectedReport(pr);
                                setGuideFeedback(pr.guide_feedback || '');
                                setGuideRating(pr.guide_rating || 5);
                                setIsReviewReportModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-bold text-xs hover:bg-amber-200"
                            >
                              Rate & Review Report
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a dissertation to monitor</div>
          )}
        </div>
      </div>

      {/* Student: Submit Progress Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Submit Periodic Progress Report"
      >
        <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reporting Term / Period
            </label>
            <input
              type="text"
              required
              value={reportForm.report_period}
              onChange={(e) => setReportForm({ ...reportForm, report_period: e.target.value })}
              placeholder="e.g. Term 1 (Oct-Dec 2024)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Work Completed During Term <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reportForm.work_summary}
              onChange={(e) => setReportForm({ ...reportForm, work_summary: e.target.value })}
              placeholder="Detail laboratory experiments conducted, subject enrollment count, case report forms filled..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Challenges / Deviations Encountered
            </label>
            <input
              type="text"
              value={reportForm.challenges_faced}
              onChange={(e) => setReportForm({ ...reportForm, challenges_faced: e.target.value })}
              placeholder="e.g. Attrition of 2 patients, delay in chemical reagents..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold rounded-xl text-white bg-ayush-600 hover:bg-ayush-500 shadow-md shadow-ayush-600/30"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Guide: Rate & Review Modal */}
      <Modal
        isOpen={isReviewReportModalOpen}
        onClose={() => setIsReviewReportModalOpen(false)}
        title="Guide Progress Evaluation & Rating"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Guide Star Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setGuideRating(star)}
                  className="p-1 text-amber-500 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= guideRating ? 'fill-current text-amber-500' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
              <span className="font-bold text-slate-700 dark:text-slate-300 ml-2">
                {guideRating} of 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Guide Remarks & Directions
            </label>
            <textarea
              rows={4}
              value={guideFeedback}
              onChange={(e) => setGuideFeedback(e.target.value)}
              placeholder="State remarks on research rigor, adherence to GCP standards..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsReviewReportModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReviewReport}
              className="px-4 py-2 font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30"
            >
              Save Rating & Remarks
            </button>
          </div>
        </div>
      </Modal>

      {/* Milestone Status Update Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title={`Update Milestone: ${selectedMilestone?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Milestone Status
            </label>
            <select
              value={milestoneStatus}
              onChange={(e) => setMilestoneStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={milestoneRemarks}
              onChange={(e) => setMilestoneRemarks(e.target.value)}
              placeholder="Add observation or date details..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsMilestoneModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateMilestone}
              className="px-4 py-2 font-bold rounded-xl text-white bg-ayush-600 hover:bg-ayush-500 shadow-md"
            >
              Update Milestone
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
