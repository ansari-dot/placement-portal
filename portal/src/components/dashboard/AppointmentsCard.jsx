import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, UserCheck, UserX } from 'lucide-react';

export default function AppointmentsCard() {
  const stats = [
    { label: 'Scheduled', count: 48, icon: <Calendar className="text-blue-500" size={20} />, bg: 'bg-blue-50' },
    { label: 'Selected', count: 26, icon: <UserCheck className="text-emerald-500" size={20} />, bg: 'bg-emerald-50' },
    { label: 'Not Selected', count: 14, icon: <UserX className="text-rose-500" size={20} />, bg: 'bg-rose-50' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900">Appointments</h3>
          <Link to="/workflow?step=3" className="text-xs font-semibold text-blue-600 hover:underline">View All &rsaquo;</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
              <div className={`p-3 rounded-xl mb-3 ${item.bg}`}>
                {item.icon}
              </div>
              <span className="text-2xl font-black text-slate-900 mb-1">{item.count}</span>
              <span className="text-xs text-slate-400 font-medium leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}