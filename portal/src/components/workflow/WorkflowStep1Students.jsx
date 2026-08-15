// src/components/workflow/WorkflowStep1Students.jsx
import React, { useState } from 'react';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  ChevronDown, Columns, LayoutGrid, List, ChevronLeft, ChevronRight, X, 
  Calendar, Globe, MapPin, GraduationCap, Building2, Layers, Clock, Briefcase, Mail, Phone, Edit, User, ShieldCheck, Award, CheckCircle2, ArrowUpRight, Trash2, Eye, CheckSquare
} from 'lucide-react';

export default function WorkflowStep1Students({ students = [], onNext }) {
  const [selectedStudent, setSelectedStudent] = useState({
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+61 412 345 678',
    id: 'STU-0002453',
    status: 'Active',
    dob: '12 May 2001',
    nationality: 'Australian',
    location: 'Melbourne, VIC',
    course: 'Bachelor of IT',
    institute: 'AI Global Institute',
    semester: '2nd Year / Semester 4',
    gpa: '78.5%',
    availability: 'Mon - Fri, 09:00 AM - 05:00 PM',
    industry: 'IT & Software',
    radius: '20 km',
    addedOn: '19 May 2025',
    updatedOn: '19 May 2025'
  });
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDrawer, setShowDrawer] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const defaultStudents = [
    { name: 'John Smith', email: 'john.smith@email.com', id: 'STU-0002453', rto: 'AI Global Institute', status: 'Active', placementStatus: 'Ready', addedOn: '19 May 2025' },
    { name: 'Priya Sharma', email: 'priya.sharma@email.com', id: 'STU-0002452', rto: 'Melbourne City College', status: 'Active', placementStatus: 'Pending Info', addedOn: '18 May 2025' },
    { name: 'Liam Johnson', email: 'liam.j@email.com', id: 'STU-0002451', rto: 'AI Global Institute', status: 'Active', placementStatus: 'In Process', addedOn: '18 May 2025' },
    { name: 'Aisha Khan', email: 'aisha.khan@email.com', id: 'STU-0002450', rto: 'Deakin College', status: 'Inactive', placementStatus: 'Not Started', addedOn: '17 May 2025' },
    { name: 'David Brown', email: 'david.brown@email.com', id: 'STU-0002449', rto: 'Victoria University', status: 'Active', placementStatus: 'Ready', addedOn: '16 May 2025' },
    { name: 'Emily Davis', email: 'emily.davis@email.com', id: 'STU-0002448', rto: 'AI Global Institute', status: 'Active', placementStatus: 'Pending Info', addedOn: '16 May 2025' },
    { name: 'Mohammed Ali', email: 'm.ali@email.com', id: 'STU-0002447', rto: 'Box Hill Institute', status: 'Active', placementStatus: 'In Process', addedOn: '15 May 2025' },
    { name: 'Sophia Lee', email: 'sophia.lee@email.com', id: 'STU-0002446', rto: 'Deakin College', status: 'Active', placementStatus: 'Ready', addedOn: '15 May 2025' },
  ];

  const studentList = students.length > 0 ? students : defaultStudents;

  // Filter students based on search query
  const filteredStudents = studentList.filter(stu => 
    stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stu.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stu.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stu.rto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    const data = filteredStudents.map(s => `${s.name},${s.email},${s.id},${s.rto},${s.status},${s.placementStatus},${s.addedOn}`).join('\n');
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleAddStudent = () => {
    setShowAddStudent(true);
    showToast('Add Student form opened');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedStudents.map(s => s.id));
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
      showToast('Please select students first');
      return;
    }
    showToast(`${action} applied to ${selectedRows.length} students`);
  };

  const handleRowAction = (action, stu) => {
    setShowRowMenu(null);
    if (action === 'view') {
      setSelectedStudent({ ...selectedStudent, name: stu.name, email: stu.email, id: stu.id, institute: stu.rto, status: stu.status, addedOn: stu.addedOn });
      setShowDrawer(true);
    } else if (action === 'edit') {
      showToast(`Editing ${stu.name}`);
    } else if (action === 'delete') {
      showToast(`Delete action for ${stu.name}`);
    }
  };

  const handleCreateRequest = () => {
    showToast('Creating internship request...');
    if (onNext) setTimeout(onNext, 800);
  };

  const hasActiveFilters = searchQuery !== '';

  const handleClearFilters = () => {
    setSearchQuery('');
    showToast('Filters cleared');
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Total Students</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">2,543</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 12.5% vs last month</span>
            </div>
            <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Ready for Placement</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">1,428</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 18.2% vs last month</span>
            </div>
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Pending Information</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">356</h3>
              <span className="text-[9px] text-rose-600 font-semibold mt-0.5 inline-block">↓ 6.3% vs last month</span>
            </div>
            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Recently Added</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">128</h3>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 inline-block">↑ 8.7% vs last week</span>
            </div>
            <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
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
              placeholder="Search students..." 
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
              onClick={() => { setShowFilters(!showFilters); setShowSavedFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Filters</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Options</p>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                    <span>Active Students</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                    <span>Ready for Placement</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded accent-blue-600" />
                    <span>Pending Info</span>
                  </label>
                </div>
                <button 
                  onClick={() => { setShowFilters(false); showToast('Filters applied'); }}
                  className="w-full py-1.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-[11px] font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => { setShowSavedFilters(!showSavedFilters); setShowFilters(false); }}
              className="px-2.5 py-2 bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>Saved</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showSavedFilters && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saved Filters</p>
                {['Active - Ready', 'Pending Info', 'Melbourne Students'].map((f, i) => (
                  <button 
                    key={i}
                    onClick={() => { setShowSavedFilters(false); showToast(`Loaded: ${f}`); }}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    {f}
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
              onClick={handleAddStudent}
              className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              <span>Add Student</span>
            </button>
            {showAddStudent && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Add New Student</h4>
                <div className="space-y-2">
                  <input placeholder="Full Name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                  <input placeholder="Email" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                  <input placeholder="Student ID" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                  <input placeholder="Institute" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex space-x-2 mt-3">
                  <button 
                    onClick={() => { setShowAddStudent(false); showToast('Student added'); }}
                    className="flex-1 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setShowAddStudent(false)}
                    className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Subheader Count & Actions */}
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-slate-500 font-medium">{filteredStudents.length} students found</p>
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
              <div className="relative">
                <button 
                  onClick={() => setShowColumns(!showColumns)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 flex items-center space-x-1 text-xs px-2 font-medium"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Columns</span>
                </button>
                {showColumns && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toggle Columns</p>
                    {['Student', 'Student ID', 'RTO / Institute', 'Status', 'Placement Status', 'Added On'].map((col, i) => (
                      <label key={i} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                        <span>{col}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-[1px] h-4 bg-slate-200"></div>
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
                    checked={selectedRows.length === paginatedStudents.length && paginatedStudents.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-4 px-2">Student</th>
                <th className="p-4">Student ID</th>
                <th className="p-4">RTO / Institute</th>
                <th className="p-4">Status</th>
                <th className="p-4">Placement Status</th>
                <th className="p-4">Added On</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedStudents.map((stu, i) => {
                const isSelected = selectedStudent.id === stu.id;
                const isRowSelected = selectedRows.includes(stu.id);
                return (
                  <tr 
                    key={i} 
                    onClick={() => { setSelectedStudent({ ...selectedStudent, name: stu.name, email: stu.email, id: stu.id, institute: stu.rto, status: stu.status, addedOn: stu.addedOn }); setShowDrawer(true); }}
                    className={`cursor-pointer transition ${isSelected ? 'bg-blue-50/40' : isRowSelected ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 accent-blue-600"
                        checked={isRowSelected}
                        onChange={() => handleSelectRow(stu.id)}
                      />
                    </td>
                    <td className="py-3 px-2 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600 text-xs shrink-0">
                        {stu.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{stu.name}</p>
                        <p className="text-[11px] text-slate-400">{stu.email}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{stu.id}</td>
                    <td className="p-4 text-slate-600">{stu.rto}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        stu.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {stu.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        stu.placementStatus === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 
                        stu.placementStatus === 'Pending Info' ? 'bg-amber-50 text-amber-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {stu.placementStatus}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{stu.addedOn}</td>
                    <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setShowRowMenu(showRowMenu === stu.id ? null : stu.id)}
                        className="p-1 hover:bg-slate-100 rounded-lg inline-flex"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </button>
                      {showRowMenu === stu.id && (
                        <div className="absolute right-4 top-10 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                          <button onClick={() => handleRowAction('view', stu)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Profile</span>
                          </button>
                          <button onClick={() => handleRowAction('edit', stu)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleRowAction('delete', stu)} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 text-sm">
                    No students found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <p>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} results</p>
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

        {/* Optional Next Step Button */}
        {onNext && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-xs font-semibold text-white rounded-xl flex items-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs"
            >
              <span>Continue to Internship Requests</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Drawer / Detail Panel - Professional Mini Card */}
      {showDrawer && (
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
        {/* Card Header with Gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-700 shrink-0 border-2 border-white/20 ring-2 ring-white/10">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                    alt={selectedStudent.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm tracking-wide">{selectedStudent.name}</h4>
                </div>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">{selectedStudent.id}</p>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-full border border-emerald-400/20 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{selectedStudent.status}</span>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-bold rounded-full border border-blue-400/20 flex items-center space-x-1">
                    <Award className="w-2.5 h-2.5" />
                    <span>Ready</span>
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition mt-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contact info */}
          <div className="relative mt-4 space-y-1.5">
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <Mail className="w-3 h-3 text-slate-400" />
              <span className="truncate">{selectedStudent.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{selectedStudent.phone}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 text-[11px] font-semibold text-slate-500 space-x-5 bg-white">
          {['Overview', 'Education', 'RTO & Source', 'Notes'].map((tab) => (
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
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">GPA</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedStudent.gpa}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Year</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">2nd</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Radius</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedStudent.radius}</p>
            </div>
          </div>

          {/* Personal Details Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              <span>Personal Details</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.dob}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nationality</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.nationality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.location}</span>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
              <span>Education</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Course</span>
                </span>
                <span className="font-semibold text-slate-800 text-right">{selectedStudent.course}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Institute</span>
                </span>
                <span className="font-semibold text-blue-600">{selectedStudent.institute}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Semester</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.semester}</span>
              </div>
            </div>
          </div>

          {/* Placement Preferences Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
              <span>Placement Preferences</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Availability</span>
                </span>
                <span className="font-semibold text-slate-800 text-right">{selectedStudent.availability}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Industry</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Radius</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedStudent.radius}</span>
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
                onClick={() => showToast('Opening full profile...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Profile</span>
              </button>
              <button 
                onClick={() => showToast('Editing student...')}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>
            </div>
            <button 
              onClick={handleCreateRequest}
              className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Internship Request</span>
              <ArrowUpRight className="w-3 h-3 text-blue-200" />
            </button>
          </div>

          {/* Footer Meta */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Added On</span>
              <span className="text-slate-600 font-medium">{selectedStudent.addedOn}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span className="text-slate-600 font-medium">{selectedStudent.updatedOn}</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// Simple internal helper for Users icon to avoid external dependency mismatch
function UsersIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}