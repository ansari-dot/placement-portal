import React, { useState } from 'react';
import { 
  ChevronDown, 
  User, Mail, Phone, Building, Clock, 
  ArrowRight, ArrowLeft, Bookmark, AlertCircle
} from 'lucide-react';
import IndustryProgressPanel from './IndustryProgressPanel';

export default function AddNewIndustryStep2({ onNext, onPrev, formData, updateFormData }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.contactPersonName?.trim()) newErrors.contactPersonName = 'Contact person name is required';
    if (!formData.contactEmail?.trim()) newErrors.contactEmail = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) newErrors.contactEmail = 'Enter a valid email address';
    if (!formData.contactPhone?.trim()) newErrors.contactPhone = 'Phone number is required';
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
  const inputWithIconClass = (field) => `${inputBase} pl-10 ${errors[field] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`;

  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Step 2 Form */}
        <div className="col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900">Contact Details</h2>
            <p className="text-xs text-slate-500">Add primary contact information for this industry.</p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Primary Contact Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Primary Contact Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="e.g. James Wilson"
                  value={formData.contactPersonName || ''}
                  onChange={(e) => handleChange('contactPersonName', e.target.value)}
                  className={inputWithIconClass('contactPersonName')}
                />
              </div>
              {errors.contactPersonName && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.contactPersonName}
                </p>
              )}
            </div>

            {/* Job Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Job Title
              </label>
              <input 
                type="text"
                placeholder="e.g. Partnership Manager"
                value={formData.contactJobTitle || ''}
                onChange={(e) => handleChange('contactJobTitle', e.target.value)}
                className={inputClass('contactJobTitle')}
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email"
                  placeholder="e.g. james@company.com.au"
                  value={formData.contactEmail || ''}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className={inputWithIconClass('contactEmail')}
                />
              </div>
              {errors.contactEmail && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.contactEmail}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="e.g. 03 9123 4567"
                  value={formData.contactPhone || ''}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className={inputWithIconClass('contactPhone')}
                />
              </div>
              {errors.contactPhone && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.contactPhone}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="e.g. +61 412 345 678"
                  value={formData.contactMobile || ''}
                  onChange={(e) => handleChange('contactMobile', e.target.value)}
                  className={inputWithIconClass('contactMobile')}
                />
              </div>
            </div>

            {/* Alternative Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Alternative Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="e.g. partnerships@company.com.au"
                  value={formData.contactAltEmail || ''}
                  onChange={(e) => handleChange('contactAltEmail', e.target.value)}
                  className={inputWithIconClass('contactAltEmail')}
                />
              </div>
            </div>

          </div>

          {/* Department / Division */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Department / Division
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="e.g. Corporate Partnerships"
                value={formData.contactDepartment || ''}
                onChange={(e) => handleChange('contactDepartment', e.target.value)}
                className={inputWithIconClass('contactDepartment')}
              />
            </div>
          </div>

          {/* Primary Contact Preference */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Primary Contact Preference
            </label>
            <p className="text-[11px] text-slate-400">Choose the preferred method of communication.</p>
            
            <div className="grid grid-cols-4 gap-3">
              {['Email', 'Phone', 'Mobile', 'Any'].map((pref) => (
                <label
                  key={pref}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg cursor-pointer border transition-colors ${
                    (formData.contactPreference || 'Email') === pref
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="preference"
                    checked={(formData.contactPreference || 'Email') === pref}
                    onChange={() => handleChange('contactPreference', pref)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-xs font-${(formData.contactPreference || 'Email') === pref ? 'semibold text-slate-900' : 'medium text-slate-700'}`}>{pref}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Best Time to Contact */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Best Time to Contact
            </label>
            <p className="text-[11px] text-slate-400">Select the preferred time window to reach out.</p>
            
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={formData.bestTimeToContact || '09:00 AM – 05:00 PM (AEST)'}
                onChange={(e) => handleChange('bestTimeToContact', e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option>09:00 AM – 05:00 PM (AEST)</option>
                <option>08:00 AM – 12:00 PM (AEST)</option>
                <option>01:00 PM – 06:00 PM (AEST)</option>
              </select>
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
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Progress & Checklist Widgets */}
        <IndustryProgressPanel currentStep={2} />

      </div>
    </div>
  );
}