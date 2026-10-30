import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronRight, Check, Star, Loader2, Layers,
  Calendar, Clock, MapPin, Building2, User, Phone,
  Mail, Video, FileText, ShieldCheck, Award, Globe,
  Car, FileCheck, CheckCircle2, AlertCircle, ExternalLink,
  Briefcase, Sparkles, Send, Eye, RefreshCw, LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

// Same exact form components used in Admin Add New Student
import PersonalInformationForm from '../components/student/PersonalInformationForm';
import EducationDetailsForm from '../components/student/EducationDetailsForm';
import RtoSourceForm from '../components/student/RtoSourceForm';
import ReviewSubmitForm from '../components/student/ReviewSubmitForm';

// Placement review modal
import ReviewSubmitModal from '../components/review/ReviewSubmitModal';

// Backend APIs
import {
  fetchStudents,
  createStudent,
  updateStudent,
  openStudentDocument,
  isStoredDocument
} from '../api/studentsApi';
import { fetchWorkflows } from '../api/workflowApi';
import { fetchMyReviews } from '../api/reviewApi';

const initialFormData = {
  // Personal Information
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  language: '',
  emailAddress: '',
  phoneCode: '+61',
  phoneNumber: '',
  altPhoneCode: '+61',
  alternatePhone: '',
  waPhoneCode: '+61',
  whatsappNumber: '',
  address: '',
  suburb: '',
  state: '',
  postCode: '',
  country: 'Australia',

  // Student Classification & Placement Billing
  studentType: 'RTO Student',
  rtoId: '',
  independentFee: '',

  // Education Details
  courseQualification: '',
  specialisation: '',
  courseLevel: '',
  studyMode: '',
  studentId: '',
  institute: '',
  campus: '',
  startDate: '',
  expectedEndDate: '',
  currentYearSemester: '',
  attendanceStatus: '',
  academicStatus: '',
  gpa: '',
  previousQualification: '',
  yearOfCompletion: '',
  documents: null,

  // Structured Compliance / Identity Documents (all optional)
  ndisDoc: null,
  resumeDoc: null,
  wwccDoc: null,
  passportDoc: null,
  drivingLicenceDoc: null,
  infectionControlDoc: null,
  handHygieneDoc: null,
  cbrDoc: null,

  // RTO & Source / Additional Info
  assignedRto: '',
  courses: '',
  internshipPriority: '',
  studentSource: '',
  transport: '',
  licenceNumber: '',
  policeCheckDoc: null,
  covidCheckDoc: null,
  additionalDocuments: [],
  preferredLocation: '',
  placementRadius: '',
  preferredIndustry: '',
  placementSite: [],
  availabilityDays: {},
  availabilityFrom: '09:00 AM',
  availabilityTo: '05:00 PM',
  placementHours: '',
  willingToRelocate: '',
  placementNotes: '',

  // Additional Information
  visaStatus: '',
  visaSubclass: '',
  visaExpiryDate: '',
  workRights: '',
  workExperience: '',
  englishProficiency: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  heardAboutUs: '',
  hasResume: '',
  resumeFile: null,
  additionalNotes: '',
};

const STRUCTURED_DOCS = [
  { field: 'policeCheckDoc', label: 'Police Clearance', hint: 'National Police Certificate', icon: ShieldCheck },
  { field: 'wwccDoc', label: 'WWCC Clearance', hint: 'Working With Children Check', icon: ShieldCheck },
  { field: 'ndisDoc', label: 'NDIS Screening', hint: 'Worker Screening Check', icon: ShieldCheck },
  { field: 'cbrDoc', label: 'CPR Certificate', hint: 'Cardiopulmonary Resuscitation', icon: FileCheck },
  { field: 'covidCheckDoc', label: 'COVID-19 Proof', hint: 'Vaccination / Exemption', icon: FileCheck },
  { field: 'resumeDoc', label: 'Resume / CV', hint: 'Current Curriculum Vitae', icon: FileText },
  { field: 'passportDoc', label: 'Passport Copy', hint: 'Identity Verification', icon: Globe },
  { field: 'drivingLicenceDoc', label: "Driver's Licence", hint: 'Driving Credential', icon: Car },
  { field: 'infectionControlDoc', label: 'Infection Control', hint: 'Training Certificate', icon: Award },
  { field: 'handHygieneDoc', label: 'Hand Hygiene', hint: 'Online Module Certificate', icon: Award },
];

