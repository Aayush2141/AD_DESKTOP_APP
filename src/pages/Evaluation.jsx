import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Award,
  Upload,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  ShieldCheck,
  Star,
  BookOpen,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export default function Evaluation({ setActiveTab, onSelectDissertation }) {
  const { user, isStudent, isGuide, isHod, isAdmin, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [dissertations, setDissertations] = useState([]);
  const [selectedDid, setSelectedDid] = useState(null);
  const [activeDissertation, setActiveDissertation] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student thesis upload state
  const [thesisFile, setThesisFile] = useState(null);
  const [submittingThesis, setSubmittingThesis] = useState(false);

  // Evaluation Form State (Guide & External Examiner)
  const [evalForm, setEvalForm] = useState({
    guide_score: 45,
    guide_comments: '',
    external_examiner_name: 'Prof. S. K. Mishra (External Viva Board Chair)',
    external_score: 46,
    external_comments: '',
    final_result: 'Approved', // 'Approved', 'Disapproved', 'Resubmit'
    rubric: {
      originality: 9,
      literature: 9,
      methodology: 9.5,
      statistics: 9,
      defense: 9.5,
    },
  });

  const fetchDissertations = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getDissertations({ scoped: !isAdmin });
      setDissertations(list || []);
      if (list && list.length > 0 && !selectedDid) {
        setSelectedDid(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDissertations();
  }, [user]);

  const loadEvaluation = async (did) => {
    if (!did || !window.api) return;
    try {
      const full = await window.api.getDissertationById(did);
      setActiveDissertation(full);

      const ev = await window.api.getEvaluation(did);
      setEvaluation(ev);
      if (ev) {
        let rub = { originality: 9, literature: 9, methodology: 9, statistics: 9, defense: 9 };
        try {
          if (ev.rubric_scores_json) rub = JSON.parse(ev.rubric_scores_json);
        } catch (e) {}

        setEvalForm({
          guide_score: ev.guide_score || 45,
          guide_comments: ev.guide_comments || '',
          external_examiner_name: ev.external_examiner_name || 'Prof. S. K. Mishra',
          external_score: ev.external_score || 45,
          external_comments: ev.external_comments || '',
          final_result: ev.final_result || 'Approved',
          rubric: rub,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedDid) {
      loadEvaluation(selectedDid);
    }
  }, [selectedDid]);

  const handleStudentSubmitThesis = async () => {
    if (!window.api || !selectedDid) return;
    setSubmittingThesis(true);
    try {
      await window.api.submitFinalDissertation({
        dissertation_id: selectedDid,
        thesis_file_name: thesisFile?.name || 'Final_PG_Dissertation_Ayush.pdf',
        thesis_file_path: 'uploads/Final_PG_Dissertation_Ayush.pdf',
      });
      addToast('Final dissertation submitted for viva evaluation!', 'success');
      loadEvaluation(selectedDid);
    } catch (err) {
      addToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmittingThesis(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!window.api || !selectedDid) return;
    try {
      await window.api.saveEvaluation({
        dissertation_id: selectedDid,
        guide_score: Number(evalForm.guide_score),
        guide_comments: evalForm.guide_comments,
        external_examiner_name: evalForm.external_examiner_name,
        external_score: Number(evalForm.external_score),
        external_comments: evalForm.external_comments,
        rubric_scores: evalForm.rubric,
        final_result: evalForm.final_result,
      });

      if (evalForm.final_result === 'Approved') {
        addToast(
          '🎉 Dissertation APPROVED! University final year result is automatically RELEASED.',
          'success'
        );
      } else if (evalForm.final_result === 'Disapproved') {
        addToast(
          '⚠️ Dissertation DISAPPROVED. University final year result is flagged as WITHHELD.',
          'error'
        );
      } else {
        addToast('Evaluation saved with verdict: Resubmit requested', 'info');
      }

      await refreshUser();
      loadEvaluation(selectedDid);
      fetchDissertations();
    } catch (err) {
      addToast(err.message || 'Failed to save evaluation', 'error');
    }
  };

  const currentResultStatus = activeDissertation?.final_year_result_status;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Award className="w-5 h-5 mr-2 text-ayush-600" />
            Dissertation Defense Evaluation & University Result Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured rubric defense evaluation by guide and external examiner. Determines automatic Result Release or Withholding.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('university-results')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
        >
          <GraduationCap className="w-4 h-4 text-ayush-600" />
          <span>View Degree Results Dashboard →</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dissertation Selector (if not student) */}
        {!isStudent && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2 max-h-[75vh] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Scholars for Defense Evaluation ({dissertations.length})
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

        {/* Right: Active Evaluation & Automatic Result Governance Screen */}
        <div className={`${isStudent ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {activeDissertation ? (
            <>
              {/* REGULATORY WITHHOLDING EXPLANATION BANNER */}
              <div
                className={`p-5 rounded-3xl border shadow-md flex items-start space-x-4 ${
                  currentResultStatus === 'RELEASED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl ${
                    currentResultStatus === 'RELEASED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {currentResultStatus === 'RELEASED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold uppercase tracking-wider text-[11px]">
                      Regulatory Degree Requirement
                    </span>
                    <StatusBadge status={currentResultStatus || 'WITHHELD'} />
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">
                    {currentResultStatus === 'RELEASED'
                      ? 'The dissertation has been formally Approved. Per university regulations, the scholar’s final-year marks and university results are RELEASED.'
                      : 'University Regulation: If a PG dissertation is Disapproved, Resubmit, or not submitted, the candidate\'s final-year university results are automatically WITHHELD. Automatic release is granted only upon evaluation approval.'}
                  </p>
                </div>
              </div>

              {/* Dissertation Info Summary */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {activeDissertation.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Candidate: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeDissertation.student_name}</span> ({activeDissertation.enrollment_no}) • Department of {activeDissertation.department_name}
                    </p>
                  </div>
                  <StatusBadge status={activeDissertation.status} />
                </div>
              </div>

              {/* STUDENT: Upload Final Dissertation File */}
              {isStudent && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                    <Upload className="w-4 h-4 mr-2 text-ayush-600" />
                    Upload Complete Thesis / Final Dissertation Document
                  </h4>
                  <p className="text-xs text-slate-500">
                    Attach your full dissertation PDF with certifications, ethics clearance certificate, and laboratory data.
                  </p>

                  <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50 dark:bg-slate-800/40">
                    <FileCheck className="w-8 h-8 text-ayush-600 mx-auto" />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Select thesis PDF file
                      </span>
                      <p className="text-[11px] text-slate-400">PDF up to 50MB</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setThesisFile(e.target.files[0])}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-ayush-50 file:text-ayush-700 hover:file:bg-ayush-100"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleStudentSubmitThesis}
                      disabled={submittingThesis}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-ayush-600 hover:bg-ayush-500 shadow-md shadow-ayush-600/30 transition-all flex items-center space-x-2"
                    >
                      <span>Submit for External Defense Viva</span>
                    </button>
                  </div>
                </div>
              )}

              {/* EVALUATION FORM (For Guides, External Examiners & Admins) */}
              {(!isStudent || evaluation) && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-ayush-600" />
                        Defense Rubric & Marks Board
                      </h4>
                      <p className="text-xs text-slate-400">
                        50 marks internal guide score + 50 marks external examiner score
                      </p>
                    </div>
                    {evaluation && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-ayush-100 dark:bg-ayush-950/80 text-ayush-800 dark:text-ayush-300 border border-ayush-200">
                        Total Score: {evaluation.total_percentage || 0}%
                      </span>
                    )}
                  </div>

                  {/* Rubric Criteria 5-Dimension Slider/Scores */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                      Structured Defense Rubric (Out of 10 points each):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>1. Originality & Thrust Alignment:</span>
                          <span className="text-ayush-600">{evalForm.rubric.originality} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm.rubric.originality}
                          onChange={(e) =>
                            setEvalForm({
                              ...evalForm,
                              rubric: { ...evalForm.rubric, originality: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full accent-ayush-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>2. Classical Ayurvedic Literature Review:</span>
                          <span className="text-ayush-600">{evalForm.rubric.literature} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm.rubric.literature}
                          onChange={(e) =>
                            setEvalForm({
                              ...evalForm,
                              rubric: { ...evalForm.rubric, literature: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full accent-ayush-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>3. Methodology, GCP & Ethical Rigor:</span>
                          <span className="text-ayush-600">{evalForm.rubric.methodology} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm.rubric.methodology}
                          onChange={(e) =>
                            setEvalForm({
                              ...evalForm,
                              rubric: { ...evalForm.rubric, methodology: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full accent-ayush-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>4. Statistical Rigor & Bio-Analysis:</span>
                          <span className="text-ayush-600">{evalForm.rubric.statistics} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm.rubric.statistics}
                          onChange={(e) =>
                            setEvalForm({
                              ...evalForm,
                              rubric: { ...evalForm.rubric, statistics: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full accent-ayush-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex justify-between font-semibold mb-1">
                          <span>5. Dissertation Defense & Viva Presentation:</span>
                          <span className="text-ayush-600">{evalForm.rubric.defense} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm.rubric.defense}
                          onChange={(e) =>
                            setEvalForm({
                              ...evalForm,
                              rubric: { ...evalForm.rubric, defense: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full accent-ayush-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Marks Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        PG Guide Marks (Max 50)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={evalForm.guide_score}
                        onChange={(e) => setEvalForm({ ...evalForm, guide_score: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                      <textarea
                        rows={2}
                        value={evalForm.guide_comments}
                        onChange={(e) => setEvalForm({ ...evalForm, guide_comments: e.target.value })}
                        placeholder="Guide comments..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        External Examiner Marks (Max 50)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={evalForm.external_score}
                        onChange={(e) => setEvalForm({ ...evalForm, external_score: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={evalForm.external_examiner_name}
                        onChange={(e) =>
                          setEvalForm({ ...evalForm, external_examiner_name: e.target.value })
                        }
                        placeholder="External examiner name & institution..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Final Verdict Selector */}
                  <div className="space-y-2 text-xs">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">
                      Final Examination Board Verdict (Automatic Result Trigger)
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, final_result: 'Approved' })}
                        className={`p-3 rounded-2xl font-bold border transition-all text-center flex flex-col items-center space-y-1 ${
                          evalForm.final_result === 'Approved'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Approved</span>
                        <span className="text-[10px] font-normal opacity-90">Auto RELEASE Result</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, final_result: 'Disapproved' })}
                        className={`p-3 rounded-2xl font-bold border transition-all text-center flex flex-col items-center space-y-1 ${
                          evalForm.final_result === 'Disapproved'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Disapproved</span>
                        <span className="text-[10px] font-normal opacity-90">Auto WITHHOLD Result</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEvalForm({ ...evalForm, final_result: 'Resubmit' })}
                        className={`p-3 rounded-2xl font-bold border transition-all text-center flex flex-col items-center space-y-1 ${
                          evalForm.final_result === 'Resubmit'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                        <span>Resubmit</span>
                        <span className="text-[10px] font-normal opacity-90">Result Remains Withheld</span>
                      </button>
                    </div>
                  </div>

                  {(!isStudent || isAdmin) && (
                    <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={handleSaveEvaluation}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-ayush-600 to-emerald-600 hover:from-ayush-500 hover:to-emerald-500 shadow-lg shadow-ayush-600/30 transition-all"
                      >
                        Commit Official Evaluation & Update Degree Result
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a dissertation to evaluate</div>
          )}
        </div>
      </div>
    </div>
  );
}
