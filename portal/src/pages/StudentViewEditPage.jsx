import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Pencil, Loader2, User, GraduationCap, Building2,
  Phone, Mail, MapPin, Info, AlertTriangle, Clock, FileText,
  Upload, CheckCircle2, X, ShieldCheck, ChevronDown, Plus, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudentById, updateStudent } from '../api/studentsApi';
import { fetchWorkflows, fetchWorkflowById } from '../api/workflowApi';
import { calculatePlacementEndDate } from '../utils/dateCalculation';
import { fetchRtos } from '../api/rtoApi';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

const australianStates = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const courseLevels = [
  'Certificate III', 'Certificate IV', 'Diploma', 'Advanced Diploma',
  'Bachelor', 'Graduate Certificate', 'Graduate Diploma', 'Master', 'Other',
];

const courses = [
  'Individual Support', 'Early Childhood Education and Care', 'Hospitality Management',
  'Community Services', 'Allied Health System', 'Construction', 'Other',
];

const visaStatuses = [
  'Student Visa (500)', 'Visitor Visa', 'Working Holiday Visa', 'Permanent Resident',
  'Citizen', 'Temporary Graduate (485)', 'Partner Visa', 'Bridging Visa', 'Other',
];

const timeSlots = [
  '06:00 AM','06:30 AM','07:00 AM','07:30 AM','08:00 AM','08:30 AM',
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM',
  '03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM',
  '06:00 PM','06:30 PM','07:00 PM','07:30 PM','08:00 PM','08:30 PM',
  '09:00 PM','09:30 PM','10:00 PM','10:30 PM','11:00 PM','11:30 PM',
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const studentSources = ['Walk-in', 'Social Media', 'Other'];

const STRUCTURED_DOCS = [
  { field: 'policeCheckDoc',      label: 'Police Check Document',          hint: 'National Police Certificate (Most preferred for placement)',        badge: 'Most Preferable', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', highlight: true },
  { field: 'covidCheckDoc',       label: 'COVID-19 Check Document',        hint: 'Vaccination Certificate / Test Report (PDF/JPG/PNG)',               badge: 'Optional',        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  { field: 'ndisDoc',             label: 'NDIS',                           hint: 'NDIS Screening Check' },
  { field: 'resumeDoc',           label: 'CB / Resume',                    hint: 'Current resume or CV' },
  { field: 'wwccDoc',             label: 'WWCC',                           hint: 'Working With Children Check' },
  { field: 'passportDoc',         label: 'Passport',                       hint: 'Valid passport copy' },
  { field: 'drivingLicenceDoc',   label: 'Driving Licence',                hint: 'Current driving licence' },
  { field: 'infectionControlDoc', label: 'Infection Control Certificate',  hint: 'Infection control training certificate' },
  { field: 'handHygieneDoc',      label: 'Hand Hygiene',                   hint: 'Hand hygiene training certificate' },
  { field: 'cbrDoc',              label: 'CPR',                            hint: 'Cardiopulmonary Resuscitation (CPR) Certificate' },
];

export default function StudentViewEditPage() {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  const authUser = useSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === 'Administrator';

  const [student, setStudent]                     = useState(null);
  const [formData, setFormData]                   = useState({});
  const [loading, setLoading]                     = useState(true);
  const [saving, setSaving]                       = useState(false);
  const [loadError, setLoadError]                 = useState(null);
  const [activeTab, setActiveTab]                 = useState('personal');
  const [contactedIndustries, setContactedIndustries] = useState([]);
  const [internshipEndingInfo, setInternshipEndingInfo] = useState(null);
  const [activeRtos, setActiveRtos]               = useState([]);
  const [isManualId, setIsManualId]               = useState(false);
  const [isOtherSource, setIsOtherSource]         = useState(false);
  const [selectedDays, setSelectedDays]           = useState({});

  // Fetch RTO list for College/RTO dropdown
  useEffect(() => {
    fetchRtos()
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const names = list.map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
        setActiveRtos(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});
  }, []);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchStudentById(id);
      const data = response?.data ?? response ?? {};
      setStudent(data);

      const fields = [
        // Step 1 — Personal
        'firstName', 'middleName', 'lastName', 'preferredName', 'gender',
        'dateOfBirth', 'nationality', 'language',
        'emailAddress', 'phoneCode', 'phoneNumber',
        'altPhoneCode', 'alternatePhone',
        'waPhoneCode', 'whatsappNumber',
        'address', 'suburb', 'state', 'postCode', 'country',
        // Step 2 — Education
        'courseQualification', 'courseLevel', 'placementHours',
        'studentId', 'institute', 'assignedRto',
        'currentYearSemester', 'campus',
        // Documents
        'policeCheckDoc', 'covidCheckDoc', 'ndisDoc', 'resumeDoc', 'wwccDoc',
        'passportDoc', 'drivingLicenceDoc', 'infectionControlDoc', 'handHygieneDoc', 'cbrDoc',
        'additionalDocuments',
        // Step 3 — Additional Info
        'preferredIndustry', 'placementSite',
        'transport', 'licenceNumber', 'preferredLocation', 'placementRadius',
        'visaStatus',
        'availabilityDays', 'availabilityFrom', 'availabilityTo',
        'willingToRelocate', 'placementNotes',
      ];

      const populated = {};
      fields.forEach(f => {
        populated[f] = data[f] !== undefined && data[f] !== null ? data[f] : '';
      });

      // Defaults
      if (!populated.availabilityFrom) populated.availabilityFrom = '09:00 AM';
      if (!populated.availabilityTo)   populated.availabilityTo   = '05:00 PM';
      if (!populated.country)          populated.country          = 'Australia';
      if (typeof populated.availabilityDays !== 'object' || populated.availabilityDays === null) {
        populated.availabilityDays = {};
      }
      if (!Array.isArray(populated.placementSite))     populated.placementSite     = [];
      if (!Array.isArray(populated.additionalDocuments)) populated.additionalDocuments = [];

      setFormData(populated);
      setSelectedDays(populated.availabilityDays || {});
      setIsManualId(Boolean(populated.studentId));
      setIsOtherSource(
        Boolean(populated.studentSource &&
          populated.studentSource !== 'Walk-in' &&
          populated.studentSource !== 'Social Media')
      );

      // Load contacted industries + internship ending info from workflow
      try {
        const wfResult = await fetchWorkflows();
        const workflows = wfResult.data || [];
        const studentContacts = [];
        const studentName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name;
        const dbId = data.id || data._id;
        const bizId = data.studentId;

        let fullAppointments = [];
        if (workflows.length > 0) {
          const wfId = workflows[0].id || workflows[0]._id;
          try {
            const detailed = await fetchWorkflowById(wfId);
            fullAppointments = detailed?.data?.appointments || [];
          } catch (_) {}
        }

        workflows.forEach(wf => {
          (wf.requests || []).forEach(req => {
            const isMatch =
              req.studentId === id || req.studentId === bizId || req.studentId === dbId ||
              (studentName && req.student === studentName);
            if (isMatch && Array.isArray(req.contactedIndustries)) {
              studentContacts.push(...req.contactedIndustries);
            }
          });
        });
        setContactedIndustries(studentContacts);

        const norm = v => String(v || '').trim().toLowerCase();
        const studentAppts = fullAppointments.filter(appt =>
          (appt.studentId && (appt.studentId === id || appt.studentId === bizId || appt.studentId === dbId)) ||
          (appt.student && studentName && norm(appt.student) === norm(studentName))
        );

        // Prefer an appointment that has actually started placement (Confirmed + successful outcome)
        // Fall back to any active/scheduled appointment
        const activeAppt =
          studentAppts.find(a => a.status === 'Confirmed' && a.appointmentOutcome === 'successful') ||
          studentAppts.find(a => a.status === 'Confirmed') ||
          studentAppts.find(a => a.status === 'Scheduled' || a.status === 'Active') ||
          studentAppts[0];

        // Use the actual stored expectedCompletionDate — never estimate from appointment date
        const endDateStr = activeAppt?.expectedCompletionDate || activeAppt?.commencementDate
          ? (() => {
              // If only commencementDate is available, calculate from student hours + availability
              if (!activeAppt.expectedCompletionDate && activeAppt.commencementDate) {
                return calculatePlacementEndDate(
                  activeAppt.commencementDate,
                  data.placementHours,
                  data.availabilityDays,
                  data.availabilityFrom,
                  data.availabilityTo
                );
              }
              return activeAppt.expectedCompletionDate;
            })()
          : null;

        if (endDateStr) {
          // Parse as local noon to avoid UTC boundary flipping the day
          const parts = String(endDateStr).split('T')[0].split('-').map(Number);
          const endDate = parts.length === 3
            ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
            : new Date(endDateStr);

          const diffMs = endDate.getTime() - Date.now();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            setInternshipEndingInfo({ type: 'ended', label: 'Ended', company: activeAppt.company });
          } else if (diffDays <= 49) {
            const weeksLeft = Math.ceil(diffDays / 7);
            const label = diffDays <= 7
              ? `${diffDays} day${diffDays === 1 ? '' : 's'}`
              : `${weeksLeft} week${weeksLeft === 1 ? '' : 's'}`;
            setInternshipEndingInfo({ type: 'ending_soon', diffDays, weeksLeft, label, company: activeAppt.company });
          } else {
            setInternshipEndingInfo(null);
          }
        } else {
          setInternshipEndingInfo(null);
        }
      } catch (wfErr) {
        console.error('Could not load workflow data:', wfErr);
      }

    } catch (err) {
      console.error('Could not load student:', err);
      setLoadError(err?.response?.data?.message || 'Could not load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadStudent(); }, [loadStudent]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day) => {
    const newDays = { ...selectedDays, [day]: !selectedDays[day] };
    setSelectedDays(newDays);
    updateField('availabilityDays', newDays);
  };

  const handleAddCustomDoc = () => {
    const current = Array.isArray(formData.additionalDocuments) ? formData.additionalDocuments : [];
    updateField('additionalDocuments', [...current, { title: '', file: null }]);
  };
  const handleUpdateCustomDocTitle = (index, title) => {
    const updated = [...(formData.additionalDocuments || [])];
    updated[index] = { ...updated[index], title };
    updateField('additionalDocuments', updated);
  };
  const handleUpdateCustomDocFile = (index, file) => {
    const updated = [...(formData.additionalDocuments || [])];
    updated[index] = { ...updated[index], file };
    updateField('additionalDocuments', updated);
  };
  const handleRemoveCustomDoc = (index) => {
    updateField('additionalDocuments', (formData.additionalDocuments || []).filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };
      Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = undefined; });
      const dbId = student?.id || student?._id || id;
      const docFields = ['policeCheckDoc','covidCheckDoc','ndisDoc','resumeDoc','wwccDoc','passportDoc','drivingLicenceDoc','infectionControlDoc','handHygieneDoc','cbrDoc'];
      docFields.forEach(f => { if (payload[f] instanceof File) payload[f] = payload[f].name; });
      if (Array.isArray(payload.additionalDocuments)) {
        payload.additionalDocuments = payload.additionalDocuments.map(item => ({
          title: item.title || '',
          file: item.file instanceof File ? item.file.name : item.file || '',
        }));
      }
      const response = await updateStudent(dbId, payload);
      toast.success(response?.message || 'Student updated successfully!');
      navigate('/my-students');
    } catch (err) {
      console.error('Could not update student:', err);
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        backendErrors.forEach(be => toast.error(`${be.field}: ${be.message}`));
      } else {
        toast.error(err?.response?.data?.message || 'Could not update the student. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const fullName = student?.name || [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ') || 'N/A';
  const phoneDisplay = student?.phone || (formData.phoneCode ? `${formData.phoneCode} ${formData.phoneNumber}` : formData.phoneNumber || 'Not provided');
  const emailDisplay = student?.email || formData.emailAddress || 'Not provided';

  const inputClass     = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition";
  const readOnlyClass  = `${inputClass} bg-slate-50/50 cursor-default`;
  const selectCls      = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs appearance-none focus:outline-none focus:border-blue-600 transition text-slate-800";
  const fieldClass     = (edit) => edit ? inputClass : readOnlyClass;

  const isOtherCollege = (formData.institute || formData.assignedRto) === 'Other';

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
        <Sidebar />
        <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
          <Header title={isEdit ? 'Edit Student' : 'Student Details'} breadcrumbs={['Dashboard', 'My List', 'My Students', isEdit ? 'Edit' : 'Details']} />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Loading student...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
        <Sidebar />
        <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
          <Header title="Error" breadcrumbs={['Dashboard', 'My Students']} />
          <main className="flex-1 overflow-hidden p-4 max-w-[1600px] w-full mx-auto">
            <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Unable to Load Student</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-md">{loadError}</p>
              <Link to="/my-students" className="px-5 py-2.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition">
                Back to My Students
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'personal',   label: 'Personal Information', icon: User },
    { key: 'education',  label: 'Education',            icon: GraduationCap },
    { key: 'additional', label: 'Additional',           icon: Info },
    { key: 'contacts',   label: 'Industry Contacts',    icon: Building2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        <Header title={isEdit ? `Edit: ${fullName}` : fullName} breadcrumbs={['Dashboard', 'My List', 'My Students', isEdit ? 'Edit' : 'Details']} />

        <main className="flex-1 overflow-y-auto p-4 max-w-[1600px] w-full mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/my-students" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
              <ArrowLeft size={14} /><span>Back to My Students</span>
            </Link>
            {!isEdit && (
              <button onClick={() => navigate(`/students/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center space-x-2">
                <Pencil size={14} /><span>Edit Student</span>
              </button>
            )}
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
            <div className="flex items-center space-x-4">
              <img src={student?.avatar || FALLBACK_AVATAR} alt={fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900 truncate">{fullName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    student?.status === 'Active' ? 'bg-emerald-50 text-emerald-600'
                    : student?.status === 'Pending' ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600'}`}>
                    {student?.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{student?.studentId || 'No student ID'}</p>
              </div>
              <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-500 shrink-0">
                <div className="flex items-center space-x-1.5"><Mail size={13} className="text-slate-400" /><span>{emailDisplay}</span></div>
                <div className="flex items-center space-x-1.5"><Phone size={13} className="text-slate-400" /><span>{phoneDisplay}</span></div>
                <div className="flex items-center space-x-1.5"><MapPin size={13} className="text-slate-400" /><span>{formData.suburb || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          {/* Placement ending banner */}
          {internshipEndingInfo && (
            <div className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-4 ${
              internshipEndingInfo.type === 'ended'
                ? 'bg-rose-50/90 border-rose-300'
                : 'bg-amber-50/90 border-amber-300'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  internshipEndingInfo.type === 'ended' ? 'bg-rose-100' : 'bg-amber-100'
                }`}>
                  <Clock className={`w-5 h-5 ${internshipEndingInfo.type === 'ended' ? 'text-rose-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${internshipEndingInfo.type === 'ended' ? 'text-rose-950' : 'text-amber-950'}`}>
                    {internshipEndingInfo.type === 'ended'
                      ? 'Placement Period Ended'
                      : `Placement Ending Soon — ${internshipEndingInfo.label} left`}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${internshipEndingInfo.type === 'ended' ? 'text-rose-800' : 'text-amber-800'}`}>
                    {internshipEndingInfo.type === 'ended'
                      ? 'The scheduled placement period has concluded. Please confirm final hours and logbook submission.'
                      : 'Verify student hours, logbooks, and completion assessments before the end date.'}
                    {internshipEndingInfo.company ? ` • Placed at ${internshipEndingInfo.company}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {internshipEndingInfo.type !== 'ended' && (
                  <span className="px-3 py-1.5 bg-amber-200/90 text-amber-900 rounded-xl text-xs font-bold">⏳ {internshipEndingInfo.label} left</span>
                )}
                <Link to="/workflow?step=4" className={`px-3 py-1.5 text-white rounded-xl text-xs font-bold transition ${
                  internshipEndingInfo.type === 'ended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}>
                  View in Placements
                </Link>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 w-fit">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon size={13} /><span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

            {/* ── PERSONAL INFORMATION (matches Step 1) ── */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <User size={16} className="text-blue-600" /><span>Personal Information</span>
                </h3>

                {/* Row 1: First Name, Middle Name, Last Name, Preferred Name */}
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">First Name <span className="text-rose-500">*</span></label>
                    <input type="text" value={formData.firstName || ''} onChange={e => updateField('firstName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter first name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Middle Name</label>
                    <input type="text" value={formData.middleName || ''} onChange={e => updateField('middleName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter middle name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Last Name <span className="text-rose-500">*</span></label>
                    <input type="text" value={formData.lastName || ''} onChange={e => updateField('lastName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter last name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preferred Name</label>
                    <input type="text" value={formData.preferredName || ''} onChange={e => updateField('preferredName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter preferred name" />
                  </div>
                </div>

                {/* Row 1b: Gender, DOB, Nationality, Language */}
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gender</label>
                    {isEdit ? (
                      <div className="flex items-center space-x-4 pt-2">
                        {['Male', 'Female', 'Other'].map(option => (
                          <label key={option} className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium text-slate-700">
                            <input type="radio" name="gender" checked={formData.gender === option} onChange={() => updateField('gender', option)} className="text-blue-600 h-3.5 w-3.5" />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input type="text" value={formData.gender || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type={isEdit ? 'date' : 'text'}
                      value={
                        isEdit
                          ? (formData.dateOfBirth ? String(formData.dateOfBirth).split('T')[0] : '')
                          : (formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '')
                      }
                      onChange={e => updateField('dateOfBirth', e.target.value)}
                      disabled={!isEdit}
                      className={fieldClass(isEdit)}
                      placeholder="Date of birth"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nationality</label>
                    <input type="text" value={formData.nationality || ''} onChange={e => updateField('nationality', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="e.g. Australian" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Language</label>
                    <input type="text" value={formData.language || ''} onChange={e => updateField('language', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="e.g. English" />
                  </div>
                </div>

                {/* Row 2: Email, Phone, WhatsApp, Alternate Phone */}
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email Address <span className="text-rose-500">*</span></label>
                    <input type="email" value={formData.emailAddress || ''} onChange={e => updateField('emailAddress', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter email address" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phone Number <span className="text-rose-500">*</span></label>
                    {isEdit ? (
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition">
                        <div className="flex items-center space-x-1 px-2.5 bg-slate-50/50 border-r border-slate-200 text-xs text-slate-700">
                          <span>🇦🇺</span><ChevronDown size={12} className="text-slate-400" />
                        </div>
                        <input type="text" value={formData.phoneCode || '+61'} onChange={e => updateField('phoneCode', e.target.value)}
                          className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center" />
                        <input type="text" placeholder="412 345 678" value={formData.phoneNumber || ''} onChange={e => updateField('phoneNumber', e.target.value)}
                          className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.phoneNumber || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">WhatsApp Number</label>
                    {isEdit ? (
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition">
                        <div className="flex items-center space-x-1 px-2.5 bg-slate-50/50 border-r border-slate-200 text-xs text-slate-700">
                          <span>🇦🇺</span><ChevronDown size={12} className="text-slate-400" />
                        </div>
                        <input type="text" value={formData.waPhoneCode || '+61'} onChange={e => updateField('waPhoneCode', e.target.value)}
                          className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center" />
                        <input type="text" placeholder="412 345 678" value={formData.whatsappNumber || ''} onChange={e => updateField('whatsappNumber', e.target.value)}
                          className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.whatsappNumber || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Alternate Phone</label>
                    {isEdit ? (
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition">
                        <input type="text" value={formData.altPhoneCode || '+61'} onChange={e => updateField('altPhoneCode', e.target.value)}
                          className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center border-r border-slate-200" />
                        <input type="text" placeholder="Optional" value={formData.alternatePhone || ''} onChange={e => updateField('alternatePhone', e.target.value)}
                          className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.alternatePhone || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                </div>

                {/* Row 3: Address full width */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address <span className="text-rose-500">*</span></label>
                  <input type="text" value={formData.address || ''} onChange={e => updateField('address', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter street address" />
                </div>

                {/* Row 4: Suburb, State, Post Code, Country */}
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Suburb <span className="text-rose-500">*</span></label>
                    <input type="text" value={formData.suburb || ''} onChange={e => updateField('suburb', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter suburb" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">State <span className="text-rose-500">*</span></label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.state || ''} onChange={e => updateField('state', e.target.value)} className={selectCls}>
                          <option value="">Select state</option>
                          {australianStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.state || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Post Code <span className="text-rose-500">*</span></label>
                    <input type="text" value={formData.postCode || ''} onChange={e => updateField('postCode', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="Enter post code" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Country <span className="text-rose-500">*</span></label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.country || 'Australia'} onChange={e => updateField('country', e.target.value)} className={selectCls}>
                          <option value="Australia">Australia</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.country || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── EDUCATION (matches Step 2) ── */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <GraduationCap size={16} className="text-blue-600" /><span>Education Details</span>
                </h3>

                {/* Row 1: Course, Certificate Level, Placement Hours */}
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Course / Qualification <span className="text-rose-500">*</span></label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.courseQualification || ''} onChange={e => updateField('courseQualification', e.target.value)} className={selectCls}>
                          <option value="">Select course / qualification</option>
                          {courses.map(c => <option key={c} value={c}>{c}</option>)}
                          {formData.courseQualification && !courses.includes(formData.courseQualification) && (
                            <option value={formData.courseQualification}>{formData.courseQualification}</option>
                          )}
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.courseQualification || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Certificate Level <span className="text-rose-500">*</span></label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.courseLevel || ''} onChange={e => updateField('courseLevel', e.target.value)} className={selectCls}>
                          <option value="">Select certificate level</option>
                          {courseLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.courseLevel || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Placement Hours</label>
                    <input type="number" min="0" placeholder="e.g. 120"
                      value={formData.placementHours ?? ''}
                      onChange={e => updateField('placementHours', e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>

                {/* Row 2: Student ID, Campus, Current Year/Semester */}
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-500">Student ID</label>
                      {isEdit && (
                        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                          <button type="button"
                            onClick={() => { setIsManualId(false); updateField('studentId', ''); }}
                            className={`px-2 py-0.5 rounded-md transition ${!isManualId ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                            Auto
                          </button>
                          <button type="button"
                            onClick={() => setIsManualId(true)}
                            className={`px-2 py-0.5 rounded-md transition ${isManualId ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                            Manual
                          </button>
                        </div>
                      )}
                    </div>
                    {isEdit && !isManualId ? (
                      <input type="text" value={formData.studentId || 'Auto-generated on Save'} disabled
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium cursor-not-allowed italic" />
                    ) : (
                      <input type="text" placeholder="Enter Student ID (e.g. STU11)"
                        value={formData.studentId || ''}
                        onChange={e => updateField('studentId', e.target.value)}
                        disabled={!isEdit} className={fieldClass(isEdit)} />
                    )}
                    {isEdit && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isManualId ? 'Manual ID set — system will not auto-generate' : 'Auto mode active — sequential ID generated automatically'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Campus</label>
                    <input type="text" value={formData.campus || ''} onChange={e => updateField('campus', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="e.g. Melbourne CBD" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Current Year / Semester</label>
                    <input type="text" value={formData.currentYearSemester || ''} onChange={e => updateField('currentYearSemester', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} placeholder="e.g. Year 2 / Semester 1" />
                  </div>
                </div>

                {/* Documents section — matches EducationDetailsForm exactly */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Documents</h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">All Optional</span>
                  </div>
                  <p className="text-[11px] text-slate-400 -mt-2">
                    Upload any relevant compliance, identity, or certification documents. All fields are optional.
                  </p>

                  {/* Progress */}
                  {(() => {
                    const uploaded = STRUCTURED_DOCS.filter(d => Boolean(formData[d.field])).length;
                    const missing  = STRUCTURED_DOCS.length - uploaded;
                    return (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">{uploaded} Uploaded</span>
                        {missing > 0 && <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">{missing} Not Uploaded</span>}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4">
                    {STRUCTURED_DOCS.map(({ field, label, hint, badge, badgeClass, highlight }) => {
                      const fileName = formData[field] || null;
                      const hasFile  = Boolean(fileName);
                      return (
                        <div key={field}>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700">{label}</label>
                            <div className="flex items-center space-x-1.5">
                              {badge && !hasFile && (
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeClass}`}>{badge}</span>
                              )}
                              {hasFile && (
                                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <CheckCircle2 size={10} /><span>Uploaded</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <label className={`w-full px-3.5 py-2.5 bg-white border border-dashed rounded-xl flex items-center space-x-2 transition ${
                            isEdit ? 'cursor-pointer' : 'cursor-default'
                          } ${hasFile ? 'border-emerald-300 hover:border-emerald-500' : highlight ? 'border-amber-300 hover:border-amber-500' : 'border-slate-300 hover:border-blue-600'}`}>
                            {hasFile
                              ? <FileText size={15} className="text-emerald-600 shrink-0" />
                              : highlight
                              ? <Upload size={15} className="text-amber-600 shrink-0" />
                              : <Upload size={15} className="text-blue-600 shrink-0" />}
                            <span className={`text-xs font-semibold truncate ${hasFile ? 'text-emerald-700' : highlight ? 'text-amber-700' : 'text-blue-600'}`}>
                              {hasFile ? (typeof fileName === 'string' ? fileName : fileName.name) : `Upload ${label}`}
                            </span>
                            {hasFile && isEdit && (
                              <button type="button" onClick={e => { e.preventDefault(); updateField(field, null); }}
                                className="ml-auto text-slate-400 hover:text-rose-500 transition shrink-0">
                                <X size={13} />
                              </button>
                            )}
                            {isEdit && (
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={e => updateField(field, e.target.files[0] || null)} />
                            )}
                          </label>
                          <p className={`text-[10px] mt-1 ${highlight ? 'text-amber-700/90 font-medium' : 'text-slate-400'}`}>{hint}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom documents */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Additional Custom Documents</h5>
                        <p className="text-[10px] text-slate-400">Add any extra documents with a custom title (e.g. First Aid, Flu Vaccine).</p>
                      </div>
                      {isEdit && (
                        <button type="button" onClick={handleAddCustomDoc}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer">
                          <Plus size={14} /><span>Add Custom Document</span>
                        </button>
                      )}
                    </div>
                    {Array.isArray(formData.additionalDocuments) && formData.additionalDocuments.length > 0 && (
                      <div className="space-y-2.5">
                        {formData.additionalDocuments.map((docItem, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                            <div className="flex-1">
                              <input type="text" placeholder="Document Title (e.g. NDIS Check, First Aid Certificate)"
                                value={docItem.title || ''}
                                onChange={e => handleUpdateCustomDocTitle(idx, e.target.value)}
                                disabled={!isEdit} className={fieldClass(isEdit)} />
                            </div>
                            <div className="flex-1">
                              <label className={`w-full px-3.5 py-2 bg-white border border-dashed border-slate-300 rounded-xl flex items-center space-x-2 ${isEdit ? 'cursor-pointer hover:border-blue-600' : 'cursor-default'} transition`}>
                                <Upload size={14} className="text-blue-600 shrink-0" />
                                <span className="text-xs font-semibold text-blue-600 truncate">
                                  {docItem.file ? (docItem.file.name || docItem.file) : 'Upload File'}
                                </span>
                                {isEdit && <input type="file" className="hidden" onChange={e => handleUpdateCustomDocFile(idx, e.target.files[0])} />}
                              </label>
                            </div>
                            {isEdit && (
                              <button type="button" onClick={() => handleRemoveCustomDoc(idx)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ADDITIONAL INFORMATION (matches Step 3 / RtoSourceForm) ── */}
            {activeTab === 'additional' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Info size={16} className="text-blue-600" /><span>Additional Information</span>
                </h3>

                {/* Preferred Industry + Placement Site */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preferred Industry</label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.preferredIndustry || ''}
                          onChange={e => { updateField('preferredIndustry', e.target.value); updateField('placementSite', []); }}
                          className={selectCls}>
                          <option value="">Select industry</option>
                          <option value="Individual Support">Individual Support</option>
                          <option value="ECEC">ECEC</option>
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.preferredIndustry || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  {formData.preferredIndustry && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Placement Sites</label>
                      <input type="text" readOnly
                        value={Array.isArray(formData.placementSite) && formData.placementSite.length > 0
                          ? formData.placementSite.join(', ')
                          : ''}
                        placeholder="No placement sites selected"
                        className={fieldClass(false)} />
                      <p className="text-[10px] text-slate-400 mt-1">Manage placement sites via Add Student flow</p>
                    </div>
                  )}
                </div>

                {/* Transport / Licence / Preferred Location / Visa Status */}
                <div className={`grid ${formData.transport === 'Yes' ? 'grid-cols-4' : 'grid-cols-3'} gap-5 items-end`}>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Driver's Licence / Transport?</label>
                    {isEdit ? (
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white h-[38px]">
                        <button type="button" onClick={() => updateField('transport', 'Yes')}
                          className={`flex-1 flex items-center justify-center text-xs font-semibold transition ${formData.transport === 'Yes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50 border-r border-slate-200'}`}>Yes</button>
                        <button type="button" onClick={() => { updateField('transport', 'No'); updateField('licenceNumber', ''); }}
                          className={`flex-1 flex items-center justify-center text-xs font-semibold transition ${formData.transport === 'No' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>No</button>
                      </div>
                    ) : (
                      <input type="text" value={formData.transport || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  {formData.transport === 'Yes' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Licence Number <span className="text-rose-500">*</span></label>
                      <input type="text" placeholder="Enter driver licence number"
                        value={formData.licenceNumber || ''}
                        onChange={e => updateField('licenceNumber', e.target.value)}
                        disabled={!isEdit} className={fieldClass(isEdit)} />
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Preferred Placement Location
                      <span className="ml-1 text-[10px] text-blue-500 font-normal">(auto-filled)</span>
                    </label>
                    <div className="relative">
                      <input type="text" placeholder="Suburb, city or postcode"
                        value={formData.preferredLocation || ''}
                        onChange={e => updateField('preferredLocation', e.target.value)}
                        disabled={!isEdit} className={`${fieldClass(isEdit)} pr-9`} />
                      <MapPin size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Visa Status (optional)</label>
                    {isEdit ? (
                      <div className="relative">
                        <select value={formData.visaStatus || ''} onChange={e => updateField('visaStatus', e.target.value)} className={selectCls}>
                          <option value="">Select visa status</option>
                          {visaStatuses.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input type="text" value={formData.visaStatus || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                </div>

                {/* Availability Days + Hours + Willing to Relocate */}
                <div className="grid grid-cols-12 gap-5 items-start">
                  <div className="col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Availability - Days (optional)</label>
                    <div className="flex space-x-2">
                      {daysOfWeek.map(day => {
                        const active = !!(selectedDays[day]);
                        return (
                          <button key={day} type="button"
                            onClick={() => isEdit && toggleDay(day)}
                            className={`flex-1 py-2 px-1 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                              active ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
                            } ${isEdit ? 'hover:border-slate-300 cursor-pointer' : 'cursor-default'}`}>
                            <span className="text-[11px] font-bold">{day}</span>
                            <input type="checkbox" checked={active} onChange={() => {}} className="w-3 h-3 accent-white pointer-events-none" />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Select the days the student is available</p>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Availability - Hours (optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['availabilityFrom', 'availabilityTo'].map(field => (
                        <div key={field} className="relative">
                          <Clock size={14} className="absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none" />
                          {isEdit ? (
                            <>
                              <select value={formData[field] || ''} onChange={e => updateField(field, e.target.value)}
                                className={`${selectCls} pl-9 pr-7`}>
                                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <ChevronDown size={12} className="absolute inset-y-0 right-2.5 my-auto text-slate-400 pointer-events-none" />
                            </>
                          ) : (
                            <input type="text" value={formData[field] || ''} disabled className={`${fieldClass(false)} pl-9`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Daily availability time</p>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Willing to Relocate</label>
                    {isEdit ? (
                      <div className="flex items-center space-x-6 pt-2">
                        {['Yes', 'No'].map(opt => (
                          <label key={opt} className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input type="radio" name="relocate" checked={formData.willingToRelocate === opt}
                              onChange={() => updateField('willingToRelocate', opt)} className="text-blue-600 h-4 w-4" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input type="text" value={formData.willingToRelocate || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                </div>

                {/* Placement Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Placement Notes (optional)</label>
                  <div className="relative">
                    <textarea rows={4} maxLength={500}
                      placeholder="Enter any preferences, notes or additional information that may help in placement"
                      value={formData.placementNotes || ''}
                      onChange={e => updateField('placementNotes', e.target.value)}
                      disabled={!isEdit}
                      className={`w-full p-3.5 border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition resize-none ${isEdit ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-slate-200 cursor-default'}`} />
                    <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium">
                      {(formData.placementNotes || '').length} / 500
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── INDUSTRY CONTACTS (read-only) ── */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Building2 size={16} className="text-blue-600" /><span>Contacted Industries / Placement History</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                    Total Contacted: {contactedIndustries.length}
                  </span>
                </div>

                {contactedIndustries.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No industries contacted yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Industries added under Workflow Step 2 (Internship Requests) will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactedIndustries.map((rec, index) => (
                      <div key={rec.id || index} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{rec.organizationName}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {rec.contactPerson} {rec.phone ? `(${rec.phone})` : ''}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            rec.response?.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.response?.toLowerCase().includes('reject') || rec.response?.toLowerCase().includes('declined') ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {rec.response || 'In Discussion'}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600">
                          {rec.email   && <p className="flex items-center space-x-1.5"><Mail size={12} className="text-slate-400" /><span>{rec.email}</span></p>}
                          {rec.address && <p className="flex items-center space-x-1.5"><MapPin size={12} className="text-slate-400" /><span>{rec.address}</span></p>}
                          {rec.industryType && <p className="flex items-center space-x-1.5"><Building2 size={12} className="text-slate-400" /><span>{rec.industryType}</span></p>}
                        </div>
                        {rec.notes && (
                          <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                            <p className="text-slate-700"><span className="font-semibold text-slate-900">Notes: </span>{rec.notes}</p>
                          </div>
                        )}
                        {rec.date && <p className="text-[10px] text-slate-400">Contacted: {rec.date}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Save / Cancel */}
          {isEdit && (
            <div className="mt-6 flex items-center justify-end space-x-3">
              <Link to="/my-students"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                Cancel
              </Link>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
