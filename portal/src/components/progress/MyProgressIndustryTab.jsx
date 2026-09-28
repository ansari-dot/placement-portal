import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Building2, MapPin, Phone, Mail, User, Users,
  CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw,
  Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fetchMyIndustries } from '../../api/industryApi';

// ── Student pill ──────────────────────────────────────────────────────────────
function StudentPill({ student, variant }) {
  const styles = {
    current:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    previous: 'bg-sky-50    text-sky-700    border-sky-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[variant]}`}
      title={`${student.studentName}${student.studentId ? ` (${student.studentId})` : ''}`}
    >
      <User className="w-2.5 h-2.5 flex-shrink-0" />
      {student.studentName}
    </span>
  );
}

// ── Expandable student list ───────────────────────────────────────────────────
function StudentList({ label, students, variant, icon: Icon, emptyMsg }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? students : students.slice(0, 3);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className={`w-3 h-3 ${variant === 'current' ? 'text-emerald-500' : 'text-sky-500'}`} />
        <span>{label}</span>
        <span className={`ml-1 px-1.5 py-0.5 rounded-full font-bold text-[9px] border ${
          variant === 'current'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-sky-50 text-sky-600 border-sky-200'
        }`}>{students.length}</span>
      </div>
      {students.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic pl-1">{emptyMsg}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visible.map((s, i) => (
              <StudentPill key={s.studentId || s.studentName || i} student={s} variant={variant} />
            ))}
          </div>
          {students.length > 3 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:underline mt-0.5"
            >
              {expanded
                ? <><ChevronUp className="w-3 h-3" />Show less</>
                : <><ChevronDown className="w-3 h-3" />+{students.length - 3} more</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Single industry row (table) ───────────────────────────────────────────────
function IndustryRow({ industry, index }) {
  const current  = industry.currentlyPlacedStudents  || [];
  const previous = industry.previouslyPlacedStudents || [];

  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0 align-top">
      {/* # */}
      <td className="py-3.5 px-4 text-[11px] text-slate-400 font-medium w-8">{index + 1}</td>

      {/* Industry Name */}
      <td className="py-3.5 px-4 min-w-[160px]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {(industry.name || 'IN').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">{industry.name || '—'}</p>
            <span className="inline-block mt-0.5 bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-100">
              {industry.sector || 'General'}
            </span>
          </div>
        </div>
      </td>

      {/* Industry Type */}
      <td className="py-3.5 px-4 min-w-[140px]">
        <span className="inline-block bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-100">
          {industry.sector || 'General'}
        </span>
      </td>

      {/* Location */}
      <td className="py-3.5 px-4 min-w-[130px]">
        <div className="flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{industry.location || industry.suburb || '—'}</span>
        </div>
      </td>

      {/* Contact Number */}
      <td className="py-3.5 px-4 min-w-[120px]">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{industry.contactPhone || '—'}</span>
        </div>
      </td>

      {/* Contact Person */}
      <td className="py-3.5 px-4 min-w-[130px]">
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <p className="font-semibold leading-tight">{industry.contactPersonName || '—'}</p>
            {industry.contactJobTitle && (
              <p className="text-[10px] text-slate-400">{industry.contactJobTitle}</p>
            )}
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="py-3.5 px-4 min-w-[160px]">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[140px]">{industry.contactEmail || '—'}</span>
        </div>
      </td>

      {/* Currently Placed */}
      <td className="py-3.5 px-4 min-w-[140px]">
        <StudentList
          label="Current"
          students={current}
          variant="current"
          icon={CheckCircle2}
          emptyMsg="None"
        />
      </td>

      {/* Previously Placed */}
      <td className="py-3.5 px-4 min-w-[140px]">
        <StudentList
          label="Previous"
          students={previous}
          variant="previous"
          icon={Clock}
          emptyMsg="None"
        />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyProgressIndustryTab() {
  const authUser = useSelector((s) => s.auth.user);
  const isAdmin  = authUser?.role === 'Administrator';

  const [industries, setIndustries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyIndustries();
      setIndustries(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('MyProgressIndustryTab load error:', err);
      setError('Failed to load industries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = industries.filter((ind) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (ind.name              || '').toLowerCase().includes(q) ||
      (ind.sector            || '').toLowerCase().includes(q) ||
      (ind.location          || '').toLowerCase().includes(q) ||
      (ind.contactPersonName || '').toLowerCase().includes(q)
    );
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading industries…</p>
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

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isAdmin ? 'All Industries' : 'My Industries'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAdmin
              ? 'All industries across the system.'
              : 'Industries added by you or credited to your account.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-200">
            <Building2 className="w-3 h-3 inline mr-1" />
            {filtered.length} industr{filtered.length !== 1 ? 'ies' : 'y'}
          </span>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search industries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 w-48"
            />
          </div>

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
              {search ? 'No industries match your search.' : 'No industries found.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
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
                  <th className="py-3 px-4 w-8">#</th>
                  <th className="py-3 px-4 min-w-[160px]">Industry Name</th>
                  <th className="py-3 px-4 min-w-[140px]">Industry Type</th>
                  <th className="py-3 px-4 min-w-[130px]">Location</th>
                  <th className="py-3 px-4 min-w-[120px]">Contact Number</th>
                  <th className="py-3 px-4 min-w-[130px]">Contact Person</th>
                  <th className="py-3 px-4 min-w-[160px]">Email</th>
                  <th className="py-3 px-4 min-w-[140px]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Currently Placed
                    </span>
                  </th>
                  <th className="py-3 px-4 min-w-[140px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" />
                      Previously Placed
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ind, idx) => (
                  <IndustryRow key={ind._id || ind.id || idx} industry={ind} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
