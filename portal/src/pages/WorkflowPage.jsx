// src/pages/WorkflowPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, UserCheck } from 'lucide-react';
import WorkFlowLayout from '../components/layout/WorkFlowLayout';
import WorkflowStep1Students from '../components/workflow/WorkflowStep1Students';
import WorkflowStep2Requests from '../components/workflow/WorkflowStep2Requests';
import WorkflowStep3Appointments from '../components/workflow/WorkflowStep3Appointments';
import WorkflowStep4Internships from '../components/workflow/WorkflowStep4Internships';
import WorkflowStep5Payments from '../components/workflow/WorkflowStep5Payments';
import { fetchUsers } from '../api/userApi';
import {
  fetchWorkflows,
  createWorkflow,
  fetchWorkflowById,
  updateWorkflowStep,
  fetchWorkflowStudents,
  addStudentsToWorkflow,
  removeStudentFromWorkflow,
  createInternshipRequest,
  updateInternshipRequest,
  deleteInternshipRequest,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createInternship,
  updateInternship,
  deleteInternship,
  bulkDeleteInternshipRequests,
  bulkDeleteAppointments,
  bulkDeleteInternships,
} from '../api/workflowApi';
import { calculatePlacementEndDate } from '../utils/dateCalculation';
import { updateStudent } from '../api/studentsApi';
import { PLACEMENT_DATA_CHANGED, notifyPlacementDataChanged } from '../api/placementEvents';

const STEP_LABELS = ['Students', 'Placement Requests', 'Appointments', 'Placements', 'Payments'];

const getResponseStyle = (response) => {
  if (!response) return 'text-slate-600 bg-slate-50';
  const r = String(response).toLowerCase();
  if (r.includes('approv') || r.includes('positive') || r.includes('accept')) {
    return 'text-emerald-700 bg-emerald-50';
  }
  if (r.includes('reject') || r.includes('declin') || r.includes('negative')) {
    return 'text-rose-700 bg-rose-50';
  }
  return 'text-amber-700 bg-amber-50';
};

const norm = (val) => (val === undefined || val === null ? '' : String(val).trim().toLowerCase());

