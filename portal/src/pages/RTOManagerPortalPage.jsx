import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudents } from '../api/studentsApi';
import ReviewSubmitModal from '../components/review/ReviewSubmitModal';
import { Users, CheckCircle2, Clock, Calendar, Search, Filter, Building2, UserCheck, UserPlus, Star } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RTOManagerPortalPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    loadRTOStudents();
  }, []);

  const loadRTOStudents = async () => {
    try {
      setLoading(true);
      const res = await fetchStudents();
      const list = res?.data ?? res ?? [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load RTO students:', err);
      toast.error('Unable to load RTO student records.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || s.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId || s.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'All' ||
      (s.placementStatus || s.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activePlacements = students.filter(s => ['Placement Started', 'In Progress'].includes(s.placementStatus)).length;
  const orientationScheduled = students.filter(s => ['Appointment Scheduled', 'Orientation Scheduled'].includes(s.placementStatus)).length;
  const completedPlacements = students.filter(s => ['Placement Completed', 'Completed'].includes(s.placementStatus)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="RTO Student Portal" breadcrumbs={['Dashboard', 'RTO Students']} />

        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Scope Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">RTO Student Management</h2>
                <p className="text-xs text-white/80">View and track placement progress for your enrolled students</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                <span>Rate & Review Experience</span>
              </button>
              <Link
                to="/add-student"
                className="flex items-center space-x-2 px-3.5 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-white/90 shadow-sm transition"
              >
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Add New Student</span>
              </Link>
              <span className="px-3 py-2 bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs">
                Strictly Scoped Access
              </span>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
                <h3 className="text-2xl font-extrabold text-slate-900">{students.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Orientation Scheduled</span>
                <h3 className="text-2xl font-extrabold text-amber-600">{orientationScheduled}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Active Placements</span>
                <h3 className="text-2xl font-extrabold text-emerald-600">{activePlacements}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Completed</span>
                <h3 className="text-2xl font-extrabold text-purple-600">{completedPlacements}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student name, ID, or course..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="All">All Placement Statuses</option>
                <option value="Appointment Scheduled">Appointment Scheduled</option>
                <option value="Placement Started">Placement Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Placement Completed">Placement Completed</option>
                <option value="Student Withdraw">Student Withdraw</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Enrolled RTO Students</h3>
              <span className="text-xs text-slate-500 font-semibold">{filteredStudents.length} Students Listed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-bold text-slate-600">Student Name & ID</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600">Course / Qualification</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600">Placement Status</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600">Appointment Date & Time</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600">Commencement Date</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600">Completion Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        Loading RTO student records...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr key={s._id || s.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{s.name || s.firstName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : 'Student Record'}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{s.studentId || s.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-medium">
                          {s.course || s.courseQualification || 'Health & Care Services'}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-teal-50 text-teal-700 border-teal-200">
                            {s.placementStatus || s.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {s.appointmentDate ? `${new Date(s.appointmentDate).toLocaleDateString()} ${s.appointmentTime || ''}` : '—'}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {s.commencementDate ? new Date(s.commencementDate).toLocaleDateString() : (s.startDate ? new Date(s.startDate).toLocaleDateString() : '—')}
                        </td>
                        <td className="py-4 px-4">
                          {s.completionDate ? (
                            <span className="text-emerald-600 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed ({new Date(s.completionDate).toLocaleDateString()})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">In Progress</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <ReviewSubmitModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}
