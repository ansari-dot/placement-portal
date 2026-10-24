import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, ChevronDown, Info, X, Upload, Plus, Trash2, ShieldCheck, FileText, CheckCircle2
} from 'lucide-react';
import { fetchRtos } from '../../api/rtoApi';

const studentSources = [
  'Walk-in',
  'Social Media',
  'Other',
];

// Certificate-level dropdown options (used for the "Certificate Level" select).
const courseLevels = [
  'Certificate III',
  'Certificate IV',
  'Diploma',
  'Advanced Diploma',
  'Bachelor',
  'Graduate Certificate',
  'Graduate Diploma',
  'Master',
  'Other',
];

const courses = [
  'Individual Support',
  'Early Childhood Education and Care',
  'Hospitality Management',
  'Community Services',
  'Allied Health System',
  'Construction',
  'Other',
];

// Structured compliance / identity document types
// Police Check and COVID-19 Check kept prominent with original badges
const STRUCTURED_DOCS = [
  {
    field: 'policeCheckDoc',
    label: 'Police Check Document',
    badge: 'Most Preferable',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    highlight: true,
    hint: 'National Police Certificate (Most preferred for placement)'
  },
  {
    field: 'covidCheckDoc',
    label: 'COVID-19 Check Document',
    badge: 'Optional',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    hint: 'Vaccination Certificate / Test Report (PDF/JPG/PNG)'
  },
  { field: 'ndisDoc',            label: 'NDIS',                         hint: 'NDIS Screening Check' },
  { field: 'resumeDoc',          label: 'CB / Resume',                  hint: 'Current resume or CV' },
  { field: 'wwccDoc',            label: 'WWCC',                         hint: 'Working With Children Check' },
  { field: 'passportDoc',        label: 'Passport',                     hint: 'Valid passport copy' },
  { field: 'drivingLicenceDoc',  label: 'Driving Licence',              hint: 'Current driving licence' },
  { field: 'infectionControlDoc',label: 'Infection Control Certificate',hint: 'Infection control training certificate' },
  { field: 'handHygieneDoc',     label: 'Hand Hygiene',                 hint: 'Hand hygiene training certificate' },
  { field: 'cbrDoc',             label: 'CPR',                          hint: 'Cardiopulmonary Resuscitation (CPR) Certificate' },
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

export default function EducationDetailsForm({ formData, updateField, errors, isRtoManager = false, userRtoName = '' }) {
  const [activeRtos, setActiveRtos] = useState([]);
  const [allRtos, setAllRtos] = useState([]);
  const [loadingRtos, setLoadingRtos] = useState(true);
  const [isOtherSource, setIsOtherSource] = useState(
    Boolean(
      formData.studentSource &&
      formData.studentSource !== 'Walk-in' &&
      formData.studentSource !== 'Social Media'
    )
  );

  // 'auto' = system generates student ID automatically
  // 'manual' = user types student ID manually
  const [isManualId, setIsManualId] = useState(Boolean(formData.studentId));

  const toggleIdMode = (manual) => {
    setIsManualId(manual);
    if (!manual) {
      updateField('studentId', '');
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoadingRtos(true);
    fetchRtos()
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setAllRtos(list);
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

  const resolveRtoPricing = () => {
    if (formData.studentType === 'Independent Student') return null;
    const currentRtoName = formData.institute || formData.assignedRto;
    if (!currentRtoName || currentRtoName === 'Other') return null;
    const rto = allRtos.find(r => (formData.rtoId && r._id === formData.rtoId) || r.name === currentRtoName);
    if (!rto) return null;

    const courseQ = String(formData.courseQualification || '').trim().toLowerCase();
    const courseLvl = String(formData.courseLevel || '').trim().toLowerCase();

    if (Array.isArray(rto.coursePricing) && rto.coursePricing.length > 0) {
      const exact = rto.coursePricing.find(p => {
        const pC = String(p.course || '').trim().toLowerCase();
        const pQ = String(p.qualification || '').trim().toLowerCase();
        return pC && pC === courseQ && pQ && pQ === courseLvl;
      });
      if (exact && typeof exact.pricing === 'number' && exact.pricing > 0) {
        return { configured: true, price: exact.pricing, source: 'Exact Course & Qualification Match' };
      }

      const courseMatch = rto.coursePricing.find(p => {
        const pC = String(p.course || '').trim().toLowerCase();
        return pC && (pC === courseQ || courseQ.includes(pC) || pC.includes(courseQ));
      });
      if (courseMatch && typeof courseMatch.pricing === 'number' && courseMatch.pricing > 0) {
        return { configured: true, price: courseMatch.pricing, source: `Course Match (${courseMatch.course})` };
      }

      const lvlMatch = rto.coursePricing.find(p => {
        const pQ = String(p.qualification || '').trim().toLowerCase();
        return pQ && (pQ === courseLvl || courseLvl.includes(pQ) || pQ.includes(courseLvl));
      });
      if (lvlMatch && typeof lvlMatch.pricing === 'number' && lvlMatch.pricing > 0) {
        return { configured: true, price: lvlMatch.pricing, source: `Level Match (${lvlMatch.qualification})` };
      }

      // When qualification-specific pricing is defined, do not fall back to flat payoutRate
      return { configured: false, price: 0, source: 'No matching course pricing found in RTO schedule' };
    }

    if (typeof rto.payoutRate === 'number' && rto.payoutRate > 0) {
      return { configured: true, price: rto.payoutRate, source: 'Base RTO Payout Rate' };
    }

    return { configured: false, price: 0, source: 'No configured price found in RTO agreement' };
  };

  const pricingInfo = resolveRtoPricing();

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

  // Helper: get current file value for a doc field (may be File object or string filename)
  const getDocFileName = (val) => {
    if (!val) return null;
    if (val instanceof File) return val.name;
    return val;
  };

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
          {/* Row 1: Course/Qualification (Mandatory), Certificate Level (Mandatory), Placement Hours */}
          <div className="grid grid-cols-3 gap-5">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Placement Hours</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 120"
                value={formData.placementHours || ''}
                onChange={(e) => updateField('placementHours', e.target.value)}
                className={inputClass(errors?.placementHours)}
              />
              {errors?.placementHours && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.placementHours}</p>}
            </div>
          </div>



          {/* Student Classification & Billing Mode */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Student Classification &amp; Billing Mode <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Select whether this student is enrolled through an RTO agreement or registered independently.
                </p>
              </div>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    updateField('studentType', 'RTO Student');
                    if (formData.assignedRto === 'Independent Student') {
                      updateField('assignedRto', '');
                      updateField('institute', '');
                    }
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    (formData.studentType || 'RTO Student') === 'RTO Student'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  RTO Student
                </button>
                {!isRtoManager && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('studentType', 'Independent Student');
                      updateField('assignedRto', 'Independent Student');
                      updateField('institute', 'Independent Student');
                      updateField('rtoId', undefined);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      formData.studentType === 'Independent Student'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Independent Student
                  </button>
                )}
              </div>
            </div>

            {formData.studentType === 'Independent Student' ? (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100/60 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placement Fee ($ AUD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={formData.independentFee || ''}
                    onChange={(e) => updateField('independentFee', e.target.value)}
                    className={inputClass(errors?.independentFee)}
                  />
                  {errors?.independentFee && (
                    <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.independentFee}</p>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Direct Student Billing:</span> Invoices are issued directly to the student's personal contact details without RTO involvement.
                </div>
              </div>
            ) : (
              pricingInfo && (
                <div className="pt-2 border-t border-blue-100/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">RTO Agreement Placement Fee:</span>
                    {pricingInfo.configured ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                        ${pricingInfo.price.toFixed(2)} AUD
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Unconfigured ($0.00 Default - Admin Can Override)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {pricingInfo.source}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Row 2: Student ID, College / RTO */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Student ID</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleIdMode(false)}
                    className={`px-2 py-0.5 rounded-md transition ${
                      !isManualId ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleIdMode(true)}
                    className={`px-2 py-0.5 rounded-md transition ${
                      isManualId ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {isManualId ? (
                <input
                  type="text"
                  placeholder="Enter Student ID (e.g. STU11, CE15)"
                  value={formData.studentId || ''}
                  onChange={(e) => updateField('studentId', e.target.value)}
                  className={inputClass()}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value="Auto-generated on Save (e.g. STU11)"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium cursor-not-allowed italic"
                />
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {isManualId
                  ? "Manual ID set — system will not auto-generate"
                  : "Auto mode active — sequential ID generated automatically"}
              </p>
            </div>

            {formData.studentType === 'Independent Student' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">College / RTO</label>
                <input
                  type="text"
                  value="Independent Student (Direct Billing)"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Billed directly to student; not assigned to an RTO partner.</p>
              </div>
            ) : isRtoManager ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">College / RTO</label>
                <input
                  type="text"
                  value={userRtoName || formData.assignedRto || 'Your Registered Training Organisation'}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Student will be automatically registered under your RTO.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">College / RTO (optional)</label>
                <div className="relative">
                  <select
                    value={formData.institute || formData.assignedRto || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField('institute', val);
                      updateField('assignedRto', val);
                      const matched = allRtos.find(r => r.name === val);
                      if (matched) updateField('rtoId', matched._id);
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
                {!(formData.institute || formData.assignedRto) && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">No RTO selected — student will be marked as Awaiting RTO Assignment</p>
                )}
              </div>
            )}
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

          {/* ===== Section: Structured Compliance & Identity Documents ===== */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={16} className="text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Documents</h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">All Optional</span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2">Upload any relevant compliance, identity, or certification documents. All fields are optional and can be uploaded later from the student profile.</p>

            <div className="grid grid-cols-2 gap-4">
              {STRUCTURED_DOCS.map(({ field, label, hint, badge, badgeClass, highlight }) => {
                const currentFile = formData[field];
                const fileName = getDocFileName(currentFile);
                const hasFile = Boolean(fileName);

                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">{label}</label>
                      <div className="flex items-center space-x-1.5">
                        {badge && !hasFile && (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeClass}`}>
                            {badge}
                          </span>
                        )}
                        {hasFile && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 size={10} />
                            <span>Uploaded</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <label className={`w-full px-3.5 py-2.5 bg-white border border-dashed rounded-xl flex items-center space-x-2 cursor-pointer transition ${
                      hasFile
                        ? 'border-emerald-300 hover:border-emerald-500'
                        : highlight
                        ? 'border-amber-300 hover:border-amber-500'
                        : 'border-slate-300 hover:border-blue-600'
                    }`}>
                      {hasFile ? (
                        <FileText size={15} className="text-emerald-600 shrink-0" />
                      ) : highlight ? (
                        <Upload size={15} className="text-amber-600 shrink-0" />
                      ) : (
                        <Upload size={15} className="text-blue-600 shrink-0" />
                      )}
                      <span className={`text-xs font-semibold truncate ${
                        hasFile ? 'text-emerald-700' : highlight ? 'text-amber-700' : 'text-blue-600'
                      }`}>
                        {hasFile ? fileName : `Upload ${label}`}
                      </span>
                      {hasFile && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); updateField(field, null); }}
                          className="ml-auto text-slate-400 hover:text-rose-500 transition shrink-0"
                          title="Remove file"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => updateField(field, e.target.files[0] || null)}
                      />
                    </label>
                    <p className={`text-[10px] mt-1 ${highlight ? 'text-amber-700/90 font-medium' : 'text-slate-400'}`}>{hint}</p>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Custom Document Addition Bar */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Additional Custom Documents</h5>
                  <p className="text-[10px] text-slate-400">Add any extra documents with a custom title (e.g. First Aid, Flu Vaccine).</p>
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