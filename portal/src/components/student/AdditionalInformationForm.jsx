import {
  FileText, Calendar, ChevronDown, Upload, Info
} from 'lucide-react';

const visaStatuses = [
  'Student Visa (500)', 'Visitor Visa', 'Working Holiday Visa', 'Permanent Resident',
  'Citizen', 'Temporary Graduate (485)', 'Partner Visa', 'Bridging Visa', 'Other',
];

const workRightsOptions = [
  'Full Time', 'Part Time (40 hrs/fortnight)', 'No Work Rights', 'Unlimited',
];

const englishProficiencyOptions = [
  'IELTS - 6.0', 'IELTS - 6.5', 'IELTS - 7.0', 'IELTS - 7.5', 'IELTS - 8.0+',
  'PTE - 50', 'PTE - 58', 'PTE - 65', 'PTE - 72',
  'TOEFL iBT - 60', 'TOEFL iBT - 79', 'TOEFL iBT - 94',
  'OET - B', 'OET - A',
  'Native Speaker', 'Not Tested',
];

const heardAboutOptions = [
  'RTO Referral', 'Friend / Family', 'Social Media', 'Website', 'Google Search',
  'Advertisement', 'Agent', 'Campus Event', 'Other',
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

export default function AdditionalInformationForm({ formData, updateField, errors }) {
  return (
    <div className="w-full font-sans">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Additional Information</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Enter other relevant information about the student.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Row 1: Visa Status, Visa Subclass, Visa Expiry Date, Work Rights */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visa Status <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.visaStatus}
                  onChange={(e) => updateField('visaStatus', e.target.value)}
                  className={selectClass(errors.visaStatus)}
                >
                  <option value="">Select visa status</option>
                  {visaStatuses.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors.visaStatus && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.visaStatus}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visa Subclass (if applicable)</label>
              <input
                type="text"
                placeholder="Enter visa subclass"
                value={formData.visaSubclass}
                onChange={(e) => updateField('visaSubclass', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Visa Expiry Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.visaExpiryDate}
                  onChange={(e) => updateField('visaExpiryDate', e.target.value)}
                  className={`${inputClass()} pr-9 [color-scheme:light]`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Rights</label>
              <div className="relative">
                <select
                  value={formData.workRights}
                  onChange={(e) => updateField('workRights', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select work rights</option>
                  {workRightsOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Work Experience, English Proficiency, Emergency Contact Name, Emergency Contact Phone */}
          <div className="grid grid-cols-4 gap-5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Experience (optional)</label>
              <input
                type="text"
                placeholder="Enter work experience"
                value={formData.workExperience}
                onChange={(e) => updateField('workExperience', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">English Proficiency</label>
              <div className="relative">
                <select
                  value={formData.englishProficiency}
                  onChange={(e) => updateField('englishProficiency', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select english proficiency</option>
                  {englishProficiencyOptions.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Enter contact name"
                value={formData.emergencyContactName}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Emergency Contact Phone</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="flex items-center space-x-1 px-2.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-700">
                  <span>🇦🇺</span>
                  <ChevronDown size={12} className="text-slate-400" />
                  <span className="font-medium">+61</span>
                </div>
                <input
                  type="text"
                  placeholder="412 345 678"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: How did you hear about us?, Do you have a resume?, Upload Resume */}
          <div className="grid grid-cols-3 gap-5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">How did you hear about us?</label>
              <div className="relative">
                <select
                  value={formData.heardAboutUs}
                  onChange={(e) => updateField('heardAboutUs', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select an option</option>
                  {heardAboutOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Do you have a resume? <span className="text-rose-500">*</span></label>
              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="resume"
                    checked={formData.hasResume === 'Yes'}
                    onChange={() => updateField('hasResume', 'Yes')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="resume"
                    checked={formData.hasResume === 'No'}
                    onChange={() => updateField('hasResume', 'No')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload Resume (optional)</label>
              <label className="w-full px-4 py-3 bg-white border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-600 transition">
                <div className="flex items-center space-x-1.5 text-blue-600">
                  <Upload size={14} />
                  <span className="text-xs font-semibold">
                    {formData.resumeFile ? formData.resumeFile.name : 'Click to upload'}
                  </span>
                  {!formData.resumeFile && <span className="text-xs text-slate-500 font-normal">or drag and drop</span>}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => updateField('resumeFile', e.target.files[0])}
                />
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX (Max. 5MB)</p>
              </label>
            </div>
          </div>

          {/* Row 4: Additional Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Additional Notes (optional)</label>
            </div>
            <div className="relative">
              <textarea
                rows="4"
                maxLength={500}
                placeholder="Enter any additional notes or information about the student"
                value={formData.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition resize-none"
              ></textarea>
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium">
                {formData.additionalNotes.length} / 500
              </div>
            </div>
          </div>

          {/* Required Fields Footer Info Banner */}
          <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center space-x-3 text-xs text-slate-600">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>You can review all the information in the next step before creating the student profile.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
