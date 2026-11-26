import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Download, Columns, Users, UserCheck, Moon, X, Building2, Calendar, FileText, RotateCcw, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { defaultStudents, emptyFilters, parseDate, btnSecondary } from './studentData';
import { downloadStudentsCSV } from './csvUtils';
import { fetchStudents, deleteStudent, snoozeStudent } from '../../api/studentsApi';
import { PLACEMENT_DATA_CHANGED } from '../../api/placementEvents';
import { fetchUsers } from '../../api/userApi';
import {
  fetchWorkflows,
  fetchWorkflowById,
  createWorkflow,
  createInternshipRequest,
  updateInternshipRequest,
  addStudentsToWorkflow,
} from '../../api/workflowApi';
import StudentFilters from './StudentFilters';
import StudentTableHeader from './StudentTableHeader';
import StudentTableRow from './StudentTableRow';
import StudentPagination from './StudentPagination';
import StudentColumnsMenu from './StudentColumnsMenu';
import AssignCoordinatorModal from './AssignCoordinatorModal';
import EditAssignedIndustryModal from './EditAssignedIndustryModal';
import StudentContactedIndustriesModal from './StudentContactedIndustriesModal';


const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

const norm = (v) => String(v || '').trim().toLowerCase();
const MY_PROGRESS_PLACEMENT_STATUS_OPTIONS = [
  'In Progress',
  'Industry Contacted',
  'Appointment Scheduled',
  'Appointment Successful',
  'Waiting to Join',
  'Placement Started',
  'Student Withdraw',
  'Student Missed Appointment',
  'Industry Rejected',
  'Not Suitable Site',
  'Placement Completed',
];

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
  placementStatus: s.canonicalStatus || s.canonicalPlacementStatus || s.placementStatus || 'Awaiting',
  canonicalStatus: s.canonicalStatus || s.canonicalPlacementStatus || s.placementStatus || 'Awaiting',
  placementHours: s.placementHours ?? null,
  contactedIndustries: Array.isArray(s.contactedIndustries) ? s.contactedIndustries : [],
  source: s.source || s.studentSource || '',
  created: s.created || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
  createdAt: s.createdAt || null,
  updatedAt: s.updatedAt || null,
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
  snoozed: s.snoozed === true,
  snoozedAt: s.snoozedAt || null,
  snoozeUntil: s.snoozeUntil || null,
  snoozeReason: s.snoozeReason || '',
  internshipPriority: s.internshipPriority || '',
});

/**
 * Build a map of student identifiers → priority from backend workflow.requests.
 */
function buildWorkflowRequestMap(workflowRequests) {
  const map = {};

  if (Array.isArray(workflowRequests)) {
    workflowRequests.forEach((req) => {
      const priority = req.priority || 'Normal';
      if (req.studentId) { map[req.studentId] = priority; map[norm(req.studentId)] = priority; }
      if (req.student)   { map[req.student] = priority;   map[norm(req.student)] = priority; }
      if (req.id)        map[req.id] = priority;
      if (req._id)       map[String(req._id)] = priority;
    });
  }

  return map;
}

