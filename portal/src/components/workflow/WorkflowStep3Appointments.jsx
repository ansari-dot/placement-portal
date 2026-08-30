// src/components/workflow/WorkflowStep3Appointments.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon,
  FileText, CheckCircle2, UserX, Clock, Plus, Filter,
  X, Mail, Phone, MapPin, Building2, Check,
  Briefcase, ShieldCheck, ArrowUpRight, Download, CalendarClock, Video, Users,
  Trash2, Search, Edit3, AlertCircle, MessageCircle
} from 'lucide-react';

export default function WorkflowStep3Appointments({
  appointments = [],
  onBack,
  onNext,
  onCreateAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  students = [],
  requests = [],
  activeStudent = null,
  activeRequest = null,
  activeCompany = null,
  prefilledAppointmentData = null,
  onClearPrefilledData = null
}) {
  // ─── Get pre-selected student from navigation state ─────────────────────
  const location = useLocation();
  const preSelectedStudent = location.state?.preSelectedStudent || null;

  // Modal State
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newApptStudentId, setNewApptStudentId] = useState('');
  const [newApptReqId, setNewApptReqId] = useState('');
  const [newApptIndustryId, setNewApptIndustryId] = useState('');
  const [newApptCompany, setNewApptCompany] = useState('');
  const [newApptPosition, setNewApptPosition] = useState('Internship Interview');
  const [newApptDate, setNewApptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newApptTime, setNewApptTime] = useState('10:00');
  const [newApptInterviewer, setNewApptInterviewer] = useState('');
  const [newApptLocation, setNewApptLocation] = useState('HQ Office / Online');
  const [newApptMeetingType, setNewApptMeetingType] = useState('In-Person');
  const [newApptNotes, setNewApptNotes] = useState('');

  // ─── Auto-fill form when pre-selected student data is available ─────────
  useEffect(() => {
    const data = prefilledAppointmentData || preSelectedStudent || null;
    if (data) {
      console.log('📋 Pre-selected / prefilled appointment data:', data);

      const norm = (v) => String(v || '').trim().toLowerCase();

      // Find matching student
      const matchedStu = students.find(s =>
        (data.studentId && (norm(s.id) === norm(data.studentId) || norm(s._id) === norm(data.studentId) || norm(s.studentId) === norm(data.studentId))) ||
        (data.student && norm(s.name) === norm(data.student)) ||
        (data.studentName && norm(s.name) === norm(data.studentName))
      );

      if (matchedStu) {
        setNewApptStudentId(matchedStu.id || matchedStu._id || matchedStu.studentId);
      } else if (data.studentId) {
        setNewApptStudentId(data.studentId);
      }

      if (data.reqId) {
        setNewApptReqId(data.reqId);
      }
      if (data.industryId) {
        setNewApptIndustryId(data.industryId);
      }
      if (data.company) {
        setNewApptCompany(data.company);
      }
      if (data.interviewer) {
        setNewApptInterviewer(data.interviewer);
      }
      if (data.location) {
        setNewApptLocation(data.location);
      }
      if (data.appointmentDate) {
        setNewApptDate(data.appointmentDate);
      }
      if (data.appointmentTime) {
        setNewApptTime(data.appointmentTime);
      }
      if (data.position) {
        setNewApptPosition(data.position);
      }
      if (data.meetingType) {
        setNewApptMeetingType(data.meetingType);
      }
      if (data.notes) {
        setNewApptNotes(data.notes);
      }

      // Open the modal automatically
      setShowNewAppointment(true);
    }
  }, [prefilledAppointmentData, preSelectedStudent, students]);

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState('Calendar View');
  const [drawerTab, setDrawerTab] = useState('Overview');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Reschedule state in drawer
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Notes editing state in drawer
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Cancel / Outcome Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelType, setCancelType] = useState('student');
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [appointmentOutcome, setAppointmentOutcome] = useState('successful');
  const [commencementDate, setCommencementDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  // ─── Delete Confirm Modal ─────────────────────────────────────────────────
  const [deleteConfirmAppt, setDeleteConfirmAppt] = useState(null);
  const [isDeletingAppt, setIsDeletingAppt] = useState(false);

  // Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    Scheduled: true,
    Completed: true,
    'No Show': true,
    Rescheduled: true,
    Cancelled: true,
    Withdrawn: true,
    Declined: true
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Time slots for calendar grid
  const timeSlots = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  // Helper to format Date object into YYYY-MM-DD
  const formatDateToYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate current week days based on week offset
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const distanceToMon = (currentDayOfWeek + 6) % 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon + (currentWeekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayName = dayNames[i];
      const dateNum = d.getDate();
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const fullDateStr = formatDateToYMD(d);
      const isToday = formatDateToYMD(new Date()) === fullDateStr;

      days.push({
        name: `${dayName} ${dateNum} ${monthShort}`,
        dayName,
        dateNum,
        monthShort,
        fullDateStr,
        isToday
      });
    }
    return days;
  }, [currentWeekOffset]);

  // Formatted Week Date Range string
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.dateNum} ${start.monthShort} – ${end.dateNum} ${end.monthShort}`;
  }, [weekDays]);

  // Filtered appointments list based on status filters & search
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const statusMatch = statusFilters[appt.status] !== false;
      if (!statusMatch) return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const studentMatch = appt.student?.toLowerCase().includes(query);
        const companyMatch = appt.company?.toLowerCase().includes(query);
        const interviewerMatch = appt.interviewer?.toLowerCase().includes(query);
        const idMatch = (appt.apptId || appt.id)?.toLowerCase().includes(query);
        return studentMatch || companyMatch || interviewerMatch || idMatch;
      }
      return true;
    });
  }, [appointments, statusFilters, searchTerm]);

  // Filter count
  const filterCount = useMemo(() => {
    const disabledCount = Object.values(statusFilters).filter(val => !val).length;
    return disabledCount > 0 ? Object.keys(statusFilters).length - disabledCount : 0;
  }, [statusFilters]);

  // Calculate dynamic metrics
  const metrics = useMemo(() => {
    const todayYMD = formatDateToYMD(new Date());
    const weekYMDs = weekDays.map(w => w.fullDateStr);

    let todayCount = 0;
    let thisWeekCount = 0;
    let completedCount = 0;
    let noShowCount = 0;
    let rescheduledCount = 0;
    let upcomingCount = 0;
    let cancelledCount = 0;
    let withdrawnCount = 0;
    let declinedCount = 0;

    appointments.forEach(appt => {
      const apptDateStr = appt.date ? appt.date.split('T')[0] : '';
      if (apptDateStr === todayYMD) todayCount++;
      if (weekYMDs.includes(apptDateStr)) thisWeekCount++;

      if (appt.status === 'Completed') completedCount++;
      else if (appt.status === 'No Show') noShowCount++;
      else if (appt.status === 'Rescheduled') rescheduledCount++;
      else if (appt.status === 'Cancelled') cancelledCount++;
      else if (appt.status === 'Withdrawn') withdrawnCount++;
      else if (appt.status === 'Declined') declinedCount++;
      else if (appt.status === 'Scheduled') upcomingCount++;
    });

    return {
      todayCount,
      thisWeekCount,
      completedCount,
      noShowCount,
      rescheduledCount,
      upcomingCount,
      cancelledCount,
      withdrawnCount,
      declinedCount
    };
  }, [appointments, weekDays]);

  // Function to match appointments to calendar grid cell
  const getAppointmentsForCell = (dayObj, timeSlotStr) => {
    return filteredAppointments.filter(appt => {
      const apptDateStr = appt.date ? appt.date.split('T')[0] : '';
      const isDateMatch = apptDateStr === dayObj.fullDateStr || appt.date === dayObj.name;
      if (!isDateMatch) return false;

      if (!appt.time) return timeSlotStr === '9 AM';

      const apptTime = appt.time.toUpperCase();
      const slotHourNum = parseInt(timeSlotStr, 10);
      const isPMSlot = timeSlotStr.includes('PM') && slotHourNum !== 12;
      const target24Hour = isPMSlot ? slotHourNum + 12 : (timeSlotStr.includes('AM') && slotHourNum === 12 ? 0 : slotHourNum);

      let apptHour = -1;
      if (apptTime.includes(':')) {
        const parts = apptTime.split(':');
        let h = parseInt(parts[0], 10);
        if (apptTime.includes('PM') && h !== 12) h += 12;
        if (apptTime.includes('AM') && h === 12) h = 0;
        apptHour = h;
      } else {
        let h = parseInt(apptTime, 10);
        if (apptTime.includes('PM') && h !== 12) h += 12;
        apptHour = h;
      }

      return apptHour === target24Hour;
    });
  };

  // Color helper based on status
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Completed':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
          sub: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-300'
        };
      case 'No Show':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100',
          sub: 'text-rose-600',
          badge: 'bg-rose-100 text-rose-700 border-rose-300'
        };
      case 'Rescheduled':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
          sub: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700 border-amber-300'
        };
      case 'Cancelled':
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200',
          sub: 'text-slate-500',
          badge: 'bg-slate-200 text-slate-700 border-slate-300'
        };
      case 'Withdrawn':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100',
          sub: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700 border-orange-300'
        };
      case 'Declined':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100',
          sub: 'text-rose-600',
          badge: 'bg-rose-100 text-rose-700 border-rose-300'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
          sub: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 border-blue-300'
        };
    }
  };

  // Get contacted industries for selected student
  const selectedIndustriesForStudent = useMemo(() => {
    if (!newApptStudentId) return [];
    const stu = students.find(s => (s.id || s._id) === newApptStudentId);
    if (!stu) return [];

    const norm = (v) => String(v || '').trim().toLowerCase();
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);
    const stuName = norm(stu.name);

    const matchingRequests = requests.filter(r => {
      const reqStudentId = norm(r.studentId);
      const reqStudentName = norm(r.student);
      return (
        (reqStudentId && (reqStudentId === stuDbId || reqStudentId === stuBizId)) ||
        (reqStudentName && reqStudentName === stuName)
      );
    });

    return matchingRequests.flatMap(r =>
      (r.contactedIndustries || []).map(ind => ({ ...ind, __reqId: r.id || r.reqId }))
    );
  }, [newApptStudentId, students, requests]);

  // Select student handler for Modal
  const handleSelectStudentForNewAppt = (studentId) => {
    setNewApptStudentId(studentId);
    setNewApptIndustryId('');
    const stu = students.find(s => (s.id || s._id) === studentId);
    if (stu) {
      if (stu.company) setNewApptCompany(stu.company);
    }
  };

  // Select industry handler with auto-fill
  const handleSelectIndustryForNewAppt = (industryRecordId) => {
    setNewApptIndustryId(industryRecordId);
    const ind = selectedIndustriesForStudent.find(i => i.id === industryRecordId);
    if (ind) {
      setNewApptCompany(ind.organizationName || '');
      setNewApptInterviewer(ind.contactPerson || '');
      setNewApptLocation(ind.address || '');
      if (ind.appointmentDate) setNewApptDate(ind.appointmentDate);
      if (ind.appointmentTime) setNewApptTime(ind.appointmentTime);
    }
  };

  // Select linked request for Modal
  const handleSelectReqForNewAppt = (reqId) => {
    setNewApptReqId(reqId);
    const req = requests.find(r => r.id === reqId || r.reqId === reqId);
    if (req) {
      if (req.studentId) {
        setNewApptStudentId(req.studentId);
        setNewApptIndustryId('');
      }
      if (req.company) setNewApptCompany(req.company);
      if (req.title) setNewApptPosition(req.title);
    }
  };

  // Handle Submit New Appointment
  const handleCreateNewAppointment = async () => {
    if (!newApptStudentId || !newApptDate || !newApptTime) {
      showToast('Please fill in required fields (Student, Date, Time)');
      return;
    }

    const selectedStu = students.find(s => (s.id || s._id) === newApptStudentId || s.studentId === newApptStudentId || s.name === newApptStudentId);
    const studentName = selectedStu ? selectedStu.name : (prefilledAppointmentData?.student || prefilledAppointmentData?.studentName || 'Student');
    const studentIdCode = selectedStu ? (selectedStu.studentId || selectedStu.id) : (prefilledAppointmentData?.studentId || newApptStudentId);
    const rto = selectedStu ? (selectedStu.rto || 'N/A') : (prefilledAppointmentData?.rto || 'N/A');
    const email = selectedStu ? (selectedStu.email || '') : (prefilledAppointmentData?.email || '');
    const phone = selectedStu ? (selectedStu.phone || '') : (prefilledAppointmentData?.phone || '');

    const payload = {
      student: studentName,
      studentId: studentIdCode,
      rto,
      email,
      phone,
      company: newApptCompany || 'Company',
      position: newApptPosition || 'Internship Interview',
      date: newApptDate,
      time: newApptTime,
      interviewer: newApptInterviewer || 'Hiring Manager',
      location: newApptLocation || 'HQ Office',
      meetingType: newApptMeetingType,
      linkedReq: newApptReqId || '',
      linkedReqStatus: newApptReqId ? 'In Review' : '',
      industryContactId: newApptIndustryId || '',
      status: 'Scheduled',
      notes: newApptNotes || ''
    };

    if (onCreateAppointment) {
      try {
        await onCreateAppointment(payload);
        showToast('Appointment created successfully');
        setShowNewAppointment(false);
        setNewApptStudentId('');
        setNewApptReqId('');
        setNewApptIndustryId('');
        setNewApptCompany('');
        setNewApptPosition('Internship Interview');
        setNewApptInterviewer('');
        setNewApptNotes('');
        // Clear pre-selected student after creation
        if (preSelectedStudent) {
          window.history.replaceState({}, document.title);
        }
        if (onClearPrefilledData) {
          onClearPrefilledData();
        }
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Failed to create appointment');
      }
    }
  };

  const handleOpenOutcomeModal = () => {
    if (!selectedAppointment) return;
    setAppointmentOutcome('successful');
    setCommencementDate(selectedAppointment.date || new Date().toISOString().split('T')[0]);
    setExpectedCompletionDate('');
    setOutcomeNotes(selectedAppointment.notes || '');
    setShowOutcomeModal(true);
  };

  const handleConfirmOutcome = async () => {
    if (!selectedAppointment) return;
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (!dbId || !onUpdateAppointment) return;

    try {
      let payload = { notes: outcomeNotes || selectedAppointment.notes || '' };
      let status = 'Completed';
      let cancellationReason = '';
      let cancellationType = '';

      if (appointmentOutcome === 'successful') {
        if (!commencementDate) {
          showToast('Please select commencement date');
          return;
        }
        payload = {
          ...payload,
          status: 'Completed',
          appointmentOutcome: 'successful',
          commencementDate,
          expectedCompletionDate: expectedCompletionDate || '',
          cancellationReason: '',
          cancellationType: '',
        };
      } else if (appointmentOutcome === 'industry_rejected') {
        status = 'Declined';
        cancellationType = 'industry';
        cancellationReason = outcomeNotes || 'Industry rejected the student';
        payload = {
          ...payload,
          status,
          cancellationReason,
          cancellationType,
          cancellationTypeLabel: 'Industry Rejected',
          appointmentOutcome: 'industry_rejected',
          commencementDate: '',
          expectedCompletionDate: '',
        };
      } else if (appointmentOutcome === 'student_withdrawal') {
        status = 'Withdrawn';
        cancellationType = 'withdrawn';
        cancellationReason = outcomeNotes || 'Student withdrew from placement';
        payload = {
          ...payload,
          status,
          cancellationReason,
          cancellationType,
          cancellationTypeLabel: 'Student Withdrew',
          appointmentOutcome: 'student_withdrawal',
          commencementDate: '',
          expectedCompletionDate: '',
        };
      } else if (appointmentOutcome === 'not_suitable_site') {
        status = 'Declined';
        cancellationType = 'student';
        cancellationReason = outcomeNotes || 'Placement site was not suitable for the student';
        payload = {
          ...payload,
          status,
          cancellationReason,
          cancellationType,
          cancellationTypeLabel: 'Not Suitable Site',
          appointmentOutcome: 'not_suitable_site',
          commencementDate: '',
          expectedCompletionDate: '',
        };
      }

      await onUpdateAppointment(dbId, payload);
      setSelectedAppointment(prev => ({
        ...prev,
        status,
        notes: payload.notes,
        appointmentOutcome: payload.appointmentOutcome,
        commencementDate: payload.commencementDate || prev.commencementDate || '',
        expectedCompletionDate: payload.expectedCompletionDate || prev.expectedCompletionDate || '',
        cancellationReason,
        cancellationType,
      }));
      setShowOutcomeModal(false);
      showToast(
        appointmentOutcome === 'successful'
          ? 'Appointment recorded as successful'
          : 'Outcome saved and student returned to workflow'
      );
    } catch (err) {
      console.error('Failed to update appointment outcome:', err);
      showToast('Failed to save appointment outcome');
    }
  };

  // Handle Cancel - Open Modal instead of direct cancel
  const handleCancelClick = () => {
    if (!selectedAppointment) return;
    setCancelAppointmentId(selectedAppointment.id || selectedAppointment._id);
    setCancelReason('');
    setCancelType('student');
    setShowCancelModal(true);
  };

  // Handle Confirm Cancel with Reason
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation');
      return;
    }

    if (onUpdateAppointment && cancelAppointmentId) {
      try {
        const statusMap = {
          student: 'Declined',
          industry: 'Declined',
          withdrawn: 'Withdrawn',
          other: 'Cancelled'
        };

        const newStatus = statusMap[cancelType] || 'Cancelled';

        const payload = {
          status: newStatus,
          cancellationReason: cancelReason,
          cancellationType: cancelType,
          cancelledAt: new Date().toISOString()
        };

        await onUpdateAppointment(cancelAppointmentId, payload);
        showToast(`Appointment ${newStatus} successfully`);
        setShowCancelModal(false);
        setCancelReason('');
        setCancelType('student');
        setSelectedAppointment(prev => ({
          ...prev,
          status: newStatus,
          cancellationReason: cancelReason,
          cancellationType: cancelType,
          cancelledAt: payload.cancelledAt
        }));
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
        showToast('Failed to cancel appointment: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // Handle Reschedule
  const handleConfirmReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      showToast('Please select date and time to reschedule');
      return;
    }
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (onUpdateAppointment && dbId) {
      try {
        await onUpdateAppointment(dbId, {
          date: rescheduleDate,
          time: rescheduleTime,
          status: 'Rescheduled'
        });
        setSelectedAppointment(prev => ({
          ...prev,
          date: rescheduleDate,
          time: rescheduleTime,
          status: 'Rescheduled'
        }));
        setIsRescheduling(false);
        showToast('Appointment rescheduled successfully');
      } catch (err) {
        showToast('Failed to reschedule appointment');
      }
    }
  };

  // Handle Save Notes
  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (onUpdateAppointment && dbId) {
      try {
        await onUpdateAppointment(dbId, { notes: editedNotes });
        setSelectedAppointment(prev => ({ ...prev, notes: editedNotes }));
        setIsEditingNotes(false);
        showToast('Notes saved successfully');
      } catch (err) {
        showToast('Failed to save notes');
      }
    }
  };

  // Handle Delete Appointment — opens confirmation modal
  const handleDelete = (apptId, appt) => {
    setDeleteConfirmAppt(appt || { id: apptId });
  };

  const handleConfirmedDeleteAppt = async () => {
    const apptId = deleteConfirmAppt?.id || deleteConfirmAppt?._id || deleteConfirmAppt?.apptId;
    if (!apptId) return;
    setIsDeletingAppt(true);
    try {
      if (onDeleteAppointment) {
        await onDeleteAppointment(apptId);
      }
      showToast('Appointment deleted successfully');
      setShowDrawer(false);
      setSelectedAppointment(null);
    } catch (err) {
      showToast('Failed to delete appointment');
    } finally {
      setIsDeletingAppt(false);
      setDeleteConfirmAppt(null);
    }
  };

  // Export CSV Handler
  const handleExport = (format) => {
    setShowExportMenu(false);
    if (filteredAppointments.length === 0) {
      showToast('No appointments available to export');
      return;
    }

    const headers = ['Appt ID', 'Student Name', 'Student ID', 'RTO', 'Company', 'Position', 'Date', 'Time', 'Meeting Type', 'Interviewer', 'Location', 'Status', 'Reason', 'Notes'];
    const rows = filteredAppointments.map(a => [
      a.apptId || a.id || '',
      `"${a.student || ''}"`,
      `"${a.studentId || ''}"`,
      `"${a.rto || ''}"`,
      `"${a.company || ''}"`,
      `"${a.position || ''}"`,
      `"${a.date || ''}"`,
      `"${a.time || ''}"`,
      `"${a.meetingType || ''}"`,
      `"${a.interviewer || ''}"`,
      `"${a.location || ''}"`,
      `"${a.status || ''}"`,
      `"${(a.cancellationReason || '').replace(/"/g, '""')}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `appointments_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredAppointments.length} appointments as ${format.toUpperCase()}`);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex gap-4 items-start pb-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 min-w-0">

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Today's</p>
              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.todayCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">This Week</p>
              <div className="w-5 h-5 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.thisWeekCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Scheduled</p>
              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.upcomingCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Completed</p>
              <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.completedCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Rescheduled</p>
              <div className="w-5 h-5 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.rescheduledCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Declined</p>
              <div className="w-5 h-5 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.declinedCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Withdrawn</p>
              <div className="w-5 h-5 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                <UserX className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.withdrawnCount}</h3>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Cancelled</p>
              <div className="w-5 h-5 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{metrics.cancelledCount}</h3>
          </div>
        </div>

        {/* View Toggle & Toolbar Container */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex-wrap">

            {/* View Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => { setActiveTab('Calendar View'); showToast('Calendar View active'); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeTab === 'Calendar View' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Calendar
              </button>
              <button
                onClick={() => { setActiveTab('List View'); showToast('List View active'); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeTab === 'List View' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                List ({filteredAppointments.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Week Navigation Controls */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => { setCurrentWeekOffset(prev => prev - 1); showToast('Previous week'); }}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 shadow-xs transition"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setCurrentWeekOffset(0); showToast('Current week'); }}
                  className="px-2.5 py-1 bg-white rounded-lg text-[11px] font-bold text-slate-800 shadow-xs"
                >
                  Today
                </button>
                <button
                  onClick={() => { setCurrentWeekOffset(prev => prev + 1); showToast('Next week'); }}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 shadow-xs transition"
                  title="Next Week"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Week Range Display */}
              <div className="relative">
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[11px] font-bold text-slate-800">
                  <CalendarIcon className="w-3 h-3 text-slate-400" />
                  <span>{weekRangeLabel}</span>
                </div>
              </div>

              {/* Filters Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-100 whitespace-nowrap"
                >
                  <Filter className="w-3 h-3 text-blue-600" />
                  <span>Filters</span>
                  {filterCount > 0 && (
                    <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">{filterCount}</span>
                  )}
                </button>
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Filters</p>
                    <div className="space-y-1.5">
                      {['Scheduled', 'Completed', 'No Show', 'Rescheduled', 'Cancelled', 'Withdrawn', 'Declined'].map(st => (
                        <label key={st} className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFilters[st] !== false}
                            onChange={(e) => setStatusFilters(prev => ({ ...prev, [st]: e.target.checked }))}
                            className="rounded accent-blue-600"
                          />
                          <span>{st}</span>
                        </label>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <button
                        onClick={() => {
                          setStatusFilters({ Scheduled: true, Completed: true, 'No Show': true, Rescheduled: true, Cancelled: true, Withdrawn: true, Declined: true });
                          showToast('Reset status filters');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="py-1 px-3 bg-[#0147A6] text-white text-[10px] font-bold rounded-lg hover:bg-blue-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-slate-200 shrink-0"></div>

              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-100 whitespace-nowrap"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                      Export CSV
                    </button>
                    <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                      Export Excel
                    </button>
                  </div>
                )}
              </div>

              {/* New Appointment Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNewAppointment(!showNewAppointment)}
                  className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Appt.</span>
                </button>

                {/* New Appointment Modal Dropdown */}
                {showNewAppointment && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 p-4 space-y-3 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-900">Schedule New Appointment</h4>
                      <button onClick={() => setShowNewAppointment(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Student *</label>
                        <select
                          value={newApptStudentId}
                          onChange={(e) => handleSelectStudentForNewAppt(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map((s) => (
                            <option key={s.id || s._id} value={s.id || s._id}>{s.name} ({s.studentId || s.id})</option>
                          ))}
                        </select>
                      </div>

                      {requests.length > 0 && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Linked Request (Optional)</label>
                          <select
                            value={newApptReqId}
                            onChange={(e) => handleSelectReqForNewAppt(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="">-- None --</option>
                            {requests.map((r) => (
                              <option key={r.id} value={r.id}>{r.reqId || r.id} - {r.title} ({r.company})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Step 2 Contacted Industry / Organisation Selection */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Select Contacted Industry (from Step 2) *
                        </label>
                        <select
                          value={newApptIndustryId}
                          onChange={(e) => handleSelectIndustryForNewAppt(e.target.value)}
                          disabled={!newApptStudentId}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">
                            {!newApptStudentId
                              ? '-- Select a student first --'
                              : selectedIndustriesForStudent.length === 0
                                ? 'No industries contacted for this student yet'
                                : '-- Choose Contacted Industry --'}
                          </option>
                          {selectedIndustriesForStudent.map((ind) => (
                            <option key={ind.id} value={ind.id}>
                              {ind.organizationName} ({ind.industryType})
                              {ind.appointmentDate ? ` — ${ind.appointmentDate}${ind.appointmentTime ? ' ' + ind.appointmentTime : ''}` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="text-[9px] text-slate-400 mt-1">
                          {newApptStudentId ? `Found ${selectedIndustriesForStudent.length} industries` : 'Select a student first'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company / Organisation *</label>
                          <input
                            placeholder="Organisation Name"
                            value={newApptCompany}
                            onChange={(e) => setNewApptCompany(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Position / Placement Role</label>
                          <input
                            placeholder="e.g. Aged Care Assistant"
                            value={newApptPosition}
                            onChange={(e) => setNewApptPosition(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Appointment Date *</label>
                          <input
                            type="date"
                            value={newApptDate}
                            onChange={(e) => setNewApptDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Appointment Time *</label>
                          <input
                            type="time"
                            value={newApptTime}
                            onChange={(e) => setNewApptTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Interviewer / Contact</label>
                          <input
                            placeholder="Contact Person Name"
                            value={newApptInterviewer}
                            onChange={(e) => setNewApptInterviewer(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meeting Type</label>
                          <select
                            value={newApptMeetingType}
                            onChange={(e) => setNewApptMeetingType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="In-Person">In-Person</option>
                            <option value="Video">Video</option>
                            <option value="Phone">Phone</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location / Address</label>
                        <input
                          placeholder="e.g. 123 Care Street or Zoom Link"
                          value={newApptLocation}
                          onChange={(e) => setNewApptLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes (Requirements & Instructions)</label>
                        <textarea
                          rows={3}
                          placeholder="Record specific requirements, instructions, or information provided by the industry regarding the appointment..."
                          value={newApptNotes}
                          onChange={(e) => setNewApptNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleCreateNewAppointment}
                        className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-xl transition-all duration-500 cursor-pointer shadow-xs"
                      >
                        Create Appointment
                      </button>
                      <button
                        onClick={() => setShowNewAppointment(false)}
                        className="px-4 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MAIN VIEW CONTENT: List View or Calendar View */}
          {activeTab === 'List View' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 uppercase tracking-wider border-b border-slate-200 text-[10px] font-semibold">
                      <th className="p-4">Appointment</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Company & Position</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Type & Location</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredAppointments.map((appt, i) => {
                      const badgeStyle = getStatusBadgeStyle(appt.status);
                      const isSelected = selectedAppointment && (selectedAppointment.id === appt.id || selectedAppointment._id === appt.id);
                      return (
                        <tr
                          key={appt.id || appt._id || i}
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setShowDrawer(true);
                            setIsRescheduling(false);
                            setIsEditingNotes(false);
                          }}
                          className={`cursor-pointer hover:bg-slate-50 transition ${isSelected ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="p-4 font-bold text-slate-900">
                            {appt.apptId || appt.id || `APPT-${i + 1}`}
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-900">{appt.student}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{appt.studentId} • {appt.rto}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-900">{appt.company}</p>
                            <p className="text-[10px] text-slate-500">{appt.position || 'Internship Interview'}</p>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <p className="font-medium text-slate-900">{appt.date}</p>
                            <p className="text-[10px] text-slate-500">{appt.time}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-slate-800">{appt.meetingType}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{appt.location || 'N/A'}</p>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle.badge}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-4 max-w-[120px]">
                            {appt.cancellationReason ? (
                              <span className="text-[9px] text-slate-500 truncate block" title={appt.cancellationReason}>
                                {appt.cancellationReason.length > 30 ? appt.cancellationReason.substring(0, 30) + '...' : appt.cancellationReason}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(appt.id || appt._id, appt)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg inline-flex"
                              title="Delete Appointment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAppointments.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No appointments match the selected filters or search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CALENDAR VIEW GRID */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 overflow-x-auto">
              <div className="min-w-[950px]">
                {/* Header Days Row */}
                <div className="grid grid-cols-8 border-b border-slate-200 pb-3 text-xs font-bold text-slate-500 text-center">
                  <div className="text-left pl-2">Time</div>
                  {weekDays.map((d, i) => (
                    <div key={i} className={`flex flex-col items-center justify-center ${d.isToday ? 'text-blue-600 font-extrabold' : ''}`}>
                      <span>{d.dayName}</span>
                      <span className={`text-sm mt-0.5 ${d.isToday ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs font-bold' : 'text-slate-900 font-bold'}`}>
                        {d.dateNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Time Slots Grid */}
                <div className="divide-y divide-slate-100">
                  {timeSlots.map((timeSlotStr, idx) => (
                    <div key={idx} className="grid grid-cols-8 py-3 text-xs items-stretch min-h-[85px]">
                      <span className="font-semibold text-slate-400 pt-2 pl-2 text-[11px]">{timeSlotStr}</span>

                      {weekDays.map((dayObj, dayIdx) => {
                        const cellAppts = getAppointmentsForCell(dayObj, timeSlotStr);
                        return (
                          <div key={dayIdx} className="p-1 min-h-[75px] flex flex-col space-y-1 justify-start border-l border-slate-50/50">
                            {cellAppts.map((apptItem, apptIdx) => {
                              const isSelectedAppt = selectedAppointment && (selectedAppointment.id === apptItem.id || selectedAppointment._id === apptItem.id);
                              const badgeStyle = getStatusBadgeStyle(apptItem.status);

                              return (
                                <div
                                  key={apptItem.id || apptItem._id || apptIdx}
                                  onClick={() => {
                                    setSelectedAppointment(apptItem);
                                    setShowDrawer(true);
                                    setIsRescheduling(false);
                                    setIsEditingNotes(false);
                                  }}
                                  className={`p-2 rounded-xl border text-left w-full shadow-2xs cursor-pointer transition hover:scale-[1.02] ${badgeStyle.bg} ${isSelectedAppt ? 'ring-2 ring-blue-600 font-bold shadow-md' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-[11px] truncate leading-tight">{apptItem.student}</p>
                                  </div>
                                  <p className="text-[10px] truncate font-medium opacity-85 mt-0.5">{apptItem.company}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className={`text-[9px] font-bold ${badgeStyle.sub}`}>{apptItem.time}</p>
                                    <span className={`text-[8px] font-extrabold px-1 rounded ${badgeStyle.sub}`}>
                                      {apptItem.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>Declined</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>Withdrawn</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Rescheduled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                    <span>Cancelled</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Showing {filteredAppointments.length} of {appointments.length} appointments
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center space-x-2 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Requests</span>
            </button>
          ) : <div />}
          {onNext && (
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-xs font-semibold text-white rounded-xl flex items-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs"
            >
              <span>Continue to Internships</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Drawer / Detail Panel */}
      {showDrawer && selectedAppointment && (
        <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-xl shrink-0 overflow-hidden self-start">
          <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-${
            selectedAppointment.status === 'Completed' ? 'emerald' :
            selectedAppointment.status === 'Declined' ? 'rose' :
            selectedAppointment.status === 'Withdrawn' ? 'orange' :
            selectedAppointment.status === 'Cancelled' ? 'slate' :
            'cyan'
          }-900 p-5`}>
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm tracking-wide">
                    {selectedAppointment.apptId || selectedAppointment.id || 'APPT'}
                  </h4>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadgeStyle(selectedAppointment.status).badge}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1.5">{selectedAppointment.position || 'Internship Interview'}</p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                  <CalendarIcon className="w-3 h-3 text-cyan-400" />
                  <span>{selectedAppointment.date} • {selectedAppointment.time}</span>
                </p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student info */}
            <div className="relative mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm">
                {selectedAppointment.student ? selectedAppointment.student.charAt(0) : 'S'}
              </div>
              <div>
                <p className="font-bold text-white text-xs">{selectedAppointment.student}</p>
                <p className="text-[10px] text-slate-400 font-mono">{selectedAppointment.studentId}</p>
                <p className="text-[10px] text-slate-300">{selectedAppointment.rto}</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="relative mt-3 space-y-1.5">
              {selectedAppointment.email && (
                <div className="flex items-center space-x-2 text-[10px] text-slate-300">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{selectedAppointment.email}</span>
                </div>
              )}
              {selectedAppointment.phone && (
                <div className="flex items-center space-x-2 text-[10px] text-slate-300">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedAppointment.phone}</span>
                </div>
              )}
            </div>

            {/* Show cancellation reason if exists */}
            {selectedAppointment.cancellationReason && (
              <div className="relative mt-3 p-2 bg-white/10 rounded-xl border border-white/10">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Reason</p>
                    <p className="text-[10px] text-slate-200">{selectedAppointment.cancellationReason}</p>
                    {selectedAppointment.cancellationType && (
                      <p className="text-[8px] text-slate-400 mt-0.5">
                        Type: {selectedAppointment.cancellationType === 'student' ? 'Student Request' : 
                                selectedAppointment.cancellationType === 'industry' ? 'Industry Rejected' : 
                                selectedAppointment.cancellationType === 'withdrawn' ? 'Student Withdrew' : 'Other'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Sub-Tabs */}
          <div className="flex border-b border-slate-100 px-5 text-[11px] font-semibold text-slate-500 space-x-4 bg-white">
            {['Overview', 'Details', 'Notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setDrawerTab(tab)}
                className={`py-3 relative transition ${drawerTab === tab ? 'text-blue-600 font-bold' : 'hover:text-slate-800'
                  }`}
              >
                {tab}
                {drawerTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div className="p-5 space-y-4 text-xs">
            {drawerTab === 'Overview' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedAppointment.meetingType || 'In-Person'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Interviewer</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{selectedAppointment.interviewer || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Company</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{selectedAppointment.company}</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <span className="w-1 h-3 bg-cyan-600 rounded-full"></span>
                    <span>Appointment Info</span>
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Date</span>
                      <span className="font-semibold text-slate-900">{selectedAppointment.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Time</span>
                      <span className="font-semibold text-slate-900">{selectedAppointment.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Location</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[150px]">{selectedAppointment.location || 'N/A'}</span>
                    </div>
                    {selectedAppointment.cancellationReason && (
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500">Reason</span>
                        <span className="font-semibold text-slate-900 text-right max-w-[150px] break-words">
                          {selectedAppointment.cancellationReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isRescheduling ? (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                    <h5 className="text-xs font-bold text-amber-900">Reschedule Appointment</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-amber-800">New Date</label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-amber-800">New Time</label>
                        <input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={handleConfirmReschedule}
                        className="flex-1 py-1.5 bg-amber-600 text-white font-bold text-xs rounded hover:bg-amber-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setIsRescheduling(false)}
                        className="px-3 py-1.5 bg-white border border-amber-300 text-slate-700 text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick Status Actions</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsRescheduling(!isRescheduling);
                        setRescheduleDate(selectedAppointment.date || '');
                        setRescheduleTime(selectedAppointment.time || '');
                      }}
                      className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Appt</span>
                    </button>
                  </div>

                  <button
                    onClick={handleOpenOutcomeModal}
                    className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs text-[11px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Set Appointment Outcome</span>
                  </button>
                </div>
              </>
            )}

            {drawerTab === 'Details' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Appointment ID</span>
                    <span className="font-mono font-bold text-slate-800">{selectedAppointment.apptId || selectedAppointment.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Student</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.student}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Student ID</span>
                    <span className="font-mono text-slate-800">{selectedAppointment.studentId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Company</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.company}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Position</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.position || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Meeting Type</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.meetingType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Interviewer</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.interviewer || 'N/A'}</span>
                  </div>
                  {selectedAppointment.cancellationReason && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Cancellation Reason</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[150px] break-words">
                        {selectedAppointment.cancellationReason}
                      </span>
                    </div>
                  )}
                  {selectedAppointment.cancellationType && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Cancellation Type</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppointment.cancellationType === 'student' ? 'Student Request' :
                         selectedAppointment.cancellationType === 'industry' ? 'Industry Rejected' :
                         selectedAppointment.cancellationType === 'withdrawn' ? 'Student Withdrew' : 'Other'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleDelete(selectedAppointment.id || selectedAppointment._id, selectedAppointment)}
                    className="w-full py-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Appointment</span>
                  </button>
                </div>
              </div>
            )}

            {drawerTab === 'Notes' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Notes</h5>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => {
                        setIsEditingNotes(true);
                        setEditedNotes(selectedAppointment.notes || '');
                      }}
                      className="text-blue-600 text-xs font-bold flex items-center space-x-1 hover:underline"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveNotes}
                        className="py-1.5 px-3 bg-[#0147A6] text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="py-1.5 px-3 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-xs">
                    {selectedAppointment.notes || 'No specific notes recorded for this appointment.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── APPOINTMENT OUTCOME MODAL ───────────────────────────────────── */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Appointment Outcome</h3>
                <p className="text-xs text-slate-400 mt-0.5">Choose the final result after the interview</p>
              </div>
              <button onClick={() => setShowOutcomeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Outcome *</label>
                <select
                  value={appointmentOutcome}
                  onChange={(e) => setAppointmentOutcome(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="successful">1) Appointment Successful</option>
                  <option value="industry_rejected">2) Industry Rejected</option>
                  <option value="student_withdrawal">3) Student Withdrawal</option>
                  <option value="not_suitable_site">4) Not Suitable Site</option>
                </select>
              </div>

              {appointmentOutcome === 'successful' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commencement Date *</label>
                    <input
                      type="date"
                      value={commencementDate}
                      onChange={(e) => setCommencementDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expected Completion Date</label>
                    <input
                      type="date"
                      value={expectedCompletionDate}
                      onChange={(e) => setExpectedCompletionDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Short Notes</label>
                <textarea
                  rows={4}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder={
                    appointmentOutcome === 'successful'
                      ? 'Add placement notes, start details, and summary.'
                      : appointmentOutcome === 'industry_rejected'
                        ? 'Reason the industry rejected the student.'
                        : appointmentOutcome === 'student_withdrawal'
                          ? 'Reason student withdrew or delayed placement.'
                          : 'Reason the site was not suitable and the student should return to workflow.'
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {(appointmentOutcome === 'industry_rejected' || appointmentOutcome === 'student_withdrawal' || appointmentOutcome === 'not_suitable_site') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 font-medium">
                  This will return the student to the main student list so the placement can be recreated from the start.
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleConfirmOutcome}
                className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-xl transition-all duration-500 cursor-pointer"
              >
                Save Outcome
              </button>
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL APPOINTMENT MODAL ──────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please provide reason for cancellation</p>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cancellation Type *</label>
                <select
                  value={cancelType}
                  onChange={(e) => setCancelType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="student">Student's Request / Decision</option>
                  <option value="industry">Industry / Employer Rejected</option>
                  <option value="withdrawn">Student Withdrew (will join later)</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Detailed Reason *</label>
                <textarea
                  rows={4}
                  placeholder={
                    cancelType === 'student' 
                      ? 'e.g. Student found another opportunity, Student not interested anymore...'
                      : cancelType === 'industry'
                      ? 'e.g. Position filled, Industry changed requirements, Budget constraints...'
                      : cancelType === 'withdrawn'
                      ? 'e.g. Student requested to join after 2 weeks, Personal reasons...'
                      : 'Please provide detailed reason...'
                  }
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {cancelType === 'withdrawn' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <p className="text-[10px] text-amber-800 font-medium">
                    💡 Student will join later. They will appear in "Waiting to Join" list.
                  </p>
                </div>
              )}

              {cancelType === 'industry' && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <p className="text-[10px] text-rose-800 font-medium">
                    ⚠️ Industry rejected the student. This will be marked as "Declined" in internships.
                  </p>
                </div>
              )}

              {cancelType === 'student' && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <p className="text-[10px] text-blue-800 font-medium">
                    ℹ️ Student requested cancellation. This will be marked as "Declined" in internships.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─────────────────────────────────────────── */}
      {deleteConfirmAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Appointment</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Delete appointment for <span className="font-semibold text-slate-800">{deleteConfirmAppt.student}</span>
                  {deleteConfirmAppt.company ? <> at <span className="font-semibold">{deleteConfirmAppt.company}</span></> : ''}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setDeleteConfirmAppt(null)}
                disabled={isDeletingAppt}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingAppt}
                onClick={handleConfirmedDeleteAppt}
                className="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isDeletingAppt
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/><span>Deleting...</span></>
                  : <><Trash2 className="w-3.5 h-3.5"/><span>Delete Appointment</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}