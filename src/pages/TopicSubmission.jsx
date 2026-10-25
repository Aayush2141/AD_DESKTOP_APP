import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Search,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Send,
  Save,
  BookOpen,
} from 'lucide-react';
import DuplicateWarningModal from '../components/workflow/DuplicateWarningModal';
import CapacityMeter from '../components/common/CapacityMeter';

const CATEGORIES = [
  'Clinical Trial',
  'Surgical Research',
  'Pharmacognosy & Phytochemistry',
  'Pre-clinical & Animal Experimental',
  'Literature & Lifestyle Regimen',
  'Standardization & Drug Profiling',
];

export default function TopicSubmission({ setActiveTab, onDissertationCreated }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [metadata, setMetadata] = useState({ thrustAreas: [], guides: [], departments: [] });
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    category: 'Clinical Trial',
    thrust_area_id: '',
    guide_id: user?.student_guide_id || '',
    remarks: '',
  });

  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGuideCapacity, setSelectedGuideCapacity] = useState(null);

  // Fetch thrust areas, guides, and departments
  useEffect(() => {
    async function loadMetadata() {
      if (!window.api) return;
      try {
        const meta = await window.api.getSystemMetadata();
        setMetadata(meta);
        if (meta.thrustAreas && meta.thrustAreas.length > 0 && !formData.thrust_area_id) {
          setFormData(prev => ({ ...prev, thrust_area_id: meta.thrustAreas[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMetadata();
  }, []);

  // Update guide capacity when guide selection changes
  useEffect(() => {
    async function checkGuide() {
      if (formData.guide_id && window.api) {
        try {
          const cap = await window.api.checkGuideCapacity(Number(formData.guide_id));
          setSelectedGuideCapacity(cap);
        } catch (e) {
          console.error(e);
        }
      } else {
        setSelectedGuideCapacity(null);
      }
    }
    checkGuide();
  }, [formData.guide_id]);

  const handleDuplicateCheck = async () => {
    if (!formData.title.trim() || !formData.abstract.trim()) {
      addToast('Please enter both title and abstract to run duplicate analysis', 'warning');
      return;
    }

    setCheckingDuplicate(true);
    try {
      const result = await window.api.checkDuplicate({
        title: formData.title,
        abstract: formData.abstract,
        keywords: formData.keywords,
      });
      setDuplicateResult(result);
      setIsDupModalOpen(true);
      if (result.isDuplicate) {
        addToast(`High duplication detected (${Math.round(result.highestScore * 100)}% match).`, 'error');
      } else {
        addToast(`Originality verified (${Math.round(result.highestScore * 100)}% similarity).`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Duplicate check failed', 'error');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (isDraft = false, forceOverride = false) => {
    if (!formData.title.trim() || !formData.abstract.trim()) {
      addToast('Title and Abstract are mandatory', 'warning');
      return;
    }

    if (!isDraft && selectedGuideCapacity?.isFull) {
      addToast(`Selected guide is at full capacity (${selectedGuideCapacity.currentLoad}/${selectedGuideCapacity.maxCapacity}). Please select another guide.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        thrust_area_id: Number(formData.thrust_area_id) || null,
        guide_id: Number(formData.guide_id) || null,
        status: isDraft ? 'Draft' : 'Submitted',
        forceOverride,
      };

      const created = await window.api.createDissertation(payload);
      addToast(
        isDraft ? 'Draft saved successfully' : 'Dissertation topic proposed successfully for HOD approval!',
        'success'
      );
      if (onDissertationCreated) {
        onDissertationCreated(created.id);
      }
      setActiveTab('dashboard');
    } catch (err) {
      if (err.duplicateData) {
        setDuplicateResult(err.duplicateData);
        setIsDupModalOpen(true);
      }
      addToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-ayush-600" />
            Propose PG Dissertation Topic
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit your research proposal aligned with department thrust areas. Duplication check is run automatically.
          </p>
        </div>
        <button
          onClick={handleDuplicateCheck}
          disabled={checkingDuplicate}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center space-x-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{checkingDuplicate ? 'Scanning...' : 'Run Duplication Check'}</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Dissertation Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Clinical Evaluation of Classical Ayurvedic Regimens in ..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
          />
        </div>

        {/* Row: Department Thrust Area & Research Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Department Thrust Research Area <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.thrust_area_id}
              onChange={(e) => setFormData({ ...formData, thrust_area_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
            >
              {metadata.thrustAreas.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.name} ({ta.department_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Research Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guide Selection & Capacity Meter */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5 text-ayush-600" />
              Assigned / Preferred PG Guide
            </label>
            <span className="text-[10px] text-slate-400">Ratio Policy: Max 3 scholars</span>
          </div>

          <select
            value={formData.guide_id}
            onChange={(e) => setFormData({ ...formData, guide_id: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
          >
            <option value="">-- Select Guide --</option>
            {metadata.guides.map((g) => {
              const full = g.current_load >= g.max_capacity;
              return (
                <option key={g.id} value={g.id} disabled={full}>
                  {g.full_name} ({g.designation}, {g.department_name}) — Load: {g.current_load}/{g.max_capacity} {full ? '[FULL - MAXIMUM REACHED]' : ''}
                </option>
              );
            })}
          </select>

          {selectedGuideCapacity && (
            <div className="pt-2">
              <CapacityMeter
                currentLoad={selectedGuideCapacity.currentLoad}
                maxCapacity={selectedGuideCapacity.maxCapacity}
              />
              {selectedGuideCapacity.isFull && (
                <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Guide has reached maximum scholar capacity (3/3). Submission blocked for this guide.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Structured Research Abstract (Objectives, Methodology, Expected Outcomes) <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            required
            value={formData.abstract}
            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            placeholder="Detail the background, problem statement, clinical hypothesis, sample size, primary endpoints, and Ayurvedic formulation/procedure details..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-ayush-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Keywords (Comma separated)
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="e.g. Madhumeha, Diabetes, Rasayana, Herbal Formulation, HbA1c"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Remarks / Additional Protocol Details (Optional)
          </label>
          <input
            type="text"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Any special equipment, multi-centric collaboration or prior literature notes..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-ayush-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting || selectedGuideCapacity?.isFull}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg transition-all flex items-center space-x-2 ${
              selectedGuideCapacity?.isFull
                ? 'bg-slate-500 cursor-not-allowed opacity-50'
                : 'bg-ayush-600 hover:bg-ayush-500 shadow-ayush-600/30'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting Proposal...' : 'Submit Topic for HOD Approval'}</span>
          </button>
        </div>
      </div>

      {/* Duplicate Detection Modal */}
      <DuplicateWarningModal
        isOpen={isDupModalOpen}
        onClose={() => setIsDupModalOpen(false)}
        duplicateData={duplicateResult}
        onProceedAnyway={duplicateResult?.isDuplicate ? () => handleSubmit(false, true) : null}
      />
    </div>
  );
}
