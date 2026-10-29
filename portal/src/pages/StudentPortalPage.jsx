import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudents, updateStudent, openStudentDocument, isStoredDocument } from '../api/studentsApi';
import ReviewSubmitModal from '../components/review/ReviewSubmitModal';
import {
  User, BookOpen, Calendar, Clock, CheckCircle2, ShieldCheck, Mail, Phone, MapPin,
  Star, Edit3, ArrowRight, FileText, Upload, X, Layers, Briefcase, Globe,
  Car, HeartHandshake, Eye, Save, AlertCircle, Loader2, Sparkles, Check
} from 'lucide-react';
import { toast } from 'react-toastify';

const STRUCTURED_DOCS = [
  { field: 'policeCheckDoc', label: 'Police Check Document', hint: 'National Police Certificate', highlight: true },
  { field: 'ndisDoc', label: 'NDIS Screening Check', hint: 'NDIS Worker Screening Check' },
  { field: 'wwccDoc', label: 'WWCC Check', hint: 'Working With Children Check' },
  { field: 'resumeDoc', label: 'Resume / CV', hint: 'Current resume or curriculum vitae' },
  { field: 'covidCheckDoc', label: 'COVID-19 Certificate', hint: 'Vaccination certificate or medical exemption' },
  { field: 'passportDoc', label: 'Passport Copy', hint: 'Valid international passport' },
  { field: 'drivingLicenceDoc', label: "Driver's Licence", hint: 'Australian or international driving licence' },
  { field: 'cbrDoc', label: 'CPR Certificate', hint: 'Cardiopulmonary Resuscitation certificate' },
  { field: 'infectionControlDoc', label: 'Infection Control', hint: 'Infection control training certificate' },
  { field: 'handHygieneDoc', label: 'Hand Hygiene Certificate', hint: 'Hand hygiene certificate' },
];

