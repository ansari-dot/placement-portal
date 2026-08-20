import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle2, PauseCircle, Briefcase, GraduationCap, 
  Search, SlidersHorizontal, Plus, ChevronDown, Download, 
  MoreHorizontal, Eye, Edit2, ChevronLeft, ChevronRight, 
  MapPin, ArrowUpRight, Trash2, X
} from 'lucide-react';

export default function IndustriesDashboard({ onAddNewIndustry, industries = [], stats = {}, onFilterChange, onDeleteIndustry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewingIndustry, setViewingIndustry] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange({
          search: searchQuery,
          status: statusFilter,
          sector: sectorFilter
        });
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter, sectorFilter, onFilterChange]);
  return (
    <div className="flex-1 bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Main Content Area */}
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Top Metrics Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalIndustries || 0}</h3>
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 gap-0.5">
                Syncing with MongoDB
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Active Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.activeIndustries || 0}</h3>
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-400">
                Active status
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Inactive Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.inactiveIndustries || 0}</h3>
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-400">
                Inactive status
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PauseCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Job Listings</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalJobs || 0}</h3>
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 gap-0.5">
                Syncing with MongoDB
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Students Placed</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalStudents || 0}</h3>
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 gap-0.5">
                Syncing with MongoDB
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Layout Grid: Main Table Section (left) & Analytics/Widgets (right) */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Table & Filters */}
          <div className="col-span-9 space-y-4">
            
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search industries by name, sector, or contact..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 shadow-sm"
                  />
                </div>

                <div className="relative">
                  <select 
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                  >
                    <option value="All">All Sectors</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Construction">Construction</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                  >
                    <option value="All">Status: All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <button 
                  onClick={() => { setSearchQuery(''); setSectorFilter('All'); setStatusFilter('All'); }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>

              </div>

              <button
                onClick={onAddNewIndustry}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Industry</span>
              </button>
            </div>

            {/* Table Counter & Export Actions */}
            <div className="flex items-center justify-between text-sm text-slate-500 px-1">
              <span>
                {industries.length === 0
                  ? "Showing 0 of 0 industries"
                  : `Showing ${industries.length} of ${industries.length} industries`}
              </span>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </button>
                <div className="relative">
                  <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">
                    <span>Bulk Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 flex items-center gap-1 cursor-pointer hover:text-slate-700">
                      Industry / Company <ChevronDown className="w-3.5 h-3.5" />
                    </th>
                    <th className="py-3.5 px-4">Sector</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Students</th>
                    <th className="py-3.5 px-4">Jobs</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {industries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">ABN: {item.abn || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-100">
                          {item.sector}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.status} {item.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.students || 0}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.jobs || 0}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingIndustry(item)}
                            title="View Details"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert('Edit Industry Wizard coming soon!')}
                            title="Edit Industry"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                onDeleteIndustry(item._id || item.id);
                              }
                            }}
                            title="Delete Industry"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {industries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-sm font-medium">
                        No industries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

              {/* Table Footer Pagination */}
              <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>
                  {industries.length === 0
                    ? "Showing 0 to 0 of 0 results"
                    : `Showing 1 to ${industries.length} of ${industries.length} results`}
                </div>
                {industries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">1</button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Widgets / Analytics Cards */}
          <div className="col-span-3 space-y-6">
            
            {/* Industry Overview Chart/Stats Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Industry Overview</h2>
              
              {/* Circular Graphic Simulation */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="w-36 h-36 rounded-full border-[10px] border-slate-100 border-t-amber-500 border-r-indigo-600 border-b-sky-500 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-2xl font-bold text-slate-900">{stats.totalIndustries || 0}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 font-medium">Active ({stats.activeIndustries || 0})</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {stats.totalIndustries ? ((stats.activeIndustries / stats.totalIndustries) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 font-medium">Inactive ({stats.inactiveIndustries || 0})</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {stats.totalIndustries ? ((stats.inactiveIndustries / stats.totalIndustries) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-600 font-medium">Verified partners</span>
                  </div>
                  <span className="font-semibold text-slate-900">100%</span>
                </div>
              </div>
            </div>

            {/* Top Sectors by Students Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Top Sectors by Students</h2>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Information Technology</span>
                    <span className="font-semibold text-slate-900">412</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Healthcare</span>
                    <span className="font-semibold text-slate-900">298</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Construction</span>
                    <span className="font-semibold text-slate-900">187</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Education</span>
                    <span className="font-semibold text-slate-900">156</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Finance</span>
                    <span className="font-semibold text-slate-900">98</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Added Industries Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Recent Added Industries</h2>
                <a href="#view-all" className="text-xs font-semibold text-indigo-600 hover:underline">View All</a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">Smart Energy Solutions</h4>
                    <p className="text-[11px] text-slate-400">Added on 18 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">AgriTech Australia</h4>
                    <p className="text-[11px] text-slate-400">Added on 16 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">LogiChain Logistics</h4>
                    <p className="text-[11px] text-slate-400">Added on 14 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">Creative Digital Agency</h4>
                    <p className="text-[11px] text-slate-400">Added on 12 Jul 2025</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Promotional/Partner Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl p-4 text-white shadow-sm flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Partner with more industries</h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">Expand opportunities for your students</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-200 flex-shrink-0" />
            </div>

          </div>

        </div>

      </div>

      {/* View Details Popup Modal */}
      {viewingIndustry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {(viewingIndustry.name || 'IN').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg">{viewingIndustry.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      viewingIndustry.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>{viewingIndustry.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Code: {viewingIndustry.code} &bull; Sector: {viewingIndustry.sector}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingIndustry(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-600">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1.5">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Company Name</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Industry Code</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.code || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Sector</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.sector || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">ABN</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.abn || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Description</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.shortDescription || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1.5">Contact & Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Location</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.location || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Website</p>
                    <p className="font-medium text-indigo-600 mt-0.5">{viewingIndustry.website || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Partnership Overview */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1.5">Partnership Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Students Assigned</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.students || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Active Jobs</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.jobs || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Placement Rate</p>
                    <p className="font-medium text-emerald-600 mt-0.5">{viewingIndustry.students > 0 ? '82%' : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setViewingIndustry(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition text-sm cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Edit Industry Wizard coming soon!');
                  setViewingIndustry(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition text-sm cursor-pointer"
              >
                Edit Industry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}