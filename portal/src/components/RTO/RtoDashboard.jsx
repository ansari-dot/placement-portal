import React, { useState, useEffect } from 'react';
import { 
  Building2, CheckCircle2, Clock, Users, UserPlus, Search, Filter, 
  Download, Plus, Columns, MoreVertical, ArrowLeft, ArrowRight, 
  MapPin, Phone, Mail, Globe, CalendarDays, Lock, ExternalLink, X,
  Eye, Edit, Trash2
} from 'lucide-react';
import { LivePresenceBadge, formatLastSeen } from '../../utils/presenceUtils';

export default function RtoDashboard({ onAddNewRto, rtos = [], stats = {}, onFilterChange, onDeleteRto }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [activeActionMenuRtoId, setActiveActionMenuRtoId] = useState(null);
  const [viewingRto, setViewingRto] = useState(null);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveActionMenuRtoId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange({
          search: searchQuery,
          status: statusFilter,
          loc: locationFilter
        });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter, locationFilter, onFilterChange]);

  const locationOptions = ['Melbourne, VIC', 'Geelong, VIC', 'Sydney, NSW', 'Brisbane, QLD', 'Adelaide, SA', 'Perth, WA'];

  const filteredRtos = rtos;

  const handleExport = () => {
    if (!filteredRtos || filteredRtos.length === 0) return;
    const headers = ['RTO Name', 'RTO Code', 'Location', 'Status', 'Students', 'Partnership Since'];
    const csvRows = [
      headers.join(','),
      ...filteredRtos.map(rto => [
        `"${(rto.name || '').replace(/"/g, '""')}"`,
        `"${(rto.code || '').replace(/"/g, '""')}"`,
        `"${(rto.loc || '').replace(/"/g, '""')}"`,
        `"${(rto.status || '').replace(/"/g, '""')}"`,
        rto.students || 0,
        `"${(rto.date || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `rto_export_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

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
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalRtos || 0}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Active system
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Partners</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.activeRtos || 0}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Active status
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Partners</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.inactiveRtos || 0}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 flex items-center">
              Inactive status
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students Assigned</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalStudents || 0}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Assigned students
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New This Month</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{stats.newThisMonth || 0}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Added this month
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select 
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">Location: All</option>
            {locationOptions.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <button 
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); setLocationFilter('All'); }}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
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

      {/* Main Content Layout: Full Width Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">{filteredRtos.length} RTOs found</span>
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
                <th className="p-4">Live Status</th>
                <th className="p-4">Last Seen</th>
                <th className="p-4">Students</th>
                <th className="p-4">Partnership Since</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRtos.map((rto, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-slate-50/80 transition"
                >
                  <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-4 font-bold text-slate-800 flex items-center space-x-2.5">
                    <div className="relative shrink-0">
                      {rto.logo ? (
                        <img 
                          src={rto.logo} 
                          alt="logo" 
                          className="w-7 h-7 rounded-lg object-contain border border-slate-200 bg-white p-0.5" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {(rto.name || 'RTO').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${rto.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate">{rto.name}</span>
                      {rto.paymentCycle && (
                        <span className="inline-block text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded mt-0.5">
                          {rto.paymentCycle}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{rto.code || '-'}</td>
                  <td className="p-4 text-slate-600">{rto.loc || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rto.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {rto.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <LivePresenceBadge
                      isOnline={!!rto.isOnline}
                      lastSeen={rto.lastSeen || rto.lastActive}
                      size="xs"
                    />
                  </td>
                  <td className="p-4 text-slate-500 text-[11px]">
                    {formatLastSeen(rto.lastSeen || rto.lastActive, !!rto.isOnline)}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{rto.students || 0}</td>
                  <td className="p-4 text-slate-600">{rto.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingRto(rto);
                        }}
                        title="View Details"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Edit RTO Wizard is coming soon!');
                        }}
                        title="Edit RTO"
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete ${rto.name}?`)) {
                            onDeleteRto(rto._id || rto.id);
                          }
                        }}
                        title="Delete RTO"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRtos.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-sm font-medium">
                    No RTOs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-3">
          <span>
            {filteredRtos.length === 0
              ? "Showing 0 to 0 of 0 results"
              : `Showing 1 to ${filteredRtos.length} of ${filteredRtos.length} results`}
          </span>
          {filteredRtos.length > 0 && (
            <div className="flex items-center space-x-1">
              <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ArrowLeft size={14} /></button>
              <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg shadow-sm">1</button>
              <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ArrowRight size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* View Details Popup Modal */}
      {viewingRto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {viewingRto.logo ? (
                  <img 
                    src={viewingRto.logo} 
                    alt="RTO Logo" 
                    className="w-14 h-14 rounded-2xl object-contain border border-slate-200 bg-white p-1 shadow-md shrink-0" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0">
                    {(viewingRto.name || 'RTO').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg">{viewingRto.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${viewingRto.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{viewingRto.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">RTO Code: {viewingRto.code || 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingRto(null)} 
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-600">
              {/* Grid 1: Basic Information & Payment Cycle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-blue-600">Basic Information</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Cycle: {viewingRto.paymentCycle || 'Placement'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">RTO Name</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">RTO Code</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Payment Cycle</p>
                    <p className="font-bold text-blue-600 text-xs mt-0.5">{viewingRto.paymentCycle || 'Placement'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">ABN</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.abn || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">ACN</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.acn || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Website</p>
                    <p className="font-medium text-blue-600 text-xs mt-0.5 truncate">{viewingRto.website || 'Not specified'}</p>
                  </div>
                </div>

                {viewingRto.shortDescription && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Description</p>
                    <p className="font-normal text-slate-600 text-xs mt-0.5 leading-relaxed">{viewingRto.shortDescription}</p>
                  </div>
                )}
              </div>

              {/* Grid 2: Payout & Course Pricing Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-600">Payout & Course Pricing</h4>
                  {viewingRto.payoutRate ? (
                    <span className="text-[11px] font-semibold text-slate-600">Base: <strong className="text-emerald-600">${viewingRto.payoutRate} AUD</strong></span>
                  ) : null}
                </div>

                {Array.isArray(viewingRto.coursePricing) && viewingRto.coursePricing.length > 0 ? (
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                          <th className="pb-1.5">Course</th>
                          <th className="pb-1.5">Certificate Level</th>
                          <th className="pb-1.5">Pricing</th>
                          <th className="pb-1.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {viewingRto.coursePricing.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-medium text-slate-800">{item.course}</td>
                            <td className="py-1.5 text-slate-600">{item.qualification}</td>
                            <td className="py-1.5 font-bold text-emerald-600">${item.pricing} AUD</td>
                            <td className="py-1.5 text-slate-500 text-[11px]">{item.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">No course-specific pricing registered.</p>
                )}
              </div>

              {/* Grid 3: Compliance & Documents */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider text-blue-600">Documents & Compliance Assets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                    <FileText size={18} className="text-blue-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-xs truncate">Registration Certificate</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {viewingRto.registrationCertificateName || (viewingRto.registrationCertificate ? 'Certificate Attached' : 'Not uploaded')}
                      </p>
                    </div>
                    {viewingRto.registrationCertificate && (
                      <a 
                        href={viewingRto.registrationCertificate} 
                        download={viewingRto.registrationCertificateName || 'registration_certificate'}
                        className="text-[10px] font-bold text-blue-600 hover:underline shrink-0"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                    {viewingRto.logo ? (
                      <img src={viewingRto.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain border bg-white p-0.5 shrink-0" />
                    ) : (
                      <Building2 size={18} className="text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs">RTO Brand Logo</p>
                      <p className="text-[10px] text-slate-400">{viewingRto.logo ? 'Active & uploaded' : 'None uploaded'}</p>
                    </div>
                  </div>
                </div>

                {Array.isArray(viewingRto.documents) && viewingRto.documents.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Additional Documents ({viewingRto.documents.length})</p>
                    {viewingRto.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="font-medium text-slate-700">{doc.name || `Document ${idx + 1}`}</span>
                        {doc.file ? (
                          <a 
                            href={doc.file} 
                            download={doc.name || 'document'} 
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download ({doc.size || 'File'})
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">{doc.size || 'Attached'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid 4: Contact Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider text-blue-600">Primary Contact Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Contact Name</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.contactName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Phone</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.contactPhone || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Email</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.contactEmail || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Grid 5: Location Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider text-blue-600">Address & Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Registered Address</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Suburb</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.suburb || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">State / Postcode</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.state || ''} {viewingRto.postcode || ''}</p>
                  </div>
                </div>
              </div>

              {/* Grid 6: Partnership Overview */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase tracking-wider text-blue-600">Partnership Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Partnership Since</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.date || viewingRto.partnershipSince || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Students Assigned</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.students || 0}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-[10px] uppercase">Registration No.</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">{viewingRto.registrationNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setViewingRto(null)} 
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  alert('Edit RTO Wizard is coming soon!');
                  setViewingRto(null);
                }} 
                className="px-5 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] text-white rounded-xl font-semibold shadow-md transition-all duration-500 cursor-pointer"
              >
                Edit RTO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}