export default function MyStudentsTable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [editIndustryStudent, setEditIndustryStudent] = useState(null);
  const [contactedIndustriesStudent, setContactedIndustriesStudent] = useState(null);
  const authUser = useSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === 'Administrator';
  const isCoordinator = authUser?.role === 'Coordinator';
  const isRtoManager = authUser?.role === 'RTO Manager' || authUser?.role === 'RTO';

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
  const [assignTarget, setAssignTarget] = useState(null);

  // Dual-source placement request map — built from localStorage + backend workflow.requests
  // Shape: { [studentId | studentName | dbId]: priorityString }
  const [workflowRequestMap, setWorkflowRequestMap] = useState({});
  // Also track the active workflowId and its requests so we can update by reqId
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);
  const [activeWorkflowRequests, setActiveWorkflowRequests] = useState([]);

  // Generate / Change Placement modal state
  const [genTargetStudent, setGenTargetStudent] = useState(null);
  const [isChangingPlacement, setIsChangingPlacement] = useState(false); // true = Change Placement mode
  const [genPriority, setGenPriority] = useState('Normal'); // 'Normal' | 'Urgent' | 'Snooze'
  const [snoozeDuration, setSnoozeDuration] = useState('7_days');
  const [snoozeReason, setSnoozeReason] = useState('');
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  // ─── Student Tabs: All (Active) / Inactive / Snooze ───────────────────
  const [activeMainTab, setActiveMainTab] = useState('all'); // 'all' | 'inactive' | 'snooze'

  // Snoozed students — persisted in localStorage
  const [snoozedStudentIds, setSnoozedStudentIds] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_snoozed_students');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ─── Load workflow data (for dual-source detection) ──────────────────────
  const loadWorkflowData = useCallback(async () => {
    try {
      const wfListRes = await fetchWorkflows();
      const wfList = wfListRes?.data ?? wfListRes ?? [];
      const wfArray = Array.isArray(wfList) ? wfList : [];
      if (wfArray.length === 0) {
        // No workflow yet — just seed from localStorage
        setWorkflowRequestMap(buildWorkflowRequestMap([]));
        return;
      }
      const wfId = wfArray[0]?.id || wfArray[0]?._id;
      if (!wfId) {
        setWorkflowRequestMap(buildWorkflowRequestMap([]));
        return;
      }
      const wfRes = await fetchWorkflowById(wfId);
      const wf = wfRes?.data ?? wfRes;
      const requests = wf?.requests ?? [];
      setActiveWorkflowId(wfId);
      setActiveWorkflowRequests(requests);
      setWorkflowRequestMap(buildWorkflowRequestMap(requests));
    } catch (_) {
      // Fall back to localStorage only
      setWorkflowRequestMap(buildWorkflowRequestMap([]));
    }
  }, []);

  // ─── Submit: Generate new placement request ───────────────────────────────
  const handleGeneratePlacementRequestSubmit = async () => {
    if (!genTargetStudent) return;

    const stuId = genTargetStudent.id || genTargetStudent.dbId || genTargetStudent.studentId;
    const targetDbId = genTargetStudent.dbId || genTargetStudent.id;
    const stuName = genTargetStudent.name;

    // ── Snooze path ──
    if (genPriority === 'Snooze') {
      const durationLabels = {
        '7_days': '7 Days',
        '14_days': '14 Days',
        '30_days': '30 Days',
        'indefinite': 'Indefinite',
      };
      const durationDays = {
        '7_days': 7,
        '14_days': 14,
        '30_days': 30,
        'indefinite': null,
      }[snoozeDuration] || null;
      const snoozeUntil = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const snoozedAt = new Date().toISOString();

      const newEntry = {
        id: stuId,
        studentId: genTargetStudent.studentId || genTargetStudent.id || stuId,
        name: stuName,
        email: genTargetStudent.email,
        rto: genTargetStudent.rto || 'RTO',
        snoozedAt,
        snoozeUntil,
        duration: snoozeDuration,
        durationLabel: durationLabels[snoozeDuration] || '7 Days',
        reason: snoozeReason || 'Deferred from placement workflow',
        rawStudent: genTargetStudent,
      };

      try {
        const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
        [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)]
          .filter(Boolean)
          .forEach((k) => { existing[k] = newEntry; });
        localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
        setSnoozedStudentIds(existing);
      } catch (_) {}

      // Persist to backend database
      if (targetDbId) {
        try {
          await snoozeStudent(targetDbId, {
            snoozed: true,
            snoozedAt,
            snoozeUntil,
            snoozeReason: snoozeReason || 'Deferred from placement workflow',
            internshipPriority: 'Snooze',
          });
          await updateStudent(targetDbId, { internshipPriority: 'Snooze' });
        } catch (e) {
          console.error('Failed to persist snooze to DB:', e);
        }
      }

      // Update local workflow map
      const updatedMap = { ...workflowRequestMap };
      [stuId, genTargetStudent.studentId, targetDbId, norm(stuName)].filter(Boolean).forEach(k => {
        updatedMap[k] = 'Snooze';
      });
      setWorkflowRequestMap(updatedMap);

      // Update student in local state: placementStatus -> 'N/A'
      setStudents((prev) => prev.map((s) =>
        (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
          ? { ...s, snoozed: true, internshipPriority: 'Snooze', placementStatus: 'N/A' }
          : s
      ));

      toast.info(`Student ${stuName} snoozed for ${durationLabels[snoozeDuration] || '7 Days'}`);
      setGenTargetStudent(null);
      setActiveMainTab('snooze');
      setCurrentPage(1);
      return;
    }

    // ── Inactive path ──
    if (genPriority === 'Inactive') {
      setIsSubmittingGen(true);
      try {
        if (targetDbId) {
          await updateStudent(targetDbId, { status: 'Inactive', internshipPriority: 'Inactive' });
          if (isStudentSnoozed(genTargetStudent)) {
            await snoozeStudent(targetDbId, { snoozed: false, snoozedAt: null, snoozeUntil: null, snoozeReason: '' });
          }
        }

        // Clear snooze in localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
          [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)]
            .filter(Boolean)
            .forEach((k) => delete existing[k]);
          localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
          setSnoozedStudentIds(existing);
        } catch (_) {}

        // Update local workflow map
        const updatedMap = { ...workflowRequestMap };
        [stuId, genTargetStudent.studentId, targetDbId, norm(stuName)].filter(Boolean).forEach(k => {
          updatedMap[k] = 'Inactive';
        });
        setWorkflowRequestMap(updatedMap);

        // Update student in local state: status -> 'Inactive', placementStatus -> 'N/A'
        setStudents((prev) => prev.map((s) =>
          (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
            ? { ...s, status: 'Inactive', snoozed: false, internshipPriority: 'Inactive', placementStatus: 'N/A' }
            : s
        ));

        toast.info(`Student ${stuName} marked as Inactive`);
        setGenTargetStudent(null);
        setActiveMainTab('inactive');
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to mark student inactive:', err);
        toast.error(err?.response?.data?.message || 'Failed to update student');
      } finally {
        setIsSubmittingGen(false);
      }
      return;
    }

    // ── Normal / Urgent path — generate request and navigate to Step 2 ──
    try {
      setIsSubmittingGen(true);

      let wfId = activeWorkflowId;
      let wfRequests = [...activeWorkflowRequests];

      if (!wfId) {
        const wfListRes = await fetchWorkflows();
        const wfList = wfListRes?.data ?? wfListRes ?? [];
        const wfArray = Array.isArray(wfList) ? wfList : [];
        wfId = wfArray[0]?.id || wfArray[0]?._id;

        if (!wfId) {
          const createdWf = await createWorkflow({
            name: 'Placement Workflow',
            status: 'Active',
            currentStep: 2,
          });
          wfId = createdWf.data?.id || createdWf.data?._id;
        }
      }

      const resolvedStuId = genTargetStudent.studentId || genTargetStudent.id || genTargetStudent.dbId || String(genTargetStudent._id || '');

      if (targetDbId) {
        try { await addStudentsToWorkflow(wfId, [targetDbId]); } catch (_) {}
        await updateStudent(targetDbId, { status: 'Active', internshipPriority: genPriority, placementStatus: 'In Progress' });
        if (isStudentSnoozed(genTargetStudent)) {
          await snoozeStudent(targetDbId, { snoozed: false, snoozedAt: null, snoozeUntil: null, snoozeReason: '', internshipPriority: genPriority, placementStatus: 'In Progress' });
        }
      }

      // Clear snooze in localStorage and state
      const keysToDelete = [
        genTargetStudent.studentId,
        genTargetStudent.id,
        genTargetStudent.dbId,
        stuName,
        norm(stuName),
        norm(genTargetStudent.studentId),
        norm(genTargetStudent.id),
        norm(genTargetStudent.dbId),
      ].filter(Boolean);

      try {
        const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
        keysToDelete.forEach((k) => delete existing[k]);
        localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
        setSnoozedStudentIds(existing);
      } catch (_) {}

      const requestData = {
        title: `${genTargetStudent.course || 'Internship'} Placement`,
        student: stuName,
        studentId: resolvedStuId || `STU-${Date.now().toString().slice(-4)}`,
        company: 'Pending Assignment',
        rto: genTargetStudent.rto || 'TBD',
        priority: genPriority,
        status: 'New',
        returnedToStep1: false,
      };
      const created = await createInternshipRequest(wfId, requestData);

      // Update in-memory workflow request map immediately
      setActiveWorkflowId(wfId);
      const newReq = created?.data ?? created ?? requestData;
      const newRequests = [...wfRequests.filter(r => norm(r.studentId) !== norm(resolvedStuId) && norm(r.student) !== norm(stuName)), newReq];
      setActiveWorkflowRequests(newRequests);
      setWorkflowRequestMap(buildWorkflowRequestMap(newRequests));

      // Update local student: placementStatus -> 'In Progress'
      setStudents(prev => prev.map(s =>
        (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
          ? { ...s, status: 'Active', snoozed: false, internshipPriority: genPriority, placementStatus: 'In Progress' }
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

  // ─── Submit: Change existing placement priority ───────────────────────────
  const handleChangePlacementSubmit = async () => {
    if (!genTargetStudent) return;

    const stuName = genTargetStudent.name;
    const targetDbId = genTargetStudent.dbId || genTargetStudent.id;
    const stuId = genTargetStudent.studentId || genTargetStudent.id || genTargetStudent.dbId || '';

    // ── Snooze path ──
    if (genPriority === 'Snooze') {
      const durationLabels = { '7_days': '7 Days', '14_days': '14 Days', '30_days': '30 Days', 'indefinite': 'Indefinite' };
      const durationDays = { '7_days': 7, '14_days': 14, '30_days': 30, 'indefinite': null }[snoozeDuration] || null;
      const snoozeUntil = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const snoozedAt = new Date().toISOString();

      const newEntry = {
        id: stuId,
        studentId: genTargetStudent.studentId || genTargetStudent.id || stuId,
        name: stuName,
        email: genTargetStudent.email,
        rto: genTargetStudent.rto || 'RTO',
        snoozedAt,
        snoozeUntil,
        duration: snoozeDuration,
        durationLabel: durationLabels[snoozeDuration] || '7 Days',
        reason: snoozeReason || 'Deferred from placement workflow',
        rawStudent: genTargetStudent,
      };
      try {
        const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
        [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)]
          .filter(Boolean)
          .forEach((k) => { existing[k] = newEntry; });
        localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
        setSnoozedStudentIds(existing);
      } catch (_) {}

      // Persist to backend database
      if (targetDbId) {
        try {
          await snoozeStudent(targetDbId, {
            snoozed: true,
            snoozedAt,
            snoozeUntil,
            snoozeReason: snoozeReason || 'Deferred from placement workflow',
            internshipPriority: 'Snooze',
          });
          await updateStudent(targetDbId, { internshipPriority: 'Snooze' });
        } catch (e) {
          console.error('Failed to persist snooze to DB:', e);
        }
      }

      // If active workflow has this student's request, update it to Snooze & returnedToStep1
      if (activeWorkflowId) {
        const stuKeys = [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)].filter(Boolean).map(norm);
        const matchingReq = (activeWorkflowRequests || []).find((r) =>
          (r.studentId && stuKeys.includes(norm(r.studentId))) ||
          (r.student && stuKeys.includes(norm(r.student)))
        );
        if (matchingReq) {
          const reqId = String(matchingReq._id || matchingReq.reqId || matchingReq.id || '');
          if (reqId) {
            updateInternshipRequest(activeWorkflowId, reqId, { priority: 'Snooze', returnedToStep1: true, status: 'On Hold' }).catch(() => {});
          }
        }
      }

      // Update local workflow map
      const updatedMap = { ...workflowRequestMap };
      [stuId, genTargetStudent.studentId, targetDbId, norm(stuName)].filter(Boolean).forEach(k => {
        updatedMap[k] = 'Snooze';
      });
      setWorkflowRequestMap(updatedMap);

      // Update student in local state: placementStatus -> 'N/A'
      setStudents((prev) => prev.map((s) =>
        (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
          ? { ...s, snoozed: true, internshipPriority: 'Snooze', placementStatus: 'N/A' }
          : s
      ));

      toast.info(`Student ${stuName} snoozed for ${durationLabels[snoozeDuration] || '7 Days'}`);
      setGenTargetStudent(null);
      setActiveMainTab('snooze');
      setCurrentPage(1);
      return;
    }

    // ── Inactive path ──
    if (genPriority === 'Inactive') {
      setIsSubmittingGen(true);
      try {
        if (targetDbId) {
          await updateStudent(targetDbId, { status: 'Inactive', internshipPriority: 'Inactive' });
          if (isStudentSnoozed(genTargetStudent)) {
            await snoozeStudent(targetDbId, { snoozed: false, snoozedAt: null, snoozeUntil: null, snoozeReason: '' });
          }
        }

        // Clear snooze in localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
          [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)]
            .filter(Boolean)
            .forEach((k) => delete existing[k]);
          localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
          setSnoozedStudentIds(existing);
        } catch (_) {}

        // If active workflow has this student's request, update it to Inactive & returnedToStep1
        if (activeWorkflowId) {
          const stuKeys = [genTargetStudent.studentId, genTargetStudent.id, genTargetStudent.dbId, norm(stuName)].filter(Boolean).map(norm);
          const matchingReq = (activeWorkflowRequests || []).find((r) =>
            (r.studentId && stuKeys.includes(norm(r.studentId))) ||
            (r.student && stuKeys.includes(norm(r.student)))
          );
          if (matchingReq) {
            const reqId = String(matchingReq._id || matchingReq.reqId || matchingReq.id || '');
            if (reqId) {
              await updateInternshipRequest(activeWorkflowId, reqId, { priority: 'Inactive', returnedToStep1: true, status: 'On Hold' });
            }
          }
        }

        // Update local workflow map
        const updatedMap = { ...workflowRequestMap };
        [stuId, genTargetStudent.studentId, targetDbId, norm(stuName)].filter(Boolean).forEach(k => {
          updatedMap[k] = 'Inactive';
        });
        setWorkflowRequestMap(updatedMap);

        // Update student in local state: status -> 'Inactive', placementStatus -> 'N/A'
        setStudents((prev) => prev.map((s) =>
          (s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId)
            ? { ...s, status: 'Inactive', snoozed: false, internshipPriority: 'Inactive', placementStatus: 'N/A' }
            : s
        ));

        toast.info(`Student ${stuName} marked as Inactive`);
        setGenTargetStudent(null);
        setActiveMainTab('inactive');
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to mark student inactive:', err);
        toast.error(err?.response?.data?.message || 'Failed to update priority');
      } finally {
        setIsSubmittingGen(false);
      }
      return;
    }

    // ── Normal / Urgent path — update existing request priority and restore active state ──
    try {
      setIsSubmittingGen(true);

      // Re-fetch to get the latest requests
      let wfId = activeWorkflowId;
      const wfListRes = await fetchWorkflows();
      const wfList = wfListRes?.data ?? wfListRes ?? [];
      const wfArray = Array.isArray(wfList) ? wfList : [];
      if (!wfId) wfId = wfArray[0]?.id || wfArray[0]?._id;

      if (!wfId) {
        toast.error('No workflow found.');
        return;
      }

      const wfRes = await fetchWorkflowById(wfId);
      const freshRequests = (wfRes?.data ?? wfRes)?.requests ?? [];

      const stuKeys = [
        genTargetStudent.studentId,
        genTargetStudent.id,
        genTargetStudent.dbId,
        norm(stuName),
      ].filter(Boolean).map(norm);

      const matchingReq = freshRequests.find(
        (r) =>
          (r.studentId && stuKeys.includes(norm(r.studentId))) ||
          (r.student && stuKeys.includes(norm(r.student)))
      );

      if (matchingReq) {
        const reqId = String(matchingReq._id || matchingReq.reqId || matchingReq.id || '');
        if (reqId) {
          await updateInternshipRequest(wfId, reqId, { priority: genPriority, returnedToStep1: false, status: 'New' });
        }
      } else {
        const requestData = {
          title: `${genTargetStudent.course || 'Internship'} Placement`,
          student: stuName,
          studentId: genTargetStudent.studentId || genTargetStudent.id || stuId,
          company: 'Pending Assignment',
          rto: genTargetStudent.rto || 'TBD',
          priority: genPriority,
          status: 'New',
          returnedToStep1: false,
        };
        await createInternshipRequest(wfId, requestData);
      }

      // Update student model in backend
      if (targetDbId) {
        await updateStudent(targetDbId, { status: 'Active', internshipPriority: genPriority, placementStatus: 'In Progress' });
        if (isStudentSnoozed(genTargetStudent)) {
          await snoozeStudent(targetDbId, { snoozed: false, snoozedAt: null, snoozeUntil: null, snoozeReason: '', internshipPriority: genPriority, placementStatus: 'In Progress' });
        }
      }

      // Clear snooze in localStorage and state across all student identifiers
      const keysToDelete = [
        genTargetStudent.studentId,
        genTargetStudent.id,
        genTargetStudent.dbId,
        stuName,
        norm(stuName),
        norm(genTargetStudent.studentId),
        norm(genTargetStudent.id),
        norm(genTargetStudent.dbId),
      ].filter(Boolean);

      try {
        const existing = JSON.parse(localStorage.getItem('portal_snoozed_students') || '{}');
        keysToDelete.forEach((k) => delete existing[k]);
        localStorage.setItem('portal_snoozed_students', JSON.stringify(existing));
        setSnoozedStudentIds(existing);
      } catch (_) {}

      // Update in-memory state
      setActiveWorkflowId(wfId);
      const updatedRequests = freshRequests.map((r) => {
        const rKeys = [norm(r.studentId), norm(r.student)];
        return stuKeys.some(k => rKeys.includes(k)) ? { ...r, priority: genPriority, returnedToStep1: false } : r;
      });
      setActiveWorkflowRequests(updatedRequests);
      const updatedMap = buildWorkflowRequestMap(updatedRequests);
      keysToDelete.forEach((k) => { updatedMap[k] = genPriority; });
      setWorkflowRequestMap(updatedMap);

      // Restore active student in state
      setStudents((prev) =>
        prev.map((s) =>
          s.id === genTargetStudent.id || s.dbId === genTargetStudent.dbId
            ? { ...s, status: 'Active', snoozed: false, internshipPriority: genPriority, placementStatus: 'In Progress' }
            : s
        )
      );

      toast.success(`Placement priority updated to ${genPriority} for ${stuName}`);
      setGenTargetStudent(null);
      setActiveMainTab('all');
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to change placement priority:', err);
      toast.error(err?.response?.data?.message || 'Failed to update placement priority');
    } finally {
      setIsSubmittingGen(false);
    }
  };

  useEffect(() => {
    fetchUsers({ status: 'Active' })
      .then((res) => {
        const list = res?.data ?? [];
        setCoordinators(list.filter(u => ['Coordinator', 'Administrator', 'Admin'].includes(u.role)));
      })
      .catch(() => {});
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchStudents();
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
  // Load workflow data for dual-source placement request detection
  useEffect(() => { loadWorkflowData(); }, [loadWorkflowData]);

  // Synchronise placement status whenever workflow or placement data updates anywhere
  useEffect(() => {
    const handleSync = () => {
      loadStudents();
      loadWorkflowData();
    };
    window.addEventListener(PLACEMENT_DATA_CHANGED, handleSync);
    return () => window.removeEventListener(PLACEMENT_DATA_CHANGED, handleSync);
  }, [loadStudents, loadWorkflowData]);

  // Sync snoozed students from backend data
  useEffect(() => {
    const fromStudents = {};
    (students || []).forEach((s) => {
      if (s.snoozed || s.internshipPriority === 'Snooze') {
        const item = {
          id: s.id,
          studentId: s.studentId || s.id,
          name: s.name,
          email: s.email,
          rto: s.rto,
          snoozedAt: s.snoozedAt || new Date().toISOString(),
          snoozeUntil: s.snoozeUntil,
          reason: s.snoozeReason || 'Deferred',
          rawStudent: s,
        };
        fromStudents[s.id] = item;
        if (s.dbId) fromStudents[s.dbId] = item;
        if (s.studentId) fromStudents[s.studentId] = item;
        if (s.name) fromStudents[norm(s.name)] = item;
      }
    });
    setSnoozedStudentIds(fromStudents);
    try {
      localStorage.setItem('portal_snoozed_students', JSON.stringify(fromStudents));
    } catch (_) {}
  }, [students]);

  const [filters, setFilters] = useState(emptyFilters);

  const courseOptions = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);
  const rtoOptions = useMemo(() => [...new Set(students.map(s => s.rto).filter(Boolean))].sort(), [students]);

  const updateFilter = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setCurrentPage(1); };
  const clearFilters = () => { setFilters(emptyFilters); setCurrentPage(1); };

  const isStudentSnoozed = (s) => {
    if (!s) return false;
    const sName = s.name ? norm(s.name) : '';
    const livePriority =
      workflowRequestMap[s.id] ||
      workflowRequestMap[s.studentId] ||
      workflowRequestMap[s.dbId] ||
      (s.studentId && workflowRequestMap[norm(s.studentId)]) ||
      (s.id && workflowRequestMap[norm(s.id)]) ||
      (sName && workflowRequestMap[sName]);

    // Active (Normal / Urgent) overrides Snooze
    if (livePriority === 'Normal' || livePriority === 'Urgent') return false;
    if (s.internshipPriority === 'Normal' || s.internshipPriority === 'Urgent') return false;
    // Inactive takes precedence or is separate
    if (livePriority === 'Inactive' || s.internshipPriority === 'Inactive' || s.status === 'Inactive') return false;

    return Boolean(
      snoozedStudentIds[s.id] ||
      snoozedStudentIds[s.studentId] ||
      snoozedStudentIds[s.dbId] ||
      (sName && snoozedStudentIds[sName]) ||
      s.snoozed ||
      s.internshipPriority === 'Snooze' ||
      livePriority === 'Snooze'
    );
  };

  const isStudentInactive = (s) => {
    if (!s) return false;
    const sName = s.name ? norm(s.name) : '';
    const livePriority =
      workflowRequestMap[s.id] ||
      workflowRequestMap[s.studentId] ||
      workflowRequestMap[s.dbId] ||
      (s.studentId && workflowRequestMap[norm(s.studentId)]) ||
      (s.id && workflowRequestMap[norm(s.id)]) ||
      (sName && workflowRequestMap[sName]);

    // Active (Normal / Urgent) overrides Inactive
    if (livePriority === 'Normal' || livePriority === 'Urgent') return false;
    if (s.internshipPriority === 'Normal' || s.internshipPriority === 'Urgent') return false;

    return Boolean(
      s.status === 'Inactive' ||
      s.internshipPriority === 'Inactive' ||
      livePriority === 'Inactive'
    );
  };

  // Compute students scoped by user role (used for tab counts)
  const roleScopedStudents = useMemo(() => {
    const currentUserId = authUser?._id || authUser?.id;
    const currentUserName = authUser?.name;

    return students.filter(s => {
      if (isRtoManager) {
        // RTO Managers see all students scoped to their RTO
      } else if (!isAdmin) {
        const isAssignedToMe =
          (s.assignedCoordinator && currentUserId && norm(s.assignedCoordinator) === norm(currentUserId)) ||
          (s.assignedCoordinatorName && currentUserName && norm(s.assignedCoordinatorName) === norm(currentUserName));
        if (!isAssignedToMe) return false;
      } else {
        if (selectedCoordinator === 'unassigned') {
          if (s.assignedCoordinator || s.assignedCoordinatorName) return false;
        } else if (selectedCoordinator !== 'All') {
          const selectedCoord = coordinators.find(c => (c._id || c.id) === selectedCoordinator);
          const coordId = selectedCoord?._id || selectedCoord?.id || selectedCoordinator;
          const coordName = selectedCoord?.name;
          const isMatch =
            (s.assignedCoordinator && norm(s.assignedCoordinator) === norm(coordId)) ||
            (s.assignedCoordinatorName && coordName && norm(s.assignedCoordinatorName) === norm(coordName));
          if (!isMatch) return false;
        } else {
          if (!s.assignedCoordinator && !s.assignedCoordinatorName) return false;
        }
      }
      return true;
    });
  }, [students, isAdmin, isRtoManager, authUser, selectedCoordinator, coordinators]);

  const activeStudentsCount = useMemo(() => (
    roleScopedStudents.filter(s => {
      if (filters.rto && (s.rto || '').toLowerCase() !== filters.rto.toLowerCase()) return false;
      return !isStudentSnoozed(s) && !isStudentInactive(s);
    }).length
  ), [roleScopedStudents, snoozedStudentIds, workflowRequestMap, filters.rto]);

  const inactiveStudentsCount = useMemo(() => (
    roleScopedStudents.filter(s => {
      if (filters.rto && (s.rto || '').toLowerCase() !== filters.rto.toLowerCase()) return false;
      return isStudentInactive(s) && !isStudentSnoozed(s);
    }).length
  ), [roleScopedStudents, snoozedStudentIds, workflowRequestMap, filters.rto]);

  const snoozedCount = useMemo(() => (
    roleScopedStudents.filter(s => {
      if (filters.rto && (s.rto || '').toLowerCase() !== filters.rto.toLowerCase()) return false;
      return isStudentSnoozed(s);
    }).length
  ), [roleScopedStudents, snoozedStudentIds, workflowRequestMap, filters.rto]);

  const filteredStudents = useMemo(() => {
    const currentUserId = authUser?._id || authUser?.id;
    const currentUserName = authUser?.name;

    return students.filter(s => {
      // ── Tab filter ──
      if (activeMainTab === 'snooze') {
        if (!isStudentSnoozed(s)) return false;
      } else if (activeMainTab === 'inactive') {
        if (!isStudentInactive(s) || isStudentSnoozed(s)) return false;
      } else {
        // 'all' / Active tab: hide snoozed and inactive students!
        if (isStudentSnoozed(s) || isStudentInactive(s)) return false;
      }

      // ── Role-based and Coordinator filter ──
      if (isRtoManager) {
        // RTO Managers see all students scoped to their RTO (already scoped by backend)
      } else if (!isAdmin) {
        const isAssignedToMe =
          (s.assignedCoordinator && currentUserId && norm(s.assignedCoordinator) === norm(currentUserId)) ||
          (s.assignedCoordinatorName && currentUserName && norm(s.assignedCoordinatorName) === norm(currentUserName));
        if (!isAssignedToMe) return false;
      } else {
        // Admin view: always hide unassigned students unless "Unassigned Students" is explicitly selected
        if (selectedCoordinator === 'unassigned') {
          if (s.assignedCoordinator || s.assignedCoordinatorName) return false;
        } else if (selectedCoordinator !== 'All') {
          const selectedCoord = coordinators.find(c => (c._id || c.id) === selectedCoordinator);
          const coordId = selectedCoord?._id || selectedCoord?.id || selectedCoordinator;
          const coordName = selectedCoord?.name;
          const isMatch =
            (s.assignedCoordinator && norm(s.assignedCoordinator) === norm(coordId)) ||
            (s.assignedCoordinatorName && coordName && norm(s.assignedCoordinatorName) === norm(coordName));
          if (!isMatch) return false;
        } else {
          // "All" selected — still hide students with no coordinator assigned
          if (!s.assignedCoordinator && !s.assignedCoordinatorName) return false;
        }
      }

      // ── RTO Filter (applies to Active, Snoozed, and Inactive students alike) ──
      if (filters.rto && (s.rto || '').toLowerCase() !== filters.rto.toLowerCase()) return false;
      if (filters.course && s.course !== filters.course) return false;
      if (filters.city && !(s.location || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      // Placement Request type filter (matches workflowRequestMap or snooze)
      if (filters.placementRequest) {
        if (filters.placementRequest === 'Snooze') {
          const isSnoozed = !!(snoozedStudentIds[s.id] || snoozedStudentIds[s.studentId] || snoozedStudentIds[s.dbId]);
          if (!isSnoozed) return false;
        } else {
          const keys = [s.id, s.studentId, s.dbId, norm(s.id), norm(s.studentId), norm(s.dbId)].filter(Boolean);
          const reqPriority = keys.map(k => workflowRequestMap[k]).find(Boolean);
          if (!reqPriority || reqPriority !== filters.placementRequest) return false;
        }
      }
      // Ready is reserved for Step 1 students without a generated placement request.
      const placementStatus = String(s.placementStatus || '').trim();
      if (placementStatus.toLowerCase() === 'ready') return false;
      if (filters.placementStatus && placementStatus.toLowerCase() !== filters.placementStatus.toLowerCase()) return false;
      // Assigned Date filter
      const assignedTime = parseDate(s.assignedAt);
      if (filters.assignedDate) {
        const day = new Date(filters.assignedDate);
        if (isNaN(day.getTime())) return false;
        const dayStart = new Date(filters.assignedDate).setHours(0, 0, 0, 0);
        const dayEnd   = new Date(filters.assignedDate).setHours(23, 59, 59, 999);
        if (assignedTime === null || assignedTime < dayStart || assignedTime > dayEnd) return false;
      }

      // Live search input (My Progress search bar) and URL query param
      const effectiveSearch = (searchQuery || urlSearch || '').toLowerCase().trim();
      if (effectiveSearch) {
        const matchesSearch =
          (s.name || '').toLowerCase().includes(effectiveSearch) ||
          (s.studentId || '').toLowerCase().includes(effectiveSearch) ||
          (s.id || '').toLowerCase().includes(effectiveSearch) ||
          (s.email || '').toLowerCase().includes(effectiveSearch) ||
          (s.phone || '').toLowerCase().includes(effectiveSearch) ||
          (s.rto || '').toLowerCase().includes(effectiveSearch) ||
          (s.course || '').toLowerCase().includes(effectiveSearch) ||
          (s.location || '').toLowerCase().includes(effectiveSearch);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [students, activeMainTab, filters, urlSearch, searchQuery, isAdmin, isRtoManager, authUser, selectedCoordinator, coordinators, snoozedStudentIds, workflowRequestMap]);

  const sortedStudents = useMemo(() => {
    if (!sortField) {
      return [...filteredStudents].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseDate(a.created) || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseDate(b.created) || 0);
        return timeB - timeA;
      });
    }
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
        case 'created': return s.createdAt ? new Date(s.createdAt).getTime() : (parseDate(s.created) || 0);
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
      // Generate Placement Request — admin only; coordinators should not reach this
      if (!isAdmin) return;
      // Fresh request — no existing placement request for this student
      setIsChangingPlacement(false);
      setGenTargetStudent(student);
      setGenPriority('Normal');
      setSnoozeDuration('7_days');
      setSnoozeReason('');

    } else if (action === 'changePlacement') {
      // Existing request — pre-fill current priority from dual-source map
      const stuKeys = [
        student.id,
        student.studentId,
        student.dbId,
        student.name,
        norm(student.id),
        norm(student.studentId),
        norm(student.dbId),
        norm(student.name),
      ].filter(Boolean);

      let currentPriority = 'Normal';
      for (const key of stuKeys) {
        const val = workflowRequestMap[key];
        if (val && ['Urgent', 'Normal', 'Inactive', 'Snooze'].includes(val)) {
          currentPriority = val;
          break;
        }
      }
      if (student.internshipPriority && ['Urgent', 'Normal', 'Inactive', 'Snooze'].includes(student.internshipPriority)) {
        currentPriority = student.internshipPriority;
      }
      if (isStudentSnoozed(student)) currentPriority = 'Snooze';
      else if (isStudentInactive(student)) currentPriority = 'Inactive';

      setIsChangingPlacement(true);
      setGenTargetStudent(student);
      setGenPriority(currentPriority);
      setSnoozeDuration('7_days');
      setSnoozeReason('');

    } else if (action === 'contactIndustry') {
      navigate(`/workflow?step=2&studentId=${encodeURIComponent(student.id || '')}&studentName=${encodeURIComponent(student.name || '')}&openContact=true`);
    } else if (action === 'createAppointment') {
      navigate(`/workflow?step=3&studentId=${encodeURIComponent(student.id || '')}&studentName=${encodeURIComponent(student.name || '')}`);

    } else if (action === 'snooze') {
      // Open the placement modal in Snooze mode
      setIsChangingPlacement(false);
      setGenTargetStudent(student);
      setGenPriority('Snooze');
      setSnoozeDuration('7_days');
      setSnoozeReason('');

    } else if (action === 'unsnooze') {
      const stuId = student.id || student.studentId || student.dbId;
      const targetDbId = student.dbId || student.id;
      const stuName = student.name;

      const keysToDelete = [
        student.studentId,
        student.id,
        student.dbId,
        student.name,
        stuName,
        norm(stuName),
        norm(student.studentId),
        norm(student.id),
        norm(student.dbId),
      ].filter(Boolean);

      // Remove from snoozed list immediately
      const updated = { ...snoozedStudentIds };
      keysToDelete.forEach(k => delete updated[k]);
      setSnoozedStudentIds(updated);
      try { localStorage.setItem('portal_snoozed_students', JSON.stringify(updated)); } catch (_) {}

      // If backend student exists, persist un-snooze and restore Active status
      if (targetDbId) {
        snoozeStudent(targetDbId, {
          snoozed: false,
          snoozedAt: null,
          snoozeUntil: null,
          snoozeReason: '',
          internshipPriority: 'Normal',
          placementStatus: 'In Progress',
        }).catch((err) => {
          console.error('Failed to un-snooze student in DB:', err);
        });
        updateStudent(targetDbId, { status: 'Active', internshipPriority: 'Normal', placementStatus: 'In Progress' }).catch(() => {});
      }

      // If active workflow has this student's request, restore to Normal & returnedToStep1: false
      if (activeWorkflowId) {
        const stuKeys = [student.id, student.studentId, student.dbId, norm(stuName)].filter(Boolean).map(norm);
        const matchingReq = (activeWorkflowRequests || []).find((r) =>
          (r.studentId && stuKeys.includes(norm(r.studentId))) ||
          (r.student && stuKeys.includes(norm(r.student)))
        );
        if (matchingReq) {
          const reqId = String(matchingReq._id || matchingReq.reqId || matchingReq.id || '');
          if (reqId) {
            updateInternshipRequest(activeWorkflowId, reqId, { priority: 'Normal', returnedToStep1: false, status: 'New' }).catch(() => {});
          }
        }
      }

      // Update in-memory workflow map
      const updatedMap = { ...workflowRequestMap };
      keysToDelete.forEach(k => {
        updatedMap[k] = 'Normal';
      });
      setWorkflowRequestMap(updatedMap);

      // Restore active student in state so they immediately reappear in All tab
      setStudents((prev) => prev.map((s) =>
        (s.id === student.id || s.dbId === student.dbId)
          ? { ...s, snoozed: false, status: 'Active', internshipPriority: 'Normal', placementStatus: 'In Progress' }
          : s
      ));

      toast.success(`${student.name} restored to active workflow`);

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
    } else if (action === 'editIndustry') {
      setEditIndustryStudent(student);
    } else if (action === 'viewContactedIndustries') {
      const studentKeys = [student.id, student.studentId, student.dbId, norm(student.name)].filter(Boolean).map(k => String(k).trim().toLowerCase());
      const matchingReqs = (activeWorkflowRequests || []).filter(r => {
        const rKeys = [r.id, r.reqId, r._id, r.studentId, norm(r.name), norm(r.student)].filter(Boolean).map(k => String(k).trim().toLowerCase());
        return rKeys.some(k => studentKeys.includes(k));
      });
      const reqContacts = matchingReqs.flatMap(r => r.contactedIndustries || []);
      const combined = [
        ...(Array.isArray(student.contactedIndustries) ? student.contactedIndustries : []),
        ...reqContacts,
      ];
      const seenOrgs = new Set();
      const deduped = [];
      combined.forEach(c => {
        if (!c) return;
        const org = (c.organizationName || c.name || '').trim().toLowerCase();
        if (org && !seenOrgs.has(org)) {
          seenOrgs.add(org);
          deduped.push(c);
        } else if (!org) {
          deduped.push(c);
        }
      });
      setContactedIndustriesStudent({
        ...student,
        contactedIndustries: deduped,
      });
    }
  };

  // Helper: look up a student in the dual-source map
  const getStudentHasRequest = (student) => {
    if (!student) return false;
    const sName = student.name ? norm(student.name) : '';
    const keys = [
      student.id,
      student.studentId,
      student.dbId,
      sName,
      norm(student.id),
      norm(student.studentId),
      norm(student.dbId),
    ].filter(Boolean);
    const hasReq = keys.some((k) => {
      const val = workflowRequestMap[k];
      return val === 'Normal' || val === 'Urgent' || val === 'Inactive' || val === 'Snooze';
    });
    return hasReq || Boolean(student.internshipPriority) || isStudentSnoozed(student) || isStudentInactive(student);
  };

  // Helper: return the actual priority string ('Normal'|'Urgent'|'Inactive'|'Snooze') or null
  const getStudentWorkflowPriority = (student) => {
    if (!student) return null;
    if (isStudentSnoozed(student)) return 'Snooze';
    if (isStudentInactive(student)) return 'Inactive';
    const sName = student.name ? norm(student.name) : '';
    const keys = [
      student.id,
      student.studentId,
      student.dbId,
      sName,
      norm(student.id),
      norm(student.studentId),
      norm(student.dbId),
    ].filter(Boolean);
    for (const k of keys) {
      const val = workflowRequestMap[k];
      if (val === 'Normal' || val === 'Urgent' || val === 'Inactive' || val === 'Snooze') return val;
    }
    if (student.internshipPriority) return student.internshipPriority;
    return null;
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
                  <h4 className="text-xs font-bold text-slate-900">Coordinator View &amp; Progress</h4>
                  <p className="text-[10px] text-slate-400">Select any coordinator to filter and monitor their assigned students and placement progress</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter by Coordinator:</label>
                <select
                  value={selectedCoordinator}
                  onChange={(e) => { setSelectedCoordinator(e.target.value); setCurrentPage(1); }}
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
          ) : isRtoManager ? (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-900 font-semibold">
                  Showing students registered under <span className="font-bold">{authUser?.rtoName || authUser?.requestedOrgName || 'your RTO'}</span> ({filteredStudents.length} students)
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                RTO View
              </span>
            </div>
          ) : isCoordinator ? (
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
          ) : null}

          {/* ─── Student Tabs: Active / Inactive / Snooze & Search ───────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs w-fit">
              {[
                { key: 'all', label: 'Active', count: activeStudentsCount },
                { key: 'inactive', label: 'Inactive Students', count: inactiveStudentsCount },
                { key: 'snooze', label: 'Snooze', count: snoozedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setActiveMainTab(tab.key); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeMainTab === tab.key
                      ? 'bg-[#0147A6] text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {tab.label} <span className="opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students in this tab..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <StudentFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            onApply={() => { setCurrentPage(1); toast.success(`Found ${filteredStudents.length} student(s)`); }}
            options={{ courseOptions, rtoOptions }}
            resultCount={filteredStudents.length}
            selectedCount={selectedRows.length}
            placementStatusOptions={MY_PROGRESS_PLACEMENT_STATUS_OPTIONS}
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
                      hasPlacementRequest={getStudentHasRequest(student)}
                      workflowPriority={getStudentWorkflowPriority(student)}
                      isSnoozed={isStudentSnoozed(student)}
                      isAdmin={isAdmin}
                      allowGenerate={isAdmin}
                      allowCreateAppointment={false}
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

      {/* Generate Placement Request / Change Placement Modal */}
      {genTargetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isChangingPlacement ? 'Change Placement Request' : 'Generate Placement Request'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isChangingPlacement
                    ? 'Update the request type for this student'
                    : 'Moving student to Step 2 – Placement Request'}
                </p>
              </div>
              <button
                onClick={() => setGenTargetStudent(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student info chip */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Student</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{genTargetStudent.name}</p>
                <p className="text-xs text-slate-500">{genTargetStudent.id || genTargetStudent.studentId}</p>
              </div>
              {!isCoordinator && genTargetStudent.rto && (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/80">
                  {genTargetStudent.rto}
                </span>
              )}
            </div>

            {/* Priority selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {isChangingPlacement ? 'New Priority' : 'Request Action & Priority'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">

                {/* Normal */}
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

                {/* Urgent */}
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

                {/* Inactive */}
                <button
                  type="button"
                  onClick={() => setGenPriority('Inactive')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    genPriority === 'Inactive'
                      ? 'bg-violet-50/70 border-violet-500 ring-2 ring-violet-500/20 text-violet-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">Inactive Student</span>
                    <input type="radio" name="myStudentPriority" checked={genPriority === 'Inactive'} onChange={() => {}} className="accent-violet-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-1">Mark as Inactive</span>
                </button>

                {/* Snooze */}
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

            {/* Snooze duration + reason (shown for both generate and change modes) */}
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

            {/* Actions */}
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
                onClick={isChangingPlacement ? handleChangePlacementSubmit : handleGeneratePlacementRequestSubmit}
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
                ) : isChangingPlacement ? (
                  <span>Update Priority</span>
                ) : (
                  <span>Generate &amp; Continue</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Edit Assigned Industry Modal ─── */}
      <EditAssignedIndustryModal
        isOpen={Boolean(editIndustryStudent)}
        student={editIndustryStudent}
        onClose={() => setEditIndustryStudent(null)}
        onSaved={loadStudents}
      />

      {/* ─── Contacted Industries History Modal ─── */}
      <StudentContactedIndustriesModal
        isOpen={Boolean(contactedIndustriesStudent)}
        student={contactedIndustriesStudent}
        onClose={() => setContactedIndustriesStudent(null)}
        onStudentUpdated={loadStudents}
      />
    </div>
  );
}
