import React from 'react';
import { 
  ArrowLeft, Bookmark, Check, Edit
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

const ReviewField = ({ label, value }) => (
  <div>
    <span className="text-slate-400 block">{label}</span>
    <span className="font-semibold text-slate-900 break-words">{value || <span className="text-slate-300 italic">Not provided</span>}</span>
  </div>
);

export default function AddNewIndustryStep5({ onPrev, onSubmit, formData = {} }) {
  const addressLine = [formData.address, formData.addressLine2, formData.suburb, formData.state, formData.postCode, formData.country].filter(Boolean).join(', ');

  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 5 Review & Confirm Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review & Confirm</h2>
            <p className="text-xs text-slate-500">Please review all information below before adding this industry.</p>
          </div>

          {/* Summary Review Sections Grid */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            
            {/* Basic Information Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Basic Information</span>
                <button onClick={onPrev} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <ReviewField label="Industry / Organisation Name" value={formData.industryName} />
                <ReviewField label="Industry Type" value={formData.industryType} />
                <ReviewField label="Company Code" value={formData.industryCode || 'Auto-generated'} />
                <ReviewField label="Website" value={formData.website} />
                <ReviewField label="ABN" value={formData.abn} />
              </div>
            </div>

            {/* Contact Details Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Contact Details</span>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <ReviewField label="Contact Person Name" value={formData.contactPersonName} />
                <ReviewField label="Job Title" value={formData.contactJobTitle} />
                <ReviewField label="Email Address" value={formData.contactEmail} />
                <ReviewField label="Phone Number" value={formData.contactPhone} />
                <ReviewField label="Mobile Number" value={formData.contactMobile} />
                <ReviewField label="Department" value={formData.contactDepartment} />
                <ReviewField label="Contact Preference" value={formData.contactPreference} />
                <ReviewField label="Best Time to Contact" value={formData.bestTimeToContact} />
              </div>
            </div>

            {/* Address & Location Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Address & Location</span>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <ReviewField label="Address" value={formData.address} />
                {formData.addressLine2 && <ReviewField label="Address Line 2" value={formData.addressLine2} />}
                <ReviewField label="Suburb / City" value={formData.suburb} />
                <ReviewField label="State / Territory" value={formData.state} />
                <ReviewField label="Postcode" value={formData.postCode} />
                <ReviewField label="Country" value={formData.country || 'Australia'} />
                {formData.shortDescription && (
                  <ReviewField label="Description" value={formData.shortDescription} />
                )}
              </div>
            </div>

          </div>

          {/* Bottom Status Callout */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Ready to submit</h4>
                <p className="text-[11px] text-slate-600">All required information has been provided. Click "Add Industry" to save.</p>
              </div>
            </div>

            <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-indigo-100">
                📄
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Summary</h4>
                <p className="text-[11px] text-slate-600 break-words">{addressLine || 'No address provided.'}</p>
              </div>
            </div>
          </div>

          {/* Confirmation checkbox */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-xs font-semibold text-slate-900">I confirm that the above information is correct to the best of my knowledge.</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onPrev}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg shadow-sm transition-colors">
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>Save as Draft</span>
              </button>
              <button
                onClick={onSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                <span>Add Industry</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <IndustryProgressPanel currentStep={5} />

      </div>
    </div>
  );
}
