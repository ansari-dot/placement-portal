import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { calculatePlacementEndDate, getCalculationSummary } from '../../utils/dateCalculation';
import { fetchStudentById } from '../../api/studentsApi';
import {
  ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon,
  FileText, CheckCircle2, UserX, Clock, Plus,
  X, Mail, Phone, MapPin, Building2, Check,
  Briefcase, ShieldCheck, ArrowUpRight, Download, CalendarClock, Video, Users,
  Search, Edit3, AlertCircle, MessageCircle, Eye, MoreVertical, Trash2
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
  // ─── Get pre-selected student from navigation state or URL ──────────────
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const preSelectedStudent = location.state?.preSelectedStudent || null;

  // Modal State
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newApptStudentId, setNewApptStudentId] = useState('');
  const [newApptReqId, setNewApptReqId] = useState('');
  const [newApptIndustryId, setNewApptIndustryId] = useState('');
  const [newApptIndustryDetails, setNewApptIndustryDetails] = useState(null);
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
    const studentIdParam = searchParams.get('studentId');
    const studentNameParam = searchParams.get('studentName');
    const urlData = (studentIdParam || studentNameParam) ? { studentId: studentIdParam, studentName: studentNameParam } : null;
    const data = prefilledAppointmentData || preSelectedStudent || urlData || null;

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

      if (urlData) {
        setShowNewAppointment(true);
      }

      if (data.reqId) {
        setNewApptReqId(data.reqId);
      }
      if (data.requireAppointmentSchedule) {
        setNewApptIndustryId('');
        setNewApptIndustryDetails(null);
        setNewApptCompany('');
        setNewApptInterviewer('');
        setNewApptLocation('');
        setNewApptNotes('');
      }
      if (data.industryId) {
        setNewApptIndustryId(data.industryId);
      }
      if (data.industryContact) {
        setNewApptIndustryDetails(data.industryContact);
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
      if (data.requireAppointmentSchedule) {
        setNewApptDate(data.appointmentDate || '');
        setNewApptTime(data.appointmentTime || '');
      } else {
        if (data.appointmentDate) setNewApptDate(data.appointmentDate);
        if (data.appointmentTime) setNewApptTime(data.appointmentTime);
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

  // Details editing state in drawer
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editDetails, setEditDetails] = useState({
    date: '',
    time: '',
    location: '',
    company: '',
    position: '',
    meetingType: 'In-Person',
    interviewer: '',
  });

  const handleOpenEditDetails = () => {
    if (!selectedAppointment) return;
    setEditDetails({
      date: selectedAppointment.date || '',
      time: selectedAppointment.time || '',
      location: selectedAppointment.location || '',
      company: selectedAppointment.company || '',
      position: selectedAppointment.position || '',
      meetingType: selectedAppointment.meetingType || 'In-Person',
      interviewer: selectedAppointment.interviewer || '',
    });
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async () => {
    if (!selectedAppointment) return;
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (!dbId || !onUpdateAppointment) return;
    if (!editDetails.date || !editDetails.time) {
      showToast('Date and Time are required');
      return;
    }
    try {
      setIsSavingDetails(true);
      await onUpdateAppointment(dbId, {
        date: editDetails.date,
        time: editDetails.time,
        location: editDetails.location,
        company: editDetails.company,
        position: editDetails.position,
        meetingType: editDetails.meetingType,
        interviewer: editDetails.interviewer,
      });
      setSelectedAppointment(prev => ({
        ...prev,
        date: editDetails.date,
        time: editDetails.time,
        location: editDetails.location,
        company: editDetails.company,
        position: editDetails.position,
        meetingType: editDetails.meetingType,
        interviewer: editDetails.interviewer,
      }));
      setIsEditingDetails(false);
      showToast('Appointment details updated successfully');
    } catch (err) {
      console.error('Failed to save appointment details:', err);
      showToast('Failed to save details: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingDetails(false);
    }
  };

  // View Details Modal State
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [actionMenuApptId, setActionMenuApptId] = useState(null);
  const [deleteConfirmAppt, setDeleteConfirmAppt] = useState(null);
  const [isDeletingAppt, setIsDeletingAppt] = useState(false);
  const [viewDetailsStudent, setViewDetailsStudent] = useState(null);
  const [isLoadingViewDetailsStudent, setIsLoadingViewDetailsStudent] = useState(false);

  useEffect(() => {
    if (!showViewDetailsModal || !selectedAppointment) {
      setViewDetailsStudent(null);
      return undefined;
    }

    let isCurrent = true;
    setViewDetailsStudent(null);
    setIsLoadingViewDetailsStudent(true);
    const matchedStudent = resolveStudentForAppt(selectedAppointment);
    const lookupIds = [...new Set([
      matchedStudent?._id,
      matchedStudent?.id,
      selectedAppointment.studentId,
      matchedStudent?.studentId,
    ].filter(Boolean))];

    (async () => {
      try {
        let studentRecord = null;
        for (const lookupId of lookupIds) {
          try {
            const response = await fetchStudentById(lookupId);
            const fetched = response?.data || response;
            if (fetched && (fetched._id || fetched.id || fetched.studentId)) {
              studentRecord = fetched;
              const availabilityDays = fetched.availabilityDays;
              const hasDays = availabilityDays instanceof Map
                ? availabilityDays.size > 0
                : Array.isArray(availabilityDays)
                  ? availabilityDays.length > 0
                  : availabilityDays && typeof availabilityDays === 'object'
                    ? Object.keys(availabilityDays).length > 0
                    : Boolean(availabilityDays);
              if (hasDays) break;
            }
          } catch {
            // Try the next known student identifier.
          }
        }
        if (isCurrent) setViewDetailsStudent(studentRecord || matchedStudent || null);
      } finally {
        if (isCurrent) setIsLoadingViewDetailsStudent(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [showViewDetailsModal, selectedAppointment?.studentId, selectedAppointment?.id]);

  // Outcome / Change Status Modal State
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [appointmentOutcome, setAppointmentOutcome] = useState('successful');
  const [commencementDate, setCommencementDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Filtering State
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filtered appointments list based on search only – ALL outcomes stay in Step 3
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const studentMatch = (appt.student || '').toLowerCase().includes(query);
        const companyMatch = (appt.company || '').toLowerCase().includes(query);
        const interviewerMatch = (appt.contactPerson || appt.interviewer || '').toLowerCase().includes(query);
        const industryTypeMatch = (appt.industryType || '').toLowerCase().includes(query);
        const idMatch = (appt.apptId || appt.id || '').toLowerCase().includes(query);
        return studentMatch || companyMatch || interviewerMatch || industryTypeMatch || idMatch;
      }
      return true;
    });
  }, [appointments, searchTerm]);

  // Calculate dynamic metrics for scheduled appointments
  const metrics = useMemo(() => {
    const todayYMD = formatDateToYMD(new Date());
    const weekYMDs = weekDays.map(w => w.fullDateStr);

    let todayCount = 0;
    let thisWeekCount = 0;

    filteredAppointments.forEach(appt => {
      const apptDateStr = appt.date ? appt.date.split('T')[0] : '';
      if (apptDateStr === todayYMD) todayCount++;
      if (weekYMDs.includes(apptDateStr)) thisWeekCount++;
    });

    return {
      totalCount: filteredAppointments.length,
      todayCount,
      thisWeekCount,
    };
  }, [filteredAppointments, weekDays]);

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
      case 'Confirmed':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
          sub: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-300'
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
          sub: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-300'
        };
      case 'No Show':
      case 'Student Missed Appointment':
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
      case 'Student Withdraw':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100',
          sub: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700 border-orange-300'
        };
      case 'Declined':
      case 'Industry Rejected':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100',
          sub: 'text-rose-600',
          badge: 'bg-rose-100 text-rose-700 border-rose-300'
        };
      case 'Not Suitable Site':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
          sub: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-700 border-purple-300'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
          sub: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 border-blue-300'
        };
    }
  };

  // Helper to resolve student object for an appointment
  const resolveStudentForAppt = (appt) => {
    if (!appt) return null;
    const norm = (v) => String(v || '').trim().toLowerCase();
    const apptStuId = norm(appt.studentId);
    const apptStuName = norm(appt.student);
    const apptEmail = norm(appt.email);
    const matchedByEmail = apptEmail && (students || []).find((s) => {
      const sEmail = norm(s.email || s.emailAddress);
      return sEmail === apptEmail;
    });
    if (matchedByEmail) return matchedByEmail;

    const matched = (students || []).find((s) => {
      const sDbId = norm(s.id || s._id);
      const sBizId = norm(s.studentId);
      const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`);
      return (
        (apptStuId && (sDbId === apptStuId || sBizId === apptStuId)) ||
        (apptStuName && sName === apptStuName)
      );
    });
    if (matched) return matched;
    if (appt.studentDetails) return appt.studentDetails;
    return null;
  };

  // Helper to resolve industry contact for an appointment
  const resolveIndustryForAppt = (appt) => {
    if (!appt) return null;
    if (appt.industryDetails) return appt.industryDetails;

    const norm = (v) => String(v || '').trim().toLowerCase();
    const apptCompany = norm(appt.company);
    const apptContactId = String(appt.industryContactId || '');

    // 1. Search requests contacted industries
    for (const req of requests) {
      if (Array.isArray(req.contactedIndustries)) {
        const ind = req.contactedIndustries.find(ci =>
          (apptContactId && String(ci.id || ci._id || '') === apptContactId) ||
          (apptCompany && norm(ci.organizationName) === apptCompany)
        );
        if (ind) return ind;
      }
    }

    // 2. Search student contacted industries
    const student = resolveStudentForAppt(appt);
    if (student && Array.isArray(student.contactedIndustries)) {
      const ind = student.contactedIndustries.find(ci =>
        (apptContactId && String(ci.id || ci._id || '') === apptContactId) ||
        (apptCompany && norm(ci.organizationName) === apptCompany)
      );
      if (ind) return ind;
    }

    return null;
  };

  // Helper to get contact person for an appointment
  const getContactPersonForAppointment = (appt) => {
    if (!appt) return '';
    if (appt.contactPerson && appt.contactPerson !== '—') return appt.contactPerson;
    if (appt.industryDetails?.contactPerson) return appt.industryDetails.contactPerson;

    const ind = resolveIndustryForAppt(appt);
    if (ind?.contactPerson) return ind.contactPerson;

    return appt.interviewer || '—';
  };

  // Helper to get industry type for an appointment
  const getIndustryTypeForAppointment = (appt) => {
    if (!appt) return '';
    if (appt.industryType && appt.industryType !== '—') return appt.industryType;
    if (appt.industryDetails?.industryType) return appt.industryDetails.industryType;

    const ind = resolveIndustryForAppt(appt);
    if (ind?.industryType) return ind.industryType;

    return '—';
  };

  const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
  ];

  const DAY_ALIASES = {
    monday: ['monday', 'mon', 'mo', 'm'],
    tuesday: ['tuesday', 'tue', 'tues', 'tu'],
    wednesday: ['wednesday', 'wed', 'w'],
    thursday: ['thursday', 'thu', 'thur', 'thurs', 'th'],
    friday: ['friday', 'fri', 'f'],
    saturday: ['saturday', 'sat', 'sa'],
    sunday: ['sunday', 'sun', 'su'],
  };

  const isDayAvailable = (studentOrAppt, dayKey, fallbackAppt = null) => {
    if (!studentOrAppt && !fallbackAppt) return false;

    const norm = (v) => String(v || '').trim().toLowerCase();
    const targetKey = String(dayKey || '').trim().toLowerCase();
    const aliases = DAY_ALIASES[targetKey] || [targetKey];

    // Collect all candidate sources for days from both arguments
    const candidates = [];
    const checkObj = (obj) => {
      if (!obj) return;
      if (obj.availabilityDays) candidates.push(obj.availabilityDays);
      if (obj.studentDetails?.availabilityDays) candidates.push(obj.studentDetails.availabilityDays);
      if (obj.matchedStudent?.availabilityDays) candidates.push(obj.matchedStudent.availabilityDays);
      if (obj.days) candidates.push(obj.days);
      if (obj.availableDays) candidates.push(obj.availableDays);
    };

    checkObj(studentOrAppt);
    checkObj(fallbackAppt);

    // Also look up matched student from students array
    const targetStuId = norm(
      studentOrAppt?.studentId || studentOrAppt?.id || studentOrAppt?._id ||
      fallbackAppt?.studentId || fallbackAppt?.id || fallbackAppt?._id
    );
    const targetStuName = norm(
      studentOrAppt?.name || studentOrAppt?.student || `${studentOrAppt?.firstName || ''} ${studentOrAppt?.lastName || ''}` ||
      fallbackAppt?.student || fallbackAppt?.name
    );

    if (students && students.length > 0) {
      const foundStu = students.find(s => {
        const sId = norm(s.id || s._id);
        const sBizId = norm(s.studentId);
        const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`);
        return (targetStuId && (sId === targetStuId || sBizId === targetStuId)) ||
               (targetStuName && sName === targetStuName);
      });
      if (foundStu?.availabilityDays) candidates.push(foundStu.availabilityDays);
    }

    // Also look up matched request
    if (requests && requests.length > 0) {
      const foundReq = requests.find(r => {
        const rStuId = norm(r.studentId);
        const rStuName = norm(r.student);
        return (targetStuId && rStuId === targetStuId) || (targetStuName && rStuName === targetStuName);
      });
      if (foundReq?.availabilityDays) candidates.push(foundReq.availabilityDays);
    }

    for (const days of candidates) {
      if (!days) continue;

      // If Map
      if (days instanceof Map) {
        for (const [k, v] of days.entries()) {
          const normK = String(k).trim().toLowerCase();
          if ((aliases.includes(normK) || aliases.some((a) => normK.startsWith(a))) && (v === true || v === 'true' || Boolean(v))) {
            return true;
          }
        }
      }

      // If Array: e.g. ['Mon', 'Tue', 'Wed'] or ['Monday', 'Tuesday']
      if (Array.isArray(days)) {
        const found = days.some((d) => {
          const normD = String(d).trim().toLowerCase();
          return aliases.includes(normD) || aliases.some((a) => normD.startsWith(a));
        });
        if (found) return true;
      }

      // If plain Object: e.g. { Mon: true, Tue: true } or { Monday: true }
      if (typeof days === 'object') {
        for (const [k, v] of Object.entries(days)) {
          const normK = String(k).trim().toLowerCase();
          if ((aliases.includes(normK) || aliases.some((a) => normK.startsWith(a))) && (v === true || v === 'true' || Boolean(v))) {
            return true;
          }
        }
      }

      // If string: e.g. "Mon, Tue, Wed"
      if (typeof days === 'string') {
        const lower = days.toLowerCase();
        if (aliases.some((a) => lower.includes(a))) return true;
      }
    }

    return false;
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
    const ind = selectedIndustriesForStudent.find(i => (i.id || i._id) === industryRecordId);
    if (ind) {
      setNewApptIndustryDetails(ind);
      if (ind.__reqId) setNewApptReqId(ind.__reqId);
      setNewApptCompany(ind.organizationName || '');
      setNewApptInterviewer(ind.contactPerson || '');
      setNewApptLocation([ind.address, ind.suburb, ind.state, ind.postCode, ind.country].filter(Boolean).join(', '));
      if (ind.appointmentDate) setNewApptDate(ind.appointmentDate);
      if (ind.appointmentTime) setNewApptTime(ind.appointmentTime);
    } else {
      setNewApptIndustryDetails(null);
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
    if (prefilledAppointmentData?.requireAppointmentSchedule && !newApptIndustryId) {
      showToast('Select an industry already contacted for this student');
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
        setNewApptIndustryDetails(null);
        setNewApptCompany('');
        setNewApptPosition('Internship Interview');
        setNewApptDate(new Date().toISOString().split('T')[0]);
        setNewApptTime('10:00');
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

  const handleCloseNewAppointment = () => {
    setShowNewAppointment(false);
    if (prefilledAppointmentData?.requireAppointmentSchedule) {
      onClearPrefilledData?.();
      setNewApptStudentId('');
      setNewApptReqId('');
      setNewApptIndustryId('');
      setNewApptIndustryDetails(null);
      setNewApptCompany('');
      setNewApptDate(new Date().toISOString().split('T')[0]);
      setNewApptTime('10:00');
    }
  };


  const handleOpenOutcomeModal = () => {
    if (!selectedAppointment) return;
    setAppointmentOutcome('successful');
    const defaultStart = selectedAppointment.commencementDate || selectedAppointment.date || new Date().toISOString().split('T')[0];
    setCommencementDate(defaultStart);

    // Find matching student for hours & availability
    const stuMatch = (students || []).find((s) => {
      const sId = (s.id || s._id || '').toString().trim().toLowerCase();
      const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()).toLowerCase();
      const aId = (selectedAppointment.studentId || '').trim().toLowerCase();
      const aName = (selectedAppointment.student || '').trim().toLowerCase();
      return (sId && aId && sId === aId) || (sName && aName && sName === aName);
    });

    const calcEnd = calculatePlacementEndDate(
      defaultStart,
      stuMatch?.placementHours,
      stuMatch?.availabilityDays,
      stuMatch?.availabilityFrom,
      stuMatch?.availabilityTo
    );
    setExpectedCompletionDate(calcEnd || selectedAppointment.expectedCompletionDate || '');
    setOutcomeNotes(selectedAppointment.notes || '');
    setShowOutcomeModal(true);
  };

  const handleConfirmOutcome = async () => {
    if (!selectedAppointment) return;
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (!dbId || !onUpdateAppointment) return;

    try {
      let payload = { notes: outcomeNotes || selectedAppointment.notes || '' };
      let status = 'Confirmed';
      let cancellationReason = '';
      let cancellationType = '';

      if (appointmentOutcome === 'successful') {
        if (!commencementDate) {
          showToast('Please select commencement date');
          return;
        }
        payload = {
          ...payload,
          status: 'Confirmed',
          appointmentOutcome: 'successful',
          commencementDate,
          expectedCompletionDate: expectedCompletionDate || '',
          cancellationReason: '',
          cancellationType: '',
        };
      } else if (appointmentOutcome === 'not_suitable_site') {
        status = 'Not Suitable Site';
        cancellationType = 'site';
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
      } else if (appointmentOutcome === 'industry_rejected') {
        status = 'Industry Rejected';
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
        status = 'Student Withdraw';
        cancellationType = 'withdrawn';
        cancellationReason = outcomeNotes || 'Student withdrew from placement';
        payload = {
          ...payload,
          status,
          cancellationReason,
          cancellationType,
          cancellationTypeLabel: 'Student Withdraw',
          appointmentOutcome: 'student_withdrawal',
          commencementDate: '',
          expectedCompletionDate: '',
        };
      } else if (appointmentOutcome === 'student_missed') {
        status = 'Student Missed Appointment';
        cancellationType = 'student';
        cancellationReason = outcomeNotes || 'Student missed the appointment';
        payload = {
          ...payload,
          status,
          cancellationReason,
          cancellationType,
          cancellationTypeLabel: 'Student Missed Appointment',
          appointmentOutcome: 'student_missed',
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
        commencementDate: payload.commencementDate || prev?.commencementDate || '',
        expectedCompletionDate: payload.expectedCompletionDate || prev?.expectedCompletionDate || '',
        cancellationReason,
        cancellationType,
      }));
      setShowOutcomeModal(false);
      showToast(
        appointmentOutcome === 'successful'
          ? 'Appointment confirmed! Placement moved to Step 4'
          : `Appointment status updated to ${status}`
      );
    } catch (err) {
      console.error('Failed to update appointment outcome:', err);
      showToast('Failed to save appointment outcome');
    }
  };

  // Handle Quick Direct Confirm Appointment -> Updates appointment & moves student to Step 4 Placements
  const handleConfirmAppointmentDirect = async () => {
    if (!selectedAppointment) return;
    const dbId = selectedAppointment.id || selectedAppointment._id;
    if (onUpdateAppointment && dbId) {
      try {
        const payload = {
          status: 'Confirmed',
          appointmentOutcome: 'successful',
          confirmedAt: new Date().toISOString(),
          notes: selectedAppointment.notes || 'Appointment confirmed and student placed successfully.'
        };
        await onUpdateAppointment(dbId, payload);
        setSelectedAppointment(prev => ({
          ...prev,
          status: 'Confirmed',
          appointmentOutcome: 'successful',
          cancellationReason: '',
          cancellationType: '',
        }));
        showToast('Appointment Confirmed! Placement updated in Step 4 Placements');
      } catch (err) {
        console.error('Failed to confirm appointment:', err);
        showToast('Failed to confirm appointment');
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

        {/* Dynamic Scheduled Appointments Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Scheduled</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{metrics.totalCount}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-[#0147A6] rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today's Appointments</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{metrics.todayCount}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">This Week's Appointments</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{metrics.thisWeekCount}</h3>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
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
                      <button onClick={handleCloseNewAppointment} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Student *</label>
                        <select
                          value={newApptStudentId}
                          onChange={(e) => handleSelectStudentForNewAppt(e.target.value)}
                          disabled={Boolean(prefilledAppointmentData?.requireAppointmentSchedule)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map((s) => (
                            <option key={s.id || s._id} value={s.id || s._id}>{s.name} ({s.studentId || s.id})</option>
                          ))}
                        </select>
                      </div>

                      {requests.length > 0 && !prefilledAppointmentData?.requireAppointmentSchedule && (
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
                            <option key={ind.id || ind._id} value={ind.id || ind._id}>
                              {ind.organizationName} ({ind.industryType})
                              {ind.appointmentDate ? ` — ${ind.appointmentDate}${ind.appointmentTime ? ' ' + ind.appointmentTime : ''}` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="text-[9px] text-slate-400 mt-1">
                          {newApptStudentId ? `Found ${selectedIndustriesForStudent.length} industries` : 'Select a student first'}
                        </div>
                      </div>

                        {newApptIndustryDetails && (
                          <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3 text-[10px] text-slate-600 space-y-1">
                            <p className="font-bold text-slate-900">{newApptIndustryDetails.organizationName} · {newApptIndustryDetails.industryType || 'Industry'}</p>
                            <p>Contact: {newApptIndustryDetails.contactPerson || '—'} · {newApptIndustryDetails.email || '—'} · {newApptIndustryDetails.phone || '—'}</p>
                            <p>Address: {[newApptIndustryDetails.address, newApptIndustryDetails.suburb, newApptIndustryDetails.state, newApptIndustryDetails.postCode, newApptIndustryDetails.country].filter(Boolean).join(', ') || '—'}</p>
                            {newApptIndustryDetails.notes && <p>Notes: {newApptIndustryDetails.notes}</p>}
                          </div>
                        )}

                        {!newApptIndustryDetails && <div className="grid grid-cols-2 gap-2">
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
                      </div>}

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

                      {!newApptIndustryDetails && <div className="grid grid-cols-2 gap-2">
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
                      </div>}

                      {!newApptIndustryDetails && <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location / Address</label>
                        <input
                          placeholder="e.g. 123 Care Street or Zoom Link"
                          value={newApptLocation}
                          onChange={(e) => setNewApptLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                        />
                      </div>}

                      {!prefilledAppointmentData?.requireAppointmentSchedule && <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes (Requirements & Instructions)</label>
                        <textarea
                          rows={3}
                          placeholder="Record specific requirements, instructions, or information provided by the industry regarding the appointment..."
                          value={newApptNotes}
                          onChange={(e) => setNewApptNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </div>}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleCreateNewAppointment}
                        className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-xl transition-all duration-500 cursor-pointer shadow-xs"
                      >
                        Create Appointment
                      </button>
                      <button
                        onClick={handleCloseNewAppointment}
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
            <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs ${actionMenuApptId ? 'overflow-visible' : 'overflow-hidden'}`}>
              <div className={`${actionMenuApptId ? 'overflow-visible' : 'overflow-x-auto'} min-h-[300px]`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 uppercase tracking-wider border-b border-slate-200 text-[10px] font-semibold">
                      <th className="p-4">Appointment</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Company & Position</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Type & Location</th>
                      <th className="p-4">Contact Person</th>
                      <th className="p-4">Industry Type</th>
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
                            setIsEditingDetails(false);
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
                            <span className="text-xs font-semibold text-slate-800">{getContactPersonForAppointment(appt) || '—'}</span>
                          </td>
                          <td className="p-4 max-w-[140px]">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate">
                              {getIndustryTypeForAppointment(appt) || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-right relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rowKey = appt.id || appt._id || i;
                                  setActionMenuApptId(prev => prev === rowKey ? null : rowKey);
                                }}
                                className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition border cursor-pointer ${
                                  actionMenuApptId === (appt.id || appt._id || i)
                                    ? 'bg-[#0147A6] text-white border-[#0147A6] shadow-sm'
                                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0147A6] border-slate-200 hover:border-blue-300 shadow-xs'
                                }`}
                                title="Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {actionMenuApptId === (appt.id || appt._id || i) && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuApptId(null);
                                    }}
                                  />
                                  <div className={`absolute right-0 ${
                                    i >= Math.max(1, filteredAppointments.length - 2) && filteredAppointments.length > 1
                                      ? 'bottom-full mb-1.5'
                                      : 'top-full mt-1.5'
                                  } w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAppointment(appt);
                                        setShowViewDetailsModal(true);
                                        setActionMenuApptId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0147A6] flex items-center gap-2.5 font-medium transition cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 text-[#0147A6]" />
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAppointment(appt);
                                        handleOpenOutcomeModal();
                                        setActionMenuApptId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0147A6] flex items-center gap-2.5 font-medium transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-[#0147A6]" />
                                      <span>Change Appointment Status</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmAppt(appt);
                                        setActionMenuApptId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition cursor-pointer border-t border-slate-100"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-500" />
                                      <span>Delete Appointment</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
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
                                    setIsEditingDetails(false);
                                  }}
                                  className={`p-2 rounded-xl border text-left w-full shadow-2xs cursor-pointer transition hover:scale-[1.02] ${badgeStyle.bg} ${isSelectedAppt ? 'ring-2 ring-blue-600 font-bold shadow-md' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-[11px] truncate leading-tight">{apptItem.student}</p>
                                  </div>
                                  <p className="text-[10px] truncate font-medium opacity-85 mt-0.5">{apptItem.company}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-[9px] font-bold text-blue-700">{apptItem.time}</p>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 truncate max-w-[80px]" title={getContactPersonForAppointment(apptItem)}>
                                      {getContactPersonForAppointment(apptItem) || 'Scheduled'}
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
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-[11px] font-medium text-slate-600">Scheduled Interviews ({filteredAppointments.length})</span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Showing {filteredAppointments.length} scheduled appointment{filteredAppointments.length === 1 ? '' : 's'}
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
              <span>Continue to Placements</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Drawer / Detail Panel */}
      {showDrawer && selectedAppointment && (
        <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-xl shrink-0 overflow-hidden self-start sticky top-4">
          <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-${
            selectedAppointment.status === 'Completed' ? 'emerald' :
            selectedAppointment.status === 'Declined' ? 'rose' :
            selectedAppointment.status === 'Industry Rejected' ? 'rose' :
            selectedAppointment.status === 'Not Suitable Site' ? 'amber' :
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
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full border bg-blue-900/60 text-cyan-200 border-cyan-500/40">
                    {getContactPersonForAppointment(selectedAppointment) || 'Scheduled'}
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
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-1 h-3 bg-cyan-600 rounded-full"></span>
                      <span>Appointment Info</span>
                    </span>
                    {!isEditingDetails && (
                      <button
                        onClick={handleOpenEditDetails}
                        className="flex items-center gap-1 text-blue-600 hover:underline text-[10px] font-bold"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </h5>

                  {isEditingDetails ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Date *</label>
                          <input
                            type="date"
                            value={editDetails.date}
                            onChange={e => setEditDetails(p => ({ ...p, date: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Time *</label>
                          <input
                            type="time"
                            value={editDetails.time}
                            onChange={e => setEditDetails(p => ({ ...p, time: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Location</label>
                        <input
                          type="text"
                          value={editDetails.location}
                          onChange={e => setEditDetails(p => ({ ...p, location: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Company</label>
                        <input
                          type="text"
                          value={editDetails.company}
                          onChange={e => setEditDetails(p => ({ ...p, company: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Position / Role</label>
                        <input
                          type="text"
                          value={editDetails.position}
                          onChange={e => setEditDetails(p => ({ ...p, position: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Interviewer</label>
                        <input
                          type="text"
                          value={editDetails.interviewer}
                          onChange={e => setEditDetails(p => ({ ...p, interviewer: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Meeting Type</label>
                        <select
                          value={editDetails.meetingType}
                          onChange={e => setEditDetails(p => ({ ...p, meetingType: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="In-Person">In-Person</option>
                          <option value="Video">Video</option>
                          <option value="Phone">Phone</option>
                        </select>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={handleSaveDetails}
                          disabled={isSavingDetails}
                          className="flex-1 py-2 bg-[#0147A6] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                        >
                          {isSavingDetails
                            ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>
                            : <><Check className="w-3 h-3" /><span>Save</span></>}
                        </button>
                        <button
                          onClick={() => setIsEditingDetails(false)}
                          disabled={isSavingDetails}
                          className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* ── Student Availability ─────────────────────────────── */}
                {(() => {
                  const stuMatch = resolveStudentForAppt(selectedAppointment);
                  if (!stuMatch) return null;
                  const availableDaysStr = DAYS_OF_WEEK
                    .filter(d => isDayAvailable(stuMatch, d.key))
                    .map(d => d.short)
                    .join(', ');
                  return (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-2">
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Student Availability</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[9px] text-slate-400">Hours</p>
                          <p className="text-xs font-bold text-slate-800">{stuMatch.placementHours || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400">Days</p>
                          <p className="text-xs font-bold text-slate-800 truncate" title={availableDaysStr || '—'}>
                            {availableDaysStr || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400">Time</p>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {(stuMatch.availabilityFrom || '09:00 AM') + ' - ' + (stuMatch.availabilityTo || '05:00 PM')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Outcome Result Card (shown after outcome is saved) ─── */}
                {selectedAppointment.appointmentOutcome && (
                  <div className={`rounded-xl border p-3 space-y-2
                    ${selectedAppointment.appointmentOutcome === 'successful'
                      ? 'bg-emerald-50 border-emerald-200'
                      : selectedAppointment.appointmentOutcome === 'industry_rejected'
                        ? 'bg-rose-50 border-rose-200'
                        : selectedAppointment.appointmentOutcome === 'student_withdrawal'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Outcome</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full
                        ${selectedAppointment.appointmentOutcome === 'successful'
                          ? 'bg-emerald-100 text-emerald-700'
                          : selectedAppointment.appointmentOutcome === 'industry_rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : selectedAppointment.appointmentOutcome === 'student_withdrawal'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {selectedAppointment.appointmentOutcome === 'successful' ? 'Successful'
                          : selectedAppointment.appointmentOutcome === 'industry_rejected' ? 'Industry Rejected'
                          : selectedAppointment.appointmentOutcome === 'student_withdrawal' ? 'Student Withdrew'
                          : 'Not Suitable Site'}
                      </span>
                    </div>
                    {selectedAppointment.appointmentOutcome === 'successful' && (
                      <div className="space-y-1 pt-1 border-t border-emerald-200">
                        {selectedAppointment.commencementDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-700 font-medium">Commencement</span>
                            <span className="text-[10px] font-bold text-emerald-900">{selectedAppointment.commencementDate}</span>
                          </div>
                        )}
                        {selectedAppointment.expectedCompletionDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-700 font-medium">Exp. Completion</span>
                            <span className="text-[10px] font-bold text-emerald-900">{selectedAppointment.expectedCompletionDate}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedAppointment.cancellationTypeLabel && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500 font-medium">Type</span>
                        <span className="text-[10px] font-bold text-slate-700">{selectedAppointment.cancellationTypeLabel}</span>
                      </div>
                    )}
                    {selectedAppointment.notes && (
                      <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                        {selectedAppointment.notes}
                      </p>
                    )}
                  </div>
                )}

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
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0147A6]" />
                    <span>Appointment Actions</span>
                  </h5>

                  {/* View Details Button */}
                  <button
                    onClick={() => setShowViewDetailsModal(true)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#0147A6] font-bold rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Full Details</span>
                  </button>

                  {/* Change Appointment Status Button */}
                  <button
                    onClick={handleOpenOutcomeModal}
                    className="w-full py-2.5 bg-[#0147A6] hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Change Appointment Status</span>
                  </button>

                  {/* Reschedule Button */}
                  <button
                    onClick={() => {
                      setIsRescheduling(!isRescheduling);
                      setRescheduleDate(selectedAppointment.date || '');
                      setRescheduleTime(selectedAppointment.time || '');
                    }}
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRescheduling ? 'Cancel Reschedule' : 'Reschedule Appointment'}</span>
                  </button>
                </div>
              </>
            )}

            {drawerTab === 'Details' && (
              <div className="space-y-3 text-xs">

                {/* ── Read-only identity fields ─────────────────────────── */}
                <div className="space-y-1.5">
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
                  {selectedAppointment.appointmentOutcome && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Outcome</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAppointment.appointmentOutcome === 'successful' ? 'Successful'
                          : selectedAppointment.appointmentOutcome === 'industry_rejected' ? 'Industry Rejected'
                          : selectedAppointment.appointmentOutcome === 'student_withdrawal' ? 'Student Withdrew'
                          : 'Not Suitable Site'}
                      </span>
                    </div>
                  )}
                  {selectedAppointment.commencementDate && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Commencement</span>
                      <span className="font-semibold text-emerald-700">{selectedAppointment.commencementDate}</span>
                    </div>
                  )}
                  {selectedAppointment.expectedCompletionDate && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Exp. Completion</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.expectedCompletionDate}</span>
                    </div>
                  )}
                  {selectedAppointment.cancellationReason && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Cancel Reason</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[150px] break-words">{selectedAppointment.cancellationReason}</span>
                    </div>
                  )}
                </div>

                {/* ── Editable section ─────────────────────────────────── */}
                {isEditingDetails ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Edit Details</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Date *</label>
                        <input
                          type="date"
                          value={editDetails.date}
                          onChange={e => setEditDetails(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Time *</label>
                        <input
                          type="time"
                          value={editDetails.time}
                          onChange={e => setEditDetails(p => ({ ...p, time: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Company / Organisation</label>
                      <input
                        type="text"
                        value={editDetails.company}
                        onChange={e => setEditDetails(p => ({ ...p, company: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Position / Role</label>
                      <input
                        type="text"
                        value={editDetails.position}
                        onChange={e => setEditDetails(p => ({ ...p, position: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Interviewer / Contact</label>
                      <input
                        type="text"
                        value={editDetails.interviewer}
                        onChange={e => setEditDetails(p => ({ ...p, interviewer: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Meeting Type</label>
                      <select
                        value={editDetails.meetingType}
                        onChange={e => setEditDetails(p => ({ ...p, meetingType: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="In-Person">In-Person</option>
                        <option value="Video">Video</option>
                        <option value="Phone">Phone</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Location / Address</label>
                      <input
                        type="text"
                        value={editDetails.location}
                        onChange={e => setEditDetails(p => ({ ...p, location: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetails}
                        className="flex-1 py-2 bg-[#0147A6] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                      >
                        {isSavingDetails
                          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>
                          : <><Check className="w-3 h-3" /><span>Save Changes</span></>}
                      </button>
                      <button
                        onClick={() => setIsEditingDetails(false)}
                        disabled={isSavingDetails}
                        className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Details</p>
                      <button
                        onClick={handleOpenEditDetails}
                        className="text-blue-600 text-xs font-bold flex items-center space-x-1 hover:underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Date</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.date || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Time</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.time || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Company</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[150px] break-words">{selectedAppointment.company || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Position</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.position || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Meeting Type</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.meetingType || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Interviewer</span>
                      <span className="font-semibold text-slate-800">{selectedAppointment.interviewer || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Location</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[150px] break-words">{selectedAppointment.location || '—'}</span>
                    </div>
                  </div>
                )}


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

      {/* ─── VIEW DETAILS MODAL ──────────────────────────────────────────── */}
      {showViewDetailsModal && selectedAppointment && (() => {
        const ind = resolveIndustryForAppt(selectedAppointment);
        const stu = viewDetailsStudent || resolveStudentForAppt(selectedAppointment);
        const contactPerson = getContactPersonForAppointment(selectedAppointment);
        const industryType = getIndustryTypeForAppointment(selectedAppointment);
        const availableDays = DAYS_OF_WEEK.filter(({ key }) =>
          isDayAvailable(stu, key, selectedAppointment)
        );

        const addressParts = [
          ind?.address,
          ind?.suburb,
          ind?.state,
          ind?.postCode,
        ].filter(Boolean);
        const fullAddress = addressParts.length ? addressParts.join(', ') : null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[#0147A6]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">View Details</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {selectedAppointment.student} · {selectedAppointment.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewDetailsModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto px-6 py-5 space-y-6">

                {/* ── Industry Details ─────────────────────────────────── */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Building2 className="w-3.5 h-3.5 text-[#0147A6]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Industry Details</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                    <div className="flex items-start px-4 py-3 gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Name</span>
                      <span className="text-xs text-slate-800 font-medium">{selectedAppointment.company || '—'}</span>
                    </div>
                    <div className="flex items-start px-4 py-3 gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Type</span>
                      <span className="text-xs text-slate-700">{industryType || '—'}</span>
                    </div>
                    <div className="flex items-start px-4 py-3 gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Contact Person</span>
                      <span className="text-xs text-slate-700">{contactPerson || '—'}</span>
                    </div>
                    {ind?.phone && (
                      <div className="flex items-start px-4 py-3 gap-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Phone</span>
                        <span className="text-xs text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {ind.phone}
                        </span>
                      </div>
                    )}
                    {ind?.email && (
                      <div className="flex items-start px-4 py-3 gap-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Email</span>
                        <span className="text-xs text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {ind.email}
                        </span>
                      </div>
                    )}
                    {fullAddress && (
                      <div className="flex items-start px-4 py-3 gap-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Address</span>
                        <span className="text-xs text-slate-700 flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" /> {fullAddress}
                        </span>
                      </div>
                    )}
                    {ind?.notes && (
                      <div className="flex items-start px-4 py-3 gap-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Notes</span>
                        <span className="text-xs text-slate-600 leading-relaxed">{ind.notes}</span>
                      </div>
                    )}
                    <div className="flex items-start px-4 py-3 gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-28 shrink-0 pt-0.5">Appt. Schedule</span>
                      <span className="text-xs text-slate-700 flex items-center gap-1.5">
                        <CalendarClock className="w-3 h-3 text-slate-400" />
                        {selectedAppointment.date
                          ? new Date(selectedAppointment.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                        {selectedAppointment.time ? ` at ${selectedAppointment.time}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Student Availability ─────────────────────────────── */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-3.5 h-3.5 text-[#0147A6]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Availability</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-20 shrink-0">Days</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {availableDays.length
                          ? availableDays.map(({ short }) => short).join(', ')
                          : isLoadingViewDetailsStudent ? 'Loading availability...'
                          : 'No availability days recorded'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-20 shrink-0">Hours</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">
                          {(stu?.availabilityFrom || selectedAppointment?.studentDetails?.availabilityFrom || '09:00 AM')} – {(stu?.availabilityTo || selectedAppointment?.studentDetails?.availabilityTo || '05:00 PM')}
                        </span>
                        {(stu?.placementHours ?? selectedAppointment?.placementHours ?? selectedAppointment?.studentDetails?.placementHours) ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0147A6] border border-blue-200">
                            {(stu?.placementHours ?? selectedAppointment?.placementHours ?? selectedAppointment?.studentDetails?.placementHours)} Placement Hours
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase w-20 shrink-0">Days</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS_OF_WEEK.map(({ key, short, label }) => {
                          const available = isDayAvailable(stu, key, selectedAppointment);
                          return (
                            <span
                              key={key}
                              title={label}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                                available
                                  ? 'bg-[#0147A6] text-white border-[#0147A6] shadow-xs'
                                  : 'bg-white text-slate-300 border-slate-200'
                              }`}
                            >
                              {available && <Check className="w-3 h-3 text-white" />}
                              <span>{short}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setShowViewDetailsModal(false)}
                  className="px-5 py-2 bg-[#0147A6] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── APPOINTMENT OUTCOME MODAL ───────────────────────────────────── */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#0147A6]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Appointment Status</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {selectedAppointment?.student} · {selectedAppointment?.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Outcome type selector — card grid */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Outcome *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: 'successful',
                      label: 'Appointment Successful',
                      sub: 'Student is placed & commences',
                      icon: <CheckCircle2 className="w-4 h-4" />,
                      active: 'border-emerald-500 bg-emerald-50 text-emerald-800',
                      icon_c: 'text-emerald-600',
                      idle: 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    },
                    {
                      value: 'industry_rejected',
                      label: 'Industry Rejected',
                      sub: 'Employer declined the student',
                      icon: <Building2 className="w-4 h-4" />,
                      active: 'border-rose-500 bg-rose-50 text-rose-800',
                      icon_c: 'text-rose-600',
                      idle: 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                    },
                    {
                      value: 'student_withdrawal',
                      label: 'Student Withdraw',
                      sub: 'Student withdrew / opted out',
                      icon: <UserX className="w-4 h-4" />,
                      active: 'border-orange-500 bg-orange-50 text-orange-800',
                      icon_c: 'text-orange-600',
                      idle: 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                    },
                    {
                      value: 'student_missed',
                      label: 'Student Missed Appointment',
                      sub: 'Student did not attend',
                      icon: <AlertCircle className="w-4 h-4" />,
                      active: 'border-amber-500 bg-amber-50 text-amber-800',
                      icon_c: 'text-amber-600',
                      idle: 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAppointmentOutcome(opt.value)}
                      className={`text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer
                        ${appointmentOutcome === opt.value ? opt.active : opt.idle}`}
                    >
                      <div className={`mb-1 ${appointmentOutcome === opt.value ? opt.icon_c : 'text-slate-400'}`}>
                        {opt.icon}
                      </div>
                      <p className="text-[11px] font-bold leading-tight">{opt.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Commencement / Completion dates — only for successful */}
              {appointmentOutcome === 'successful' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Placement Dates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Commencement Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={commencementDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setCommencementDate(newDate);
                          // Auto-recalculate end date when commencement date changes
                          if (newDate && selectedAppointment && appointmentOutcome === 'successful') {
                            const stuMatch = (students || []).find((s) => {
                              const sId = (s.id || s._id || '').toString().trim().toLowerCase();
                              const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()).toLowerCase();
                              const aId = (selectedAppointment.studentId || '').trim().toLowerCase();
                              const aName = (selectedAppointment.student || '').trim().toLowerCase();
                              return (sId && aId && sId === aId) || (sName && aName && sName === aName);
                            });
                            if (stuMatch) {
                              const calcEnd = calculatePlacementEndDate(
                                newDate,
                                stuMatch.placementHours,
                                stuMatch.availabilityDays,
                                stuMatch.availabilityFrom,
                                stuMatch.availabilityTo
                              );
                              if (calcEnd) setExpectedCompletionDate(calcEnd);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-700 mb-1">
                        Expected Completion <span className="text-emerald-500 font-normal">(auto-calculated)</span>
                      </label>
                      <input
                        type="date"
                        value={expectedCompletionDate}
                        onChange={(e) => setExpectedCompletionDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      />
                      {/* Calculation summary hint */}
                      {expectedCompletionDate && commencementDate && (() => {
                        const stuMatch = (students || []).find((s) => {
                          const sId = (s.id || s._id || '').toString().trim().toLowerCase();
                          const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()).toLowerCase();
                          const aId = (selectedAppointment?.studentId || '').trim().toLowerCase();
                          const aName = (selectedAppointment?.student || '').trim().toLowerCase();
                          return (sId && aId && sId === aId) || (sName && aName && sName === aName);
                        });
                        const summary = stuMatch ? getCalculationSummary(
                          commencementDate,
                          stuMatch.placementHours,
                          stuMatch.availabilityDays,
                          stuMatch.availabilityFrom,
                          stuMatch.availabilityTo
                        ) : null;
                        return summary ? (
                          <p className="mt-1 text-[9px] text-emerald-600 flex items-center gap-1">
                            <span>🧮</span> {summary}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Info banner for non-successful outcomes */}
              {appointmentOutcome !== 'successful' && (
                <div className={`rounded-xl p-3 border text-[10px] font-medium flex items-start space-x-2
                  ${appointmentOutcome === 'industry_rejected' ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : appointmentOutcome === 'student_withdrawal' ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'}`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {appointmentOutcome === 'industry_rejected' && 'Appointment will be marked as Industry Rejected. Student returns to Step 1 – Students.'}
                    {appointmentOutcome === 'student_withdrawal' && 'Appointment will be marked as Withdrawn. Student returns to Step 1 – Students.'}
                    {appointmentOutcome === 'student_missed' && 'Appointment will be marked as Student Missed Appointment. Student returns to Step 1 – Students.'}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {appointmentOutcome === 'successful' ? 'Placement Notes' : 'Reason / Notes'}
                </label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder={
                    appointmentOutcome === 'successful'
                      ? 'Add placement summary, supervisor details, or additional start info...'
                      : appointmentOutcome === 'industry_rejected'
                        ? 'Why did the industry reject the student? (e.g. over-qualified, position filled)'
                        : appointmentOutcome === 'student_withdrawal'
                          ? 'Why did the student withdraw? (e.g. personal reasons, found other opportunity)'
                          : 'Why did the student miss the appointment? (e.g. no-show, uncontactable)'
                  }
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOutcome}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-sm flex items-center space-x-2
                  ${appointmentOutcome === 'successful'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : appointmentOutcome === 'industry_rejected'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : appointmentOutcome === 'student_withdrawal'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                  }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {appointmentOutcome === 'successful' ? 'Confirm Placement' : 'Save Outcome'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmAppt && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Appointment</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Delete the appointment for <span className="font-semibold text-slate-800">{deleteConfirmAppt.student}</span>
                  {deleteConfirmAppt.company ? <> at <span className="font-semibold text-slate-800">{deleteConfirmAppt.company}</span></> : ''}?
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAppt(null)}
                disabled={isDeletingAppt}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAppt}
                onClick={async () => {
                  const targetId = deleteConfirmAppt.id || deleteConfirmAppt._id || deleteConfirmAppt.apptId;
                  if (!targetId || !onDeleteAppointment) {
                    showToast('Could not delete appointment: missing appointment ID');
                    return;
                  }
                  setIsDeletingAppt(true);
                  try {
                    await onDeleteAppointment(targetId);
                    if (selectedAppointment && [selectedAppointment.id, selectedAppointment._id, selectedAppointment.apptId].some((id) => String(id) === String(targetId))) {
                      setSelectedAppointment(null);
                      setShowDrawer(false);
                    }
                    setDeleteConfirmAppt(null);
                    showToast('Appointment deleted successfully');
                  } catch (error) {
                    console.error('Failed to delete appointment:', error);
                    showToast('Failed to delete appointment');
                  } finally {
                    setIsDeletingAppt(false);
                  }
                }}
                className="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingAppt ? 'Deleting...' : 'Delete Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
