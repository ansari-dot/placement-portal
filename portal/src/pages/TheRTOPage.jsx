import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import RTOLayout from '../components/layout/RTOLayout';
import RtoDashboard from '../components/RTO/RtoDashboard';
import AddRtoWizard from '../components/RTO/AddRtoWizard';
import { fetchRtos, createRto, fetchRtoStats, deleteRto, fetchMyRtos } from '../api/rtoApi';
import { Building2, User, MapPin, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ── My RTOs tab — shows only RTOs onboarded by the logged-in user ──────────
function MyRTOsTab() {
  const [rtos, setRtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyRtos();
      if (res.success && Array.isArray(res.data)) setRtos(res.data);
      else setRtos([]);
    } catch (err) {
      setError('Failed to load your RTOs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
      <span className="text-sm font-medium">Loading your RTOs…</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <AlertCircle className="w-7 h-7 text-rose-400" />
      <p className="text-sm font-medium text-slate-600">{error}</p>
      <button onClick={load} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  );

  if (!rtos.length) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <Building2 className="w-10 h-10 text-slate-300" />
      <p className="text-sm font-semibold text-slate-500">No RTOs onboarded by you yet.</p>
      <p className="text-xs text-slate-400 text-center max-w-xs">
        RTOs you add via the Add New RTO form will appear here.
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">RTO Name</th>
              <th className="py-3 px-4">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
              </th>
              <th className="py-3 px-4">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Partnership Since</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rtos.map(rto => (
              <tr key={rto._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {(rto.name || 'RT').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{rto.name}</div>
                      <div className="text-[10px] text-slate-400">{rto.code || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {rto.loc || [rto.suburb, rto.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {rto.partnershipSince || rto.date || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400">
        {rtos.length} {rtos.length === 1 ? 'RTO' : 'RTOs'} onboarded by you
      </div>
    </div>
  );
}

export default function TheRTOPage() {
  const authUser = useSelector(state => state.auth?.user);
  const isAdmin = authUser?.role === 'Administrator';

  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');
  // Tab: 'all' | 'my'
  const [activeTab, setActiveTab] = useState('all');
  const [rtos, setRtos] = useState([]);
  const [stats, setStats] = useState({
    totalRtos: 0,
    activeRtos: 0,
    inactiveRtos: 0,
    totalStudents: 0,
    newThisMonth: 0
  });

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [rtoList, rtoStats] = await Promise.all([
        fetchRtos(filters),
        fetchRtoStats()
      ]);
      if (rtoList.success && rtoList.data) setRtos(rtoList.data);
      if (rtoStats.success && rtoStats.data) setStats(rtoStats.data);
    } catch (err) {
      console.error('Failed to load RTO data:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRto = useCallback(async (formData) => {
    try {
      await createRto(formData);
      await loadData();
    } catch (err) {
      console.error('Failed to create RTO:', err);
      throw err;
    }
  }, [loadData]);

  const handleDeleteRto = useCallback(async (id) => {
    try {
      await deleteRto(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete RTO:', err);
    }
  }, [loadData]);

  const tabClass = (tab) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`;

  return (
    <RTOLayout
      title={currentView === 'dashboard' ? 'RTOs' : 'Add New RTO'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', 'RTOs']
          : ['Dashboard', 'Partners', 'RTOs', 'Add New RTO']
      }
    >
      {currentView === 'dashboard' ? (
        <>
          {/* Tab bar */}
          <div className="px-6 pt-1 bg-white border-b border-slate-200">
            <div className="flex items-center gap-1 max-w-[1600px] mx-auto">
              <button onClick={() => setActiveTab('all')} className={tabClass('all')}>
                <Building2 className="w-4 h-4" />
                All RTOs
              </button>
              <button onClick={() => setActiveTab('my')} className={tabClass('my')}>
                <User className="w-4 h-4" />
                {isAdmin ? 'My RTOs (All)' : 'My RTOs'}
              </button>
            </div>
          </div>

          {activeTab === 'all' && (
            <RtoDashboard
              onAddNewRto={() => setCurrentView('add-wizard')}
              rtos={rtos}
              stats={stats}
              onFilterChange={loadData}
              onDeleteRto={handleDeleteRto}
            />
          )}
          {activeTab === 'my' && (
            <div className="p-6 max-w-[1600px] mx-auto w-full">
              <MyRTOsTab />
            </div>
          )}
        </>
      ) : (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-8 pt-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-semibold text-blue-600 hover:underline mb-2 flex items-center space-x-1"
            >
              ← Back to RTO List
            </button>
          </div>
          <AddRtoWizard
            onCancel={() => setCurrentView('dashboard')}
            onComplete={() => setCurrentView('dashboard')}
            onCreateRto={handleCreateRto}
          />
        </div>
      )}
    </RTOLayout>
  );
}