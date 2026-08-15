import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, UserPlus, Building2, Briefcase } from 'lucide-react';

export default function RecentActivityCard() {
  const activities = [
    {
      title: 'Ali Raza has been placed at GreenView Aged Care',
      subtitle: 'Internship Placement',
      time: '2m ago',
      icon: <CheckCircle2 className="text-emerald-600" size={18} />,
      bg: 'bg-emerald-50'
    },
    {
      title: 'New appointment scheduled for Sara Khan',
      subtitle: 'Appointment',
      time: '15m ago',
      icon: <Calendar className="text-blue-600" size={18} />,
      bg: 'bg-blue-50'
    },
    {
      title: 'New internship request from Ahmed Malik',
      subtitle: 'Internship Request',
      time: '1h ago',
      icon: <UserPlus className="text-indigo-600" size={18} />,
      bg: 'bg-indigo-50'
    },
    {
      title: 'Bright Futures RTO status updated to Active',
      subtitle: 'RTO Update',
      time: '2h ago',
      icon: <Building2 className="text-amber-600" size={18} />,
      bg: 'bg-amber-50'
    },
    {
      title: 'Zara Noor has joined the internship at Helping Hands',
      subtitle: 'Internship Joined',
      time: '3h ago',
      icon: <Briefcase className="text-teal-600" size={18} />,
      bg: 'bg-teal-50'
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
          <Link to="/workflow" className="text-xs font-semibold text-blue-600 hover:underline">View All &rsaquo;</Link>
        </div>
        <div className="space-y-4">
          {activities.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-slate-100 last:border-none last:pb-0">
              <div className={`p-2.5 rounded-xl mt-0.5 ${item.bg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}