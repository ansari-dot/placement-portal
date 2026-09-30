// src/components/workflow/WorkflowStep2Requests.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Download, Plus, MoreVertical,
  ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, List,
  X, XCircle, Building2, User, Calendar, Clock, CheckCircle2,
  Briefcase, MapPin, Layers, ShieldCheck, ArrowUpRight, Trash2, Eye, Edit, CheckSquare, FileText, UserCheck, Copy
} from 'lucide-react';
import { fetchJobs } from '../../api/jobApi';
import { createIndustry, fetchIndustries } from '../../api/industryApi';
import { snoozeStudent, updateStudent } from '../../api/studentsApi';
import AssignCoordinatorModal from '../student/AssignCoordinatorModal';
import PlacementRequestStudentDetails from './PlacementRequestStudentDetails';

const getSnoozeUntil = (durationDays) => {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + durationDays);
  return expiration.toISOString();
};

export default function WorkflowStep2Requests({
  requests = [],
  onBack,
  onNext,
  onCreateRequest,
  onUpdateRequest,
  onDeleteRequest,
  onAddContact,
  students = [],
  activeStudent = null,
  appointments = [],
  onRefreshStudents,
}) {
  const [searchParams] = useSearchParams();
  const authUser = useSelector((state) => state.auth?.user);
  const [newRequestStudentId, setNewRequestStudentId] = useState('');
  const [newRequestCompany, setNewRequestCompany] = useState('');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestWorkType, setNewRequestWorkType] = useState('Remote');
  const [newRequestRto, setNewRequestRto] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [contactHistoryReadOnly, setContactHistoryReadOnly] = useState(false);
  const [industryDirectory, setIndustryDirectory] = useState([]);

  // Auto open Add Contact / Industry modal for student if navigated with openContact=true
  useEffect(() => {
    const studentId = searchParams.get('studentId') || searchParams.get('prefillStudentId');
    const studentName = searchParams.get('studentName') || searchParams.get('prefillStudentName');
    const openContact = searchParams.get('openContact') === 'true';

    if (openContact && (studentId || studentName) && requests && requests.length > 0) {
      const norm = (v) => String(v || '').trim().toLowerCase();
      const matchedReq = requests.find((r) =>
        (studentId && (norm(r.studentId) === norm(studentId) || norm(r.id) === norm(studentId))) ||
        (studentName && norm(r.student) === norm(studentName))
      );
      if (matchedReq) {
        setSelectedRequest(matchedReq);
        setShowDrawer(true);
        setActiveTab('Contact History');
        setShowAddOrgModal(true);
      }
    }
  }, [searchParams, requests]);

  useEffect(() => {
    fetchJobs({ status: 'Open' })
      .then(res => { if (res.success) setAvailableJobs(res.data || []); })
      .catch(() => { });
    fetchIndustries()
      .then((res) => setIndustryDirectory(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setIndustryDirectory([]));
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
  const [rowMenuPos, setRowMenuPos] = useState({ top: 0, left: 0 });

  // Close row menu on outside click
  useEffect(() => {
    if (!showRowMenu) return;
    const handler = () => setShowRowMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showRowMenu]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [rtoFilter, setRtoFilter] = useState('All');
  const [coordinatorFilter, setCoordinatorFilter] = useState('All');

  const [contactRecordsMap, setContactRecordsMap] = useState({});

  useEffect(() => {
    if (requests && requests.length > 0) {
      const newMap = {};
      requests.forEach(req => {
        const key = req.id || req.reqId;
        newMap[key] = req.contactedIndustries || [];
        if (req.reqId) newMap[req.reqId] = req.contactedIndustries || [];
      });
      setContactRecordsMap(newMap);
    }
  }, [requests]);

  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  // ─── Edit Request Modal ─────────────────────────────────────────────────
  const [editRequest, setEditRequest] = useState(null); // item being edited
  const [editForm, setEditForm] = useState({ status: '', company: '', rto: '', priority: 'Normal', notes: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // ─── Delete Confirm Modal ────────────────────────────────────────────────
  const [deleteConfirmReq, setDeleteConfirmReq] = useState(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);
  const [assignCoordinatorTarget, setAssignCoordinatorTarget] = useState(null);
  const [placementDetailsTarget, setPlacementDetailsTarget] = useState(null);
  const [changePriorityTarget, setChangePriorityTarget] = useState(null);
  const [changePriority, setChangePriority] = useState('Normal');
  const [changePriorityNote, setChangePriorityNote] = useState('');
  const [changeSnoozeDuration, setChangeSnoozeDuration] = useState('7_days');
  const [savingPriority, setSavingPriority] = useState(false);
  // ─── Add Industry Form ───────────────────────────────────────────────────
  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    email: '',
    address: '',
    suburb: '',
    state: '',
    postCode: '',
    country: 'Australia',
    phone: '',
    contactPerson: '',
    industryType: 'Aged Care',
    notes: '',
    response: 'In Discussion',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [orgFormErrors, setOrgFormErrors] = useState({});

  const handleOrgNameChange = (organizationName) => {
    const matchedIndustry = industryDirectory.find(
      (industry) => (industry.name || '').trim().toLowerCase() === organizationName.trim().toLowerCase()
    );
    setOrgForm((previous) => ({
      ...previous,
      organizationName,
      ...(matchedIndustry ? {
        industryType: matchedIndustry.sector || previous.industryType,
        contactPerson: matchedIndustry.contactPersonName || '',
        email: matchedIndustry.contactEmail || '',
        phone: matchedIndustry.contactPhone || '',
        address: matchedIndustry.address || '',
        suburb: matchedIndustry.suburb || '',
        state: matchedIndustry.state || '',
        postCode: matchedIndustry.postCode || '',
        country: matchedIndustry.country || 'Australia',
      } : {
        industryType: 'Aged Care',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        suburb: '',
        state: '',
        postCode: '',
        country: 'Australia',
      }),
    }));
  };

  const handleAddOrgRecord = async () => {
    // Validate all required fields
    const errors = {};
    if (!orgForm.organizationName.trim()) errors.organizationName = 'Industry / Organisation name is required';
    if (!orgForm.contactPerson.trim()) errors.contactPerson = 'Contact person name is required';
    if (!orgForm.email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgForm.email.trim())) errors.email = 'Enter a valid email address';
    if (!orgForm.phone.trim()) errors.phone = 'Phone number is required';
    if (!orgForm.address.trim()) errors.address = 'Address is required';
    if (!orgForm.notes.trim()) errors.notes = 'Discussion notes / response is required';

    if (Object.keys(errors).length > 0) {
      setOrgFormErrors(errors);
      return;
    }
    setOrgFormErrors({});

    const targetKey = selectedRequest?.dbId || selectedRequest?.id;
    if (!targetKey) {
      showToast('Please select a request first');
      return;
    }

    // ── Duplicate check — same org name already on this request ──────────────
    const existingContacts = contactRecordsMap[targetKey] || [];
    const newOrgNorm = orgForm.organizationName.trim().toLowerCase();
    const isDuplicate = existingContacts.some(
      (c) => (c.organizationName || '').trim().toLowerCase() === newOrgNorm
    );
    if (isDuplicate) {
      showToast(`"${orgForm.organizationName.trim()}" is already added to this placement request.`);
      return;
    }

    // Attribution — records WHICH coordinator added this industry contact, so it
    // can be shown on the Student Profile page ("Industries contacted, along
    // with the coordinator's name who contacted that specific industry").
    const newRecord = {
      id: `c_${Date.now()}`,
      ...orgForm,
      contactedDate: new Date().toISOString().split('T')[0],
      addedByName: authUser?.name || authUser?.email || '',
      addedByUserId: authUser?._id || authUser?.id || '',
    };

    setContactRecordsMap(prev => ({
      ...prev,
      [targetKey]: [...(prev[targetKey] || []), newRecord]
    }));

    if (onAddContact) {
      try {
        await onAddContact(targetKey, newRecord);

        // Also save to Industry collection so it immediately appears in Industries page (/industry)
        const existingIndustry = industryDirectory.some(
          (industry) => (industry.name || '').trim().toLowerCase() === newOrgNorm
        );
        if (!existingIndustry) {
          try {
            const savedIndustry = await createIndustry({
            industryName: orgForm.organizationName.trim(),
            industryType: orgForm.industryType || 'Aged Care',
            contactPersonName: orgForm.contactPerson.trim(),
            contactEmail: orgForm.email.trim(),
            contactPhone: orgForm.phone.trim(),
            address: orgForm.address.trim(),
            suburb: orgForm.suburb.trim(),
            state: orgForm.state.trim(),
            postCode: orgForm.postCode.trim(),
            country: orgForm.country.trim() || 'Australia',
            shortDescription: orgForm.notes || '',
          });
            if (savedIndustry?.data) setIndustryDirectory((previous) => [savedIndustry.data, ...previous]);
          } catch (indErr) {
            console.log('Industry already in DB or synced:', indErr?.message);
          }
        }

        showToast(`Added contact record for ${orgForm.organizationName}`);
        setShowAddOrgModal(false);
        setOrgForm({
          organizationName: '',
          email: '',
          address: '',
          suburb: '',
          state: '',
          postCode: '',
          country: 'Australia',
          phone: '',
          contactPerson: '',
          industryType: 'Aged Care',
          notes: '',
          response: 'In Discussion',
          appointmentDate: '',
          appointmentTime: ''
        });
        setOrgFormErrors({});
      } catch (err) {
        const serverMsg =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.message ||
          err?.message ||
          'Unknown error';
        console.error('Failed to add contact:', err);
        showToast(`Failed to save contact record: ${serverMsg}`);

        setContactRecordsMap(prev => ({
          ...prev,
          [targetKey]: (prev[targetKey] || []).filter(r => r.id !== newRecord.id)
        }));
      }
    } else {
      showToast(`Added contact record for ${orgForm.organizationName} (not persisted — onAddContact missing)`);
      setShowAddOrgModal(false);
      setOrgFormErrors({});
    }
  };

  const requestList = requests || [];
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

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const formatAvailability = (days, from, to) => {
    const entries = days instanceof Map ? [...days.entries()] : Object.entries(days || {});
    const availableDays = entries.filter(([, available]) => available).map(([day]) => day);
    const hours = [from, to].filter(Boolean).join(' - ');
    return [availableDays.join(', '), hours].filter(Boolean).join(' · ') || '—';
  };

  const formatAssignedDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? '—'
      : parsed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleCopyStudentContact = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`);
    } catch {
      showToast(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const handleOpenContactHistory = (item) => {
    setSelectedRequest({ ...item, id: item.reqId, dbId: item.id || item.reqId, requestedOn: item.date });
    setContactHistoryReadOnly(true);
    setActiveTab('Contact History');
    setShowAddOrgModal(false);
    setShowDrawer(true);
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
    if (action === 'view') {
      setPlacementDetailsTarget({ request: item, editable: false });
    } else if (action === 'addIndustry') {
      // ── Open Add Industry modal scoped to THIS student's request ──
      setSelectedRequest({
        ...item,
        id: item.reqId,
        dbId: item.id || item.reqId,
        title: item.title,
        student: item.student,
        studentId: item.studentId,
        company: item.company,
        rto: item.rto,
        status: item.status,
        requestedOn: `${item.date} at 10:24 AM`,
        contactedIndustries: item.contactedIndustries || [],
      });
      setContactHistoryReadOnly(false);
      setActiveTab('Contact History');
      setShowAddOrgModal(true);
    } else if (action === 'edit') {
      setPlacementDetailsTarget({ request: item, editable: true });
    } else if (action === 'addAppointment') {
      handleStartAppointmentForStudent(item);
    } else if (action === 'changePriority') {
      setChangePriorityTarget(item);
      setChangePriority(item.priority || 'Normal');
      setChangePriorityNote('');
      setChangeSnoozeDuration('7_days');
    } else if (action === 'assignCoordinator') {
      const matchedStudent = students.find(s =>
        (s.id && (s.id === item.studentId || s.id === item.id)) ||
        (s.studentId && s.studentId === item.studentId) ||
        (s.name && s.name.toLowerCase() === (item.student || '').toLowerCase())
      );
      const target = matchedStudent || {
        id: item.studentId || item.id,
        dbId: item.studentId || item.id,
        name: item.student || 'Student',
        studentId: item.studentId || '',
      };
      setAssignCoordinatorTarget(target);
    } else if (action === 'delete') {
      // Open confirm modal — do NOT delete immediately
      setDeleteConfirmReq(item);
    }
  };

  const handleSavePriorityChange = async () => {
    const item = changePriorityTarget;
    if (!item || !changePriorityNote.trim()) return;
    if (!onUpdateRequest) {
      showToast('Request updates are unavailable');
      return;
    }

    const studentId = item.studentDbId || item.studentRecord?._id || item.studentRecord?.id || item.studentId;
    const returnedToStep1 = ['Snooze', 'Inactive'].includes(changePriority);
    const changedAt = new Date().toLocaleString('en-AU');
    const auditNote = `Changed to ${changePriority} by ${authUser?.name || 'Coordinator'} on ${changedAt}: ${changePriorityNote.trim()}`;
    const notes = [item.notes, auditNote].filter(Boolean).join('\n');
    const nextStatus = ['Snooze', 'Inactive'].includes(changePriority)
      ? 'On Hold'
      : (item.status === 'On Hold' ? 'New' : item.status);

    setSavingPriority(true);
    try {
      await onUpdateRequest(item.id || item.reqId, {
        priority: changePriority,
        status: nextStatus,
        notes,
        returnedToStep1: ['Snooze', 'Inactive'].includes(changePriority),
      });

      if (studentId) {
        if (changePriority === 'Snooze') {
          const durationDays = { '7_days': 7, '14_days': 14, '30_days': 30 }[changeSnoozeDuration];
          const snoozeUntil = durationDays
            ? getSnoozeUntil(durationDays)
            : null;
          await snoozeStudent(studentId, {
            snoozed: true,
            snoozedAt: new Date().toISOString(),
            snoozeUntil,
            snoozeReason: changePriorityNote.trim(),
          });
        } else {
          await snoozeStudent(studentId, { snoozed: false, snoozedAt: null, snoozeUntil: null, snoozeReason: '' });
        }
        await updateStudent(studentId, {
          internshipPriority: changePriority === 'Inactive' ? 'Inactive' : '',
          placementStatus: returnedToStep1 ? 'Awaiting' : 'In Progress',
        });
      }

      await onRefreshStudents?.();
      showToast(`Placement request changed to ${changePriority}`);
      setChangePriorityTarget(null);
    } catch (err) {
      console.error('Could not change placement request:', err);
      showToast(err?.response?.data?.message || err?.message || 'Could not change placement request');
    } finally {
      setSavingPriority(false);
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
    if (!selectedRequest) {
      if (onNext) onNext();
      return;
    }
    const prefillData = {
      student: selectedRequest.student,
      studentId: selectedRequest.studentId || selectedRequest.dbId || '',
      rto: selectedRequest.rto || '',
      reqId: selectedRequest.id || selectedRequest.reqId || '',
      company: selectedRequest.company || '',
      position: selectedRequest.title || 'Internship Placement',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:00',
      openModal: true
    };
    showToast('Opening Step 3 Appointment...');
    if (onNext) setTimeout(() => onNext(selectedRequest, selectedRequest.company, prefillData), 300);
  };

  const handleAddAppointmentForIndustry = (rec) => {
    if (!selectedRequest) return;
    const prefillData = {
      student: selectedRequest.student,
      studentId: selectedRequest.studentId || selectedRequest.dbId || '',
      rto: selectedRequest.rto || '',
      reqId: selectedRequest.id || selectedRequest.reqId || '',
      company: rec.organizationName || selectedRequest.company || '',
      industryId: rec.id || rec._id || '',
      industryName: rec.organizationName || '',
      industryType: rec.industryType || '',
      industryContact: rec,
      requireAppointmentSchedule: true,
      interviewer: rec.contactPerson || '',
      location: rec.address || '',
      position: selectedRequest.title || 'Internship Placement',
      appointmentDate: rec.appointmentDate || new Date().toISOString().split('T')[0],
      appointmentTime: rec.appointmentTime || '10:00',
      notes: rec.notes ? `Discussion Notes: ${rec.notes}` : '',
      email: rec.email || '',
      phone: rec.phone || '',
      openModal: true
    };
    showToast(`Loading appointment for ${rec.organizationName}...`);
    if (onNext) {
      onNext(selectedRequest, rec.organizationName, prefillData);
    }
  };

  const handleStartAppointmentForStudent = (request) => {
    if (!(request.contactedIndustries || []).length) {
      showToast('Add an industry contact before creating an appointment');
      return;
    }
    const prefillData = {
      student: request.student,
      studentId: request.studentId || request.studentDbId,
      rto: request.rto || '',
      reqId: request.id || request.reqId || '',
      company: '',
      position: request.title || 'Internship Placement',
      appointmentDate: '',
      appointmentTime: '',
      requireAppointmentSchedule: true,
      openModal: true,
    };
    if (onNext) onNext(request, '', prefillData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-purple-50 text-purple-600';
      case 'Coordinator Review': return 'bg-blue-50 text-blue-600';
      case 'RTO Review': return 'bg-amber-50 text-amber-600';
      case 'Appointment': return 'bg-cyan-50 text-cyan-600';
      case 'Offered':
      case 'Approved': return 'bg-emerald-50 text-emerald-600';
      case 'Withdrawn':
      case 'Student Withdraw': return 'bg-amber-50 text-amber-700';
      case 'Declined':
      case 'Rejected':
      case 'Industry Rejected': return 'bg-rose-50 text-rose-600';
      case 'Not Suitable Site': return 'bg-purple-50 text-purple-700';
      case 'Student Missed Appointment': return 'bg-rose-50 text-rose-600';
      case 'Closed': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const currentContacts = (contactRecordsMap[selectedRequest?.dbId || selectedRequest?.id] || []);

  return (
    <>
      <div className="flex gap-4 items-start pb-8 relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex-1 space-y-4 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">New Requests</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{requestList.filter(r => r.status === 'New').length}</h3>
            </div>
            <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Coordinator Review</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{requestList.filter(r => r.status === 'Coordinator Review').length}</h3>
            </div>
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">RTO Review</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{requestList.filter(r => r.status === 'RTO Review').length}</h3>
            </div>
            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Appointment</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{requestList.filter(r => r.status === 'Appointment').length}</h3>
            </div>
            <div className="w-6 h-6 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Offered / Approved</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {requestList.filter(r => r.status === 'Approved' || r.status === 'Offered').length}
              </h3>
            </div>
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Declined / Withdrawn</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {requestList.filter(r => r.status === 'Rejected' || r.status === 'Declined' || r.status === 'Withdrawn' || r.status === 'Closed' || r.status === 'Cancelled').length}
              </h3>
            </div>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <XCircle className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5">
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
                {['All', 'New', 'Coordinator Review', 'RTO Review', 'Appointment', 'Offered', 'Approved', 'Withdrawn', 'Declined', 'Cancelled', 'Closed'].map((s) => (
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
        </div>

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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left border-collapse text-xs">
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
                <th className="p-4">Student Name</th>
                <th className="p-4">Available Days and Hours</th>
                <th className="p-4">Student Address</th>
                <th className="p-4">Contacted Industries</th>
                <th className="p-4">Placement Request</th>
                <th className="p-4">Coordinator</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedRequests.map((item, i) => {
                const isSelected = selectedRequest ? selectedRequest.id === item.reqId : false;
                const isRowSelected = selectedRows.includes(item.reqId);
                const contactCount = (item.contactedIndustries || []).length;
                return (
                  <tr
                    key={i}
                    className={`transition ${isSelected ? 'bg-blue-50/40' : isRowSelected ? 'bg-blue-50/20' : ''}`}
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
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600 text-xs shrink-0">
                          {(item.student || 'S')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{item.student}</p>
                          {item.studentEmail && (
                            <button type="button" title="Copy email" onClick={() => handleCopyStudentContact(item.studentEmail, 'Email')} className="flex items-center gap-1 mt-0.5 text-left text-[10px] text-slate-500 hover:text-blue-700">
                              <span className="break-all">{item.studentEmail}</span><Copy className="w-2.5 h-2.5 shrink-0" />
                            </button>
                          )}
                          {item.studentPhone && (
                            <button type="button" title="Copy phone" onClick={() => handleCopyStudentContact(item.studentPhone, 'Phone number')} className="flex items-center gap-1 mt-0.5 text-left text-[10px] text-slate-500 hover:text-blue-700">
                              <span>{item.studentPhone}</span><Copy className="w-2.5 h-2.5 shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{formatAvailability(item.availabilityDays, item.availabilityFrom, item.availabilityTo)}</td>
                    <td className="p-4 text-slate-600">{item.studentAddress || '—'}</td>
                    <td className="p-4">
                      <button type="button" onClick={() => handleOpenContactHistory(item)} className="text-left px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 whitespace-nowrap">
                        {contactCount} {contactCount === 1 ? 'Industry' : 'Industries'} Contacted
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-semibold text-slate-800">{item.coordinatorName || '—'}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assigned Date: {formatAssignedDate(item.assignedCoordinatorAt)}</p>
                    </td>
                    <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Add appointment for this student"
                          onClick={() => handleStartAppointmentForStudent(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Add Appointment</span>
                        </button>
                        <button
                          onClick={(e) => {
                            if (showRowMenu === item.reqId) {
                              setShowRowMenu(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setRowMenuPos({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.right + window.scrollX - 176, // 176 = w-44
                              });
                              setShowRowMenu(item.reqId);
                            }
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg inline-flex"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                      {showRowMenu === item.reqId && (
                        <div
                          style={{ position: 'fixed', top: rowMenuPos.top, left: rowMenuPos.left, zIndex: 9999 }}
                          className="w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5"
                        >
                          <button onClick={() => handleRowAction('view', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Placement Details</span>
                          </button>
                          <button onClick={() => handleRowAction('edit', item)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2">
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Placement Details</span>
                          </button>
                          <button onClick={() => handleRowAction('addIndustry', item)} className="w-full text-left px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center space-x-2">
                            <Plus className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Add Industry</span>
                          </button>
                          <div className="my-0.5 border-t border-slate-100" />
                          <button onClick={() => handleRowAction('addAppointment', item)} className="w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 rounded-lg flex items-center space-x-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Add Appointment</span>
                          </button>
                          <button onClick={() => handleRowAction('changePriority', item)} className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg flex items-center space-x-2">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Change Placement Request</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                    No requests found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
                    className={`w-7 h-7 flex items-center justify-center rounded-lg font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white font-bold' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
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

      {showDrawer && selectedRequest && (
        <div className={`${contactHistoryReadOnly ? 'fixed inset-4 z-50 w-auto max-w-none overflow-y-auto shadow-2xl' : 'w-80 shrink-0 overflow-hidden'} bg-white rounded-2xl border border-slate-200 shadow-sm`}>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-5">
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
                <p className="text-sm font-bold text-white mt-1.5 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span>{selectedRequest.student}</span>
                </p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedRequest.title}</p>
                {selectedRequest.notes && <p className="mt-2 whitespace-pre-wrap text-[10px] text-slate-300">{selectedRequest.notes}</p>}
                <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Requested on {selectedRequest.requestedOn}</span>
                </p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>

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

          <div className="flex border-b border-slate-100 px-4 text-[11px] font-semibold text-slate-500 space-x-3 bg-white overflow-x-auto">
            {['Overview', 'Contact History', 'Timeline', 'Details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 relative transition whitespace-nowrap ${activeTab === tab ? 'text-blue-600 font-bold' : 'hover:text-slate-800'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4 text-xs">
            {activeTab === 'Contact History' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contacted Organisations</span>
                  </h5>
                  {!contactHistoryReadOnly && (
                    <button
                      type="button"
                      onClick={() => setShowAddOrgModal(true)}
                      className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold rounded-lg flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Industry</span>
                    </button>
                  )}
                </div>

                {currentContacts.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-[11px]">
                    No industries contacted yet for this student.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentContacts.map((rec, index) => {
                      const orgName = (rec.organizationName || '').trim().toLowerCase();
                      const studentName = (selectedRequest?.student || '').trim().toLowerCase();
                      const studentId = (selectedRequest?.studentId || selectedRequest?.id || '').trim().toLowerCase();

                      const matchedDrawerAppt = (appointments || []).find((a) => {
                        const aCompany = (a.company || '').trim().toLowerCase();
                        const aStudent = (a.student || '').trim().toLowerCase();
                        const aStudentId = (a.studentId || '').trim().toLowerCase();
                        const isMatchStudent =
                          (studentId && aStudentId === studentId) ||
                          (studentName && aStudent === studentName);
                        const isMatchOrg =
                          orgName && aCompany && (aCompany === orgName || aCompany.includes(orgName) || orgName.includes(aCompany));
                        const isMatchContactId =
                          a.industryContactId && (a.industryContactId === rec.id || a.industryContactId === rec._id);
                        return isMatchStudent && (isMatchOrg || isMatchContactId);
                      });

                      // FIXED: this previously referenced `ci`, which does not exist in
                      // this scope (the loop variable here is `rec`) — that threw a
                      // ReferenceError and crashed the drawer any time contact history
                      // was opened. Now correctly reads `rec.organizationName`.
                      let displayResponse;
                      if (!matchedDrawerAppt) {
                        displayResponse = rec.organizationName ? 'Industry Contacted' : (rec.response || 'In Discussion');
                      } else if (matchedDrawerAppt.status === 'Confirmed' || matchedDrawerAppt.appointmentOutcome === 'successful') {
                        displayResponse = 'Placement Started';
                      } else if (matchedDrawerAppt.status === 'Completed') {
                        displayResponse = 'Placement Completed';
                      } else if (
                        matchedDrawerAppt.status === 'Not Suitable Site' ||
                        (matchedDrawerAppt.status === 'Declined' && matchedDrawerAppt.appointmentOutcome === 'not_suitable_site')
                      ) {
                        displayResponse = 'Not Suitable Site';
                      } else if (
                        matchedDrawerAppt.status === 'Industry Rejected' ||
                        matchedDrawerAppt.status === 'Declined' ||
                        matchedDrawerAppt.appointmentOutcome === 'industry_rejected'
                      ) {
                        displayResponse = 'Industry Rejected';
                      } else if (matchedDrawerAppt.status === 'Withdrawn' || matchedDrawerAppt.appointmentOutcome === 'student_withdrawal') {
                        displayResponse = 'Student Withdrew';
                      } else if (matchedDrawerAppt.status === 'No Show' || matchedDrawerAppt.status === 'Student Missed Appointment') {
                        displayResponse = 'Student Missed Appointment';
                      } else if (matchedDrawerAppt.status === 'Cancelled') {
                        displayResponse = 'Cancelled';
                      } else {
                        displayResponse = 'Appointment Scheduled';
                      }

                      return (
                      <div key={rec.id || index} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{rec.organizationName}</p>
                            <p className="text-[10px] text-slate-500">{rec.contactPerson} ({rec.phone})</p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-full">
                            {rec.industryType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 truncate">{rec.email}</p>
                        <p className="text-[10px] text-slate-500">{[rec.address, rec.suburb, rec.state, rec.postCode, rec.country].filter(Boolean).join(', ')}</p>
                        {/* Coordinator attribution — who added this industry contact */}
                        {rec.addedByName && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            Contacted by: <span className="font-semibold text-slate-700">{rec.addedByName}</span>
                          </p>
                        )}
                        {rec.appointmentDate && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                            Proposed Appointment: {rec.appointmentDate} {rec.appointmentTime ? `at ${rec.appointmentTime}` : ''}
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-200/60 mt-1 space-y-1">
                          <p className="text-[10px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-900">Notes/Discussion: </span>
                            {rec.notes}
                          </p>
                          <p className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            displayResponse === 'Placement Started'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : displayResponse === 'Placement Completed'
                              ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                              : displayResponse === 'Appointment Scheduled'
                              ? 'text-purple-700 bg-purple-50 border border-purple-200'
                              : displayResponse === 'Industry Contacted'
                              ? 'text-cyan-700 bg-cyan-50 border border-cyan-200'
                              : displayResponse === 'Industry Rejected'
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : displayResponse === 'Not Suitable Site'
                              ? 'text-amber-800 bg-amber-50 border border-amber-400'
                              : displayResponse === 'Student Withdrew'
                              ? 'text-orange-700 bg-orange-50 border border-orange-200'
                              : displayResponse === 'Student Missed Appointment'
                              ? 'text-slate-600 bg-slate-100 border border-slate-300'
                              : displayResponse === 'Cancelled'
                              ? 'text-slate-500 bg-slate-100 border border-slate-300'
                              : displayResponse.toLowerCase().includes('approv')
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : displayResponse.toLowerCase().includes('reject') || displayResponse.toLowerCase().includes('declin')
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : 'text-amber-700 bg-amber-50 border border-amber-200'
                          }`}>
                            Response: {displayResponse}
                          </p>
                          {(rec.contactedDate || rec.date) && (
                            <p className="text-[9px] text-slate-400">Date: {rec.contactedDate || rec.date}</p>
                          )}
                        </div>

                        {/* + Add Appointment for this specific industry */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-medium">Ready to interview?</span>
                          <button
                            type="button"
                            onClick={() => handleAddAppointmentForIndustry(rec)}
                            className="px-2.5 py-1.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-[10px] font-bold rounded-lg flex items-center space-x-1.5 transition-all duration-300 shadow-xs cursor-pointer"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>+ Add Appointment</span>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Duration</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedRequest.duration || '3 Weeks'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedRequest.workType || 'On-site'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Contacted</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">
                      {currentContacts.length}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {!contactHistoryReadOnly && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('Contact History'); setShowAddOrgModal(true); }}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Industry Contact Record</span>
                    </button>
                  )}
                  <button
                    onClick={handleCreateAppointment}
                    className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs text-[11px]"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Create Appointment (Step 3)</span>
                    <ArrowUpRight className="w-3 h-3 text-blue-200" />
                  </button>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
              <div className="flex justify-between">
                <span>Request ID</span>
                <span className="text-slate-600 font-medium">{selectedRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Student</span>
                <span className="text-slate-700 font-bold">{selectedRequest.student}</span>
              </div>
              <div className="flex justify-between">
                <span>Requested On</span>
                <span className="text-slate-600 font-medium">{selectedRequest.requestedOn}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Industry / Organisation Contact</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedRequest?.student
                    ? <>For <span className="font-semibold text-slate-600">{selectedRequest.student}</span> · {selectedRequest.title || selectedRequest.company || ''}</>
                    : 'Record organisation contacted for student\'s placement'}
                </p>
              </div>
              <button onClick={() => { setShowAddOrgModal(false); setOrgFormErrors({}); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Industry / Organisation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunnyside Aged Care Center"
                  value={orgForm.organizationName}
                  list="step2-industry-directory"
                  onChange={(e) => { handleOrgNameChange(e.target.value); if (orgFormErrors.organizationName) setOrgFormErrors(p => ({...p, organizationName: ''})); }}
                  className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${orgFormErrors.organizationName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                />
                <datalist id="step2-industry-directory">
                  {industryDirectory.map((industry) => <option key={industry._id || industry.id || industry.name} value={industry.name} />)}
                </datalist>
                {orgFormErrors.organizationName && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.organizationName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Industry Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={orgForm.industryType}
                    onChange={(e) => setOrgForm({ ...orgForm, industryType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Aged Care">Aged Care</option>
                    <option value="Disability Centre">Disability Centre</option>
                    <option value="Montessori School">Montessori School</option>
                    <option value="Day Care">Day Care</option>
                    <option value="Childcare/ECEC">Childcare/ECEC</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other relevant types</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Smith"
                    value={orgForm.contactPerson}
                    onChange={(e) => { setOrgForm({ ...orgForm, contactPerson: e.target.value }); if (orgFormErrors.contactPerson) setOrgFormErrors(p => ({...p, contactPerson: ''})); }}
                    className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${orgFormErrors.contactPerson ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                  />
                  {orgFormErrors.contactPerson && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.contactPerson}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="contact@org.com.au"
                    value={orgForm.email}
                    onChange={(e) => { setOrgForm({ ...orgForm, email: e.target.value }); if (orgFormErrors.email) setOrgFormErrors(p => ({...p, email: ''})); }}
                    className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${orgFormErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                  />
                  {orgFormErrors.email && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03 9123 4567"
                    value={orgForm.phone}
                    onChange={(e) => { setOrgForm({ ...orgForm, phone: e.target.value }); if (orgFormErrors.phone) setOrgFormErrors(p => ({...p, phone: ''})); }}
                    className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${orgFormErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                  />
                  {orgFormErrors.phone && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={orgForm.address}
                  onChange={(e) => { setOrgForm({ ...orgForm, address: e.target.value }); if (orgFormErrors.address) setOrgFormErrors(p => ({...p, address: ''})); }}
                  className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${orgFormErrors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                />
                {orgFormErrors.address && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City / Suburb</label>
                  <input type="text" value={orgForm.suburb} onChange={(e) => setOrgForm({ ...orgForm, suburb: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
                  <input type="text" value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zip Code</label>
                  <input type="text" value={orgForm.postCode} onChange={(e) => setOrgForm({ ...orgForm, postCode: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Country</label>
                  <input type="text" value={orgForm.country} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Response Status</label>
                <select
                  value={orgForm.response}
                  onChange={(e) => setOrgForm({ ...orgForm, response: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="In Discussion">In Discussion</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Appointment Date & Time Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Proposed Appointment Date
                  </label>
                  <input
                    type="date"
                    value={orgForm.appointmentDate}
                    onChange={(e) => setOrgForm({ ...orgForm, appointmentDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Proposed Appointment Time
                  </label>
                  <input
                    type="time"
                    value={orgForm.appointmentTime}
                    onChange={(e) => setOrgForm({ ...orgForm, appointmentTime: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Discussion Notes / Response <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of the conversation, requirements, next steps..."
                  value={orgForm.notes}
                  onChange={(e) => { setOrgForm({ ...orgForm, notes: e.target.value }); if (orgFormErrors.notes) setOrgFormErrors(p => ({...p, notes: ''})); }}
                  className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:border-blue-500 resize-none ${orgFormErrors.notes ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'}`}
                />
                {orgFormErrors.notes && <p className="mt-1 text-[10px] text-rose-500 font-medium flex items-center gap-1">⚠ {orgFormErrors.notes}</p>}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleAddOrgRecord}
                className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-xl transition-all duration-500 cursor-pointer"
              >
                Save Contact Record
              </button>
              <button
                onClick={() => { setShowAddOrgModal(false); setOrgFormErrors({}); }}
                className="px-4 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {placementDetailsTarget && (
        <PlacementRequestStudentDetails
          request={placementDetailsTarget.request}
          editable={placementDetailsTarget.editable}
          onClose={() => setPlacementDetailsTarget(null)}
          onSaved={onRefreshStudents}
        />
      )}

      {changePriorityTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Placement Request</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {changePriorityTarget.student} &nbsp;·&nbsp;
                  <span className="font-semibold">Current: {changePriorityTarget.priority}</span>
                </p>
              </div>
              <button type="button" onClick={() => setChangePriorityTarget(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* Priority selector */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  New Priority <span className="text-rose-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'Normal',   hint: 'Normal Priority',              style: 'blue'   },
                    { value: 'Urgent',   hint: 'Urgent Priority',              style: 'rose'   },
                    { value: 'Inactive', hint: 'Inactive — returns to Step 1', style: 'violet' },
                    { value: 'Snooze',   hint: 'Snooze — returns to Step 1',  style: 'amber'  },
                  ].map(({ value, hint, style }) => {
                    const selected = changePriority === value;
                    const palettes = {
                      blue:   selected ? 'bg-blue-50 border-blue-600 text-blue-700'       : 'border-slate-200 hover:border-blue-300',
                      rose:   selected ? 'bg-rose-50 border-rose-600 text-rose-700'       : 'border-slate-200 hover:border-rose-300',
                      violet: selected ? 'bg-violet-50 border-violet-600 text-violet-700' : 'border-slate-200 hover:border-violet-300',
                      amber:  selected ? 'bg-amber-50 border-amber-600 text-amber-900'    : 'border-slate-200 hover:border-amber-300',
                    };
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setChangePriority(value)}
                        className={`rounded-lg border px-3 py-2.5 text-left transition ${palettes[style]} ${selected ? 'font-bold' : 'bg-white text-slate-700'}`}
                      >
                        <span className="flex items-center justify-between text-xs">
                          {value}
                          <input type="radio" name="step2-change-priority" checked={selected} onChange={() => setChangePriority(value)} className="accent-cyan-700" />
                        </span>
                        <span className="mt-1 block text-[10px] font-normal text-slate-500">{hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Snooze duration */}
              {changePriority === 'Snooze' && (
                <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
                  <span>Snooze Duration</span>
                  <select
                    value={changeSnoozeDuration}
                    onChange={(e) => setChangeSnoozeDuration(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal"
                  >
                    <option value="7_days">7 Days</option>
                    <option value="14_days">14 Days</option>
                    <option value="30_days">30 Days</option>
                    <option value="indefinite">Until manually restored</option>
                  </select>
                </label>
              )}

              {/* Mandatory note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Reason / Note <span className="text-rose-500">*</span>
                  <span className="ml-1 font-normal text-slate-400">(required to enable Save)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={changePriorityNote}
                  onChange={(e) => setChangePriorityNote(e.target.value)}
                  placeholder={`e.g. Changed to ${changePriority}: I have tried contacting the student for 3 days but have been unsuccessful.`}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    changePriorityNote.trim()
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : 'border-rose-300 focus:border-rose-400 bg-rose-50/30'
                  }`}
                />
                {!changePriorityNote.trim() && (
                  <p className="text-[10px] text-rose-500">⚠ Please type a note before saving.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-400">
                {['Snooze', 'Inactive'].includes(changePriority)
                  ? '⚠ Student will be moved back to Step 1.'
                  : 'Student stays in Step 2 – Placement Request.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={savingPriority}
                  onClick={() => setChangePriorityTarget(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingPriority || !changePriorityNote.trim()}
                  onClick={handleSavePriorityChange}
                  className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingPriority ? 'Saving…' : 'Save Change'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}



      {/* ─── EDIT REQUEST MODAL ──────────────────────────────────────────── */}
      {editRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Placement Request</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{editRequest.reqId} · {editRequest.student}</p>
              </div>
              <button onClick={() => setEditRequest(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white text-xs"
                >
                  {['New','Coordinator Review','RTO Review','Appointment','Approved','Rejected','On Hold'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RTO</label>
                <input
                  type="text"
                  value={editForm.rto}
                  onChange={e => setEditForm(p => ({ ...p, rto: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white text-xs"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">🔥 Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-xs"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setEditRequest(null)}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isSavingEdit}
                onClick={async () => {
                  const dbId = editRequest.id || editRequest._id || editRequest.reqId;
                  if (!onUpdateRequest) { showToast('Update not available'); return; }
                  setIsSavingEdit(true);
                  try {
                    await onUpdateRequest(dbId, editForm);
                    showToast('Request updated successfully');
                    setEditRequest(null);
                  } catch (err) {
                    showToast('Failed to update request');
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSavingEdit ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>Saving...</span></> : <span>Save Changes</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ────────────────────────────────────────── */}
      {deleteConfirmReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Request</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Delete placement request <span className="font-semibold text-slate-800">{deleteConfirmReq.reqId}</span> for <span className="font-semibold">{deleteConfirmReq.student}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setDeleteConfirmReq(null)}
                disabled={isDeletingReq}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingReq}
                onClick={async () => {
                  const dbId = deleteConfirmReq.id || deleteConfirmReq.reqId || deleteConfirmReq._id;
                  if (!dbId) { setDeleteConfirmReq(null); return; }
                  setIsDeletingReq(true);
                  try {
                    if (onDeleteRequest) await onDeleteRequest(dbId);
                    showToast('Request deleted');
                  } catch (err) { showToast('Failed to delete'); }
                  finally { setIsDeletingReq(false); setDeleteConfirmReq(null); }
                }}
                className="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isDeletingReq ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>Deleting...</span></> : <><Trash2 className="w-3.5 h-3.5"/><span>Delete</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {assignCoordinatorTarget && (
      <AssignCoordinatorModal
        student={assignCoordinatorTarget}
        onClose={() => setAssignCoordinatorTarget(null)}
        onAssigned={() => {
          setAssignCoordinatorTarget(null);
          showToast('Coordinator assigned successfully');
        }}
      />
    )}
  </>
  );
}