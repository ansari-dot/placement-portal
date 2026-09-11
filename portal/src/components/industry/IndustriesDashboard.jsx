import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, CheckCircle2, PauseCircle, Briefcase, GraduationCap, 
  Search, SlidersHorizontal, Plus, ChevronDown, Download, 
  MoreHorizontal, Eye, Edit2, ChevronLeft, ChevronRight, 
  MapPin, ArrowUpRight, Trash2, X
} from 'lucide-react';

export default function IndustriesDashboard({ 
  onAddNewIndustry, 
  industries = [], 
  stats = {}, 
  onFilterChange, 
  onDeleteIndustry,
  onUpdateIndustry 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewingIndustry, setViewingIndustry] = useState(null);

  // Edit Industry state
  const [editingIndustry, setEditingIndustry] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    sector: 'Aged Care',
    abn: '',
    status: 'Active',
    contactPersonName: '',
    contactJobTitle: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    suburb: '',
    state: '',
    postCode: '',
    website: '',
    shortDescription: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Industry state
  const [deletingIndustry, setDeletingIndustry] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEdit = (item) => {
    setEditingIndustry(item);
    setEditFormData({
      name: item.name || '',
      sector: item.sector || 'Aged Care',
      abn: item.abn || '',
      status: item.status || 'Active',
      contactPersonName: item.contactPersonName || '',
      contactJobTitle: item.contactJobTitle || '',
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
      address: item.address || '',
      suburb: item.suburb || '',
      state: item.state || '',
      postCode: item.postCode || '',
      website: item.website || '',
      shortDescription: item.shortDescription || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editFormData.name?.trim()) {
      alert('Industry / Company Name is required');
      return;
    }
    if (!onUpdateIndustry || !editingIndustry) return;
    try {
      setIsSavingEdit(true);
      await onUpdateIndustry(editingIndustry._id || editingIndustry.id, editFormData);
      setEditingIndustry(null);
    } catch (err) {
      console.error('Save edit error:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteIndustry || !deletingIndustry) return;
    try {
      setIsDeleting(true);
      await onDeleteIndustry(deletingIndustry._id || deletingIndustry.id, deletingIndustry.name);
      setDeletingIndustry(null);
    } catch (err) {
      console.error('Delete industry error:', err);
    } finally {
      setIsDeleting(false);
    }
  };


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

  // Dynamically calculate Top Sectors by Students
  const topSectors = useMemo(() => {
    const map = {};
    industries.forEach((ind) => {
      const sec = ind.sector || 'General';
      map[sec] = (map[sec] || 0) + (ind.students || 0);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const maxVal = entries[0]?.[1] || 1;
    return entries.slice(0, 5).map(([secName, count]) => ({
      name: secName,
      count,
      pct: maxVal > 0 ? Math.max(10, Math.round((count / maxVal) * 100)) : 10,
    }));
  }, [industries]);

  // Dynamically get 4 most recent industries
  const recentIndustries = useMemo(() => {
    return (industries || []).slice(0, 4);
  }, [industries]);
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
                          item.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.status || 'Active'} {item.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => setViewingIndustry(item)}
                            className="font-bold text-slate-800 text-xs hover:text-indigo-600 hover:underline flex items-center gap-1 text-left cursor-pointer"
                          >
                            <span>{item.students || 0} Student(s)</span>
                          </button>
                          {item.studentDetails && item.studentDetails.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {item.studentDetails.slice(0, 2).map((st, sIdx) => {
                                const isRej = st.status.includes('Rejected');
                                const isPl = st.status === 'Placed' || st.status === 'Accepted';
                                return (
                                  <span
                                    key={sIdx}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                      isPl
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : isRej
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                    title={`${st.studentName} - ${st.status}${st.rejectionReason ? ` (${st.rejectionReason})` : ''}`}
                                  >
                                    {st.studentName} ({st.status})
                                  </span>
                                );
                              })}
                              {item.studentDetails.length > 2 && (
                                <button
                                  onClick={() => setViewingIndustry(item)}
                                  className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  +{item.studentDetails.length - 2} more
                                </button>
                              )}
                            </div>
                          )}
                          {item.rejectedCount > 0 && (
                            <span className="text-[9px] font-bold text-rose-600">
                              {item.rejectedCount} Student Rejected
                            </span>
                          )}
                        </div>
                      </td>
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
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Industry"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingIndustry(item)}
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
                {topSectors.length > 0 ? (
                  topSectors.map((sec, sIdx) => (
                    <div key={sIdx}>
                      <div className="flex justify-between font-medium mb-1 text-slate-700">
                        <span>{sec.name}</span>
                        <span className="font-semibold text-slate-900">{sec.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${sec.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No sector data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent Added Industries Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Recent Added Industries</h2>
                <span className="text-xs font-semibold text-indigo-600">Total: {industries.length}</span>
              </div>

              <div className="space-y-3">
                {recentIndustries.length > 0 ? (
                  recentIndustries.map((ind, rIdx) => {
                    const colorVariants = [
                      'bg-sky-50 text-sky-600',
                      'bg-amber-50 text-amber-600',
                      'bg-emerald-50 text-emerald-600',
                      'bg-purple-50 text-purple-600',
                    ];
                    const colorClass = colorVariants[rIdx % colorVariants.length];
                    return (
                      <div
                        key={ind._id || ind.id || rIdx}
                        onClick={() => setViewingIndustry(ind)}
                        className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{ind.name}</h4>
                          <p className="text-[11px] text-slate-400">
                            {ind.sector || 'Industry'} &bull; {ind.students || 0} student(s)
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No industries added yet
                  </div>
                )}
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
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Students Assigned</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.students || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Placed</p>
                    <p className="font-medium text-emerald-600 mt-0.5">{viewingIndustry.placedCount || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Rejected</p>
                    <p className="font-medium text-rose-600 mt-0.5">{viewingIndustry.rejectedCount || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Active Jobs</p>
                    <p className="font-medium text-slate-800 mt-0.5">{viewingIndustry.jobs || 0}</p>
                  </div>
                </div>
              </div>

              {/* Students & Internships Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Students &amp; Internships Status</h4>
                  <div className="flex gap-2 text-[10px] font-semibold">
                    <span className="text-emerald-600 font-bold">{viewingIndustry.placedCount || 0} Placed</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-rose-600 font-bold">{viewingIndustry.rejectedCount || 0} Rejected</span>
                  </div>
                </div>
                {viewingIndustry.studentDetails && viewingIndustry.studentDetails.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {viewingIndustry.studentDetails.map((st, sIdx) => {
                      const isRej = String(st.status || '').toLowerCase().includes('reject') || String(st.status || '').toLowerCase().includes('declin');
                      const isPl = String(st.status || '').toLowerCase().includes('place') || String(st.status || '').toLowerCase().includes('accept') || String(st.status || '').toLowerCase().includes('complet');
                      return (
                        <div
                          key={sIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isPl
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : isRej
                              ? 'bg-rose-50/60 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800">{st.studentName}</p>
                            {st.date && <p className="text-[10px] text-slate-400 mt-0.5">Date: {st.date}</p>}
                            {st.rejectionReason && (
                              <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
                                Reason: {st.rejectionReason}
                              </p>
                            )}
                            {st.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">{st.notes}</p>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isPl
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isRej
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {st.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No students linked to this industry yet.</p>
                )}
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
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Industry Modal ─────────────────────────────────────────── */}
      {editingIndustry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Industry</h3>
                  <p className="text-xs text-slate-500">Update company profile, contact details, and partnership status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIndustry(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              
              {/* Company Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                  Company Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="e.g. HealthCare Australia"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Sector / Industry Type</label>
                    <select
                      value={editFormData.sector}
                      onChange={(e) => setEditFormData({ ...editFormData, sector: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Aged Care">Aged Care</option>
                      <option value="Disability Centre">Disability Centre</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                      <option value="Finance & Banking">Finance & Banking</option>
                      <option value="Construction">Construction</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">ABN</label>
                    <input
                      type="text"
                      value={editFormData.abn}
                      onChange={(e) => setEditFormData({ ...editFormData, abn: e.target.value })}
                      placeholder="e.g. 51 824 753 556"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Active">Active (Partnership ongoing)</option>
                      <option value="Inactive">Inactive (Paused / Suspended)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                  Contact Person
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Person Name</label>
                    <input
                      type="text"
                      value={editFormData.contactPersonName}
                      onChange={(e) => setEditFormData({ ...editFormData, contactPersonName: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Job Title / Designation</label>
                    <input
                      type="text"
                      value={editFormData.contactJobTitle}
                      onChange={(e) => setEditFormData({ ...editFormData, contactJobTitle: e.target.value })}
                      placeholder="e.g. HR Placement Director"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Email</label>
                    <input
                      type="email"
                      value={editFormData.contactEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                      placeholder="e.g. info@company.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Phone</label>
                    <input
                      type="text"
                      value={editFormData.contactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                      placeholder="e.g. +61 412 345 678"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-1">
                  Location &amp; Online Presence
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 space-y-1">
                    <label className="font-bold text-slate-700">Street Address</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="e.g. 123 Collins Street"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">City / Suburb</label>
                    <input
                      type="text"
                      value={editFormData.suburb}
                      onChange={(e) => setEditFormData({ ...editFormData, suburb: e.target.value })}
                      placeholder="e.g. Melbourne"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      placeholder="e.g. VIC"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Postal Code</label>
                    <input
                      type="text"
                      value={editFormData.postCode}
                      onChange={(e) => setEditFormData({ ...editFormData, postCode: e.target.value })}
                      placeholder="e.g. 3000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="font-bold text-slate-700">Website</label>
                    <input
                      type="text"
                      value={editFormData.website}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                      placeholder="e.g. https://www.company.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="font-bold text-slate-700">Description / Notes</label>
                    <textarea
                      rows={2}
                      value={editFormData.shortDescription}
                      onChange={(e) => setEditFormData({ ...editFormData, shortDescription: e.target.value })}
                      placeholder="Brief details about this industry partner..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingIndustry(null)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────────────── */}
      {deletingIndustry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Industry Partner</h3>
                <p className="text-xs text-slate-500">Cascade delete and unlink from students</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Are you sure you want to delete {deletingIndustry.name}?</p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This action is permanent. It will delete this industry record and <strong>automatically remove it from all student placement requests, appointments, and active placements</strong> linked to this company.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingIndustry(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Industry</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}