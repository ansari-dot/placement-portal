import React from 'react';

export default function RequestsChartCard({ chartData = [], loading }) {
  const data = chartData && chartData.length > 0 ? chartData : [
    { label: 'Month 1', requests: 0, placements: 0 },
    { label: 'Month 2', requests: 0, placements: 0 },
    { label: 'Month 3', requests: 0, placements: 0 },
    { label: 'Month 4', requests: 0, placements: 0 },
    { label: 'Month 5', requests: 0, placements: 0 },
    { label: 'Month 6', requests: 0, placements: 0 },
  ];

  // Determine max value for dynamic scaling
  const maxVal = Math.max(
    10,
    ...data.map(d => Math.max(d.requests || 0, d.placements || 0))
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-slate-900">Internship Requests & Placements Overview</h3>
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
          <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
            Last 6 Months
          </span>
        </div>
      </div>

      {/* Dynamic Bar/Trend Chart Area */}
      <div className="h-64 relative flex items-end justify-between px-4 pb-6 pt-6">
        {/* Background Grid Lines & Y-Axis Scale */}
        <div className="absolute inset-x-4 top-2 h-48 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="border-b border-slate-200 w-full text-[10px] text-slate-400 text-right pr-2">{maxVal}</div>
          <div className="border-b border-slate-200 w-full text-[10px] text-slate-400 text-right pr-2">{Math.round(maxVal * 0.75)}</div>
          <div className="border-b border-slate-200 w-full text-[10px] text-slate-400 text-right pr-2">{Math.round(maxVal * 0.5)}</div>
          <div className="border-b border-slate-200 w-full text-[10px] text-slate-400 text-right pr-2">{Math.round(maxVal * 0.25)}</div>
          <div className="border-b border-slate-200 w-full text-[10px] text-slate-400 text-right pr-2">0</div>
        </div>

        {/* Dynamic Month Columns */}
        <div className="w-full h-44 flex items-end justify-around relative z-10 px-2">
          {data.map((item, idx) => {
            const reqHeightPct = Math.min(100, Math.max(8, (item.requests / maxVal) * 100));
            const placeHeightPct = Math.min(100, Math.max(8, (item.placements / maxVal) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                  Req: {item.requests} | Placed: {item.placements}
                </div>

                {/* Bars Container */}
                <div className="flex items-end space-x-1.5 h-36">
                  {/* Requests Bar */}
                  <div 
                    style={{ height: `${reqHeightPct}%` }} 
                    className="w-3.5 bg-blue-600 rounded-t-md transition-all duration-500 shadow-2xs hover:bg-blue-700"
                    title={`Requests: ${item.requests}`}
                  ></div>
                  {/* Placements Bar */}
                  <div 
                    style={{ height: `${placeHeightPct}%` }} 
                    className="w-3.5 bg-teal-400 rounded-t-md transition-all duration-500 shadow-2xs hover:bg-teal-500"
                    title={`Placements: ${item.placements}`}
                  ></div>
                </div>

                {/* Month Label */}
                <span className="text-[11px] text-slate-500 font-semibold tracking-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}