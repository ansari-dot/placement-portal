import React, { useState, useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudents, updateStudent } from '../api/studentsApi';
import IndustryAttendanceSection from '../components/industry/IndustryAttendanceSection';
import { Building2, Users, Calendar, CheckCircle2, Clock, Edit3, X, Save, ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';

export default function IndustryPortalPage() {
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'attendance'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal edit state for updating placement dates/status
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalAppointmentDate, setModalAppointmentDate] = useState('');
  const [modalAppointmentTime, setModalAppointmentTime] = useState('');
  const [modalCommencementDate, setModalCommencementDate] = useState('');
  const [modalCompletionDate, setModalCompletionDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignedStudents();
  }, []);

  const loadAssignedStudents = async () => {
    try {
      setLoading(true);
      const res = await fetchStudents();
      const list = res?.data ?? res ?? [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load industry students:', err);
      toast.error('Unable to load assigned students.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setModalStatus(student.placementStatus || 'Appointment Scheduled');
    setModalAppointmentDate(student.appointmentDate ? new Date(student.appointmentDate).toISOString().split('T')[0] : '');
    setModalAppointmentTime(student.appointmentTime || '');
    setModalCommencementDate(student.commencementDate ? new Date(student.commencementDate).toISOString().split('T')[0] : '');
    setModalCompletionDate(student.completionDate ? new Date(student.completionDate).toISOString().split('T')[0] : '');
  };

  const handleCloseModal = () => {
    setEditingStudent(null);
  };

  const handleSaveStudentUpdate = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSubmitting(true);
      const sId = editingStudent._id || editingStudent.id;
      const payload = {
        placementStatus: modalStatus,
        appointmentDate: modalAppointmentDate || undefined,
        appointmentTime: modalAppointmentTime || undefined,
        commencementDate: modalCommencementDate || undefined,
        completionDate: modalCompletionDate || undefined,
      };

      await updateStudent(sId, payload);
      toast.success(`Placement info for ${editingStudent.name || 'Student'} updated successfully!`);
      await loadAssignedStudents();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to update student placement info:', err);
      toast.error(err?.response?.data?.message || 'Failed to update student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="Industry Partner Portal" breadcrumbs={['Dashboard', 'Facility Students & Attendance']} />

        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Scope Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Facility Placement & Attendance Portal</h2>
                <p className="text-xs text-white/80">Manage orientation, commencement dates, and record student online attendance</p>
              </div>
            </div>
            
            {/* Tab Switchers */}
            <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-xl backdrop-blur-xs">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Assigned Students</span>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Record Attendance</span>
              </button>
            </div>
          </div>

          {activeTab === 'students' ? (
            <div className="space-y-6">
              {/* Assigned Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Facility Placement Roster</h3>
                  <span className="text-xs text-slate-500 font-semibold">{students.length} Assigned Students</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-bold text-slate-600">Student Name</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Course / Placement</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Orientation Appointment</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Commencement Date</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Placement Status</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Completion Date</th>
                        <th className="py-3.5 px-4 text-right font-bold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            Loading assigned facility students...
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            No students currently assigned to your facility.
                          </td>
                        </tr>
                      ) : (
                        students.map((s, idx) => (
                          <tr key={s._id || s.id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-4 px-4 font-bold text-slate-900">{s.name}</td>
                            <td className="py-4 px-4 text-slate-700">{s.course || 'Individual Support'}</td>
                            <td className="py-4 px-4 text-slate-600">
                              {s.appointmentDate ? `${new Date(s.appointmentDate).toLocaleDateString()} ${s.appointmentTime || ''}` : '—'}
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {s.commencementDate ? new Date(s.commencementDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-amber-50 text-amber-800 border-amber-200">
                                {s.placementStatus || 'Orientation Scheduled'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {s.completionDate ? new Date(s.completionDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleOpenEditModal(s)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition inline-flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Update Status / Dates</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Attendance Tab */
            <IndustryAttendanceSection assignedStudents={students} />
          )}
        </main>
      </div>

      {/* UPDATE STUDENT PLACEMENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Update Placement & Orientation</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student</label>
                <input
                  type="text"
                  disabled
                  value={editingStudent.name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Placement Status *</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-white font-semibold"
                >
                  <option value="Appointment Scheduled">Appointment Scheduled</option>
                  <option value="Appointment Successful">Appointment Successful</option>
                  <option value="Placement Started">Placement Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Placement Completed">Placement Completed</option>
                  <option value="Student Withdraw">Student Withdraw</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Orientation Date</label>
                  <input
                    type="date"
                    value={modalAppointmentDate}
                    onChange={(e) => setModalAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Orientation Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={modalAppointmentTime}
                    onChange={(e) => setModalAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commencement Date</label>
                  <input
                    type="date"
                    value={modalCommencementDate}
                    onChange={(e) => setModalCommencementDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={modalCompletionDate}
                    onChange={(e) => setModalCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Placement Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
