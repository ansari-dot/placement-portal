import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, Building2, Layers, Trophy } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import MyStudentsTable from '../components/student/MyStudentsTable';
import MyProgressRtoTab from '../components/progress/MyProgressRtoTab';
import MyProgressIndustryTab from '../components/progress/MyProgressIndustryTab';
import MyProgressScoreTab from '../components/progress/MyProgressScoreTab';

const TABS = [
  { key: 'students', label: 'Students',  icon: Users    },
  { key: 'rto',      label: 'RTO',       icon: Building2 },
  { key: 'industry', label: 'Industry',  icon: Layers   },
  { key: 'score',    label: 'Score',     icon: Trophy   },
];

export default function MyProgressPage() {
  const [activeTab, setActiveTab] = useState('students');
  const authUser = useSelector((s) => s.auth?.user);
  const isAdmin  = authUser?.role === 'Administrator';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        <Header
          title="My Progress"
          breadcrumbs={['Dashboard', 'My List', 'My Progress']}
        />

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 shrink-0">
          <div className="max-w-[1600px] mx-auto px-6">
            <nav className="flex items-center gap-1" aria-label="Progress tabs">
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`
                      relative flex items-center gap-2 px-4 py-3 text-sm font-semibold
                      border-b-2 transition-colors duration-150 whitespace-nowrap
                      ${active
                        ? 'border-[#08a8b8] text-[#08a8b8]'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* ── STUDENTS tab ── */}
          {activeTab === 'students' && (
            <div className="p-4 max-w-[1600px] w-full mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-3 border-b border-slate-100 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">My Students</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAdmin
                        ? 'View and manage students assigned to each coordinator.'
                        : 'Your assigned students — track placement progress and manage actions.'}
                    </p>
                  </div>
                </div>
                <MyStudentsTable />
              </div>
            </div>
          )}

          {/* ── RTO tab ── */}
          {activeTab === 'rto' && (
            <div className="p-4 max-w-[1600px] w-full mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <MyProgressRtoTab />
              </div>
            </div>
          )}

          {/* ── INDUSTRY tab ── */}
          {activeTab === 'industry' && (
            <div className="p-4 max-w-[1600px] w-full mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <MyProgressIndustryTab />
              </div>
            </div>
          )}

          {/* ── SCORE tab ── */}
          {activeTab === 'score' && (
            <div className="p-4 max-w-[1600px] w-full mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <MyProgressScoreTab />
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
