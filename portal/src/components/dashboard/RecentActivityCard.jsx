import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, UserPlus, Briefcase, Activity } from 'lucide-react';

export default function RecentActivityCard({ activities = [], loading }) {
  const getIconAndBg = (type) => {
    switch (type) {
      case 'appointment':
        return { icon: <Calendar className="text-blue-600" size={18} />, bg: 'bg-blue-50' };
      case 'internship':
        return { icon: <Briefcase className="text-teal-600" size={18} />, bg: 'bg-teal-50' };
      case 'request':
      default:
        return { icon: <UserPlus className="text-indigo-600" size={18} />, bg: 'bg-indigo-50' };
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
          <Link to="/workflow" className="text-xs font-semibold text-blue-600 hover:underline">View Workflow &rsaquo;</Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Activity size={24} className="text-slate-300" />
            <span>No recent activities recorded yet.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item, idx) => {
              const { icon, bg } = getIconAndBg(item.type);
              return (
                <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-slate-100 last:border-none last:pb-0">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${bg}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">{item.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}