const mapStudentToFormData = (student) => {
  if (!student) return initialFormData;

  let fName = student.firstName || '';
  let mName = student.middleName || '';
  let lName = student.lastName || '';
  if (!fName && student.name) {
    const parts = student.name.trim().split(' ');
    fName = parts[0] || '';
    if (parts.length > 2) {
      mName = parts.slice(1, -1).join(' ');
      lName = parts[parts.length - 1];
    } else {
      lName = parts.slice(1).join(' ');
    }
  }

  const formatDate = (val) => {
    if (!val) return '';
    try {
      return new Date(val).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return {
    firstName: fName,
    middleName: mName,
    lastName: lName,
    preferredName: student.preferredName || '',
    dateOfBirth: formatDate(student.dateOfBirth),
    gender: student.gender || '',
    nationality: student.nationality || '',
    language: student.language || 'English',
    emailAddress: student.emailAddress || student.email || '',
    phoneCode: student.phoneCode || '+61',
    phoneNumber: student.phoneNumber || student.phone || '',
    altPhoneCode: student.altPhoneCode || '+61',
    alternatePhone: student.alternatePhone || '',
    waPhoneCode: student.waPhoneCode || '+61',
    whatsappNumber: student.whatsappNumber || '',
    address: student.address || '',
    suburb: student.suburb || '',
    state: student.state || 'SA',
    postCode: student.postCode || '',
    country: student.country || 'Australia',

    // Student Classification & Placement Billing
    studentType: student.studentType || 'RTO Student',
    rtoId: student.rtoId || '',
    independentFee: student.independentFee ?? '',

    // Education Details
    courseQualification: student.courseQualification || student.courses || '',
    specialisation: student.specialisation || '',
    courseLevel: student.courseLevel || '',
    studyMode: student.studyMode || '',
    studentId: student.studentId || '',
    institute: student.institute || student.assignedRto || '',
    campus: student.campus || '',
    startDate: formatDate(student.startDate),
    expectedEndDate: formatDate(student.expectedEndDate),
    currentYearSemester: student.currentYearSemester || '',
    attendanceStatus: student.attendanceStatus || '',
    academicStatus: student.academicStatus || '',
    gpa: student.gpa || '',
    previousQualification: student.previousQualification || '',
    yearOfCompletion: student.yearOfCompletion || '',
    documents: student.documents || null,

    // Structured Compliance / Identity Documents
    ndisDoc: student.ndisDoc || null,
    resumeDoc: student.resumeDoc || student.resumeFile || null,
    wwccDoc: student.wwccDoc || null,
    passportDoc: student.passportDoc || null,
    drivingLicenceDoc: student.drivingLicenceDoc || null,
    infectionControlDoc: student.infectionControlDoc || null,
    handHygieneDoc: student.handHygieneDoc || null,
    cbrDoc: student.cbrDoc || null,

    // RTO & Source / Additional Info
    assignedRto: student.assignedRto || student.institute || '',
    courses: student.courses || student.courseQualification || '',
    internshipPriority: student.internshipPriority || '',
    studentSource: student.studentSource || 'Social Media',
    transport: student.transport || 'Public Transport',
    licenceNumber: student.licenceNumber || '',
    policeCheckDoc: student.policeCheckDoc || null,
    covidCheckDoc: student.covidCheckDoc || null,
    additionalDocuments: Array.isArray(student.additionalDocuments) ? student.additionalDocuments : [],
    preferredLocation: student.preferredLocation || '',
    placementRadius: student.placementRadius || '25',
    preferredIndustry: Array.isArray(student.preferredIndustry) ? student.preferredIndustry.join(', ') : student.preferredIndustry || '',
    placementSite: Array.isArray(student.placementSite) ? student.placementSite : [],
    availabilityDays: (typeof student.availabilityDays === 'object' && student.availabilityDays !== null) ? student.availabilityDays : {},
    availabilityFrom: student.availabilityFrom || '09:00 AM',
    availabilityTo: student.availabilityTo || '05:00 PM',
    placementHours: student.placementHours ?? '',
    willingToRelocate: student.willingToRelocate || '',
    placementNotes: student.placementNotes || '',

    // Additional Information
    visaStatus: student.visaStatus || 'Student Visa (500)',
    visaSubclass: student.visaSubclass || '',
    visaExpiryDate: formatDate(student.visaExpiryDate),
    workRights: student.workRights || '',
    workExperience: student.workExperience || '',
    englishProficiency: student.englishProficiency || '',
    emergencyContactName: student.emergencyContactName || '',
    emergencyContactPhone: student.emergencyContactPhone || '',
    heardAboutUs: student.heardAboutUs || '',
    hasResume: student.hasResume || '',
    resumeFile: student.resumeFile || null,
    additionalNotes: student.additionalNotes || '',
  };
};

export default function StudentPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Workflow tracking states
  const [studentRequests, setStudentRequests] = useState([]);
  const [studentAppointments, setStudentAppointments] = useState([]);
  const [studentInternships, setStudentInternships] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const totalSteps = 4;
  const authUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      setLoading(true);
      const res = await fetchStudents();
      const list = res?.data ?? res ?? [];
      let student = null;
      if (Array.isArray(list) && list.length > 0) {
        student = list[0];
        setStudentProfile(student);
        setFormData(mapStudentToFormData(student));
      } else if (authUser?.email) {
        setFormData(prev => ({
          ...prev,
          emailAddress: authUser.email,
          firstName: authUser.name ? authUser.name.split(' ')[0] : '',
          lastName: authUser.name ? authUser.name.split(' ').slice(1).join(' ') : '',
        }));
      }

      if (student) {
        await loadWorkflowData(student);
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
      toast.error('Unable to load your profile details.');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowData = async (student) => {
    try {
      const [wfRes, revRes] = await Promise.allSettled([
        fetchWorkflows(),
        fetchMyReviews(),
      ]);

      const rawWfs = wfRes.status === 'fulfilled' ? (wfRes.value?.data || wfRes.value || []) : [];
      const wfs = Array.isArray(rawWfs) ? rawWfs : [];

      const reviews = revRes.status === 'fulfilled' ? (revRes.value?.data || revRes.value || []) : [];
      setMyReviews(Array.isArray(reviews) ? reviews : []);

      const sId = String(student?.studentId || '').trim().toLowerCase();
      const sDbId = String(student?._id || student?.id || '').trim().toLowerCase();
      const sName = String(student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`).trim().toLowerCase();

      const isMatch = (item) => {
        if (!item) return false;
        const itemStuId = String(item.studentId || '').trim().toLowerCase();
        const itemStuName = String(item.student || '').trim().toLowerCase();
        return (
          (sId && itemStuId === sId) ||
          (sDbId && itemStuId === sDbId) ||
          (sName && itemStuName === sName)
        );
      };

      const matchedRequests = [];
      const matchedAppointments = [];
      const matchedInternships = [];

      wfs.forEach((wf) => {
        (wf.requests || []).forEach((req) => {
          if (isMatch(req)) matchedRequests.push(req);
        });
        (wf.appointments || []).forEach((appt) => {
          if (isMatch(appt)) matchedAppointments.push(appt);
        });
        (wf.internships || []).forEach((intern) => {
          if (isMatch(intern)) matchedInternships.push(intern);
        });
      });

      setStudentRequests(matchedRequests);
      setStudentAppointments(matchedAppointments);
      setStudentInternships(matchedInternships);
    } catch (err) {
      console.error('Error loading student workflow data:', err);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information', subtitle: 'Basic details of the student' },
    { number: 2, title: 'Education Details', subtitle: 'Course and education info' },
    { number: 3, title: 'Additional Information', subtitle: 'Industry, visa & placement preferences' },
    { number: 4, title: 'Review & Submit', subtitle: 'Review and save student' },
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateFields = (fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.emailAddress?.trim()) newErrors.emailAddress = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) newErrors.emailAddress = 'Enter a valid email';
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    } else if (step === 2) {
      if (formData.studentType === 'Independent Student') {
        if (!formData.independentFee || isNaN(Number(formData.independentFee)) || Number(formData.independentFee) <= 0) {
          newErrors.independentFee = 'Valid placement fee is required for Independent Student';
        }
      } else {
        if (!formData.courseQualification) newErrors.courseQualification = 'Course is required';
        if (!formData.courseLevel) newErrors.courseLevel = 'Certificate level is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      handleSubmit();
      return;
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    if (studentProfile) {
      setFormData(mapStudentToFormData(studentProfile));
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      setErrors({ confirm: 'Please confirm the information is accurate before submitting.' });
      toast.warning('Please confirm the information is accurate before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = { ...formData };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = undefined;
      });

      if (payload.documents instanceof File) payload.documents = payload.documents.name;
      if (payload.resumeFile instanceof File) payload.resumeFile = payload.resumeFile.name;
      if (payload.policeCheckDoc instanceof File) payload.policeCheckDoc = payload.policeCheckDoc.name;
      if (payload.covidCheckDoc instanceof File) payload.covidCheckDoc = payload.covidCheckDoc.name;

      const docFields = ['ndisDoc', 'resumeDoc', 'wwccDoc', 'passportDoc', 'drivingLicenceDoc', 'infectionControlDoc', 'handHygieneDoc', 'cbrDoc'];
      docFields.forEach(field => {
        if (payload[field] instanceof File) payload[field] = payload[field].name;
      });

      if (Array.isArray(payload.additionalDocuments)) {
        payload.additionalDocuments = payload.additionalDocuments.map(item => ({
          title: item.title || '',
          file: item.file instanceof File ? item.file.name : item.file || ''
        }));
      }

      if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth);
      if (payload.startDate) payload.startDate = new Date(payload.startDate);
      if (payload.expectedEndDate) payload.expectedEndDate = new Date(payload.expectedEndDate);
      if (payload.visaExpiryDate) payload.visaExpiryDate = new Date(payload.visaExpiryDate);
      if (payload.placementHours !== undefined && payload.placementHours !== '') payload.placementHours = Number(payload.placementHours);
      if (payload.independentFee !== undefined && payload.independentFee !== '') payload.independentFee = Number(payload.independentFee);

      const studentIdToUpdate = studentProfile?._id || studentProfile?.id;
      if (studentIdToUpdate) {
        await updateStudent(studentIdToUpdate, payload);
        toast.success('Your profile details updated successfully!');
      } else {
        await createStudent(payload);
        toast.success('Your profile was created successfully!');
      }

      await loadMyProfile();
    } catch (err) {
      console.error('Could not save student:', err);
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        backendErrors.forEach(be => toast.error(`${be.field}: ${be.message}`));
      } else {
        const msg = err?.response?.data?.message || 'There was an error saving your profile. Please try again.';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Placement Started':
      case 'Placement Completed':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Appointment Scheduled':
      case 'Appointment Successful':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'In Progress':
      case 'Industry Contacted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'Awaiting':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-300';
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

  const currentWorkflowStep = calculateWorkflowProgress(studentProfile?.placementStatus);
  const uploadedDocCount = STRUCTURED_DOCS.filter(d => Boolean(formData[d.field])).length;

  const navigateToView = (viewKey) => {
    setSearchParams({ view: viewKey });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInformationForm formData={formData} updateField={updateField} errors={errors} />;
      case 2:
        return (
          <EducationDetailsForm
            formData={formData}
            updateField={updateField}
            errors={errors}
            isRtoManager={false}
            userRtoName={formData.assignedRto}
          />
        );
      case 3:
        return <RtoSourceForm formData={formData} updateField={updateField} updateFields={updateFields} errors={errors} />;
      case 4:
        return (
          <ReviewSubmitForm
            formData={formData}
            onEdit={setCurrentStep}
            confirmed={confirmed}
            setConfirmed={setConfirmed}
          />
        );
      default:
        return <PersonalInformationForm formData={formData} updateField={updateField} errors={errors} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <Header title="Student Portal" breadcrumbs={['Dashboard', 'My Student Portal']} />

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-4 max-w-[1600px] w-full mx-auto space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Loading your student portal...</span>
            </div>
          ) : (
            <>
              {/* ================= HERO IDENTITY BAR (Present on all views for quick orientation) ================= */}
              {studentProfile && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
                      {formData.firstName ? formData.firstName[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-extrabold text-slate-900">
                          {[formData.firstName, formData.lastName].filter(Boolean).join(' ') || studentProfile.name || 'My Student Profile'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {studentProfile.studentId || 'STU'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          Student
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formData.courseQualification || studentProfile.courseQualification || studentProfile.courses || 'Vocational Placement Program'}
                        {(formData.assignedRto || studentProfile.assignedRto) && ` • ${formData.assignedRto || studentProfile.assignedRto}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Rate Your Placement</span>
                    </button>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusColor(studentProfile.placementStatus)}`}>
                      {studentProfile.placementStatus || 'Awaiting'}
                    </span>
                  </div>
                </div>
              )}

              {/* ================= VIEW 1: OVERVIEW & PIPELINE DASHBOARD ================= */}
              {currentView === 'dashboard' && (
                <div className="space-y-4">
                  {/* Placement Pipeline Progress Bar */}
                  {studentProfile && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Placement Project Pipeline Progress
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                Stage {Math.floor(currentWorkflowStep)} of 5
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Current Stage: <strong className="text-teal-700">{studentProfile.placementStatus || 'Awaiting'}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
                          Pipeline Completion: <strong className="text-teal-700 font-bold">{Math.round((Math.min(currentWorkflowStep, 5) / 5) * 100)}%</strong>
                        </div>
                      </div>

                      {/* 5-Step Visual Stepper Bar */}
                      <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
                        {[
                          { step: 1, title: 'Enrolled', desc: 'Registered' },
                          { step: 2, title: 'Requests', desc: 'Outreach' },
                          { step: 3, title: 'Interviews', desc: 'Appointments' },
                          { step: 4, title: 'Placement', desc: 'Active Training' },
                          { step: 5, title: 'Completed', desc: 'Finished' },
                        ].map((s) => {
                          const isDone = currentWorkflowStep >= s.step;
                          const isCurrent = Math.floor(currentWorkflowStep) === s.step;
                          return (
                            <div key={s.step} className="flex flex-col items-center space-y-1.5">
                              <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 relative">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isDone
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 w-full'
                                      : 'w-0'
                                  }`}
                                />
                              </div>

                              <div className="flex flex-col items-center">
                                <span
                                  className={`text-[11px] font-bold truncate max-w-full ${
                                    isCurrent
                                      ? 'text-teal-700 font-extrabold underline'
                                      : isDone
                                      ? 'text-slate-900'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {s.step}. {s.title}
                                </span>
                                <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium truncate">
                                  {s.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4 Interactive KPI Cards linking to specific views */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                      onClick={() => navigateToView('applications')}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Applications</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">
                        {studentRequests.length} <span className="text-xs font-normal text-slate-500">Request(s)</span>
                      </p>
                      <p className="text-[11px] text-blue-700 font-semibold mt-1 truncate flex items-center justify-between">
                        <span>{studentRequests[0]?.status ? `Status: ${studentRequests[0].status}` : 'Awaiting Match'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                      </p>
                    </div>

                    <div
                      onClick={() => navigateToView('interviews')}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Interviews</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">
                        {studentAppointments.length} <span className="text-xs font-normal text-slate-500">Scheduled</span>
                      </p>
                      <p className="text-[11px] text-indigo-700 font-semibold mt-1 truncate flex items-center justify-between">
                        <span>{studentAppointments[0]?.date ? `Next: ${studentAppointments[0].date}` : 'None Scheduled'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      </p>
                    </div>

                    <div
                      onClick={() => navigateToView('placement')}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Placement Facility</span>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-slate-900 truncate">
                        {studentInternships[0]?.company || studentAppointments[0]?.company || studentRequests[0]?.company || 'Pending Match'}
                      </p>
                      <p className="text-[11px] text-teal-700 font-semibold mt-1 truncate flex items-center justify-between">
                        <span>{studentInternships[0]?.progress !== undefined ? `${studentInternships[0].progress}% Hours Completed` : 'In Preparation'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                      </p>
                    </div>

                    <div
                      onClick={() => navigateToView('compliance')}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 hover:shadow-xs transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clearances</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">
                        {uploadedDocCount} / {STRUCTURED_DOCS.length} <span className="text-xs font-normal text-slate-500">Files</span>
                      </p>
                      <p className="text-[11px] text-purple-700 font-semibold mt-1 truncate flex items-center justify-between">
                        <span>{uploadedDocCount >= 4 ? 'Compliance In Order' : 'Additional Files Needed'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                      </p>
                    </div>
                  </div>

                  {/* Quick Profile Edit Banner */}
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold">Need to review or update your enrolment details?</h4>
                      <p className="text-xs text-white/80 mt-0.5">
                        Access your full 4-step enrolment form anytime to update contact details, qualifications, or upload certificates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToView('profile')}
                      className="px-4 py-2 bg-white text-blue-700 rounded-xl text-xs font-bold transition hover:bg-blue-50 shadow-xs shrink-0 cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Open Enrolment Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= VIEW 2: MY ENROLMENT PROFILE FORM (THE EXACT ADMIN ADD NEW STUDENT FORM) ================= */}
              {currentView === 'profile' && (
                <div className="space-y-4">
                  {/* Page Title */}
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <span>My Enrolment Profile & Credentials</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Review, modify, and submit your personal, educational, and placement preference records.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Step {currentStep} of {totalSteps}
                    </span>
                  </div>

                  {/* Multi-Stepper Wizard Header Matching Add New Student Exactly */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                      {steps.map((step, index) => {
                        const isCompleted = currentStep > step.number;
                        const isCurrent = currentStep === step.number;

                        return (
                          <React.Fragment key={step.number}>
                            <div
                              className="flex items-center space-x-2.5 group cursor-pointer"
                              onClick={() => {
                                setCurrentStep(step.number);
                              }}
                            >
                              <div className="relative flex items-center">
                                {isCompleted && (
                                  <div className="absolute -left-2 z-10 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  </div>
                                )}

                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                                    isCompleted
                                      ? 'bg-white text-slate-400 border border-slate-200 pl-1.5'
                                      : isCurrent
                                      ? 'bg-blue-600 text-white shadow-blue-200'
                                      : 'bg-white text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {step.number}
                                </div>
                              </div>

                              <div>
                                <h4 className={`text-[11px] font-bold transition-colors ${isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>
                                  {step.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-medium">{step.subtitle}</p>
                              </div>
                            </div>

                            {index < steps.length - 1 && (
                              <div className="hidden xl:block flex-1 h-[2px] bg-slate-200 mx-3 rounded-full" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Form Container */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                    {renderStepContent()}

                    {errors.confirm && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-semibold text-rose-600">
                        {errors.confirm}
                      </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-5 mt-5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Reset
                      </button>
                      {currentStep > 1 && currentStep < totalSteps && (
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={submitting}
                          className="px-5 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={submitting}
                        className="px-5 py-2 rounded-lg bg-blue-600 text-[11px] font-semibold text-white shadow-xs hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>
                          {submitting
                            ? 'Saving...'
                            : currentStep === totalSteps
                            ? studentProfile?._id
                              ? 'Update Profile'
                              : 'Submit Application'
                            : 'Save & Next'}
                        </span>
                        {currentStep !== totalSteps && !submitting && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= VIEW 3: APPLICATIONS & OUTREACH ================= */}
              {currentView === 'applications' && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span>Placement Applications & Host Facility Outreach</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Track placement applications created for you and see host facilities contacted by coordinators.
                    </p>
                  </div>

                  {studentRequests.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No active placement applications yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Your coordinator will initiate and match placement applications for your target location.
                      </p>
                    </div>
                  ) : (
                    studentRequests.map((req, idx) => (
                      <div key={req._id || req.reqId || idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900">{req.title || 'Vocational Placement Request'}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                {req.reqId || `REQ-${idx + 1}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Target Industry: <strong className="text-slate-800">{req.company}</strong> • RTO: {req.rto}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              req.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {req.priority || 'Normal'} Priority
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
                              {req.status || 'Active'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Preferred Start</span>
                            <span className="font-semibold text-slate-800">{req.preferredStart || 'As soon as possible'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Work Type</span>
                            <span className="font-semibold text-slate-800">{req.workType || 'Standard Full/Part-time'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Duration</span>
                            <span className="font-semibold text-slate-800">{req.duration || `${formData.placementHours || 120} Hours`}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Location</span>
                            <span className="font-semibold text-slate-800 truncate block">{req.location || formData.preferredLocation || 'Local Region'}</span>
                          </div>
                        </div>

                        {/* Contacted Host Facilities */}
                        {Array.isArray(req.contactedIndustries) && req.contactedIndustries.length > 0 && (
                          <div className="pt-2">
                            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5 text-blue-600" />
                              <span>Host Facilities Contacted On Your Behalf ({req.contactedIndustries.length})</span>
                            </h5>
                            <div className="space-y-2">
                              {req.contactedIndustries.map((ind, i) => (
                                <div key={i} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-slate-900">{ind.organizationName || 'Host Facility'}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {[ind.suburb, ind.state].filter(Boolean).join(', ')}
                                      {ind.contactPerson && ` • Contact: ${ind.contactPerson}`}
                                      {ind.phone && ` (${ind.phone})`}
                                    </p>
                                    {ind.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">"{ind.notes}"</p>}
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 self-start sm:self-center ${
                                    ind.response === 'Accepted' || ind.response === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {ind.response || 'Outreach Pending'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ================= VIEW 4: INTERVIEWS & SCHEDULE ================= */}
              {currentView === 'interviews' && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span>Interviews & Scheduled Appointments</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Review interview venues, timings, interviewer contacts, and confirmed placement dates.
                    </p>
                  </div>

                  {studentAppointments.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No scheduled interviews right now</p>
                      <p className="text-xs text-slate-500 mt-1">
                        When an interview or facility visit is scheduled, full details and instructions will appear here.
                      </p>
                    </div>
                  ) : (
                    studentAppointments.map((appt, idx) => (
                      <div key={appt._id || appt.apptId || idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                              {appt.meetingType === 'Online' || appt.meetingType === 'Zoom' ? (
                                <Video className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <MapPin className="w-5 h-5 text-indigo-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{appt.company}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Role: <strong className="text-slate-800">{appt.position || 'Vocational Trainee'}</strong> • Format: {appt.meetingType || 'In-Person'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            appt.appointmentOutcome === 'successful' || appt.appointmentOutcome === 'Successful'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {appt.appointmentOutcome ? `Outcome: ${appt.appointmentOutcome}` : appt.status || 'Scheduled'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Date</span>
                            <span className="font-bold text-slate-900">{appt.date}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Time</span>
                            <span className="font-bold text-slate-900">{appt.time}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Interviewer</span>
                            <span className="font-semibold text-slate-800">{appt.interviewer || appt.contactPerson || 'Assigned Supervisor'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Venue / Link</span>
                            <span className="font-semibold text-slate-800 truncate block">{appt.location || 'Facility Premises'}</span>
                          </div>
                        </div>

                        {(appt.commencementDate || appt.expectedCompletionDate) && (
                          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex flex-wrap gap-5 text-emerald-950">
                            {appt.commencementDate && (
                              <div>
                                <span className="text-[10px] font-bold uppercase block text-emerald-800">Placement Start Date</span>
                                <span className="font-bold">{appt.commencementDate}</span>
                              </div>
                            )}
                            {appt.expectedCompletionDate && (
                              <div>
                                <span className="text-[10px] font-bold uppercase block text-emerald-800">Expected Completion Date</span>
                                <span className="font-bold">{appt.expectedCompletionDate}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {appt.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-700">Interview Notes:</span> {appt.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ================= VIEW 5: ACTIVE PLACEMENT & TRAINING ================= */}
              {currentView === 'placement' && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <span>Active Practical Placement & Hours</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Monitor your vocational host facility, commencement dates, and completion progress.
                    </p>
                  </div>

                  {studentInternships.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No active placement file recorded yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Once an appointment outcome is successful, your placement file will be activated here.
                      </p>
                    </div>
                  ) : (
                    studentInternships.map((intern, idx) => (
                      <div key={intern._id || intern.intId || idx} className="p-5 rounded-2xl border border-teal-200 bg-white shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{intern.company}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Program: <strong className="text-slate-800">{intern.title}</strong> • Coordinator: {intern.coordinator || 'Assigned Coordinator'}
                            </p>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs">
                            {intern.status || 'Active Placement'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Start Date</span>
                            <span className="font-bold text-slate-900">{intern.start || 'Scheduled'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">End Date</span>
                            <span className="font-bold text-slate-900">{intern.end || 'Pending'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Work Location</span>
                            <span className="font-semibold text-slate-800 truncate block">{intern.location || 'Facility Premises'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Required Hours</span>
                            <span className="font-semibold text-slate-800">{intern.duration || `${formData.placementHours || 120} Hours`}</span>
                          </div>
                        </div>

                        {/* Progress Meter */}
                        <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-100 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">Placement Training Progress</span>
                            <span className="text-teal-700">{intern.progress || 0}% Complete</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(intern.progress || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ================= VIEW 6: COMPLIANCE DOCUMENTS ================= */}
              {currentView === 'compliance' && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>Compliance Verification & Screening Clearances</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Check your required screening certificates to ensure you remain fully verified for placement shifts.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs flex items-center justify-between text-purple-900">
                    <div className="flex items-center space-x-2.5">
                      <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>
                        Australian aged care, disability, and childcare placements require mandatory verified police and working with children screening files.
                      </span>
                    </div>
                    <span className="font-bold text-purple-800 bg-white px-3 py-1 rounded-lg border border-purple-200 shrink-0">
                      {uploadedDocCount} of {STRUCTURED_DOCS.length} Provided
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STRUCTURED_DOCS.map((doc) => {
                      const Icon = doc.icon;
                      const hasFile = Boolean(formData[doc.field]);
                      const isStored = isStoredDocument(formData[doc.field]);

                      return (
                        <div key={doc.field} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              hasFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{doc.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{doc.hint}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {hasFile ? (
                              <>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Verified
                                </span>
                                {isStored && (
                                  <button
                                    type="button"
                                    onClick={() => openStudentDocument(formData[doc.field])}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer"
                                    title="View document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Action Needed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= VIEW 7: REVIEWS & FEEDBACK ================= */}
              {currentView === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        <span>Placement Reviews & Host Facility Ratings</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Share star ratings and feedback regarding your host employer and placement experience.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Write a New Review</span>
                    </button>
                  </div>

                  {myReviews.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <Star className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No reviews submitted yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Help other students by rating your host facility and training environment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myReviews.map((rev) => (
                        <div key={rev._id || rev.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-bold text-sm text-slate-900">{rev.title || 'Placement Review'}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rev.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {rev.status || 'Pending Review'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm italic leading-relaxed">"{rev.comment}"</p>
                          {rev.company && (
                            <p className="text-xs text-slate-400 mt-1">
                              Host Facility: <strong className="text-slate-700">{rev.company}</strong>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Placement Review Modal */}
      <ReviewSubmitModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          if (studentProfile) loadWorkflowData(studentProfile);
        }}
      />
    </div>
  );
}
