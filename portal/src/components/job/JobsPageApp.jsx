import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Search, ChevronDown, 
  Calendar, ArrowUpRight, 
  Filter, MoreVertical, ChevronLeft, ChevronRight,
  Plus, Users
} from 'lucide-react';

// ==========================================
// 1. METRICS CARDS COMPONENT
// ==========================================
function MetricsCards() {
  return (
    <div className="grid grid-cols-4 gap-5">
      {/* Card 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Jobs</span>
            <h3 className="text-3xl font-extrabold text-slate-900">128</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>12%</span>
          <span className="text-slate-500 font-normal">from last month</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Positions</span>
            <h3 className="text-3xl font-extrabold text-slate-900">76</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>18%</span>
          <span className="text-slate-500 font-normal">from last month</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filled Positions</span>
            <h3 className="text-3xl font-extrabold text-slate-900">34</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>8%</span>
          <span className="text-slate-500 font-normal">from last month</span>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Soon</span>
            <h3 className="text-3xl font-extrabold text-slate-900">18</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>5%</span>
          <span className="text-slate-500 font-normal">from last month</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. FILTER CONTROLS COMPONENT
// ==========================================
function FilterControls() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Search Jobs</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by title or keyword..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Industry Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Industry</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All Industries</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* RTO Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">RTO</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All RTOs</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Course Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Course</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All Courses</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 items-end">
        {/* Location Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Location</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All Locations</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Employment Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Employment Type</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All Types</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Job Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Job Status</label>
          <div className="relative">
            <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
              <option>All Statuses</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Posted Date & Buttons */}
        <div className="flex items-center gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="block text-xs font-semibold text-slate-700">Posted Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" defaultValue="Select Date Range" className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
        <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer">
          Reset
        </button>
        <button className="inline-flex items-center gap-2 px-5 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-500 cursor-pointer">
          <Filter className="w-4 h-4" />
          <span>Apply Filters</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. JOBS TABLE COMPONENT
// ==========================================
function JobsTable() {
  const [activeTab, setActiveTab] = useState('All Jobs (128)');

  const jobsData = [
    {
      title: 'Software Development Intern',
      employer: 'TechNova Solutions Pty Ltd',
      industry: 'Information Technology',
      rto: 'Melbourne Institute of Tech',
      location: 'Melbourne VIC',
      applicants: { count: '24', badge: '12 New' },
      status: 'Open',
      statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      posted: '2 days ago'
    },
    {
      title: 'Data Analyst Intern',
      employer: 'DataFlow Analytics',
      industry: 'Information Technology',
      rto: 'Sydney Community College',
      location: 'Sydney NSW',
      applicants: { count: '18', badge: '6 New' },
      status: 'Open',
      statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      posted: '5 days ago'
    },
    {
      title: 'Digital Marketing Intern',
      employer: 'HealthPlus Marketing',
      industry: 'Marketing & Communications',
      rto: 'Brisbane Business Academy',
      location: 'Brisbane QLD',
      applicants: { count: '31', badge: '15 New' },
      status: 'Open',
      statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      posted: '1 week ago'
    },
    {
      title: 'Finance Intern',
      employer: 'FinEdge Financial Services',
      industry: 'Finance & Accounting',
      rto: 'Adelaide Business School',
      location: 'Adelaide SA',
      applicants: { count: '12', badge: '3 New' },
      status: 'Closing Soon',
      statusColor: 'bg-amber-50 text-amber-600 border border-amber-200',
      posted: '2 days left'
    },
    {
      title: 'Civil Engineering Intern',
      employer: 'BuildCorp Constructions',
      industry: 'Construction & Engineering',
      rto: 'Perth Training College',
      location: 'Perth WA',
      applicants: { count: '22', badge: '8 New' },
      status: 'Draft',
      statusColor: 'bg-slate-100 text-slate-600 border border-slate-200',
      posted: 'Draft'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Tabs & View Switcher */}
      <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {['All Jobs (128)', 'Open (76)', 'Filled (34)', 'Draft (10)', 'Expired (8)', 'Cancelled (0)'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-semibold transition-colors relative cursor-pointer ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pb-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors">
            <span className="text-blue-600">📊</span>
            <span>Table View</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
            <span>📋</span>
            <span>Board View</span>
          </button>
        </div>
      </div>

      {/* Table Actions Header */}
      <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none shadow-sm cursor-pointer">
              <option>Bulk Actions</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-xs font-medium text-slate-500">0 selected</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Sort by:</span>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none shadow-sm cursor-pointer">
              <option>Recently Posted</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              </th>
              <th className="py-4 px-4 font-bold text-slate-600">Job Title & Employer</th>
              <th className="py-4 px-4 font-bold text-slate-600">Industry</th>
              <th className="py-4 px-4 font-bold text-slate-600">RTO</th>
              <th className="py-4 px-4 font-bold text-slate-600">Location</th>
              <th className="py-4 px-4 font-bold text-slate-600">Applicants</th>
              <th className="py-4 px-4 font-bold text-slate-600">Status</th>
              <th className="py-4 px-4 font-bold text-slate-600">Posted</th>
              <th className="py-4 px-4 text-right font-bold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {jobsData.map((job, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                      {job.employer.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer">{job.title}</span>
                      <span className="text-slate-500 text-[11px]">{job.employer}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-600">{job.industry}</td>
                <td className="py-4 px-4 text-slate-600">{job.rto}</td>
                <td className="py-4 px-4 text-slate-600 flex items-center gap-1 pt-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {job.location}
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{job.applicants.count}</span>
                    <span className="text-blue-600 text-[10px] font-bold">{job.applicants.badge}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${job.statusColor}`}>
                    {job.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-500">{job.posted}</td>
                <td className="py-4 px-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing 1 to 10 of 128 jobs</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm">1</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium">2</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium">3</button>
            <span className="px-1">...</span>
            <button className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium">13</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative ml-4">
            <select className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none shadow-sm cursor-pointer">
              <option>10 / page</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. RIGHT SIDEBAR COMPONENT
// ==========================================
function RightSidebar() {
  const employers = [
    { name: 'TechNova Solutions Pty Ltd', jobs: '18 Jobs' },
    { name: 'DataFlow Analytics', jobs: '12 Jobs' },
    { name: 'HealthPlus Marketing', jobs: '9 Jobs' },
    { name: 'FinEdge Financial Services', jobs: '7 Jobs' },
    { name: 'BuildCorp Constructions', jobs: '6 Jobs' }
  ];

  return (
    <div className="col-span-3 space-y-6">
      {/* Job Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Job Overview</h3>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Create and manage internship opportunities and connect the right students with the right employers.
          </p>
        </div>
        <button className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {/* Top Employers Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Top Employers</h3>
          <Link to="/industry" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
        </div>

        <div className="space-y-3">
          {employers.map((emp, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shadow-sm">
                  {emp.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{emp.name}</span>
                  <span className="text-[10px] text-slate-400">{emp.jobs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Insights Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Job Insights</h3>
          <div className="relative">
            <select className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-7 text-[11px] font-semibold text-slate-700 outline-none shadow-sm cursor-pointer">
              <option>This Month</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">New Jobs</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">+18</span>
              <span className="text-emerald-600 text-[11px] flex items-center"><ArrowUpRight className="w-3 h-3" /> 20%</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Total Applicants</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">287</span>
              <span className="text-emerald-600 text-[11px] flex items-center"><ArrowUpRight className="w-3 h-3" /> 15%</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">Hires Made</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">32</span>
              <span className="text-emerald-600 text-[11px] flex items-center"><ArrowUpRight className="w-3 h-3" /> 10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN JOBS PAGE CONTENT COMPONENT
// ==========================================
export default function JobsPageApp() {
  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Main Workspace */}
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Metrics Overview Cards */}
        <MetricsCards />

        {/* Filter Controls Component */}
        <FilterControls />

        {/* Main Grid: Data Table (Left) & Overview Sidebars (Right) */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <JobsTable />
          </div>
          <div className="col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}