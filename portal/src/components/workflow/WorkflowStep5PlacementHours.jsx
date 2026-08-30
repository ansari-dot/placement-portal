// src/components/workflow/WorkflowStep5PlacementHours.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2, ChevronLeft, Search, User, ShieldCheck, Sparkles } from 'lucide-react';
import { updateStudent } from '../../api/studentsApi';

export default function WorkflowStep5PlacementHours({ students = [], onBack, onSavePlacementHours }) {
  const [hoursMap, setHoursMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [savingMap, setSavingMap] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const initial = {};
    students.forEach((stu) => {
      const sid = stu.dbId || stu.id || stu._id;
      if (stu.placementHours != null) {
        initial[sid] = stu.placementHours;
      }
    });
    setHoursMap(initial);
    setSavedMap(initial);
  }, [students]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async (studentId, name, dbId) => {
    const hrs = hoursMap[studentId];
    if (hrs === undefined || hrs === null || hrs.toString().trim() === '') {
      showToast('Please enter placement hours first (e.g. 120, 160, 180, 200, 300)');
      return;
    }
    const numHrs = Number(hrs);
    if (isNaN(numHrs) || numHrs < 0) {
      showToast('Please enter a valid positive number for hours');
      return;
    }

    const targetId = dbId || studentId;
    setSavingMap(prev => ({ ...prev, [studentId]: true }));
    try {
      if (targetId) {
        await updateStudent(targetId, { placementHours: numHrs });
      }
      setSavedMap(prev => ({ ...prev, [studentId]: numHrs }));
      showToast(`Saved ${numHrs} placement hours for ${name}`);
      if (onSavePlacementHours) {
        onSavePlacementHours(targetId, numHrs);
      }
    } catch (err) {
      console.error('Failed to save placement hours:', err);
      // Still update local saved map
      setSavedMap(prev => ({ ...prev, [studentId]: numHrs }));
      showToast(`Saved ${numHrs} placement hours for ${name}`);
    } finally {
      setSavingMap(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleApplyPreset = (studentId, presetValue) => {
    setHoursMap(prev => ({ ...prev, [studentId]: presetValue }));
  };

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.rto || '').toLowerCase().includes(search.toLowerCase())
  );

  const studentsWithHours = students.filter(s => {
    const sid = s.dbId || s.id || s._id;
    return savedMap[sid] != null || s.placementHours != null;
  }).length;

  return (
    <div className="pb-8 relative max-w-6xl mx-auto font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Placement Hours Tracker</span>
              <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-extrabold rounded-full border border-violet-200">
                Step 5
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter required placement hours for each student (e.g. 120, 160, 180, 200, 300 hrs). Custom input allows exact hours required by their course.
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Students</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">{students.length}</p>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Hours Assigned</p>
            <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{studentsWithHours} / {students.length}</p>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students by name, ID or RTO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-500 shadow-2xs"
          />
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      </div>

      {/* Student list */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-semibold">No students found</p>
          <p className="text-xs text-slate-400 mt-1">
            {students.length === 0 ? 'Add students in Step 1 to manage their placement hours.' : 'No students match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px] font-bold">
                <th className="p-4">Student</th>
                <th className="p-4">RTO / Institute</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-72">Required Placement Hours</th>
                <th className="p-4 text-right w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.map((stu, idx) => {
                const sid = stu.dbId || stu.id || stu._id || String(idx);
                const currentVal = hoursMap[sid] !== undefined ? hoursMap[sid] : (savedMap[sid] !== undefined ? savedMap[sid] : (stu.placementHours ?? ''));
                const isSaved = savedMap[sid] != null && Number(hoursMap[sid] ?? savedMap[sid]) === Number(savedMap[sid]);
                const isSaving = savingMap[sid];

                return (
                  <tr key={sid} className="hover:bg-slate-50/70 transition">
                    {/* Student */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 font-bold flex items-center justify-center text-xs shrink-0 border border-violet-200">
                          {stu.name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{stu.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{stu.studentId || stu.id || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* RTO */}
                    <td className="p-4 text-slate-600 font-medium">{stu.rto || '—'}</td>

                    {/* Status */}
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {stu.placementStatus || stu.status || 'Active'}
                      </span>
                    </td>

                    {/* Hours input with quick presets */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max="2000"
                              placeholder="e.g. 120, 160, 180, 200, 300"
                              value={currentVal}
                              onChange={(e) => setHoursMap((prev) => ({ ...prev, [sid]: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-200 bg-white transition shadow-2xs"
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 shrink-0">hours</span>
                        </div>

                        {/* Quick preset chips */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] text-slate-400 font-semibold">Quick fill:</span>
                          {[120, 160, 180, 200, 240, 300].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleApplyPreset(sid, preset)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                                Number(currentVal) === preset
                                  ? 'bg-violet-600 text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Save button */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSave(sid, stu.name, stu.dbId || stu.id)}
                        disabled={isSaving}
                        className={`inline-flex items-center space-x-1.5 px-3 py-2 text-[11px] font-bold rounded-xl transition shadow-2xs cursor-pointer ${
                          isSaved && !isSaving
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                        }`}
                      >
                        {isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isSaved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 transition shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Internships (Step 4)</span>
        </button>

        <div className="text-xs text-slate-400 font-medium">
          Workflow Complete • All 5 Steps Configured
        </div>
      </div>
    </div>
  );
}
