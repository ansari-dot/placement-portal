import React, { useRef } from 'react';
import { 
  Upload, FileText, ArrowRight, DollarSign, Calendar, Plus, Trash2, 
  CheckCircle2, X, Image as ImageIcon, ShieldCheck, HelpCircle, AlertCircle
} from 'lucide-react';

const COURSES = [
  'Individual Support',
  'Early Childhood Education and Care',
  'Hospitality Management',
  'Community Services',
  'Allied Health System',
  'Construction',
  'Other',
];

const COURSE_LEVELS = [
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

const PAYMENT_CYCLES = [
  { id: 'Appointment', title: 'Appointment', desc: 'Invoiced upon scheduling student appointment' },
  { id: 'Placement', title: 'Placement', desc: 'Invoiced when student commences placement' },
  { id: '15 Days', title: '15 Days', desc: 'Invoiced fortnightly on a 15-day recurring cycle' },
];

export default function AddRtoStep1({ onNext, onCancel, onSaveDraft, formData, updateFormData, showToast }) {
  const logoInputRef = useRef(null);
  const certInputRef = useRef(null);

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  // --- Document & Logo Handlers ---
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (showToast) showToast('Logo image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleChange('logo', reader.result);
      if (showToast) showToast('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (showToast) showToast('Certificate file must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateFormData({
        registrationCertificate: reader.result,
        registrationCertificateName: file.name
      });
      if (showToast) showToast('Registration Certificate uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomDoc = () => {
    const current = Array.isArray(formData.documents) ? formData.documents : [];
    updateFormData({
      documents: [
        ...current,
        {
          name: '',
          file: '',
          size: '',
          uploadDate: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
        }
      ]
    });
  };

  const handleCustomDocNameChange = (idx, name) => {
    const current = [...(formData.documents || [])];
    current[idx] = { ...current[idx], name };
    updateFormData({ documents: current });
  };

  const handleCustomDocFileSelect = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const current = [...(formData.documents || [])];
      current[idx] = {
        ...current[idx],
        file: reader.result,
        name: current[idx].name || file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      };
      updateFormData({ documents: current });
      if (showToast) showToast(`Document "${file.name}" uploaded`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomDoc = (idx) => {
    const current = (formData.documents || []).filter((_, i) => i !== idx);
    updateFormData({ documents: current });
  };

  // --- Course Pricing Handlers ---
  const handleAddCoursePricing = () => {
    const current = Array.isArray(formData.coursePricing) ? formData.coursePricing : [];
    updateFormData({
      coursePricing: [
        ...current,
        {
          course: COURSES[0],
          qualification: COURSE_LEVELS[0],
          pricing: 500,
          notes: ''
        }
      ]
    });
  };

  const handleUpdateCoursePricing = (index, field, value) => {
    const current = [...(formData.coursePricing || [])];
    current[index] = { ...current[index], [field]: value };
    updateFormData({ coursePricing: current });
  };

  const handleRemoveCoursePricing = (index) => {
    const current = (formData.coursePricing || []).filter((_, i) => i !== index);
    updateFormData({ coursePricing: current });
  };

  const handleAddDefaultCourses = () => {
    const defaultList = [
      { course: 'Individual Support', qualification: 'Certificate III', pricing: 500, notes: 'Standard per placement' },
      { course: 'Early Childhood Education and Care', qualification: 'Diploma', pricing: 650, notes: 'Childcare placement' },
      { course: 'Community Services', qualification: 'Diploma', pricing: 600, notes: 'Case work placement' },
      { course: 'Hospitality Management', qualification: 'Certificate IV', pricing: 450, notes: 'Commercial cookery/hospitality' },
      { course: 'Allied Health System', qualification: 'Certificate IV', pricing: 700, notes: 'Clinical support' }
    ];
    updateFormData({ coursePricing: defaultList });
    if (showToast) showToast('Standard course pricing matrix pre-populated');
  };

  const handleNextClick = () => {
    if (!formData.rtoName || !formData.rtoName.trim()) {
      if (showToast) showToast('RTO Name is required');
      return;
    }
    onNext();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-slate-800">
      
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Dashboard</span><span>/</span><span>Partners</span><span>/</span><span>RTOs</span><span>/</span>
          <span className="text-slate-800 font-medium">Add New RTO</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Add New RTO</h2>
      </div>

      {/* Stepper Bar (6 Steps) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">1</div><span className="text-xs font-bold text-slate-900">Basic Info</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">2</div><span className="text-xs font-bold text-slate-400">Course Pricing</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">3</div><span className="text-xs font-bold text-slate-400">Contact Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">4</div><span className="text-xs font-bold text-slate-400">Address & Location</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">5</div><span className="text-xs font-bold text-slate-400">Partnership</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">6</div><span className="text-xs font-bold text-slate-400">Review</span></div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Main Form Container */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-7">
          <div>
            <h3 className="text-base font-bold text-slate-800">Basic Information & Media</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter the basic details, invoice period / payment cycle, and compliance documents for the RTO.</p>
          </div>

          {/* Section 1: Basic Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">RTO Name <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                placeholder="Enter full legal RTO name" 
                value={formData.rtoName || ''}
                onChange={(e) => handleChange('rtoName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            {/* RTO Code is now OPTIONAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">RTO Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                <span className="text-[10px] text-slate-400">Auto-generated if empty</span>
              </div>
              <input 
                type="text" 
                placeholder="e.g. RTO-12345 (Leave blank to auto-generate)" 
                value={formData.rtoCode || ''}
                onChange={(e) => handleChange('rtoCode', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ABN <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input 
                type="text" 
                placeholder="e.g. 12 345 678 901" 
                value={formData.abn || ''}
                onChange={(e) => handleChange('abn', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ACN <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input 
                type="text" 
                placeholder="Enter ACN if applicable" 
                value={formData.acn || ''}
                onChange={(e) => handleChange('acn', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Website</label>
              <input 
                type="text" 
                placeholder="https://www.example.edu.au" 
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Year Established</label>
              <input 
                type="text" 
                placeholder="e.g. 2015" 
                value={formData.yearEstablished || ''}
                onChange={(e) => handleChange('yearEstablished', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
          </div>

          {/* Section 2: Payment Cycle / Invoice Period (Required) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>Payment Cycle / Invoice Period</span>
                <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">Select when invoices and payout billing are triggered for this partner.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PAYMENT_CYCLES.map((cycle) => {
                const isSelected = (formData.paymentCycle || 'Placement') === cycle.id;
                return (
                  <div 
                    key={cycle.id}
                    onClick={() => handleChange('paymentCycle', cycle.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {cycle.title}
                      </span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {cycle.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Section 4: Short Description */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Short Description</label>
            <textarea 
              rows={3} 
              placeholder="Enter a brief description about the RTO, mission, and key vocational programs offered..." 
              value={formData.shortDescription || ''}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex justify-end text-[10px] text-slate-400">
              {(formData.shortDescription || '').length}/500
            </div>
          </div>

          {/* Section 5: Documents & Media Upload (Fully Dynamic & Stored in Backend) */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Documents & Media</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload brand assets and registration certificates. Files are stored securely with the partner profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* RTO Logo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">RTO Logo</label>
                  {formData.logo && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={10} />
                      <span>Uploaded</span>
                    </span>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={logoInputRef}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />

                {formData.logo ? (
                  <div className="border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 bg-slate-50/50">
                    <img 
                      src={formData.logo} 
                      alt="Logo preview" 
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-1" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">RTO Logo Uploaded</p>
                      <button 
                        type="button" 
                        onClick={() => logoInputRef.current?.click()}
                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Change logo
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleChange('logo', '')} 
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                      title="Remove Logo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 cursor-pointer flex flex-col items-center justify-center space-y-2 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Click to upload RTO Logo</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, SVG or WebP (Max 2MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Certificate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Registration Certificate <span className="text-slate-400 font-normal">(Optional)</span></label>
                  {formData.registrationCertificate && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={10} />
                      <span>Uploaded</span>
                    </span>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={certInputRef}
                  accept=".pdf, .png, .jpg, .jpeg, .doc, .docx"
                  className="hidden"
                  onChange={handleCertificateSelect}
                />

                {formData.registrationCertificate ? (
                  <div className="border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {formData.registrationCertificateName || 'Registration Certificate'}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => certInputRef.current?.click()}
                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Replace file
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => updateFormData({ registrationCertificate: '', registrationCertificateName: '' })} 
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                      title="Remove Certificate"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => certInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 cursor-pointer flex flex-col items-center justify-center space-y-2 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Upload Certificate File</p>
                      <p className="text-[10px] text-slate-400">PDF, JPG, PNG or DOCX (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Custom Documents */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Additional RTO Documents</h5>
                  <p className="text-[10px] text-slate-400">Add agreements, MOUs, accreditation proof, or insurance certificates.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomDoc}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Document</span>
                </button>
              </div>

              {Array.isArray(formData.documents) && formData.documents.length > 0 && (
                <div className="space-y-2.5">
                  {formData.documents.map((docItem, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Document Title (e.g. Partnership Agreement, ASQA Audit)"
                          value={docItem.name || ''}
                          onChange={(e) => handleCustomDocNameChange(idx, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="w-full px-3.5 py-2 bg-white border border-dashed border-slate-300 rounded-xl flex items-center space-x-2 cursor-pointer hover:border-blue-600 transition">
                          <Upload size={14} className="text-blue-600 shrink-0" />
                          <span className="text-xs font-semibold text-blue-600 truncate">
                            {docItem.fileName || (docItem.file ? 'File Attached' : 'Select File')}
                          </span>
                          {docItem.size && (
                            <span className="text-[10px] text-slate-400 ml-auto">{docItem.size}</span>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleCustomDocFileSelect(idx, e)}
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

          {/* Navigation */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button 
              type="button"
              onClick={onCancel} 
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={onSaveDraft} 
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
              >
                <FileText size={14} />
                <span>Save as Draft</span>
              </button>
              <button 
                type="button"
                onClick={handleNextClick} 
                className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition-all duration-500 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-800">RTO Information Checklist</h4>
            <p className="text-[11px] text-slate-500">Ensure the following key information is ready:</p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center space-x-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>Legal RTO Name</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>Payment Cycle / Invoice Period</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>Course & Qualification Pricing</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>Compliance & Media Documents</span>
              </li>
              <li className="flex items-center space-x-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>Primary Contact & Address</span>
              </li>
            </ul>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start space-x-2 text-[11px] text-blue-800">
              <AlertCircle size={15} className="shrink-0 text-blue-600 mt-0.5" />
              <span>RTO Code is optional. If left blank, a code will be automatically assigned.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}