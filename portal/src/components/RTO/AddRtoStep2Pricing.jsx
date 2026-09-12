import React from 'react';
import { 
  DollarSign, Plus, Trash2, ArrowRight, ArrowLeft, FileText, 
  Check, Info, Sparkles, BookOpen, Layers, CheckCircle2 
} from 'lucide-react';

const COURSES = [
  'Individual Support',
  'Early Childhood Education and Care',
  'Hospitality Management',
  'Community Services',
  'Allied Health System',
  'Construction',
  'Other',
];

const COURSE_LEVELS = [
  'Certificate III',
  'Certificate IV',
  'Diploma',
  'Advanced Diploma',
  'Bachelor',
  'Graduate Certificate',
  'Graduate Diploma',
  'Master',
  'Other',
];

export default function AddRtoStep2Pricing({
  onNext,
  onPrev,
  onCancel,
  onSaveDraft,
  formData,
  updateFormData,
  showToast,
}) {
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleAddCoursePricing = () => {
    const current = Array.isArray(formData.coursePricing) ? formData.coursePricing : [];
    updateFormData({
      coursePricing: [
        ...current,
        {
          course: COURSES[0],
          qualification: COURSE_LEVELS[0],
          pricing: 500,
          notes: ''
        }
      ]
    });
  };

  const handleUpdateCoursePricing = (index, field, value) => {
    const current = [...(formData.coursePricing || [])];
    current[index] = { ...current[index], [field]: value };
    updateFormData({ coursePricing: current });
  };

  const handleRemoveCoursePricing = (index) => {
    const current = (formData.coursePricing || []).filter((_, i) => i !== index);
    updateFormData({ coursePricing: current });
  };

  const handleAddDefaultCourses = () => {
    const defaultList = [
      { course: 'Individual Support', qualification: 'Certificate III', pricing: 500, notes: 'Standard per placement' },
      { course: 'Early Childhood Education and Care', qualification: 'Diploma', pricing: 650, notes: 'Childcare placement' },
      { course: 'Community Services', qualification: 'Diploma', pricing: 600, notes: 'Case work placement' },
      { course: 'Hospitality Management', qualification: 'Certificate IV', pricing: 450, notes: 'Commercial cookery/hospitality' },
      { course: 'Allied Health System', qualification: 'Certificate IV', pricing: 700, notes: 'Clinical support' },
      { course: 'Construction', qualification: 'Certificate III', pricing: 550, notes: 'Trade placement' }
    ];
    updateFormData({ coursePricing: defaultList });
    if (showToast) showToast('Standard course pricing matrix populated');
  };

  const totalRatesCount = Array.isArray(formData.coursePricing) ? formData.coursePricing.length : 0;
  const avgPricing = totalRatesCount > 0
    ? Math.round(formData.coursePricing.reduce((sum, item) => sum + (Number(item.pricing) || 0), 0) / totalRatesCount)
    : 0;

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

      {/* Stepper Bar (6 Steps) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            <Check size={14} />
          </div>
          <span className="text-xs font-bold text-slate-400">Basic Info</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">2</div>
          <span className="text-xs font-bold text-slate-900">Course Pricing</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">3</div>
          <span className="text-xs font-bold text-slate-400">Contact Details</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">4</div>
          <span className="text-xs font-bold text-slate-400">Address & Location</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">5</div>
          <span className="text-xs font-bold text-slate-400">Partnership</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">6</div>
          <span className="text-xs font-bold text-slate-400">Review</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <DollarSign size={18} className="text-emerald-600" />
                <span>Course & Qualification Payout / Pricing</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure individual payout rates for each course and certificate qualification.</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddDefaultCourses}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Quick Add Standard</span>
              </button>
              <button
                type="button"
                onClick={handleAddCoursePricing}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Course Rate</span>
              </button>
            </div>
          </div>

          {/* Base / Default Payout Rate Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Default Base Payout Rate</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Applied to any course or qualification not explicitly specified below.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">$ AUD</span>
              <input 
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={formData.payoutRate ?? ''}
                onChange={(e) => handleChange('payoutRate', e.target.value)}
                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Dynamic Course Rates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Configured Rates ({totalRatesCount})</span>
              <span>Matching Student Registration Qualifications</span>
            </div>

            {Array.isArray(formData.coursePricing) && formData.coursePricing.length > 0 ? (
              <div className="space-y-3">
                {formData.coursePricing.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs transition space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Course Selection */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <BookOpen size={11} className="text-blue-600" />
                          <span>Course / Qualification</span>
                        </label>
                        <select 
                          value={item.course || ''}
                          onChange={(e) => handleUpdateCoursePricing(idx, 'course', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {COURSES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Qualification Level */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <Layers size={11} className="text-blue-600" />
                          <span>Certificate Level</span>
                        </label>
                        <select 
                          value={item.qualification || ''}
                          onChange={(e) => handleUpdateCoursePricing(idx, 'qualification', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {COURSE_LEVELS.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pricing Amount */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Payout ($ AUD)
                        </label>
                        <input 
                          type="number"
                          min="0"
                          placeholder="500"
                          value={item.pricing ?? ''}
                          onChange={(e) => handleUpdateCoursePricing(idx, 'pricing', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Notes & Remove Button */}
                      <div className="md:col-span-3 space-y-1 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                          <input 
                            type="text"
                            placeholder="Terms or notes"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateCoursePricing(idx, 'notes', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoursePricing(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                          title="Remove rate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">No Course Rates Configured Yet</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Add course-specific payouts or pre-populate standard vocational courses.</p>
                </div>
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button 
                    type="button" 
                    onClick={handleAddDefaultCourses} 
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
                  >
                    Quick Add Standard Courses
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAddCoursePricing} 
                    className="px-3.5 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Add Custom Rate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button 
              type="button"
              onClick={onPrev} 
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={onSaveDraft} 
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
              >
                <FileText size={14} />
                <span>Save as Draft</span>
              </button>
              <button 
                type="button"
                onClick={onNext} 
                className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2 transition-all duration-500 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Information & Summary Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-xs text-slate-800">Pricing Summary</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Selected Payment Cycle:</span>
                <span className="font-bold text-blue-700">{formData.paymentCycle || 'Placement'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Configured Courses:</span>
                <span className="font-bold text-slate-800">{totalRatesCount} courses</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Average Rate:</span>
                <span className="font-bold text-emerald-600">${avgPricing} AUD</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start space-x-2 text-[11px] text-emerald-800">
              <Info size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>Pricing is linked directly to student enrollment courses during placement allocation.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
