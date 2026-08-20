import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, UserCheck, FileText, CheckCircle, XCircle, FileX, AlertCircle } from 'lucide-react';

export default function InternshipRequestsCard({ stats, loading }) {
  const items = [
    { label: 'Pending', count: stats?.pending ?? 0, icon: <Clock className="text-amber-500" size={18} />, bg: 'bg-amber-50' },
    { label: 'In Review', count: stats?.assigned ?? 0, icon: <UserCheck className="text-blue-500" size={18} />, bg: 'bg-blue-50' },
    { label: 'Appointment', count: stats?.appointment ?? 0, icon: <FileText className="text-indigo-500" size={18} />, bg: 'bg-indigo-50' },
    { label: 'Approved', count: stats?.placed ?? 0, icon: <CheckCircle className="text-emerald-500" size={18} />, bg: 'bg-emerald-50' },
    { label: 'Rejected', count: stats?.failed ?? 0, icon: <XCircle className="text-rose-500" size={18} />, bg: 'bg-rose-50' },
    { label: 'On Hold', count: stats?.withdrawn ?? 0, icon: <FileX className="text-slate-500" size={18} />, bg: 'bg-slate-100' },
    { label: 'Declined', count: stats?.declined ?? 0, icon: <AlertCircle className="text-red-400" size={18} />, bg: 'bg-red-50' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between w-full max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Internship Requests</h3>
        <Link to="/workflow?step=2" className="text-xs font-semibold text-blue-600 hover:underline">View All &rsaquo;</Link>
      </div>
      <div className="grid grid-cols-7 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-50/80 transition border border-transparent hover:border-slate-200">
            <div className={`p-2.5 rounded-xl mb-2.5 ${item.bg}`}>
              {item.icon}
            </div>
            <span className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
              {loading ? '...' : item.count}
            </span>
            <span className="text-[11px] text-slate-400 font-medium leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}