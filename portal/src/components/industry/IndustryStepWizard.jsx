import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Basic Information' },
  { label: 'Contact Details' },
  { label: 'Address & Location' },
  { label: 'Industry Details' },
  { label: 'Review & Confirm' },
];

export default function IndustryStepWizard({ currentStep }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between max-w-4xl mx-auto relative">
        {/* Connecting Line background */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>

        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
              {isCompleted ? (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5" />
                </div>
              ) : isActive ? (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md ring-4 ring-indigo-50">
                  {stepNumber}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-semibold text-sm flex items-center justify-center border border-slate-200">
                  {stepNumber}
                </div>
              )}
              <span className={`text-xs ${isActive || isCompleted ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}