import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Loader2, RefreshCw, AlertCircle, Users,
  PauseCircle, XCircle, Building2, BookOpen, Trophy
} from 'lucide-react';
import { fetchScoreStats } from '../../api/userApi';

// ── Role badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    Administrator:  'bg-purple-50 text-purple-700 border-purple-200',
    Coordinator:    'bg-blue-50   text-blue-700   border-blue-200',
    'RTO Manager':  'bg-amber-50  text-amber-700  border-amber-200',
    Staff:          'bg-slate-100 text-slate-600  border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[role] || styles.Staff}`}>
      {role}
    </span>
  );
}

// ── Stat cell ──────────────────────────────────────────────────────────────
function StatCell({ value, colorClass = 'text-slate-800' }) {
  return (
    <td className={`py-3 px-4 text-center text-sm font-bold ${colorClass}`}>
      {value === null || value === undefined ? (
        <span className="text-slate-400 font-normal text-xs">—</span>
      ) : (
        value
      )}
    </td>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ScoreTab() {
  const authUser = useSelector(state => state.auth.user);
  const isAdmin  = authUser?.role === 'Administrator';

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchScoreStats();
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error('ScoreTab load error:', err);
      setError('Failed to load score data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading score data…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-7 h-7 text-rose-400" />
        <p className="text-sm font-medium text-slate-600">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Users className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-medium">No data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAdmin ? 'All Coordinators — Progress Overview' : 'My Progress'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAdmin
              ? 'Live counts per coordinator. Score column is pending a formula definition.'
              : 'Your live placement progress. Score column is pending a formula definition.'}
          </p>
        </div>
        <button
          onClick={load}
          title="Refresh"
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-500 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isAdmin && <th className="py-3 px-4">Coordinator</th>}
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Pending Students
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <PauseCircle className="w-3 h-3" /> Snooze
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Inactive
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <BookOpen className="w-3 h-3" /> RTOs
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3" /> Industries
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3" /> Score
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map(row => (
                <tr
                  key={row.userId}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    authUser && row.userId === (authUser._id || authUser.id)
                      ? 'bg-indigo-50/40'
                      : ''
                  }`}
                >
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-900 text-xs">{row.userName}</span>
                        <div className="flex items-center gap-1.5">
                          <RoleBadge role={row.userRole} />
                          {authUser && row.userId === (authUser._id || authUser.id) && (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <StatCell value={row.pendingStudents}  colorClass="text-amber-600" />
                  <StatCell value={row.snoozedStudents}  colorClass="text-amber-500" />
                  <StatCell value={row.inactiveStudents} colorClass="text-violet-600" />
                  <StatCell value={row.rtos}             colorClass="text-sky-600"   />
                  <StatCell value={row.industries}       colorClass="text-indigo-600" />
                  {/* Score: no existing formula — show placeholder */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"
                      title="No score formula is currently defined in the codebase."
                    >
                      —
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400">
          Score column is reserved. No existing score formula was found in the codebase — define one to enable this column.
        </div>
      </div>
    </div>
  );
}
