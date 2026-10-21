import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import RTOLayout from '../components/layout/RTOLayout';
import RtoDashboard from '../components/RTO/RtoDashboard';
import AddRtoWizard from '../components/RTO/AddRtoWizard';
import { fetchRtos, createRto, fetchRtoStats, deleteRto, fetchMyRtos, updateRto } from '../api/rtoApi';
import { fetchUsers, fetchOnboardingEligibleUsers } from '../api/userApi';
import { Building2, User, MapPin, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ── My RTOs tab — shows only RTOs onboarded by the logged-in user ──────────
function MyRTOsTab() {
  const [rtos, setRtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [linkError, setLinkError] = useState(null);

  useEffect(() => {
    fetchOnboardingEligibleUsers()
      .then((res) => setStaffUsers(res?.data || []))
      .catch(() => setStaffUsers([]));
  }, []);

  const linkPortalUser = async (rto, userId) => {
    const user = staffUsers.find((item) => item._id === userId);
    setLinkError(null);
    try {
      const resolvedName = rto.onboardedByName || user?.name || '';
      await updateRto(rto._id, { onboardedBy: user?._id || null, onboardedByName: resolvedName });
      setRtos((current) => current.map((item) => item._id === rto._id
        ? { ...item, onboardedBy: user?._id || null, onboardedByName: resolvedName }
        : item));
    } catch (err) {
      console.error('Failed to link RTO to portal user:', err);
      setLinkError('Could not update the RTO portal user. Please try again.');
    }
  };

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
      {linkError && <p role="alert" className="px-4 py-3 bg-rose-50 text-sm text-rose-700">{linkError}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">RTO Name</th>
              <th className="py-3 px-4">Onboarded By / Portal User ID</th>
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
                <td className="py-3 px-4">
                  <div className="text-slate-700 font-medium">{rto.onboardedByName || '—'}</div>
                  <select aria-label={`Link ${rto.name} to a Portal User ID`} value={rto.onboardedBy || ''}
                    onChange={(e) => linkPortalUser(rto, e.target.value)}
                    className="mt-1 max-w-[260px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600">
                    <option value="">No portal account / link later</option>
                    {staffUsers.map((user) => <option key={user._id} value={user._id}>{user.name} — {user._id}</option>)}
                  </select>
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
  const isCoordinator = authUser?.role === 'Coordinator';

  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingRto, setEditingRto] = useState(null);
  // Tab: 'all' | 'my'
  const [activeTab, setActiveTab] = useState('all');
  const [rtos, setRtos] = useState([]);
  const [rtoLoadError, setRtoLoadError] = useState(null);
  const [stats, setStats] = useState({
    totalRtos: 0,
    activeRtos: 0,
    inactiveRtos: 0,
    totalStudents: 0,
    newThisMonth: 0
  });

  const loadData = useCallback(async (filters = {}) => {
    const [rtoListResult, rtoStatsResult] = await Promise.allSettled([
        fetchRtos(filters),
        fetchRtoStats()
    ]);

    if (rtoListResult.status === 'fulfilled' && rtoListResult.value?.success && Array.isArray(rtoListResult.value.data)) {
      setRtos(rtoListResult.value.data);
      setRtoLoadError(null);
    } else {
      console.error('Failed to load RTO list:', rtoListResult.status === 'rejected' ? rtoListResult.reason : rtoListResult.value);
      setRtoLoadError('Could not load RTOs. Check your connection and try again.');
    }

    if (rtoStatsResult.status === 'fulfilled' && rtoStatsResult.value?.success && rtoStatsResult.value.data) {
      setStats(rtoStatsResult.value.data);
    } else if (rtoStatsResult.status === 'rejected') {
      console.error('Failed to load RTO stats:', rtoStatsResult.reason);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRto = useCallback(async (formData) => {
    try {
      const res = await createRto(formData);
      if (res?.data) setRtos((current) => [res.data, ...current]);
      loadData(); // background refresh
    } catch (err) {
      console.error('Failed to create RTO:', err);
      throw err;
    }
  }, [loadData]);

  const deletingIds = React.useRef(new Set());
  const handleDeleteRto = useCallback(async (id) => {
    if (!id || deletingIds.current.has(id)) return;
    deletingIds.current.add(id);
    const previous = rtos;
    // Optimistically remove so the row disappears instantly
    setRtos((current) => current.filter((r) => (r._id || r.id) !== id));
    setStats((s) => ({ ...s, totalRtos: Math.max(0, (s.totalRtos || 0) - 1) }));
    try {
      await deleteRto(id);
      loadData(); // background refresh, don't block UI
    } catch (err) {
      console.error('Failed to delete RTO:', err);
      setRtos(previous);
      window.alert(err?.response?.data?.message || 'Failed to delete RTO. Please try again.');
    } finally {
      deletingIds.current.delete(id);
    }
  }, [loadData, rtos]);

  const handleUpdateRto = useCallback(async (id, formData) => {
    try {
      await updateRto(id, formData);
      await loadData();
      setEditingRto(null);
    } catch (err) {
      console.error('Failed to update RTO:', err);
      throw err;
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
      title={currentView === 'dashboard' ? (isCoordinator ? 'My Added RTOs' : 'RTOs') : editingRto ? 'Edit RTO' : 'Add New RTO'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', isCoordinator ? 'My Added RTOs' : 'RTOs']
          : ['Dashboard', 'Partners', 'RTOs', editingRto ? 'Edit RTO' : 'Add New RTO']
      }
    >
      {currentView === 'dashboard' ? (
        <>
          {/* Tab bar */}
          <div className="px-6 pt-1 bg-white border-b border-slate-200">
            <div className="flex items-center gap-1 max-w-[1600px] mx-auto">
              <button onClick={() => setActiveTab('all')} className={tabClass('all')}>
                <Building2 className="w-4 h-4" />
                {isCoordinator ? 'My Added RTOs' : 'All RTOs'}
              </button>
              <button onClick={() => setActiveTab('my')} className={tabClass('my')}>
                <User className="w-4 h-4" />
                {isAdmin ? 'My RTOs (All)' : 'My RTOs'}
              </button>
            </div>
          </div>

          {activeTab === 'all' && (
            <>
              {rtoLoadError && (
                <div role="alert" className="mx-auto mt-4 max-w-[1600px] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-4">
                  <span>{rtoLoadError}</span>
                  <button onClick={() => loadData()} className="font-semibold underline">Retry</button>
                </div>
              )}
              <RtoDashboard
                onAddNewRto={() => { setEditingRto(null); setCurrentView('add-wizard'); }}
                onEditRto={(rto) => { setEditingRto(rto); setCurrentView('edit-wizard'); }}
                rtos={rtos}
                stats={stats}
                onFilterChange={loadData}
                onDeleteRto={handleDeleteRto}
              />
            </>
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
            initialRto={editingRto}
            onCancel={() => { setEditingRto(null); setCurrentView('dashboard'); }}
            onComplete={() => setCurrentView('dashboard')}
            onCreateRto={handleCreateRto}
            onUpdateRto={handleUpdateRto}
          />
        </div>
      )}
    </RTOLayout>
  );
}
