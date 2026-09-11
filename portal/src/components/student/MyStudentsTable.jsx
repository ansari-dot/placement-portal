import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Download, Columns, Users, UserCheck, Moon, X, Building2, Calendar, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { defaultStudents, emptyFilters, parseAge, parseDate, btnSecondary } from './studentData';
import { downloadStudentsCSV } from './csvUtils';
import { fetchStudents, deleteStudent } from '../../api/studentsApi';
import { fetchUsers } from '../../api/userApi';
import { fetchWorkflows, createWorkflow, createInternshipRequest, addStudentsToWorkflow } from '../../api/workflowApi';
import StudentFilters from './StudentFilters';
import StudentTableHeader from './StudentTableHeader';
import StudentTableRow from './StudentTableRow';
import StudentPagination from './StudentPagination';
import StudentColumnsMenu from './StudentColumnsMenu';
import AssignCoordinatorModal from './AssignCoordinatorModal';


const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

const mapBackendStudent = (s) => ({
  dbId: s.id || s._id,
  id: s.studentId || s.id || s._id || '',
  studentId: s.studentId || '',
  name: s.name || [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || 'N/A',
  age: s.age || '',
  avatar: s.avatar || FALLBACK_AVATAR,
  rto: s.rto || s.assignedRto || '',
  rtoCode: s.rtoCode || '',
  course: s.course || s.courseQualification || '',
  courseCode: s.courseCode || '',
  email: s.email || s.emailAddress || '',
  phone: s.phone || s.phoneNumber || '',
  location: s.location || s.suburb || '',
  state: s.state || '',
  status: s.status || 'Active',
  placementStatus: s.placementStatus || 'Ready',
  placementHours: s.placementHours ?? null,
  source: s.source || s.studentSource || '',
  created: s.created || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
  // Coordinator assignment
  assignedCoordinator: s.assignedCoordinator || null,
  assignedCoordinatorName: s.assignedCoordinatorName || '',
  // "Assigned At" — when coordinator was assigned (dynamic from backend)
  assignedAt: s.assignedCoordinatorAt
    ? new Date(s.assignedCoordinatorAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : (s.assignedAt || '—'),
  // Online status from backend (real-time)
  isOnline: s.isOnline === true,
  lastActive: s.lastActive || null,
});

export default function MyStudentsTable() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === 'Administrator';

  const [rowsPerPage, setRowsPerPage] = useState('10 per page');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const columnsRef = useRef(null);

  // Coordinators list & selection for Admins
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState('All');

  // Assign coordinator modal
  const [assignTarget, setAssignTarget] = useState(null); // student object

  // Generate Placement Request modal (Step 1 style)
  const [genTargetStudent, setGenTargetStudent] = useState(null);
  const [genPriority, setGenPriority] = useState('Normal'); // 'Normal' | 'Urgent' | 'Snooze'
  const [snoozeDuration, setSnoozeDuration] = useState('7_days');
  const [snoozeReason, setSnoozeReason] = useState('');
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  const handleGeneratePlacementRequestSubmit = async () => {
    if (!genTargetStudent) return;
    const stuId = genTargetStudent.id || genTargetStudent.dbId || genTargetStudent.studentId;

    if (genPriority === 'Snooze') {
      const durationLabels = {
        '7_days': '7 Days',
        '14_days': '14 Days',
        '30_days': '30 Days',
        'indefinite': 'Indefinite'
      };
      const newEntry = {
        id: stuId,
        studentId: genTargetStudent.studentId || genTargetStudent.id || stuId,
        name: genTargetStudent.name,
        email: genTargetStudent.email,
        rto: genTargetStudent.rto || 'RTO',
        snoozedAt: new Date().toISOString(),
        duration: snoozeDuration,
        durationLabel: durationLabels[snoozeDuration] || '7 Days',
        reason: snoozeReason || 'Deferred from placement workflow',
        rawStudent: genTargetStudent,
      };
      try {
        const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
        existing[stuId] = newEntry;
        localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
      } catch (e) {}
      toast.info(`Student ${genTargetStudent.name} snoozed for ${durationLabels[snoozeDuration] || '7 Days'}`);
      setGenTargetStudent(null);
      return;
    }

    try {
      setIsSubmittingGen(true);
      const wfRes = await fetchWorkflows();
      let wfId = wfRes.data?.[0]?.id || wfRes.data?.[0]?._id;
      if (!wfId) {
        const createdWf = await createWorkflow({
          name: 'Placement Workflow',
          status: 'Active',
          currentStep: 2,
        });
        wfId = createdWf.data?.id || createdWf.data?._id;
      }

      const stuId = genTargetStudent.studentId || genTargetStudent.id || genTargetStudent.dbId || String(genTargetStudent._id || '');
      const stuName = genTargetStudent.name;

      // Auto-add student to workflow's students array if not already present
      const targetDbId = genTargetStudent.dbId || genTargetStudent.id;
      if (targetDbId) {
        try {
          await addStudentsToWorkflow(wfId, [targetDbId]);
        } catch (_) {}
      }

      const requestData = {
        title: `${genTargetStudent.course || 'Internship'} Placement`,
        student: stuName,
        studentId: stuId || `STU-${Date.now().toString().slice(-4)}`,
        company: 'Pending Assignment',
        rto: genTargetStudent.rto || 'TBD',
        priority: genPriority,
        status: 'New',
      };
      await createInternshipRequest(wfId, requestData);

      // ✅ Store in localStorage so Step 1 in Workflow picks it up IMMEDIATELY
      try {
        const localReqs = JSON.parse(localStorage.getItem('portal_workflow_requests') || '{}');
        if (stuId) localReqs[stuId] = genPriority;
        if (stuName) localReqs[stuName] = genPriority;
        if (genTargetStudent.dbId) localReqs[genTargetStudent.dbId] = genPriority;
        if (genTargetStudent.studentId) localReqs[genTargetStudent.studentId] = genPriority;
        localStorage.setItem('portal_workflow_requests', JSON.stringify(localReqs));
      } catch (_) {}

      // Update local student placementStatus in MyStudents table
      setStudents(prev => prev.map(s => 
        (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
          ? { ...s, placementStatus: 'In Progress' }
          : s
      ));

      toast.success(`Generated Placement Request with ${genPriority} priority for ${stuName}`);
      setGenTargetStudent(null);
      navigate('/workflow?step=2');
    } catch (err) {
      console.error('Failed to generate request:', err);
      toast.error(err?.response?.data?.message || 'Failed to generate placement request');
    } finally {
      setIsSubmittingGen(false);
    }
  };

  useEffect(() => {
    fetchUsers({ status: 'Active' })
      .then((res) => {
        setCoordinators(res?.data ?? []);
      })
      .catch(() => {});
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchStudents();
      // The API helper returns response.data already, which is { message, success, data: [ ... ] }
      const studentList = response?.data ?? response ?? [];
      // Always use the real backend data (even if 0 students) so newly added
      // students are shown properly instead of being hidden by sample data.
      const backendStudents = (Array.isArray(studentList) ? studentList : []).map(mapBackendStudent);
      setStudents(backendStudents);
    } catch (err) {
      console.error('Could not load students from backend:', err);
      // Only fall back to sample data when the server is unreachable.
      setLoadError('Could not connect to the server. Showing sample data.');
      setStudents(defaultStudents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const [filters, setFilters] = useState(emptyFilters);

  const rtoOptions = useMemo(() => [...new Set(students.map(s => s.rto).filter(Boolean))].sort(), [students]);
  const courseOptions = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);
  const statusOptions = useMemo(() => [...new Set(students.map(s => s.status).filter(Boolean))].sort(), [students]);
  const sourceOptions = useMemo(() => [...new Set(students.map(s => s.source).filter(Boolean))].sort(), [students]);

  const updateFilter = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1); };
  const clearFilters = () => { setFilters(emptyFilters); setCurrentPage(1); };

  const filteredStudents = useMemo(() => {
    const norm = (v) => String(v || '').trim().toLowerCase();
    const currentUserId = authUser?._id || authUser?.id;
    const currentUserName = authUser?.name;

    return students.filter(s => {
      // ── Role-based and Coordinator filter ──
      if (!isAdmin) {
        // Coordinator sees ONLY their assigned students
        const isAssignedToMe =
          (s.assignedCoordinator && currentUserId && norm(s.assignedCoordinator) === norm(currentUserId)) ||
          (s.assignedCoordinatorName && currentUserName && norm(s.assignedCoordinatorName) === norm(currentUserName));
        if (!isAssignedToMe) return false;
      } else {
        // Admin filter by selected coordinator
        if (selectedCoordinator !== 'All') {
          if (selectedCoordinator === 'unassigned') {
            if (s.assignedCoordinator || s.assignedCoordinatorName) return false;
          } else {
            const selectedCoord = coordinators.find(c => (c._id || c.id) === selectedCoordinator);
            const coordId = selectedCoord?._id || selectedCoord?.id || selectedCoordinator;
            const coordName = selectedCoord?.name;
            const isMatch =
              (s.assignedCoordinator && norm(s.assignedCoordinator) === norm(coordId)) ||
              (s.assignedCoordinatorName && coordName && norm(s.assignedCoordinatorName) === norm(coordName));
            if (!isMatch) return false;
          }
        }
      }

      if (filters.firstName && !(s.name || '').toLowerCase().includes(filters.firstName.toLowerCase())) return false;
      if (filters.lastName) {
        const parts = (s.name || '').split(' ');
        const lastName = parts[parts.length - 1] || '';
        if (!lastName.toLowerCase().includes(filters.lastName.toLowerCase())) return false;
      }
      if (filters.studentId && !(s.id || '').toLowerCase().includes(filters.studentId.toLowerCase())) return false;
      if (filters.rto && s.rto !== filters.rto) return false;
      if (filters.course && s.course !== filters.course) return false;
      if (filters.status && s.status !== filters.status) return false;
      if (filters.city && !(s.location || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.source && s.source !== filters.source) return false;
      const age = parseAge(s.age);
      if (filters.ageFrom && (age === null || age < parseInt(filters.ageFrom, 10))) return false;
      if (filters.ageTo && (age === null || age > parseInt(filters.ageTo, 10))) return false;
      const createdTime = parseDate(s.created);
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        if (isNaN(from.getTime())) return false;
        const fromTime = from.setHours(0, 0, 0, 0);
        if (createdTime === null || createdTime < fromTime) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        if (isNaN(to.getTime())) return false;
        const toTime = to.setHours(23, 59, 59, 999);
        if (createdTime === null || createdTime > toTime) return false;
      }
      return true;
    });
  }, [students, filters, isAdmin, authUser, selectedCoordinator, coordinators]);

  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents;
    const sortValue = (s) => {
      switch (sortField) {
        case 'student': return s.name || '';
        case 'studentId': return s.id || '';
        case 'rto': return s.rto || '';
        case 'course': return s.course || '';
        case 'email': return s.email || '';
        case 'phone': return s.phone || '';
        case 'location': return s.location || '';
        case 'status': return s.status || '';
        case 'source': return s.source || '';
        case 'created': return parseDate(s.created) || 0;
        default: return s.name || '';
      }
    };
    const sorted = [...filteredStudents].sort((a, b) => {
      const valA = sortValue(a);
      const valB = sortValue(b);
      if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredStudents, sortField, sortDir]);

  const perPage = parseInt(rowsPerPage, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const pageStudents = sortedStudents.slice(startIndex, startIndex + perPage);
  const showingFrom = sortedStudents.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + perPage, sortedStudents.length);

  const goToPage = (page) => { setCurrentPage(Math.max(1, Math.min(page, totalPages))); };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const allPageSelected = pageStudents.length > 0 && pageStudents.every(s => selectedRows.includes(s.id));

  const toggleSelectAll = () => {
    if (allPageSelected) setSelectedRows(prev => prev.filter(id => !pageStudents.some(s => s.id === id)));
    else {
      const pageIds = pageStudents.map(s => s.id);
      setSelectedRows(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) setShowColumnsMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = () => {
    if (sortedStudents.length === 0) { toast.info('No students to export'); return; }
    downloadStudentsCSV(sortedStudents);
    toast.success(`Exported ${sortedStudents.length} student(s) to CSV`);
  };

  const toggleColumn = (key) => {
    setHiddenColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleRowAction = async (action, student) => {
    setOpenActionsId(null);
    const dbId = student.dbId || student.id;
    if (action === 'view') {
      navigate(`/students/${dbId}/view`);
    } else if (action === 'edit') {
      navigate(`/students/${dbId}/edit`);
    } else if (action === 'assignCoordinator') {
      setAssignTarget(student);
    } else if (action === 'generateRequest') {
      setGenTargetStudent(student);
      setGenPriority('Normal');
      setSnoozeReason('');
    } else if (action === 'contactIndustry') {
      navigate(`/workflow?step=2&studentId=${encodeURIComponent(student.id || '')}&studentName=${encodeURIComponent(student.name || '')}&openContact=true`);
    } else if (action === 'createAppointment') {
      navigate(`/workflow?step=3&studentId=${encodeURIComponent(student.id || '')}&studentName=${encodeURIComponent(student.name || '')}`);
    } else if (action === 'delete') {
      if (student.dbId) {
        try {
          await deleteStudent(student.dbId);
          toast.success(`${student.name} deleted successfully`);
          setSelectedRows(prev => prev.filter(id => id !== student.id));
          await loadStudents();
        } catch (err) {
          console.error('Could not delete student:', err);
          toast.error(err?.response?.data?.message || `Could not delete ${student.name}. Please try again.`);
        }
      } else {
        setStudents(prev => prev.filter(s => s.id !== student.id));
        setSelectedRows(prev => prev.filter(id => id !== student.id));
        toast.success(`${student.name} deleted`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center space-x-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading students...</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {loadError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-700">
              {loadError}
            </div>
          )}

          {/* Admin Coordinator Switcher & Scope Banner */}
          {isAdmin ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Coordinator View & Progress</h4>
                  <p className="text-[10px] text-slate-400">Select any coordinator to filter and monitor their assigned students and placement progress</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter by Coordinator:</label>
                <select
                  value={selectedCoordinator}
                  onChange={(e) => {
                    setSelectedCoordinator(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="All">All Users / Coordinators ({students.length} students)</option>
                  {coordinators.map((c) => {
                    const count = students.filter(s =>
                      (s.assignedCoordinator && String(s.assignedCoordinator) === String(c._id || c.id)) ||
                      (s.assignedCoordinatorName && s.assignedCoordinatorName.toLowerCase() === (c.name || '').toLowerCase())
                    ).length;
                    return (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name} ({c.role || 'Coordinator'}) — {count} student(s)
                      </option>
                    );
                  })}
                  <option value="unassigned">Unassigned Students ({students.filter(s => !s.assignedCoordinator && !s.assignedCoordinatorName).length})</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-900 font-semibold">
                  Showing your assigned student list ({filteredStudents.length} assigned to <span className="font-bold">{authUser?.name || 'you'}</span>)
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Coordinator View
              </span>
            </div>
          )}

          <StudentFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            onApply={() => { setCurrentPage(1); toast.success(`Found ${filteredStudents.length} student(s)`); }}
            options={{ rtoOptions, courseOptions, statusOptions, sourceOptions }}
            resultCount={filteredStudents.length}
            selectedCount={selectedRows.length}
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/30">
              <button onClick={handleDownload} className={btnSecondary}>
                <Download size={14} />
                <span>Download CSV</span>
              </button>
              <div className="relative" ref={columnsRef}>
                <button onClick={() => setShowColumnsMenu(prev => !prev)} className={btnSecondary}>
                  <Columns size={14} />
                  <span>Columns</span>
                </button>
                {showColumnsMenu && (
                  <StudentColumnsMenu
                    hiddenColumns={hiddenColumns}
                    onToggleColumn={toggleColumn}
                    onClose={() => setShowColumnsMenu(false)}
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <StudentTableHeader
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  hiddenColumns={hiddenColumns}
                  allPageSelected={allPageSelected}
                  onSelectAll={toggleSelectAll}
                />
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {pageStudents.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-10 text-center">
                        <p className="text-sm font-semibold text-slate-500">No students found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filters or add a new student.</p>
                      </td>
                    </tr>
                  )}
                  {pageStudents.map((student) => (
                    <StudentTableRow
                      key={student.id + student.name}
                      student={student}
                      isSelected={selectedRows.includes(student.id)}
                      onSelect={() => toggleSelectRow(student.id)}
                      isActionsOpen={openActionsId === student.id}
                      onToggleActions={() => setOpenActionsId(openActionsId === student.id ? null : student.id)}
                      onRowAction={handleRowAction}
                      hiddenColumns={hiddenColumns}
                      canAssign={isAdmin}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <StudentPagination
              totalItems={sortedStudents.length}
              from={showingFrom}
              to={showingTo}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </>
      )}

      {/* Assign Coordinator Modal — rendered inside wrapper but displays as fixed overlay */}
      {assignTarget && (
        <AssignCoordinatorModal
          student={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={({ coordinatorId, coordinatorName }) => {
            setStudents(prev => prev.map(s =>
              s.dbId === assignTarget.dbId
                ? { ...s, assignedCoordinator: coordinatorId, assignedCoordinatorName: coordinatorName }
                : s
            ));
            toast.success(
              coordinatorId
                ? `${assignTarget.name} assigned to ${coordinatorName}`
                : `Coordinator removed from ${assignTarget.name}`
            );
            setAssignTarget(null);
            loadStudents();
          }}
        />
      )}

      {/* Generate Placement Request Modal (Step 1 Style) */}
      {genTargetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Placement Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">Moving student to Step 2 – Placement Request</p>
              </div>
              <button 
                onClick={() => setGenTargetStudent(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Student</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{genTargetStudent.name}</p>
                <p className="text-xs text-slate-500">{genTargetStudent.id || genTargetStudent.studentId}</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/80">
                {genTargetStudent.rto || 'RTO'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Request Action &amp; Priority <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGenPriority('Normal')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    genPriority === 'Normal'
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">Normal</span>
                    <input type="radio" name="myStudentPriority" checked={genPriority === 'Normal'} onChange={() => {}} className="accent-blue-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-1">Normal Priority</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenPriority('Urgent')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    genPriority === 'Urgent'
                      ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold flex items-center space-x-1">
                      <span>🔥 Urgent</span>
                    </span>
                    <input type="radio" name="myStudentPriority" checked={genPriority === 'Urgent'} onChange={() => {}} className="accent-rose-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-1">Urgent Priority</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenPriority('Snooze')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    genPriority === 'Snooze'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold flex items-center space-x-1">
                      <Moon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Snooze</span>
                    </span>
                    <input type="radio" name="myStudentPriority" checked={genPriority === 'Snooze'} onChange={() => {}} className="accent-amber-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-1">Snooze Student</span>
                </button>
              </div>
            </div>

            {genPriority === 'Snooze' && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 uppercase">Snooze Duration</label>
                  <select
                    value={snoozeDuration}
                    onChange={(e) => setSnoozeDuration(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                  >
                    <option value="7_days">7 Days (1 Week)</option>
                    <option value="14_days">14 Days (2 Weeks)</option>
                    <option value="30_days">30 Days (1 Month)</option>
                    <option value="indefinite">Until Manually Restored</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 uppercase">Reason / Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Student requested postponement..."
                    value={snoozeReason}
                    onChange={(e) => setSnoozeReason(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setGenTargetStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingGen}
                onClick={handleGeneratePlacementRequestSubmit}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  genPriority === 'Snooze'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#0147A6] hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isSubmittingGen ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : genPriority === 'Snooze' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-white" />
                    <span>Snooze Student</span>
                  </>
                ) : (
                  <span>Generate &amp; Continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}