// src/components/workflow/WorkflowStep4Internships.jsx
import React, { useState } from 'react';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  ChevronDown, LayoutGrid, List, ChevronLeft, ChevronRight, X, 
  Calendar, MapPin, Building2, Clock, Briefcase, User, Edit, CheckCircle2, Award,
  ShieldCheck, Trash2, Eye, CheckSquare, FileText, Layers
} from 'lucide-react';

export default function WorkflowStep4Internships({ 
  internships = [], 
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

  const [selectedInternship, setSelectedInternship] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRtoFilter, setShowRtoFilter] = useState(false);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddInternship, setShowAddInternship] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [rtoFilter, setRtoFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [activeStatusTab, setActiveStatusTab] = useState('All Internships');

  const internshipList = internships;

  // Filter internships
  const filteredInternships = internshipList.filter(item => {
    const matchesSearch = 
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.intId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCompany = companyFilter === 'All' || item.company === companyFilter;
    const matchesStatusTab = activeStatusTab === 'All Internships' || item.status === activeStatusTab;
    return matchesSearch && matchesStatus && matchesCompany && matchesStatusTab;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInternships.length / pageSize));
  const paginatedInternships = filteredInternships.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All' || rtoFilter !== 'All' || companyFilter !== 'All' || activeStatusTab !== 'All Internships';

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    const data = filteredInternships.map(s => `${s.intId},${s.student},${s.company},${s.title},${s.status},${s.start},${s.progress}%`).join('\n');
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
      setSelectedInternship({
        ...selectedInternship,
        id: item.intId,
        dbId: item.id || item.intId,
        student: item.student,
        studentId: item.studentId,
        company: item.company,
        title: item.title,
        status: item.status,
        overallProgress: item.progress
      });
      setShowDrawer(true);
    } else if (action === 'edit') {
      const nextStatuses = ['Waiting to Join', 'Joined', 'Active', 'Completed', 'Declined'];
      const currentIndex = nextStatuses.indexOf(item.status);
      const nextStatus = nextStatuses[(currentIndex + 1) % nextStatuses.length];
      if (onUpdateInternship) {
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
      if (onDeleteInternship) {
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
    setRtoFilter('All');
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600';
      case 'Joined': return 'bg-blue-50 text-blue-600';
      case 'Waiting to Join': return 'bg-amber-50 text-amber-600';
      case 'Completed': return 'bg-purple-50 text-purple-600';
      case 'Declined': return 'bg-rose-50 text-rose-600';
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
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Active Internships</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">142</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 12% vs last month</span>
            </div>
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Waiting to Join</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">28</h3>
              <span className="text-[9px] text-amber-600 font-semibold mt-0.5 inline-block">↑ 8% vs last month</span>
            </div>
            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Joined</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">98</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 15% vs last month</span>
            </div>
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Declined</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">16</h3>
              <span className="text-[9px] text-rose-600 font-semibold mt-0.5 inline-block">↓ 4% vs last month</span>
            </div>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <XCircleIcon className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Completed</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">64</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 10% vs last month</span>
            </div>
            <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Award className="w-3 h-3" />
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

          {/* Filter Buttons */}
          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowStatusFilter(!showStatusFilter); setShowRtoFilter(false); setShowCompanyFilter(false); setShowMoreFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Status</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showStatusFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'Active', 'Joined', 'Waiting to Join', 'Completed', 'Declined'].map((s) => (
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
              onClick={() => { setShowRtoFilter(!showRtoFilter); setShowStatusFilter(false); setShowCompanyFilter(false); setShowMoreFilters(false); }}
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
              onClick={() => { setShowCompanyFilter(!showCompanyFilter); setShowStatusFilter(false); setShowRtoFilter(false); setShowMoreFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Company</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showCompanyFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                {['All', 'TechSolutions Pty Ltd', 'DataInsights', 'Pixel Perfect', 'BrandBoost', 'FinEdge Solutions', 'SecureNet', 'CloudNova', 'DataCore'].map((c) => (
                  <button 
                    key={c}
                    onClick={() => { setCompanyFilter(c); setShowCompanyFilter(false); setCurrentPage(1); showToast(`Company: ${c}`); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] rounded-lg ${companyFilter === c ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowMoreFilters(!showMoreFilters); setShowStatusFilter(false); setShowRtoFilter(false); setShowCompanyFilter(false); }}
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
              onClick={() => setShowAddInternship(!showAddInternship)}
              className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              <span>Add Internship</span>
            </button>
            {showAddInternship && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Add New Internship</h4>
                <div className="space-y-2">
                  <select 
                    value={newIntStudentId} 
                    onChange={(e) => setNewIntStudentId(e.target.value)} 
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
                      const internshipData = {
                        student: selectedStu.name,
                        studentId: selectedStu.id,
                        company: newIntCompany,
                        title: newIntTitle,
                        workType: newIntWorkType,
                        rto: selectedStu.rto || 'N/A',
                        status: 'Waiting to Join'
                      };
                      if (onCreateInternship) {
                        try {
                          await onCreateInternship(internshipData);
                          showToast('Internship added successfully');
                          setShowAddInternship(false);
                          setNewIntStudentId('');
                          setNewIntCompany('');
                          setNewIntTitle('');
                        } catch (err) {
                          console.error(err);
                          showToast('Failed to add internship');
                        }
                      } else {
                        showToast('Mock internship added');
                        setShowAddInternship(false);
                      }
                    }}
                    className="flex-1 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-lg transition-all duration-500 cursor-pointer"
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

        {/* Status Sub-navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 space-x-6 px-1 overflow-x-auto">
          {['All Internships', 'Active', 'Waiting to Join', 'Joined', 'Declined', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveStatusTab(tab); setCurrentPage(1); showToast(`Showing: ${tab}`); }}
              className={`pb-3 relative transition whitespace-nowrap ${
                activeStatusTab === tab ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table Subheader Count & Bulk Actions */}
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-slate-500 font-medium">{filteredInternships.length} internships found</p>
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
                onClick={() => { setViewMode('grid'); showToast('Grid view'); }}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { setViewMode('list'); showToast('List view'); }}
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
                    checked={selectedRows.length === paginatedInternships.length && paginatedInternships.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4">Internship ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">Company</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">Progress</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedInternships.map((item, i) => {
                const isSelected = selectedInternship ? selectedInternship.id === item.intId : false;
                const isRowSelected = selectedRows.includes(item.intId);
                return (
                  <tr 
                    key={i} 
                    onClick={() => {
                      setSelectedInternship({
                        id: item.intId,
                        student: item.student,
                        studentId: item.studentId,
                        company: item.company,
                        title: item.title,
                        status: item.status,
                        overallProgress: item.progress
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
                        onChange={() => handleSelectRow(item.intId)}
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900">{item.intId}</td>
                    <td className="py-3 px-2 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600 text-xs shrink-0">
                        {item.student[0]}
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{item.start}</td>
                    <td className="p-4 w-32">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{item.progress}%</span>
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
              {paginatedInternships.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                    No internships found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
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

        {/* Back Navigation Button */}
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

      {/* Right Drawer / Detail Panel - Professional Mini Card */}
      {showDrawer && selectedInternship && (
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
        {/* Card Header with Gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-sm tracking-wide">{selectedInternship.id}</h4>
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

          {/* Student info */}
          <div className="relative mt-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 border-2 border-white/20">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt={selectedInternship.student} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-white text-xs">{selectedInternship.student}</p>
              <p className="text-[10px] text-slate-400 font-mono">{selectedInternship.studentId}</p>
            </div>
          </div>

          {/* Key info badges */}
          <div className="relative mt-3 flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <Briefcase className="w-2.5 h-2.5 text-emerald-300" />
              <span>{selectedInternship.workType}</span>
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <Layers className="w-2.5 h-2.5 text-blue-300" />
              <span>{selectedInternship.duration}</span>
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-slate-200 text-[9px] font-bold rounded-full border border-white/10 flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5 text-purple-300" />
              <span>{selectedInternship.location}</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 text-[11px] font-semibold text-slate-500 space-x-5 bg-white">
          {['Overview', 'Progress', 'Documents', 'Notes'].map((tab) => (
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

        {/* Drawer Details Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Duration</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInternship.duration}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInternship.workType}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Progress</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInternship.overallProgress}%</p>
            </div>
          </div>

          {/* Internship Info Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-emerald-600 rounded-full"></span>
              <span>Internship Details</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Period</span>
                </span>
                <span className="font-semibold text-slate-900 text-right">{selectedInternship.period}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedInternship.duration}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Work Type</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedInternship.workType}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedInternship.location}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Coordinator</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedInternship.coordinator}</span>
              </div>
            </div>
          </div>

          {/* Progress Summary Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              <span>Progress Summary</span>
            </h5>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-200 fill-none" />
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-blue-600 fill-none" strokeDasharray="138" strokeDashoffset={138 - (138 * selectedInternship.overallProgress) / 100} />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900">{selectedInternship.overallProgress}%</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between space-x-4 text-slate-600">
                  <span>Tasks</span>
                  <span className="font-bold text-slate-900">{selectedInternship.tasksCompleted}</span>
                </div>
                <div className="flex justify-between space-x-4 text-slate-600">
                  <span>Training</span>
                  <span className="font-bold text-slate-900">{selectedInternship.trainingCompleted}</span>
                </div>
                <div className="flex justify-between space-x-4 text-slate-600">
                  <span>Reviews</span>
                  <span className="font-bold text-slate-900">{selectedInternship.reviewsCompleted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
              <span>Recent Activity</span>
            </h5>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-1.5">
                <span>Weekly report submitted</span>
                <span className="text-slate-400">19 May 2025</span>
              </div>
              <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-1.5">
                <span>Training: Git & GitHub Basics</span>
                <span className="text-slate-400">18 May 2025</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1">
                <span>Internship started</span>
                <span className="text-slate-400">17 May 2025</span>
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
                onClick={() => showToast('Viewing full details...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Details</span>
              </button>
              <button 
                onClick={() => showToast('Editing internship...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>
            </div>
            <button 
              onClick={() => showToast('Ending internship...')}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl flex items-center justify-center space-x-2 transition text-[11px]"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
              <span>End Internship</span>
            </button>
          </div>

          {/* Footer Meta */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Internship ID</span>
              <span className="text-slate-600 font-medium">{selectedInternship.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Start Date</span>
              <span className="text-slate-600 font-medium">{selectedInternship.period}</span>
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