import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Loader2, RefreshCw, AlertCircle, Users,
  PauseCircle, XCircle, Building2, BookOpen, Trophy, CheckCircle2, Star
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
    <td className={`py-3 px-3 text-center text-sm font-bold ${colorClass}`}>
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
        // Sort descending by score so highest scorer appears first
        setRows([...res.data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
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

  // Totals for admin footer
  const totalPending  = rows.reduce((s, r) => s + (r.pendingStudents  ?? 0), 0);
  const totalPlaced   = rows.reduce((s, r) => s + (r.placedStudents   ?? 0), 0);
  const totalSnoozed  = rows.reduce((s, r) => s + (r.snoozedStudents  ?? 0), 0);
  const totalInactive = rows.reduce((s, r) => s + (r.inactiveStudents ?? 0), 0);
  const totalRtos     = rows.reduce((s, r) => s + (r.rtos             ?? 0), 0);
  const totalInds     = rows.reduce((s, r) => s + (r.industries       ?? 0), 0);
  const totalScore    = rows.reduce((s, r) => s + (r.score            ?? 0), 0);

  return (
    <div className="space-y-4 w-full">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAdmin ? 'All Coordinators — Score Overview' : 'My Score'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAdmin
              ? 'Live placement counts and scores for every active coordinator.'
              : 'Your live placement progress and score.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score formula legend chips */}
          {[
            { pts: '10 pts', desc: 'per Placed Student',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { pts: '50 pts', desc: 'per Onboarded RTO',       color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { pts: '30 pts', desc: 'per Onboarded Industry',  color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          ].map(({ pts, desc, color }) => (
            <span
              key={pts}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${color}`}
            >
              <Star className="w-2.5 h-2.5" /> {pts} <span className="font-normal opacity-80">{desc}</span>
            </span>
          ))}
          <button
            onClick={load}
            title="Refresh"
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-500 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table — full width, no horizontal scroll on desktop */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isAdmin && <th className="py-3 px-3 whitespace-nowrap">User Name</th>}
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Pending Students
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Placed
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <PauseCircle className="w-3 h-3 text-amber-500" /> Snooze
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3 text-violet-500" /> Inactive
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <BookOpen className="w-3 h-3 text-sky-500" /> RTO
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-500" /> Industries
                  </span>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500" /> Total Score
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal  = isAdmin && idx < 3 ? medals[idx] : null;
                const isMe   = authUser && row.userId === (authUser._id || authUser.id);
                return (
                  <tr
                    key={row.userId}
                    className={`hover:bg-slate-50/70 transition-colors ${isMe ? 'bg-indigo-50/30' : ''}`}
                  >
                    {isAdmin && (
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {medal && <span className="text-sm">{medal}</span>}
                            <span className="font-semibold text-slate-900 text-xs">{row.userName}</span>
                            {isMe && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <RoleBadge role={row.userRole} />
                        </div>
                      </td>
                    )}
                    <StatCell value={row.pendingStudents}  colorClass="text-amber-600" />
                    <StatCell value={row.placedStudents}   colorClass="text-emerald-600" />
                    <StatCell value={row.snoozedStudents}  colorClass="text-amber-500" />
                    <StatCell value={row.inactiveStudents} colorClass="text-violet-600" />
                    <StatCell value={row.rtos}             colorClass="text-sky-600" />
                    <StatCell value={row.industries}       colorClass="text-indigo-600" />
                    {/* Total Score */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Trophy className="w-3 h-3 text-indigo-500" />
                        {row.score ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer — admin only, only when there are multiple rows */}
            {isAdmin && rows.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-xs text-slate-700">
                  <td className="py-3 px-3 font-bold text-slate-900 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    Total
                  </td>
                  <StatCell value={totalPending}  colorClass="text-amber-700" />
                  <StatCell value={totalPlaced}   colorClass="text-emerald-700" />
                  <StatCell value={totalSnoozed}  colorClass="text-amber-700" />
                  <StatCell value={totalInactive} colorClass="text-violet-700" />
                  <StatCell value={totalRtos}     colorClass="text-sky-700" />
                  <StatCell value={totalInds}     colorClass="text-indigo-700" />
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Trophy className="w-3 h-3" /> {totalScore}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Formula footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
          <span>Score = (Placed × 10) + (Onboarded RTOs × 50) + (Onboarded Industries × 30)</span>
          <span>· RTOs/Industries count only verified (non-random) records from the database</span>
        </div>
      </div>
    </div>
  );
}
