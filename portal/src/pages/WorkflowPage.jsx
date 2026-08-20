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

export default function WorkflowPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const [activeStep, setActiveStep] = useState(
    stepParam >= 1 && stepParam <= 4 ? stepParam : 1
  );

  // Workflow state
  const [workflow, setWorkflow] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowStudents, setWorkflowStudents] = useState([]);

  // Load or create workflow on mount
  useEffect(() => {
    const loadOrCreateWorkflow = async () => {
      try {
        setLoading(true);
        // Try to fetch existing workflows
        const result = await fetchWorkflows();
        const workflows = result.data || [];

        if (workflows.length > 0) {
          // Use the most recent workflow
          const existing = workflows[0];
          setWorkflowId(existing.id || existing._id);
          setWorkflow(existing);
          setActiveStep(existing.currentStep || 1);
        } else {
          // Create a default workflow
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

        // Fetch all students for step 1
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
  }, []);

  // Sync activeStep when URL query param changes (sidebar links)
  useEffect(() => {
    if (stepParam >= 1 && stepParam <= 4) {
      setActiveStep(stepParam);
    }
  }, [stepParam]);

  // Update workflow step in backend when step changes
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

  // Map students from DB to the format expected by WorkflowStep1Students
  const mapStudentsForStep1 = useCallback(() => {
    if (!workflowStudents || workflowStudents.length === 0) return [];

    return workflowStudents.map((stu) => ({
      name: stu.name || `${stu.firstName} ${stu.lastName}`.trim(),
      email: stu.emailAddress || stu.email || '',
      id: stu.id || stu._id || '',
      studentId: stu.studentId || '',
      rto: stu.assignedRto || stu.rto || '',
      status: stu.status || 'Active',
      placementStatus: stu.placementStatus || 'Ready',
      addedOn: stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    }));
  }, [workflowStudents]);

  // Map requests from workflow to the format expected by WorkflowStep2Requests
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
      status: req.status || 'New',
      date: req.date || (req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''),
    }));
  }, [workflow]);

  // Map appointments from workflow to the format expected by WorkflowStep3Appointments
  const mapAppointmentsForStep3 = useCallback(() => {
    if (!workflow?.appointments || workflow.appointments.length === 0) return [];

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
      status: appt.status || 'Scheduled',
      notes: appt.notes || '',
    }));
  }, [workflow]);

  // Map internships from workflow to the format expected by WorkflowStep4Internships
  const mapInternshipsForStep4 = useCallback(() => {
    if (!workflow?.internships || workflow.internships.length === 0) return [];

    return workflow.internships.map((int) => ({
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
    }));
  }, [workflow]);

  // Handlers for step 2 (requests)
  const handleCreateRequest = useCallback(async (requestData) => {
    if (!workflowId) return;
    try {
      const result = await createInternshipRequest(workflowId, requestData);
      // Refresh workflow data
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to create request:', err);
      throw err;
    }
  }, [workflowId]);

  const handleUpdateRequest = useCallback(async (requestId, requestData) => {
    if (!workflowId) return;
    try {
      const result = await updateInternshipRequest(workflowId, requestId, requestData);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to update request:', err);
      throw err;
    }
  }, [workflowId]);

  const handleDeleteRequest = useCallback(async (requestId) => {
    if (!workflowId) return;
    try {
      await deleteInternshipRequest(workflowId, requestId);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
    } catch (err) {
      console.error('Failed to delete request:', err);
      throw err;
    }
  }, [workflowId]);

  // Handlers for step 3 (appointments)
  const handleCreateAppointment = useCallback(async (appointmentData) => {
    if (!workflowId) return;
    try {
      const result = await createAppointment(workflowId, appointmentData);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to create appointment:', err);
      throw err;
    }
  }, [workflowId]);

  const handleUpdateAppointment = useCallback(async (appointmentId, appointmentData) => {
    if (!workflowId) return;
    try {
      const result = await updateAppointment(workflowId, appointmentId, appointmentData);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to update appointment:', err);
      throw err;
    }
  }, [workflowId]);

  const handleDeleteAppointment = useCallback(async (appointmentId) => {
    if (!workflowId) return;
    try {
      await deleteAppointment(workflowId, appointmentId);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      throw err;
    }
  }, [workflowId]);

  // Handlers for step 4 (internships)
  const handleCreateInternship = useCallback(async (internshipData) => {
    if (!workflowId) return;
    try {
      const result = await createInternship(workflowId, internshipData);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to create internship:', err);
      throw err;
    }
  }, [workflowId]);

  const handleUpdateInternship = useCallback(async (internshipId, internshipData) => {
    if (!workflowId) return;
    try {
      const result = await updateInternship(workflowId, internshipId, internshipData);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
      return result.data;
    } catch (err) {
      console.error('Failed to update internship:', err);
      throw err;
    }
  }, [workflowId]);

  const handleDeleteInternship = useCallback(async (internshipId) => {
    if (!workflowId) return;
    try {
      await deleteInternship(workflowId, internshipId);
      const updated = await fetchWorkflowById(workflowId);
      setWorkflow(updated.data);
    } catch (err) {
      console.error('Failed to delete internship:', err);
      throw err;
    }
  }, [workflowId]);

  const handleToggleStudent = useCallback(async (studentId, isSelected) => {
    if (!workflowId) return;
    try {
      if (isSelected) {
        const result = await addStudentsToWorkflow(workflowId, [studentId]);
        if (result.data) {
          setWorkflow(result.data);
        }
      } else {
        const result = await removeStudentFromWorkflow(workflowId, studentId);
        if (result.data) {
          setWorkflow(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to toggle student in workflow:', err);
    }
  }, [workflowId]);

  const getSelectedStudentIds = useCallback(() => {
    if (!workflow?.students) return [];
    return workflow.students.map(s => s.id || s._id || s.toString());
  }, [workflow]);

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
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <WorkflowStep2Requests
            requests={mapRequestsForStep2()}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            onCreateRequest={handleCreateRequest}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
            students={mapStudentsForStep1()}
          />
        );
      case 3:
        return (
          <WorkflowStep3Appointments
            appointments={mapAppointmentsForStep3()}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
            onCreateAppointment={handleCreateAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            students={mapStudentsForStep1()}
            requests={mapRequestsForStep2()}
          />
        );
      case 4:
        return (
          <WorkflowStep4Internships
            internships={mapInternshipsForStep4()}
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
            onNext={() => goToStep(2)}
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