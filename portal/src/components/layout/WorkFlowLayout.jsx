// src/components/layout/WorkFlowLayout.jsx
import React from 'react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';

export default function WorkFlowLayout({ title = 'Workflow', breadcrumbs = [], stepLabels = [], activeStep = 1, onStepChange, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <Header title={title} breadcrumbs={breadcrumbs} />

        {/* STEP NAVIGATION BAR */}
        {stepLabels.length > 0 && (
          <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center space-x-2 shrink-0 overflow-x-auto">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === activeStep;
              const isComplete = stepNum < activeStep;
              return (
                <button
                  key={stepNum}
                  onClick={() => onStepChange && onStepChange(stepNum)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isComplete
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isComplete ? '✓' : stepNum}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-4 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}