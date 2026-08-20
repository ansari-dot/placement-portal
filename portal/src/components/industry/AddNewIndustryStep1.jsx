import React from 'react';
import { 
  ChevronDown, UploadCloud, 
  Globe, ArrowRight, Bookmark
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

export default function AddNewIndustryStep1({ onNext, onCancel, formData, updateFormData }) {
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      {/* Layout Grid: Form Container (left) & Sidebar Guides (right) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 1 Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
            <p className="text-xs text-slate-500">Provide the basic details about the industry.</p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Industry / Company Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry / Company Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter industry or company name" 
                value={formData.industryName || ''}
                onChange={(e) => handleChange('industryName', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* Industry Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select 
                  value={formData.industryType || ''}
                  onChange={(e) => handleChange('industryType', e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                >
                  <option value="">Select industry type</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Construction">Construction</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Industry / Company Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry / Company Code <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter unique industry code" 
                value={formData.industryCode || ''}
                onChange={(e) => handleChange('industryCode', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="https://www.example.com" 
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

          </div>

          {/* Upload Boxes Row */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            
            {/* Industry Logo Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Logo
              </label>
              <p className="text-[11px] text-slate-400">Upload a logo to represent the industry. (JPG, PNG or SVG. Max size 2MB)</p>
              
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  <span className="text-indigo-600 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG up to 2MB</p>
              </div>
            </div>

            {/* Industry Banner (Optional) Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Banner (Optional)
              </label>
              <p className="text-[11px] text-slate-400">Upload a banner image for the industry profile. (JPG, PNG. Max size 5MB)</p>
              
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  <span className="text-indigo-600 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

          </div>

          {/* Short Description */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Short Description <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400">Provide a brief overview of the industry / company.</p>
            
            <div className="relative">
              <textarea 
                rows="4" 
                placeholder="Write a short description..." 
                value={formData.shortDescription || ''}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm resize-none"
              ></textarea>
              <span className="absolute right-3 bottom-3 text-[11px] text-slate-400">
                {(formData.shortDescription || '').length}/250 characters
              </span>
            </div>
          </div>

          {/* Footer Form Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button 
              onClick={onCancel}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              Cancel
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
        <IndustryProgressPanel currentStep={1} />

      </div>
    </div>
  );
}