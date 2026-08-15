import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, FileText, Calendar, Building2, Briefcase } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { label: 'Add New Student', icon: <UserPlus size={16} className="text-blue-600" />, to: '/add-student' },
    { label: 'New Internship Request', icon: <FileText size={16} className="text-teal-600" />, to: '/workflow?step=2' },
    { label: 'Schedule Appointment', icon: <Calendar size={16} className="text-indigo-600" />, to: '/workflow?step=3' },
    { label: 'Add New RTO', icon: <Building2 size={16} className="text-blue-600" />, to: '/rto' },
    { label: 'Add New Industry', icon: <Building2 size={16} className="text-emerald-600" />, to: '/industry' },
    { label: 'Add New Job', icon: <Briefcase size={16} className="text-purple-600" />, to: '/jobs' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-6 gap-4">
        {actions.map((item, idx) => (
          <Link key={idx} to={item.to} className="flex items-center space-x-3 p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group">
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-105 transition">
              {item.icon}
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}