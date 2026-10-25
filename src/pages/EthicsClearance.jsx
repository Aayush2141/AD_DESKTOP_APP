import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UploadCloud,
  FileText,
  Search,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export default function EthicsClearance() {
  const { user, isEthics, isAdmin, isStudent } = useAuth();
  const { addToast } = useToast();

  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Student Submission Form State
  const [myDissertations, setMyDissertations] = useState([]);
  const [studentForm, setStudentForm] = useState({
    dissertation_id: '',
    study_type: 'clinical',
    risk_level: 'medium',
    consent_details: '',
    ethical_justification: '',
    document_name: 'Ethics_Protocol_Dossier.pdf',
    document_path: 'uploads/Ethics_Protocol_Dossier.pdf',
  });

  // Review Modal State (Ethics Committee)
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [reviewVerdict, setReviewVerdict] = useState('Cleared');
  const [reviewComments, setReviewComments] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchClearances = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getAllEthicsClearances({
        status: filterStatus || undefined,
      });
      setClearances(list || []);

      if (isStudent) {
        const myD = await window.api.getDissertations({ scoped: true });
        setMyDissertations(myD || []);
        if (myD && myD.length > 0 && !studentForm.dissertation_id) {
          setStudentForm(prev => ({ ...prev, dissertation_id: myD[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load ethics records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, [user, filterStatus]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.dissertation_id) {
      addToast('Please select a dissertation to submit ethics for', 'warning');
      return;
    }
    if (!studentForm.consent_details.trim() || !studentForm.ethical_justification.trim()) {
      addToast('Please provide consent details and ethical justification', 'warning');
      return;
    }

    try {
      await window.api.submitEthicsClearance({
        ...studentForm,
        dissertation_id: Number(studentForm.dissertation_id),
      });
      addToast('Ethics dossier submitted to Institutional Ethics Committee (IEC)!', 'success');
      fetchClearances();
    } catch (err) {
      addToast(err.message || 'Submission failed', 'error');
    }
  };

  const handleReviewDecision = async () => {
    if (!selectedClearance || !window.api) return;
    try {
      await window.api.reviewEthicsClearance({
        dissertation_id: selectedClearance.dissertation_id,
        status: reviewVerdict,
        committee_comments: reviewComments,
      });
      addToast(`Ethics verdict recorded: ${reviewVerdict}`, 'success');
      setIsReviewModalOpen(false);
      fetchClearances();
    } catch (err) {
      addToast(err.message || 'Review failed', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-purple-600" />
            Institutional Ethics Committee (IEC) Clearance Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ICMR & AYUSH Good Clinical Practice (GCP) compliance for human clinical and animal experimental protocols.
          </p>
        </div>

        {(isEthics || isAdmin) && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500 font-medium"
          >
            <option value="">All Ethics Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Cleared">Cleared by IEC</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Rejected">Rejected</option>
          </select>
        )}
      </div>

      {/* STUDENT: Submit Ethics Dossier Form */}
      {isStudent && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <UploadCloud className="w-4 h-4 mr-1.5 text-ayush-600" />
              Submit Ethical Protocol Dossier
            </h3>
            <span className="text-[11px] text-slate-400">Step 3 of PG Workflow</span>
          </div>

          <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Your Dissertation
              </label>
              <select
                value={studentForm.dissertation_id}
                onChange={(e) => setStudentForm({ ...studentForm, dissertation_id: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500"
              >
                {myDissertations.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id}: {d.title} (Status: {d.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nature of Investigation / Study Type
                </label>
                <select
                  value={studentForm.study_type}
                  onChange={(e) => setStudentForm({ ...studentForm, study_type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500"
                >
                  <option value="clinical">Human Clinical Trial (Ayurvedic Interventions)</option>
                  <option value="animal">Animal Experimental (IAEC oversight)</option>
                  <option value="literature">Literature Review / Standardization (Exempt)</option>
                  <option value="other">In-vitro / Observational</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assessed Patient Risk Level
                </label>
                <select
                  value={studentForm.risk_level}
                  onChange={(e) => setStudentForm({ ...studentForm, risk_level: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500"
                >
                  <option value="minimal">Minimal Risk (Standard Dietary / Non-invasive)</option>
                  <option value="low">Low Risk (Classical Formulations / External Swedana)</option>
                  <option value="medium">Medium Risk (Shodhana / Panchakarma Basti / Virechana)</option>
                  <option value="high">High Risk (Surgical / Ksharasutra / Leech Therapy)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Informed Consent Details & Language Coverage
              </label>
              <textarea
                rows={2}
                value={studentForm.consent_details}
                onChange={(e) => setStudentForm({ ...studentForm, consent_details: e.target.value })}
                placeholder="e.g. Bilingual patient information sheet in Hindi and English. Audio-visual consent for invasive procedures..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ethical Justification & Safety Risk Mitigation Plan
              </label>
              <textarea
                rows={3}
                value={studentForm.ethical_justification}
                onChange={(e) => setStudentForm({ ...studentForm, ethical_justification: e.target.value })}
                placeholder="Explain the clinical benefit vs minimal risk, adverse drug reaction monitoring protocol, and emergency medical management coverage..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-ayush-500"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center space-x-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Protocol to IEC Board</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ethics Committee / Admin / HOD View: Table of Clearances */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
            Institutional Ethics Dossiers ({clearances.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Mandatory clearance required before initiating patient recruitment
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Dissertation Topic</th>
                <th className="py-3 px-4">Scholar</th>
                <th className="py-3 px-4">Study Type</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-center">IEC Status</th>
                <th className="py-3 px-4">Reviewer & Comments</th>
                {(isEthics || isAdmin) && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {clearances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No ethics dossiers found.
                  </td>
                </tr>
              ) : (
                clearances.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 max-w-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {c.dissertation_title}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.enrollment_no}</div>
                    </td>

                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {c.study_type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.risk_level === 'high'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            : c.risk_level === 'medium'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}
                      >
                        {c.risk_level}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          c.status === 'Cleared'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                            : c.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200'
                            : c.status === 'Changes Requested'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{c.committee_comments || 'Pending committee convene'}</div>
                      {c.reviewed_by_name && (
                        <div className="text-[10px] text-slate-400 mt-0.5">By {c.reviewed_by_name}</div>
                      )}
                    </td>

                    {(isEthics || isAdmin) && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedClearance(c);
                            setReviewVerdict(c.status === 'Pending' ? 'Cleared' : c.status);
                            setReviewComments(c.committee_comments || '');
                            setIsReviewModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 font-bold text-xs transition-colors"
                        >
                          Review Dossier
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal for Ethics Committee */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Institutional Ethics Committee Decision"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {selectedClearance?.dissertation_title}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Candidate: {selectedClearance?.student_name} • Risk: {selectedClearance?.risk_level?.toUpperCase()} • Type: {selectedClearance?.study_type}
            </div>
            {selectedClearance?.consent_details && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Consent Details: </span>{selectedClearance.consent_details}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Committee Verdict
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReviewVerdict('Cleared')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  reviewVerdict === 'Cleared'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Clear Protocol
              </button>
              <button
                type="button"
                onClick={() => setReviewVerdict('Changes Requested')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  reviewVerdict === 'Changes Requested'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => setReviewVerdict('Rejected')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  reviewVerdict === 'Rejected'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Reject Protocol
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Committee Directives & Conditions
            </label>
            <textarea
              rows={4}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="State any mandatory serum electrolyte monitoring, consent revisions, or justification for decision..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ayush-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReviewDecision}
              className="px-4 py-2 font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30"
            >
              Submit Official Verdict
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
