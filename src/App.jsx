import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import TopicSubmission from './pages/TopicSubmission';
import TopicApprovals from './pages/TopicApprovals';
import EthicsClearance from './pages/EthicsClearance';
import ProgressMonitoring from './pages/ProgressMonitoring';
import Evaluation from './pages/Evaluation';
import UniversityResults from './pages/UniversityResults';
import Publications from './pages/Publications';
import Repository from './pages/Repository';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDissertationId, setSelectedDissertationId] = useState(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-ayush-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing Ministry of AYUSH PG Portal...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSelectDissertation = (id) => {
    setSelectedDissertationId(id);
    setActiveTab('repository');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-ayush-500 selection:text-white transition-colors overflow-hidden">
      <Navbar onSelectDissertation={handleSelectDissertation} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onSelectDissertation={handleSelectDissertation}
            />
          )}

          {activeTab === 'topic-submission' && (
            <TopicSubmission
              setActiveTab={setActiveTab}
              onDissertationCreated={(id) => {
                setActiveTab('progress-monitoring');
              }}
            />
          )}

          {activeTab === 'topic-approvals' && (
            <TopicApprovals onSelectDissertation={handleSelectDissertation} />
          )}

          {activeTab === 'ethics-clearance' && <EthicsClearance />}

          {activeTab === 'progress-monitoring' && <ProgressMonitoring />}

          {activeTab === 'evaluation' && (
            <Evaluation
              setActiveTab={setActiveTab}
              onSelectDissertation={handleSelectDissertation}
            />
          )}

          {activeTab === 'university-results' && (
            <UniversityResults onSelectDissertation={handleSelectDissertation} />
          )}

          {activeTab === 'publications' && <Publications />}

          {activeTab === 'repository' && (
            <Repository selectedId={selectedDissertationId} />
          )}

          {activeTab === 'audit-logs' && <AuditLogs />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
