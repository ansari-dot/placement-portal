import React, { useState } from 'react';
import { 
  ChevronDown, 
  MapPin, ArrowRight, ArrowLeft, 
  Bookmark, AlertCircle
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

const AU_STATES = [
  'New South Wales (NSW)',
  'Victoria (VIC)',
  'Queensland (QLD)',
  'Western Australia (WA)',
  'South Australia (SA)',
  'Tasmania (TAS)',
  'Australian Capital Territory (ACT)',
  'Northern Territory (NT)',
];

export default function AddNewIndustryStep3({ onNext, onPrev, formData, updateFormData }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.suburb?.trim()) newErrors.suburb = 'Suburb / City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    return newErrors;
  };

  const handleNext = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onNext();
  };

  const inputBase = "w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm transition-colors";
  const inputClass = (field) => `${inputBase} ${errors[field] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`;
  const selectClass = (field) => `w-full appearance-none bg-white border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer transition-colors ${errors[field] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`;

  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 3 Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Address & Location</h2>
            <p className="text-xs text-slate-500">Add the registered address and location details for this industry.</p>
          </div>

          {/* Address Lines */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Address <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                placeholder="e.g. Level 3, 20 Martin Place"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className={inputClass('address')}
              />
              {errors.address && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.address}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Address Line 2
              </label>
              <input 
                type="text"
                placeholder="e.g. Suite 401"
                value={formData.addressLine2 || ''}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className={inputClass('addressLine2')}
              />
            </div>
          </div>

          {/* Suburb, State, Postcode, Country */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Suburb / City <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                placeholder="e.g. Sydney"
                value={formData.suburb || ''}
                onChange={(e) => handleChange('suburb', e.target.value)}
                className={inputClass('suburb')}
              />
              {errors.suburb && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.suburb}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                State / Territory <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={selectClass('state')}
                >
                  <option value="">Select state</option>
                  {AU_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.state && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.state}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Postcode
              </label>
              <input 
                type="text"
                placeholder="e.g. 2000"
                value={formData.postCode || ''}
                onChange={(e) => handleChange('postCode', e.target.value)}
                className={inputClass('postCode')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Country
              </label>
              <div className="relative">
                <select
                  value={formData.country || 'Australia'}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className={selectClass('country')}
                >
                  <option>Australia</option>
                  <option>New Zealand</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Other</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Map visual (static) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Location Preview
            </label>
            <p className="text-[11px] text-slate-400">Based on the address entered above.</p>

            <div className="w-full h-48 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative">
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-50/40">
                <div className="absolute top-12 left-1/4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {formData.suburb || 'Suburb'}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                  {(formData.address || formData.suburb) && (
                    <div className="mt-2 bg-white/90 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-lg shadow text-center max-w-[180px]">
                      {[formData.address, formData.suburb, formData.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
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
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <IndustryProgressPanel currentStep={3} />

      </div>
    </div>
  );
}
