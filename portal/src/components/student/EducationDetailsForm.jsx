import { useState, useEffect } from 'react';
import {
  GraduationCap, Calendar, ChevronDown, Upload, Info
} from 'lucide-react';
import { fetchRtos } from '../../api/rtoApi';

const defaultActiveRtos = [
  'Care Education',
  'ACTIT College',
  'AI Global Institute',
  'Bright Futures',
  'Kingsford Institute',
  'Victoria Training',
  'Skill Australia',
  'Northern College',
  'Sydney City College',
  'Melbourne Institute of Technology',
  'Other',
];

const studentSources = [
  'Walk-in',
  'Social Media',
  'RTO Referral',
  'Website',
  'Agent',
  'Other relevant sources',
];

const courses = [
  'Bachelor of Information Technology',
  'Bachelor of Business',
  'Bachelor of Nursing',
  'Bachelor of Engineering',
  'Diploma of Information Technology',
  'Diploma of Business',
  'Diploma of Leadership and Management',
  'Diploma of Marketing',
  'Diploma of Project Management',
  'Certificate IV in Business',
  'Certificate IV in Accounting',
  'Certificate IV in Human Resources',
  'Certificate III in Aged Care',
  'Certificate III in Early Childhood Education',
  'Certificate III in Hospitality',
  'Other',
];

const courseLevels = [
  'Certificate I', 'Certificate II', 'Certificate III', 'Certificate IV',
  'Diploma', 'Advanced Diploma', 'Associate Degree', 'Bachelor Degree',
  'Graduate Certificate', 'Graduate Diploma', 'Master Degree', 'Doctoral Degree',
  'Other',
];

const studyModes = [
  'Full Time', 'Part Time', 'Online', 'Blended', 'Flexible',
];

const yearSemesters = [
  '1st Year / Semester 1', '1st Year / Semester 2',
  '2nd Year / Semester 1', '2nd Year / Semester 2', '2nd Year / Semester 3', '2nd Year / Semester 4',
  '3rd Year / Semester 1', '3rd Year / Semester 2', '3rd Year / Semester 3', '3rd Year / Semester 4',
  '4th Year / Semester 1', '4th Year / Semester 2', '4th Year / Semester 3', '4th Year / Semester 4',
  'Final Year', 'Completed',
];

const attendanceStatuses = [
  'Regular', 'Irregular', 'On Leave', 'Suspended', 'Withdrawn',
];

const academicStatuses = [
  'Good Standing', 'Conditional', 'Probation', 'At Risk', 'Suspended', 'Excluded',
];

const previousQualifications = [
  'High School Diploma', 'Certificate I', 'Certificate II', 'Certificate III',
  'Certificate IV', 'Diploma', 'Advanced Diploma', 'Bachelor Degree',
  'Master Degree', 'Other',
];

