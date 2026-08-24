import { useState } from 'react';
import {
  Building2, Search, ChevronDown, Car, Train, Users, MapPin, Clock, Info
} from 'lucide-react';

const rtoList = [
  'AI Global Institute',
  'Bright Futures',
  'Kingsford Institute',
  'Victoria Training',
  'Skill Australia',
  'Northern College',
  'Australian Learning',
  'Sydney City College',
  'Future Skills',
  'Melbourne Institute of Technology',
  'Other',
];

const courseOptions = [
  'Information Technology',
  'Business',
  'Accounting',
  'Nursing',
  'Engineering',
  'Marketing',
  'Project Management',
  'Human Resources',
  'Aged Care',
  'Early Childhood Education',
  'Hospitality',
  'Leadership & Management',
  'Other',
];

const priorities = [
  'High', 'Medium', 'Low', 'Urgent',
];

const sources = [
  'RTO Referral', 'Walk-in', 'Website', 'Social Media', 'Referral', 'Agent', 'Other',
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const industries = [
  'Information Technology', 'Healthcare', 'Accounting & Finance', 'Engineering',
  'Marketing & Communications', 'Education', 'Hospitality', 'Construction',
  'Retail', 'Administration', 'Other',
];

const timeSlots = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition ${
    hasError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200'
  }`;

const selectClass = (hasError) =>
  `w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs appearance-none focus:outline-none focus:border-blue-600 transition ${
    hasError
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-100 text-slate-800'
      : 'border-slate-200 text-slate-800'
  }`;

export default function RtoSourceForm({ formData, updateField, updateFields, errors }) {
  const [selectedDays, setSelectedDays] = useState(formData.availabilityDays || {});

  const toggleDay = (day) => {
    const newDays = { ...selectedDays, [day]: !selectedDays[day] };
    setSelectedDays(newDays);
    updateFields({ availabilityDays: newDays });
  };

  return (
    <div className="w-full font-sans">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">RTO & Source</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Select the RTO, source and placement preferences for the student.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Section: Preferred Industry Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Industry <span className="text-blue-600 font-normal">(Select one or more)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                'Aged Care',
                'Disability Centre',
                'Childcare/ECEC',
                'Information Technology',
                'Healthcare & Nursing',
                'Hospitality',
                'Business & Administration',
                'Other'
              ].map((ind) => {
                const currentList = Array.isArray(formData.preferredIndustry)
                  ? formData.preferredIndustry
                  : typeof formData.preferredIndustry === 'string' && formData.preferredIndustry
                  ? formData.preferredIndustry.split(',').map(s => s.trim())
                  : [];
                const isChecked = currentList.includes(ind);

                const handleToggle = () => {
                  let updated;
                  if (isChecked) {
                    updated = currentList.filter(i => i !== ind);
                  } else {
                    updated = [...currentList, ind];
                  }
                  updateField('preferredIndustry', updated);
                };

                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={handleToggle}
                    className={`p-3 rounded-xl border flex items-center justify-between transition text-xs font-medium ${
                      isChecked
                        ? 'bg-blue-50/80 border-blue-600 text-blue-700 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{ind}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Example: Aged Care, Disability Centre, or both.</p>
          </div>

          {/* Row 2: Transport, Preferred Placement Location, Placement Radius, Internship Priority */}
          <div className="grid grid-cols-4 gap-5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transport (optional)</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => updateField('transport', 'vehicle')}
                  className={`flex-1 py-2.5 flex flex-col items-center justify-center space-y-1 transition ${formData.transport === 'vehicle' ? 'bg-blue-50/80 text-blue-600 border-r border-blue-100 font-bold' : 'text-slate-400 hover:text-slate-600 border-r border-slate-200'}`}
                >
                  <Car size={16} />
                  <span className="text-[10px]">Own Vehicle</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('transport', 'public')}
                  className={`flex-1 py-2.5 flex flex-col items-center justify-center space-y-1 transition ${formData.transport === 'public' ? 'bg-blue-50/80 text-blue-600 border-r border-blue-100 font-bold' : 'text-slate-400 hover:text-slate-600 border-r border-slate-200'}`}
                >
                  <Train size={16} />
                  <span className="text-[10px]">Public Transport</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('transport', 'both')}
                  className={`flex-1 py-2.5 flex flex-col items-center justify-center space-y-1 transition ${formData.transport === 'both' ? 'bg-blue-50/80 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Users size={16} />
                  <span className="text-[10px]">Both</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Placement Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter suburb, city or postcode"
                  value={formData.preferredLocation}
                  onChange={(e) => updateField('preferredLocation', e.target.value)}
                  className={`${inputClass()} pl-3.5 pr-9`}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Placement Radius (km)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter radius"
                  value={formData.placementRadius}
                  onChange={(e) => updateField('placementRadius', e.target.value)}
                  className={`${inputClass()} pr-10`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-medium">km</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internship Priority (optional)</label>
              <div className="relative">
                <select
                  value={formData.internshipPriority || 'Normal'}
                  onChange={(e) => updateField('internshipPriority', e.target.value)}
                  className={selectClass()}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Availability - Days, Availability - Hours, Willing to Relocate */}
          <div className="grid grid-cols-12 gap-5 items-start">
            <div className="col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability - Days (optional)</label>
              <div className="flex space-x-2">
                {daysOfWeek.map((day) => {
                  const active = !!selectedDays[day];
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`flex-1 py-2 px-1 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-bold">{day}</span>
                      <input type="checkbox" checked={active} onChange={() => {}} className="w-3 h-3 accent-white cursor-pointer" />
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Select the days the student is available</p>
              {errors.availabilityDays && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.availabilityDays}</p>}
            </div>

            <div className="col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability - Hours (optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Clock size={14} />
                  </span>
                  <select
                    value={formData.availabilityFrom}
                    onChange={(e) => updateField('availabilityFrom', e.target.value)}
                    className={`${selectClass(errors.availabilityFrom)} pl-9 pr-7`}
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown size={12} />
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Clock size={14} />
                  </span>
                  <select
                    value={formData.availabilityTo}
                    onChange={(e) => updateField('availabilityTo', e.target.value)}
                    className={`${selectClass(errors.availabilityTo)} pl-9 pr-7`}
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown size={12} />
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Daily availability time</p>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Willing to Relocate</label>
              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="relocate"
                    checked={formData.willingToRelocate === 'Yes'}
                    onChange={() => updateField('willingToRelocate', 'Yes')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="relocate"
                    checked={formData.willingToRelocate === 'No'}
                    onChange={() => updateField('willingToRelocate', 'No')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Placement Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Placement Notes (optional)</label>
            </div>
            <div className="relative">
              <textarea
                rows="4"
                maxLength={500}
                placeholder="Enter any preferences, notes or additional information that may help in placement"
                value={formData.placementNotes}
                onChange={(e) => updateField('placementNotes', e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition resize-none"
              ></textarea>
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium">
                {formData.placementNotes.length} / 500
              </div>
            </div>
          </div>

          {/* Required Fields Footer Info Banner */}
          <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center space-x-3 text-xs text-slate-600">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>Fields marked with <span className="text-rose-500 font-bold">*</span> are required.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
