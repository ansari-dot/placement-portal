import React from 'react';
import { Upload, FileText, ArrowRight, HelpCircle, ExternalLink, Calendar } from 'lucide-react';

export default function AddRtoStep1({ onNext, onCancel, onSaveDraft, formData, updateFormData, showToast, toast }) {
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
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

      {/* Stepper Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</div><span className="text-xs font-bold text-slate-900">Basic Information</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">2</div><span className="text-xs font-bold text-slate-400">Contact Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">3</div><span className="text-xs font-bold text-slate-400">Address & Location</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">4</div><span className="text-xs font-bold text-slate-400">Partnership Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">5</div><span className="text-xs font-bold text-slate-400">Review & Confirm</span></div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Basic Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter the basic details of the Registered Training Organisation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">RTO Name <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="Enter full RTO name" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">RTO Code <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="Enter RTO code (e.g. RTO-12345)" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <p className="text-[10px] text-slate-400">Must be unique and valid</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">RTO Type <span className="text-rose-500">*</span></label>
              <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none">
                <option>Select RTO type</option>
                <option>Registered Training Organisation</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">CRICOS Provider Code (if applicable)</label>
              <input type="text" placeholder="Enter CRICOS provider code" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ABN <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="Enter ABN (e.g. 12 345 678 901)" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
              <p className="text-[10px] text-slate-400">Must be a valid Australian Business Number</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ACN (if applicable)</label>
              <input type="text" placeholder="Enter ACN" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Website</label>
              <input type="text" placeholder="https://www.example.edu.au" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Year Established</label>
              <input type="text" placeholder="Select year established" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Short Description <span className="text-rose-500">*</span></label>
            <textarea rows={3} placeholder="Enter a brief description about the RTO, its mission, and key programs offered..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"></textarea>
            <div className="flex justify-end text-[10px] text-slate-400">0/500</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">RTO Logo</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center space-y-2">
                <Upload size={20} className="text-blue-600" />
                <p className="text-xs font-semibold text-slate-700">Click to upload <span className="font-normal text-slate-500">or drag and drop</span></p>
                <p className="text-[10px] text-slate-400">PNG, JPG or SVG (Max. 2MB)</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Registration Certificate (Optional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center space-y-2">
                <Upload size={20} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-600">Upload certificate</p>
                <p className="text-[10px] text-slate-400">PDF, JPG or PNG (Max. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button onClick={onCancel} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <div className="flex items-center space-x-3">
              <button onClick={onSaveDraft} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                <FileText size={14} /><span>Save as Draft</span>
              </button>
              <button onClick={onNext} className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition-all duration-500 cursor-pointer">
                <span>Next</span><ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-800">RTO Information Checklist</h4>
            <p className="text-[11px] text-slate-500">Please ensure you have the following information ready:</p>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center space-x-2 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span>RTO legal name and code</span></li>
              <li className="flex items-center space-x-2 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span>ABN and ACN (if applicable)</span></li>
              <li className="flex items-center space-x-2 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span>Contact details</span></li>
              <li className="flex items-center space-x-2 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span>Registered address</span></li>
              <li className="flex items-center space-x-2 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span><span>Partnership information</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}