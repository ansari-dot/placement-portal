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
} from '../api/workflowApi';
import { calculatePlacementEndDate } from '../utils/dateCalculation';
import { updateStudent } from '../api/studentsApi';

const STEP_LABELS = ['Students', 'Placement Requests', 'Appointments', 'Placements'];

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
  const [activeStep, setActiveStep] = useState(
    stepParam >= 1 && stepParam <= 4 ? stepParam : 1
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
        setCoordinators(res?.data ?? []);
      })
      .catch(() => {});
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
          if (stepFromUrl >= 1 && stepFromUrl <= 4) {
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
      } catch (_) {}
    };
    window.addEventListener('focus', refreshStudents);
    return () => window.removeEventListener('focus', refreshStudents);
  }, []);

  useEffect(() => {
    if (stepParam >= 1 && stepParam <= 4) {
      setActiveStep(stepParam);
    }
  }, [stepParam]);

  const goToStep = useCallback(async (step) => {
    setActiveStep(step);
    setSearchParams({ step: String(step) });

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
  }, [workflowId, setSearchParams]);

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
          const requestData = {
            title: `${student.course || 'Internship'} Placement`,
            student: student.name,
            studentId: student.id || student.studentId,
            company: 'Pending Assignment',
            rto: student.rto || 'TBD',
            priority: resolvedPriority,
            status: resolvedPriority === 'Inactive' ? 'On Hold' : 'New',
            returnedToStep1: resolvedPriority === 'Inactive',
          };
          await createInternshipRequest(workflowId, requestData);

          // ── Sync Student.internshipPriority so Score tab reflects Inactive ──
          // The Score backend reads Student.internshipPriority directly.
          const stuId = student.id || student.studentId;
          if (stuId) {
            updateStudent(stuId, {
              internshipPriority: resolvedPriority === 'Inactive' ? 'Inactive' : '',
            }).catch((err) =>
              console.error('Failed to sync internshipPriority on new request:', err)
            );
          }

          await refreshWorkflowData();
        } catch (err) {
          console.error('Failed to create internship request in backend:', err);
        }
      }
    }
    goToStep(2);
  }, [workflowId, goToStep, refreshWorkflowData]);

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
      });
      await refreshWorkflowData();
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
      const currentUserId   = String(authUser._id || authUser.id || '').trim();
      const currentUserName = String(authUser.name || '').trim().toLowerCase();

      return workflowStudents.filter((stu) => {
        const assignedId   = String(stu.assignedCoordinator   || '').trim();
        const assignedName = String(stu.assignedCoordinatorName || '').trim().toLowerCase();

        // Match by ObjectId string OR coordinator name (fallback)
        return (
          (currentUserId   && assignedId   && assignedId   === currentUserId) ||
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
    const coordId   = String(selectedCoord?._id || selectedCoord?.id || selectedCoordinator).trim();
    const coordName = String(selectedCoord?.name || '').trim().toLowerCase();

    return workflowStudents.filter((stu) => {
      const assignedId   = String(stu.assignedCoordinator   || '').trim();
      const assignedName = String(stu.assignedCoordinatorName || '').trim().toLowerCase();
      return (
        (assignedId   && assignedId   === coordId) ||
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

  // ─── Mapping helpers ───────────────────────────────────────────────────────
  // ID-only matching — name fallback is intentionally removed because two students
  // can share the same name. Workflow sub-docs store studentId; if absent, no match.

  const findRequestsForStudent = useCallback((stu) => {
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);

    return (workflow?.requests || []).filter((r) => {
      const reqStudentId = norm(r.studentId);
      return (
        (reqStudentId && stuDbId && reqStudentId === stuDbId) ||
        (reqStudentId && stuBizId && reqStudentId === stuBizId)
      );
    });
  }, [workflow]);

  const findAppointmentsForStudent = useCallback((stu) => {
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);

    return (workflow?.appointments || []).filter((a) => {
      const apptStudentId = norm(a.studentId);
      return (
        (apptStudentId && stuDbId && apptStudentId === stuDbId) ||
        (apptStudentId && stuBizId && apptStudentId === stuBizId)
      );
    });
  }, [workflow]);

  const mapStudentsForStep1 = useCallback(() => {
    if (!visibleWorkflowStudents || visibleWorkflowStudents.length === 0) return [];

    return visibleWorkflowStudents.map((stu) => {
      const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
      const stuDbId = norm(stu.id || stu._id);
      const stuBizId = norm(stu.studentId);
      const stuName = norm(stu.name || stuFullName);

      const matchingRequests = findRequestsForStudent(stu);
      const matchingAppointments = findAppointmentsForStudent(stu);
      const activeRequests = matchingRequests.filter((request) => request.returnedToStep1 !== true);
      const contactedIndustries = activeRequests.flatMap((r) => r.contactedIndustries || []);

      const hasRequest = activeRequests.length > 0;
      const hasContacted = contactedIndustries.length > 0;

      const now = new Date();

      // ── Internship records for this student ──────────────────────────────
      const matchingInternships = (workflow?.internships || []).filter((i) => {
        const iStuId = norm(i.studentId);
        return (
          (iStuId && stuDbId && iStuId === stuDbId) ||
          (iStuId && stuBizId && iStuId === stuBizId)
        );
      });

      // ── Sort appointments newest-first so the latest outcome wins ────────
      const sortedAppointments = [...matchingAppointments].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || a.date || 0);
        const bDate = new Date(b.updatedAt || b.createdAt || b.date || 0);
        return bDate - aDate;
      });

      const TERMINAL_APPT_STATUSES = ['Cancelled', 'Withdrawn', 'Declined', 'No Show', 'Not Suitable Site', 'Industry Rejected', 'Student Missed Appointment'];
      const ACTIVE_APPT_STATUSES   = ['Scheduled', 'Confirmed'];

      // The most recent NON-terminal appointment wins over any terminal one.
      // If there is any active (Scheduled/Confirmed) appointment, that takes precedence
      // over any Withdrawn/Declined appointment regardless of date order.
      const hasAnyActive    = sortedAppointments.some((a) => ACTIVE_APPT_STATUSES.includes(a.status));
      const mostRecentAppt  = hasAnyActive
        ? sortedAppointments.find((a) => ACTIVE_APPT_STATUSES.includes(a.status))
        : sortedAppointments[0];
      const mostRecentIsTerminal = !hasAnyActive && mostRecentAppt && TERMINAL_APPT_STATUSES.includes(mostRecentAppt.status);

      // ── Terminal / outcome statuses — highest precedence first ───────────

      // Placement Completed
      const hasCompleted =
        matchingInternships.some((i) => i.status === 'Completed') ||
        sortedAppointments.some(
          (a) => a.appointmentOutcome === 'successful' && a.status === 'Completed'
        );

      const hasStartedPlacement =
        !hasCompleted && !mostRecentIsTerminal && (
          matchingInternships.some((i) =>
            i.status === 'Placement Started' ||
            i.status === 'Active' ||
            (
              i.start &&
              !['Declined', 'Industry Rejected', 'Student Missed Appointment', 'Withdrawn', 'Cancelled', 'Completed', 'Not Suitable Site'].includes(i.status) &&
              !isNaN(new Date(i.start).getTime()) &&
              new Date(i.start) <= now
            )
          ) ||
          sortedAppointments.some((a) => {
            if (TERMINAL_APPT_STATUSES.includes(a.status)) return false;
            // Confirmed = placement outcome successful, treat as started
            if (a.status === 'Confirmed') return true;
            if (a.commencementDate) {
              const cDate = new Date(a.commencementDate);
              return !isNaN(cDate.getTime()) && cDate <= now;
            }
            return false;
          })
        );

      // Student Withdraw — most recent appointment or any internship is withdrawn
      const hasStudentWithdraw =
        !hasCompleted && !hasStartedPlacement && (
          stu.placementStatus === 'Student Withdraw' ||
          sortedAppointments.some((a) =>
            a.status === 'Withdrawn' ||
            a.status === 'Student Withdraw' ||
            a.appointmentOutcome === 'student_withdrawal' ||
            a.cancellationType === 'withdrawn'
          ) ||
          matchingInternships.some((i) => i.status === 'Withdrawn')
        );

      // Not Suitable Site — site was deemed inappropriate
      const hasNotSuitableSite =
        !hasCompleted && !hasStartedPlacement && !hasStudentWithdraw && (
          stu.placementStatus === 'Not Suitable Site' ||
          sortedAppointments.some((a) =>
            a.status === 'Not Suitable Site' ||
            a.appointmentOutcome === 'not_suitable_site' ||
            (a.status === 'Declined' && a.cancellationTypeLabel === 'Not Suitable Site')
          )
        );

      // Industry Rejected — industry declined the student
      const hasIndustryRejected =
        !hasCompleted && !hasStartedPlacement && !hasStudentWithdraw && !hasNotSuitableSite && (
          stu.placementStatus === 'Industry Rejected' ||
          sortedAppointments.some((a) =>
            a.status === 'Industry Rejected' ||
            (a.status === 'Declined' && a.appointmentOutcome !== 'not_suitable_site') ||
            a.appointmentOutcome === 'industry_rejected' ||
            (a.cancellationType === 'industry' && a.status === 'Cancelled')
          ) ||
          matchingInternships.some((i) => i.status === 'Declined' || i.status === 'Industry Rejected')
        );

      // Student Missed Appointment — No Show
      const hasStudentMissed =
        !hasCompleted && !hasStartedPlacement &&
        !hasNotSuitableSite && !hasStudentWithdraw && !hasIndustryRejected &&
        (
          stu.placementStatus === 'Student Missed Appointment' ||
          sortedAppointments.some((a) => a.status === 'No Show' || a.status === 'Student Missed Appointment')
        );

      // Appointment Successful — outcome confirmed, not yet commenced
      const hasApptSuccessful =
        !hasCompleted && !hasStartedPlacement &&
        !hasNotSuitableSite && !hasStudentWithdraw && !hasIndustryRejected && !hasStudentMissed &&
        sortedAppointments.some((a) =>
          a.appointmentOutcome === 'successful' ||
          a.status === 'Confirmed'
        );

      // Appointment Scheduled — active upcoming appointment
      const hasScheduledAppt =
        !hasCompleted && !hasStartedPlacement &&
        !hasNotSuitableSite && !hasStudentWithdraw && !hasIndustryRejected &&
        !hasStudentMissed && !hasApptSuccessful &&
        sortedAppointments.some((a) =>
          a.status === 'Scheduled' ||
          (a.date && !['Cancelled', 'Withdrawn', 'Declined', 'No Show', 'Not Suitable Site', 'Industry Rejected', 'Student Missed Appointment'].includes(a.status))
        );

      // ── Derive final status ───────────────────────────────────────────────
      let dynamicPlacementStatus = 'Awaiting';
      if (hasCompleted) {
        dynamicPlacementStatus = 'Placement Completed';
      } else if (hasStartedPlacement) {
        dynamicPlacementStatus = 'Placement Started';
      } else if (hasNotSuitableSite) {
        dynamicPlacementStatus = 'Not Suitable Site';
      } else if (hasStudentWithdraw) {
        dynamicPlacementStatus = 'Student Withdraw';
      } else if (hasIndustryRejected) {
        dynamicPlacementStatus = 'Industry Rejected';
      } else if (hasStudentMissed) {
        dynamicPlacementStatus = 'Student Missed Appointment';
      } else if (hasApptSuccessful) {
        dynamicPlacementStatus = 'Appointment Successful';
      } else if (hasScheduledAppt) {
        dynamicPlacementStatus = 'Appointment Scheduled';
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
        rto: stu.assignedRto || stu.rto || '',
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
  }, [visibleWorkflowStudents, findRequestsForStudent, findAppointmentsForStudent, workflow]);

  const mapRequestsForStep2 = useCallback((excludeReturnedToStep1 = false) => {
    if (!workflow?.requests || workflow.requests.length === 0) return [];

    return workflow.requests
      .filter((req) => {
        if (excludeReturnedToStep1 && req.returnedToStep1 === true) return false;
        // Coordinators always see only their students; admins filter only when a coordinator is selected
        const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
        if (!shouldFilter) return true;
        const reqStuId   = norm(req.studentId);
        const reqStuName = norm(req.student);
        return visibleStudentKeySet.has(reqStuId) || visibleStudentKeySet.has(reqStuName);
      })
      .map((req) => {
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
        };
      });
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet, workflowStudents, coordinators]);

  const mapAppointmentsForStep3 = useCallback(() => {
    if (!workflow?.appointments || workflow.appointments.length === 0) {
      return [];
    }

    return workflow.appointments
      .filter((appt) => {
        const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
        if (!shouldFilter) return true;
        const apptStuId   = norm(appt.studentId);
        const apptStuName = norm(appt.student);
        return visibleStudentKeySet.has(apptStuId) || visibleStudentKeySet.has(apptStuName);
      })
      .map((appt) => {
        const stuDbId = norm(appt.studentId);
        const stuName = norm(appt.student);

        // Find matching student
        const matchedStudent = workflowStudents.find((stu) => {
          const identifiers = [
            stu.id,
            stu._id,
            stu.studentId,
            stu.name,
            `${stu.firstName || ''} ${stu.lastName || ''}`
          ].map(norm);
          return identifiers.includes(stuDbId) || identifiers.includes(stuName);
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
          availabilityDays: matchedStudent?.availabilityDays || {},
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
      });
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet, workflowStudents]);

  // ─── ✅ Map ALL appointments to internships ──────────────────────────────
  const mapInternshipsForStep4 = useCallback(() => {
    const result = [];
    const allAppointments = workflow?.appointments || [];

    const filteredAppointments = allAppointments.filter((appt) => {
      const shouldFilter = !isAdmin || selectedCoordinator !== 'All';
      if (!shouldFilter) return true;
      const apptStuId   = norm(appt.studentId);
      const apptStuName = norm(appt.student);
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

      const startDate = appt.commencementDate || appt.date || new Date().toISOString().split('T')[0];
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
      if (!calculatedEnd && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 12 * 7);
        calculatedEnd = end.toISOString().split('T')[0];
      }

      const now = new Date();
      const hasCommenced = appt.commencementDate && new Date(appt.commencementDate) <= now;

      // ── Resolve the correct status from appointment fields ─────────────────
      const resolveApptStatus = (a) => {
        if (a.status === 'Completed') return { status: 'Completed', cancellationReason: '', cancellationType: '' };
        if (a.status === 'Not Suitable Site' || (a.status === 'Declined' && a.appointmentOutcome === 'not_suitable_site')) {
          return {
            status: 'Not Suitable Site',
            cancellationReason: a.cancellationReason || 'Placement site was not suitable for the student',
            cancellationType: a.cancellationType || 'student',
          };
        }
        if (a.status === 'Declined') return { status: 'Industry Rejected', cancellationReason: a.cancellationReason || 'Industry rejected the student', cancellationType: a.cancellationType || 'industry' };
        if (a.status === 'Industry Rejected') return { status: 'Industry Rejected', cancellationReason: a.cancellationReason || 'Industry rejected the student', cancellationType: a.cancellationType || 'industry' };
        if (a.status === 'Withdrawn') return { status: 'Withdrawn', cancellationReason: a.cancellationReason || 'Student withdrew from placement', cancellationType: a.cancellationType || 'withdrawn' };
        if (a.status === 'Cancelled') return { status: 'Cancelled', cancellationReason: a.cancellationReason || 'Appointment was cancelled', cancellationType: '' };
        if (a.status === 'No Show') return { status: 'Student Missed Appointment', cancellationReason: 'Student did not show up for appointment', cancellationType: 'student' };
        if (a.status === 'Student Missed Appointment') return { status: 'Student Missed Appointment', cancellationReason: 'Student did not show up for appointment', cancellationType: 'student' };
        if (a.status === 'Confirmed' || (a.commencementDate && new Date(a.commencementDate) <= new Date())) return { status: 'Placement Started', cancellationReason: '', cancellationType: '' };
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

      const newItem = {
        id: appt.id || appt._id || `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        intId: appt.apptId ? `INT-${appt.apptId.substring(4)}` : `INT-${String(result.length + 1).padStart(6, '0')}`,
        student: studentName,
        studentId: studentId,
        company: appt.company || 'Unknown Company',
        title: appt.position || 'Internship Placement',
        rto: appt.rto || 'TBD',
        status: status,
        start: startDate,
        end: calculatedEnd,
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
        cancellationReason: cancellationReason || appt.cancellationReason || '',
        cancellationType: cancellationType || appt.cancellationType || '',
        contactedIndustries: appt.contactedIndustries || [],
      };

      result.push(newItem);
    });

    return result;
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet]);

  // ─── Request handlers ──────────────────────────────────────────────────────

  const handleCreateRequest = useCallback(async (requestData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      const result = await createInternshipRequest(wfId, requestData);
      await refreshWorkflowData();
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
      const { studentId, ...rest } = requestData;
      const match = workflow.requests.find(
        (r) => r.studentId && studentId && norm(r.studentId) === norm(studentId)
      );
      if (match) {
        const realId = String(match._id || match.reqId || '');
        if (realId) {
          // When marking a student inactive, also set the request status to On Hold
          if (['Inactive', 'Snooze'].includes(rest.priority)) {
            rest.status = 'On Hold';
          } else if (match.status === 'On Hold') {
            rest.status = 'New';
          }
          rest.returnedToStep1 = ['Inactive', 'Snooze'].includes(rest.priority);
          const result = await updateInternshipRequest(wfId, realId, rest);

          // ── Sync Student.internshipPriority so Score tab reflects the change ──
          // The Score backend reads Student.internshipPriority directly; the workflow
          // request priority alone is not enough to update the count.
          if (studentId && rest.priority !== undefined) {
            const newPriority = rest.priority === 'Inactive' ? 'Inactive' : '';
            updateStudent(studentId, { internshipPriority: newPriority }).catch((err) =>
              console.error('Failed to sync internshipPriority on student:', err)
            );
          }

          await refreshWorkflowData();
          return result?.data;
        }
      }
      return; // No match — localStorage already updated by Step 1
    }

    try {
      const result = await updateInternshipRequest(wfId, requestId, requestData);

      // ── Sync Student.internshipPriority for direct request updates (Step 2) ──
      // When a request's priority is changed directly (e.g. from the Step 2 requests
      // table), keep Student.internshipPriority in sync so the Score tab stays correct.
      if (requestData.priority !== undefined) {
        // Find the matching request to get its studentId
        const matchedReq = (workflow?.requests || []).find(
          (r) => String(r._id || r.reqId || r.id) === String(requestId)
        );
        const stuId = matchedReq?.studentId;
        if (stuId) {
          const newPriority = requestData.priority === 'Inactive' ? 'Inactive' : '';
          updateStudent(stuId, { internshipPriority: newPriority }).catch((err) =>
            console.error('Failed to sync internshipPriority on student:', err)
          );
        }
      }

      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update request:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

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
    } catch (err) {
      console.error('Failed to delete request:', err);
      await refreshWorkflowData();
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
      return result;
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      await refreshWorkflowData();
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

  const handleCreateInternship = useCallback(async (internshipData) => {
    const wfId = workflowId || workflow?._id || workflow?.id || 'default';
    try {
      const result = await createInternship(wfId, internshipData);
      await refreshWorkflowData();
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
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update internship:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

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
    } catch (err) {
      console.error('Failed to delete internship:', err);
      await refreshWorkflowData();
      throw err;
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

    // Only use backend workflow requests — no localStorage (avoids stale data showing
    // Urgent/Normal badge on students who never had a request generated)
    if (workflow?.requests && Array.isArray(workflow.requests)) {
      workflow.requests.forEach((req) => {
        const priorityVal = req.priority || 'Normal';
        if (req.studentId) {
          map[req.studentId] = priorityVal;
          map[norm(req.studentId)] = priorityVal;
        }
        if (req.id)        map[req.id]          = priorityVal;
        if (req._id)       map[String(req._id)]  = priorityVal;
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
            students={mapStudentsForStep1()}
            initialSelectedStudentIds={getSelectedStudentIds()}
            onToggleStudent={handleToggleStudent}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onUpdateRequest={handleUpdateRequest}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
            onCoordinatorAssigned={handleCoordinatorAssigned}
            coordinators={coordinators}
          />
        );
      case 2:
        return (
          <WorkflowStep2Requests
            requests={mapRequestsForStep2(true)}
            onBack={() => goToStep(1)}
            onNext={handleStep2Next}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
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
            appointments={mapAppointmentsForStep3()}
            onBack={() => goToStep(2)}
            onNext={handleStep3Next}
            onCreateAppointment={handleCreateAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
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
            internships={mapInternshipsForStep4()}
            appointments={mapAppointmentsForStep3()}
            requests={mapRequestsForStep2()}
            onBack={() => goToStep(3)}
            onCreateInternship={handleCreateInternship}
            onUpdateInternship={handleUpdateInternship}
            onDeleteInternship={handleDeleteInternship}
            onDeleteAppointment={handleDeleteAppointment}
            students={mapStudentsForStep1()}
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
            students={mapStudentsForStep1()}
            initialSelectedStudentIds={getSelectedStudentIds()}
            onToggleStudent={handleToggleStudent}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onUpdateRequest={handleUpdateRequest}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
            onCoordinatorAssigned={handleCoordinatorAssigned}
            coordinators={coordinators}
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