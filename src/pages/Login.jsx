import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, demoAccounts } = useAuth();
  const [email, setEmail] = useState('admin@ayush.gov.in');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Handled in context toast
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (acc) => {
    setEmail(acc.email);
    setPassword(acc.defaultPassword);
    // Instant login for convenience
    login(acc.email, acc.defaultPassword);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-navy-950 to-slate-950 p-6 selection:bg-ayush-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-ayush-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-ayush-950/80 border border-ayush-500/30 text-ayush-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Education • Post Graduate Governance</span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ayush-600 via-ayush-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-ayush-600/30 font-serif font-extrabold text-2xl">
              आयु
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Ministry of AYUSH
            </h1>
          </div>
          <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
            National PG Dissertation Management Portal: Topic Duplication Check, Ratio Enforcement, Ethical Review & Degree Result Governance.
          </p>
        </div>

        {/* Main Content Grid: Login Form + Quick Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left: Login Form Card */}
          <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Portal Sign In</h2>
              <p className="text-xs text-slate-400 mb-6">Enter your registered credentials to access your dashboard.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@ayush.gov.in"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ayush-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ayush-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-ayush-600 to-emerald-600 hover:from-ayush-500 hover:to-emerald-500 transition-all duration-200 shadow-lg shadow-ayush-600/30 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6 text-center text-[11px] text-slate-400">
              Offline-first desktop application • Encrypted SQLite
            </div>
          </div>

          {/* Right: 1-Click Demo Accounts Selector */}
          <div className="md:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-ayush-400" />
                  <span>Instant Demo Accounts (Click to Test)</span>
                </h2>
                <span className="text-[10px] text-slate-400">Password included</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Click any role card below to instantly test and evaluate the entire workflow from that perspective:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  let badge = 'bg-blue-900/50 text-blue-300 border-blue-700/50';
                  if (acc.role === 'admin') badge = 'bg-purple-900/50 text-purple-300 border-purple-700/50';
                  if (acc.role === 'hod') badge = 'bg-amber-900/50 text-amber-300 border-amber-700/50';
                  if (acc.role === 'guide') badge = 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50';
                  if (acc.role === 'ethics') badge = 'bg-pink-900/50 text-pink-300 border-pink-700/50';
                  if (acc.role === 'student') badge = 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50';

                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleDemoClick(acc)}
                      className="group p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-ayush-500/50 text-left transition-all duration-200 flex flex-col justify-between space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badge}`}>
                          {acc.role}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-ayush-400 font-medium">
                          1-Click Login →
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white truncate">{acc.full_name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/40">
                        <span>{acc.department_name || acc.college_name || 'Ministry'}</span>
                        {acc.final_year_result_status && (
                          <span
                            className={`font-bold ${
                              acc.final_year_result_status === 'RELEASED'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            Result: {acc.final_year_result_status}
                          </span>
                        )}
                        {acc.max_capacity && (
                          <span className="text-amber-400 font-bold">
                            Load: {acc.current_load}/{acc.max_capacity}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-ayush-400" />
              <span>Includes 20 seeded AYUSH dissertations in varied stages.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
