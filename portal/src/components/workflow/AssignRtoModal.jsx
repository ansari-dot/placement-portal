import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Building2, Loader2, CheckCircle2, AlertCircle, MapPin, DollarSign } from 'lucide-react';
import { fetchRtos } from '../../api/rtoApi';
import { bulkAssignRto } from '../../api/studentsApi';
import { toast } from 'react-toastify';

export default function AssignRtoModal({ students = [], onClose, onAssigned }) {
  const [rtos, setRtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRto, setSelectedRto] = useState(null);
  const [error, setError] = useState('');

  const targetStudents = Array.isArray(students) ? students : [students];
  const isMultiple = targetStudents.length > 1;

  const loadRtos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchRtos();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRtos(list);
    } catch (err) {
      console.error('Failed to load RTOs:', err);
      setError('Could not load RTOs. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRtos();
  }, [loadRtos]);

  // Pre-select current RTO if single student has one
  useEffect(() => {
    if (!isMultiple && targetStudents[0]?.rto && rtos.length > 0) {
      const currentName = targetStudents[0].rto.trim().toLowerCase();
      const match = rtos.find(r => r.name?.trim().toLowerCase() === currentName);
      if (match) setSelectedRto(match);
    }
  }, [targetStudents, rtos, isMultiple]);

  const filteredRtos = rtos.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name?.toLowerCase().includes(q) ||
      r.code?.toLowerCase().includes(q) ||
      r.loc?.toLowerCase().includes(q)
    );
  });

  const handleConfirm = async () => {
    if (!selectedRto) {
      setError('Please select an RTO to assign');
      return;
    }

    setSaving(true);
    setError('');

    const studentIds = targetStudents
      .map(s => s.id || s._id || s.studentId)
      .filter(Boolean);

    try {
      const res = await bulkAssignRto(studentIds, selectedRto._id, selectedRto.name);
      toast.success(res?.message || `Assigned ${selectedRto.name} to ${studentIds.length} student(s)`);
      if (onAssigned) {
        onAssigned({
          rtoName: selectedRto.name,
          rtoId: selectedRto._id,
          count: studentIds.length,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to assign RTO:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to assign RTO. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isMultiple ? `Assign RTO (${targetStudents.length} Students)` : 'Assign College / RTO'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isMultiple 
                  ? 'Assign all selected students to an RTO partner'
                  : `Assigning RTO for ${targetStudents[0]?.name || 'Student'}`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={saving}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target summary banner */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">
              {isMultiple ? `${targetStudents.length} Students selected` : targetStudents[0]?.name}
            </span>
            {targetStudents[0]?.studentId && !isMultiple && (
              <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded">
                {targetStudents[0].studentId}
              </span>
            )}
          </div>
          {!isMultiple && (
            <span className="text-[11px] text-slate-500">
              Current RTO: <strong className="text-slate-700">{targetStudents[0]?.rto || 'Unassigned'}</strong>
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search RTO by name, code, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading || saving}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* RTO List */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs">Loading available RTO partners...</p>
              </div>
            ) : filteredRtos.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-600">No RTO partners found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term or add a new RTO first.</p>
              </div>
            ) : (
              filteredRtos.map(rto => {
                const isSelected = selectedRto?._id === rto._id;
                const pricingCount = Array.isArray(rto.coursePricing) ? rto.coursePricing.length : 0;

                return (
                  <div
                    key={rto._id}
                    onClick={() => setSelectedRto(rto)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {(rto.name || 'RT').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-800 truncate flex items-center gap-1.5">
                          <span>{rto.name}</span>
                          {rto.code && (
                            <span className="text-[10px] text-slate-400 font-mono">({rto.code})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          {rto.loc && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {rto.loc}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <DollarSign size={11} />
                            {pricingCount > 0 ? `${pricingCount} course price${pricingCount === 1 ? '' : 's'}` : `$${rto.payoutRate || 0} base`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !selectedRto}
            className="px-5 py-2 bg-[#0147A6] hover:bg-[#0B6DC8] text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Assigning...</span>
              </>
            ) : (
              <span>Assign {selectedRto ? `to ${selectedRto.name}` : 'RTO'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
