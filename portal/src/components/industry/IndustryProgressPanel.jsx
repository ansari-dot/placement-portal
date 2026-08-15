import React from 'react';
import { Check, PhoneCall, HelpCircle, BookOpenCheck } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 1, label: 'Basic Information' },
  { key: 2, label: 'Contact Details' },
  { key: 3, label: 'Address & Location' },
  { key: 4, label: 'Industry Details' },
  { key: 5, label: 'Review & Confirm' },
];

const STEP_TITLES = {
  1: 'Basic Information',
  2: 'Contact Details',
  3: 'Address & Location',
  4: 'Industry Details',
  5: 'Review & Confirm',
};

const STEP_MESSAGES = {
  1: 'This basic information helps us identify and categorize the industry and build strong partnerships for student placements.',
  2: 'Accurate contact information ensures smooth communication and helps us build strong relationships with industry partners.',
  3: 'Accurate address and location help students and partners find and connect with your organisation easily.',
  4: 'Providing industry details helps us better understand your organization and match students with the right opportunities.',
  5: 'Review all details carefully. Once you confirm and add the industry, you can start connecting with RTOs and students.',
};

const STEP_HEADINGS = {
  1: 'Why is this important?',
  2: 'Why is this important?',
  3: 'Why is this important?',
  4: 'Why is this important?',
  5: 'Almost there!',
};

export default function IndustryProgressPanel({ currentStep }) {
  const percentage = currentStep === 5 ? 100 : (currentStep - 1) * 20;

  return (
    <div className="col-span-3 space-y-6">
      {/* Industry Setup Progress Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Industry Setup Progress</h3>

        <div className="flex items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600 flex items-center justify-center font-bold text-sm text-slate-900 shadow-sm bg-indigo-50/20 flex-shrink-0">
            {percentage}%
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Step {currentStep} of 5</h4>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">{STEP_TITLES[currentStep]}</p>
            {currentStep === 5 && (
              <p className="text-[10px] text-slate-500 mt-0.5">Great! You've completed all the steps.</p>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Setup Checklist Widget */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Setup Checklist</h3>

        <div className="space-y-2 text-xs">
          {CHECKLIST_ITEMS.map((item) => {
            const isCompleted = item.key < currentStep;
            const isActive = item.key === currentStep;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50/60 border border-indigo-100 font-medium text-slate-900'
                    : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.key}
                  </div>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isActive
                      ? 'text-indigo-600'
                      : isCompleted
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                  }`}
                >
                  {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Informational Callout Card */}
      <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 flex gap-3 text-slate-700">
        <div className="text-sky-600 flex-shrink-0 mt-0.5">
          {currentStep === 5 ? <BookOpenCheck className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900">{STEP_HEADINGS[currentStep]}</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">{STEP_MESSAGES[currentStep]}</p>
        </div>
      </div>

      {/* Need Help Support Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
          <PhoneCall className="w-4 h-4 text-indigo-600" />
          <span>Need Help?</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Our support team is here to help you add a new industry.
        </p>
        <button className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5">
          <span>Contact Support</span>
          <span className="text-[10px]">↗</span>
        </button>
      </div>
    </div>
  );
}