import React from 'react';

export default function RequestsChartCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-slate-900">Internship Requests Overview</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-6 text-xs font-medium text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full inline-block"></span>
              <span>Requests</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-teal-400 rounded-full inline-block"></span>
              <span>Placements</span>
            </div>
          </div>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none">
            <option>Last 6 Months</option>
          </select>
        </div>
      </div>

      {/* Chart Graphic Area */}
      <div className="h-64 relative flex items-end justify-between px-4 pb-2 pt-6">
        {/* Background Grid Lines & Y-Axis Labels */}
        <div className="absolute inset-x-4 top-2 h-44 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">250</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">200</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">290</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">150</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">100</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">50</div>
          <div className="border-b border-slate-100 w-full text-[10px] text-slate-400 text-right pr-2">0</div>
        </div>

        {/* SVG Wave lines simulation */}
        <svg className="absolute inset-x-8 bottom-8 h-40 w-[91%] overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 600 150">
          {/* Placements area fill */}
          <path d="M 0 120 Q 120 100, 240 85 T 480 90 T 580 65 L 580 150 L 0 150 Z" fill="rgba(45, 212, 191, 0.12)" />
          {/* Placements line */}
          <path d="M 0 120 Q 120 100, 240 85 T 480 90 T 580 65" fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
          {/* Requests line */}
          <path d="M 0 95 Q 120 70, 240 50 T 480 60 T 580 55" fill="none" stroke="#2563eb" strokeWidth="2.5" />
          
          {/* Data points for Requests */}
          <circle cx="0" cy="95" r="4" fill="#2563eb" />
          <circle cx="120" cy="70" r="4" fill="#2563eb" />
          <circle cx="240" cy="50" r="4" fill="#2563eb" />
          <circle cx="360" cy="40" r="4" fill="#2563eb" />
          <circle cx="480" cy="60" r="4" fill="#2563eb" />
          <circle cx="580" cy="55" r="4" fill="#2563eb" />

          {/* Data points for Placements */}
          <circle cx="0" cy="120" r="4" fill="#2dd4bf" />
          <circle cx="120" cy="100" r="4" fill="#2dd4bf" />
          <circle cx="240" cy="85" r="4" fill="#2dd4bf" />
          <circle cx="360" cy="75" r="4" fill="#2dd4bf" />
          <circle cx="480" cy="90" r="4" fill="#2dd4bf" />
          <circle cx="580" cy="65" r="4" fill="#2dd4bf" />
        </svg>

        {/* X Axis Labels */}
        <div className="absolute inset-x-6 bottom-0 flex justify-between text-xs text-slate-400 font-medium px-4">
          <span>Feb 2025</span>
          <span>Mar 2025</span>
          <span>Apr 2025</span>
          <span>May 2025</span>
          <span>Jun 2025</span>
          <span>Jul 2025</span>
        </div>
      </div>
    </div>
  );
}