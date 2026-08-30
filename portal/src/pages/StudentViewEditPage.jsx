import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2, User, GraduationCap, Building2, Phone, Mail, MapPin, Info, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudentById, updateStudent } from '../api/studentsApi';
import { fetchWorkflows } from '../api/workflowApi';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

export default function StudentViewEditPage() {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';

  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [contactedIndustries, setContactedIndustries] = useState([]);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchStudentById(id);
      const data = response?.data ?? response ?? {};
      setStudent(data);
      // Populate form data from the fetched student
      const fields = [
        'firstName', 'middleName', 'lastName', 'preferredName', 'dateOfBirth', 'gender',
        'nationality', 'language', 'emailAddress', 'phoneCode', 'phoneNumber',
        'altPhoneCode', 'alternatePhone', 'waPhoneCode', 'whatsappNumber',
        'address', 'suburb', 'state', 'postCode', 'country',
        'courseQualification', 'specialisation', 'courseLevel', 'studyMode', 'enrollmentId',
        'institute', 'campus', 'startDate', 'expectedEndDate', 'currentYearSemester',
        'attendanceStatus', 'academicStatus', 'gpa', 'previousQualification', 'yearOfCompletion',
        'assignedRto', 'courses', 'internshipPriority', 'studentSource', 'transport',
        'preferredLocation', 'placementRadius', 'preferredIndustry', 'availabilityDays',
        'availabilityFrom', 'availabilityTo', 'willingToRelocate', 'placementNotes',
        'visaStatus', 'visaSubclass', 'visaExpiryDate', 'workRights', 'workExperience',
        'englishProficiency', 'emergencyContactName', 'emergencyContactPhone', 'heardAboutUs',
        'hasResume', 'additionalNotes', 'placementHours'
      ];
      const populated = {};
      fields.forEach(f => {
        populated[f] = data[f] !== undefined && data[f] !== null ? data[f] : '';
      });
      // Ensure availabilityDays is an object
      if (typeof populated.availabilityDays !== 'object' || populated.availabilityDays === null) {
        populated.availabilityDays = {};
      }
      setFormData(populated);

      // Fetch workflow to get internship requests and contacted industries for this student
      try {
        const wfResult = await fetchWorkflows();
        const workflows = wfResult.data || [];
        const studentContacts = [];
        const studentName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name;
        workflows.forEach(wf => {
          (wf.requests || []).forEach(req => {
            const isMatch =
              req.studentId === id ||
              req.studentId === data.studentId ||
              req.studentId === data.id ||
              req.studentId === data._id ||
              (studentName && req.student === studentName);
            if (isMatch && Array.isArray(req.contactedIndustries)) {
              studentContacts.push(...req.contactedIndustries);
            }
          });
        });
        setContactedIndustries(studentContacts);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };

      // Convert empty strings to undefined so backend defaults apply
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = undefined;
      });

      const dbId = student?.id || student?._id || id;
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
  const phoneNumber = student?.phone || (formData.phoneCode ? `${formData.phoneCode} ${formData.phoneNumber}` : 'Not provided');
  const email = student?.email || formData.emailAddress || 'Not provided';
  const addressLine = [formData.address, formData.suburb, formData.state, formData.postCode].filter(Boolean).join(', ') || 'Not provided';

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
    { key: 'personal', label: 'Personal Information', icon: User },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'rto', label: 'RTO & Source', icon: Building2 },
    { key: 'additional', label: 'Additional', icon: Info },
    { key: 'contacts', label: 'Industry Contacts', icon: Building2 },
    { key: 'placementhours', label: 'Placement Hours', icon: Clock },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition";
  const readOnlyClass = `${inputClass} bg-slate-50/50 cursor-default`;
  const fieldClass = (isEditMode) => isEditMode ? inputClass : readOnlyClass;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        <Header title={isEdit ? `Edit: ${fullName}` : fullName} breadcrumbs={['Dashboard', 'My List', 'My Students', isEdit ? 'Edit' : 'Details']} />

        <main className="flex-1 overflow-y-auto p-4 max-w-[1600px] w-full mx-auto">
          {/* Top action bar */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/my-students" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
              <ArrowLeft size={14} />
              <span>Back to My Students</span>
            </Link>
            {!isEdit && (
              <button
                onClick={() => navigate(`/students/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <Pencil size={14} />
                <span>Edit Student</span>
              </button>
            )}
          </div>

          {/* Student Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
            <div className="flex items-center space-x-4">
              <img
                src={student?.avatar || FALLBACK_AVATAR}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900 truncate">{fullName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    student?.status === 'Active' ? 'bg-emerald-50 text-emerald-600'
                    : student?.status === 'Pending' ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600'
                  }`}>
                    {student?.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{student?.studentId || 'No student ID'}</p>
              </div>
              <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-500 shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone size={13} className="text-slate-400" />
                  <span>{phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{student?.location || formData.suburb || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <User size={16} className="text-blue-600" />
                  <span>Personal Information</span>
                </h3>
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">First Name</label>
                    <input type="text" value={formData.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Middle Name</label>
                    <input type="text" value={formData.middleName || ''} onChange={(e) => updateField('middleName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Last Name</label>
                    <input type="text" value={formData.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preferred Name</label>
                    <input type="text" value={formData.preferredName || ''} onChange={(e) => updateField('preferredName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => updateField('dateOfBirth', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gender</label>
                    <input type="text" value={formData.gender || ''} onChange={(e) => updateField('gender', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nationality</label>
                    <input type="text" value={formData.nationality || ''} onChange={(e) => updateField('nationality', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Language</label>
                    <input type="text" value={formData.language || ''} onChange={(e) => updateField('language', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                    <input type="email" value={formData.emailAddress || ''} onChange={(e) => updateField('emailAddress', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phone</label>
                    <input type="text" value={formData.phoneNumber || ''} onChange={(e) => updateField('phoneNumber', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Alternate Phone</label>
                    <input type="text" value={formData.alternatePhone || ''} onChange={(e) => updateField('alternatePhone', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address</label>
                    <input type="text" value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Suburb</label>
                    <input type="text" value={formData.suburb || ''} onChange={(e) => updateField('suburb', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">State</label>
                    <input type="text" value={formData.state || ''} onChange={(e) => updateField('state', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
              </div>
            )}

            {/* Education */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <GraduationCap size={16} className="text-blue-600" />
                  <span>Education Details</span>
                </h3>
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Course / Qualification</label>
                    {isEdit ? (
                      <select
                        value={formData.courseQualification || ''}
                        onChange={(e) => updateField('courseQualification', e.target.value)}
                        className={fieldClass(isEdit)}
                      >
                        <option value="">Select course / qualification</option>
                        {['Individual Support', 'Early Childhood Education and Care', 'Hospitality Management', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {formData.courseQualification && !['Individual Support', 'Early Childhood Education and Care', 'Hospitality Management', 'Other'].includes(formData.courseQualification) && (
                          <option value={formData.courseQualification}>{formData.courseQualification}</option>
                        )}
                      </select>
                    ) : (
                      <input type="text" value={formData.courseQualification || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Certificate Level</label>
                    {isEdit ? (
                      <select
                        value={formData.courseLevel || ''}
                        onChange={(e) => updateField('courseLevel', e.target.value)}
                        className={fieldClass(isEdit)}
                      >
                        <option value="">Select certificate level</option>
                        {['Other'].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        {formData.courseLevel && !['Other'].includes(formData.courseLevel) && (
                          <option value={formData.courseLevel}>{formData.courseLevel}</option>
                        )}
                      </select>
                    ) : (
                      <input type="text" value={formData.courseLevel || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Specialisation</label>
                    <input type="text" value={formData.specialisation || ''} onChange={(e) => updateField('specialisation', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Study Mode</label>
                    {isEdit ? (
                      <select
                        value={formData.studyMode || ''}
                        onChange={(e) => updateField('studyMode', e.target.value)}
                        className={fieldClass(isEdit)}
                      >
                        <option value="">Select study mode</option>
                        {['Full Time','Part Time','Online','Blended','Flexible'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" value={formData.studyMode || ''} disabled className={fieldClass(false)} />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Institute</label>
                    <input type="text" value={formData.institute || ''} onChange={(e) => updateField('institute', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Campus</label>
                    <input type="text" value={formData.campus || ''} onChange={(e) => updateField('campus', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
                    <input type="date" value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''} onChange={(e) => updateField('startDate', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Expected End Date</label>
                    <input type="date" value={formData.expectedEndDate ? new Date(formData.expectedEndDate).toISOString().split('T')[0] : ''} onChange={(e) => updateField('expectedEndDate', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Current Year / Semester</label>
                    <input type="text" value={formData.currentYearSemester || ''} onChange={(e) => updateField('currentYearSemester', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Attendance Status</label>
                    <input type="text" value={formData.attendanceStatus || ''} onChange={(e) => updateField('attendanceStatus', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Academic Status</label>
                    <input type="text" value={formData.academicStatus || ''} onChange={(e) => updateField('academicStatus', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">GPA</label>
                    <input type="text" value={formData.gpa || ''} onChange={(e) => updateField('gpa', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
              </div>
            )}

            {/* RTO & Source */}
            {activeTab === 'rto' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span>RTO & Placement Preferences</span>
                </h3>
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned RTO</label>
                    <input type="text" value={formData.assignedRto || ''} onChange={(e) => updateField('assignedRto', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Course(s)</label>
                    <input type="text" value={formData.courses || ''} onChange={(e) => updateField('courses', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Internship Priority</label>
                    <input type="text" value={formData.internshipPriority || ''} onChange={(e) => updateField('internshipPriority', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Student Source</label>
                    <input type="text" value={formData.studentSource || ''} onChange={(e) => updateField('studentSource', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Transport</label>
                    <input type="text" value={formData.transport || ''} onChange={(e) => updateField('transport', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preferred Location</label>
                    <input type="text" value={formData.preferredLocation || ''} onChange={(e) => updateField('preferredLocation', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Placement Radius (km)</label>
                    <input type="text" value={formData.placementRadius || ''} onChange={(e) => updateField('placementRadius', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preferred Industry</label>
                    <input type="text" value={formData.preferredIndustry || ''} onChange={(e) => updateField('preferredIndustry', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Availability From</label>
                    <input type="text" value={formData.availabilityFrom || ''} onChange={(e) => updateField('availabilityFrom', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Availability To</label>
                    <input type="text" value={formData.availabilityTo || ''} onChange={(e) => updateField('availabilityTo', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Willing to Relocate</label>
                    <input type="text" value={formData.willingToRelocate || ''} onChange={(e) => updateField('willingToRelocate', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
              </div>
            )}

            {/* Additional */}
            {activeTab === 'additional' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Info size={16} className="text-blue-600" />
                  <span>Additional Information</span>
                </h3>
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Visa Status</label>
                    <input type="text" value={formData.visaStatus || ''} onChange={(e) => updateField('visaStatus', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Visa Subclass</label>
                    <input type="text" value={formData.visaSubclass || ''} onChange={(e) => updateField('visaSubclass', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Work Rights</label>
                    <input type="text" value={formData.workRights || ''} onChange={(e) => updateField('workRights', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">English Proficiency</label>
                    <input type="text" value={formData.englishProficiency || ''} onChange={(e) => updateField('englishProficiency', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Work Experience</label>
                    <input type="text" value={formData.workExperience || ''} onChange={(e) => updateField('workExperience', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Emergency Contact</label>
                    <input type="text" value={formData.emergencyContactName || ''} onChange={(e) => updateField('emergencyContactName', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Emergency Phone</label>
                    <input type="text" value={formData.emergencyContactPhone || ''} onChange={(e) => updateField('emergencyContactPhone', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Has Resume</label>
                    <input type="text" value={formData.hasResume || ''} onChange={(e) => updateField('hasResume', e.target.value)} disabled={!isEdit} className={fieldClass(isEdit)} />
                  </div>
                </div>
              </div>
            )}

            {/* Industry Contacts */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span>Contacted Industries / Placement History</span>
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
                            rec.response?.toLowerCase().includes('approved') || rec.response?.toLowerCase().includes('positive')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.response?.toLowerCase().includes('reject') || rec.response?.toLowerCase().includes('declined')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {rec.response || 'In Discussion'}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-600">
                          {rec.email && <p className="flex items-center space-x-1.5"><Mail size={12} className="text-slate-400" /><span>{rec.email}</span></p>}
                          {rec.address && <p className="flex items-center space-x-1.5"><MapPin size={12} className="text-slate-400" /><span>{rec.address}</span></p>}
                          {rec.industryType && <p className="flex items-center space-x-1.5"><Building2 size={12} className="text-slate-400" /><span>{rec.industryType}</span></p>}
                        </div>

                        {rec.notes && (
                          <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                            <p className="text-slate-700">
                              <span className="font-semibold text-slate-900">Notes/Discussion: </span>
                              {rec.notes}
                            </p>
                          </div>
                        )}
                        {rec.date && (
                          <p className="text-[10px] text-slate-400">Contacted date: {rec.date}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Placement Hours */}
            {activeTab === 'placementhours' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Clock size={16} className="text-blue-600" />
                  <span>Placement Hours</span>
                </h3>
                <div className="max-w-xs">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Total Placement Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 120"
                    value={formData.placementHours ?? ''}
                    onChange={(e) =>
                      updateField('placementHours', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    disabled={!isEdit}
                    className={fieldClass(isEdit)}
                  />
                  <p className="mt-2 text-[11px] text-slate-400">
                    Enter the number of placement hours completed (e.g. 120, 160, 180, 200, 300).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEdit && (
            <div className="mt-6 flex items-center justify-end space-x-3">
              <Link
                to="/my-students"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
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
