import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Loader2, RefreshCw, AlertCircle, Users,
  PauseCircle, XCircle, Building2, BookOpen,
  Trophy, Star,
} from 'lucide-react';
import { fetchScoreStats } from '../../api/userApi';

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ value, colorClass = 'text-slate-800' }) {
  return (
    <td className={`py-2 px-2 text-center text-xs font-bold ${colorClass}`}>
      {value === null || value === undefined ? (
        <span className="text-slate-400 font-normal text-xs">—</span>
      ) : (
        value
      )}
    </td>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  return (
    <td className="py-2 px-2 text-center">
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Trophy className="w-3 h-3 text-indigo-500" />
        {score ?? 0}
      </span>
    </td>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyProgressScoreTab() {
  const authUser = useSelector((s) => s.auth.user);
  const isAdmin  = authUser?.role === 'Administrator';

  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchScoreStats();
      if (res.success && Array.isArray(res.data)) {
        setRows([...res.data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error('MyProgressScoreTab load error:', err);
      setError('Failed to load score data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading score data…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-6 h-6 text-rose-400" />
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

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Users className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-medium">No data available.</p>
      </div>
    );
  }

  // For coordinator: show only own row
  const myUserId = authUser?._id || authUser?.id;
  const displayRows = isAdmin
    ? rows
    : rows.filter((r) => String(r.userId) === String(myUserId));

  // Totals (admin footer)
  const tot = (key) => rows.reduce((s, r) => s + (r[key] ?? 0), 0);

  return (
    <div className="space-y-4 w-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAdmin ? 'All Users — Score Overview' : 'My Score'}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Score formula legend chips */}
          {[
            { pts: '10 pts', desc: 'per Placed Student',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { pts: '50 pts', desc: 'per Onboarded RTO',      color: 'bg-sky-50     text-sky-700     border-sky-200'     },
            { pts: '30 pts', desc: 'per Onboarded Industry', color: 'bg-indigo-50  text-indigo-700  border-indigo-200'  },
          ].map(({ pts, desc, color }) => (
            <span key={pts} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${color}`}>
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

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-[9px] font-bold text-slate-500 uppercase">

                {/* User Name — admin only */}
                {isAdmin && <th className="py-2 px-2">User Name</th>}

                {/* Pending */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Pending Students
                  </span>
                </th>

                {/* Admin placed students */}
                {isAdmin && (
                  <th className="py-2 px-1 text-center">Placed</th>
                )}

                {/* Snooze */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <PauseCircle className="w-3 h-3 text-amber-500" /> Snooze
                  </span>
                </th>

                {/* Inactive */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3 text-violet-500" /> Inactive
                  </span>
                </th>

                {/* RTOs */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <BookOpen className="w-3 h-3 text-sky-500" /> RTOs
                  </span>
                </th>

                {/* Industries */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-500" /> Industries
                  </span>
                </th>

                {/* Total Score */}
                <th className="py-2 px-1 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500" /> Total Score
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayRows.map((row) => {
                const isMe = myUserId && String(row.userId) === String(myUserId);

                return (
                  <tr
                    key={row.userId}
                    className={`hover:bg-slate-50/70 transition-colors ${isMe ? 'bg-indigo-50/30' : ''}`}
                  >
                    {/* User name — admin only */}
                    {isAdmin && (
                      <td className="py-2 px-2 text-xs font-semibold text-slate-900 truncate" title={row.userName}>
                        {row.userName || row.userEmail || '—'}
                        {isMe && <span className="ml-1 text-[9px] font-bold text-indigo-600">(You)</span>}
                      </td>
                    )}

                    <StatCell value={row.pendingStudents} colorClass="text-amber-600" />
                    {isAdmin && <StatCell value={row.placedStudents} colorClass="text-emerald-600" />}
                    <StatCell value={row.snoozedStudents} colorClass="text-amber-500" />
                    <StatCell value={row.inactiveStudents} colorClass="text-violet-600" />
                    <StatCell value={row.rtos} colorClass="text-sky-600" />
                    <StatCell value={row.industries} colorClass="text-indigo-600" />
                    <ScoreBadge score={row.score} />
                  </tr>
                );
              })}
            </tbody>

            {/* Admin totals footer */}
            {isAdmin && rows.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-xs text-slate-700">
                  <td className="py-2 px-2 font-bold text-slate-900 text-[10px] uppercase">
                    Total
                  </td>
                  <StatCell value={tot('pendingStudents')} colorClass="text-amber-700" />
                  <StatCell value={tot('placedStudents')} colorClass="text-emerald-700" />
                  <StatCell value={tot('snoozedStudents')} colorClass="text-amber-700" />
                  <StatCell value={tot('inactiveStudents')} colorClass="text-violet-700" />
                  <StatCell value={tot('rtos')} colorClass="text-sky-700" />
                  <StatCell value={tot('industries')} colorClass="text-indigo-700" />
                  <td className="py-2 px-2 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Trophy className="w-3 h-3" /> {tot('score')}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Formula footer */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
          <span>Score = (Placed × 10) + (Onboarded RTOs × 50) + (Onboarded Industries × 30)</span>
          <span>· RTOs / Industries count only verified records from the database</span>
        </div>
      </div>
    </div>
  );
}