export default function StudentPortalPage() {
  const navigate = useNavigate();
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'step1', 'step2', 'step3', 'step4', 'step5'
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Editable Form Data State
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchStudents();
      const list = res?.data ?? res ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const student = list[0];
        setStudentProfile(student);
        setEditFormData({
          preferredName: student.preferredName || '',
          phoneNumber: student.phoneNumber || student.phone || '',
          phoneCode: student.phoneCode || '+61',
          alternatePhone: student.alternatePhone || '',
          whatsappNumber: student.whatsappNumber || '',
          address: student.address || '',
          suburb: student.suburb || '',
          state: student.state || 'SA',
          postCode: student.postCode || '',
          country: student.country || 'Australia',
          nationality: student.nationality || '',
          language: student.language || 'English',
          gender: student.gender || '',
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
          preferredLocation: student.preferredLocation || '',
          placementRadius: student.placementRadius || '25',
          preferredIndustry: Array.isArray(student.preferredIndustry) ? student.preferredIndustry.join(', ') : student.preferredIndustry || '',
          transport: student.transport || 'Public Transport',
          licenceNumber: student.licenceNumber || '',
          visaStatus: student.visaStatus || 'Student Visa (500)',
          emergencyContactName: student.emergencyContactName || '',
          emergencyContactPhone: student.emergencyContactPhone || '',
          placementNotes: student.placementNotes || '',
          policeCheckDoc: student.policeCheckDoc || null,
          ndisDoc: student.ndisDoc || null,
          wwccDoc: student.wwccDoc || null,
          resumeDoc: student.resumeDoc || student.resumeFile || null,
          covidCheckDoc: student.covidCheckDoc || null,
          passportDoc: student.passportDoc || null,
          drivingLicenceDoc: student.drivingLicenceDoc || null,
          cbrDoc: student.cbrDoc || null,
          infectionControlDoc: student.infectionControlDoc || null,
          handHygieneDoc: student.handHygieneDoc || null,
        });
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
      toast.error('Unable to load your profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!studentProfile?._id) return;
    try {
      setSavingEdit(true);
      const payload = { ...editFormData };
      await updateStudent(studentProfile._id, payload);
      toast.success('Your student profile was updated successfully!');
      setIsEditModalOpen(false);
      await loadMyProfile();
    } catch (err) {
      console.error('Failed to update student profile:', err);
      toast.error(err?.response?.data?.message || 'Failed to update student information.');
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Placement Started':
      case 'Placement Completed':
      case 'Active':
        return 'bg-emerald-500 text-white border-emerald-400';
      case 'Appointment Scheduled':
      case 'Appointment Successful':
        return 'bg-blue-500 text-white border-blue-400';
      case 'In Progress':
      case 'Industry Contacted':
        return 'bg-indigo-500 text-white border-indigo-400';
      case 'Awaiting':
      default:
        return 'bg-amber-500 text-white border-amber-400';
    }
  };

  const calculateWorkflowProgress = (status) => {
    switch (status) {
      case 'Awaiting': return 1;
      case 'In Progress': return 2;
      case 'Industry Contacted': return 2.5;
      case 'Appointment Scheduled': return 3;
      case 'Appointment Successful': return 3.5;
      case 'Placement Started': return 4;
      case 'Placement Completed': return 5;
      default: return 1;
    }
  };

  const currentStepNum = calculateWorkflowProgress(studentProfile?.placementStatus);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="My Placement Portal" breadcrumbs={['Dashboard', 'My Profile & Steps']} />

        <main className="p-6 space-y-6 max-w-[1300px] w-full mx-auto">
          {/* ================= HERO WELCOME HEADER ================= */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 text-white rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-extrabold text-white shadow-inner border border-white/30 shrink-0">
                  {studentProfile?.name ? studentProfile.name[0].toUpperCase() : 'S'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                      {studentProfile?.name || 'Student Portal'}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                      Student
                    </span>
                  </div>
                  <p className="text-xs text-white/80 font-medium">
                    Student ID: <span className="font-bold text-white font-mono">{studentProfile?.studentId || 'N/A'}</span>
                    {studentProfile?.assignedRto && ` • Enrolled at ${studentProfile.assignedRto}`}
                  </p>
                  <p className="text-xs text-white/90 font-medium">
                    {studentProfile?.courseQualification || studentProfile?.courses || 'Vocational Placement Program'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-blue-700" />
                  <span>Edit Profile & Documents</span>
                </button>

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Rate Your Placement</span>
                </button>

                <span className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs border ${getStatusColor(studentProfile?.placementStatus)}`}>
                  {studentProfile?.placementStatus || 'Awaiting'}
                </span>
              </div>
            </div>

            {/* ================= PROJECT WORKFLOW PIPELINE PROGRESS ================= */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between text-xs text-white/90 mb-3">
                <span className="font-extrabold flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-white">
                  <Layers className="w-4 h-4 text-teal-300" />
                  <span>Placement Project Pipeline Progress</span>
                </span>
                <span className="text-white/80 text-[11px] font-semibold">
                  Stage {Math.floor(currentStepNum)} of 5: <strong className="text-white underline">{studentProfile?.placementStatus || 'Awaiting'}</strong>
                </span>
              </div>

              {/* 5-Step Visual Stepper */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
                {[
                  { step: 1, title: 'Enrolled' },
                  { step: 2, title: 'Requests' },
                  { step: 3, title: 'Interviews' },
                  { step: 4, title: 'Placement' },
                  { step: 5, title: 'Completed' },
                ].map((s) => {
                  const isDone = currentStepNum >= s.step;
                  const isCurrent = Math.floor(currentStepNum) === s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-full h-2 rounded-full transition-all duration-500 ${
                          isDone ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-white/20'
                        }`}
                      />
                      <span className={`text-[10px] font-bold truncate max-w-full ${
                        isCurrent ? 'text-amber-300 font-extrabold underline' : isDone ? 'text-white' : 'text-white/60'
                      }`}>
                        {s.step}. {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= STEP SELECTOR TABS ================= */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Student Steps & Info', icon: Sparkles },
              { id: 'step1', label: 'Step 1: Personal Details', icon: User },
              { id: 'step2', label: 'Step 2: Education Details', icon: BookOpen },
              { id: 'step3', label: 'Step 3: Places & Preferences', icon: MapPin },
              { id: 'step4', label: 'Step 4: Compliance Docs (Dox)', icon: ShieldCheck },
              { id: 'step5', label: 'Step 5: Project & Schedule', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-bold text-slate-600">Loading student details and steps...</span>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ================= STEP 1: PERSONAL INFORMATION ================= */}
              {(activeTab === 'all' || activeTab === 'step1') && (
                <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase">Step 1</span>
                          <h3 className="font-extrabold text-slate-900 text-base">Personal Information</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Identity, contact, address & emergency details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Personal Info</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Full Legal Name</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.name || `${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}`.trim() || '—'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preferred Name</span>
                      <p className="font-semibold text-slate-800 text-sm">{studentProfile?.preferredName || '—'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date of Birth</span>
                      <p className="font-semibold text-slate-800 text-sm">
                        {studentProfile?.dateOfBirth ? new Date(studentProfile.dateOfBirth).toLocaleDateString() : '—'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Gender / Pronoun</span>
                      <p className="font-semibold text-slate-800 text-sm">{studentProfile?.gender || '—'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Email Address</span>
                      <p className="font-bold text-slate-900 text-xs truncate" title={studentProfile?.emailAddress || studentProfile?.email}>
                        {studentProfile?.emailAddress || studentProfile?.email || '—'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Phone Number</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.phoneNumber || studentProfile?.phone || '—'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WhatsApp / Alternate</span>
                      <p className="font-semibold text-slate-800 text-sm">{studentProfile?.whatsappNumber || studentProfile?.alternatePhone || '—'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nationality & Language</span>
                      <p className="font-semibold text-slate-800 text-sm">{studentProfile?.nationality || '—'} ({studentProfile?.language || 'English'})</p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Residential Address</span>
                      <p className="font-semibold text-slate-800 text-sm">
                        {[studentProfile?.address, studentProfile?.suburb, studentProfile?.state, studentProfile?.postCode, studentProfile?.country || 'Australia'].filter(Boolean).join(', ') || 'Address not provided'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Emergency Contact</span>
                      <p className="font-bold text-slate-900 text-xs">{studentProfile?.emergencyContactName || '—'}</p>
                      <p className="text-[11px] text-slate-500">{studentProfile?.emergencyContactPhone || ''}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: EDUCATION DETAILS ================= */}
              {(activeTab === 'all' || activeTab === 'step2') && (
                <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[10px] uppercase">Step 2</span>
                          <h3 className="font-extrabold text-slate-900 text-base">Education & Qualification Program</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Institution, certificate level, enrolment status & placement hours</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Education</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 lg:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Enrolled Course / Qualification</span>
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                        {studentProfile?.courseQualification || studentProfile?.course || 'Diploma of Nursing / Community Services'}
                      </h4>
                      <p className="text-xs text-indigo-600 font-semibold mt-1">Course Code: {studentProfile?.courseCode || 'CHC33021'}</p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Certificate Level</span>
                      <p className="font-extrabold text-slate-900 text-sm">{studentProfile?.courseLevel || 'Diploma / Vocational'}</p>
                      <span className="text-[11px] text-slate-500">{studentProfile?.studyMode || 'Full-time'} Study</span>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Registered Training Org (RTO)</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.assignedRto || studentProfile?.institute || 'Partner RTO'}</p>
                      <span className="text-[11px] text-slate-500">Campus: {studentProfile?.campus || 'Main Campus'}</span>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Student ID</span>
                      <p className="font-bold text-blue-700 text-sm font-mono">{studentProfile?.studentId || 'N/A'}</p>
                      <span className="text-[11px] text-slate-500">Classification: {studentProfile?.studentType || 'RTO Student'}</span>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Required Placement Hours</span>
                      <p className="font-extrabold text-emerald-700 text-sm">
                        {studentProfile?.placementHours ? `${studentProfile.placementHours} Hours` : '120 - 240 Hours Required'}
                      </p>
                      <span className="text-[11px] text-slate-500">Attendance: {studentProfile?.attendanceStatus || 'Enrolled'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: PLACEMENT PREFERENCES & PLACES ================= */}
              {(activeTab === 'all' || activeTab === 'step3') && (
                <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-extrabold text-[10px] uppercase">Step 3</span>
                          <h3 className="font-extrabold text-slate-900 text-base">Placement Preferences, Places & Availability</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Target facilities, radius, weekly working days, transport & visa status</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-teal-600 hover:bg-teal-50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Places & Availability</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preferred Placement Location</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {studentProfile?.preferredLocation || studentProfile?.suburb || 'Central Metro Suburbs'}
                      </p>
                      <span className="text-[11px] text-teal-600 font-semibold">Max Radius: {studentProfile?.placementRadius || '25'} km</span>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preferred Industry Sector</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {Array.isArray(studentProfile?.preferredIndustry) ? studentProfile.preferredIndustry.join(', ') : (studentProfile?.preferredIndustry || 'Aged Care & Community Services')}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Transport & Mobility</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.transport || 'Public Transport'}</p>
                      <span className="text-[11px] text-slate-500">
                        {studentProfile?.licenceNumber ? `Licence: ${studentProfile.licenceNumber}` : 'No driver licence entered'}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Visa & Work Rights</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.visaStatus || 'Student Visa (500)'}</p>
                      <span className="text-[11px] text-emerald-600 font-semibold">Active Work Rights Valid</span>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Weekly Availability Schedule</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const isAvail = studentProfile?.availabilityDays?.[day] ?? true;
                          return (
                            <span
                              key={day}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isAvail ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-slate-100 text-slate-400 border border-slate-200 line-through'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Preferred Hours: {studentProfile?.availabilityFrom || '09:00 AM'} to {studentProfile?.availabilityTo || '05:00 PM'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Relocation Flexibility</span>
                      <p className="font-bold text-slate-900 text-sm">{studentProfile?.willingToRelocate || 'Open to Nearby Sites'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: COMPLIANCE DOCUMENTS & VERIFICATION (DOX) ================= */}
              {(activeTab === 'all' || activeTab === 'step4') && (
                <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px] uppercase">Step 4</span>
                          <h3 className="font-extrabold text-slate-900 text-base">Compliance Documents & Verification (Dox)</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Police check, NDIS screening, WWCC, resume and healthcare certifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Update Dox</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {STRUCTURED_DOCS.map((doc) => {
                      const fileVal = studentProfile?.[doc.field];
                      const isUploaded = !!fileVal;
                      return (
                        <div
                          key={doc.field}
                          className={`p-4 rounded-2xl border transition-all ${
                            isUploaded ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 text-sm block">{doc.label}</span>
                              <span className="text-[11px] text-slate-400 block">{doc.hint}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isUploaded ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isUploaded ? '✓ Uploaded' : 'Pending'}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            {isUploaded ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isStoredDocument(fileVal)) {
                                    openStudentDocument(fileVal).catch(() => toast.error('Could not open document preview'));
                                  } else {
                                    toast.info(`Stored Document: ${fileVal}`);
                                  }
                                }}
                                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Document</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Now</span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">
                              {isUploaded ? (typeof fileVal === 'string' ? fileVal.split('/').pop().substring(0, 20) : 'File ready') : 'No file'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= STEP 5: PROJECT & SCHEDULE ================= */}
              {(activeTab === 'all' || activeTab === 'step5') && (
                <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase">Step 5</span>
                          <h3 className="font-extrabold text-slate-900 text-base">Placement Project Schedule & Appointments</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Orientation meetings, interview schedule, placement commencement & supervisor</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-[10px]">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Orientation & Interview</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-base">
                        {studentProfile?.appointmentDate ? new Date(studentProfile.appointmentDate).toLocaleDateString() : 'Awaiting Schedule'}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {studentProfile?.appointmentTime ? `Time: ${studentProfile.appointmentTime}` : 'Coordinator is scheduling host appointment'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-[10px]">
                        <Calendar className="w-4 h-4 text-teal-500" />
                        <span>Commencement Date</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-base">
                        {studentProfile?.commencementDate ? new Date(studentProfile.commencementDate).toLocaleDateString() : 'Awaiting Placement Start'}
                      </p>
                      <p className="text-slate-500 font-medium">
                        End Date: {studentProfile?.completionDate ? new Date(studentProfile.completionDate).toLocaleDateString() : 'Est. after completion of hours'}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-500 font-bold uppercase text-[10px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Assigned Coordinator</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-base">
                        {studentProfile?.assignedCoordinatorName || 'Placement Operations Team'}
                      </p>
                      <p className="text-slate-500 font-medium">Dedicated support for your practical placement</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* ================= EDIT ALL STUDENT STEPS MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Your Student Details & Documents</h3>
                  <p className="text-xs text-slate-400">Update personal info, places, preferences & compliance documents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6 text-xs">
              {/* Personal Section */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 text-blue-700">
                  <User className="w-4 h-4" />
                  <span>Personal Contact & Address</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Preferred Name</label>
                    <input
                      type="text"
                      value={editFormData.preferredName}
                      onChange={(e) => setEditFormData({ ...editFormData, preferredName: e.target.value })}
                      placeholder="e.g. Sam"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Primary Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      placeholder="e.g. 0400 123 456"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Alternate / WhatsApp Phone</label>
                    <input
                      type="text"
                      value={editFormData.whatsappNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                      placeholder="e.g. +61 400 987 654"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Street Address</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="e.g. 123 King William Street"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Suburb / City</label>
                    <input
                      type="text"
                      value={editFormData.suburb}
                      onChange={(e) => setEditFormData({ ...editFormData, suburb: e.target.value })}
                      placeholder="e.g. Adelaide"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">State & Postcode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-medium"
                      >
                        {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text"
                        value={editFormData.postCode}
                        onChange={(e) => setEditFormData({ ...editFormData, postCode: e.target.value })}
                        placeholder="5000"
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Placement Places & Preferences Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 text-teal-700">
                  <MapPin className="w-4 h-4" />
                  <span>Places & Placement Preferences</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Preferred Location / Suburbs</label>
                    <input
                      type="text"
                      value={editFormData.preferredLocation}
                      onChange={(e) => setEditFormData({ ...editFormData, preferredLocation: e.target.value })}
                      placeholder="e.g. North Adelaide / Norwood / Marion"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-teal-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Travel Radius (km)</label>
                    <input
                      type="number"
                      value={editFormData.placementRadius}
                      onChange={(e) => setEditFormData({ ...editFormData, placementRadius: e.target.value })}
                      placeholder="e.g. 25"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-teal-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Transport Method</label>
                    <select
                      value={editFormData.transport}
                      onChange={(e) => setEditFormData({ ...editFormData, transport: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium"
                    >
                      <option value="Own Car">Own Car</option>
                      <option value="Public Transport">Public Transport</option>
                      <option value="Bicycle / Walking">Bicycle / Walking</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Driver Licence Number (Optional)</label>
                    <input
                      type="text"
                      value={editFormData.licenceNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, licenceNumber: e.target.value })}
                      placeholder="Licence number if driving"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      placeholder="Emergency Contact Person"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                      placeholder="0400 000 000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Document Attachments Info */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 text-purple-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Compliance Verification Documents (Dox)</span>
                </h4>
                <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 flex items-start gap-3 text-xs text-purple-900">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Compliance check status is maintained directly on your placement file.</p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      You can view your existing uploaded verification documents above or contact your coordinator if you need to submit refreshed police clearance or working with children screening files.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Updates...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewSubmitModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}
