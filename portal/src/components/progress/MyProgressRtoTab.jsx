import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Building2, MapPin, CalendarDays, Loader2, AlertCircle,
  RefreshCw, Search, Users, CheckCircle2, Clock,
} from 'lucide-react';
import { fetchMyRtos } from '../../api/rtoApi';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-slate-100 text-slate-500 border-slate-200'
    }`}>
      {active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
      {status || 'Active'}
    </span>
  );
}

// ── Single RTO row ────────────────────────────────────────────────────────────
function RtoRow({ rto, index }) {
  const location = rto.loc || (rto.suburb && rto.state ? `${rto.suburb}, ${rto.state}` : rto.suburb || rto.state || '—');
  const partnerSince = rto.partnershipSince || rto.date || '—';

  return (
    <tr className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0">
      {/* # */}
      <td className="py-3 px-4 text-[11px] text-slate-400 font-medium w-10">{index + 1}</td>

      {/* RTO Name + Code */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {(rto.name || 'RTO').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">{rto.name || '—'}</p>
            {rto.code && (
              <p className="text-[10px] text-slate-400 mt-0.5">{rto.code}</p>
            )}
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{location}</span>
        </div>
      </td>

      {/* Partnership Since */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{partnerSince}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={rto.status} />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyProgressRtoTab() {
  const authUser  = useSelector((s) => s.auth.user);
  const isAdmin   = authUser?.role === 'Administrator';

  const [rtos,       setRtos]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyRtos();
      setRtos(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('MyProgressRtoTab load error:', err);
      setError('Failed to load RTOs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side search
  const filtered = rtos.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.code || '').toLowerCase().includes(q) ||
      (r.loc  || '').toLowerCase().includes(q)
    );
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading RTOs…</p>
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
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAdmin ? 'All RTOs' : 'My Onboarded RTOs'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAdmin
              ? 'All registered RTOs across the system.'
              : 'RTOs that you have onboarded into the system.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Count pill */}
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200">
            <Users className="w-3 h-3 inline mr-1" />
            {filtered.length} RTO{filtered.length !== 1 ? 's' : ''}
          </span>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search RTOs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 w-48"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            title="Refresh"
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Building2 className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium">
              {search ? 'No RTOs match your search.' : 'No RTOs found.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">#</th>
                  <th className="py-3 px-4">RTO Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Partnership Since</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rto, idx) => (
                  <RtoRow key={rto._id || rto.id || idx} rto={rto} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
