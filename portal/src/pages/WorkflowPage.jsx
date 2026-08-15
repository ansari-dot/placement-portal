// src/pages/WorkflowPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkFlowLayout from '../components/layout/WorkFlowLayout';
import WorkflowStep1Students from '../components/workflow/WorkflowStep1Students';
import WorkflowStep2Requests from '../components/workflow/WorkflowStep2Requests';
import WorkflowStep3Appointments from '../components/workflow/WorkflowStep3Appointments';
import WorkflowStep4Internships from '../components/workflow/WorkflowStep4Internships';

const STEP_LABELS = ['Students', 'Internship Requests', 'Appointments', 'Internships'];

export default function WorkflowPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const [activeStep, setActiveStep] = useState(
    stepParam >= 1 && stepParam <= 4 ? stepParam : 1
  );

  // Shared workflow data — flows from Step 1 → 2 → 3 → 4
  const [workflowData, setWorkflowData] = useState({
    students: [
      { name: 'John Smith', email: 'john.smith@email.com', id: 'STU-0002453', rto: 'AI Global Institute', status: 'Active', placementStatus: 'Ready', addedOn: '19 May 2025' },
      { name: 'Priya Sharma', email: 'priya.sharma@email.com', id: 'STU-0002452', rto: 'Melbourne City College', status: 'Active', placementStatus: 'Pending Info', addedOn: '18 May 2025' },
      { name: 'Liam Johnson', email: 'liam.j@email.com', id: 'STU-0002451', rto: 'AI Global Institute', status: 'Active', placementStatus: 'In Process', addedOn: '18 May 2025' },
      { name: 'Aisha Khan', email: 'aisha.khan@email.com', id: 'STU-0002450', rto: 'Deakin College', status: 'Inactive', placementStatus: 'Not Started', addedOn: '17 May 2025' },
      { name: 'David Brown', email: 'david.brown@email.com', id: 'STU-0002449', rto: 'Victoria University', status: 'Active', placementStatus: 'Ready', addedOn: '16 May 2025' },
    ],
    requests: [
      { reqId: 'REQ-000122', title: 'Software Developer Intern', student: 'John Smith', company: 'TechSolutions Pty Ltd', rto: 'AI Global Institute', status: 'New', date: '19 May 2025' },
      { reqId: 'REQ-000121', title: 'Data Analyst Intern', student: 'Priya Sharma', company: 'DataInsights', rto: 'Melbourne City College', status: 'Coordinator Review', date: '19 May 2025' },
      { reqId: 'REQ-000120', title: 'UI/UX Design Intern', student: 'Liam Johnson', company: 'Pixel Perfect', rto: 'AI Global Institute', status: 'RTO Review', date: '18 May 2025' },
      { reqId: 'REQ-000119', title: 'Marketing Intern', student: 'Aisha Khan', company: 'BrandBoost', rto: 'Deakin College', status: 'Appointment', date: '18 May 2025' },
    ],
    appointments: [
      { student: 'John Smith', date: 'Mon 19 May', time: '09:00 - 09:45 AM', status: 'Scheduled' },
      { student: 'Aisha Khan', date: 'Wed 21 May', time: '11:00 - 11:45 AM', status: 'Scheduled' },
    ],
    internships: [
      { intId: 'INT-000987', title: 'Software Developer Intern', student: 'John Smith', company: 'TechSolutions Pty Ltd', status: 'Active', start: '20 May 2025', progress: 45 },
      { intId: 'INT-000986', title: 'Data Analyst Intern', student: 'Priya Sharma', company: 'DataInsights', status: 'Joined', start: '19 May 2025', progress: 20 },
      { intId: 'INT-000985', title: 'UI/UX Design Intern', student: 'Liam Johnson', company: 'Pixel Perfect', status: 'Waiting to Join', start: '01 Jun 2025', progress: 0 },
      { intId: 'INT-000984', title: 'Marketing Intern', student: 'Aisha Khan', company: 'BrandBoost', status: 'Active', start: '18 May 2025', progress: 30 },
    ],
  });

  // Sync activeStep when URL query param changes (sidebar links)
  useEffect(() => {
    if (stepParam >= 1 && stepParam <= 4) {
      setActiveStep(stepParam);
    }
  }, [stepParam]);

  const goToStep = (step) => {
    setActiveStep(step);
    setSearchParams({ step: String(step) });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <WorkflowStep1Students
            students={workflowData.students}
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <WorkflowStep2Requests
            requests={workflowData.requests}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        );
      case 3:
        return (
          <WorkflowStep3Appointments
            appointments={workflowData.appointments}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
          />
        );
      case 4:
        return (
          <WorkflowStep4Internships
            internships={workflowData.internships}
            onBack={() => goToStep(3)}
          />
        );
      default:
        return <WorkflowStep1Students students={workflowData.students} onNext={() => goToStep(2)} />;
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