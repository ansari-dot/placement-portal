// src/pages/WorkflowPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, UserCheck, Filter } from 'lucide-react';
import WorkFlowLayout from '../components/layout/WorkFlowLayout';
import WorkflowStep1Students from '../components/workflow/WorkflowStep1Students';
import WorkflowStep2Requests from '../components/workflow/WorkflowStep2Requests';
import WorkflowStep3Appointments from '../components/workflow/WorkflowStep3Appointments';
import WorkflowStep4Internships from '../components/workflow/WorkflowStep4Internships';
import WorkflowStep5PlacementHours from '../components/workflow/WorkflowStep5PlacementHours';
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

const STEP_LABELS = ['Students', 'Internship Requests', 'Appointments', 'Internships', 'Placement Hours'];

export const getResponseStyle = (response) => {
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
        setCoordinators(res?.data ?? []);
      })
      .catch(() => {});
  }, []);

  // ─── Refresh workflow data ────────────────────────────────────────────────
  const refreshWorkflowData = useCallback(async () => {
    if (!workflowId) return;
    try {
      console.log('🔄 Refreshing workflow data...');
      const updated = await fetchWorkflowById(workflowId);
      if (updated && updated.data) {
        console.log('✅ Workflow refreshed:', updated.data);
        setWorkflow(updated.data);
        return updated.data;
      }
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
          setWorkflowId(existing.id || existing._id);
          setWorkflow(existing);
          const stepFromUrl = parseInt(searchParams.get('step') || '', 10);
          if (stepFromUrl >= 1 && stepFromUrl <= 5) {
            setActiveStep(stepFromUrl);
          } else {
            setActiveStep(existing.currentStep || 1);
          }
        } else {
          const created = await createWorkflow({
            name: 'Internship Placement Workflow',
            description: 'Default internship placement workflow',
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

  useEffect(() => {
    if (stepParam >= 1 && stepParam <= 5) {
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

  const handleStep1Next = useCallback(async (student, priority) => {
    if (student) {
      setActiveWorkflowStudent(student);

      if (workflowId) {
        try {
          const requestData = {
            title: `${student.course || 'Internship'} Placement`,
            student: student.name,
            studentId: student.id || student.studentId,
            company: 'Pending Assignment',
            rto: student.rto || 'TBD',
            priority: priority || 'Normal',
            status: 'New',
          };
          await createInternshipRequest(workflowId, requestData);
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
    const currentUserId = authUser?._id || authUser?.id;
    const currentUserName = authUser?.name;

    return workflowStudents.filter((stu) => {
      if (!isAdmin) {
        // Coordinator sees ONLY their assigned students
        const isAssignedToMe =
          (stu.assignedCoordinator && currentUserId && norm(stu.assignedCoordinator) === norm(currentUserId)) ||
          (stu.assignedCoordinatorName && currentUserName && norm(stu.assignedCoordinatorName) === norm(currentUserName));
        return isAssignedToMe;
      } else {
        // Admin filter
        if (selectedCoordinator === 'All') return true;
        if (selectedCoordinator === 'unassigned') {
          return !stu.assignedCoordinator && !stu.assignedCoordinatorName;
        }
        const selectedCoord = coordinators.find((c) => (c._id || c.id) === selectedCoordinator);
        const coordId = selectedCoord?._id || selectedCoord?.id || selectedCoordinator;
        const coordName = selectedCoord?.name;
        return (
          (stu.assignedCoordinator && norm(stu.assignedCoordinator) === norm(coordId)) ||
          (stu.assignedCoordinatorName && coordName && norm(stu.assignedCoordinatorName) === norm(coordName))
        );
      }
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

  const findRequestsForStudent = useCallback((stu) => {
    const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
    const stuDbId = norm(stu.id || stu._id);
    const stuBizId = norm(stu.studentId);
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

  const mapStudentsForStep1 = useCallback(() => {
    if (!visibleWorkflowStudents || visibleWorkflowStudents.length === 0) return [];

    return visibleWorkflowStudents.map((stu) => {
      const stuFullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim();
      const matchingRequests = findRequestsForStudent(stu);

      return {
        name: stu.name || stuFullName,
        email: stu.emailAddress || stu.email || '',
        id: stu.id || stu._id || '',
        studentId: stu.studentId || '',
        rto: stu.assignedRto || stu.rto || '',
        status: stu.status || 'Active',
        placementStatus: stu.placementStatus || 'Ready',
        placementHours: stu.placementHours ?? null,
        assignedCoordinator: stu.assignedCoordinator || null,
        assignedCoordinatorName: stu.assignedCoordinatorName || '',
        addedOn: stu.createdAt
          ? new Date(stu.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        contactedIndustries: matchingRequests.flatMap((r) => r.contactedIndustries || []),
      };
    });
  }, [visibleWorkflowStudents, findRequestsForStudent]);

  const mapRequestsForStep2 = useCallback(() => {
    if (!workflow?.requests || workflow.requests.length === 0) return [];

    return workflow.requests
      .filter((req) => {
        if (!isAdmin || selectedCoordinator !== 'All') {
          const reqStuId = norm(req.studentId);
          const reqStuName = norm(req.student);
          return visibleStudentKeySet.has(reqStuId) || visibleStudentKeySet.has(reqStuName);
        }
        return true;
      })
      .map((req) => ({
        id: req.id || req._id || '',
        reqId: req.reqId || '',
        title: req.title || '',
        student: req.student || '',
        studentId: req.studentId || '',
        company: req.company || '',
        rto: req.rto || '',
        priority: req.priority || 'Normal',
        status: req.status || 'New',
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
      }));
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet]);

  const mapAppointmentsForStep3 = useCallback(() => {
    if (!workflow?.appointments || workflow.appointments.length === 0) {
      return [];
    }

    return workflow.appointments
      .filter((appt) => {
        if (!isAdmin || selectedCoordinator !== 'All') {
          const apptStuId = norm(appt.studentId);
          const apptStuName = norm(appt.student);
          return visibleStudentKeySet.has(apptStuId) || visibleStudentKeySet.has(apptStuName);
        }
        return true;
      })
      .map((appt) => ({
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
        location: appt.location || '',
        meetingType: appt.meetingType || 'In-Person',
        position: appt.position || '',
        linkedReq: appt.linkedReq || '',
        linkedReqStatus: appt.linkedReqStatus || '',
        industryContactId: appt.industryContactId || '',
        status: appt.status || 'Scheduled',
        notes: appt.notes || '',
        cancellationReason: appt.cancellationReason || '',
        cancellationType: appt.cancellationType || '',
        cancelledAt: appt.cancelledAt || '',
      }));
  }, [workflow, isAdmin, selectedCoordinator, visibleStudentKeySet]);

  // ─── ✅ Map ALL appointments to internships ──────────────────────────────
  const mapInternshipsForStep4 = useCallback(() => {
    const result = [];
    const allAppointments = workflow?.appointments || [];

    const filteredAppointments = allAppointments.filter((appt) => {
      if (!isAdmin || selectedCoordinator !== 'All') {
        const apptStuId = norm(appt.studentId);
        const apptStuName = norm(appt.student);
        return visibleStudentKeySet.has(apptStuId) || visibleStudentKeySet.has(apptStuName);
      }
      return true;
    });

    filteredAppointments.forEach((appt, index) => {
      const studentName = appt.student || 'Unknown Student';
      const studentId = appt.studentId || '';
      
      // ✅ Check if student already has an internship
      const existingForStudent = result.find(item => 
        item.studentId === studentId || 
        (item.student && item.student.toLowerCase() === studentName.toLowerCase())
      );
      
      if (existingForStudent) {
        // ✅ Update status based on appointment
        if (appt.status === 'Completed') {
          existingForStudent.status = 'Completed';
          existingForStudent.progress = 100;
        } else if (appt.status === 'Declined') {
          existingForStudent.status = 'Declined';
          existingForStudent.cancellationReason = appt.cancellationReason || 'Industry rejected the student';
          existingForStudent.cancellationType = appt.cancellationType || 'industry';
        } else if (appt.status === 'Withdrawn') {
          existingForStudent.status = 'Withdrawn';
          existingForStudent.cancellationReason = appt.cancellationReason || 'Student withdrew from placement';
          existingForStudent.cancellationType = appt.cancellationType || 'withdrawn';
        } else if (appt.status === 'Cancelled') {
          existingForStudent.status = 'Cancelled';
          existingForStudent.cancellationReason = appt.cancellationReason || 'Appointment was cancelled';
        } else if (appt.status === 'Scheduled') {
          existingForStudent.status = 'Waiting to Join';
        }
        
        // ✅ Update date if appointment date is newer
        if (appt.date && new Date(appt.date) > new Date(existingForStudent.start)) {
          existingForStudent.start = appt.date;
          const start = new Date(appt.date);
          const end = new Date(start);
          end.setDate(end.getDate() + (12 * 7));
          existingForStudent.end = end.toISOString().split('T')[0];
        }
        
        // ✅ Update company if changed
        if (appt.company && appt.company !== existingForStudent.company) {
          existingForStudent.company = appt.company;
        }
        
        return;
      }

      // ✅ Create new internship if no existing
      const startDate = appt.date || new Date().toISOString().split('T')[0];
      const duration = '12 weeks';
      
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (12 * 7));
      const endDate = end.toISOString().split('T')[0];

      let status = 'Waiting to Join';
      let cancellationReason = '';
      let cancellationType = '';
      
      if (appt.status === 'Completed') {
        status = 'Completed';
      } else if (appt.status === 'Scheduled') {
        status = 'Waiting to Join';
      } else if (appt.status === 'Declined') {
        status = 'Declined';
        cancellationReason = appt.cancellationReason || 'Industry rejected the student';
        cancellationType = appt.cancellationType || 'industry';
      } else if (appt.status === 'Withdrawn') {
        status = 'Withdrawn';
        cancellationReason = appt.cancellationReason || 'Student withdrew from placement';
        cancellationType = appt.cancellationType || 'withdrawn';
      } else if (appt.status === 'Cancelled') {
        status = 'Cancelled';
        cancellationReason = appt.cancellationReason || 'Appointment was cancelled';
      } else if (appt.status === 'No Show') {
        status = 'Declined';
        cancellationReason = 'Student did not show up for appointment';
        cancellationType = 'student';
      }

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
        end: endDate,
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
    try {
      const result = await updateInternshipRequest(wfId, requestId, requestData);
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
    try {
      console.log('📤 Creating appointment with data:', appointmentData);
      const result = await createAppointment(wfId, appointmentData);
      console.log('✅ Appointment created:', result);
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
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update appointment:', err);
      throw err;
    }
  }, [workflowId, workflow, refreshWorkflowData]);

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
        if (req.studentId) map[req.studentId] = priorityVal;
        if (req.student)   map[req.student]   = priorityVal;
        if (req.id)        map[req.id]         = priorityVal;
        if (req._id)       map[String(req._id)] = priorityVal;
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
        return (
          <WorkflowStep1Students
            students={mapStudentsForStep1()}
            initialSelectedStudentIds={getSelectedStudentIds()}
            onToggleStudent={handleToggleStudent}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
          />
        );
      case 2:
        return (
          <WorkflowStep2Requests
            requests={mapRequestsForStep2()}
            onBack={() => goToStep(1)}
            onNext={handleStep2Next}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            onAddContact={handleAddContactToRequest}
            students={mapStudentsForStep1()}
            activeStudent={activeWorkflowStudent}
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
            onNext={() => goToStep(5)}
            onCreateInternship={handleCreateInternship}
            onUpdateInternship={handleUpdateInternship}
            onDeleteInternship={handleDeleteInternship}
            onDeleteAppointment={handleDeleteAppointment}
            students={mapStudentsForStep1()}
          />
        );
      case 5:
        return (
          <WorkflowStep5PlacementHours
            students={mapStudentsForStep1()}
            onBack={() => goToStep(4)}
          />
        );
      default:
        return (
          <WorkflowStep1Students
            students={mapStudentsForStep1()}
            initialSelectedStudentIds={getSelectedStudentIds()}
            onToggleStudent={handleToggleStudent}
            onNext={handleStep1Next}
            internshipRequestMap={internshipRequestMap}
            onCreateAppointment={handleCreateAppointment}
            appointments={mapAppointmentsForStep3()}
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