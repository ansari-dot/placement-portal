import { useState, useEffect } from 'react';
import {
  GraduationCap, ChevronDown, Info, X, Upload, Plus, Trash2, ShieldCheck
} from 'lucide-react';
import { fetchRtos } from '../../api/rtoApi';

const studentSources = [
  'Walk-in',
  'Social Media',
  'Other',
];

// Keep only course options in this education section; certificate-level values are no longer listed here.
const courseLevels = ['Other'];

const courses = [
  'Individual Support',
  'Early Childhood Education and Care',
  'Hospitality Management',
  'Other',
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

export default function EducationDetailsForm({ formData, updateField, errors }) {
  const [activeRtos, setActiveRtos] = useState([]);
  const [loadingRtos, setLoadingRtos] = useState(true);
  const [isOtherSource, setIsOtherSource] = useState(
    Boolean(
      formData.studentSource &&
      formData.studentSource !== 'Walk-in' &&
      formData.studentSource !== 'Social Media'
    )
  );

  useEffect(() => {
    let isMounted = true;
    setLoadingRtos(true);
    fetchRtos()
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const names = list
          .map(r => (typeof r === 'string' ? r : r?.name))
          .filter(Boolean);
        const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
        setActiveRtos(uniqueNames);
      })
      .catch(err => {
        console.error('Failed to fetch RTOs/Colleges from backend:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingRtos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    const updated = (formData.additionalDocuments || []).filter((_, i) => i !== index);
    updateField('additionalDocuments', updated);
  };

  const isOtherCollege = (formData.institute || formData.assignedRto) === 'Other';

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
          {/* Row 1: Course/Qualification (Mandatory), Study Mode (Mandatory) */}
          <div className="grid grid-cols-2 gap-5">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Certificate Level <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.courseLevel || ''}
                  onChange={(e) => updateField('courseLevel', e.target.value)}
                  className={selectClass(errors?.courseLevel)}
                >
                  <option value="">Select certificate level</option>
                  {courseLevels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors?.courseLevel && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.courseLevel}</p>}
            </div>
          </div>



          {/* Row 2: Enrollment ID, College / RTO, Student Source (only when College/RTO = Other) */}
          <div className="grid grid-cols-3 gap-5">
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
                  value={formData.institute || formData.assignedRto || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('institute', val);
                    updateField('assignedRto', val);
                  }}
                  disabled={loadingRtos}
                  className={selectClass()}
                >
                  <option value="">{loadingRtos ? 'Loading College / RTO...' : 'Select College / RTO'}</option>
                  {(formData.institute || formData.assignedRto) &&
                    !activeRtos.includes(formData.institute || formData.assignedRto) &&
                    (formData.institute || formData.assignedRto) !== 'Other' && (
                      <option value={formData.institute || formData.assignedRto}>
                        {formData.institute || formData.assignedRto}
                      </option>
                    )}
                  {activeRtos.map((rto) => (
                    <option key={rto} value={rto}>{rto}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            {isOtherCollege && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Source (optional)</label>
                {isOtherSource || (formData.studentSource && formData.studentSource !== 'Walk-in' && formData.studentSource !== 'Social Media') ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type source (e.g. Referral, Website...)"
                      value={formData.studentSource === 'Other' ? '' : formData.studentSource || ''}
                      onChange={(e) => updateField('studentSource', e.target.value)}
                      className={`${inputClass()} pr-8`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtherSource(false);
                        updateField('studentSource', '');
                      }}
                      title="Switch back to options"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.studentSource || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setIsOtherSource(true);
                          updateField('studentSource', '');
                        } else {
                          setIsOtherSource(false);
                          updateField('studentSource', val);
                        }
                      }}
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
                )}
              </div>
            )}
          </div>

          {/* Section: Compliance & Verification Documents */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={16} className="text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance & Check Documents</h4>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Police Check Document</label>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                    Most Preferable
                  </span>
                </div>
                <label className="w-full px-3.5 py-2.5 bg-white border border-dashed border-amber-300 hover:border-amber-500 rounded-xl flex items-center space-x-2 cursor-pointer transition">
                  <Upload size={16} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 truncate">
                    {formData.policeCheckDoc ? (formData.policeCheckDoc.name || formData.policeCheckDoc) : 'Upload Police Check'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => updateField('policeCheckDoc', e.target.files[0])}
                  />
                </label>
                <p className="text-[10px] text-amber-700/80 font-medium mt-1">National Police Certificate (Most preferred for placement)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">COVID-19 Check Document (optional)</label>
                <label className="w-full px-3.5 py-2.5 bg-white border border-dashed border-slate-300 rounded-xl flex items-center space-x-2 cursor-pointer hover:border-blue-600 transition">
                  <Upload size={16} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-blue-600 truncate">
                    {formData.covidCheckDoc ? (formData.covidCheckDoc.name || formData.covidCheckDoc) : 'Upload COVID-19 Report'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => updateField('covidCheckDoc', e.target.files[0])}
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Vaccination Certificate / Test Report (PDF/JPG/PNG)</p>
              </div>
            </div>

            {/* Dynamic Custom Document Addition Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Additional Custom Documents / Requirements</h5>
                  <p className="text-[10px] text-slate-400">Add any extra documents manually with a custom title (e.g. NDIS Screening, First Aid, Flu Vaccine).</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomDoc}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Custom Document</span>
                </button>
              </div>

              {Array.isArray(formData.additionalDocuments) && formData.additionalDocuments.length > 0 && (
                <div className="space-y-2.5">
                  {formData.additionalDocuments.map((docItem, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Document Title (e.g. NDIS Check, First Aid Certificate)"
                          value={docItem.title || ''}
                          onChange={(e) => handleUpdateCustomDocTitle(idx, e.target.value)}
                          className={inputClass()}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="w-full px-3.5 py-2 bg-white border border-dashed border-slate-300 rounded-xl flex items-center space-x-2 cursor-pointer hover:border-blue-600 transition">
                          <Upload size={14} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-semibold text-blue-600 truncate">
                            {docItem.file ? (docItem.file.name || docItem.file) : 'Upload File'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUpdateCustomDocFile(idx, e.target.files[0])}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDoc(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                        title="Remove Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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