const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition ${
    hasError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200'
  }`;

const selectClass = (hasError) =>
  `w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs appearance-none focus:outline-none focus:border-blue-600 transition ${
    hasError
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-100 text-slate-800'
      : 'border-slate-200 text-slate-800'
  }`;

// Generate year options
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

export default function EducationDetailsForm({ formData, updateField, errors }) {
  const [activeRtos, setActiveRtos] = useState(defaultActiveRtos);

  useEffect(() => {
    fetchRtos({ status: 'Active' })
      .then(res => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const names = res.data.map(r => r.name).filter(Boolean);
          if (names.length > 0) {
            const combined = Array.from(new Set([...names, ...defaultActiveRtos]));
            setActiveRtos(combined);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full font-sans">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Education Details</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Enter the student's educational background and course information.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Row 1: Course / Qualification, Specialisation, Course Level, Study Mode */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course / Qualification <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.courseQualification}
                  onChange={(e) => updateField('courseQualification', e.target.value)}
                  className={selectClass(errors?.courseQualification)}
                >
                  <option value="">Select course / qualification</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors?.courseQualification && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.courseQualification}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Specialisation (optional)</label>
              <input
                type="text"
                placeholder="Enter specialisation"
                value={formData.specialisation}
                onChange={(e) => updateField('specialisation', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Level (optional)</label>
              <div className="relative">
                <select
                  value={formData.courseLevel}
                  onChange={(e) => updateField('courseLevel', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select course level</option>
                  {courseLevels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Study Mode (optional)</label>
              <div className="relative">
                <select
                  value={formData.studyMode}
                  onChange={(e) => updateField('studyMode', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select study mode</option>
                  {studyModes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Enrollment ID, College / RTO, Campus, Student Source */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Enrollment / Student ID</label>
              <input
                type="text"
                placeholder="Enter enrollment or student ID"
                value={formData.enrollmentId}
                onChange={(e) => updateField('enrollmentId', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">College / RTO (optional)</label>
              <div className="relative">
                <select
                  value={formData.institute || formData.assignedRto}
                  onChange={(e) => {
                    updateField('institute', e.target.value);
                    updateField('assignedRto', e.target.value);
                  }}
                  className={selectClass()}
                >
                  <option value="">Select College / RTO</option>
                  {activeRtos.map((rto) => (
                    <option key={rto} value={rto}>{rto}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus / Location</label>
              <input
                type="text"
                placeholder="Enter campus or location"
                value={formData.campus}
                onChange={(e) => updateField('campus', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Source (optional)</label>
              <div className="relative">
                <select
                  value={formData.studentSource}
                  onChange={(e) => updateField('studentSource', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select source</option>
                  {studentSources.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Start Date, Expected End Date, Current Year/Semester, Attendance Status, Academic Status */}
          <div className="grid grid-cols-5 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date (optional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className={`${inputClass()} pr-9 [color-scheme:light]`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected End Date (optional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => updateField('expectedEndDate', e.target.value)}
                  className={`${inputClass()} pr-9 [color-scheme:light]`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Year / Semester (optional)</label>
              <div className="relative">
                <select
                  value={formData.currentYearSemester}
                  onChange={(e) => updateField('currentYearSemester', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select year / semester</option>
                  {yearSemesters.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attendance Status (optional)</label>
              <div className="relative">
                <select
                  value={formData.attendanceStatus}
                  onChange={(e) => updateField('attendanceStatus', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select attendance status</option>
                  {attendanceStatuses.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Status <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.academicStatus}
                  onChange={(e) => updateField('academicStatus', e.target.value)}
                  className={selectClass(errors?.academicStatus)}
                >
                  <option value="">Select academic status</option>
                  {academicStatuses.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors?.academicStatus && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.academicStatus}</p>}
            </div>
          </div>

          {/* Row 4: GPA, Previous Qualification, Year of Completion, Upload Documents */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">GPA / Percentage</label>
              <input
                type="text"
                placeholder="Enter GPA or percentage"
                value={formData.gpa}
                onChange={(e) => updateField('gpa', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Previous Qualification</label>
              <div className="relative">
                <select
                  value={formData.previousQualification}
                  onChange={(e) => updateField('previousQualification', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select previous qualification</option>
                  {previousQualifications.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year of Completion</label>
              <div className="relative">
                <select
                  value={formData.yearOfCompletion}
                  onChange={(e) => updateField('yearOfCompletion', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload Documents (optional)</label>
              <label className="w-full px-3.5 py-2 bg-white border border-dashed border-slate-300 rounded-xl flex items-center space-x-2 cursor-pointer hover:border-blue-600 transition">
                <Upload size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-blue-600">
                  {formData.documents ? formData.documents.name : 'Upload Files'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => updateField('documents', e.target.files[0])}
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG (Max. 5MB each)</p>
            </div>
          </div>

          {/* Required Fields Footer Info Banner */}
          <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center space-x-3 text-xs text-slate-600">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>Fields marked with <span className="text-rose-500 font-bold">*</span> are required.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
