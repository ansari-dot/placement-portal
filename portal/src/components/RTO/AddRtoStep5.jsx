import React from 'react';
import { 
  FileText, Check, DollarSign, Calendar, ShieldCheck, Building2, 
  MapPin, Phone, Mail, Award, CheckCircle2 
} from 'lucide-react';

export default function AddRtoStep5({
  onPrev,
  onSubmit,
  onCancel,
  onSaveDraft,
  formData,
  updateFormData,
  showToast,
  toast,
  step,
  totalSteps,
}) {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC] min-h-screen font-sans text-slate-800">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Dashboard</span><span>/</span><span>Partners</span><span>/</span><span>RTOs</span><span>/</span><span className="text-slate-800 font-medium">Add New RTO</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Add New RTO</h2>
      </div>

      {/* Stepper Bar (6 Steps) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Basic Info</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Course Pricing</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Contact Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Address & Location</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Partnership</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">6</div><span className="text-xs font-bold text-slate-900">Review</span></div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Review & Confirm</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review all RTO information, payment cycles, course pricing, and uploaded documents before final creation.</p>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs flex items-center space-x-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">Ready for Creation</p>
              <p className="text-emerald-700 text-[11px]">All required sections and compliance assets are ready to be registered in the system.</p>
            </div>
          </div>

          {/* Section 1: Basic Information & Payment Cycle */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                <Building2 size={14} className="text-blue-600" />
                <span>Basic Profile</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Payment Cycle: {formData.paymentCycle || 'Placement'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">RTO Name</p>
                <p className="font-bold text-slate-800 mt-0.5">{formData.rtoName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">RTO Code</p>
                <p className="font-medium text-slate-800 mt-0.5">{formData.rtoCode || '(Auto-generated upon save)'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Payment Cycle</p>
                <p className="font-bold text-blue-600 mt-0.5">{formData.paymentCycle || 'Placement'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">ABN</p>
                <p className="font-medium text-slate-800 mt-0.5">{formData.abn || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Website</p>
                <p className="font-medium text-slate-800 mt-0.5 truncate">{formData.website || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Established</p>
                <p className="font-medium text-slate-800 mt-0.5">{formData.yearEstablished || 'Not specified'}</p>
              </div>
            </div>

            {formData.shortDescription && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Description</p>
                <p className="text-slate-600 mt-0.5 text-xs leading-relaxed">{formData.shortDescription}</p>
              </div>
            )}
          </div>

          {/* Section 2: Payout & Course Pricing Matrix */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                <span>Payout & Course Pricing</span>
              </span>
              {formData.payoutRate && (
                <span className="text-[11px] font-semibold text-slate-600">
                  Base Rate: <strong className="text-emerald-700">${formData.payoutRate} AUD</strong>
                </span>
              )}
            </div>

            {Array.isArray(formData.coursePricing) && formData.coursePricing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="pb-1.5">Course</th>
                      <th className="pb-1.5">Qualification Level</th>
                      <th className="pb-1.5">Pricing</th>
                      <th className="pb-1.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formData.coursePricing.map((item, idx) => (
                      <tr key={idx} className="text-slate-700">
                        <td className="py-2 font-semibold text-slate-800">{item.course}</td>
                        <td className="py-2">{item.qualification}</td>
                        <td className="py-2 font-bold text-emerald-600">${item.pricing} AUD</td>
                        <td className="py-2 text-slate-500 text-[11px]">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No specific course pricing rates added.</p>
            )}
          </div>

          {/* Section 3: Uploaded Documents */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center space-x-1.5 border-b border-slate-200 pb-2">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Uploaded Documents & Media</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Logo status */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-3">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border p-0.5" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">RTO</div>
                )}
                <div>
                  <p className="font-bold text-slate-800">RTO Brand Logo</p>
                  <p className="text-[10px] text-slate-400">{formData.logo ? 'Uploaded & Attached' : 'None uploaded'}</p>
                </div>
              </div>

              {/* Certificate status */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">Registration Certificate</p>
                  <p className="text-[10px] text-slate-400 truncate">{formData.registrationCertificateName || (formData.registrationCertificate ? 'Certificate File' : 'Not attached')}</p>
                </div>
              </div>
            </div>

            {Array.isArray(formData.documents) && formData.documents.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Additional Documents ({formData.documents.length})</p>
                <div className="space-y-1.5">
                  {formData.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="font-medium text-slate-700">{d.name || d.fileName || `Document ${i + 1}`}</span>
                      <span className="text-[10px] text-slate-400">{d.size || 'Attached'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
                <Mail size={12} className="text-blue-600" />
                <span>Primary Contact</span>
              </span>
              <p className="font-bold text-slate-800">{formData.contactName || 'Not specified'}</p>
              <p className="text-slate-500 text-[11px]">{formData.contactTitle || 'Primary Contact'}</p>
              <p className="text-slate-600">{formData.contactEmail || '-'}</p>
              <p className="text-slate-600">Phone: {formData.contactPhone || '-'}</p>
              {formData.contactWhatsapp && (
                <p className="text-emerald-700 font-medium">WhatsApp: {formData.contactWhatsapp}</p>
              )}
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
                <MapPin size={12} className="text-blue-600" />
                <span>Address & Partnership</span>
              </span>
              <p className="text-slate-700">{formData.addressLine1 || '-'}</p>
              <p className="text-slate-600 font-medium">{formData.suburb || ''} {formData.state || ''} {formData.postcode || ''}</p>
              <p className="text-slate-500 text-[11px]">Since: {formData.partnershipSince || '-'}</p>
              <p className="text-slate-500 text-[11px]">Authority: {formData.issuingAuthority || '-'}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button 
              type="button"
              onClick={onPrev} 
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Previous
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
                onClick={onSubmit} 
                className="px-6 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-500 cursor-pointer"
              >
                Create RTO
              </button>
            </div>
          </div>
        </div>

        {/* Right checklist Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-800">Setup Checklist</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>1. Basic Information</span><span className="text-[10px] font-bold">Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>2. Course Pricing Matrix</span><span className="text-[10px] font-bold">Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>3. Contact Details</span><span className="text-[10px] font-bold">Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>4. Address & Location</span><span className="text-[10px] font-bold">Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>5. Partnership Details</span><span className="text-[10px] font-bold">Completed</span></div>
              <div className="flex items-center justify-between font-bold text-blue-600 bg-blue-50 p-2 rounded-lg"><span>6. Review & Confirm</span><span className="text-[10px]">In Progress</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}