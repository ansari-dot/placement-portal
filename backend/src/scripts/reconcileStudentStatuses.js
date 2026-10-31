import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StudentModel from '../modules/student/student.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import {
  STUDENT_LIFECYCLE_STATUSES,
  calculateLifecycleStatus,
  updateStudentLifecycleStatus,
  STATUS_CONFIG,
} from '../modules/student/studentStatus.service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mantisplacements';

const reconcileStudentStatuses = async () => {
  console.log('Starting student status reconciliation...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Fetch all students
    const students = await StudentModel.find({});
    console.log(`Found ${students.length} students to reconcile\n`);
    
    // Fetch all workflow data once
    const workflows = await WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean();
    const allRequests = workflows.flatMap(wf => wf.requests || []);
    const allAppointments = workflows.flatMap(wf => wf.appointments || []);
    const allInternships = workflows.flatMap(wf => wf.internships || []);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    const issues = [];
    
    for (const student of students) {
      const currentStatus = student.placementStatus;
      const currentLifecycleStatus = student.lifecycleStatus || 'Not Set';
      
      // Calculate correct lifecycle status
      const correctLifecycleStatus = calculateLifecycleStatus(student, {
        requests: allRequests,
        appointments: allAppointments,
        internships: allInternships,
      });
      
      // Calculate correct placement status for backward compatibility
      const correctPlacementStatus = (() => {
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED) return 'Placement Completed';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS) return 'Placement Started';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL) return 'Appointment Successful';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED) return 'Appointment Scheduled';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN) return 'Student Withdraw';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.STUDENT_REJECTED) return 'Industry Rejected';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED) return 'Student Missed Appointment';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL) return 'Not Suitable Site';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING) return 'In Progress';
        if (correctLifecycleStatus === STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW) return 'In Progress';
        return 'Awaiting';
      })();
      
      let needsUpdate = false;
      const updates = {};
      
      if (student.lifecycleStatus !== correctLifecycleStatus) {
        updates.lifecycleStatus = correctLifecycleStatus;
        needsUpdate = true;
      }
      
      if (student.placementStatus !== correctPlacementStatus) {
        updates.placementStatus = correctPlacementStatus;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          // Update lifecycle status with history
          await updateStudentLifecycleStatus(
            student._id,
            correctLifecycleStatus,
            {
              reason: 'Migration: Automated reconciliation of inconsistent statuses',
              triggeredBy: 'migration_script',
              triggeringEvent: 'lifecycle_status_reconciliation',
            }
          );
          
          // Update placementStatus for backward compatibility
          await StudentModel.findByIdAndUpdate(student._id, {
            $set: {
              placementStatus: correctPlacementStatus,
            },
          });
          
          updatedCount++;
          console.log(`✓ Updated: ${student.studentId} (${student.name})`);
          console.log(`  From: lifecycle="${currentLifecycleStatus}", placement="${currentStatus}"`);
          console.log(`  To:   lifecycle="${correctLifecycleStatus}", placement="${correctPlacementStatus}"\n`);
          
        } catch (err) {
          issues.push({
            studentId: student.studentId,
            studentName: student.name,
            currentLifecycleStatus,
            correctLifecycleStatus,
            currentPlacementStatus: currentStatus,
            correctPlacementStatus,
            error: err.message,
          });
          console.error(`✗ Failed to update ${student.studentId}:`, err.message);
        }
      } else {
        unchangedCount++;
      }
    }
    
    // Summary
    console.log('\n========================================');
    console.log('RECONCILIATION SUMMARY');
    console.log('========================================');
    console.log(`Total students: ${students.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Unchanged: ${unchangedCount}`);
    console.log(`Issues: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n--- ISSUES ---');
      issues.forEach(issue => {
        console.log(`\nStudent: ${issue.studentId} (${issue.studentName})`);
        console.log(`  Current lifecycle: ${issue.currentLifecycleStatus}`);
        console.log(`  Correct lifecycle: ${issue.correctLifecycleStatus}`);
        console.log(`  Current placement: ${issue.currentPlacementStatus}`);
        console.log(`  Correct placement: ${issue.correctPlacementStatus}`);
        console.log(`  Error: ${issue.error}`);
      });
    }
    
    console.log('\n========================================');
    console.log('Status Distribution After Reconciliation');
    console.log('========================================');
    
    const statusCounts = {};
    for (const status of Object.values(STUDENT_LIFECYCLE_STATUSES)) {
      statusCounts[status] = 0;
    }
    
    const updatedStudents = await StudentModel.find({}, { lifecycleStatus: 1 });
    updatedStudents.forEach(s => {
      const status = s.lifecycleStatus || 'Not Set';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG[STUDENT_LIFECYCLE_STATUSES.REGISTERED];
        console.log(`${config.label}: ${count}`);
      }
    });
    
    console.log('\nReconciliation complete!');
    
  } catch (err) {
    console.error('Reconciliation failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

reconcileStudentStatuses();
