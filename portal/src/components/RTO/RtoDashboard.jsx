import React from 'react';
import { 
  Building2, CheckCircle2, Clock, Users, UserPlus, Search, Filter, 
  Download, Plus, Columns, MoreVertical, ArrowLeft, ArrowRight, 
  MapPin, Phone, Mail, Globe, CalendarDays, Lock, ExternalLink, X 
} from 'lucide-react';

export default function RtoDashboard({ onAddNewRto }) {
  return (
    <div className="p-8 space-y-6 bg-[#F8FAFC] min-h-screen font-sans text-slate-800">
      
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Dashboard</span>
          <span>/</span>
          <span>Partners</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">RTOs</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">RTOs</h2>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total RTOs</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">128</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              ↑ 12.5% <span className="text-slate-500 font-normal ml-1">vs last month</span>
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Partners</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">96</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              ↑ 10.3% <span className="text-slate-500 font-normal ml-1">vs last month</span>
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Partners</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">32</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 flex items-center">
              ↓ 8.2% <span className="text-slate-500 font-normal ml-1">vs last month</span>
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students Assigned</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">2,543</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              ↑ 15.7% <span className="text-slate-500 font-normal ml-1">vs last month</span>
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New This Month</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">7</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              ↑ 16.7% <span className="text-slate-500 font-normal ml-1">vs last month</span>
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3 flex-wrap gap-3">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search RTOs..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button className="flex items-center space-x-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <Filter size={14} />
            <span>Filters</span>
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
          </button>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            <option>Status: All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none">
            <option>Location: All</option>
            <option>Melbourne, VIC</option>
            <option>Geelong, VIC</option>
          </select>
          <button className="text-xs font-semibold text-blue-600 hover:underline">Clear All</button>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
            <Download size={14} />
            <span>Export</span>
          </button>
          <button 
            onClick={onAddNewRto}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/30 transition-all duration-500 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New RTO</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Table & Side Inspector */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Table View */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">128 RTOs found</span>
              <select className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                <option>Bulk Actions</option>
                <option>Delete Selected</option>
              </select>
            </div>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Columns size={14} />
              <span>Columns</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-4">RTO Name</th>
                  <th className="p-4">RTO Code</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Partnership Since</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'AI Global Institute', code: 'RTO-45087', loc: 'Melbourne, VIC', status: 'Active', students: 512, date: '15 Feb 2023', activeRow: true },
                  { name: 'Melbourne City College', code: 'RTO-41256', loc: 'Melbourne, VIC', status: 'Active', students: 328, date: '10 Jan 2023' },
                  { name: 'Deakin College', code: 'RTO-21749', loc: 'Geelong, VIC', status: 'Active', students: 286, date: '05 Mar 2023' },
                  { name: 'Box Hill Institute', code: 'RTO-46870', loc: 'Melbourne, VIC', status: 'Active', students: 245, date: '22 Feb 2023' },
                  { name: 'Victoria University', code: 'RTO-31139', loc: 'Melbourne, VIC', status: 'Active', students: 198, date: '18 Apr 2023' },
                  { name: 'Swinburne College', code: 'RTO-30558', loc: 'Melbourne, VIC', status: 'Inactive', students: 86, date: '11 Nov 2022' },
                  { name: 'Chisholm Institute', code: 'RTO-22136', loc: 'Dandenong, VIC', status: 'Active', students: 74, date: '27 Jun 2023' },
                ].map((rto, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50/80 transition cursor-pointer ${rto.activeRow ? 'bg-blue-50/40' : ''}`}>
                    <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="p-4 font-bold text-slate-800 flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                        {rto.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{rto.name}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{rto.code}</td>
                    <td className="p-4 text-slate-600">{rto.loc}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rto.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {rto.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{rto.students}</td>
                    <td className="p-4 text-slate-600">{rto.date}</td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-3">
            <span>Showing 1 to 10 of 128 results</span>
            <div className="flex items-center space-x-1">
              <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ArrowLeft size={14} /></button>
              <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg shadow-sm">1</button>
              <button className="px-3 py-1 hover:bg-slate-100 rounded-lg">2</button>
              <button className="px-3 py-1 hover:bg-slate-100 rounded-lg">3</button>
              <span className="px-2">...</span>
              <button className="px-3 py-1 hover:bg-slate-100 rounded-lg">13</button>
              <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ArrowRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Right Detail Panel Inspector */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                AI
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 text-base">AI Global Institute</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Active</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">RTO Code: RTO-45087</p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button className="pb-2.5 border-b-2 border-blue-600 text-blue-600 px-4">Overview</button>
            <button className="pb-2.5 text-slate-400 px-4 hover:text-slate-600">Details</button>
            <button className="pb-2.5 text-slate-400 px-4 hover:text-slate-600">Performance</button>
            <button className="pb-2.5 text-slate-400 px-4 hover:text-slate-600">Contacts</button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start space-x-3 text-slate-600">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">Address</p>
                <p className="font-medium text-slate-800">12 Collins St, Melbourne VIC 3000, Australia</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">Phone</p>
                <p className="font-medium text-slate-800">+61 3 9123 4567</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">Email</p>
                <p className="font-medium text-slate-800">info@aiglobal.edu.au</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <Globe size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">Website</p>
                <p className="font-medium text-blue-600">www.aiglobal.edu.au</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <CalendarDays size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">Partnership Since</p>
                <p className="font-medium text-slate-800">15 February 2023</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <Building2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">RTO Type</p>
                <p className="font-medium text-slate-800">Registered Training Organisation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-slate-600">
              <Lock size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-500 text-[10px] uppercase">ABN</p>
                <p className="font-medium text-slate-800">12 345 678 901</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-xs text-slate-800">Partnership Overview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Students Assigned</p>
                <span className="text-lg font-extrabold text-slate-800">512</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 15.2% vs last month</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Active Internships</p>
                <span className="text-lg font-extrabold text-slate-800">68</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 12.3% vs last month</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
              <ExternalLink size={14} />
              <span>View Full Profile</span>
            </button>
            <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/30 transition-all duration-500 cursor-pointer">
              <Building2 size={14} />
              <span>Edit RTO</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}