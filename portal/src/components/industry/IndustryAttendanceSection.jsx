import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Search,
  FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchAttendanceRecords,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from '../../api/attendanceApi';
import { fetchStudents } from '../../api/studentsApi';

export default function IndustryAttendanceSection({ assignedStudents = [] }) {
  const [records, setRecords] = useState([]);
  const [studentsList, setStudentsList] = useState(assignedStudents);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [finishTime, setFinishTime] = useState('05:00 PM');
  const [totalHours, setTotalHours] = useState(8);
  const [status, setStatus] = useState('Present');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto calculate total hours when startTime or finishTime changes
  useEffect(() => {
    try {
      const parseTime = (tStr) => {
        const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const period = match[3]?.toUpperCase();
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      const startMins = parseTime(startTime);
      const finishMins = parseTime(finishTime);
      if (finishMins > startMins) {
        setTotalHours(Number(((finishMins - startMins) / 60).toFixed(2)));
      }
    } catch (_) {}
  }, [startTime, finishTime]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [attRes, stuRes] = await Promise.all([
        fetchAttendanceRecords({ search: searchQuery }),
        assignedStudents.length === 0 ? fetchStudents() : Promise.resolve({ data: assignedStudents }),
      ]);
      if (attRes?.data) setRecords(attRes.data);
      if (stuRes?.data && assignedStudents.length === 0) setStudentsList(stuRes.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [assignedStudents, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.warn('Please select a student.');
      return;
    }
    if (!date) {
      toast.warn('Please select a date.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateAttendanceRecord(editingId, {
          studentId: selectedStudentId,
          date,
          startTime,
          finishTime,
          totalHours: Number(totalHours),
          status,
          notes,
        });
        toast.success('Attendance entry updated successfully!');
      } else {
        await createAttendanceRecord({
          studentId: selectedStudentId,
          date,
          startTime,
          finishTime,
          totalHours: Number(totalHours),
          status,
          notes,
        });
        toast.success('Attendance entry recorded successfully!');
      }

      setEditingId(null);
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Attendance submit error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (rec) => {
    setEditingId(rec.id || rec._id);
    setSelectedStudentId(rec.studentId || rec.student);
    setDate(rec.date);
    setStartTime(rec.startTime || '09:00 AM');
    setFinishTime(rec.finishTime || '05:00 PM');
    setTotalHours(rec.totalHours || 8);
    setStatus(rec.status || 'Present');
    setNotes(rec.notes || '');
  };

  const handleDelete = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to delete attendance record for ${studentName}?`)) return;
    try {
      await deleteAttendanceRecord(id);
      toast.success('Attendance entry deleted.');
      loadData();
    } catch (err) {
      console.error('Attendance delete error:', err);
      toast.error('Failed to delete attendance entry.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNotes('');
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Absent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Half Day':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* RECORD ATTENDANCE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">
            {editingId ? 'Edit Student Attendance Record' : 'Record Student Attendance'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Select */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Assigned Student *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
              >
                <option value="">-- Choose Student --</option>
                {studentsList.map((s) => {
                  const sId = s.id || s._id || s.studentId;
                  const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
                  return (
                    <option key={sId} value={sId}>
                      {name} {s.studentId ? `(${s.studentId})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attendance Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
              />
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attendance Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Time */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="text"
                placeholder="e.g. 09:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
              />
            </div>

            {/* Finish Time */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Finish Time</label>
              <input
                type="text"
                placeholder="e.g. 05:00 PM"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
              />
            </div>

            {/* Total Hours */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Shift Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Completed orientation shift, logbook signed by supervisor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#0147A6] hover:bg-[#0879a7] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Attendance' : 'Save Attendance Record'}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ATTENDANCE LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Online Attendance History Log</h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{records.length} Record(s)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading attendance records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No attendance entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Facility / Industry</th>
                  <th className="py-3 px-4">Shift Time</th>
                  <th className="py-3 px-4 text-center">Total Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {records.map((r) => {
                  const rId = r.id || r._id;
                  return (
                    <tr key={rId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900">{r.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.studentId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.facilityName || 'Facility'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {r.startTime} - {r.finishTime}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-700">{r.totalHours} hrs</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rId, r.studentName)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
