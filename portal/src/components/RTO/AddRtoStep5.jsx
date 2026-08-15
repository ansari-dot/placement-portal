import React from 'react';
import { FileText, Check } from 'lucide-react';

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

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Basic Information</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Contact Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Address & Location</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"><Check size={14} /></div><span className="text-xs font-bold text-slate-400">Partnership Details</span></div>
        <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">5</div><span className="text-xs font-bold text-slate-900">Review & Confirm</span></div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Review & Confirm</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review all information before creating the new RTO. You can go back and edit any section if needed.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-800">Summary Status: Ready for Creation</p>
            <p className="text-slate-600">All required fields have been successfully filled across all 4 steps.</p>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button onClick={onPrev} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Previous</button>
            <div className="flex items-center space-x-3">
              <button onClick={onSaveDraft} className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                <FileText size={14} /><span>Save as Draft</span>
              </button>
              <button onClick={onSubmit} className="px-6 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-500 cursor-pointer">
                Create RTO
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-800">Setup Checklist</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>1. Basic Information</span><span>Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>2. Contact Details</span><span>Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>3. Address & Location</span><span>Completed</span></div>
              <div className="flex items-center justify-between font-medium text-emerald-600"><span>4. Partnership Details</span><span>Completed</span></div>
              <div className="flex items-center justify-between font-bold text-blue-600 bg-blue-50 p-2 rounded-lg"><span>5. Review & Confirm</span><span>In Progress</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}