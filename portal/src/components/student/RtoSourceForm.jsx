import { useState, useEffect } from 'react';
import {
  FileText, ChevronDown, MapPin, Clock, Info
} from 'lucide-react';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const visaStatuses = [
  'Student Visa (500)', 'Visitor Visa', 'Working Holiday Visa', 'Permanent Resident',
  'Citizen', 'Temporary Graduate (485)', 'Partner Visa', 'Bridging Visa', 'Other',
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
  const [isPlacementSiteOpen, setIsPlacementSiteOpen] = useState(false);

  // Auto-fill preferredLocation from student's full address whenever address fields change
  useEffect(() => {
    // Priority: full address field → suburb + state → empty
    const autoLoc =
      formData.address ||
      [formData.suburb, formData.state].filter(Boolean).join(', ') ||
      '';
    updateField('preferredLocation', autoLoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.address, formData.suburb, formData.state]);

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
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Additional Information</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Select industry preferences, transport licensing, compliance documents and placement details.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Section: Preferred Industry & Placement Site */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Industry
              </label>
              <div className="relative">
                <select
                  value={formData.preferredIndustry || ''}
                  onChange={(e) => {
                    updateField('preferredIndustry', e.target.value);
                    updateField('placementSite', []); // Reset to empty array on change
                  }}
                  className={selectClass()}
                >
                  <option value="">Select industry</option>
                  <option value="Individual Support">Individual Support</option>
                  <option value="ECEC">ECEC</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            {formData.preferredIndustry && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Placement Sites (Select multiple)
                </label>
                <div className="relative">
                  <div
                    className={`${selectClass()} flex items-center justify-between cursor-pointer min-h-[38px]`}
                    onClick={() => setIsPlacementSiteOpen(!isPlacementSiteOpen)}
                  >
                    <span className="truncate pr-6">
                      {Array.isArray(formData.placementSite) && formData.placementSite.length > 0
                        ? formData.placementSite.join(', ')
                        : 'Select placement sites'}
                    </span>
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </span>
                  </div>

                  {isPlacementSiteOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {formData.preferredIndustry === 'Individual Support' && (
                          <>
                            {[
                              { label: 'Residential aged care facilities', options: ['Nursing homes', 'Residential aged-care homes', 'Aged-care villages with care services', 'Dementia/behavioural support units'] },
                              { label: 'Home care providers', options: ['In-home aged care', 'Personal care services', 'Domestic assistance', 'Community nursing/home support providers'] },
                              { label: 'Disability support providers', options: ['NDIS providers', 'Supported Independent Living (SIL)', 'Short-Term Accommodation (STA)', 'Disability group homes', 'Respite services', 'Community participation programs'] },
                              { label: 'Community care organisations', options: ['Community support centres', 'Community access programs', 'Social support services', 'Day programs for elderly or people with disability'] },
                              { label: 'Wellness / day centres', options: ["Seniors' wellness centres", 'Community wellness centres', 'Day respite centres', 'Adult day programs'] },
                              { label: 'Mental health / psychosocial support services', options: ['Community-based support organisations', 'Psychosocial disability services', "Supported accommodation where the student's qualification requirements can be met"] },
                            ].map((group) => (
                              <div key={group.label} className="mb-2">
                                <div className="text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-50 rounded uppercase tracking-wider">{group.label}</div>
                                {group.options.map((opt) => {
                                  const currentList = Array.isArray(formData.placementSite) ? formData.placementSite : [];
                                  const isChecked = currentList.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700 font-medium">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            updateField('placementSite', [...currentList, opt]);
                                          } else {
                                            updateField('placementSite', currentList.filter(item => item !== opt));
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ))}
                          </>
                        )}
                        {formData.preferredIndustry === 'ECEC' && (
                          <>
                            {[
                              { 
                                label: 'Approved ECEC Placement Sites', 
                                options: [
                                  'Long Day Care Centres',
                                  'Kindergartens / Preschools',
                                  'Early Learning Centres',
                                  'Occasional Care Centres',
                                  'Outside School Hours Care (OSHC)',
                                  'Family Day Care Services',
                                  "Community Children's Services"
                                ] 
                              },
                              { 
                                label: 'Common Placement Hosts', 
                                options: [
                                  'Story House Early Learning',
                                  'Goodstart Early Learning',
                                  'Affinity Education Group',
                                  'G8 Education',
                                  'Guardian Childcare & Education',
                                  'Busy Bees Australia'
                                ] 
                              },
                              { 
                                label: 'Generally Not Suitable', 
                                options: [
                                  'Primary schools (unless specifically approved for OSHC programs)',
                                  'Tutoring centres',
                                  'Playgroups without an approved childcare service',
                                  'Babysitting services',
                                  'Unlicensed childcare settings'
                                ] 
                              }
                            ].map((group) => (
                              <div key={group.label} className="mb-2">
                                <div className="text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-50 rounded uppercase tracking-wider">{group.label}</div>
                                {group.options.map((opt) => {
                                  const currentList = Array.isArray(formData.placementSite) ? formData.placementSite : [];
                                  const isChecked = currentList.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700 font-medium">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            updateField('placementSite', [...currentList, opt]);
                                          } else {
                                            updateField('placementSite', currentList.filter(item => item !== opt));
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Driver's Licence / Transport, Licence Number (if Yes), Preferred Placement Location, Visa Status */}
          <div className={`grid ${formData.transport === 'Yes' ? 'grid-cols-4' : 'grid-cols-3'} gap-5 items-end`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Do you have a valid Driver's Licence / Transport?</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white h-[38px]">
                <button
                  type="button"
                  onClick={() => updateField('transport', 'Yes')}
                  className={`flex-1 flex items-center justify-center space-y-1 transition text-xs font-semibold ${
                    formData.transport === 'Yes'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 border-r border-slate-200'
                  }`}
                >
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('transport', 'No');
                    updateField('licenceNumber', '');
                  }}
                  className={`flex-1 flex items-center justify-center space-y-1 transition text-xs font-semibold ${
                    formData.transport === 'No'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>No</span>
                </button>
              </div>
            </div>

            {formData.transport === 'Yes' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Licence Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter driver licence number"
                  value={formData.licenceNumber || ''}
                  onChange={(e) => updateField('licenceNumber', e.target.value)}
                  className={inputClass(errors?.licenceNumber)}
                  autoFocus
                />
                {errors?.licenceNumber && (
                  <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.licenceNumber}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Placement Location
                <span className="ml-1.5 text-[10px] text-blue-500 font-normal">(auto-filled from address)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Suburb, city or postcode"
                  value={formData.preferredLocation || ''}
                  onChange={(e) => updateField('preferredLocation', e.target.value)}
                  className={`${inputClass()} pl-3.5 pr-9`}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={16} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Visa Status <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.visaStatus || ''}
                  onChange={(e) => updateField('visaStatus', e.target.value)}
                  className={selectClass(errors?.visaStatus)}
                >
                  <option value="">Select visa status</option>
                  {visaStatuses.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors?.visaStatus && (
                <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.visaStatus}</p>
              )}
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
