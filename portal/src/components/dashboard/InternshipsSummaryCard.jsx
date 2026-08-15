import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function InternshipsSummaryCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Internships</h3>
        <Link to="/workflow?step=4" className="text-xs font-semibold text-blue-600 hover:underline">View All &rsaquo;</Link>
      </div>
      <div className="flex items-center space-x-4 bg-teal-50/50 p-4 rounded-xl border border-teal-50">
        <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
          <Briefcase size={24} />
        </div>
        <div>
          <h4 className="text-3xl font-extrabold text-slate-900">43</h4>
          <span className="text-xs text-slate-500 font-medium">Waiting to Join</span>
        </div>
      </div>
    </div>
  );
}