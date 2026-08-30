import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Download, Columns } from 'lucide-react';
import { toast } from 'react-toastify';
import { defaultStudents, emptyFilters, parseAge, parseDate, btnSecondary } from './studentData';
import { downloadStudentsCSV } from './csvUtils';
import { fetchAllStudents, deleteStudent } from '../../api/studentsApi';
import StudentFilters from './StudentFilters';
import StudentTableHeader from './StudentTableHeader';
import StudentTableRow from './StudentTableRow';
import StudentPagination from './StudentPagination';
import StudentColumnsMenu from './StudentColumnsMenu';
import AssignCoordinatorModal from './AssignCoordinatorModal';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

const mapBackendStudent = (s) => ({
  dbId: s.id || s._id,
  id: s.studentId || s.id || '',
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
  assignedCoordinator: s.assignedCoordinator || null,
  assignedCoordinatorName: s.assignedCoordinatorName || '',
});

export default function AllStudentsTable() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);

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

  // Assign coordinator modal
  const [assignTarget, setAssignTarget] = useState(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchAllStudents();
      const studentList = response?.data ?? response ?? [];
      const backendStudents = (Array.isArray(studentList) ? studentList : []).map(mapBackendStudent);
      setStudents(backendStudents);
    } catch (err) {
      console.error('Could not load students from backend:', err);
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

  // No coordinator filtering — show ALL students, only apply search/filter criteria
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
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
  }, [students, filters]);

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

          {/* Info banner */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">All Students Directory</h4>
                <p className="text-[10px] text-slate-400">
                  Showing all {students.length} student(s) across the portal. Use "Assign Coordinator" to assign students to coordinators.
                </p>
              </div>
            </div>
          </div>

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
                      canAssign={true}
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

      {/* Assign Coordinator Modal */}
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
    </div>
  );
}
