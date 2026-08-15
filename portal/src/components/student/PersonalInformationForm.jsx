import {
  Users, Calendar, ChevronDown, Info
} from 'lucide-react';

const nationalities = [
  'Australian', 'Afghan', 'Bangladeshi', 'Brazilian', 'British', 'Canadian',
  'Chinese', 'Colombian', 'Egyptian', 'Fijian', 'Filipino', 'French',
  'German', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish',
  'Italian', 'Japanese', 'Kenyan', 'Korean', 'Malaysian', 'Mexican',
  'Nepalese', 'New Zealander', 'Nigerian', 'Pakistani', 'Peruvian',
  'Polish', 'Saudi', 'Singaporean', 'South African', 'Spanish', 'Sri Lankan',
  'Syrian', 'Thai', 'Turkish', 'Ukrainian', 'Vietnamese', 'Zimbabwean',
  'Other',
];

const languages = [
  'English', 'Arabic', 'Bengali', 'Cantonese', 'Chinese', 'Dari',
  'Fijian', 'Filipino', 'French', 'German', 'Greek', 'Gujarati',
  'Hindi', 'Indonesian', 'Italian', 'Japanese', 'Korean', 'Mandarin',
  'Nepali', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi',
  'Russian', 'Sinhala', 'Spanish', 'Swahili', 'Tagalog', 'Tamil',
  'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese',
  'Other',
];

const australianStates = [
  'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA',
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

export default function PersonalInformationForm({ formData, updateField, errors }) {
  return (
    <div className="w-full font-sans">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Enter the basic personal details of the student.</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Row 1: Names */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={inputClass(errors.firstName)}
              />
              {errors.firstName && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Middle Name</label>
              <input
                type="text"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={(e) => updateField('middleName', e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={inputClass(errors.lastName)}
              />
              {errors.lastName && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Name</label>
              <input
                type="text"
                placeholder="Enter preferred name"
                value={formData.preferredName}
                onChange={(e) => updateField('preferredName', e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>

          {/* Row 2: DOB, Gender, Nationality, Language */}
          <div className="grid grid-cols-4 gap-5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Birth <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={`${inputClass(errors.dateOfBirth)} pr-9 [color-scheme:light]`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </span>
              </div>
              {errors.dateOfBirth && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Gender <span className="text-rose-500">*</span></label>
              <div className="flex items-center space-x-4 pt-1">
                {['Male', 'Female', 'Other'].map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="gender"
                      checked={formData.gender === option}
                      onChange={() => updateField('gender', option)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nationality</label>
              <div className="relative">
                <select
                  value={formData.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select nationality</option>
                  {nationalities.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Language</label>
              <div className="relative">
                <select
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className={selectClass()}
                >
                  <option value="">Select language</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Contacts */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
              <input
                type="email"
                placeholder="Enter email address"
                value={formData.emailAddress}
                onChange={(e) => updateField('emailAddress', e.target.value)}
                className={inputClass(errors.emailAddress)}
              />
              {errors.emailAddress && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.emailAddress}</p>}
            </div>

            {/* Phone Number with Flag */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
              <div className={`flex border rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition ${errors.phoneNumber ? 'border-rose-400' : 'border-slate-200'}`}>
                <div className="flex items-center space-x-1 px-2.5 bg-slate-50/50 border-r border-slate-200 text-xs text-slate-700">
                  <span>🇦🇺</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.phoneCode}
                  onChange={(e) => updateField('phoneCode', e.target.value)}
                  className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center"
                />
                <input
                  type="text"
                  placeholder="412 345 678"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>
              {errors.phoneNumber && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alternate Phone</label>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition">
                <div className="flex items-center space-x-1 px-2.5 bg-slate-50/50 border-r border-slate-200 text-xs text-slate-700">
                  <span>🇦🇺</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.altPhoneCode}
                  onChange={(e) => updateField('altPhoneCode', e.target.value)}
                  className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center"
                />
                <input
                  type="text"
                  placeholder="412 345 678"
                  value={formData.alternatePhone}
                  onChange={(e) => updateField('alternatePhone', e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 transition">
                <div className="flex items-center space-x-1 px-2.5 bg-slate-50/50 border-r border-slate-200 text-xs text-slate-700">
                  <span>🇦🇺</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.waPhoneCode}
                  onChange={(e) => updateField('waPhoneCode', e.target.value)}
                  className="w-14 px-1 py-2.5 text-xs text-slate-600 bg-transparent focus:outline-none font-medium text-center"
                />
                <input
                  type="text"
                  placeholder="412 345 678"
                  value={formData.whatsappNumber}
                  onChange={(e) => updateField('whatsappNumber', e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="Enter street address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className={inputClass(errors.address)}
            />
            {errors.address && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.address}</p>}
          </div>

          {/* Row 5: Suburb, State, Post Code, Country */}
          <div className="grid grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Suburb <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter suburb"
                value={formData.suburb}
                onChange={(e) => updateField('suburb', e.target.value)}
                className={inputClass(errors.suburb)}
              />
              {errors.suburb && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.suburb}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">State <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className={selectClass(errors.state)}
                >
                  <option value="">Select state</option>
                  {australianStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors.state && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Post Code <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter post code"
                value={formData.postCode}
                onChange={(e) => updateField('postCode', e.target.value)}
                className={inputClass(errors.postCode)}
              />
              {errors.postCode && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.postCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className={selectClass(errors.country)}
                >
                  <option value="Australia">Australia</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Other">Other</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </span>
              </div>
              {errors.country && <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.country}</p>}
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
