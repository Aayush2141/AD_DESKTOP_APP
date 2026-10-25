import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  Plus,
  ExternalLink,
  Search,
  Filter,
  Trash2,
  Award,
} from 'lucide-react';
import Modal from '../components/common/Modal';

const INDEXING_OPTIONS = ['Scopus', 'Web of Science', 'PubMed', 'UGC-CARE', 'Peer-Reviewed', 'Other'];

export default function Publications() {
  const { user, isStudent, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterIndexing, setFilterIndexing] = useState('');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [myDissertations, setMyDissertations] = useState([]);
  const [form, setForm] = useState({
    dissertation_id: '',
    title: '',
    journal_name: '',
    doi: '',
    indexing: 'PubMed',
    publication_year: 2025,
    status: 'Published',
    url: '',
  });

  const fetchPublications = async () => {
    if (!window.api) return;
    try {
      setLoading(true);
      const list = await window.api.getPublications({
        indexing: filterIndexing || undefined,
      });
      setPublications(list || []);

      if (isStudent || isAdmin) {
        const diss = await window.api.getDissertations({ scoped: isStudent });
        setMyDissertations(diss || []);
        if (diss && diss.length > 0 && !form.dissertation_id) {
          setForm(prev => ({ ...prev, dissertation_id: diss[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [user, filterIndexing]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.dissertation_id) {
      addToast('Please select related dissertation', 'warning');
      return;
    }
    if (!form.title.trim() || !form.journal_name.trim()) {
      addToast('Title and Journal Name are required', 'warning');
      return;
    }

    try {
      await window.api.addPublication({
        ...form,
        dissertation_id: Number(form.dissertation_id),
        publication_year: Number(form.publication_year),
      });
      addToast('Publication recorded successfully!', 'success');
      setIsAddModalOpen(false);
      setForm({
        dissertation_id: myDissertations[0]?.id || '',
        title: '',
        journal_name: '',
        doi: '',
        indexing: 'PubMed',
        publication_year: 2025,
        status: 'Published',
        url: '',
      });
      fetchPublications();
    } catch (err) {
      addToast(err.message || 'Failed to add publication', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this publication record?')) return;
    try {
      await window.api.deletePublication(id);
      addToast('Publication deleted', 'info');
      fetchPublications();
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const filtered = publications.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(s) ||
      p.journal_name.toLowerCase().includes(s) ||
      (p.doi && p.doi.toLowerCase().includes(s)) ||
      p.student_name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-ayush-600" />
            PG Dissertation Publications Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indexed peer-reviewed publications (Scopus, PubMed, UGC-CARE) generated from PG research work.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ayush-600 hover:bg-ayush-500 text-white shadow-md shadow-ayush-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Publication</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by paper title, journal, DOI, or author..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-ayush-500"
          />
        </div>

        <select
          value={filterIndexing}
          onChange={(e) => setFilterIndexing(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200"
        >
          <option value="">All Indexing Databases</option>
          {INDEXING_OPTIONS.map((idx) => (
            <option key={idx} value={idx}>{idx}</option>
          ))}
        </select>
      </div>

      {/* Publications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No publications found matching current filter.
          </div>
        ) : (
          filtered.map((pub) => (
            <div
              key={pub.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                    {pub.indexing}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">{pub.publication_year}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                  {pub.title}
                </h3>

                <div className="text-xs text-ayush-600 dark:text-ayush-400 font-semibold italic">
                  {pub.journal_name}
                </div>

                {pub.doi && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    DOI: {pub.doi}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div>
                  Scholar: <span className="text-slate-700 dark:text-slate-300 font-medium">{pub.student_name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ayush-600 dark:text-ayush-400 hover:underline flex items-center font-bold"
                    >
                      <span>Read Paper</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(pub.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Publication Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Research Publication"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Dissertation Origin <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.dissertation_id}
              onChange={(e) => setForm({ ...form, dissertation_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            >
              {myDissertations.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id}: {d.title} ({d.student_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Paper Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Therapeutic efficacy of Virechana Karma in Plaque Psoriasis..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Journal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.journal_name}
                onChange={(e) => setForm({ ...form, journal_name: e.target.value })}
                placeholder="e.g. Journal of Ayurveda and Integrative Medicine (JAIM)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Indexing Database
              </label>
              <select
                value={form.indexing}
                onChange={(e) => setForm({ ...form, indexing: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
              >
                {INDEXING_OPTIONS.map((idx) => (
                  <option key={idx} value={idx}>{idx}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Publication Year
              </label>
              <input
                type="number"
                min="2010"
                max="2030"
                value={form.publication_year}
                onChange={(e) => setForm({ ...form, publication_year: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Publication Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="Published">Published</option>
                <option value="Accepted">Accepted</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                DOI Identifier
              </label>
              <input
                type="text"
                value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })}
                placeholder="10.1016/j.jaim..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Article Web URL
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://doi.org/10.1016/..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold rounded-xl text-white bg-ayush-600 hover:bg-ayush-500 shadow-md shadow-ayush-600/30"
            >
              Record Publication
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