export default function WorkflowPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const [activeStep, setActiveStep] = useState(
    stepParam >= 1 && stepParam <= 5 ? stepParam : 1
  );

  const authUser = useSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === 'Administrator';

  const [workflow, setWorkflow] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStudents, setWorkflowStudents] = useState([]);

  // Coordinators list & selection for Admins
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState('All');

  const [activeWorkflowStudent, setActiveWorkflowStudent] = useState(null);
  const [activeWorkflowRequest, setActiveWorkflowRequest] = useState(null);
  const [activeWorkflowCompany, setActiveWorkflowCompany] = useState(null);
  const [prefilledAppointmentData, setPrefilledAppointmentData] = useState(null);

  useEffect(() => {
    fetchUsers({ status: 'Active' })
      .then((res) => {
        const list = res?.data ?? [];
        setCoordinators(list.filter(u => ['Coordinator', 'Administrator', 'Admin'].includes(u.role)));
      })
      .catch(() => { });
  }, []);

  // ─── Refresh workflow data ────────────────────────────────────────────────
  const refreshWorkflowData = useCallback(async () => {
    if (!workflowId) return;
    try {
      const [updated, studentsResult] = await Promise.all([
        fetchWorkflowById(workflowId),
        fetchWorkflowStudents(),
      ]);
      if (updated && updated.data) {
        setWorkflow(updated.data);
      }
      if (studentsResult) {
        setWorkflowStudents(studentsResult.data || []);
      }
      return updated?.data ?? null;
    } catch (err) {
      console.error('Failed to refresh workflow:', err);
    }
    return null;
  }, [workflowId]);

  useEffect(() => {
    const loadOrCreateWorkflow = async () => {
      try {
        setLoading(true);
        const result = await fetchWorkflows();
        const workflows = result.data || [];

        if (workflows.length > 0) {
          const existing = workflows[0];
          const wfId = existing.id || existing._id;
          setWorkflowId(wfId);
          setWorkflow(existing);
          const stepFromUrl = parseInt(searchParams.get('step') || '', 10);
          if (stepFromUrl >= 1 && stepFromUrl <= 5) {
            setActiveStep(stepFromUrl);
          } else {
            setActiveStep(existing.currentStep || 1);
          }

          // ✅ Also fetch full populated data (requests, appointments, internships)
          try {
            const detailed = await fetchWorkflowById(wfId);
            if (detailed?.data) {
              setWorkflow(detailed.data);
            }
          } catch (detailErr) {
            console.warn('Could not fetch full workflow detail, using list data:', detailErr);
          }
        } else {
          const created = await createWorkflow({
            name: 'Placement Workflow',
            description: 'Default placement workflow',
            status: 'Active',
            currentStep: 1,
          });
          const newWorkflow = created.data;
          setWorkflowId(newWorkflow.id || newWorkflow._id);
          setWorkflow(newWorkflow);
        }

        const studentsResult = await fetchWorkflowStudents();
        setWorkflowStudents(studentsResult.data || []);
      } catch (err) {
        console.error('Failed to load workflow:', err);
        setError(err.message || 'Failed to load workflow data');
      } finally {
        setLoading(false);
      }
    };

    loadOrCreateWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Re-fetch students when user returns to this tab/window ──────────────
  useEffect(() => {
    const refreshStudents = async () => {
      try {
        const result = await fetchWorkflowStudents();
        setWorkflowStudents(result.data || []);
      } catch (_) { }
    };
    window.addEventListener('focus', refreshStudents);
    return () => window.removeEventListener('focus', refreshStudents);
  }, []);

  // ─── Listen for real-time placement data events (e.g. RTO assignment) ───
  useEffect(() => {
    const handlePlacementChanged = () => {
      refreshWorkflowData();
    };
    window.addEventListener(PLACEMENT_DATA_CHANGED, handlePlacementChanged);
    return () => window.removeEventListener(PLACEMENT_DATA_CHANGED, handlePlacementChanged);
  }, [refreshWorkflowData]);

  useEffect(() => {
    if (stepParam >= 1 && stepParam <= 5) {
      setActiveStep(stepParam);
    }
  }, [stepParam]);

  const goToStep = useCallback(async (step) => {
    setActiveStep(step);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', String(step));
    setSearchParams(newParams);

    if (workflowId) {
      try {
        const result = await updateWorkflowStep(workflowId, step);
        if (result.data) {
          setWorkflow(result.data);
        }
      } catch (err) {
        console.error('Failed to update workflow step:', err);
      }
    }
  }, [workflowId, searchParams, setSearchParams]);

  // ─── 🔒 Coordinators cannot access Step 1 (Students) ──────────────────────
  // Step 1 is Admin-only per spec. If a coordinator lands here (direct URL,
  // stale link, refresh, etc.) push them straight to Step 2 instead.
  useEffect(() => {
    if (!loading && !isAdmin && activeStep === 1) {
      goToStep(2);
    }
  }, [loading, isAdmin, activeStep, goToStep]);

  const handleStep1Next = useCallback(async (student, priority) => {
    if (student) {
      setActiveWorkflowStudent(student);

      if (workflowId) {
        try {
          const resolvedPriority = priority || 'Normal';
          const studentName =
            student.name ||
            [student.firstName, student.lastName].filter(Boolean).join(' ') ||
            'Student';
          const studentIdentifier =
            student.studentId ||
            student.id ||
            student._id ||
            '';
          const requestData = {
            title: `${student.course || student.courseQualification || 'Internship'} Placement`,
            student: studentName,
            studentId: String(studentIdentifier),
            company: 'Pending Assignment',
            rto: student.rto || student.assignedRto || 'TBD',
            priority: resolvedPriority,
            status: ['Inactive', 'Snooze'].includes(resolvedPriority) ? 'On Hold' : 'New',
            returnedToStep1: ['Inactive', 'Snooze'].includes(resolvedPriority),
          };

          // Check if an existing request exists in workflow.requests
          const sIds = [student.id, student._id, student.studentId].filter(Boolean).map(norm);
          const sName = norm(studentName);
          const existingReq = (workflow?.requests || []).find((r) => {
            const rId = norm(r.studentId);
            const rName = norm(r.student);
            return sIds.includes(rId) || (sName && rName === sName);
          });

          if (existingReq) {
            await updateInternshipRequest(workflowId, existingReq._id || existingReq.reqId || existingReq.id, requestData);
          } else {
            await createInternshipRequest(workflowId, requestData);
          }

          // ── Sync Student.internshipPriority & status ──
          const stuId = student.id || student._id || student.studentId;
          if (stuId) {
            const studentUpdate = {
              internshipPriority: resolvedPriority,
            };
            if (resolvedPriority === 'Inactive') {
              studentUpdate.status = 'Inactive';
            } else if (['Normal', 'Urgent'].includes(resolvedPriority)) {
              studentUpdate.status = 'Active';
            }

            updateStudent(stuId, studentUpdate).catch((err) =>
              console.error('Failed to sync student status and priority on new request:', err)
            );
          }

          await refreshWorkflowData();
      notifyPlacementDataChanged();
        } catch (err) {
          console.error('Failed to create internship request in backend:', err);
        }
      }
    }
    if (!['Inactive', 'Snooze'].includes(priority)) {
      goToStep(2);
    }
  }, [workflowId, goToStep, refreshWorkflowData, workflow]);

  const handleStep2Next = useCallback((request, company, prefillData) => {
    if (request) setActiveWorkflowRequest(request);
    if (company) setActiveWorkflowCompany(company);
    if (prefillData) setPrefilledAppointmentData(prefillData);
    goToStep(3);
  }, [goToStep]);

  const handleStep3Next = useCallback(() => {
    goToStep(4);
  }, [goToStep]);

  const handleAddContactToRequest = useCallback(async (requestId, contactData) => {
    if (!workflowId) return;
    try {
      await updateInternshipRequest(workflowId, requestId, {
        contactedIndustries: [contactData],
        returnedToStep1: false,
        status: 'Industry Contacted',
      });
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to add contact', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  // ─── Filter students based on coordinator role / selected coordinator ────
  const visibleWorkflowStudents = useMemo(() => {
    if (!workflowStudents || workflowStudents.length === 0) return [];

    if (!isAdmin) {
      // Coordinator: must be authenticated to see any students
      if (!authUser) return [];

      // Normalise current user identity to plain strings for safe ObjectId comparison
      const currentUserId = String(authUser._id || authUser.id || '').trim();
      const currentUserName = String(authUser.name || '').trim().toLowerCase();

      return workflowStudents.filter((stu) => {
        const assignedId = String(stu.assignedCoordinator || '').trim();
        const assignedName = String(stu.assignedCoordinatorName || '').trim().toLowerCase();

        // Match by ObjectId string OR coordinator name (fallback)
        return (
          (currentUserId && assignedId && assignedId === currentUserId) ||
          (currentUserName && assignedName && assignedName === currentUserName)
        );
      });
    }

    // ── Admin path ──
    if (selectedCoordinator === 'All') return workflowStudents;

    if (selectedCoordinator === 'unassigned') {
      return workflowStudents.filter(
        (stu) => !stu.assignedCoordinator && !stu.assignedCoordinatorName
      );
    }

    const selectedCoord = coordinators.find(
      (c) => String(c._id || c.id) === String(selectedCoordinator)
    );
    const coordId = String(selectedCoord?._id || selectedCoord?.id || selectedCoordinator).trim();
    const coordName = String(selectedCoord?.name || '').trim().toLowerCase();

    return workflowStudents.filter((stu) => {
      const assignedId = String(stu.assignedCoordinator || '').trim();
      const assignedName = String(stu.assignedCoordinatorName || '').trim().toLowerCase();
      return (
        (assignedId && assignedId === coordId) ||
        (coordName && assignedName && assignedName === coordName)
      );
    });
  }, [workflowStudents, isAdmin, authUser, selectedCoordinator, coordinators]);

  // Student identifiers set for filtering requests, appointments, internships
  const visibleStudentKeySet = useMemo(() => {
    const set = new Set();
    visibleWorkflowStudents.forEach((stu) => {
      if (stu.id || stu._id) set.add(norm(stu.id || stu._id));
      if (stu.studentId) set.add(norm(stu.studentId));
      const fullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
      const name = stu.name || fullName;
      if (name) set.add(norm(name));
    });
    return set;
  }, [visibleWorkflowStudents]);

  // Comprehensive map of student key -> 'Snooze' | 'Inactive'
  const inactiveSnoozedStudentMap = React.useMemo(() => {
    const map = new Map();

    // 1. Group workflow requests by studentId and student name to determine latest priority
    const latestByStudent = new Map();
    if (workflow?.requests && Array.isArray(workflow.requests)) {
      workflow.requests.forEach((req) => {
        const sid = req.studentId ? norm(req.studentId) : null;
        const sname = req.student ? norm(req.student) : null;
        const reqTime = new Date(req.updatedAt || req.createdAt || 0).getTime();

        if (sid) {
          const existing = latestByStudent.get(sid);
          if (!existing || reqTime > existing.time) {
            latestByStudent.set(sid, { priority: req.priority, time: reqTime });
          }
        }
        if (sname) {
          const existing = latestByStudent.get(sname);
          if (!existing || reqTime > existing.time) {
            latestByStudent.set(sname, { priority: req.priority, time: reqTime });
          }
        }
      });
    }

    latestByStudent.forEach((val, sid) => {
      if (val.priority === 'Inactive' || val.priority === 'Snooze') {
        map.set(sid, val.priority);
      }
    });

    // 2. Also inspect workflowStudents directly (snoozed flag, internshipPriority)
    (workflowStudents || []).forEach((stu) => {
      const dbId = norm(stu.id || stu._id);
      const bizId = norm(stu.studentId);
      const fullName = norm(`${stu.firstName || ''} ${stu.lastName || ''}`.trim());
      const name = norm(stu.name || fullName);
      const email = norm(stu.email || stu.emailAddress);

      const reqPriority =
        (bizId && latestByStudent.get(bizId)?.priority) ||
        (dbId && latestByStudent.get(dbId)?.priority) ||
        (name && latestByStudent.get(name)?.priority);

      const isSnoozed =
        (stu.snoozed === true || stu.internshipPriority === 'Snooze' || reqPriority === 'Snooze') &&
        reqPriority !== 'Normal' && reqPriority !== 'Urgent';

      const isInactive =
        (stu.internshipPriority === 'Inactive' || stu.status === 'Inactive' || reqPriority === 'Inactive') &&
        reqPriority !== 'Normal' && reqPriority !== 'Urgent' && !isSnoozed;

      const statusType = isSnoozed ? 'Snooze' : isInactive ? 'Inactive' : null;

      if (statusType) {
        if (dbId) map.set(dbId, statusType);
        if (bizId) map.set(bizId, statusType);
        if (name) map.set(name, statusType);
        if (fullName) map.set(fullName, statusType);
        if (email) map.set(email, statusType);
      } else {
        if (dbId) map.delete(dbId);
        if (bizId) map.delete(bizId);
        if (name) map.delete(name);
        if (fullName) map.delete(fullName);
        if (email) map.delete(email);
      }
    });

    return map;
  }, [workflow, workflowStudents]);

  // Comprehensive keys of students who are Inactive or Snoozed — used to hide them from active workflow steps
  const inactiveSnoozedStudentKeys = React.useMemo(() => {
    return new Set(inactiveSnoozedStudentMap.keys());
  }, [inactiveSnoozedStudentMap]);

  // ─── Mapping helpers ───────────────────────────────────────────────────────
  // ID-only matching — name fallback is intentionally removed because two students
  // can share the same name. Workflow sub-docs store studentId; if absent, no match.

  const findRequestsForStudent = useCallback((stu) => {
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);
    const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
    const stuName = norm(stu.name || stuFullName);

    return (workflow?.requests || []).filter((r) => {
      const reqStudentId = norm(r.studentId);
      const reqStudentName = norm(r.student);
      return (
        (reqStudentId && stuDbId && reqStudentId === stuDbId) ||
        (reqStudentId && stuBizId && reqStudentId === stuBizId) ||
        (reqStudentName && stuName && reqStudentName === stuName)
      );
    });
  }, [workflow]);

  const findAppointmentsForStudent = useCallback((stu) => {
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);
    const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
    const stuName = norm(stu.name || stuFullName);

    return (workflow?.appointments || []).filter((a) => {
      const apptStudentId = norm(a.studentId);
      const apptStudentName = norm(a.student);
      return (
        (apptStudentId && stuDbId && apptStudentId === stuDbId) ||
        (apptStudentId && stuBizId && apptStudentId === stuBizId) ||
        (apptStudentName && stuName && apptStudentName === stuName)
      );
    });
  }, [workflow]);

  const mapStudentsForStep1 = useCallback(() => {
    if (!visibleWorkflowStudents || visibleWorkflowStudents.length === 0) return [];

    const sortedStudents = [...visibleWorkflowStudents].sort((a, b) => {
      const tA = new Date(a.createdAt || a.addedOn || a.updatedAt || 0).getTime();
      const tB = new Date(b.createdAt || b.addedOn || b.updatedAt || 0).getTime();
      return tB - tA;
    });

    return sortedStudents.map((stu) => {
      const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
      const stuDbId = norm(stu.id || stu._id);
      const stuBizId = norm(stu.studentId);
      const stuName = norm(stu.name || stuFullName);

      const matchingRequests = findRequestsForStudent(stu);
      const matchingAppointments = findAppointmentsForStudent(stu);
      const activeRequests = matchingRequests.filter((request) => !['Inactive', 'Snooze'].includes(request.priority));
      const contactedIndustries = matchingRequests.flatMap((r) => r.contactedIndustries || []);

      const hasRequest = activeRequests.length > 0;
      const hasContacted = contactedIndustries.length > 0;

      const now = new Date();

      // ── Internship records for this student ──────────────────────────────
      const matchingInternships = (workflow?.internships || []).filter((i) => {
        const iStuId = norm(i.studentId);
        const iStuName = norm(i.student);
        return (
          (iStuId && stuDbId && iStuId === stuDbId) ||
          (iStuId && stuBizId && iStuId === stuBizId) ||
          (iStuName && stuName && iStuName === stuName)
        );
      });

      // ── Sort appointments newest-first so the latest outcome wins ────────
      const sortedAppointments = [...matchingAppointments].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || a.date || 0);
        const bDate = new Date(b.updatedAt || b.createdAt || b.date || 0);
        return bDate - aDate;
      });

      const TERMINAL_APPT_STATUSES = [
        'Cancelled',
        'Withdrawn',
        'Student Withdraw',
        'Student Withdrawn',
        'Declined',
        'No Show',
        'Not Suitable Site',
        'Industry Rejected',
        'Student Missed Appointment',
      ];
      const ACTIVE_APPT_STATUSES = ['Scheduled', 'Confirmed'];

      // ── Status determination: Active states take precedence over past terminal events ──

      // Placement Completed
      const hasCompleted =
        ['Placement Completed', 'Completed'].includes(stu.placementStatus) ||
        matchingInternships.some((i) => ['Completed', 'Placement Completed'].includes(i.status)) ||
        sortedAppointments.some(
          (a) =>
            ['Completed', 'Placement Completed'].includes(a.status) ||
            (a.appointmentOutcome === 'successful' && a.status === 'Completed')
        );

      const hasActiveInternship = matchingInternships.some((i) => ['Active', 'Placement Started', 'Joined'].includes(i.status));

      // Placement Started — active placement or confirmed appointment past commencement date
      const hasStartedPlacement =
        !hasCompleted && (
          hasActiveInternship ||
          matchingInternships.some((i) =>
            (
              i.start &&
              !['Declined', 'Industry Rejected', 'Student Missed Appointment', 'Withdrawn', 'Student Withdraw', 'Student Withdrawn', 'Cancelled', 'Completed', 'Placement Completed', 'Not Suitable Site'].includes(i.status) &&
              !isNaN(new Date(i.start).getTime()) &&
              new Date(i.start) <= now
            )
          ) ||
          sortedAppointments.some((a) => {
            if (TERMINAL_APPT_STATUSES.includes(a.status)) return false;
            if (['Completed', 'Placement Completed', 'Cancelled'].includes(a.status)) return false;
            if (a.status === 'Confirmed' && a.commencementDate) {
              const cDate = new Date(a.commencementDate);
              return !isNaN(cDate.getTime()) && cDate <= now;
            }
            return false;
          })
        );

      // Appointment Successful — outcome confirmed / successful, pending commencement
      const hasApptSuccessful =
        !hasCompleted && !hasStartedPlacement &&
        sortedAppointments.some((a) =>
          !TERMINAL_APPT_STATUSES.includes(a.status) &&
          (a.appointmentOutcome === 'successful' || a.status === 'Confirmed')
        );

      // Appointment Scheduled — active upcoming appointment (Scheduled / Rescheduled)
      const hasScheduledAppt =
        !hasCompleted && !hasStartedPlacement && !hasApptSuccessful &&
        sortedAppointments.some((a) =>
          !TERMINAL_APPT_STATUSES.includes(a.status) &&
          (a.status === 'Scheduled' || a.status === 'Rescheduled' ||
            (a.date && !['Cancelled', 'Withdrawn', 'Student Withdraw', 'Student Withdrawn', 'Declined', 'No Show', 'Not Suitable Site', 'Industry Rejected', 'Student Missed Appointment'].includes(a.status)))
        );

      // Active contact in progress (e.g. new industry added after withdrawal)
      const hasActiveContact = contactedIndustries.some((ci) =>
        !['Student Withdraw', 'Withdrawn', 'Student Withdrawn', 'Industry Rejected', 'Declined', 'Not Suitable Site', 'Student Missed Appointment', 'No Show'].includes(ci.response)
      );

      // Active placement, appointment, or active contact presence protects forward progress
      const hasActivePlacementOrAppt = hasStartedPlacement || hasApptSuccessful || hasScheduledAppt || hasActiveContact;

      // Student Withdraw — only applies if there is NO active placement or appointment
      const hasStudentWithdraw =
        !hasCompleted && !hasActivePlacementOrAppt && (
          ['Student Withdraw', 'Student Withdrawn', 'Withdrawn'].includes(stu.placementStatus) ||
          matchingInternships.some((i) =>
            ['Withdrawn', 'Student Withdraw', 'Student Withdrawn'].includes(i.status)
          ) ||
          sortedAppointments.some((a) =>
            ['Withdrawn', 'Student Withdraw', 'Student Withdrawn'].includes(a.status) ||
            a.appointmentOutcome === 'student_withdrawal' ||
            a.cancellationType === 'withdrawn'
          )
        );

      // Not Suitable Site — site was deemed inappropriate
      const hasNotSuitableSite =
        !hasCompleted && !hasActivePlacementOrAppt && !hasStudentWithdraw && (
          stu.placementStatus === 'Not Suitable Site' ||
          matchingInternships.some((i) => i.status === 'Not Suitable Site') ||
          sortedAppointments.some((a) =>
            a.status === 'Not Suitable Site' ||
            a.appointmentOutcome === 'not_suitable_site' ||
            (a.status === 'Declined' && a.cancellationTypeLabel === 'Not Suitable Site')
          )
        );

      // Industry Rejected — industry declined the student
      const hasIndustryRejected =
        !hasCompleted && !hasActivePlacementOrAppt && !hasStudentWithdraw && !hasNotSuitableSite && (
          ['Industry Rejected', 'Declined'].includes(stu.placementStatus) ||
          matchingInternships.some((i) => ['Declined', 'Industry Rejected'].includes(i.status)) ||
          sortedAppointments.some((a) =>
            ['Industry Rejected', 'Declined'].includes(a.status) ||
            (a.status === 'Declined' && a.appointmentOutcome !== 'not_suitable_site') ||
            a.appointmentOutcome === 'industry_rejected' ||
            (a.cancellationType === 'industry' && a.status === 'Cancelled')
          )
        );

      // Student Missed Appointment — No Show
      const hasStudentMissed =
        !hasCompleted && !hasActivePlacementOrAppt &&
        !hasNotSuitableSite &&
        !hasStudentWithdraw &&
        !hasIndustryRejected &&
        (
          ['Student Missed Appointment', 'No Show'].includes(stu.placementStatus) ||
          matchingInternships.some((i) => ['No Show', 'Student Missed Appointment'].includes(i.status)) ||
          sortedAppointments.some((a) =>
            ['No Show', 'Student Missed Appointment'].includes(a.status) ||
            a.appointmentOutcome === 'student_missed'
          )
        );

      // ── Derive final status ───────────────────────────────────────────────
      let dynamicPlacementStatus = 'Awaiting';

      // ── Check request priority — Snooze/Inactive override all workflow statuses ──
      const sortedMatchingRequests = [...matchingRequests].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime();
        return bDate - aDate;
      });
      const latestRequest = sortedMatchingRequests[0];
      const studentReqPriority = latestRequest?.priority || null;

      const isSnoozedOrInactive =
        stu.snoozed === true ||
        stu.status === 'Inactive' ||
        stu.internshipPriority === 'Inactive' ||
        stu.internshipPriority === 'Snooze' ||
        studentReqPriority === 'Inactive' ||
        studentReqPriority === 'Snooze' ||
        (stuDbId && inactiveSnoozedStudentKeys.has(stuDbId)) ||
        (stuBizId && inactiveSnoozedStudentKeys.has(stuBizId)) ||
        (stuName && inactiveSnoozedStudentKeys.has(stuName));

      if (isSnoozedOrInactive) {
        dynamicPlacementStatus = 'N/A';
      } else if (hasCompleted) {
        dynamicPlacementStatus = 'Placement Completed';
      } else if (hasStartedPlacement) {
        dynamicPlacementStatus = 'Placement Started';
      } else if (hasApptSuccessful) {
        dynamicPlacementStatus = 'Appointment Successful';
      } else if (hasScheduledAppt) {
        dynamicPlacementStatus = 'Appointment Scheduled';
      } else if (hasActiveContact) {
        dynamicPlacementStatus = 'Industry Contacted';
      } else if (hasStudentWithdraw) {
        dynamicPlacementStatus = 'Student Withdraw';
      } else if (hasNotSuitableSite) {
        dynamicPlacementStatus = 'Not Suitable Site';
      } else if (hasIndustryRejected) {
        dynamicPlacementStatus = 'Industry Rejected';
      } else if (hasStudentMissed) {
        dynamicPlacementStatus = 'Student Missed Appointment';
      } else if (hasContacted) {
        dynamicPlacementStatus = 'Industry Contacted';
      } else if (hasRequest) {
        dynamicPlacementStatus = 'In Progress';
      } else if (stu.rto && (stu.course || stu.courseQualification)) {
        // No request yet, but the student's core profile (RTO + course) is
        // complete enough to start the placement process.
        dynamicPlacementStatus = 'Awaiting';
      } else {
        dynamicPlacementStatus = 'Awaiting';
      }

      return {
        ...stu,
        name: stu.name || stuFullName,
        email: stu.emailAddress || stu.email || '',
        id: stu.id || stu._id || '',
        studentId: stu.studentId || '',
        rto: stu.assignedRto || stu.rto || stu.institute || '',
        status: stu.status || 'Active',
        placementStatus: dynamicPlacementStatus,
        // ── Placement calculation fields — needed by Step3 outcome modal & Step4 end-date calc
        placementHours: stu.placementHours ?? null,
        availabilityDays: stu.availabilityDays ?? null,
        availabilityFrom: stu.availabilityFrom || '09:00 AM',
        availabilityTo: stu.availabilityTo || '05:00 PM',
        assignedCoordinator: stu.assignedCoordinator || null,
        assignedCoordinatorName: stu.assignedCoordinatorName || '',
        addedOn: stu.createdAt
          ? new Date(stu.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        contactedIndustries,
      };
    });
  }, [visibleWorkflowStudents, findRequestsForStudent, findAppointmentsForStudent, workflow, inactiveSnoozedStudentKeys]);

  const mapRequestsForStep2 = useCallback((excludeReturnedToStep1 = false) => {
    if (!workflow?.requests || workflow.requests.length === 0) return [];

    const filtered = workflow.requests
      .filter((req) => {
        // Hide Inactive/Snoozed students from Step 2
        const reqStuId = norm(req.studentId);
        const reqStuName = norm(req.student);
        if (inactiveSnoozedStudentKeys.has(reqStuId) || inactiveSnoozedStudentKeys.has(reqStuName) || req.priority === 'Inactive' || req.priority === 'Snooze') return false;

        // If specifically snoozed/inactive, exclude
        if (excludeReturnedToStep1 && ['Inactive', 'Snooze'].includes(req.priority)) return false;

        if (excludeReturnedToStep1) {
          // If student currently has an active, non-withdrawn scheduled or confirmed appointment, they are in Step 3/4
          const requestIds = new Set([req.id, req._id, req.reqId]
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase()));
          const hasActiveAppt = (workflow?.appointments || []).some((appointment) => {
            if (!['Scheduled', 'Confirmed'].includes(appointment.status)) return false;
            if (['Withdrawn', 'Student Withdraw', 'Student Withdrawn', 'Cancelled', 'Declined', 'Industry Rejected'].includes(appointment.status)) return false;
            if (appointment.appointmentOutcome === 'student_withdrawal') return false;
            const linkedRequest = String(appointment.linkedReq || appointment.linkedRequestId || '').trim().toLowerCase();
            const sameStudent = (norm(appointment.studentId) === reqStuId || norm(appointment.student) === reqStuName);
            return (linkedRequest && requestIds.has(linkedRequest)) || sameStudent;
          });
          if (hasActiveAppt) return false;
        }
        // Coordinators always see only their students; admins filter only when a coordinator is selected
        const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
        if (!shouldFilter) return true;
        return visibleStudentKeySet.has(reqStuId) || visibleStudentKeySet.has(reqStuName);
      });

    // Deduplicate by student: if multiple requests exist for the same student, keep the newest one
    const seenStudents = new Set();
    const sorted = [...filtered].sort((a, b) => {
      const tA = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
      const tB = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
      return tB - tA;
    });

    const uniqueRequests = [];
    for (const req of sorted) {
      const studentKey = norm(req.studentId);
      const studentNameKey = norm(req.student);
      if ((studentKey && seenStudents.has(studentKey)) || (studentNameKey && seenStudents.has(studentNameKey))) {
        continue;
      }
      if (studentKey) seenStudents.add(studentKey);
      if (studentNameKey) seenStudents.add(studentNameKey);
      uniqueRequests.push(req);
    }

    return uniqueRequests.map((req) => {
        const requestStudentId = norm(req.studentId);
        const requestStudentName = norm(req.student);
        const student = workflowStudents.find((stu) => {
          const identifiers = [stu.id, stu._id, stu.studentId, stu.name,
          `${stu.firstName || ''} ${stu.lastName || ''}`].map(norm);
          return identifiers.includes(requestStudentId) || identifiers.includes(requestStudentName);
        });
        const assignedCoordinatorId = String(
          student?.assignedCoordinator?._id || student?.assignedCoordinator?.id || student?.assignedCoordinator || ''
        );
        const assignedCoordinator = coordinators.find(
          (coordinator) => String(coordinator._id || coordinator.id) === assignedCoordinatorId
        );
        const requestCoordinator = coordinators.find(
          (coordinator) => String(coordinator._id || coordinator.id) === String(req.coordinator || '')
        );
        return {
          id: req.id || req._id || '',
          reqId: req.reqId || '',
          title: req.title || '',
          student: req.student || student?.name || '',
          studentId: req.studentId || '',
          studentDbId: student?.id || student?._id || '',
          studentEmail: student?.emailAddress || student?.email || '',
          studentPhone: [student?.phoneCode, student?.phoneNumber].filter(Boolean).join(' ') || student?.phone || '',
          studentRecord: student || null,
          studentAddress: [student?.address, student?.suburb, student?.state, student?.postCode].filter(Boolean).join(', '),
          availabilityDays: student?.availabilityDays || {},
          placementHours: student?.placementHours ?? null,
          availabilityFrom: student?.availabilityFrom || '',
          availabilityTo: student?.availabilityTo || '',
          coordinatorName: student?.assignedCoordinatorName || assignedCoordinator?.name || requestCoordinator?.name || req.coordinator || '',
          assignedCoordinatorAt: student?.assignedCoordinatorAt || null,
          company: req.company === 'Pending Assignment' ? '' : (req.company || ''),
          rto: req.rto || '',
          priority: req.priority || 'Normal',
          status: req.status || 'New',
          notes: req.notes || '',
          contactedIndustries: (req.contactedIndustries || []).map(ind => ({
            ...ind,
            appointmentDate: ind.appointmentDate || '',
            appointmentTime: ind.appointmentTime || '',
          })),
          date:
            req.date ||
            (req.createdAt
              ? new Date(req.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''),
          createdAt: req.createdAt || null,
          updatedAt: req.updatedAt || null,
          changeHistory: req.changeHistory || [],
        };
      })
      .sort((a, b) => {
        const tA = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
        const tB = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
        return tB - tA;
      });
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet, workflowStudents, coordinators, inactiveSnoozedStudentKeys]);

  const mapAppointmentsForStep3 = useCallback(() => {
    if (!workflow?.appointments || workflow.appointments.length === 0) {
      return [];
    }

    return workflow.appointments
      .filter((appt) => {
        // Hide Inactive/Snoozed students from Step 3
        const apptStuId = norm(appt.studentId);
        const apptStuName = norm(appt.student);
        const apptEmail = norm(appt.email);
        if (inactiveSnoozedStudentKeys.has(apptStuId) || inactiveSnoozedStudentKeys.has(apptStuName) || inactiveSnoozedStudentKeys.has(apptEmail)) return false;
        const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
        if (!shouldFilter) return true;
        return visibleStudentKeySet.has(apptStuId) || visibleStudentKeySet.has(apptStuName);
      })
      .map((appt) => {
        const stuDbId = norm(appt.studentId);
        const stuName = norm(appt.student);
        const apptEmail = norm(appt.email);

        // Find matching student
        const matchedStudentByEmail = apptEmail && workflowStudents.find((stu) =>
          norm(stu.email || stu.emailAddress) === apptEmail
        );
        const matchedStudent = matchedStudentByEmail || workflowStudents.find((stu) => {
          const identifiers = [
            stu.id,
            stu._id,
            stu.studentId,
            stu.name,
            `${stu.firstName || ''} ${stu.lastName || ''}`
          ].map(norm);
          return (stuDbId && identifiers.includes(stuDbId)) ||
            (stuName && identifiers.includes(stuName));
        });

        // Find matching request
        const matchedReq = (workflow?.requests || []).find((r) => {
          const rStuId = norm(r.studentId);
          const rStuName = norm(r.student);
          return (
            (rStuId && stuDbId && rStuId === stuDbId) ||
            (rStuName && stuName && rStuName === stuName) ||
            (appt.linkedReq && (r.id === appt.linkedReq || r.reqId === appt.linkedReq))
          );
        });

        // Find matching contacted industry
        const apptCompany = norm(appt.company);
        const apptContactId = String(appt.industryContactId || '');
        const allContacts = [
          ...(matchedReq?.contactedIndustries || []),
          ...(matchedStudent?.contactedIndustries || []),
        ];
        const matchedIndustry = allContacts.find((ci) => {
          const ciId = String(ci._id || ci.id || '');
          const ciName = norm(ci.organizationName);
          return (apptContactId && ciId && apptContactId === ciId) ||
            (apptCompany && ciName && (apptCompany === ciName || ciName.includes(apptCompany) || apptCompany.includes(ciName)));
        });

        const contactPerson = appt.contactPerson || matchedIndustry?.contactPerson || appt.interviewer || '—';
        const industryType = appt.industryType || matchedIndustry?.industryType || '—';
        const availabilityDays = [
          matchedStudent?.availabilityDays,
          matchedReq?.availabilityDays,
          appt.availabilityDays,
        ].find((days) => days && (
          days instanceof Map ? days.size > 0 :
            Array.isArray(days) || typeof days === 'string' ? days.length > 0 :
              typeof days === 'object' && Object.keys(days).length > 0
        ));

        return {
          id: appt.id || appt._id || '',
          apptId: appt.apptId || '',
          student: appt.student || '',
          studentId: appt.studentId || '',
          rto: appt.rto || '',
          email: appt.email || '',
          phone: appt.phone || '',
          date: appt.date || '',
          time: appt.time || '',
          company: appt.company || '',
          interviewer: appt.interviewer || '',
          contactPerson,
          industryType,
          industryDetails: matchedIndustry || null,
          studentDetails: matchedStudent || null,
          availabilityHours: matchedStudent?.availabilityFrom && matchedStudent?.availabilityTo
            ? `${matchedStudent.availabilityFrom} - ${matchedStudent.availabilityTo}`
            : '09:00 AM - 05:00 PM',
          placementHours: matchedStudent?.placementHours ?? null,
          availabilityDays: availabilityDays || {},
          location: appt.location || '',
          meetingType: appt.meetingType || 'In-Person',
          position: appt.position || '',
          linkedReq: appt.linkedReq || '',
          linkedReqStatus: appt.linkedReqStatus || '',
          industryContactId: appt.industryContactId || '',
          status: appt.status || 'Scheduled',
          commencementDate: appt.commencementDate || '',
          expectedCompletionDate: appt.expectedCompletionDate || '',
          appointmentOutcome: appt.appointmentOutcome || '',
          notes: appt.notes || '',
          cancellationReason: appt.cancellationReason || '',
          cancellationType: appt.cancellationType || '',
          cancellationTypeLabel: appt.cancellationTypeLabel || '',
          cancelledAt: appt.cancelledAt || '',
          updatedAt: appt.updatedAt || '',
          createdAt: appt.createdAt || '',
        };
      })
      .sort((a, b) => {
        const tA = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
        const tB = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
        return tB - tA;
      });
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet, workflowStudents, inactiveSnoozedStudentKeys]);

  // ─── ✅ Map ALL appointments to internships ──────────────────────────────
  const mapInternshipsForStep4 = useCallback(() => {
    const result = [];
    const allAppointments = workflow?.appointments || [];

    const filteredAppointments = allAppointments.filter((appt) => {
      // Hide Inactive/Snoozed students from Step 4
      const apptStuId = norm(appt.studentId);
      const apptStuName = norm(appt.student);
      if (inactiveSnoozedStudentKeys.has(apptStuId) || inactiveSnoozedStudentKeys.has(apptStuName)) return false;
      const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
      if (!shouldFilter) return true;
      return visibleStudentKeySet.has(apptStuId) || visibleStudentKeySet.has(apptStuName);
    });

    filteredAppointments.forEach((appt, index) => {
      const studentName = appt.student || 'Unknown Student';
      const studentId = appt.studentId || '';

      const stuMatch = (visibleWorkflowStudents || []).find((s) => {
        const sDbId = norm(s.id || s._id);
        const sBizId = norm(s.studentId);
        const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
        const targetId = norm(studentId);
        const targetName = norm(studentName);
        return (
          (sDbId && targetId && sDbId === targetId) ||
          (sBizId && targetId && sBizId === targetId) ||
          (sName && targetName && sName === targetName)
        );
      });

      const startDate = appt.commencementDate || '';
      let calculatedEnd = appt.expectedCompletionDate || '';
      if (!calculatedEnd && startDate) {
        calculatedEnd = calculatePlacementEndDate(
          startDate,
          stuMatch?.placementHours,
          stuMatch?.availabilityDays,
          stuMatch?.availabilityFrom,
          stuMatch?.availabilityTo
        );
      }
      const matchingInt = (workflow?.internships || []).find((i) => {
        const iId = norm(i.id || i._id);
        const aId = norm(appt.id || appt._id);
        const iApptId = norm(i.apptId || i._appointmentId);
        const sameStudent = (norm(i.studentId) === targetId || norm(i.student) === targetName);
        const sameCompany = norm(i.company) && norm(appt.company) && norm(i.company) === norm(appt.company);
        return (iId && aId && iId === aId) || (iApptId && aId && iApptId === aId) || (sameStudent && sameCompany);
      });

      // ── Resolve the correct status from appointment fields ─────────────────
      const resolveApptStatus = (a) => {
        if (
          a.status === 'Completed' ||
          a.status === 'Placement Completed' ||
          matchingInt?.status === 'Completed' ||
          matchingInt?.status === 'Placement Completed' ||
          stuMatch?.placementStatus === 'Placement Completed' ||
          stuMatch?.placementStatus === 'Completed'
        ) {
          return { status: 'Completed', cancellationReason: '', cancellationType: '' };
        }
        if (a.status === 'Not Suitable Site' || (a.status === 'Declined' && a.appointmentOutcome === 'not_suitable_site')) {
          return {
            status: 'Not Suitable Site',
            cancellationReason: a.cancellationReason || 'Placement site was not suitable for the student',
            cancellationType: a.cancellationType || 'student',
          };
        }
        if (a.status === 'Declined' || a.status === 'Industry Rejected') {
          return { status: 'Industry Rejected', cancellationReason: a.cancellationReason || 'Industry rejected the student', cancellationType: a.cancellationType || 'industry' };
        }
        if (a.status === 'Withdrawn' || a.status === 'Student Withdraw' || a.appointmentOutcome === 'student_withdrawal') {
          return { status: 'Student Withdraw', cancellationReason: a.cancellationReason || 'Student withdrew from placement', cancellationType: a.cancellationType || 'withdrawn' };
        }
        if (a.status === 'Cancelled') return { status: 'Cancelled', cancellationReason: a.cancellationReason || 'Appointment was cancelled', cancellationType: '' };
        if (a.status === 'No Show' || a.status === 'Student Missed Appointment') {
          return { status: 'Student Missed Appointment', cancellationReason: 'Student did not show up for appointment', cancellationType: 'student' };
        }
        if (matchingInt?.status && norm(matchingInt.company) === norm(a.company)) {
          return { status: matchingInt.status, cancellationReason: '', cancellationType: '' };
        }
        if (a.commencementDate && new Date(a.commencementDate) <= new Date()) {
          return { status: 'Placement Started', cancellationReason: '', cancellationType: '' };
        }
        if (a.status === 'Confirmed' || a.appointmentOutcome === 'successful') {
          return { status: 'Appointment Successful', cancellationReason: '', cancellationType: '' };
        }
        if (a.commencementDate) return { status: 'Waiting to Join', cancellationReason: '', cancellationType: '' };
        return { status: 'Waiting to Join', cancellationReason: '', cancellationType: '' };
      };

      // ── Every appointment gets its own row — never overwrite an existing one.
      // If a student has multiple appointments (e.g. first site declined, new site scheduled)
      // each appears as a separate placement row so history is preserved.
      const resolved = resolveApptStatus(appt);
      const status = resolved.status;
      const cancellationReason = resolved.cancellationReason;
      const cancellationType = resolved.cancellationType;
      const duration = '12 weeks';

      const isCompletedPlacement = status === 'Completed' || status === 'Placement Completed';

      const newItem = {
        id: (matchingInt && norm(matchingInt.company) === norm(appt.company) && (matchingInt._id || matchingInt.id)) || appt.id || appt._id || `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        intId: (matchingInt && norm(matchingInt.company) === norm(appt.company) && matchingInt.intId) || (appt.apptId ? `PL-${appt.apptId.replace(/^(APPT|INT|PL)[-_]*/i, '')}` : `PL-${String(result.length + 1).padStart(3, '0')}`),
        student: studentName,
        studentId: studentId,
        company: appt.company || matchingInt?.company || 'Unknown Company',
        title: matchingInt?.title || appt.position || 'Internship Placement',
        rto: matchingInt?.rto || appt.rto || 'TBD',
        status: status,
        start: (matchingInt && norm(matchingInt.company) === norm(appt.company) && matchingInt.start) || startDate,
        end: (matchingInt && norm(matchingInt.company) === norm(appt.company) && matchingInt.end) || calculatedEnd,
        duration: duration,
        workType: matchingInt?.workType || appt.meetingType || 'In-Person',
        location: matchingInt?.location || appt.location || 'TBD',
        coordinator: matchingInt?.coordinator || appt.interviewer || '',
        progress: isCompletedPlacement ? 100 : (matchingInt?.progress || 0),
        tasksCompleted: matchingInt?.tasksCompleted || '0',
        trainingCompleted: matchingInt?.trainingCompleted || '0',
        reviewsCompleted: matchingInt?.reviewsCompleted || '0',
        notes: matchingInt?.notes || appt.notes || '',
        _appointmentId: appt.id || appt._id,
        _appointmentDate: appt.date,
        _appointmentTime: appt.time,
        _appointmentStatus: appt.status,
        linkedReq: appt.linkedReq || '',
        createdAt: appt.createdAt || '',
        updatedAt: appt.updatedAt || '',
        appointmentOutcome: appt.appointmentOutcome || '',
        confirmedAt: appt.confirmedAt || '',
        cancelledAt: appt.cancelledAt || '',
        cancellationReason: cancellationReason || appt.cancellationReason || '',
        cancellationType: cancellationType || appt.cancellationType || '',
        contactedIndustries: appt.contactedIndustries || [],
      };

      result.push(newItem);
    });

    result.sort((a, b) => {
      const aIsActive = !['Student Withdraw', 'Withdrawn', 'Cancelled', 'Industry Rejected', 'Declined', 'Not Suitable Site'].includes(a.status) ? 1 : 0;
      const bIsActive = !['Student Withdraw', 'Withdrawn', 'Cancelled', 'Industry Rejected', 'Declined', 'Not Suitable Site'].includes(b.status) ? 1 : 0;
      if (bIsActive !== aIsActive) return bIsActive - aIsActive;
      const tA = new Date(a.createdAt || a.start || a.updatedAt || 0).getTime();
      const tB = new Date(b.createdAt || b.start || b.updatedAt || 0).getTime();
      return tB - tA;
    });

    return result;
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet, visibleWorkflowStudents, inactiveSnoozedStudentKeys]);

  // ─── Request handlers ──────────────────────────────────────────────────────

  const handleCreateRequest = useCallback(async (requestData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      const result = await createInternshipRequest(wfId, requestData);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      return result.data;
    } catch (err) {
      console.error('Failed to create request:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleUpdateRequest = useCallback(async (requestId, requestData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';

    // Step 1 "Change Placement Requirement" passes '__by_student__' because it only
    // has access to studentId, not the request's _id. WorkflowPage resolves the real reqId here.
    if (requestId === '__by_student__' && workflow?.requests) {
      const { studentId, studentName, ...rest } = requestData;
      const sId = norm(studentId);
      const sName = norm(studentName);

      const stuObj = (workflowStudents || []).find((s) => {
        const ids = [s.id, s._id, s.studentId].filter(Boolean).map(norm);
        const name = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
        return ids.includes(sId) || (sName && name === sName);
      });
      const allCandidateIds = stuObj
        ? [stuObj.id, stuObj._id, stuObj.studentId].filter(Boolean).map(norm)
        : [sId];

      const match = (workflow.requests || []).find((r) => {
        const rId = norm(r.studentId);
        const rName = norm(r.student);
        return allCandidateIds.includes(rId) || (sName && rName === sName);
      });

      if (match) {
        const realId = String(match._id || match.reqId || match.id || '');
        if (realId) {
          // When marking a student inactive, also set the request status to On Hold
          if (['Inactive', 'Snooze'].includes(rest.priority)) {
            rest.status = 'On Hold';
          } else if (match.status === 'On Hold') {
            rest.status = 'New';
          }
          rest.returnedToStep1 = ['Inactive', 'Snooze'].includes(rest.priority);
          const result = await updateInternshipRequest(wfId, realId, {
            ...rest,
            updatedBy: authUser?.name || authUser?.email || 'User',
          });

          // ── Sync Student status & internshipPriority ──
          if (studentId && rest.priority !== undefined) {
            const studentUpdate = { internshipPriority: rest.priority };
            if (rest.priority === 'Inactive') {
              studentUpdate.status = 'Inactive';
              studentUpdate.placementStatus = 'N/A';
            } else if (rest.priority === 'Snooze') {
              studentUpdate.snoozed = true;
              studentUpdate.placementStatus = 'N/A';
            } else if (['Normal', 'Urgent'].includes(rest.priority)) {
              studentUpdate.status = 'Active';
              studentUpdate.snoozed = false;
              studentUpdate.placementStatus = 'In Progress';
            }
            updateStudent(studentId, studentUpdate).catch((err) =>
              console.error('Failed to sync student status and priority:', err)
            );
          }

          await refreshWorkflowData();
      notifyPlacementDataChanged();
          return result?.data;
        }
      } else {
        // No existing request found — create one with the specified priority
        const studentIdentifier = String(studentId || stuObj?.studentId || stuObj?.id || '');
        const requestDataPayload = {
          title: `${stuObj?.course || stuObj?.courseQualification || 'Internship'} Placement`,
          student: studentName || stuObj?.name || 'Student',
          studentId: studentIdentifier,
          company: 'Pending Assignment',
          rto: stuObj?.rto || stuObj?.assignedRto || 'TBD',
          priority: rest.priority || 'Normal',
          status: ['Inactive', 'Snooze'].includes(rest.priority) ? 'On Hold' : 'New',
          returnedToStep1: ['Inactive', 'Snooze'].includes(rest.priority),
        };
        const created = await createInternshipRequest(wfId, requestDataPayload);
        if (studentId && rest.priority !== undefined) {
          const studentUpdate = { internshipPriority: rest.priority };
          if (rest.priority === 'Inactive') {
            studentUpdate.status = 'Inactive';
            studentUpdate.placementStatus = 'N/A';
          } else if (rest.priority === 'Snooze') {
            studentUpdate.snoozed = true;
            studentUpdate.placementStatus = 'N/A';
          } else if (['Normal', 'Urgent'].includes(rest.priority)) {
            studentUpdate.status = 'Active';
            studentUpdate.snoozed = false;
            studentUpdate.placementStatus = 'In Progress';
          }
          updateStudent(studentId, studentUpdate).catch(() => {});
        }
        await refreshWorkflowData();
      notifyPlacementDataChanged();
        return created?.data;
      }
      return;
    }

    try {
      const result = await updateInternshipRequest(wfId, requestId, {
        ...requestData,
        updatedBy: authUser?.name || authUser?.email || 'User',
      });

      // ── Sync Student status & internshipPriority for direct request updates (Step 2) ──
      if (requestData.priority !== undefined) {
        const matchedReq = (workflow?.requests || []).find(
          (r) => String(r._id || r.reqId || r.id) === String(requestId)
        );
        const stuId = matchedReq?.studentId;
        if (stuId) {
          const studentUpdate = { internshipPriority: requestData.priority };
          if (requestData.priority === 'Inactive') {
            studentUpdate.status = 'Inactive';
            studentUpdate.placementStatus = 'N/A';
          } else if (requestData.priority === 'Snooze') {
            studentUpdate.snoozed = true;
            studentUpdate.placementStatus = 'N/A';
          } else if (['Normal', 'Urgent'].includes(requestData.priority)) {
            studentUpdate.status = 'Active';
            studentUpdate.snoozed = false;
            studentUpdate.placementStatus = 'In Progress';
          }
          updateStudent(stuId, studentUpdate).catch((err) =>
            console.error('Failed to sync student status and priority:', err)
          );
        }
      }

      await refreshWorkflowData();
      notifyPlacementDataChanged();
      return result.data;
    } catch (err) {
      console.error('Failed to update request:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData, authUser, workflowStudents]);

  const handleDeleteRequest = useCallback(async (requestId) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    // Optimistic UI update
    setWorkflow((prev) =>
      prev
        ? {
          ...prev,
          requests: (prev.requests || []).filter(
            (r) =>
              String(r._id) !== String(requestId) &&
              r.reqId !== String(requestId) &&
              r.id !== String(requestId)
          ),
        }
        : prev
    );
    try {
      await deleteInternshipRequest(wfId, requestId);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to delete request:', err);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleCreateAppointment = useCallback(async (appointmentData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';

    // ── Block if student already has an active placement ─────────────────────
    // A student can only have one active placement at a time.
    // Active = appointment is Scheduled, Confirmed, or commencement date has passed.
    const studentId = appointmentData.studentId || '';
    const ACTIVE_STATUSES = ['Scheduled', 'Confirmed'];
    const hasActivePlacement = studentId && (workflow?.appointments || []).some((a) => {
      if (!ACTIVE_STATUSES.includes(a.status)) return false;
      const aStuId = (a.studentId || '').trim();
      return aStuId && aStuId === studentId;
    });
    if (hasActivePlacement) {
      const err = new Error(
        `${appointmentData.student || 'This student'} already has an active placement. ` +
        `The current placement must be completed, declined, or withdrawn before a new one can be created.`
      );
      err.isActiveplacementBlock = true;
      throw err;
    }

    try {
      const result = await createAppointment(wfId, appointmentData);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      return result.data;
    } catch (err) {
      console.error('Failed to create appointment:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleUpdateAppointment = useCallback(async (appointmentId, appointmentData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      console.log('📤 Updating appointment:', appointmentId, appointmentData);
      const result = await updateAppointment(wfId, appointmentId, appointmentData);
      console.log('✅ Appointment updated:', result);

      // Sync matching Step 2 Placement Request if appointment status changed
      if (appointmentData.status) {
        const apptObj = (workflow?.appointments || []).find(
          (a) => String(a._id) === String(appointmentId) || a.id === appointmentId || a.apptId === appointmentId
        );
        const studentId = apptObj?.studentId;
        const studentName = apptObj?.student;

        const matchingReq = (workflow?.requests || []).find(
          (r) =>
            (studentId && (r.studentId === studentId || r.id === studentId)) ||
            (studentName && r.student && r.student.toLowerCase() === studentName.toLowerCase())
        );

        if (matchingReq) {
          const reqId = matchingReq._id || matchingReq.id || matchingReq.reqId;
          let targetReqStatus = null;

          if (appointmentData.status === 'Completed' || appointmentData.status === 'Confirmed') {
            targetReqStatus = 'Approved';
          } else if (appointmentData.status === 'Withdrawn' || appointmentData.status === 'Student Withdraw') {
            targetReqStatus = 'Student Withdraw';
          } else if (appointmentData.status === 'Declined' || appointmentData.status === 'Industry Rejected') {
            targetReqStatus = 'Industry Rejected';
          } else if (appointmentData.status === 'Not Suitable Site') {
            targetReqStatus = 'Not Suitable Site';
          } else if (appointmentData.status === 'Student Missed Appointment' || appointmentData.status === 'No Show') {
            targetReqStatus = 'Student Missed Appointment';
          } else if (appointmentData.status === 'Cancelled') {
            targetReqStatus = 'Cancelled';
          }

          if (targetReqStatus) {
            try {
              await updateInternshipRequest(wfId, reqId, {
                status: targetReqStatus,
                cancellationReason: appointmentData.cancellationReason || '',
                notes: appointmentData.notes || '',
              });
            } catch (rErr) {
              console.log('Sync request status error:', rErr);
            }
          }
        }
      }

      // ── Auto-create Step 4 internship when outcome is successful ────────
      if (
        appointmentData.appointmentOutcome === 'successful' ||
        appointmentData.status === 'Confirmed' ||
        appointmentData.status === 'Completed'
      ) {
        if (appointmentData.commencementDate) {
          const apptObj = (workflow?.appointments || []).find(
            (a) =>
              String(a._id) === String(appointmentId) ||
              a.id === appointmentId ||
              a.apptId === appointmentId
          );

          if (apptObj) {
            // Only create if no internship already exists for this student + company
            const alreadyExists = (workflow?.internships || []).some(
              (i) =>
                i.studentId === apptObj.studentId &&
                i.company === apptObj.company
            );

            if (!alreadyExists) {
              try {
                const matchingReqForInt = (workflow?.requests || []).find(
                  (r) =>
                    r.studentId === apptObj.studentId ||
                    (apptObj.student && r.student &&
                      r.student.toLowerCase() === apptObj.student.toLowerCase())
                );

                await createInternship(wfId, {
                  title: apptObj.position || matchingReqForInt?.title || 'Internship Placement',
                  student: apptObj.student,
                  studentId: apptObj.studentId,
                  company: apptObj.company,
                  rto: apptObj.rto || matchingReqForInt?.rto || '',
                  status: 'Waiting to Join',
                  start: appointmentData.commencementDate,
                  end: appointmentData.expectedCompletionDate || '',
                  duration: matchingReqForInt?.duration || '',
                  workType: matchingReqForInt?.workType || '',
                  location: apptObj.location || matchingReqForInt?.location || '',
                  coordinator: matchingReqForInt?.coordinator || '',
                  notes: appointmentData.notes || apptObj.notes || '',
                });
                console.log('✅ Step 4 internship auto-created for', apptObj.student);
              } catch (intErr) {
                // Non-fatal — Step 4 can still be created manually
                console.warn('Auto-create internship skipped:', intErr.message);
              }
            }
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────

      await refreshWorkflowData();
      notifyPlacementDataChanged();

      // Navigation: Only go to Step 4 if successful placement.
      // Do NOT kick back to Step 1 on rejection/withdrawal — keep student visible in Step 3!
      if (
        appointmentData.appointmentOutcome === 'successful' ||
        (appointmentData.status === 'Confirmed' && !['industry_rejected', 'student_withdrawal', 'student_missed', 'not_suitable_site'].includes(appointmentData.appointmentOutcome))
      ) {
        goToStep(4);
      }

      return result.data;
    } catch (err) {
      console.error('Failed to update appointment:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData, goToStep]);

  const handleDeleteAppointment = useCallback(async (appointmentId) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    // Optimistic UI update
    setWorkflow((prev) =>
      prev
        ? {
          ...prev,
          appointments: (prev.appointments || []).filter(
            (a) =>
              String(a._id) !== String(appointmentId) &&
              a.apptId !== String(appointmentId) &&
              a.id !== String(appointmentId)
          ),
        }
        : prev
    );
    try {
      console.log('🗑️ Deleting appointment:', appointmentId);
      const result = await deleteAppointment(wfId, appointmentId);
      console.log('✅ Appointment deleted:', result);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      return result;
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleCreateInternship = useCallback(async (internshipData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      const result = await createInternship(wfId, internshipData);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      return result.data;
    } catch (err) {
      console.error('Failed to create internship:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleUpdateInternship = useCallback(async (internshipId, internshipData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      const result = await updateInternship(wfId, internshipId, internshipData);

      // Find student and synchronize StudentModel placementStatus
      if (internshipData.status) {
        const allInts = workflow?.internships || [];
        const allAppts = workflow?.appointments || [];
        const matched = allInts.find(i => String(i._id) === String(internshipId) || i.intId === internshipId || String(i.id) === String(internshipId)) ||
                        allAppts.find(a => String(a._id) === String(internshipId) || a.apptId === internshipId || String(a.id) === String(internshipId));
        const stuName = internshipData.student || matched?.student;
        const stuId = internshipData.studentId || matched?.studentId;

        const canonicalStatus =
          ['Withdrawn', 'Student Withdraw', 'Student Withdrawn'].includes(internshipData.status) ? 'Student Withdraw' :
          ['Declined', 'Industry Rejected'].includes(internshipData.status) ? 'Industry Rejected' :
          ['Student Missed Appointment', 'No Show'].includes(internshipData.status) ? 'Student Missed Appointment' :
          internshipData.status === 'Not Suitable Site' ? 'Not Suitable Site' :
          ['Placement Completed', 'Completed'].includes(internshipData.status) ? 'Placement Completed' :
          ['Placement Started', 'Active', 'Joined'].includes(internshipData.status) ? 'Placement Started' :
          ['Waiting to Join'].includes(internshipData.status) ? 'Waiting to Join' :
          internshipData.status;

        const targetStu = (workflowStudents || []).find(s =>
          (stuId && (s.studentId === stuId || String(s._id || s.id) === String(stuId))) ||
          (stuName && (s.name?.trim().toLowerCase() === String(stuName).trim().toLowerCase() ||
           `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === String(stuName).trim().toLowerCase()))
        );

        const stuDbId = targetStu?.id || targetStu?._id || stuId;
        if (stuDbId) {
          try {
            await updateStudent(stuDbId, { placementStatus: canonicalStatus });
          } catch (_) {}
        }
      }

      await refreshWorkflowData();
      notifyPlacementDataChanged();
      notifyPlacementDataChanged();
      return result.data;
    } catch (err) {
      console.error('Failed to update internship:', err);
      throw err;
    }
  }, [workflowId, workflow, workflowStudents, refreshWorkflowData]);

  const handleDeleteInternship = useCallback(async (internshipId) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    // Optimistic UI update
    setWorkflow((prev) =>
      prev
        ? {
          ...prev,
          internships: (prev.internships || []).filter(
            (i) =>
              String(i._id) !== String(internshipId) &&
              i.intId !== String(internshipId) &&
              i.id !== String(internshipId)
          ),
          appointments: (prev.appointments || []).filter(
            (a) =>
              String(a._id) !== String(internshipId) &&
              a.apptId !== String(internshipId) &&
              a.id !== String(internshipId)
          ),
        }
        : prev
    );
    try {
      await deleteInternship(wfId, internshipId);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to delete internship:', err);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleBulkDeleteRequests = useCallback(async (requestIds) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      await bulkDeleteInternshipRequests(wfId, requestIds);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to bulk delete requests:', err);
      for (const id of requestIds) {
        try { await deleteInternshipRequest(wfId, id); } catch (_) {}
      }
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleBulkDeleteAppointments = useCallback(async (appointmentIds) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      await bulkDeleteAppointments(wfId, appointmentIds);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to bulk delete appointments:', err);
      for (const id of appointmentIds) {
        try { await deleteAppointment(wfId, id); } catch (_) {}
      }
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleBulkDeleteInternships = useCallback(async (internshipIds) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      await bulkDeleteInternships(wfId, internshipIds);
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    } catch (err) {
      console.error('Failed to bulk delete internships:', err);
      for (const id of internshipIds) {
        try { await deleteInternship(wfId, id); } catch (_) {}
      }
      await refreshWorkflowData();
      notifyPlacementDataChanged();
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  // ─── Coordinator assigned from Step1 — update local student list ────────
  const handleCoordinatorAssigned = useCallback(({ studentId, coordinatorId, coordinatorName }) => {
    setWorkflowStudents(prev =>
      prev.map(s =>
        (s.id === studentId || s._id === studentId)
          ? { ...s, assignedCoordinator: coordinatorId || null, assignedCoordinatorName: coordinatorName || '' }
          : s
      )
    );
  }, []);

  const handleToggleStudent = useCallback(async (studentId, isSelected) => {
    if (!workflowId) return;
    try {
      if (isSelected) {
        const result = await addStudentsToWorkflow(workflowId, [studentId]);
        if (result.data) setWorkflow(result.data);
      } else {
        const result = await removeStudentFromWorkflow(workflowId, studentId);
        if (result.data) setWorkflow(result.data);
      }
    } catch (err) {
      console.error('Failed to toggle student in workflow:', err);
    }
  }, [workflowId]);

  const getSelectedStudentIds = useCallback(() => {
    if (!workflow?.students) return [];
    return workflow.students.map((s) => s.id || s._id || s.toString());
  }, [workflow]);

  const internshipRequestMap = React.useMemo(() => {
    const map = {};
    if (workflow?.requests && Array.isArray(workflow.requests)) {
      workflow.requests.forEach((req) => {
        const priorityVal = req.priority || 'Normal';
        if (req.studentId) {
          map[req.studentId] = priorityVal;
          map[norm(req.studentId)] = priorityVal;
        }
        if (req.student) {
          map[req.student] = priorityVal;
          map[norm(req.student)] = priorityVal;
        }
        if (req.id) map[req.id] = priorityVal;
        if (req._id) map[String(req._id)] = priorityVal;
      });
    }
    return map;
  }, [workflow]);



  // ─── Render ────────────────────────────────────────────────────────────────

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-medium">Loading workflow data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md">
            <p className="text-rose-600 font-semibold mb-2">Failed to load workflow</p>
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        </div>
      );
    }

    switch (activeStep) {
      case 1:
        // 🔒 Step 1 (Students) is Admin-only. Coordinators get redirected via the
        // effect above; this guard just prevents a flash of the students table
        // while that redirect is in flight.
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center py-20">
              <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md">
                <p className="text-amber-700 font-semibold mb-2">Access Restricted</p>
                <p className="text-sm text-amber-600">
                  The Students step is only available to administrators. Redirecting you to Placement Requests…
                </p>
              </div>
            </div>
          );
        }
        return (
          <WorkflowStep1Students
            initialSearch={searchParam}
            students={mapStudentsForStep1()}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onUpdateRequest={handleUpdateRequest}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
            onCoordinatorAssigned={handleCoordinatorAssigned}
            coordinators={coordinators}
            onRefreshWorkflow={refreshWorkflowData}
          />
        );
      case 2:
        return (
          <WorkflowStep2Requests
            initialSearch={searchParam}
            requests={mapRequestsForStep2(true)}
            onBack={() => goToStep(1)}
            onNext={handleStep2Next}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            onBulkDeleteRequests={handleBulkDeleteRequests}
            onAddContact={handleAddContactToRequest}
            students={mapStudentsForStep1()}
            activeStudent={activeWorkflowStudent}
            appointments={mapAppointmentsForStep3()}
            onRefreshStudents={refreshWorkflowData}
          />
        );
      case 3:
        return (
          <WorkflowStep3Appointments
            initialSearch={searchParam}
            appointments={mapAppointmentsForStep3()}
            onBack={() => goToStep(2)}
            onNext={handleStep3Next}
            onCreateAppointment={handleCreateAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onBulkDeleteAppointments={handleBulkDeleteAppointments}
            students={mapStudentsForStep1()}
            requests={mapRequestsForStep2()}
            activeStudent={activeWorkflowStudent}
            activeRequest={activeWorkflowRequest}
            activeCompany={activeWorkflowCompany}
            prefilledAppointmentData={prefilledAppointmentData}
            onClearPrefilledData={() => setPrefilledAppointmentData(null)}
          />
        );
      case 4:
        return (
          <WorkflowStep4Internships
            initialSearch={searchParam}
            internships={mapInternshipsForStep4()}
            appointments={mapAppointmentsForStep3()}
            requests={mapRequestsForStep2()}
            onBack={() => goToStep(3)}
            onCreateInternship={handleCreateInternship}
            onUpdateInternship={handleUpdateInternship}
            onDeleteInternship={handleDeleteInternship}
            onBulkDeleteInternships={handleBulkDeleteInternships}
            onDeleteAppointment={handleDeleteAppointment}
            students={mapStudentsForStep1()}
          />
        );
      case 5:
        return (
          <WorkflowStep5Payments
            initialSearch={searchParam}
            inactiveSnoozedMap={inactiveSnoozedStudentMap}
          />
        );
      default:
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center py-20">
              <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md">
                <p className="text-amber-700 font-semibold mb-2">Access Restricted</p>
                <p className="text-sm text-amber-600">
                  The Students step is only available to administrators.
                </p>
              </div>
            </div>
          );
        }
        return (
          <WorkflowStep1Students
            initialSearch={searchParam}
            students={mapStudentsForStep1()}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onUpdateRequest={handleUpdateRequest}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
            onCoordinatorAssigned={handleCoordinatorAssigned}
            coordinators={coordinators}
            onRefreshWorkflow={refreshWorkflowData}
          />
        );
    }
  };

  return (
    <WorkFlowLayout
      title="Workflow"
      breadcrumbs={['Dashboard', 'Workflow', STEP_LABELS[activeStep - 1]]}
      stepLabels={STEP_LABELS}
      activeStep={activeStep}
      onStepChange={goToStep}
    >
      {/* Coordinator view switcher / banner */}
      <div className="mb-5">
        {isAdmin ? (
          <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Coordinator View & Progress Filter</h4>
                <p className="text-[10px] text-slate-400">Select any coordinator to filter students, requests, appointments, internships & placement hours</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Coordinator:</label>
              <select
                value={selectedCoordinator}
                onChange={(e) => setSelectedCoordinator(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="All">All Coordinators ({workflowStudents.length} students)</option>
                {coordinators.map((c) => {
                  const count = workflowStudents.filter(s =>
                    (s.assignedCoordinator && String(s.assignedCoordinator) === String(c._id || c.id)) ||
                    (s.assignedCoordinatorName && s.assignedCoordinatorName.toLowerCase() === (c.name || '').toLowerCase())
                  ).length;
                  return (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.role || 'Coordinator'}) — {count} student(s)
                    </option>
                  );
                })}
                <option value="unassigned">Unassigned ({workflowStudents.filter(s => !s.assignedCoordinator && !s.assignedCoordinatorName).length})</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-900 font-semibold">
                Viewing assigned workflow for <span className="font-bold">{authUser?.name || 'your students'}</span> ({visibleWorkflowStudents.length} student(s))
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Coordinator Scope
            </span>
          </div>
        )}
      </div>

      {renderStepContent()}
    </WorkFlowLayout>
  );
}
