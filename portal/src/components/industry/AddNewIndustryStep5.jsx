import React from 'react';
import { 
  ArrowLeft, Bookmark, Check, Edit
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

export default function AddNewIndustryStep5({ onPrev, onSubmit }) {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      {/* Layout Grid: Form Container (left) & Sidebar Guides (right) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 5 Review & Confirm Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review & Confirm</h2>
            <p className="text-xs text-slate-500">Please review all information below before adding this industry.</p>
          </div>

          {/* Summary Review Sections Grid */}
          <div className="grid grid-cols-4 gap-4 text-xs">
            
            {/* Basic Information Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Basic Information</span>
                <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Industry / Company Name</span>
                  <span className="font-semibold text-slate-900">TechNova Solutions Pty Ltd</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Industry Type</span>
                  <span className="font-semibold text-slate-900">Information Technology</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Industry / Company Code</span>
                  <span className="font-semibold text-slate-900">TNOVA2024</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Website</span>
                  <span className="font-semibold text-indigo-600 truncate block">https://www.technova.com.au</span>
                </div>
              </div>
            </div>

            {/* Contact Details Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Contact Details</span>
                <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Primary Contact Name</span>
                  <span className="font-semibold text-slate-900">James Wilson</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Job Title</span>
                  <span className="font-semibold text-slate-900">Partnership Manager</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-indigo-600 truncate block">james.wilson@technova.com.au</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <span className="font-semibold text-slate-900">+61 2 1234 5678</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile Number</span>
                  <span className="font-semibold text-slate-900">+61 412 345 678</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Alternative Email</span>
                  <span className="font-semibold text-indigo-600 truncate block">partnerships@technova.com.au</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department / Division</span>
                  <span className="font-semibold text-slate-900">Corporate Partnerships</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Best Time to Contact</span>
                  <span className="font-semibold text-slate-900">09:00 AM – 05:00 PM (AEST)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Primary Contact Preference</span>
                  <span className="font-semibold text-slate-900">Email</span>
                </div>
              </div>
            </div>

            {/* Address & Location Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Address & Location</span>
                <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Registered Address Line 1</span>
                  <span className="font-semibold text-slate-900">Level 3, 20 Martin Place</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registered Address Line 2</span>
                  <span className="font-semibold text-slate-900">Sydney NSW 2000</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-slate-400 block">Suburb / City</span>
                    <span className="font-semibold text-slate-900">Sydney</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">State / Territory</span>
                    <span className="font-semibold text-slate-900">New South Wales (NSW)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-slate-400 block">Postcode</span>
                    <span className="font-semibold text-slate-900">2000</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Country</span>
                    <span className="font-semibold text-slate-900">Australia</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block">Location on Map</span>
                  <span className="font-semibold text-indigo-600 block">20 Martin Place, Sydney NSW 2000, Australia</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Service Areas</span>
                  <span className="font-semibold text-slate-900">New South Wales (NSW)</span>
                </div>
              </div>
            </div>

            {/* Industry Details Review Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900">Industry Details</span>
                <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Industry Sector</span>
                  <span className="font-semibold text-slate-900">Information Technology & Services</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Company Size</span>
                  <span className="font-semibold text-slate-900">251 – 500 Employees</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Year Established</span>
                  <span className="font-semibold text-slate-900">2010</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ABN / ACN</span>
                  <span className="font-semibold text-slate-900">12 345 678 901</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Services / Products Offered</span>
                  <span className="font-semibold text-slate-900">Software Development, Mobile App Development, IT Consulting, Cloud Solutions, Cybersecurity</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Industries Served</span>
                  <span className="font-semibold text-slate-900">Healthcare, Education, Finance, Retail</span>
                </div>
                <div>
                  <span className="text-slate-400 block">About the Industry / Company</span>
                  <span className="font-semibold text-slate-900">We deliver innovative technology solutions and consulting services that help businesses transform, grow and stay ahead in a digital world.</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Key Achievements / Highlights</span>
                  <span className="font-semibold text-slate-900">ISO 27001 Certified, Microsoft Gold Partner, AWS Advanced Consulting Partner.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Status Callout & Confirmation Checkbox */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">You're all set!</h4>
                <p className="text-[11px] text-slate-600">All information looks accurate and complete. You can now add this industry to your network.</p>
              </div>
            </div>

            <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-indigo-100">
                📄
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Summary</h4>
                <p className="text-[11px] text-slate-600">Please confirm that all the information provided is accurate and complete.</p>
              </div>
            </div>
          </div>

          {/* Checkboxes Agreement Section */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-xs font-semibold text-slate-900">I confirm that the above information is correct to the best of my knowledge.</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-xs font-medium text-slate-700">Yes, all information is correct</span>
            </label>
          </div>

          {/* Footer Form Action Buttons */}
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

        {/* Right Column: Progress & Checklist Widgets */}
        <IndustryProgressPanel currentStep={5} />

      </div>
    </div>
  );
}