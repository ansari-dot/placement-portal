import React, { useState, useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudents } from '../api/studentsApi';
import { User, BookOpen, Calendar, Clock, CheckCircle2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentPortalPage() {
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchStudents();
      const list = res?.data ?? res ?? [];
      if (Array.isArray(list) && list.length > 0) {
        setStudentProfile(list[0]);
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
      toast.error('Unable to load your profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="My Placement Profile" breadcrumbs={['Dashboard', 'My Profile']} />

        <main className="p-6 space-y-6 max-w-[1200px] w-full mx-auto">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                {studentProfile?.name ? studentProfile.name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{studentProfile?.name || 'Welcome Student'}</h2>
                <p className="text-xs text-white/80 font-medium">Student ID: {studentProfile?.studentId || studentProfile?.id || 'N/A'}</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/20">
              {studentProfile?.placementStatus || 'Active Student'}
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 font-semibold">
              Loading your student profile...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Personal Details</h3>
                    <p className="text-xs text-slate-400">Your registered profile details</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                      <span className="font-semibold">{studentProfile?.email || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                      <span className="font-semibold">{studentProfile?.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                      <span className="font-semibold">{studentProfile?.location || studentProfile?.suburb || '—'}, {studentProfile?.state || ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education & Course Info Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Course & Qualification</h3>
                    <p className="text-xs text-slate-400">Your enrolled placement program</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Name</span>
                    <span className="font-bold text-slate-900 text-sm">{studentProfile?.course || 'Diploma of Nursing / Individual Support'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Code</span>
                    <span className="font-semibold text-slate-700">{studentProfile?.courseCode || 'CHC33021'}</span>
                  </div>
                </div>
              </div>

              {/* Placement & Appointment Information */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Placement & Appointment Schedule</h3>
                    <p className="text-xs text-slate-400">Your placement dates and current status</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Orientation Appointment</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {studentProfile?.appointmentDate ? new Date(studentProfile.appointmentDate).toLocaleDateString() : 'Pending Schedule'}
                    </p>
                    {studentProfile?.appointmentTime && (
                      <p className="text-slate-500 font-medium">{studentProfile.appointmentTime}</p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      <span>Placement Commencement</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {studentProfile?.commencementDate ? new Date(studentProfile.commencementDate).toLocaleDateString() : (studentProfile?.startDate ? new Date(studentProfile.startDate).toLocaleDateString() : 'Awaiting Commencement')}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Completion Status</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {studentProfile?.completionDate ? `Completed on ${new Date(studentProfile.completionDate).toLocaleDateString()}` : 'In Progress'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
