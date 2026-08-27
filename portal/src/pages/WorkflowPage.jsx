// src/pages/WorkflowPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkFlowLayout from '../components/layout/WorkFlowLayout';
import WorkflowStep1Students from '../components/workflow/WorkflowStep1Students';
import WorkflowStep2Requests from '../components/workflow/WorkflowStep2Requests';
import WorkflowStep3Appointments from '../components/workflow/WorkflowStep3Appointments';
import WorkflowStep4Internships from '../components/workflow/WorkflowStep4Internships';
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

const STEP_LABELS = ['Students', 'Internship Requests', 'Appointments', 'Internships'];

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
    stepParam >= 1 && stepParam <= 4 ? stepParam : 1
  );

  const [workflow, setWorkflow] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStudents, setWorkflowStudents] = useState([]);

  const [activeWorkflowStudent, setActiveWorkflowStudent] = useState(null);
  const [activeWorkflowRequest, setActiveWorkflowRequest] = useState(null);
  const [activeWorkflowCompany, setActiveWorkflowCompany] = useState(null);

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
          if (stepFromUrl >= 1 && stepFromUrl <= 4) {
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

  const handleStep2Next = useCallback((request, company) => {
    if (request) setActiveWorkflowRequest(request);
    if (company) setActiveWorkflowCompany(company);
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
    if (!workflowStudents || workflowStudents.length === 0) return [];

    return workflowStudents.map((stu) => {
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
        addedOn: stu.createdAt
          ? new Date(stu.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        contactedIndustries: matchingRequests.flatMap((r) => r.contactedIndustries || []),
      };
    });
  }, [workflowStudents, findRequestsForStudent]);

  const mapRequestsForStep2 = useCallback(() => {
    if (!workflow?.requests || workflow.requests.length === 0) return [];

    return workflow.requests.map((req) => ({
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
  }, [workflow]);

  const mapAppointmentsForStep3 = useCallback(() => {
    console.log('📋 Mapping appointments from workflow:', workflow?.appointments);
    if (!workflow?.appointments || workflow.appointments.length === 0) {
      console.log('⚠️ No appointments found in workflow');
      return [];
    }

    return workflow.appointments.map((appt) => ({
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
      // ✅ CRITICAL: Ensure cancellation fields are mapped
      cancellationReason: appt.cancellationReason || '',
      cancellationType: appt.cancellationType || '',
      cancelledAt: appt.cancelledAt || '',
    }));
  }, [workflow]);

  const mapInternshipsForStep4 = useCallback(() => {
    const result = [];
    
    // Add existing internships
    if (workflow?.internships && workflow.internships.length > 0) {
      workflow.internships.forEach((int) => {
        const intDbId = norm(int.studentId);
        const intName = norm(int.student);

        const matchingRequests = (workflow?.requests || []).filter((r) => {
          const reqStudentId = norm(r.studentId);
          const reqStudentName = norm(r.student);
          return (
            (reqStudentId && intDbId && reqStudentId === intDbId) ||
            (reqStudentName && intName && reqStudentName === intName)
          );
        });

        result.push({
          id: int.id || int._id || '',
          intId: int.intId || '',
          title: int.title || '',
          student: int.student || '',
          studentId: int.studentId || '',
          company: int.company || '',
          rto: int.rto || '',
          status: int.status || 'Active',
          start: int.start || '',
          end: int.end || '',
          duration: int.duration || '',
          workType: int.workType || '',
          location: int.location || '',
          coordinator: int.coordinator || '',
          progress: int.progress || 0,
          tasksCompleted: int.tasksCompleted || '',
          trainingCompleted: int.trainingCompleted || '',
          reviewsCompleted: int.reviewsCompleted || '',
          cancellationReason: int.cancellationReason || '',
          cancellationType: int.cancellationType || '',
          contactedIndustries: matchingRequests.flatMap((r) => 
            (r.contactedIndustries || []).map(ind => ({
              ...ind,
              appointmentDate: ind.appointmentDate || '',
              appointmentTime: ind.appointmentTime || '',
            }))
          ),
        });
      });
    }

    // Process successful appointments (Scheduled or Completed)
    const successfulAppointments = (workflow?.appointments || []).filter(appt => 
      appt.status === 'Scheduled' || appt.status === 'Completed'
    );

    const existingStudentIds = new Set(result.map(i => i.studentId));

    successfulAppointments.forEach(appt => {
      if (existingStudentIds.has(appt.studentId)) return;

      const startDate = appt.date || new Date().toISOString().split('T')[0];
      const duration = '12 weeks';
      
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (12 * 7));
      const endDate = end.toISOString().split('T')[0];

      result.push({
        id: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        intId: `INT-${String(result.length + 1).padStart(6, '0')}`,
        student: appt.student || 'Unknown Student',
        studentId: appt.studentId || '',
        company: appt.company || 'Unknown Company',
        title: appt.position || 'Internship Placement',
        rto: appt.rto || 'TBD',
        status: 'Waiting to Join',
        start: startDate,
        end: endDate,
        duration: duration,
        workType: appt.meetingType || 'In-Person',
        location: appt.location || 'TBD',
        coordinator: appt.interviewer || '',
        progress: 0,
        tasksCompleted: '0',
        trainingCompleted: '0',
        reviewsCompleted: '0',
        cancellationReason: '',
        cancellationType: '',
        contactedIndustries: [],
        _appointmentId: appt.id || appt._id,
        _appointmentDate: appt.date,
        _appointmentTime: appt.time,
        _appointmentStatus: appt.status,
      });

      existingStudentIds.add(appt.studentId);
    });

    console.log('📋 Mapped internships:', result);
    return result;
  }, [workflow]);

  // ─── Request handlers ──────────────────────────────────────────────────────

  const handleCreateRequest = useCallback(async (requestData) => {
    if (!workflowId) return;
    try {
      const result = await createInternshipRequest(workflowId, requestData);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to create request:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleUpdateRequest = useCallback(async (requestId, requestData) => {
    if (!workflowId) return;
    try {
      const result = await updateInternshipRequest(workflowId, requestId, requestData);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update request:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleDeleteRequest = useCallback(async (requestId) => {
    if (!workflowId) return;
    try {
      await deleteInternshipRequest(workflowId, requestId);
      await refreshWorkflowData();
    } catch (err) {
      console.error('Failed to delete request:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleCreateAppointment = useCallback(async (appointmentData) => {
    if (!workflowId) return;
    try {
      console.log('📤 Creating appointment with data:', appointmentData);
      const result = await createAppointment(workflowId, appointmentData);
      console.log('✅ Appointment created:', result);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to create appointment:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleUpdateAppointment = useCallback(async (appointmentId, appointmentData) => {
    if (!workflowId) return;
    try {
      console.log('📤 Updating appointment:', appointmentId, appointmentData);
      const result = await updateAppointment(workflowId, appointmentId, appointmentData);
      console.log('✅ Appointment updated:', result);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update appointment:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleDeleteAppointment = useCallback(async (appointmentId) => {
    if (!workflowId) return;
    try {
      await deleteAppointment(workflowId, appointmentId);
      await refreshWorkflowData();
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleCreateInternship = useCallback(async (internshipData) => {
    if (!workflowId) return;
    try {
      const result = await createInternship(workflowId, internshipData);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to create internship:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleUpdateInternship = useCallback(async (internshipId, internshipData) => {
    if (!workflowId) return;
    try {
      const result = await updateInternship(workflowId, internshipId, internshipData);
      await refreshWorkflowData();
      return result.data;
    } catch (err) {
      console.error('Failed to update internship:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

  const handleDeleteInternship = useCallback(async (internshipId) => {
    if (!workflowId) return;
    try {
      await deleteInternship(workflowId, internshipId);
      await refreshWorkflowData();
    } catch (err) {
      console.error('Failed to delete internship:', err);
      throw err;
    }
  }, [workflowId, refreshWorkflowData]);

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
            students={mapStudentsForStep1()}
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
      {renderStepContent()}
    </WorkFlowLayout>
  );
}