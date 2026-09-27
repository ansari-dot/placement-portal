import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Loader2,
  CalendarClock,
  CalendarCheck,
  UserMinus,
  CalendarX,
  XCircle,
  MapPinOff,
  Play,
  CheckCircle2,
} from 'lucide-react';

export default function InternshipRequestsCard({ stats, loading }) {
  const items = [
    {
      label: 'Awaiting',
      count: stats?.awaiting ?? 0,
      icon: <Clock className="text-slate-500" size={18} />,
      bg: 'bg-slate-100',
    },
    {
      label: 'In Progress',
      count: stats?.inProgress ?? 0,
      icon: <Loader2 className="text-blue-500" size={18} />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Appointment Scheduled',
      count: stats?.appointmentScheduled ?? 0,
      icon: <CalendarClock className="text-indigo-500" size={18} />,
      bg: 'bg-indigo-50',
    },
    {
      label: 'Appointment Successful',
      count: stats?.appointmentSuccessful ?? 0,
      icon: <CalendarCheck className="text-teal-500" size={18} />,
      bg: 'bg-teal-50',
    },
    {
      label: 'Student Withdraw',
      count: stats?.studentWithdraw ?? 0,
      icon: <UserMinus className="text-amber-500" size={18} />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Student Missed Appointment',
      count: stats?.studentMissedAppointment ?? 0,
      icon: <CalendarX className="text-orange-500" size={18} />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Industry Rejected',
      count: stats?.industryRejected ?? 0,
      icon: <XCircle className="text-rose-500" size={18} />,
      bg: 'bg-rose-50',
    },
    {
      label: 'Site Not Suitable',
      count: stats?.notSuitableSite ?? 0,
      icon: <MapPinOff className="text-amber-600" size={18} />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Placement Started',
      count: stats?.placementStarted ?? 0,
      icon: <Play className="text-emerald-500" size={18} />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Placement Completed',
      count: stats?.placementCompleted ?? 0,
      icon: <CheckCircle2 className="text-emerald-700" size={18} />,
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between w-full max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Placement Status</h3>
        <Link to="/workflow?step=1" className="text-xs font-semibold text-blue-600 hover:underline">
          View All &rsaquo;
        </Link>
      </div>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center p-2.5 rounded-xl hover:bg-slate-50/80 transition border border-transparent hover:border-slate-200"
          >
            <div className={`p-2.5 rounded-xl mb-2 ${item.bg}`}>
              {item.icon}
            </div>
            <span className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
              {loading ? '...' : item.count}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
