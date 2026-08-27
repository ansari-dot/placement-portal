import {
  FileCheck, Edit2, Check, ArrowLeft, Save, Info
} from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const formatValue = (value, fallback = 'Not provided') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const formatDate = (date) => {
  if (!date) return 'Not provided';
  const d = new Date(date);
  if (isNaN(d)) return date;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatAvailability = (days, from, to) => {
  if (!days) return 'Not provided';
  const selected = Object.keys(days).filter(d => days[d]);
  if (selected.length === 0) return 'Not provided';
  return `${selected.join(', ')} • ${from || '?'} - ${to || '?'}`;
};

export default function ReviewSubmitForm({ formData, onEdit, confirmed, setConfirmed }) {
  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean).join(' ') || 'Not provided';

  const preferredName = formData.preferredName || formData.firstName || 'Student';
  const initials = getInitials(fullName);
  const phoneNumber = (formData.phoneCode && formData.phoneNumber)
    ? `${formData.phoneCode} ${formData.phoneNumber}`
    : 'Not provided';

  const availabilityDays = formData.availabilityDays || {};

  return (
    <div className="max-w-7xl mx-auto w-full font-sans">
      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Sections Summary */}
        <div className="col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Section Header */}
            <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Review & Submit</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Please review all the information below before creating the student profile.</p>
              </div>
            </div>

            {/* Personal Information Summary */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Check size={14} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Personal Information</h4>
                </div>
                <button onClick={() => onEdit && onEdit(1)} className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-slate-400 mb-0.5">Name</span>
                  <span className="font-bold text-slate-800">{formatValue(fullName)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{formatDate(formData.dateOfBirth)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Gender</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.gender)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Nationality</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.nationality)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Phone</span>
                  <span className="font-semibold text-slate-800">{phoneNumber}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 px-1 text-xs">
                <div>
                  <span className="text-slate-400 mr-2">Email:</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.emailAddress)}</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Address:</span>
                  <span className="font-semibold text-slate-800">
                    {[formData.address, formData.suburb, formData.state, formData.postCode].filter(Boolean).join(', ') || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Education Details Summary */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Check size={14} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Education Details</h4>
                </div>
                <button onClick={() => onEdit && onEdit(2)} className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-slate-400 mb-0.5">Course / Qualification</span>
                  <span className="font-bold text-slate-800">{formatValue(formData.courseQualification)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Institute / College</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.institute)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Course Level</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.courseLevel)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Current Year / Semester</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.currentYearSemester)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">GPA / Percentage</span>
                  <span className="font-bold text-slate-800">{formatValue(formData.gpa)}</span>
                  {formData.yearOfCompletion && <span className="block text-[10px] text-slate-400 mt-0.5">{formData.yearOfCompletion}</span>}
                </div>
              </div>
            </div>

            {/* Additional Information Summary */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Check size={14} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Additional Information</h4>
                </div>
                <button onClick={() => onEdit && onEdit(3)} className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-slate-400 mb-0.5">Preferred Industry</span>
                  <span className="font-bold text-slate-800">
                    {formatValue(formData.preferredIndustry)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Placement Site</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(formData.placementSite) && formData.placementSite.length > 0
                      ? formData.placementSite.join(', ')
                      : formatValue(formData.placementSite)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Driver's Licence / Transport</span>
                  <span className="font-semibold text-slate-800">
                    {formData.transport === 'Yes'
                      ? `Yes ${formData.licenceNumber ? `(#${formData.licenceNumber})` : ''}`
                      : formData.transport === 'No'
                      ? 'No'
                      : formatValue(formData.transport)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Preferred Location</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.preferredLocation)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Internship Priority</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.internshipPriority)}</span>
                </div>
              </div>

              <div className="mt-3 px-1 text-xs flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <span className="text-slate-400 mr-2">Police Check:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.policeCheckDoc ? (formData.policeCheckDoc.name || String(formData.policeCheckDoc)) : 'Not uploaded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">COVID-19 Check:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.covidCheckDoc ? (formData.covidCheckDoc.name || String(formData.covidCheckDoc)) : 'Not uploaded'}
                  </span>
                </div>
                {Array.isArray(formData.additionalDocuments) && formData.additionalDocuments.length > 0 && (
                  <div>
                    <span className="text-slate-400 mr-2">Custom Docs:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.additionalDocuments.map(d => d.title || 'Untitled').join(', ')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 mr-2">Availability:</span>
                  <span className="font-semibold text-slate-800">
                    {formatAvailability(availabilityDays, formData.availabilityFrom, formData.availabilityTo)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Relocate:</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.willingToRelocate)}</span>
                </div>
              </div>
            </div>

            {/* Visa & Compliance Summary */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Check size={14} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Visa & Compliance</h4>
                </div>
                <button onClick={() => onEdit && onEdit(4)} className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-slate-400 mb-0.5">Visa Status</span>
                  <span className="font-bold text-slate-800">{formatValue(formData.visaStatus)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">English Proficiency</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.englishProficiency)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Work Rights</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.workRights)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Work Experience</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.workExperience)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Has Resume</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.hasResume)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-0.5">Willing to Relocate</span>
                  <span className="font-semibold text-slate-800">{formatValue(formData.willingToRelocate)}</span>
                </div>
              </div>

              {(formData.placementNotes || formData.additionalNotes) && (
                <div className="mt-3 px-1 text-xs space-y-2">
                  {formData.placementNotes && (
                    <div>
                      <span className="text-slate-400 mr-2">Placement Notes:</span>
                      <span className="font-semibold text-slate-800">{formData.placementNotes}</span>
                    </div>
                  )}
                  {formData.additionalNotes && (
                    <div>
                      <span className="text-slate-400 mr-2">Additional Notes:</span>
                      <span className="font-semibold text-slate-800">{formData.additionalNotes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox & Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
                className="mt-0.5 w-4 h-4 text-blue-600 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                I confirm that the above information is accurate and complete to the best of my knowledge.<br />
                <span className="text-slate-400 text-[11px]">By creating this student profile, you agree to our <span className="text-blue-600 underline">Terms & Conditions</span> and <span className="text-blue-600 underline">Privacy Policy</span>.</span>
              </span>
            </label>

            {!confirmed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-[11px] font-semibold text-amber-700">
                <Info size={14} className="shrink-0" />
                <span>Please confirm that the information is accurate before submitting.</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onEdit && onEdit(4)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 flex items-center space-x-2 transition"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onEdit && onEdit(1)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 flex items-center space-x-2 transition"
                >
                  <Save size={16} />
                  <span>Save as Draft</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Profile Preview & Validation */}
        <div className="col-span-4 space-y-6">
          {/* Student Profile Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Student Profile Preview</h4>

            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-bold text-slate-900">{preferredName}</h5>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">New Student</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{phoneNumber}</p>
                <p className="text-xs text-slate-400">{formatValue(formData.emailAddress)}</p>
                <p className="text-xs text-slate-400">{formatValue(formData.nationality)}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status</span>
                <span className="font-semibold text-slate-800">New</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created By</span>
                <span className="font-semibold text-slate-800">Wasiq Shah</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RTO</span>
                <span className="font-semibold text-slate-800">{formatValue(formData.assignedRto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source</span>
                <span className="font-semibold text-slate-800">{formatValue(formData.studentSource)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Location</span>
                <span className="font-semibold text-slate-800">{formatValue(formData.preferredLocation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visa Status</span>
                <span className="font-semibold text-slate-800">{formatValue(formData.visaStatus)}</span>
              </div>
            </div>
          </div>

          {/* Validation Check */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Validation Check</h4>

            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
              <Check size={14} className="stroke-[3]" />
              <span>All required information is provided.</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
              <Check size={14} className="stroke-[3]" />
              <span>Personal Information</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
              <Check size={14} className="stroke-[3]" />
              <span>Education Details</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
              <Check size={14} className="stroke-[3]" />
              <span>RTO & Source</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600">
              <Check size={14} className="stroke-[3]" />
              <span>Additional Information</span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center space-x-3 text-xs text-slate-600 shadow-xs">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>Please confirm that the information provided is accurate and complete.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
