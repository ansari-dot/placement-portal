import React from 'react';
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const totalWorkflows = stats?.totalWorkflows || 0;
  const activeWorkflows = stats?.activeWorkflows || 0;
  const totalRequests = stats?.totalRequests || 0;
  const totalAppointments = stats?.totalAppointments || 0;
  const totalInternships = stats?.totalInternships || 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Workflows */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
          <Building2 size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Workflows</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalWorkflows}</h3>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium block leading-tight">Active</span>
              <span className="text-sm font-bold text-blue-600 leading-none">{activeWorkflows}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Syncing with MongoDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Total Internship Requests */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl self-start">
          <Building2 size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Requests</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalRequests}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Syncing with MongoDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Total Appointments */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
          <Users size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Appointments</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalAppointments}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Syncing with MongoDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Active Internships */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl self-start">
          <Briefcase size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Internships</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">{totalInternships}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Syncing with MongoDB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}