import React from 'react';
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total RTOs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
          <Building2 size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total RTOs</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">68</h3>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium block leading-tight">Active</span>
              <span className="text-sm font-bold text-blue-600 leading-none">52</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>8% vs last month</span>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium inline">Not Offered </span>
              <span className="text-xs font-bold text-slate-700">16</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Total Industries */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl self-start">
          <Building2 size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Industries</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">340</h3>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium block leading-tight">Active</span>
              <span className="text-sm font-bold text-teal-600 leading-none">287</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>12% vs last month</span>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium inline">Not Offered </span>
              <span className="text-xs font-bold text-slate-700">53</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Total Students */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
          <Users size={22} />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Students</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">1,249</h3>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-[10px] text-slate-400 leading-none">RTOs <strong className="text-slate-800 font-semibold">68</strong></div>
              <div className="text-[10px] text-slate-400 leading-none">Courses <strong className="text-slate-800 font-semibold">23</strong></div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>15% vs last month</span>
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
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">Active Internships</span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">192</h3>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-400 font-medium block leading-tight">Waiting to Join</span>
              <span className="text-sm font-bold text-teal-600 leading-none">43</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>10% vs last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}