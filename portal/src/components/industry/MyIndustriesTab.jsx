import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Phone, Mail, User, Users,
  ChevronDown, ChevronUp, Loader2, RefreshCw, X,
  CheckCircle2, Clock, AlertCircle, Plus
} from 'lucide-react';
import { fetchMyIndustries } from '../../api/industryApi';

// ─── Student pill ────────────────────────────────────────────────────────────
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

// ─── Expandable student section ───────────────────────────────────────────────
function StudentSection({ label, students, variant, icon: Icon, emptyMsg }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? students : students.slice(0, 3);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className={`w-3 h-3 ${variant === 'current' ? 'text-emerald-500' : 'text-sky-500'}`} />
        <span>{label}</span>
        <span className={`ml-1 px-1.5 py-0.5 rounded-full font-bold text-[9px] border ${
          variant === 'current'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-sky-50 text-sky-600 border-sky-200'
        }`}>
          {students.length}
        </span>
      </div>

      {students.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic pl-1">{emptyMsg}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visible.map((s, idx) => (
              <StudentPill key={s.studentId || s.studentName || idx} student={s} variant={variant} />
            ))}
          </div>
          {students.length > 3 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:underline mt-0.5"
            >
              {expanded
                ? <><ChevronUp className="w-3 h-3" /> Show less</>
                : <><ChevronDown className="w-3 h-3" /> +{students.length - 3} more</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Single industry card ─────────────────────────────────────────────────────
function IndustryCard({ industry }) {
  const initials = (industry.name || 'IN').substring(0, 2).toUpperCase();

  const currentStudents  = industry.currentlyPlacedStudents  || [];
  const previousStudents = industry.previouslyPlacedStudents || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-start gap-4 p-5 border-b border-slate-100">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{industry.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              industry.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {industry.status || 'Active'}
            </span>
          </div>
          <span className="inline-block mt-1 bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-100">
            {industry.sector || 'General'}
          </span>
        </div>

        {/* Quick count badges */}
        <div className="flex flex-col gap-1 items-end flex-shrink-0 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            {currentStudents.length} current
          </span>
          <span className="flex items-center gap-1 text-sky-600">
            <Clock className="w-3 h-3" />
            {previousStudents.length} previous
          </span>
        </div>
      </div>

      {/* Card body — contact + location */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-600 border-b border-slate-100">
        {industry.location && (
          <div className="flex items-start gap-1.5 col-span-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{industry.location}</span>
          </div>
        )}
        {industry.contactPhone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{industry.contactPhone}</span>
          </div>
        )}
        {industry.contactEmail && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{industry.contactEmail}</span>
          </div>
        )}
        {industry.contactPersonName && (
          <div className="flex items-center gap-1.5 col-span-2">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium text-slate-700">{industry.contactPersonName}</span>
            {industry.contactJobTitle && (
              <span className="text-slate-400">— {industry.contactJobTitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Card footer — student lists */}
      <div className="px-5 py-4 space-y-4">
        <StudentSection
          label="Currently Placed"
          students={currentStudents}
          variant="current"
          icon={CheckCircle2}
          emptyMsg="No students currently placed here."
        />
        <StudentSection
          label="Previously Placed"
          students={previousStudents}
          variant="previous"
          icon={Clock}
          emptyMsg="No previously placed students."
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MyIndustriesTab({ onAddNewIndustry }) {
  const [industries, setIndustries]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyIndustries();
      if (res.success && Array.isArray(res.data)) {
        setIndustries(res.data);
      } else {
        setIndustries([]);
      }
    } catch (err) {
      console.error('MyIndustriesTab load error:', err);
      setError('Failed to load your industries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side search filter
  const filtered = industries.filter(ind => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (ind.name || '').toLowerCase().includes(q) ||
      (ind.sector || '').toLowerCase().includes(q) ||
      (ind.location || '').toLowerCase().includes(q) ||
      (ind.contactPersonName || '').toLowerCase().includes(q)
    );
  });

  // Summary counts
  const totalCurrent  = industries.reduce((s, i) => s + (i.currentlyPlacedStudents?.length  || 0), 0);
  const totalPrevious = industries.reduce((s, i) => s + (i.previouslyPlacedStudents?.length || 0), 0);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading your industries…</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <AlertCircle className="w-8 h-8 text-rose-400" />
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

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!industries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Building2 className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">No industries linked to your students yet.</p>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Industries appear here once students assigned to you are added to a workflow
          that contacts or places them at an industry, or when you create an industry directly.
        </p>
        {onAddNewIndustry && (
          <button
            onClick={onAddNewIndustry}
            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Industry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm text-xs">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-slate-700">{industries.length}</span>
          <span className="text-slate-500">industries</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-emerald-700">{totalCurrent}</span>
          <span className="text-slate-500">currently placed</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-sky-200 rounded-xl px-4 py-2.5 shadow-sm text-xs">
          <Clock className="w-4 h-4 text-sky-500" />
          <span className="font-semibold text-sky-700">{totalPrevious}</span>
          <span className="text-slate-500">previously placed</span>
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <input
            type="text"
            placeholder="Search by name, sector, location…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-64 bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={load}
          title="Refresh"
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-500 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {onAddNewIndustry && (
          <button
            onClick={onAddNewIndustry}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Industry
          </button>
        )}
      </div>

      {/* No results after filtering */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Building2 className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-medium">No industries match your search.</p>
        </div>
      )}

      {/* Industry cards grid — original layout preserved */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(ind => (
          <IndustryCard key={ind._id || ind.id || ind.name} industry={ind} />
        ))}
      </div>

    </div>
  );
}
