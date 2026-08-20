import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Clock } from 'lucide-react';

export default function InternshipsSummaryCard({ stats, loading }) {
  const activeCount = stats?.active ?? 0;
  const joinedCount = stats?.joined ?? 0;
  const waitingCount = stats?.waitingToJoin ?? 0;
  const totalPlaced = activeCount + joinedCount + waitingCount;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Internships</h3>
        <Link to="/workflow?step=4" className="text-xs font-semibold text-blue-600 hover:underline">View All &rsaquo;</Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
            <Briefcase size={22} />
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-slate-900">
              {loading ? '...' : totalPlaced}
            </h4>
            <span className="text-xs text-slate-500 font-medium">Total Active Placements</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock size={12} className="text-amber-500" /> Waiting
            </span>
            <span className="font-bold text-slate-900">{loading ? '...' : waitingCount}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Joined
            </span>
            <span className="font-bold text-slate-900">{loading ? '...' : joinedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}