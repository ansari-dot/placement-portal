import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Search, ChevronDown,
  Calendar, ArrowUpRight,
  Filter, MoreVertical, ChevronLeft, ChevronRight,
  Plus, Users, Trash2, X, CheckCircle2, Building2
} from 'lucide-react';

// ==========================================
// 1. METRICS CARDS COMPONENT
// ==========================================
function MetricsCards({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      {/* Card 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Jobs</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.totalJobs ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>+{stats?.newThisMonth ?? 0}</span>
          <span className="text-slate-500 font-normal">new this month</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Positions</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.openJobs ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-4 h-4" />
          <span>Active Listing</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filled Positions</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.filledJobs ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-purple-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Placements Completed</span>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring / Expired</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.expiredJobs ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-amber-600">
          <span>Requires Action</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. FILTER CONTROLS COMPONENT
// ==========================================
function FilterControls({ jobs = [], onApplyFilters }) {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [rto, setRto] = useState('All');
  const [location, setLocation] = useState('All');
  const [employmentType, setEmploymentType] = useState('All');
  const [status, setStatus] = useState('All');

  // Extract dynamic unique lists
  const industries = useMemo(() => {
    const set = new Set(jobs.map(j => j.industry).filter(Boolean));
    return Array.from(set);
  }, [jobs]);

  const rtos = useMemo(() => {
    const set = new Set(jobs.map(j => j.rto).filter(Boolean));
    return Array.from(set);
  }, [jobs]);

  const locations = useMemo(() => {
    const set = new Set(jobs.map(j => j.location).filter(Boolean));
    return Array.from(set);
  }, [jobs]);

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters({
        search: search.trim() || undefined,
        industry: industry !== 'All' ? industry : undefined,
        rto: rto !== 'All' ? rto : undefined,
        location: location !== 'All' ? location : undefined,
        employmentType: employmentType !== 'All' ? employmentType : undefined,
        status: status !== 'All' ? status : undefined
      });
    }
  };

  const handleReset = () => {
    setSearch('');
    setIndustry('All');
    setRto('All');
    setLocation('All');
    setEmploymentType('All');
    setStatus('All');
    if (onApplyFilters) {
      onApplyFilters({});
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Search Jobs</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or employer..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Industry Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Industry</label>
          <div className="relative">
            <select 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Industries</option>
              {industries.map((ind, i) => (
                <option key={i} value={ind}>{ind}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* RTO Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">RTO</label>
          <div className="relative">
            <select 
              value={rto}
              onChange={(e) => setRto(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All RTOs</option>
              {rtos.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Location Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Location</label>
          <div className="relative">
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Locations</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 items-end">
        {/* Employment Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Employment Type</label>
          <div className="relative">
            <select 
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Casual">Casual</option>
              <option value="Internship">Internship</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Job Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Job Status</label>
          <div className="relative">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Filled">Filled</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold text-sm rounded-lg shadow-xs transition-all duration-500 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. JOBS TABLE COMPONENT
// ==========================================
function JobsTable({ jobs = [], stats, onDeleteJob }) {
  const [activeTabStatus, setActiveTabStatus] = useState('All');

  // Compute status tab counts dynamically
  const tabCounts = useMemo(() => {
    const all = jobs.length;
    const open = jobs.filter(j => j.status === 'Open').length;
    const filled = jobs.filter(j => j.status === 'Filled').length;
    const draft = jobs.filter(j => j.status === 'Draft').length;
    const expired = jobs.filter(j => j.status === 'Expired').length;
    const cancelled = jobs.filter(j => j.status === 'Cancelled').length;
    return { all, open, filled, draft, expired, cancelled };
  }, [jobs]);

  const tabs = [
    { label: `All Jobs (${stats?.totalJobs ?? tabCounts.all})`, key: 'All' },
    { label: `Open (${stats?.openJobs ?? tabCounts.open})`, key: 'Open' },
    { label: `Filled (${stats?.filledJobs ?? tabCounts.filled})`, key: 'Filled' },
    { label: `Draft (${stats?.draftJobs ?? tabCounts.draft})`, key: 'Draft' },
    { label: `Expired (${stats?.expiredJobs ?? tabCounts.expired})`, key: 'Expired' },
    { label: `Cancelled (${stats?.cancelledJobs ?? tabCounts.cancelled})`, key: 'Cancelled' },
  ];

  const filteredJobs = useMemo(() => {
    if (activeTabStatus === 'All') return jobs;
    return jobs.filter(j => j.status === activeTabStatus);
  }, [jobs, activeTabStatus]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Open':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Filled':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Expired':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Tabs & View Switcher */}
      <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeTabStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTabStatus(tab.key)}
                className={`pb-4 text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-4 px-4 font-bold text-slate-600">Job Title & Employer</th>
              <th className="py-4 px-4 font-bold text-slate-600">Industry</th>
              <th className="py-4 px-4 font-bold text-slate-600">RTO</th>
              <th className="py-4 px-4 font-bold text-slate-600">Location</th>
              <th className="py-4 px-4 font-bold text-slate-600">Employment Type</th>
              <th className="py-4 px-4 font-bold text-slate-600">Applicants</th>
              <th className="py-4 px-4 font-bold text-slate-600">Status</th>
              <th className="py-4 px-4 text-right font-bold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredJobs.map((job, idx) => {
              const jobId = job.id || job._id;
              const employerName = job.employer || 'Employer';
              const initials = employerName.substring(0, 2).toUpperCase();
              return (
                <tr key={jobId || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer">{job.title}</span>
                        <span className="text-slate-500 text-[11px]">{job.employer}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{job.industry || 'N/A'}</td>
                  <td className="py-4 px-4 text-slate-600">{job.rto || 'N/A'}</td>
                  <td className="py-4 px-4 text-slate-600">{job.location || 'Australia'}</td>
                  <td className="py-4 px-4 text-slate-600 font-semibold">{job.employmentType || 'Full-time'}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">
                    {job.applicantsCount || job.applicants?.count || 0}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${getStatusBadge(job.status)}`}>
                      {job.status || 'Open'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button 
                      onClick={() => onDeleteJob && onDeleteJob(jobId)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm font-medium">
                  No jobs match the selected tab/filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
      </div>
    </div>
  );
}

// ==========================================
// 4. RIGHT SIDEBAR COMPONENT
// ==========================================
function RightSidebar({ jobs = [], stats, onAddJob }) {
  // Aggregate Top Employers dynamically
  const topEmployers = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      const emp = j.employer || 'Unknown';
      counts[emp] = (counts[emp] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, jobs: `${count} Job${count > 1 ? 's' : ''}` }))
      .sort((a, b) => parseInt(b.jobs, 10) - parseInt(a.jobs, 10))
      .slice(0, 5);
  }, [jobs]);

  return (
    <div className="col-span-3 space-y-6">
      {/* Job Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Job Management</h3>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Briefcase className="w-7 h-7" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Create, track, and manage job opportunities connected live to MongoDB.
          </p>
        </div>
        <button 
          onClick={onAddJob}
          className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {/* Top Employers Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Top Employers</h3>
          <span className="text-xs text-slate-400 font-semibold">{topEmployers.length} Active</span>
        </div>

        <div className="space-y-3">
          {topEmployers.map((emp, idx) => (
            <div key={idx} className="flex items-center justify-between pb-2 border-b border-slate-50 last:border-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shadow-xs">
                  {emp.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{emp.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{emp.jobs}</span>
                </div>
              </div>
            </div>
          ))}
          {topEmployers.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No employers recorded yet.</p>
          )}
        </div>
      </div>

      {/* Job Insights Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Job Insights</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Live Stats</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">New Jobs This Month</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">+{stats?.newThisMonth ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Total Applicants</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">{stats?.totalApplicants ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">Positions Filled</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">{stats?.filledJobs ?? 0}</span>
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
export default function JobsPageApp({
  jobs = [],
  stats,
  onFilterChange,
  onDeleteJob,
  onAddJob,
  showAddModal,
  onCloseAddModal,
  onCreateJob
}) {
  // Local state for Create Job Modal
  const [modalTitle, setModalTitle] = useState('');
  const [modalEmployer, setModalEmployer] = useState('');
  const [modalIndustry, setModalIndustry] = useState('Healthcare');
  const [modalRto, setModalRto] = useState('Central TAFE');
  const [modalLocation, setModalLocation] = useState('Sydney, NSW');
  const [modalType, setModalType] = useState('Internship');
  const [modalStatus, setModalStatus] = useState('Open');
  const [modalSalary, setModalSalary] = useState('');
  const [modalExpiry, setModalExpiry] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalTitle || !modalEmployer) return;

    try {
      setSubmitting(true);
      await onCreateJob({
        title: modalTitle,
        employer: modalEmployer,
        industry: modalIndustry,
        rto: modalRto,
        location: modalLocation,
        employmentType: modalType,
        status: modalStatus,
        salary: modalSalary,
        expiryDate: modalExpiry ? new Date(modalExpiry) : undefined,
        description: modalDesc
      });

      // Clear form
      setModalTitle('');
      setModalEmployer('');
      setModalDesc('');
      setModalSalary('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-800 font-sans relative">
      {/* Main Workspace */}
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Metrics Overview Cards */}
        <MetricsCards stats={stats} />

        {/* Filter Controls Component */}
        <FilterControls jobs={jobs} onApplyFilters={onFilterChange} />

        {/* Main Grid: Data Table (Left) & Overview Sidebars (Right) */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <JobsTable jobs={jobs} stats={stats} onDeleteJob={onDeleteJob} />
          </div>
          <div className="col-span-3">
            <RightSidebar jobs={jobs} stats={stats} onAddJob={onAddJob} />
          </div>
        </div>
      </div>

      {/* CREATE NEW JOB MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create New Job Position</h3>
              </div>
              <button onClick={onCloseAddModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Job Title *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Registered Nurse Intern" 
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employer / Company *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. HealthCare Australia" 
                    value={modalEmployer}
                    onChange={(e) => setModalEmployer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Industry</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Healthcare" 
                    value={modalIndustry}
                    onChange={(e) => setModalIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RTO Partner</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TAFE NSW" 
                    value={modalRto}
                    onChange={(e) => setModalRto(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sydney, NSW" 
                    value={modalLocation}
                    onChange={(e) => setModalLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select 
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Draft">Draft</option>
                    <option value="Filled">Filled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Salary / Stipend</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $25/hr or Unpaid" 
                    value={modalSalary}
                    onChange={(e) => setModalSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={modalExpiry}
                    onChange={(e) => setModalExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Job Description</label>
                <textarea 
                  rows={3}
                  placeholder="Overview of duties and candidate requirements..." 
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold rounded-xl transition-all duration-500 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Position'}
                </button>
                <button 
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}