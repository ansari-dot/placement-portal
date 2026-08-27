// src/components/workflow/WorkflowStep4Internships.jsx
import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  ChevronDown, LayoutGrid, List, ChevronLeft, ChevronRight, X, 
  Calendar, MapPin, Building2, Clock, Briefcase, User, Edit, CheckCircle2, Award,
  ShieldCheck, Trash2, Eye, CheckSquare, FileText, Layers, 
  AlertCircle, ThumbsUp, ThumbsDown, UserX, Calendar as CalendarIcon,
  Info, ExternalLink, MessageCircle
} from 'lucide-react';

export default function WorkflowStep4Internships({ 
  internships = [], 
  appointments = [],
  requests = [],
  onBack,
  onCreateInternship,
  onUpdateInternship,
  onDeleteInternship,
  students = []
}) {
  const [newIntStudentId, setNewIntStudentId] = useState('');
  const [newIntCompany, setNewIntCompany] = useState('');
  const [newIntTitle, setNewIntTitle] = useState('');
  const [newIntWorkType, setNewIntWorkType] = useState('Remote');
  const [newIntStartDate, setNewIntStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newIntDuration, setNewIntDuration] = useState('12 weeks');

  const [selectedInternship, setSelectedInternship] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddInternship, setShowAddInternship] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [activeStatusTab, setActiveStatusTab] = useState('All Internships');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Helper Functions ─────────────────────────────────────────────────────

  const calculateEndDate = (startDate, duration) => {
    if (!startDate) return 'TBD';
    const start = new Date(startDate);
    const weeks = parseInt(duration) || 12;
    const end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7));
    return end.toISOString().split('T')[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600';
      case 'Joined': return 'bg-blue-50 text-blue-600';
      case 'Waiting to Join': return 'bg-amber-50 text-amber-600';
      case 'Completed': return 'bg-purple-50 text-purple-600';
      case 'Declined': return 'bg-rose-50 text-rose-600';
      case 'Withdrawn': return 'bg-orange-50 text-orange-600';
      case 'Cancelled': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Joined': return <User className="w-3.5 h-3.5 text-blue-600" />;
      case 'Waiting to Join': return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'Completed': return <Award className="w-3.5 h-3.5 text-purple-600" />;
      case 'Declined': return <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />;
      case 'Withdrawn': return <UserX className="w-3.5 h-3.5 text-orange-600" />;
      case 'Cancelled': return <AlertCircle className="w-3.5 h-3.5 text-slate-500" />;
      default: return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // ─── DYNAMIC: Process all appointments ────────────────────────────────────

  const processedInternships = useMemo(() => {
    let result = [...(internships || [])];
    const existingStudentIds = new Set(result.map(i => i.studentId));

    // Process ALL appointments - Successful AND Rejected/Declined
    (appointments || []).forEach(appt => {
      // Skip if student already has an internship record
      if (existingStudentIds.has(appt.studentId)) return;

      const startDate = appt.date || new Date().toISOString().split('T')[0];
      const duration = '12 weeks';
      
      // Determine status based on appointment status
      let status = 'Waiting to Join';
      if (appt.status === 'Completed' || appt.status === 'Scheduled') {
        status = 'Waiting to Join';
      } else if (appt.status === 'Declined') {
        status = 'Declined';
      } else if (appt.status === 'Withdrawn') {
        status = 'Withdrawn';
      } else if (appt.status === 'Cancelled') {
        status = 'Cancelled';
      } else if (appt.status === 'No Show') {
        status = 'Declined';
      }

      result.push({
        id: appt.id || appt._id || `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        intId: appt.apptId ? `INT-${appt.apptId.substring(4)}` : `INT-${String(result.length + 1).padStart(6, '0')}`,
        student: appt.student || 'Unknown Student',
        studentId: appt.studentId || '',
        company: appt.company || 'Unknown Company',
        title: appt.position || 'Internship Placement',
        rto: appt.rto || 'TBD',
        status: status,
        start: startDate,
        end: calculateEndDate(startDate, duration),
        duration: duration,
        workType: appt.meetingType || 'In-Person',
        location: appt.location || 'TBD',
        coordinator: appt.interviewer || '',
        progress: status === 'Completed' ? 100 : 0,
        tasksCompleted: '0',
        trainingCompleted: '0',
        reviewsCompleted: '0',
        notes: appt.notes || '',
        _appointmentId: appt.id || appt._id,
        _appointmentDate: appt.date,
        _appointmentTime: appt.time,
        _appointmentStatus: appt.status,
        cancellationReason: appt.cancellationReason || '',
        cancellationType: appt.cancellationType || '',
        contactedIndustries: appt.contactedIndustries || [],
      });

      existingStudentIds.add(appt.studentId);
    });

    return result;
  }, [internships, appointments]);

  // ─── Metrics ──────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const total = processedInternships.length;
    const active = processedInternships.filter(i => i.status === 'Active').length;
    const waiting = processedInternships.filter(i => i.status === 'Waiting to Join').length;
    const joined = processedInternships.filter(i => i.status === 'Joined').length;
    const completed = processedInternships.filter(i => i.status === 'Completed').length;
    const declined = processedInternships.filter(i => i.status === 'Declined').length;
    const withdrawn = processedInternships.filter(i => i.status === 'Withdrawn').length;
    const cancelled = processedInternships.filter(i => i.status === 'Cancelled').length;
    return { total, active, waiting, joined, completed, declined, withdrawn, cancelled };
  }, [processedInternships]);

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredInternships = processedInternships.filter(item => {
    const matchesSearch = 
      (item.student || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.intId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCompany = companyFilter === 'All' || item.company === companyFilter;
    const matchesStatusTab = activeStatusTab === 'All Internships' || item.status === activeStatusTab;
    return matchesSearch && matchesStatus && matchesCompany && matchesStatusTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInternships.length / pageSize));
  const paginatedInternships = filteredInternships.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || 
                          companyFilter !== 'All' || activeStatusTab !== 'All Internships';

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleExport = (format) => {
    setShowExportMenu(false);
    const data = filteredInternships.map(s => 
      `${s.intId},${s.student},${s.company},${s.title},${s.status},${s.start},${s.end},${s.progress}%`
    ).join('\n');
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `internships_export.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedInternships.map(s => s.intId));
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
      showToast('Please select internships first');
      return;
    }
    showToast(`${action} applied to ${selectedRows.length} internships`);
  };

  const handleRowAction = async (action, item) => {
    setShowRowMenu(null);
    const dbId = item.id || item.intId;
    if (action === 'view') {
      setSelectedInternship(item);
      setShowDrawer(true);
    } else if (action === 'edit') {
      const nextStatuses = ['Waiting to Join', 'Joined', 'Active', 'Completed'];
      const currentIndex = nextStatuses.indexOf(item.status);
      const nextStatus = nextStatuses[(currentIndex + 1) % nextStatuses.length];
      if (onUpdateInternship && dbId && !dbId.startsWith('INT-')) {
        try {
          await onUpdateInternship(dbId, { status: nextStatus });
          showToast(`Updated status to ${nextStatus}`);
        } catch (err) {
          console.error(err);
          showToast('Failed to update status');
        }
      } else {
        showToast(`Mock updated status to ${nextStatus}`);
      }
    } else if (action === 'delete') {
      if (onDeleteInternship && dbId && !dbId.startsWith('INT-')) {
        try {
          await onDeleteInternship(dbId);
          showToast('Internship deleted successfully');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete internship');
        }
      } else {
        showToast(`Delete action for ${item.intId} (mock)`);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCompanyFilter('All');
    setActiveStatusTab('All Internships');
    showToast('Filters cleared');
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 items-start pb-8 relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex-1 space-y-4 min-w-0">
        
        {/* ─── Metrics Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Total</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.total}</h3>
            </div>
            <div className="w-6 h-6 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Waiting</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.waiting}</h3>
            </div>
            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Joined</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.joined}</h3>
            </div>
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Active</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.active}</h3>
            </div>
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Completed</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.completed}</h3>
            </div>
            <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Award className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Declined</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.declined}</h3>
            </div>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <ThumbsDown className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Withdrawn</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.withdrawn}</h3>
            </div>
            <div className="w-6 h-6 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <UserX className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Cancelled</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{metrics.cancelled}</h3>
            </div>
            <div className="w-6 h-6 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* ─── Toolbar ────────────────────────────────────────────────────── */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search internships..." 
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

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowStatusFilter(!showStatusFilter); setShowCompanyFilter(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Status</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showStatusFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'Active', 'Joined', 'Waiting to Join', 'Completed', 'Declined', 'Withdrawn', 'Cancelled'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowStatusFilter(false); setCurrentPage(1); }}
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
              onClick={() => { setShowCompanyFilter(!showCompanyFilter); setShowStatusFilter(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Company</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showCompanyFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', ...new Set(processedInternships.map(i => i.company))].filter(Boolean).map((c) => (
                  <button 
                    key={c}
                    onClick={() => { setCompanyFilter(c); setShowCompanyFilter(false); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] rounded-lg ${companyFilter === c ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {c}
                  </button>
                ))}
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
              onClick={() => setShowAddInternship(!showAddInternship)}
              className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              <span>Add Internship</span>
            </button>
            {showAddInternship && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Add New Internship</h4>
                <div className="space-y-2">
                  <select 
                    value={newIntStudentId} 
                    onChange={(e) => {
                      setNewIntStudentId(e.target.value);
                      const stu = students.find(s => s.id === e.target.value);
                      if (stu?.company) setNewIntCompany(stu.company);
                    }} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                  <input 
                    placeholder="Company" 
                    value={newIntCompany} 
                    onChange={(e) => setNewIntCompany(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                  />
                  <input 
                    placeholder="Role Title" 
                    value={newIntTitle} 
                    onChange={(e) => setNewIntTitle(e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date"
                      value={newIntStartDate} 
                      onChange={(e) => setNewIntStartDate(e.target.value)} 
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                    />
                    <input 
                      placeholder="Duration (e.g. 12 weeks)" 
                      value={newIntDuration} 
                      onChange={(e) => setNewIntDuration(e.target.value)} 
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <select 
                    value={newIntWorkType} 
                    onChange={(e) => setNewIntWorkType(e.target.value)} 
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
                      if (!newIntStudentId || !newIntCompany || !newIntTitle) {
                        showToast('Please fill in all fields');
                        return;
                      }
                      const selectedStu = students.find((s) => s.id === newIntStudentId);
                      if (!selectedStu) return;
                      const endDate = calculateEndDate(newIntStartDate, newIntDuration);
                      const internshipData = {
                        student: selectedStu.name,
                        studentId: selectedStu.id,
                        company: newIntCompany,
                        title: newIntTitle,
                        workType: newIntWorkType,
                        rto: selectedStu.rto || 'N/A',
                        status: 'Waiting to Join',
                        start: newIntStartDate,
                        end: endDate,
                        duration: newIntDuration,
                      };
                      if (onCreateInternship) {
                        try {
                          await onCreateInternship(internshipData);
                          showToast('Internship added successfully');
                          setShowAddInternship(false);
                          setNewIntStudentId('');
                          setNewIntCompany('');
                          setNewIntTitle('');
                          setNewIntStartDate(new Date().toISOString().split('T')[0]);
                          setNewIntDuration('12 weeks');
                        } catch (err) {
                          console.error(err);
                          showToast('Failed to add internship');
                        }
                      } else {
                        showToast('Mock internship added');
                        setShowAddInternship(false);
                      }
                    }}
                    className="flex-1 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] text-white text-xs font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                  >
                    Create
                  </button>
                  <button 
                    onClick={() => setShowAddInternship(false)}
                    className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Status Tabs ────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 space-x-6 px-1 overflow-x-auto">
          {['All Internships', 'Active', 'Waiting to Join', 'Joined', 'Declined', 'Withdrawn', 'Cancelled', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveStatusTab(tab); setCurrentPage(1); }}
              className={`pb-3 relative transition whitespace-nowrap ${
                activeStatusTab === tab ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-800'
              }`}
            >
              {tab}
              <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {tab === 'All Internships' ? filteredInternships.length : 
                  filteredInternships.filter(i => i.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 uppercase tracking-wider border-b border-slate-200 text-[10px] font-semibold">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 accent-blue-600"
                      checked={selectedRows.length === paginatedInternships.length && paginatedInternships.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Start → End</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {paginatedInternships.map((item, i) => {
                  const isSelected = selectedInternship ? selectedInternship.id === item.id : false;
                  const isRowSelected = selectedRows.includes(item.intId);
                  return (
                    <tr 
                      key={i} 
                      onClick={() => {
                        setSelectedInternship(item);
                        setShowDrawer(true);
                      }}
                      className={`cursor-pointer transition ${isSelected ? 'bg-blue-50/40' : isRowSelected ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 accent-blue-600"
                          checked={isRowSelected}
                          onChange={() => handleSelectRow(item.intId)}
                        />
                      </td>
                      <td className="p-4 font-bold text-slate-900">{item.intId}</td>
                      <td className="py-3 px-2 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600 text-xs shrink-0">
                          {item.student ? item.student[0] : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.student}</p>
                          <p className="text-[11px] text-slate-400">{item.studentId}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium flex items-center space-x-1.5 pt-5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.company}</span>
                      </td>
                      <td className="p-4 text-slate-600">{item.title}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5">
                          {getStatusIcon(item.status)}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-600">{formatDate(item.start)}</span>
                          <span className="text-[9px] text-slate-400">→ {formatDate(item.end)}</span>
                        </div>
                      </td>
                      <td className="p-4 w-32">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${item.progress || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{item.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setShowRowMenu(showRowMenu === item.intId ? null : item.intId)}
                          className="p-1 hover:bg-slate-100 rounded-lg inline-flex"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                        {showRowMenu === item.intId && (
                          <div className="absolute right-4 top-10 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                            <button onClick={() => handleRowAction('view', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Details</span>
                            </button>
                            <button onClick={() => handleRowAction('edit', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                              <Edit className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Status</span>
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
                {paginatedInternships.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                      No internships found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <p>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredInternships.length)} of {filteredInternships.length} results</p>
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
            </div>
          </div>
        </div>

        {/* ─── Back Button ────────────────────────────────────────────────── */}
        {onBack && (
          <div className="flex justify-start pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center space-x-2 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Appointments</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Right Drawer ────────────────────────────────────────────────── */}
      {showDrawer && selectedInternship && (
        <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
          <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-${
            selectedInternship.status === 'Completed' ? 'purple' : 
            selectedInternship.status === 'Declined' ? 'rose' : 
            selectedInternship.status === 'Withdrawn' ? 'orange' : 
            selectedInternship.status === 'Cancelled' ? 'slate' : 'emerald'
          }-900 p-5`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm tracking-wide">{selectedInternship.intId}</h4>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${getStatusColor(selectedInternship.status)}`}>
                    {selectedInternship.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1.5">{selectedInternship.title}</p>
                <p className="text-[10px] text-slate-300 mt-1 flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>{selectedInternship.company}</span>
                </p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 shrink-0 border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm">
                {selectedInternship.student ? selectedInternship.student[0] : '?'}
              </div>
              <div>
                <p className="font-bold text-white text-xs">{selectedInternship.student}</p>
                <p className="text-[10px] text-slate-400 font-mono">{selectedInternship.studentId}</p>
                <p className="text-[10px] text-slate-300">{selectedInternship.rto}</p>
              </div>
            </div>

            <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
                <Calendar className="w-2.5 h-2.5 text-emerald-300" />
                <span>{formatDate(selectedInternship.start)}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
                <CalendarIcon className="w-2.5 h-2.5 text-rose-300" />
                <span>→ {formatDate(selectedInternship.end)}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
                <Clock className="w-2.5 h-2.5 text-blue-300" />
                <span>{selectedInternship.duration || '12 weeks'}</span>
              </span>
            </div>

            {/* Show cancellation reason if exists */}
            {selectedInternship.cancellationReason && (
              <div className="relative mt-3 p-2 bg-white/10 rounded-xl border border-white/10">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Reason</p>
                    <p className="text-[10px] text-slate-200">{selectedInternship.cancellationReason}</p>
                    {selectedInternship.cancellationType && (
                      <p className="text-[8px] text-slate-400 mt-0.5">
                        Type: {selectedInternship.cancellationType === 'student' ? 'Student Request' : 
                                selectedInternship.cancellationType === 'industry' ? 'Industry Rejected' : 
                                selectedInternship.cancellationType === 'withdrawn' ? 'Student Withdrew' : 'Other'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex border-b border-slate-100 px-4 text-[11px] font-semibold text-slate-500 space-x-4 bg-white overflow-x-auto">
            {['Overview', 'Progress', 'Details', 'Notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 relative transition whitespace-nowrap ${activeTab === tab ? 'text-blue-600 font-bold' : 'hover:text-slate-800'}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4 text-xs max-h-[500px] overflow-y-auto">
            {activeTab === 'Overview' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Duration</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInternship.duration || '12 weeks'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInternship.workType || 'On-site'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Progress</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">{selectedInternship.progress || 0}%</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <span className="w-1 h-3 bg-emerald-600 rounded-full"></span>
                    <span>Internship Details</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Start Date</span>
                      <span className="font-semibold text-slate-900">{formatDate(selectedInternship.start)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">End Date</span>
                      <span className="font-semibold text-slate-900">{formatDate(selectedInternship.end)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-semibold text-slate-900">{selectedInternship.duration || '12 weeks'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location</span>
                      <span className="font-semibold text-slate-900">{selectedInternship.location || 'TBD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Coordinator</span>
                      <span className="font-semibold text-slate-900">{selectedInternship.coordinator || 'TBD'}</span>
                    </div>
                    {selectedInternship._appointmentDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">From Appointment</span>
                        <span className="font-semibold text-slate-900">{selectedInternship._appointmentDate}</span>
                      </div>
                    )}
                    {selectedInternship.cancellationReason && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cancellation Reason</span>
                        <span className="font-semibold text-slate-900 text-right max-w-[150px] break-words">
                          {selectedInternship.cancellationReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Progress' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-4">
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-slate-200 fill-none" />
                      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-blue-600 fill-none" strokeDasharray="163" strokeDashoffset={163 - (163 * (selectedInternship.progress || 0)) / 100} />
                    </svg>
                    <span className="absolute text-sm font-bold text-slate-900">{selectedInternship.progress || 0}%</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between space-x-6 text-slate-600">
                      <span>Tasks Completed</span>
                      <span className="font-bold text-slate-900">{selectedInternship.tasksCompleted || '0'}</span>
                    </div>
                    <div className="flex justify-between space-x-6 text-slate-600">
                      <span>Training Completed</span>
                      <span className="font-bold text-slate-900">{selectedInternship.trainingCompleted || '0'}</span>
                    </div>
                    <div className="flex justify-between space-x-6 text-slate-600">
                      <span>Reviews Completed</span>
                      <span className="font-bold text-slate-900">{selectedInternship.reviewsCompleted || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Details' && (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Internship ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInternship.intId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Student</span>
                  <span className="font-semibold text-slate-800">{selectedInternship.student}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Student ID</span>
                  <span className="font-mono text-slate-800">{selectedInternship.studentId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Company</span>
                  <span className="font-semibold text-slate-800">{selectedInternship.company}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">RTO</span>
                  <span className="font-semibold text-slate-800">{selectedInternship.rto || 'TBD'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Status</span>
                  <span className={`font-bold ${selectedInternship.status === 'Declined' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedInternship.status}
                  </span>
                </div>
                {selectedInternship.cancellationReason && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Cancellation Reason</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[150px] break-words">
                      {selectedInternship.cancellationReason}
                    </span>
                  </div>
                )}
                {selectedInternship.cancellationType && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Cancellation Type</span>
                    <span className="font-semibold text-slate-800">
                      {selectedInternship.cancellationType === 'student' ? 'Student Request' :
                       selectedInternship.cancellationType === 'industry' ? 'Industry Rejected' :
                       selectedInternship.cancellationType === 'withdrawn' ? 'Student Withdrew' : 'Other'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Notes' && (
              <div>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedInternship.notes || 'No notes recorded for this internship.'}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
              onClick={() => showToast('Opening full details...')}
              className="w-full py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Full Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}