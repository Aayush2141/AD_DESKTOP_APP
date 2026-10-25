import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings as SettingsIcon,
  Database,
  Save,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [settings, setSettings] = useState({
    guide_max_capacity: '3',
    duplicate_similarity_threshold: '0.45',
    academic_year: '2025-2026',
    university_result_auto_withhold: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [backingUp, setBackingUp] = useState(false);

  const fetchSettings = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const res = await window.api.getSettings();
      if (res && res.settings) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key, val) => {
    if (!window.api) return;
    setSavingKey(key);
    try {
      await window.api.updateSetting(key, val);
      setSettings(prev => ({ ...prev, [key]: val }));
      addToast(`Setting "${key}" updated successfully`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update setting', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleExportBackup = async () => {
    if (!window.api) return;
    try {
      setBackingUp(true);
      const defaultName = `AYUSH_PGDMS_Backup_${new Date().toISOString().split('T')[0]}.sqlite`;
      const savePath = await window.api.selectSaveFile(defaultName);
      if (!savePath) {
        setBackingUp(false);
        return;
      }

      await window.api.exportDatabase(savePath);
      addToast(`Database backed up successfully to: ${savePath}`, 'success');
    } catch (err) {
      addToast(err.message || 'Backup failed', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const handleImportBackup = async () => {
    if (!window.api) return;
    if (!window.confirm('Restoring a backup will replace current database records with the chosen backup file. Continue?')) {
      return;
    }

    try {
      const openPath = await window.api.selectOpenFile();
      if (!openPath) return;

      await window.api.importDatabase(openPath);
      addToast('Database restored successfully from backup! Reloading data...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      addToast(err.message || 'Restore failed', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2 text-ayush-600" />
            System Governance & Offline Backup / Restore
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure nationwide student-guide ratio constraints, duplicate threshold values, and backup SQLite state.
          </p>
        </div>
      </div>

      {/* Guide Capacity & Duplicate Threshold Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-ayush-600" />
          Regulatory Thresholds & Ratio Configuration
        </h3>

        <div className="space-y-4 text-xs">
          {/* Guide Max Capacity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Maximum Scholar Capacity Per Guide (Student-Guide Ratio)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                Strict limit on active dissertations permitted per PG guide (defaults to 3). System prevents assignments exceeding this threshold.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="10"
                value={settings.guide_max_capacity}
                onChange={(e) => setSettings({ ...settings, guide_max_capacity: e.target.value })}
                className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-center text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => handleUpdate('guide_max_capacity', settings.guide_max_capacity)}
                disabled={savingKey === 'guide_max_capacity'}
                className="px-3 py-1.5 bg-ayush-600 hover:bg-ayush-500 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* Duplicate Similarity Threshold */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Duplicate Research Topic Similarity Threshold
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                TF-IDF Cosine & Jaccard threshold (e.g. 0.45 = 45%). Topics exceeding this similarity score against existing dissertations trigger duplicate warnings and block submission.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.1"
                max="0.9"
                step="0.05"
                value={settings.duplicate_similarity_threshold}
                onChange={(e) => setSettings({ ...settings, duplicate_similarity_threshold: e.target.value })}
                className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-center text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => handleUpdate('duplicate_similarity_threshold', settings.duplicate_similarity_threshold)}
                disabled={savingKey === 'duplicate_similarity_threshold'}
                className="px-3 py-1.5 bg-ayush-600 hover:bg-ayush-500 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* Academic Session */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Active Academic Session
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Current post-graduate academic year for enrollment and thesis submissions.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={settings.academic_year}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-center text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => handleUpdate('academic_year', settings.academic_year)}
                disabled={savingKey === 'academic_year'}
                className="px-3 py-1.5 bg-ayush-600 hover:bg-ayush-500 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Database Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <Database className="w-4 h-4 mr-2 text-ayush-600" />
          Offline-First SQLite Database Backup & Restore
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The application operates offline using local embedded SQLite with WAL journaling in the user application data directory. You can export a snapshot backup or restore an existing backup file.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Backup */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Full Database Backup</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Creates a point-in-time `.sqlite` copy of all dissertations, students, guide allocations, and audit logs to your desired location.
            </p>
            <button
              onClick={handleExportBackup}
              disabled={backingUp}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{backingUp ? 'Creating Backup...' : 'Export SQLite Backup'}</span>
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>Restore Database from Backup</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Select an existing `.sqlite` database backup file to restore. A safety copy of your current database will be saved before replacing.
            </p>
            <button
              onClick={handleImportBackup}
              className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import & Restore Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
