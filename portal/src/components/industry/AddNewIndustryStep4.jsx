import React from 'react';
import { 
  ChevronDown, 
  Calendar, Globe, ArrowRight, ArrowLeft, 
  Bookmark, X
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

export default function AddNewIndustryStep4({ onNext, onPrev }) {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      {/* Layout Grid: Form Container (left) & Sidebar Guides (right) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 4 Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Industry Details</h2>
            <p className="text-xs text-slate-500">Provide additional details about the industry and its operations.</p>
          </div>

          {/* Form Fields Grid - Dropdowns */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Type (Category) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                  <option>Information Technology</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Sector <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                  <option>Information Technology & Services</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Company Size <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                  <option>251 – 500 Employees</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Form Fields Grid - Established, ABN, Website */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Year Established
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  defaultValue="2010" 
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                ABN / ACN (Optional)
              </label>
              <input 
                type="text" 
                defaultValue="12 345 678 901" 
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  defaultValue="https://www.example.com" 
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Services / Products Offered */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Services / Products Offered <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400">Select all that apply.</p>
            
            <div className="relative">
              <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex items-center flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Software Development <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Mobile App Development <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  IT Consulting <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Cloud Solutions <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Cybersecurity <X className="w-3 h-3 cursor-pointer" />
                </span>
              </div>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Industries Served (Optional) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Industries Served (Optional)
            </label>
            <p className="text-[11px] text-slate-400">Select the industries your company primarily serves.</p>
            
            <div className="relative">
              <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex items-center flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Healthcare <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Education <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Finance <X className="w-3 h-3 cursor-pointer" />
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  Retail <X className="w-3 h-3 cursor-pointer" />
                </span>
              </div>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* About the Industry / Company */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              About the Industry / Company <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400">Provide a brief description about the industry, its mission and what it does.</p>
            
            <div className="relative">
              <textarea 
                rows={4}
                defaultValue="We deliver innovative technology solutions and consulting services that help businesses transform, grow and stay ahead in a digital world."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] text-slate-400">
                124/500 characters
              </span>
            </div>
          </div>

          {/* Key Achievements / Highlights (Optional) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Key Achievements / Highlights (Optional)
            </label>
            <p className="text-[11px] text-slate-400">Add key achievements, certifications or recognitions.</p>
            
            <div className="relative">
              <textarea 
                rows={3}
                defaultValue="ISO 27001 Certified, Microsoft Gold Partner, AWS Advanced Consulting Partner."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] text-slate-400">
                71/300 characters
              </span>
            </div>
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
                onClick={onNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Progress & Checklist Widgets */}
        <IndustryProgressPanel currentStep={4} />

      </div>
    </div>
  );
}