// src/components/workflow/WorkflowStep2Requests.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, List, 
  X, Building2, User, Calendar, Clock, CheckCircle2, 
  Briefcase, MapPin, Layers, ShieldCheck, ArrowUpRight, Trash2, Eye, Edit, CheckSquare, FileText
} from 'lucide-react';
import { fetchJobs } from '../../api/jobApi';

export default function WorkflowStep2Requests({ 
  requests = [], 
  onBack, 
  onNext, 
  onCreateRequest, 
  onUpdateRequest, 
  onDeleteRequest, 
  students = [] 
}) {
  const [newRequestStudentId, setNewRequestStudentId] = useState('');
  const [newRequestCompany, setNewRequestCompany] = useState('');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestWorkType, setNewRequestWorkType] = useState('Remote');
  const [newRequestRto, setNewRequestRto] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [availableJobs, setAvailableJobs] = useState([]);

  // Load open jobs for the picker
  useEffect(() => {
    fetchJobs({ status: 'Open' })
      .then(res => { if (res.success) setAvailableJobs(res.data || []); })
      .catch(() => {});
  }, []);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRtoFilter, setShowRtoFilter] = useState(false);
  const [showCoordinatorFilter, setShowCoordinatorFilter] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [rtoFilter, setRtoFilter] = useState('All');
  const [coordinatorFilter, setCoordinatorFilter] = useState('All');

  const requestList = requests;

  // Filter requests
  const filteredRequests = requestList.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesRto = rtoFilter === 'All' || item.rto === rtoFilter;
    return matchesSearch && matchesStatus && matchesRto;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    const data = filteredRequests.map(s => `${s.reqId},${s.title},${s.student},${s.company},${s.rto},${s.status},${s.date}`).join('\n');
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_export.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedRequests.map(s => s.reqId));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    setShowBulkActions(false);
    if (selectedRows.length === 0) {
      showToast('Please select requests first');
      return;
    }
    showToast(`${action} applied to ${selectedRows.length} requests`);
  };

  const handleRowAction = async (action, item) => {
    setShowRowMenu(null);
    const dbId = item.id || item.reqId;
    if (action === 'view') {
      setSelectedRequest({
        ...selectedRequest,
        id: item.reqId,
        dbId: item.id || item.reqId,
        title: item.title,
        student: item.student,
        studentId: item.studentId || 'STU-0002453',
        company: item.company,
        rto: item.rto,
        status: item.status,
        requestedOn: `${item.date} at 10:24 AM`
      });
      setShowDrawer(true);
    } else if (action === 'edit') {
      const nextStatuses = ['New', 'Coordinator Review', 'RTO Review', 'Appointment', 'Approved', 'Rejected'];
      const currentIndex = nextStatuses.indexOf(item.status);
      const nextStatus = nextStatuses[(currentIndex + 1) % nextStatuses.length];
      if (onUpdateRequest) {
        try {
          await onUpdateRequest(dbId, { status: nextStatus });
          showToast(`Updated status to ${nextStatus}`);
        } catch (err) {
          console.error(err);
          showToast('Failed to update status');
        }
      } else {
        showToast(`Mock updated status to ${nextStatus}`);
      }
    } else if (action === 'delete') {
      if (onDeleteRequest) {
        try {
          await onDeleteRequest(dbId);
          showToast('Request deleted successfully');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete request');
        }
      } else {
        showToast(`Delete action for ${item.reqId} (mock)`);
      }
    }
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || rtoFilter !== 'All' || coordinatorFilter !== 'All';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setRtoFilter('All');
    setCoordinatorFilter('All');
    showToast('Filters cleared');
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCreateAppointment = () => {
    showToast('Creating appointment...');
    if (onNext) setTimeout(onNext, 800);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-purple-50 text-purple-600';
      case 'Coordinator Review': return 'bg-blue-50 text-blue-600';
      case 'RTO Review': return 'bg-amber-50 text-amber-600';
      case 'Appointment': return 'bg-cyan-50 text-cyan-600';
      case 'Offered': return 'bg-emerald-50 text-emerald-600';
      case 'Declined': return 'bg-rose-50 text-rose-600';
      case 'Closed': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="flex gap-4 items-start pb-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 min-w-0">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">New Requests</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">24</h3>
            </div>
            <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Coordinator Review</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">18</h3>
            </div>
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">RTO Review</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">15</h3>
            </div>
            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Appointment</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">22</h3>
            </div>
            <div className="w-6 h-6 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Offered</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">31</h3>
            </div>
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Declined / Closed</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">12</h3>
            </div>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <XCircleIcon className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Toolbar - Single Row */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search requests..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-7 py-2 bg-slate-50/70 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200 shrink-0"></div>

          {/* Filter Buttons */}
          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowStatusFilter(!showStatusFilter); setShowRtoFilter(false); setShowCoordinatorFilter(false); setShowMoreFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Status</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showStatusFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'New', 'Coordinator Review', 'RTO Review', 'Appointment', 'Offered', 'Declined', 'Closed'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowStatusFilter(false); setCurrentPage(1); showToast(`Status: ${s}`); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] rounded-lg ${statusFilter === s ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowRtoFilter(!showRtoFilter); setShowStatusFilter(false); setShowCoordinatorFilter(false); setShowMoreFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>RTO</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showRtoFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'AI Global Institute', 'Melbourne City College', 'Deakin College', 'Victoria University', 'Box Hill Institute'].map((r) => (
                  <button 
                    key={r}
                    onClick={() => { setRtoFilter(r); setShowRtoFilter(false); setCurrentPage(1); showToast(`RTO: ${r}`); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] rounded-lg ${rtoFilter === r ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowCoordinatorFilter(!showCoordinatorFilter); setShowStatusFilter(false); setShowRtoFilter(false); setShowMoreFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Coord.</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showCoordinatorFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson'].map((c) => (
                  <button 
                    key={c}
                    onClick={() => { setCoordinatorFilter(c); setShowCoordinatorFilter(false); showToast(`Coord.: ${c}`); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] rounded-lg ${coordinatorFilter === c ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowMoreFilters(!showMoreFilters); setShowStatusFilter(false); setShowRtoFilter(false); setShowCoordinatorFilter(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Filter className="w-3 h-3 text-slate-500" />
              <span>More</span>
            </button>
            {showMoreFilters && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Filters</p>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded accent-blue-600" />
                    <span>Remote Only</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded accent-blue-600" />
                    <span>On-site Only</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded accent-blue-600" />
                    <span>Hybrid</span>
                  </label>
                </div>
                <button 
                  onClick={() => { setShowMoreFilters(false); showToast('Filters applied'); }}
                  className="w-full py-1.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-[11px] font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="text-[11px] font-semibold text-blue-600 hover:underline px-1 shrink-0 whitespace-nowrap">
              Clear
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 shrink-0"></div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                  CSV
                </button>
                <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                  Excel
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setShowNewRequest(!showNewRequest)}
              className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              <span>New Request</span>
            </button>
            {showNewRequest && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Create New Request</h4>
                <div className="space-y-2">
                  {/* Student picker */}
                  <select 
                    value={newRequestStudentId} 
                    onChange={(e) => {
                      setNewRequestStudentId(e.target.value);
                      const stu = students.find(s => s.id === e.target.value);
                      if (stu?.rto) setNewRequestRto(stu.rto);
                    }} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>

                  {/* Job picker — auto-fills Title + Company */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pick from Jobs</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => {
                        const jobId = e.target.value;
                        setSelectedJobId(jobId);
                        if (jobId) {
                          const job = availableJobs.find(j => (j._id || j.id) === jobId);
                          if (job) {
                            setNewRequestTitle(job.title || '');
                            setNewRequestCompany(job.employer || '');
                            if (job.rto) setNewRequestRto(job.rto);
                          }
                        } else {
                          setNewRequestTitle('');
                          setNewRequestCompany('');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-blue-50/40 text-slate-700"
                    >
                      <option value="">— Select a Job (auto-fill) —</option>
                      {availableJobs.map(j => (
                        <option key={j._id || j.id} value={j._id || j.id}>
                          {j.title} @ {j.employer}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Selects a job and auto-fills Title & Company below</p>
                  </div>

                  {/* Editable title */}
                  <input 
                    placeholder="Position Title" 
                    value={newRequestTitle} 
                    onChange={(e) => setNewRequestTitle(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                  />

                  {/* Editable company */}
                  <input 
                    placeholder="Company / Employer" 
                    value={newRequestCompany} 
                    onChange={(e) => setNewRequestCompany(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                  />

                  {/* RTO (auto-filled from student, editable) */}
                  <input 
                    placeholder="RTO (auto-filled from student)" 
                    value={newRequestRto} 
                    onChange={(e) => setNewRequestRto(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50" 
                  />

                  <select 
                    value={newRequestWorkType} 
                    onChange={(e) => setNewRequestWorkType(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button 
                    onClick={async () => {
                      if (!newRequestStudentId || !newRequestCompany || !newRequestTitle) {
                        showToast('Please fill in all fields');
                        return;
                      }
                      const selectedStu = students.find((s) => s.id === newRequestStudentId);
                      if (!selectedStu) return;
                      const requestData = {
                        title: newRequestTitle,
                        student: selectedStu.name,
                        studentId: selectedStu.id,
                        company: newRequestCompany,
                        rto: newRequestRto || selectedStu.rto || 'N/A',
                        workType: newRequestWorkType,
                        status: 'New',
                      };
                      if (onCreateRequest) {
                        try {
                          await onCreateRequest(requestData);
                          showToast('Request created successfully');
                          setShowNewRequest(false);
                          setNewRequestStudentId('');
                          setNewRequestCompany('');
                          setNewRequestTitle('');
                          setNewRequestRto('');
                          setSelectedJobId('');
                        } catch (err) {
                          console.error(err);
                          showToast('Failed to create request');
                        }
                      } else {
                        showToast('Mock request created');
                        setShowNewRequest(false);
                      }
                    }}
                    className="flex-1 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                  >
                    Create
                  </button>
                  <button 
                    onClick={() => setShowNewRequest(false)}
                    className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Subheader Count & Views */}
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-slate-500 font-medium">{filteredRequests.length} requests found</p>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs hover:bg-slate-50"
              >
                <span className="text-xs text-slate-700 font-medium mr-2">
                  {selectedRows.length > 0 ? `${selectedRows.length} Selected` : 'Bulk Actions'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                  <button onClick={() => handleBulkAction('Export')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export Selected</span>
                  </button>
                  <button onClick={() => handleBulkAction('Status update')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Update Status</span>
                  </button>
                  <button onClick={() => handleBulkAction('Delete')} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs space-x-1">
              <button 
                onClick={() => { setViewMode('grid'); showToast('Grid view enabled'); }}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { setViewMode('list'); showToast('List view enabled'); }}
                className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 uppercase tracking-wider border-b border-slate-200 text-[10px] font-semibold">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 accent-blue-600"
                    checked={selectedRows.length === paginatedRequests.length && paginatedRequests.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4">Request</th>
                <th className="p-4">Student</th>
                <th className="p-4">Company</th>
                <th className="p-4">RTO / Institute</th>
                <th className="p-4">Status</th>
                <th className="p-4">Requested On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedRequests.map((item, i) => {
                const isSelected = selectedRequest ? selectedRequest.id === item.reqId : false;
                const isRowSelected = selectedRows.includes(item.reqId);
                return (
                  <tr 
                    key={i} 
                    onClick={() => {
                      setSelectedRequest({
                        id: item.reqId,
                        title: item.title,
                        student: item.student,
                        studentId: item.studentId || 'STU-0002453',
                        company: item.company,
                        rto: item.rto,
                        status: item.status,
                        requestedOn: `${item.date} at 10:24 AM`
                      });
                      setShowDrawer(true);
                    }}
                    className={`cursor-pointer transition ${isSelected ? 'bg-blue-50/40' : isRowSelected ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 accent-blue-600"
                        checked={isRowSelected}
                        onChange={() => handleSelectRow(item.reqId)}
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.reqId}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{item.title}</p>
                    </td>
                    <td className="py-3 px-2 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600 text-xs shrink-0">
                        {item.student[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.student}</p>
                        <p className="text-[11px] text-slate-400">{item.studentId || 'STU-0002453'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium flex items-center space-x-1.5 pt-5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.company}</span>
                    </td>
                    <td className="p-4 text-slate-600">{item.rto}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{item.date}</td>
                    <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setShowRowMenu(showRowMenu === item.reqId ? null : item.reqId)}
                        className="p-1 hover:bg-slate-100 rounded-lg inline-flex"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </button>
                      {showRowMenu === item.reqId && (
                        <div className="absolute right-4 top-10 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                          <button onClick={() => handleRowAction('view', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>
                          <button onClick={() => handleRowAction('edit', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleRowAction('delete', item)} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                    No requests found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <p>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} results</p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button 
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg font-medium ${
                      currentPage === pageNum ? 'bg-blue-600 text-white font-bold' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button onClick={() => handlePageChange(totalPages)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700">
                    {totalPages}
                  </button>
                </>
              )}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="ml-4 relative">
                <button 
                  onClick={() => setShowBulkActions(false)}
                  className="flex items-center border border-slate-200 rounded-xl px-2 py-1 bg-white hover:bg-slate-50"
                >
                  <span className="mr-2 font-medium text-slate-700">{pageSize} / page</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5 hidden">
                  {[10, 25, 50, 100].map(size => (
                    <button 
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                    >
                      {size} / page
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center space-x-2 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Students</span>
            </button>
          ) : <div />}
          {onNext && (
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-xs font-semibold text-white rounded-xl flex items-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs"
            >
              <span>Continue to Appointments</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Drawer / Detail Panel - Professional Mini Card */}
      {showDrawer && selectedRequest && (
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
        {/* Card Header with Gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-sm tracking-wide">{selectedRequest.id}</h4>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-1.5">{selectedRequest.title}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Requested on {selectedRequest.requestedOn}</span>
              </p>
            </div>
            <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition mt-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key info badges */}
          <div className="relative mt-4 flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <Briefcase className="w-2.5 h-2.5 text-purple-300" />
              <span>{selectedRequest.workType}</span>
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <Layers className="w-2.5 h-2.5 text-blue-300" />
              <span>{selectedRequest.duration}</span>
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5 text-emerald-300" />
              <span>{selectedRequest.location}</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 text-[11px] font-semibold text-slate-500 space-x-5 bg-white">
          {['Overview', 'Timeline', 'Details', 'Notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 relative transition ${
                activeTab === tab ? 'text-blue-600 font-bold' : 'hover:text-slate-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Duration</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedRequest.duration}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedRequest.workType}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Start</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedRequest.preferredStart}</p>
            </div>
          </div>

          {/* Request Timeline Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-purple-600 rounded-full"></span>
              <span>Request Timeline</span>
            </h5>
            <div className="space-y-2.5 pl-2 border-l-2 border-slate-100 ml-1">
              <div className="relative pl-4">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>
                <p className="font-bold text-slate-900">Request Submitted</p>
                <p className="text-[11px] text-slate-400">{selectedRequest.requestedOn}</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                <p className="font-semibold text-slate-700">Coordinator Review</p>
                <p className="text-[11px] text-slate-400">Pending</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                <p className="font-semibold text-slate-700">RTO Review</p>
                <p className="text-[11px] text-slate-400">Pending</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                <p className="font-semibold text-slate-700">Appointment</p>
                <p className="text-[11px] text-slate-400">Pending</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                <p className="font-semibold text-slate-700">Offered</p>
                <p className="text-[11px] text-slate-400">Pending</p>
              </div>
            </div>
          </div>

          {/* Request Details Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              <span>Request Details</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Student</span>
                </span>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{selectedRequest.student}</p>
                  <p className="text-[11px] text-slate-400">{selectedRequest.studentId}</p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.company}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>RTO / Institute</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.rto}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start Date</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.preferredStart}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.duration}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Work Type</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.workType}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.location}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Coordinator</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedRequest.coordinator}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h5 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Actions</span>
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => showToast('Assigning coordinator...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Assign</span>
              </button>
              <button 
                onClick={() => showToast('Viewing full details...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Details</span>
              </button>
            </div>
            <button 
              onClick={handleCreateAppointment}
              className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs text-[11px]"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Create Appointment</span>
              <ArrowUpRight className="w-3 h-3 text-blue-200" />
            </button>
          </div>

          {/* Footer Meta */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Request ID</span>
              <span className="text-slate-600 font-medium">{selectedRequest.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Requested On</span>
              <span className="text-slate-600 font-medium">{selectedRequest.requestedOn}</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// Internal SVG Helper Icons
function XCircleIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}