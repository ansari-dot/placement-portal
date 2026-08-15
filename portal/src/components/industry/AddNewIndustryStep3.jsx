import React from 'react';
import { 
  Search, ChevronDown, 
  MapPin, ArrowRight, ArrowLeft, 
  Bookmark, X
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

export default function AddNewIndustryStep3({ onNext, onPrev }) {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      {/* Layout Grid: Form Container (left) & Sidebar Guides (right) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 3 Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Address & Location</h2>
            <p className="text-xs text-slate-500">Add the registered address and location details for this industry.</p>
          </div>

          {/* Form Fields Grid - Address Lines */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                defaultValue="Level 3, 20 Martin Place" 
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Address Line 2
              </label>
              <input 
                type="text" 
                defaultValue="Sydney NSW 2000" 
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {/* Form Fields Grid - Suburb, State, Postcode, Country */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Suburb / City <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                defaultValue="Sydney" 
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                State / Territory <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                  <option>New South Wales (NSW)</option>
                  <option>Victoria (VIC)</option>
                  <option>Queensland (QLD)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Postcode <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                defaultValue="2000" 
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Country <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                  <option>Australia</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Location on Map */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Location on Map <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400">Search and select the exact location of the industry.</p>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                defaultValue="20 Martin Place, Sydney NSW 2000, Australia" 
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
              />
              <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Interactive Map */}
            <div className="relative w-full h-72 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              {/* Map Graphics Simulation */}
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-50/40">
                <div className="absolute top-12 left-1/4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wynyard</div>
                <div className="absolute top-20 right-1/4 text-[10px] font-semibold text-emerald-800">Royal Botanic Garden Sydney</div>
                <div className="absolute bottom-12 left-1/3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">King Street Wharf</div>
                <div className="absolute bottom-20 right-1/3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">St James</div>
                
                {/* Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Map Zoom Controls */}
              <div className="absolute right-4 bottom-4 flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">+</button>
                <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-700 font-bold">−</button>
                <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-indigo-600 border-t border-slate-200">
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Areas (Optional) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Service Areas (Optional)
            </label>
            <p className="text-[11px] text-slate-400">Select the regions or areas where this industry operates.</p>
            
            <div className="relative">
              <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex items-center flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-100">
                  New South Wales (NSW) <X className="w-3 h-3 cursor-pointer" />
                </span>
                <input 
                  type="text" 
                  placeholder="Select additional areas (if any)" 
                  className="flex-1 bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 outline-none min-w-[200px]"
                />
              </div>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
        <IndustryProgressPanel currentStep={3} />

      </div>
    </div>
  );
}