import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, RotateCcw, AlertCircle, CheckCircle2, DollarSign, Calendar, Building2, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchStudents } from '../../api/studentsApi';
import { manualAddPayment, fetchRemovedPayments, restorePayment } from '../../api/paymentApi';

export default function AddPaymentStudentModal({ isOpen, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'removed'
  const [students, setStudents] = useState([]);
  const [removedList, setRemovedList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingRemoved, setLoadingRemoved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [customFee, setCustomFee] = useState('');
  const [chargePercentage, setChargePercentage] = useState('100');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStudent(null);
      setCustomFee('');
      setNotes('');
      setSearchQuery('');
      return;
    }
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoadingStudents(true);
    setLoadingRemoved(true);
    try {
      const [stuRes, remRes] = await Promise.all([
        fetchStudents().catch(() => ({ data: [] })),
        fetchRemovedPayments().catch(() => ({ data: [] })),
      ]);
      const list = stuRes?.data ?? stuRes ?? [];
      setStudents(Array.isArray(list) ? list : []);
      const rem = remRes?.data ?? remRes ?? [];
      setRemovedList(Array.isArray(rem) ? rem : []);
    } catch (err) {
      console.error('Error loading data for add payment modal:', err);
    } finally {
      setLoadingStudents(false);
      setLoadingRemoved(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const id = (s.studentId || s.id || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const rto = (s.rto || s.assignedRto || '').toLowerCase();
      return name.includes(q) || id.includes(q) || email.includes(q) || rto.includes(q);
    }).slice(0, 50);
  }, [students, searchQuery]);

  const handleSelectStudent = (stu) => {
    setSelectedStudent(stu);
    const defaultFee = stu.independentFee || '';
    setCustomFee(defaultFee ? String(defaultFee) : '');
  };

  const handleManualAddSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedStudent) {
      toast.warning('Please select a student first');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        studentDbId: selectedStudent._id || selectedStudent.id,
        studentId: selectedStudent.studentId || selectedStudent.id,
        fee: customFee !== '' ? Number(customFee) : undefined,
        chargePercentage: Number(chargePercentage),
        notes,
      };

      const res = await manualAddPayment(payload);
      toast.success(res?.message || 'Student added to Payment successfully');
      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to add student to payment:', err);
      toast.error(err?.response?.data?.message || 'Failed to add student to payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestorePayment = async (paymentId, studentName) => {
    try {
      setSubmitting(true);
      const res = await restorePayment(paymentId);
      toast.success(res?.message || `${studentName || 'Student'} restored to payment`);
      await loadData();
      onUpdated();
    } catch (err) {
      console.error('Failed to restore payment:', err);
      toast.error(err?.response?.data?.message || 'Failed to restore student');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Students in Payment</h2>
              <p className="text-xs text-slate-500">Manually add students or restore previously removed students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Add Student to Payment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('removed')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'removed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Previously Removed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {removedList.length}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'add' ? (
            <div className="space-y-4">
              {/* Search bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Search & Select Student
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by student name, ID, email, or RTO..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Student list picker */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100">
                {loadingStudents ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No matching students found</div>
                ) : (
                  filteredStudents.map((stu) => {
                    const stuId = stu._id || stu.id;
                    const isSelected = selectedStudent && (selectedStudent._id === stuId || selectedStudent.id === stuId);
                    const stuName = stu.name || `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || 'Student';
                    const rtoName = stu.rto || stu.assignedRto || 'No RTO';
                    const course = stu.course || stu.courseQualification || 'No Course';

                    return (
                      <div
                        key={stuId}
                        onClick={() => handleSelectStudent(stu)}
                        className={`p-2.5 px-3 flex items-center justify-between cursor-pointer transition text-xs ${
                          isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate">{stuName}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            {stu.studentId || stu.id} &bull; {rtoName}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {course}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Student details and fee settings */}
              {selectedStudent && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Selected: {selectedStudent.name || `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Placement Fee (AUD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          placeholder="Auto from RTO / Course"
                          value={customFee}
                          onChange={(e) => setCustomFee(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use RTO price schedule</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Charge Percentage
                      </label>
                      <select
                        value={chargePercentage}
                        onChange={(e) => setChargePercentage(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
                      >
                        <option value="100">100% Full Charge</option>
                        <option value="30">30% Withdrawal / Missed Fee</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Manually added by admin for upfront payment"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Removed Students Tab */
            <div className="space-y-3">
              {loadingRemoved ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading removed students...</div>
              ) : removedList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold">No students have been removed from Payment.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">When students are removed, they appear here and can be restored at any time.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {removedList.map((p) => (
                    <div key={p._id || p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-900">{p.studentName}</p>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {p.rto || 'Independent'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ID: {p.studentId} &bull; Course: {p.course || '—'}
                        </p>
                        {p.removedAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Removed on {new Date(p.removedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {p.removedByName ? ` by ${p.removedByName}` : ''}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRestorePayment(p._id || p.id, p.studentName)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition cursor-pointer"
                        title="Restore student to payment tab"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          {activeTab === 'add' && (
            <button
              type="button"
              disabled={!selectedStudent || submitting}
              onClick={handleManualAddSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add to Payment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
